import { SoilFertilityService } from './soil-fertility.service';
export declare class SoilFertilityController {
    private readonly soilFertilityService;
    constructor(soilFertilityService: SoilFertilityService);
    getSummary(season?: string): Promise<{
        season: string;
        overview: any;
        projectsSummary: any;
    }>;
    getDistricts(season?: string): Promise<any>;
    getSeasons(): Promise<any>;
    getPriorityRanking(season?: string): Promise<{
        season: string;
        criteriaWeights: {
            criterion: string;
            weightPercent: number;
            metric: string;
        }[];
        rankedDistricts: any;
    }>;
    getProjects(): Promise<any>;
    getHistoricalCorrelation(district?: string): Promise<{
        district: string;
        timeline: any;
    }>;
    getSiteDossier(district?: string, season?: string): Promise<{
        district: any;
        province: any;
        season: any;
        threeWayIndicatorSeparation: {
            measuredSoilCondition: {
                title: string;
                ph: number;
                acidityStatus: any;
                limeRequirementTonsPerHa: number;
                soilOrganicCarbonPct: number;
                soilTexture: any;
                cationExchangeCapacityMeq: number;
                nitrogenRating: any;
                phosphorusRating: any;
                potassiumRating: any;
                safeguardNote: string;
            };
            modelledErosionSusceptibility: {
                title: string;
                susceptibilityIndex: number;
                slopeSteepPct: number;
                slopeModeratePct: number;
                slopeGentlePct: number;
                seasonalRainfallMm: number;
                rainfallErosivityIndex: number;
                safeguardNote: string;
            };
            reportedPracticeAdoption: {
                title: string;
                erosionControlPct: number;
                agroforestryHa: number;
                organicFarmerPct: number;
                inorganicFarmerPct: number;
                fertilizerTypes: {
                    npk: number;
                    urea: number;
                    dap: number;
                    lime: number;
                };
                safeguardNote: string;
            };
        };
        cropYields: {
            maize: number;
            beans: number;
            potato: number;
            cassava: number;
            productivityIndex: number;
        };
        engineeringChecklist: {
            item: string;
            status: string;
            details: string;
        }[];
        soilPrescription: {
            recommendedInterventions: any;
            totalDistrictLimeNeedTons: number;
            estimatedTerracingBudgetUsd: number;
            matchedProject: {
                name: any;
                code: any;
                technologies: any;
                funding: any;
                impact: any;
            } | null;
        };
        evidenceSources: any;
    } | null>;
}
