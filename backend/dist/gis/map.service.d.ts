import { PriorityZonesService } from '../priority-zones/priority-zones.service';
export declare class MapService {
    private priorityZonesService;
    constructor(priorityZonesService: PriorityZonesService);
    getPriorityZonesGeoJson(districtId?: number): Promise<{
        type: string;
        features: {
            type: string;
            properties: {
                priorityScore: number;
                priorityLevel: "LOW PRIORITY" | "MEDIUM PRIORITY" | "HIGH PRIORITY";
                primaryConstraint: string;
                secondaryConstraint: string;
                opportunity: string;
                recommendedInterventions: string[];
                id: number;
                name: string;
            };
            geometry: {
                type: string;
                coordinates: number[][][];
            };
        }[];
    }>;
    getIrrigationOpportunitiesGeoJson(): Promise<{
        type: string;
        features: never[];
    }>;
    getFarmsGeoJson(villageId?: number): Promise<{
        type: string;
        features: never[];
    }>;
}
