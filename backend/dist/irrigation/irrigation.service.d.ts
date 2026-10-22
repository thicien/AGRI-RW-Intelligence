import { DataSource } from 'typeorm';
export declare class IrrigationService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSummary(seasonCode?: string): Promise<{
        season: string;
        overview: any;
        infrastructure: any;
    }>;
    getDistricts(seasonCode?: string): Promise<any>;
    getSeasons(): Promise<any>;
    getOpportunityScreening(seasonCode?: string): Promise<{
        season: string;
        safeguardNotice: string;
        criteriaWeights: {
            name: string;
            weightPct: number;
            maxPoints: number;
            rationale: string;
        }[];
        rankedPotentialSites: any;
        rankings: any;
    }>;
    getSchemes(): Promise<{
        type: string;
        features: any;
        schemesList: any;
        rawAssets: any;
        schemes: any;
    }>;
    getSiteDossier(districtIdentifier: string, seasonCode?: string): Promise<{
        district: {
            id: any;
            code: any;
            name: any;
            province: any;
        };
        season: string;
        metrics: {
            modernIrrigatedHa: number;
            traditionalIrrigatedHa: number;
            totalIrrigatedHa: number;
            totalCultivatedHa: number;
            accessRatePct: number;
            irrigationGapHa: number;
            waterDeficitMm: number;
            droughtIndex: number;
            slopePct: number;
            waterSourceDistanceKm: number;
            roadDistanceKm: number;
            soilTexture: any;
            soilPh: number;
            opportunityScore: number;
            feasibilityTier: any;
            recommendedTechnology: any;
        };
        technologyDistribution: any;
        waterSourceDistribution: any;
        priorityCropsAtRisk: any;
        existingSchemes: any;
        feasibilityChecklist: any;
        provenance: any;
        safeguardNotice: string;
    } | null>;
}
