import { DataSource } from 'typeorm';
export declare class DistrictService {
    private dataSource;
    constructor(dataSource: DataSource);
    getDistrictUnit(districtName: string): Promise<any>;
    getDistrictSectors(districtId: string): Promise<any>;
    getDistrictOverview(districtName: string, seasonCode?: string, year?: string): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
            totalSectors: any;
            selectedSeason: string;
            authorizedScope: string;
        };
        kpis: {
            cropProductionTonnes: number;
            cultivatedAreaHa: number;
            averageYieldTonnesPerHa: number;
            priorityAssessmentsCount: number;
            recordedCropsCount: number;
        };
        seasons: any;
        seasonalTrends: any[];
        fiveAreas: {
            productivity: {
                title: string;
                yield: number;
                production: number;
                area: number;
                topCrops: string[];
            };
            irrigation: {
                title: string;
                irrigatedAreaHa: number;
                potentialHa: number;
                accessPct: number;
                schemesCount: number;
                feasibilityScore: number;
                waterSource: string;
            };
            soil: {
                title: string;
                avgPh: number;
                organicCarbonPct: number;
                soilHealthIndex: number;
                erosionRiskPct: number;
                terracedHa: number;
                limingNeed: string;
            };
            postHarvest: {
                title: string;
                storageCapacityMt: number;
                productionMt: number;
                lossPct: number;
                storageDeficitMt: number;
                warehouses: number;
                dryingGrounds: number;
            };
            exports: {
                title: string;
                volumeMt: number;
                valueUsd: number;
                accessScore: number;
                commodity: string;
                destinations: string;
            };
        };
        sectors: any;
        interventions: any;
    }>;
    getDistrictProductivity(districtName: string, seasonCode?: string): Promise<{
        districtName: any;
        seasonCode: string;
        cropBreakdown: any;
        historicalCrops: any;
    }>;
    getDistrictIrrigation(districtName: string, seasonCode?: string): Promise<{
        districtName: any;
        totalAssetsCount: any;
        existingAssets: any;
        potentialSites: {
            siteName: string;
            commandAreaHa: number;
            source: string;
            method: string;
            solarPumpingFeasibilityScore: number;
            estimatedCostRwf: number;
            priority: string;
        }[];
    }>;
    getDistrictSoil(districtName: string, seasonCode?: string): Promise<{
        districtName: any;
        acidityProfile: {
            averagePh: number;
            status: string;
            limeRequirementTonnesPerHa: number;
            recommendedAction: string;
        };
        fertilityProfile: {
            organicCarbonPct: number;
            nitrogenStatus: string;
            phosphorusAvailability: string;
            potassiumStatus: string;
        };
        erosionHotspots: {
            sector: string;
            slopeRange: string;
            riskLevel: string;
            recommendedIntervention: string;
        }[];
        activeProjects: any;
    }>;
    getDistrictPostHarvest(districtName: string, seasonCode?: string): Promise<{
        districtName: any;
        facilitiesList: any;
        lossRatePct: number;
        storageDeficitTonnes: number;
        priorityNeeds: string[];
    }>;
    getDistrictExports(districtName: string, seasonCode?: string): Promise<{
        districtName: any;
        exportCommodities: {
            product: string;
            currentProductionMt: number;
            exportReadinessScore: number;
            primaryDestinations: string;
            complianceRequirements: string;
        }[];
        keyRecommendation: string;
    }>;
    getDistrictInterventions(districtName: string, statusFilter?: string): Promise<any>;
    updateInterventionStatus(id: string, status: string, notes?: string, actorEmail?: string): Promise<{
        success: boolean;
        message: string;
        intervention: any;
    }>;
    submitFieldObservation(body: {
        districtName: string;
        sectorName: string;
        cropType: string;
        observationType: string;
        description: string;
        notes: string;
        gpsLat?: number;
        gpsLng?: number;
        userEmail: string;
    }): Promise<{
        success: boolean;
        observationId: any;
        message: string;
    }>;
}
