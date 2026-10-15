import { DataSource } from 'typeorm';
export declare class EnvironmentalService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSoilFertility(): Promise<{
        totalDistrictsTested: number;
        samples: any[];
    }>;
    getConservationPractices(seasonCode?: string): Promise<{
        season: string;
        practicesSummary: any;
        districtBreakdown: any;
    }>;
    getSeasonalComparison(): Promise<{
        comparison: any;
    }>;
}
