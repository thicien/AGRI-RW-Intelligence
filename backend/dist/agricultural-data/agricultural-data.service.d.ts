import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AgriculturalObservation } from './entities/agricultural-observation.entity';
import { Crop } from '../crops/entities/crop.entity';
import { Season } from '../seasons/entities/season.entity';
export declare class AgriculturalDataService implements OnModuleInit {
    private observationRepository;
    private cropRepository;
    private seasonRepository;
    private readonly logger;
    constructor(observationRepository: Repository<AgriculturalObservation>, cropRepository: Repository<Crop>, seasonRepository: Repository<Season>);
    reseed(): Promise<void>;
    onModuleInit(): Promise<void>;
    getObservations(limit?: number, skip?: number): Promise<{
        data: AgriculturalObservation[];
        total: number;
        limit: number;
        skip: number;
    }>;
    getKpis(): Promise<{
        cultivatedArea: number;
        totalProduction: number;
        cropsCovered: number;
        avgYield: number;
        harvestedArea: number;
        seasonsCovered: number;
    }>;
    getTrends(cropId?: string, seasonId?: string): Promise<{
        year: any;
        production: number;
        area: number;
        yield: number;
    }[]>;
    getSeasonComparison(cropId?: string): Promise<{
        season: any;
        production: number;
        area: number;
        yield: number;
    }[]>;
    getGeographicStats(cropId?: string): Promise<{
        geography: any;
        production: number;
        area: number;
        yield: number;
    }[]>;
    getCropStats(cropId: string): Promise<{
        production: number;
        area: number;
        yield: number;
    }>;
    getMatrix(year?: number, seasonId?: string): Promise<any[]>;
}
