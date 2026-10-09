import { AgriculturalDataService } from './agricultural-data.service';
export declare class AgriculturalDataController {
    private readonly dataService;
    constructor(dataService: AgriculturalDataService);
    getObservations(limit?: number, skip?: number): Promise<{
        data: import("./entities/agricultural-observation.entity").AgriculturalObservation[];
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
    getCropStats(id: string): Promise<{
        production: number;
        area: number;
        yield: number;
    }>;
    reseed(): Promise<{
        success: boolean;
        message: string;
    }>;
    getMatrix(year?: string, seasonId?: string): Promise<any[]>;
}
