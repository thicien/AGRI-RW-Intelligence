import { DistrictService } from './district.service';
import { JwtService } from '@nestjs/jwt';
export declare class DistrictController {
    private readonly districtService;
    private readonly jwtService;
    constructor(districtService: DistrictService, jwtService: JwtService);
    private resolveAuthorizedDistrict;
    getOverview(district?: string, season?: string, year?: string, auth?: string): Promise<{
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
    getProductivity(district?: string, season?: string, auth?: string): Promise<{
        districtName: any;
        seasonCode: string;
        cropBreakdown: any;
        historicalCrops: any;
    }>;
    getIrrigation(district?: string, season?: string, auth?: string): Promise<{
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
    getSoil(district?: string, season?: string, auth?: string): Promise<{
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
    getPostHarvest(district?: string, season?: string, auth?: string): Promise<{
        districtName: any;
        facilitiesList: any;
        lossRatePct: number;
        storageDeficitTonnes: number;
        priorityNeeds: string[];
    }>;
    getExports(district?: string, season?: string, auth?: string): Promise<{
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
    getInterventions(district?: string, status?: string, auth?: string): Promise<any>;
    updateInterventionStatus(id: string, body: {
        status: string;
        notes?: string;
        userEmail?: string;
    }): Promise<{
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
    }, auth?: string): Promise<{
        success: boolean;
        observationId: any;
        message: string;
    }>;
    getReports(district?: string, auth?: string): Promise<{
        reportTitle: string;
        district: string;
        publishedBy: string;
        generatedAt: string;
        classification: string;
        overviewKpis: {
            cropProductionTonnes: number;
            cultivatedAreaHa: number;
            averageYieldTonnesPerHa: number;
            priorityAssessmentsCount: number;
            recordedCropsCount: number;
        };
        sectorHighlights: any;
        interventionsSummary: any;
        disclaimer: string;
    }>;
    getNotifications(district?: string, auth?: string): Promise<{
        id: string;
        title: string;
        message: string;
        date: string;
        type: string;
        priority: string;
    }[]>;
}
