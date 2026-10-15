import { CropStatisticsService } from './crop-statistics.service';
export declare class CropStatisticsController {
    private readonly service;
    constructor(service: CropStatisticsService);
    getSummary(season?: string): Promise<{
        season: string;
        overview: any;
        crops: any;
    }>;
    getByCrop(crop?: string, season?: string): Promise<{
        season: string;
        crop: string;
        count: any;
        data: any;
    }>;
    getTrends(): Promise<{
        trends: any;
    }>;
}
