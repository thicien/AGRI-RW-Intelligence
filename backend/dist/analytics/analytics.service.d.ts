import { DataSource } from 'typeorm';
export declare class AnalyticsService {
    private dataSource;
    constructor(dataSource: DataSource);
    getExportIntelligence(): Promise<{
        summary: any;
        trades: any;
    }>;
    getExportOpportunities(): Promise<{
        totalAssessments: any;
        opportunities: any;
    }>;
}
