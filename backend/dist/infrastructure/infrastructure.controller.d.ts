import { InfrastructureService } from './infrastructure.service';
export declare class InfrastructureController {
    private readonly service;
    constructor(service: InfrastructureService);
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
