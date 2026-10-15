import { DataSource } from 'typeorm';
export declare class CropStatisticsService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSummary(seasonCode?: string): Promise<{
        season: string;
        overview: any;
        crops: any;
    }>;
    getByCrop(cropName?: string, seasonCode?: string): Promise<{
        season: string;
        crop: string;
        count: any;
        data: any;
    }>;
    getTrends(): Promise<{
        trends: any;
    }>;
}
