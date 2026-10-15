import { EnvironmentalService } from './environmental.service';
export declare class EnvironmentalController {
    private readonly service;
    constructor(service: EnvironmentalService);
    getSoilFertility(): Promise<{
        totalDistrictsTested: number;
        samples: any[];
    }>;
    getConservationPractices(season?: string): Promise<{
        season: string;
        practicesSummary: any;
        districtBreakdown: any;
    }>;
    getSeasonalComparison(): Promise<{
        comparison: any;
    }>;
}
