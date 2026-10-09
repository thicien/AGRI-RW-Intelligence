"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AgriculturalDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgriculturalDataService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const agricultural_observation_entity_1 = require("./entities/agricultural-observation.entity");
const crop_entity_1 = require("../crops/entities/crop.entity");
const season_entity_1 = require("../seasons/entities/season.entity");
let AgriculturalDataService = AgriculturalDataService_1 = class AgriculturalDataService {
    observationRepository;
    cropRepository;
    seasonRepository;
    logger = new common_1.Logger(AgriculturalDataService_1.name);
    constructor(observationRepository, cropRepository, seasonRepository) {
        this.observationRepository = observationRepository;
        this.cropRepository = cropRepository;
        this.seasonRepository = seasonRepository;
    }
    async reseed() {
        this.logger.warn('MANUAL RESEED TRIGGERED: Truncating tables...');
        await this.observationRepository.query('TRUNCATE TABLE agricultural_observations CASCADE');
        await this.cropRepository.query('TRUNCATE TABLE crops CASCADE');
        await this.onModuleInit();
    }
    async onModuleInit() {
        const count = await this.observationRepository.count();
        if (count === 0) {
            this.logger.log('Seeding Agricultural Observations database with ALL crops...');
            const cropsToCreate = [
                { name: 'Maize', category: 'Cereals' },
                { name: 'Sorghum', category: 'Cereals' },
                { name: 'Paddy rice', category: 'Cereals' },
                { name: 'Wheat', category: 'Cereals' },
                { name: 'Other cereals', category: 'Cereals' },
                { name: 'Cassava', category: 'Roots & Tubers' },
                { name: 'Sweet potato', category: 'Roots & Tubers' },
                { name: 'Irish potato', category: 'Roots & Tubers' },
                { name: 'Yams & Taro', category: 'Roots & Tubers' },
                { name: 'Banana', category: 'Bananas' },
                { name: 'Cooking banana', category: 'Bananas' },
                { name: 'Dessert banana', category: 'Bananas' },
                { name: 'Banana for beer', category: 'Bananas' },
                { name: 'Beans', category: 'Legumes' },
                { name: 'Bush bean', category: 'Legumes' },
                { name: 'Climbing bean', category: 'Legumes' },
                { name: 'Pea', category: 'Legumes' },
                { name: 'Groundnut', category: 'Legumes' },
                { name: 'Soybean', category: 'Legumes' },
                { name: 'Vegetables', category: 'Vegetables' },
                { name: 'Fruits', category: 'Fruits' },
                { name: 'Fodder Crops', category: 'Other' },
                { name: 'Other crops', category: 'Other' }
            ];
            const cropEntities = cropsToCreate.map(c => this.cropRepository.create(c));
            await this.cropRepository.save(cropEntities);
            if (await this.seasonRepository.count() === 0) {
                const season1 = this.seasonRepository.create({ name: 'Season A' });
                const season2 = this.seasonRepository.create({ name: 'Season B' });
                await this.seasonRepository.save([season1, season2]);
            }
            const allCrops = await this.cropRepository.find();
            const allSeasons = await this.seasonRepository.find();
            const seasonAId = allSeasons.find(s => s.name === 'Season A')?.id?.toString() || '1';
            const seasonBId = allSeasons.find(s => s.name === 'Season B')?.id?.toString() || '2';
            const mockData = [];
            const years = [2022, 2023, 2024, 2025, 2026];
            const seasons = ['A', 'B'];
            const districts = [
                'Nyarugenge', 'Gasabo', 'Kicukiro',
                'Nyanza', 'Gisagara', 'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga', 'Kamonyi',
                'Karongi', 'Rutsiro', 'Rubavu', 'Nyabihu', 'Ngororero', 'Rusizi', 'Nyamasheke',
                'Rulindo', 'Gakenke', 'Musanze', 'Burera', 'Gicumbi',
                'Rwamagana', 'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera'
            ];
            for (const year of years) {
                for (const season of seasons) {
                    for (const district of districts) {
                        for (const crop of allCrops) {
                            let baseArea = 5000;
                            let baseProd = 8000;
                            let baseYield = 1.5;
                            if (crop.name === 'Maize') {
                                baseArea = 25000;
                                baseProd = 45000;
                                baseYield = 1.8;
                            }
                            else if (crop.name.includes('bean') || crop.name === 'Beans') {
                                baseArea = 18000;
                                baseProd = 14000;
                                baseYield = 0.7;
                            }
                            else if (crop.name === 'Cassava') {
                                baseArea = 12000;
                                baseProd = 150000;
                                baseYield = 12.5;
                            }
                            else if (crop.name.includes('potato')) {
                                baseArea = 8000;
                                baseProd = 60000;
                                baseYield = 7.5;
                            }
                            else if (crop.name.includes('rice')) {
                                baseArea = 4000;
                                baseProd = 16000;
                                baseYield = 4.0;
                            }
                            else if (crop.name === 'Wheat') {
                                baseArea = 2000;
                                baseProd = 5000;
                                baseYield = 2.5;
                            }
                            else if (crop.name.includes('banana') || crop.name === 'Banana') {
                                baseArea = 15000;
                                baseProd = 80000;
                                baseYield = 5.3;
                            }
                            else {
                                baseArea = 1000;
                                baseProd = 1500;
                                baseYield = 1.5;
                            }
                            mockData.push(this.observationRepository.create({
                                year,
                                season_id: season === 'A' ? seasonAId : seasonBId,
                                geography: district,
                                crop_id: crop.id.toString(),
                                cultivated_area_ha: Math.floor(baseArea + Math.random() * (baseArea * 0.2)),
                                production_mt: Math.floor(baseProd + Math.random() * (baseProd * 0.2)),
                                yield_mt_ha: baseYield + Math.random() * (baseYield * 0.1),
                                farmer_count: Math.floor((baseArea * 0.8) + Math.random() * 1000),
                                source_file: `SAS_${year}_Season_${season}.xlsx`
                            }));
                        }
                    }
                }
            }
            for (let i = 0; i < mockData.length; i += 50) {
                await this.observationRepository.save(mockData.slice(i, i + 50));
            }
            this.logger.log('Successfully seeded observations.');
        }
    }
    async getObservations(limit = 50, skip = 0) {
        const [data, total] = await this.observationRepository.findAndCount({
            relations: {
                crop: true,
                season: true
            },
            order: { year: 'DESC' },
            take: limit,
            skip: skip,
        });
        return {
            data,
            total,
            limit,
            skip,
        };
    }
    async getKpis() {
        const { sum_area } = await this.observationRepository
            .createQueryBuilder('obs')
            .select('SUM(obs.cultivated_area_ha)', 'sum_area')
            .getRawOne();
        const { sum_prod } = await this.observationRepository
            .createQueryBuilder('obs')
            .select('SUM(obs.production_mt)', 'sum_prod')
            .getRawOne();
        const { count_crops } = await this.observationRepository
            .createQueryBuilder('obs')
            .select('COUNT(DISTINCT obs.crop_id)', 'count_crops')
            .getRawOne();
        return {
            cultivatedArea: parseFloat(sum_area || '0'),
            totalProduction: parseFloat(sum_prod || '0'),
            cropsCovered: parseInt(count_crops || '0', 10),
            avgYield: (parseFloat(sum_prod || '0') / (parseFloat(sum_area || '1'))) || 0,
            harvestedArea: parseFloat(sum_area || '0') * 0.95,
            seasonsCovered: 2,
        };
    }
    async getTrends(cropId, seasonId) {
        const query = this.observationRepository.createQueryBuilder('obs')
            .select('obs.year', 'year')
            .addSelect('SUM(obs.production_mt)', 'production')
            .addSelect('SUM(obs.cultivated_area_ha)', 'area')
            .addSelect('AVG(obs.yield_mt_ha)', 'yield')
            .groupBy('obs.year')
            .orderBy('obs.year', 'ASC');
        if (cropId)
            query.andWhere('obs.crop_id = :cropId', { cropId });
        if (seasonId)
            query.andWhere('obs.season_id = :seasonId', { seasonId });
        const raw = await query.getRawMany();
        return raw.map(row => ({
            year: row.year,
            production: parseFloat(row.production || '0'),
            area: parseFloat(row.area || '0'),
            yield: parseFloat(row.yield || '0')
        }));
    }
    async getSeasonComparison(cropId) {
        const query = this.observationRepository.createQueryBuilder('obs')
            .select('season.name', 'season')
            .addSelect('SUM(obs.production_mt)', 'production')
            .addSelect('SUM(obs.cultivated_area_ha)', 'area')
            .addSelect('AVG(obs.yield_mt_ha)', 'yield')
            .innerJoin('obs.season', 'season')
            .groupBy('season.id, season.name');
        if (cropId)
            query.where('obs.crop_id = :cropId', { cropId });
        const raw = await query.getRawMany();
        return raw.map(row => ({
            season: row.season,
            production: parseFloat(row.production || '0'),
            area: parseFloat(row.area || '0'),
            yield: parseFloat(row.yield || '0')
        }));
    }
    async getGeographicStats(cropId) {
        const query = this.observationRepository.createQueryBuilder('obs')
            .select('obs.geography', 'geography')
            .addSelect('SUM(obs.production_mt)', 'production')
            .addSelect('SUM(obs.cultivated_area_ha)', 'area')
            .addSelect('AVG(obs.yield_mt_ha)', 'yield')
            .groupBy('obs.geography')
            .orderBy('production', 'DESC');
        if (cropId)
            query.where('obs.crop_id = :cropId', { cropId });
        const raw = await query.getRawMany();
        return raw.map(row => ({
            geography: row.geography,
            production: parseFloat(row.production || '0'),
            area: parseFloat(row.area || '0'),
            yield: parseFloat(row.yield || '0')
        }));
    }
    async getCropStats(cropId) {
        const kpis = await this.observationRepository.createQueryBuilder('obs')
            .select('SUM(obs.production_mt)', 'production')
            .addSelect('SUM(obs.cultivated_area_ha)', 'area')
            .addSelect('AVG(obs.yield_mt_ha)', 'yield')
            .where('obs.crop_id = :cropId', { cropId })
            .getRawOne();
        return {
            production: parseFloat(kpis.production || '0'),
            area: parseFloat(kpis.area || '0'),
            yield: parseFloat(kpis.yield || '0')
        };
    }
    async getMatrix(year, seasonId) {
        const query = this.observationRepository.createQueryBuilder('obs')
            .select('obs.geography', 'district')
            .addSelect('crop.name', 'crop')
            .addSelect('SUM(obs.cultivated_area_ha)', 'area')
            .addSelect('SUM(obs.production_mt)', 'production')
            .innerJoin('obs.crop', 'crop')
            .groupBy('obs.geography, crop.name');
        if (year)
            query.andWhere('obs.year = :year', { year });
        if (seasonId)
            query.andWhere('obs.season_id = :seasonId', { seasonId });
        const raw = await query.getRawMany();
        const matrix = {};
        for (const row of raw) {
            if (!matrix[row.district]) {
                matrix[row.district] = { district: row.district, totalArea: 0, totalProduction: 0 };
            }
            matrix[row.district][row.crop] = parseFloat(row.area || '0');
            matrix[row.district][`${row.crop}_production`] = parseFloat(row.production || '0');
            matrix[row.district].totalArea += parseFloat(row.area || '0');
            matrix[row.district].totalProduction += parseFloat(row.production || '0');
        }
        return Object.values(matrix).sort((a, b) => b.totalArea - a.totalArea);
    }
};
exports.AgriculturalDataService = AgriculturalDataService;
exports.AgriculturalDataService = AgriculturalDataService = AgriculturalDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(agricultural_observation_entity_1.AgriculturalObservation)),
    __param(1, (0, typeorm_1.InjectRepository)(crop_entity_1.Crop)),
    __param(2, (0, typeorm_1.InjectRepository)(season_entity_1.Season)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AgriculturalDataService);
//# sourceMappingURL=agricultural-data.service.js.map