import { DataSource } from 'typeorm';
export declare class InfrastructureService {
    private dataSource;
    constructor(dataSource: DataSource);
    getFacilities(): Promise<{
        type: string;
        features: any;
        facilities: any;
    }>;
    getCapacityAnalysis(): Promise<{
        summary: any;
        facilities: any;
    }>;
}
