import { InfrastructureService } from './infrastructure.service';
export declare class InfrastructureController {
    private readonly service;
    constructor(service: InfrastructureService);
    getFacilities(type?: string, district?: string, search?: string): Promise<{
        summary: {
            totalFacilities: any;
            totalStorageCapacityTonnes: number;
            totalColdStorageTonnes: number;
            totalProcessingCapacityTonnesDay: number;
            totalDryingCapacityTonnesDay: number;
            avgUtilizationRatePct: number;
            facilitiesByType: Record<string, number>;
            facilitiesByDistrict: Record<string, number>;
        };
        features: any;
        facilities: any;
    }>;
    getFacilityById(id: string): Promise<{
        id: any;
        code: any;
        name: any;
        district: any;
        districtCode: any;
        type: any;
        subtype: any;
        status: any;
        owner: any;
        operator: any;
        storageCapacity: number;
        dryingCapacity: number;
        coldStorageCapacity: number;
        processingCapacity: number;
        yearEstablished: any;
        utilizationPct: any;
        commodities: any;
        roadAccess: any;
        powerSource: any;
        waterAccess: any;
        longitude: number;
        latitude: number;
        lastVerifiedAt: any;
    } | null>;
    getCapacityAnalysis(): Promise<{
        summary: any;
        facilities: any;
    }>;
}
