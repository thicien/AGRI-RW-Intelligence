import { DataSource } from 'typeorm';
export declare class DashboardService {
    private dataSource;
    constructor(dataSource: DataSource);
    getOverview(params: {
        year?: string;
        season?: string;
        province?: string;
        district?: string;
        crop?: string;
        mode?: string;
        mapLayer?: string;
    }): Promise<{
        selectedYear: string;
        selectedSeason: string;
        selectedProvince: string;
        selectedDistrict: string;
        selectedCrop: string;
        analysisMode: string;
        activeLayer: string;
        dataCoverage: {
            coveragePeriod: string;
            source: string;
            totalObservations: any;
            districtsCovered: number;
            cropsCovered: any;
        };
        kpis: {
            totalCropProduction: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            averageYield: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            cultivatedArea: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            recordedFacilities: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            irrigationCoverage: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            soilFertilityIndex: {
                value: number;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
            exportPerformance: {
                value: string;
                unit: string;
                trendLabel: string;
                referencePeriod: string;
                source: string;
            };
        };
        mapDistricts: any;
        historicalTrajectory: any;
        seasonComparison: any[];
        seasonalTrends: {
            season: string;
            Maize: number;
            Beans: number;
            Cassava: number;
            Coffee: number;
        }[];
        allCrops: any;
        topCrops: any;
        moduleSummaries: {
            productivity: {
                title: string;
                challengeCode: string;
                primaryMetric: string;
                secondaryMetric: string;
                status: string;
                highlight: string;
                attentionNeeded: string;
                link: string;
                actionLabel: string;
            };
            irrigation: {
                title: string;
                challengeCode: string;
                primaryMetric: string;
                secondaryMetric: string;
                status: string;
                highlight: string;
                attentionNeeded: string;
                link: string;
                actionLabel: string;
            };
            soilConservation: {
                title: string;
                challengeCode: string;
                primaryMetric: string;
                secondaryMetric: string;
                status: string;
                highlight: string;
                attentionNeeded: string;
                link: string;
                actionLabel: string;
            };
            postHarvest: {
                title: string;
                challengeCode: string;
                primaryMetric: string;
                secondaryMetric: string;
                status: string;
                highlight: string;
                attentionNeeded: string;
                link: string;
                actionLabel: string;
            };
            exportMarkets: {
                title: string;
                challengeCode: string;
                primaryMetric: string;
                secondaryMetric: string;
                status: string;
                highlight: string;
                attentionNeeded: string;
                link: string;
                actionLabel: string;
            };
        };
        priorityOpportunities: {
            id: string;
            category: string;
            area: string;
            location: string;
            recommendation: string;
            evidenceBasis: string;
            missingInformation: string;
            requiresFieldVerification: boolean;
            priorityLevel: string;
            link: string;
        }[];
        soilHealth: {
            score: number;
            ph: number;
            organicMatterPct: number;
            nitrogenPct: number;
            phosphorusPpm: number;
            potassiumMeq: number;
        };
        irrigationWater: {
            statusNote: string;
            monthlyData: {
                month: string;
                rainfallMm: number;
                waterLevelPct: number;
            }[];
        };
        marketPrices: {
            crop: string;
            farmGatePrice: number;
            wholesalePrice: number;
            trend: string;
        }[];
        metadata: {
            system: string;
            datasetCoverage: string;
            timestamp: string;
        };
    }>;
}
