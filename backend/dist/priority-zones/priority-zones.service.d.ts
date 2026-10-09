export interface PriorityScoreParams {
    productivityGap: number;
    irrigationOpportunity: number;
    soilManagementNeed: number;
    postHarvestGap: number;
    processingOpportunity: number;
    exportOpportunity: number;
}
export interface PriorityZoneResult {
    priorityScore: number;
    priorityLevel: 'LOW PRIORITY' | 'MEDIUM PRIORITY' | 'HIGH PRIORITY';
    primaryConstraint: string;
    secondaryConstraint: string;
    opportunity: string;
    recommendedInterventions: string[];
}
export declare class PriorityZonesService {
    calculatePriorityZone(params: PriorityScoreParams): PriorityZoneResult;
}
