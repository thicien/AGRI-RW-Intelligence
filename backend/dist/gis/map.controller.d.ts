import { MapService } from './map.service';
export declare class MapController {
    private readonly mapService;
    constructor(mapService: MapService);
    getPriorityZones(districtId?: string): Promise<{
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
    getFarms(villageId?: string): Promise<{
        type: string;
        features: never[];
    }>;
    getIrrigationOpportunities(): Promise<{
        type: string;
        features: never[];
    }>;
}
