import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
// xlsx is required dynamically to prevent crashes
const { PDFParse } = require('pdf-parse');
import { Crop } from '../crops/entities/crop.entity';
import { Season } from '../seasons/entities/season.entity';
import { FarmCrop } from '../agricultural-data/entities/farm-crop.entity';
import { Farm } from '../agricultural-data/entities/farm.entity';
import { Village } from '../administrative-units/entities/village.entity';
import { AgriculturalObservation } from '../agricultural-data/entities/agricultural-observation.entity';

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  // The base data directory as defined in the project structure
  // From dist/ingestion/ingestion.service.js, we go up to dist -> backend -> AGRI-RW Intelligence
  private readonly dataDir = path.resolve(__dirname, '../../../data/agriculture');

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
    @InjectRepository(Season) private seasonRepository: Repository<Season>,
    @InjectRepository(FarmCrop) private farmCropRepository: Repository<FarmCrop>,
    @InjectRepository(Farm) private farmRepository: Repository<Farm>,
    @InjectRepository(Village) private villageRepository: Repository<Village>,
    @InjectRepository(AgriculturalObservation) private observationRepository: Repository<AgriculturalObservation>,
  ) {}

  async getJobs() {
    return this.dataSource.query(`
      SELECT 
        id,
        original_filename,
        file_format,
        target_domain,
        status,
        total_rows,
        valid_rows,
        invalid_rows,
        started_at,
        completed_at,
        created_at
      FROM agrilens.data_import_jobs
      ORDER BY created_at DESC;
    `);
  }

  /**
   * Automatically runs ingestion when the module initializes (backend startup)
   */
  async onModuleInit() {
    this.logger.log('Backend startup detected: Commencing background data ingestion...');
    // We do not await this so it runs asynchronously without blocking application startup
    this.runAgriculturalIngestion().catch(err => {
      this.logger.error(`Automated ingestion failed: ${err.message}`);
    });
  }

  /**
   * Discovers and parses NISR SAS Excel and PDF files in the data directory
   */
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
        } else {
          const rows = await this.parseExcelFile(file);
          totalRowsProcessed += rows;
        }
      } catch (error) {
        this.logger.error(`Failed to process ${file}: ${error.message}`);
      }
    }

    this.logger.log(`Ingestion complete. Processed ${totalRowsProcessed} Excel rows and ${totalPdfPages} PDF pages.`);
    return { success: true, filesProcessed: dataFiles.length, rowsProcessed: totalRowsProcessed, pdfPages: totalPdfPages };
  }

  /**
   * Recursively finds all .xlsx, .xls, and .pdf files in a directory
   */
  private findDataFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        this.findDataFiles(filePath, fileList);
      } else if (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.pdf')) {
        fileList.push(filePath);
      }
    }

    return fileList;
  }

  /**
   * Parses a single NISR Seasonal Agricultural Survey PDF report
   */
  private async parsePdfFile(filePath: string): Promise<number> {
    this.logger.log(`Parsing PDF file: ${path.basename(filePath)}`);
    
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      
      // Here is where NLP / Regex extraction happens.
      // PDF documents contain the qualitative analysis (e.g., "Yields dropped due to delayed rainfall").
      // We search for key insights or extracted tables.
      const text = result.text;
      
      // -- ETL Logic Placeholder --
      // Example: Detect mention of "PSTA5" or "Drought" and link it to the specific year/season.
      
      await parser.destroy();
      return result.pages?.length || 1;
    } catch (error) {
      this.logger.warn(`Could not parse PDF ${path.basename(filePath)}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Parses a single NISR Seasonal Agricultural Survey Excel file
   */
  private async parseExcelFile(filePath: string): Promise<number> {
    this.logger.log(`Parsing Excel file: ${path.basename(filePath)}`);
    
    // We will attempt to use xlsx once the network allows its installation
    let xlsx;
    try {
      xlsx = require('xlsx');
    } catch (e) {
      this.logger.warn(`xlsx library not available yet. Skipping ${path.basename(filePath)}`);
      return 0;
    }
    
    const workbook = xlsx.readFile(filePath);
    let rowsProcessed = 0;

    // Detect the season and year from the filename
    // e.g. "SAS_2025_Annual Tables.xlsx" or "SAS 2026B_Main report.pdf"
    const fileName = path.basename(filePath);
    let yearMatch = fileName.match(/201[4-9]|202[0-6]/);
    let seasonMatch = fileName.match(/Season A|Season B|Annual|A_|B_/i);
    
    const year = yearMatch ? yearMatch[0] : 'Unknown Year';
    let seasonType = 'Annual';
    if (seasonMatch) {
      if (seasonMatch[0].toLowerCase().includes('a')) seasonType = 'Season A';
      if (seasonMatch[0].toLowerCase().includes('b')) seasonType = 'Season B';
    }
    const seasonName = `${year} ${seasonType}`;
    const season = await this.getOrCreateSeason(seasonName);

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      // Convert sheet to JSON array of objects
      const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

      for (const row of data) {
        if (!row) continue;
        
        // 1. Extract District level data
        const location = row['District'] || row['Province/District'] || row['Area'];
        if (!location) continue; // Skip rows without geographical context
        
        // 2. Extract Farmer and Farm (ha) Data
        const totalFarmers = row['Number of Farmers'] || row['Total Farmers'] || 0;
        const cultivatedArea = row['Cultivated Area (ha)'] || row['Total Area (ha)'] || 0;
        
        // If we found a valid district row with farm data, save it
        if (location && (totalFarmers > 0 || cultivatedArea > 0)) {
           // We map it to an agricultural observation immediately
        }

        // 3. Extract Crop Data (Production, Yield)
        // NISR tables often pivot crops into columns or rows.
        const knownCrops = ['Maize', 'Beans', 'Cassava', 'Irish Potatoes', 'Sweet Potatoes', 'Rice', 'Wheat', 'Soybeans'];
        
        for (const cropName of knownCrops) {
          // Look for columns like 'Maize Production (MT)' or 'Maize Yield (MT/ha)'
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

  /**
   * Helper method to map a crop name string to a database Crop entity
   */
  private async getOrCreateCrop(cropName: string): Promise<Crop> {
    let crop = await this.cropRepository.findOne({ where: { name: cropName } });
    if (!crop) {
      crop = this.cropRepository.create({ name: cropName });
      await this.cropRepository.save(crop);
    }
    return crop;
  }

  /**
   * Helper method to map a season string (e.g. "2024 Season A") to a Season entity
   */
  private async getOrCreateSeason(seasonName: string): Promise<Season> {
    let season = await this.seasonRepository.findOne({ where: { name: seasonName } });
    if (!season) {
      season = this.seasonRepository.create({ name: seasonName });
      await this.seasonRepository.save(season);
    }
    return season;
  }
}
