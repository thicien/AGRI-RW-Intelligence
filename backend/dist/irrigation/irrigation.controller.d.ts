import { IrrigationService } from './irrigation.service';
export declare class IrrigationController {
    private readonly service;
    constructor(service: IrrigationService);
    getSummary(season?: string): Promise<{
        season: string;
        overview: any;
        infrastructure: any;
    }>;
    getDistricts(season?: string): Promise<any>;
    getSeasons(): Promise<any>;
    getOpportunityScreening(season?: string): Promise<{
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
    getSiteDossier(district?: string, season?: string): Promise<{
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
    getPotentialLegacy(season?: string): Promise<{
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
    getAssetsLegacy(): Promise<{
        type: string;
        features: any;
        schemesList: any;
        rawAssets: any;
        schemes: any;
    }>;
}
