import { DataSource } from 'typeorm';
export declare class IrrigationService {
    private dataSource;
    constructor(dataSource: DataSource);
    getPotential(seasonCode?: string): Promise<{
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
