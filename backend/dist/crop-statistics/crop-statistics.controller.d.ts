import { CropStatisticsService } from './crop-statistics.service';
export declare class CropStatisticsController {
    private readonly service;
    constructor(service: CropStatisticsService);
    getSummary(season?: string): Promise<{
        season: string;
        overview: any;
        crops: any;
    }>;
    getDistrictComparisons(crop?: string, season?: string): Promise<{
        crop: string;
        season: string;
        nationalBenchmark: {
            meanYield: number;
            stdDev: number;
            totalDistrictsReporting: any;
        };
        districts: any;
    }>;
    getSeasonalComparison(crop?: string, year?: string): Promise<{
        crop: string;
        year: number;
        seasonA: string;
        seasonB: string;
        comparisons: any;
    }>;
    getMultiYearTrends(crop?: string, district?: string): Promise<{
        crop: string;
        district: string;
        trends: any;
    }>;
    getUnderperformingAreas(season?: string, crop?: string): Promise<{
        crop: string;
        season: string;
        disclaimer: string;
        criteria: string[];
        lowerPerformingAreas: any;
        allDistrictsRanked: any;
    }>;
    getDistrictInvestigationDossier(district?: string, crop?: string, season?: string): Promise<{
        error: string;
        dossierTitle?: undefined;
        target?: undefined;
        productivityMetrics?: undefined;
        contextualIndicators?: undefined;
        provincialPeers?: undefined;
        historicalTrajectory?: undefined;
        fieldInvestigationChecklist?: undefined;
        officialSources?: undefined;
        disclaimer?: undefined;
    } | {
        dossierTitle: string;
        target: {
            districtName: any;
            districtCode: any;
            province: any;
            crop: string;
            season: string;
        };
        productivityMetrics: {
            yieldTonnesHa: any;
            nationalBenchmark: any;
            yieldDeficitPct: any;
            cultivatedAreaHa: any;
            harvestedAreaHa: any;
            unharvestedRatePct: any;
            yoyYieldChangePct: any;
            investigationPriorityScore: any;
            priorityTier: any;
        };
        contextualIndicators: {
            soilPh: any;
            soilType: any;
            rainfallMm: any;
            temperatureC: any;
            droughtIndex: any;
            modernIrrigationHa: any;
        };
        provincialPeers: any;
        historicalTrajectory: any;
        fieldInvestigationChecklist: {
            check: string;
            rationale: string;
        }[];
        officialSources: string[];
        disclaimer: string;
        error?: undefined;
    }>;
    getCropsMasterList(): Promise<any>;
    getSeasonsMasterList(): Promise<any>;
    getDataQualityReport(): Promise<{
        foundationOverview: any;
        qualityStatusBreakdown: any;
        seasonsAudit: any;
        latestPipelineJob: any;
        rulesEnforced: {
            ruleCode: string;
            name: string;
            description: string;
        }[];
    }>;
}
