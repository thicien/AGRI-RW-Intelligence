import { DataSource } from 'typeorm';
export interface ProductivityFilter {
    season?: string;
    crop?: string;
    province?: string;
    district?: string;
}
export declare class CropStatisticsService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSummary(seasonCode?: string): Promise<{
        season: string;
        overview: any;
        crops: any;
    }>;
    getDistrictComparisons(cropName?: string, seasonCode?: string): Promise<{
        crop: string;
        season: string;
        nationalBenchmark: {
            meanYield: number;
            stdDev: number;
            totalDistrictsReporting: any;
        };
        districts: any;
    }>;
    getSeasonalComparison(cropName?: string, year?: number): Promise<{
        crop: string;
        year: number;
        seasonA: string;
        seasonB: string;
        comparisons: any;
    }>;
    getMultiYearTrends(cropName?: string, districtCode?: string): Promise<{
        crop: string;
        district: string;
        trends: any;
    }>;
    getUnderperformingAreas(seasonCode?: string, cropName?: string): Promise<{
        crop: string;
        season: string;
        disclaimer: string;
        criteria: string[];
        lowerPerformingAreas: any;
        allDistrictsRanked: any;
    }>;
    getDistrictInvestigationDossier(districtCode: string, cropName?: string, seasonCode?: string): Promise<{
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
