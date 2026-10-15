import { IrrigationService } from './irrigation.service';
export declare class IrrigationController {
    private readonly service;
    constructor(service: IrrigationService);
    getPotential(season?: string): Promise<{
        season: string;
        summary: any;
        rankings: any;
    }>;
    getAssets(): Promise<{
        type: string;
        features: any;
        rawAssets: any;
    }>;
}
