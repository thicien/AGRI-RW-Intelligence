import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Crop } from '../crops/entities/crop.entity';
import { Season } from '../seasons/entities/season.entity';
import { FarmCrop } from '../agricultural-data/entities/farm-crop.entity';
import { Farm } from '../agricultural-data/entities/farm.entity';
import { Village } from '../administrative-units/entities/village.entity';
import { AgriculturalObservation } from '../agricultural-data/entities/agricultural-observation.entity';
export declare class IngestionService implements OnModuleInit {
    private cropRepository;
    private seasonRepository;
    private farmCropRepository;
    private farmRepository;
    private villageRepository;
    private observationRepository;
    private readonly logger;
    private readonly dataDir;
    constructor(cropRepository: Repository<Crop>, seasonRepository: Repository<Season>, farmCropRepository: Repository<FarmCrop>, farmRepository: Repository<Farm>, villageRepository: Repository<Village>, observationRepository: Repository<AgriculturalObservation>);
    onModuleInit(): Promise<void>;
    runAgriculturalIngestion(): Promise<{
        success: boolean;
        message: string;
        filesProcessed?: undefined;
        rowsProcessed?: undefined;
        pdfPages?: undefined;
    } | {
        success: boolean;
        filesProcessed: number;
        rowsProcessed: number;
        pdfPages: number;
        message?: undefined;
    }>;
    private findDataFiles;
    private parsePdfFile;
    private parseExcelFile;
    private getOrCreateCrop;
    private getOrCreateSeason;
}
