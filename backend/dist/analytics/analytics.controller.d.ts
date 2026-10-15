import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly service;
    constructor(service: AnalyticsService);
    getExportIntelligence(): Promise<{
        summary: any;
        trades: any;
    }>;
    getExportOpportunities(): Promise<{
        totalAssessments: any;
        opportunities: any;
    }>;
}
