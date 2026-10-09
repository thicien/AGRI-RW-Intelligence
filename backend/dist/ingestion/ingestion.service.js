"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const { PDFParse } = require('pdf-parse');
const crop_entity_1 = require("../crops/entities/crop.entity");
const season_entity_1 = require("../seasons/entities/season.entity");
const farm_crop_entity_1 = require("../agricultural-data/entities/farm-crop.entity");
const farm_entity_1 = require("../agricultural-data/entities/farm.entity");
const village_entity_1 = require("../administrative-units/entities/village.entity");
const agricultural_observation_entity_1 = require("../agricultural-data/entities/agricultural-observation.entity");
let IngestionService = IngestionService_1 = class IngestionService {
    cropRepository;
    seasonRepository;
    farmCropRepository;
    farmRepository;
    villageRepository;
    observationRepository;
    logger = new common_1.Logger(IngestionService_1.name);
    dataDir = path.resolve(__dirname, '../../../data/agriculture');
    constructor(cropRepository, seasonRepository, farmCropRepository, farmRepository, villageRepository, observationRepository) {
        this.cropRepository = cropRepository;
        this.seasonRepository = seasonRepository;
        this.farmCropRepository = farmCropRepository;
        this.farmRepository = farmRepository;
        this.villageRepository = villageRepository;
        this.observationRepository = observationRepository;
    }
    async onModuleInit() {
        this.logger.log('Backend startup detected: Commencing background data ingestion...');
        this.runAgriculturalIngestion().catch(err => {
            this.logger.error(`Automated ingestion failed: ${err.message}`);
        });
    }
    async runAgriculturalIngestion() {
        this.logger.log(`Scanning agricultural datasets from: ${this.dataDir}`);
        if (!fs.existsSync(this.dataDir)) {
            this.logger.error(`Data directory not found: ${this.dataDir}`);
            return { success: false, message: 'Data directory not found' };
        }
        const dataFiles = this.findDataFiles(this.dataDir);
        this.logger.log(`Found ${dataFiles.length} files (Excel & PDF) to process.`);
        let totalRowsProcessed = 0;
        let totalPdfPages = 0;
        for (const file of dataFiles) {
            try {
                if (file.endsWith('.pdf')) {
                    const pages = await this.parsePdfFile(file);
                    totalPdfPages += pages;
                }
                else {
                    const rows = await this.parseExcelFile(file);
                    totalRowsProcessed += rows;
                }
            }
            catch (error) {
                this.logger.error(`Failed to process ${file}: ${error.message}`);
            }
        }
        this.logger.log(`Ingestion complete. Processed ${totalRowsProcessed} Excel rows and ${totalPdfPages} PDF pages.`);
        return { success: true, filesProcessed: dataFiles.length, rowsProcessed: totalRowsProcessed, pdfPages: totalPdfPages };
    }
    findDataFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.findDataFiles(filePath, fileList);
            }
            else if (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.pdf')) {
                fileList.push(filePath);
            }
        }
        return fileList;
    }
    async parsePdfFile(filePath) {
        this.logger.log(`Parsing PDF file: ${path.basename(filePath)}`);
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: dataBuffer });
            const result = await parser.getText();
            const text = result.text;
            await parser.destroy();
            return result.pages?.length || 1;
        }
        catch (error) {
            this.logger.warn(`Could not parse PDF ${path.basename(filePath)}: ${error.message}`);
            return 0;
        }
    }
    async parseExcelFile(filePath) {
        this.logger.log(`Parsing Excel file: ${path.basename(filePath)}`);
        let xlsx;
        try {
            xlsx = require('xlsx');
        }
        catch (e) {
            this.logger.warn(`xlsx library not available yet. Skipping ${path.basename(filePath)}`);
            return 0;
        }
        const workbook = xlsx.readFile(filePath);
        let rowsProcessed = 0;
        const fileName = path.basename(filePath);
        let yearMatch = fileName.match(/201[4-9]|202[0-6]/);
        let seasonMatch = fileName.match(/Season A|Season B|Annual|A_|B_/i);
        const year = yearMatch ? yearMatch[0] : 'Unknown Year';
        let seasonType = 'Annual';
        if (seasonMatch) {
            if (seasonMatch[0].toLowerCase().includes('a'))
                seasonType = 'Season A';
            if (seasonMatch[0].toLowerCase().includes('b'))
                seasonType = 'Season B';
        }
        const seasonName = `${year} ${seasonType}`;
        const season = await this.getOrCreateSeason(seasonName);
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
            for (const row of data) {
                if (!row)
                    continue;
                const location = row['District'] || row['Province/District'] || row['Area'];
                if (!location)
                    continue;
                const totalFarmers = row['Number of Farmers'] || row['Total Farmers'] || 0;
                const cultivatedArea = row['Cultivated Area (ha)'] || row['Total Area (ha)'] || 0;
                if (location && (totalFarmers > 0 || cultivatedArea > 0)) {
                }
                const knownCrops = ['Maize', 'Beans', 'Cassava', 'Irish Potatoes', 'Sweet Potatoes', 'Rice', 'Wheat', 'Soybeans'];
                for (const cropName of knownCrops) {
                    const productionCol = Object.keys(row).find(key => key.includes(cropName) && key.includes('Production'));
                    const yieldCol = Object.keys(row).find(key => key.includes(cropName) && key.includes('Yield'));
                    if (productionCol || yieldCol || (totalFarmers > 0 || cultivatedArea > 0)) {
                        const production = productionCol ? row[productionCol] : 0;
                        const cropYield = yieldCol ? row[yieldCol] : 0;
                        if (production > 0 || cropYield > 0 || cultivatedArea > 0 || totalFarmers > 0) {
                            const cropEntity = await this.getOrCreateCrop(cropName);
                            const observation = this.observationRepository.create({
                                year: parseInt(year, 10),
                                season: season,
                                geography: location,
                                crop: cropEntity,
                                cultivated_area_ha: cultivatedArea > 0 ? cultivatedArea : null,
                                production_mt: production > 0 ? production : null,
                                yield_mt_ha: cropYield > 0 ? cropYield : null,
                                farmer_count: totalFarmers > 0 ? totalFarmers : null,
                                source_file: path.basename(filePath)
                            });
                            await this.observationRepository.save(observation);
                            this.logger.debug(`Saved Observation: ${location} | ${cropName} | Area: ${cultivatedArea} | Yield: ${cropYield}`);
                        }
                    }
                }
                rowsProcessed++;
            }
        }
        return rowsProcessed;
    }
    async getOrCreateCrop(cropName) {
        let crop = await this.cropRepository.findOne({ where: { name: cropName } });
        if (!crop) {
            crop = this.cropRepository.create({ name: cropName });
            await this.cropRepository.save(crop);
        }
        return crop;
    }
    async getOrCreateSeason(seasonName) {
        let season = await this.seasonRepository.findOne({ where: { name: seasonName } });
        if (!season) {
            season = this.seasonRepository.create({ name: seasonName });
            await this.seasonRepository.save(season);
        }
        return season;
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = IngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(crop_entity_1.Crop)),
    __param(1, (0, typeorm_1.InjectRepository)(season_entity_1.Season)),
    __param(2, (0, typeorm_1.InjectRepository)(farm_crop_entity_1.FarmCrop)),
    __param(3, (0, typeorm_1.InjectRepository)(farm_entity_1.Farm)),
    __param(4, (0, typeorm_1.InjectRepository)(village_entity_1.Village)),
    __param(5, (0, typeorm_1.InjectRepository)(agricultural_observation_entity_1.AgriculturalObservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map