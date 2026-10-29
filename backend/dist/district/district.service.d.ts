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
    getDistrictProductivity(districtName: string, seasonCode?: string, compareSeasonCode?: string, compareMode?: string, stabilityThreshold?: number): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
        };
        season: {
            active: string;
            comparison: string | null;
            comparisonMode: string;
            stabilityThresholdPct: number;
        };
        availableSeasons: any;
        summaryKPIs: {
            totalProductionTonnes: number;
            totalProductionCompareTonnes: number;
            productionAbsChangeTonnes: number | null;
            productionPctChange: number | null;
            totalAreaHa: number;
            totalAreaCompareHa: number;
            areaAbsChangeHa: number | null;
            areaPctChange: number | null;
            averageYieldTonnesPerHa: number | null;
            averageYieldCompareTonnesPerHa: number | null;
            cropsReportedCount: number;
            totalCropRecordsCount: number;
            cropsIncreasedCount: number;
            cropsDecreasedCount: number;
            cropsStableCount: number;
            cropsNoBaselineCount: number;
        };
        crops: any[];
        missingCrops: any[];
        rankings: {
            byProduction: any[];
            byYield: any[];
        };
        topContributors: {
            crop_name: any;
            category: any;
            production_tonnes: any;
            share_pct: any;
        }[];
        significantChanges: {
            largestIncreaseAbs: any;
            largestDecreaseAbs: any;
            largestIncreasePct: any;
            largestDecreasePct: any;
            areaDiscrepancyCrops: any[];
        };
        districtTrend: {
            season_code: any;
            year: any;
            season_name: any;
            total_production_tonnes: number;
            total_area_ha: number;
            average_yield_t_ha: number | null;
            crop_count: any;
        }[];
        cropHistories: {
            [cropName: string]: any[];
        };
        dataQualityAndMethodology: {
            unit: string;
            doubleCountingPrevention: string;
            cultivatedAreaRule: string;
            stabilityThresholdApplied: string;
            sourceFile: any;
            qualityStatus: any;
        };
    }>;
    getDistrictIrrigation(districtName: string, seasonCode?: string, compareSeasonCode?: string, compareMode?: string): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
        };
        season: {
            active: string;
            comparison: string | null;
            comparisonMode: string;
        };
        availableSeasons: any;
        summaryKPIs: {
            totalCultivatedHa: number;
            totalCultivatedCompareHa: number | null;
            cultivatedAbsChangeHa: number | null;
            cultivatedPctChange: number | null;
            areaUnderIrrigationHa: number;
            areaUnderIrrigationCompareHa: number | null;
            irrigationAbsChangeHa: number | null;
            irrigationPctChange: number | null;
            modernIrrigatedHa: number;
            traditionalIrrigatedHa: number;
            irrigationCoveragePct: number;
            irrigationCoverageComparePct: number | null;
            coverageDeltaPctPoints: number | null;
            documentedSchemesCount: any;
            operationalSchemesCount: number;
            partialSchemesCount: number;
            nonOperationalSchemesCount: number;
            plannedSchemesCount: number;
            areaEquippedCommandHa: number;
            areaEquippedIrrigableHa: number;
            opportunityCandidatesCount: number;
            totalOpportunityAreaHa: number;
            isDiscrepancy: boolean;
            discrepancyMessage: string | null;
        };
        documentedSchemes: any;
        candidateAreas: {
            candidate_id: string;
            rank: number;
            site_name: string;
            sector: any;
            potential_area_ha: number;
            existing_status: string;
            recommended_technology: any;
            opportunity_score: number;
            feasibility_tier: any;
            supporting_evidence: {
                water_source_proximity: string;
                terrain_slope: string;
                soil_suitability: string;
                drought_risk_offset: string;
                road_access: string;
            };
            missing_data_uncertainty: string;
            recommended_next_step: string;
            estimated_cost_rwf: number;
            estimated_beneficiary_households: number;
        }[];
        sectorBreakdown: any;
        historicalProgression: any;
        cropIrrigationLinkage: any;
        dataQualityAndMethodology: {
            threeDefinitions: {
                areaEquipped: string;
                areaActuallyIrrigated: string;
                areaWithPotential: string;
            };
            formulaApplied: string;
            inventoryUpdatingRule: string;
            sourceFile: any;
            lastUpdatedDate: any;
        };
    }>;
    getDistrictSoil(districtName: string, seasonCode?: string, compareSeasonCode?: string, compareMode?: string): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
        };
        reportingPeriod: {
            active: any;
            comparison: string | undefined;
            comparisonMode: string;
            observationDate: string;
        };
        availableSeasons: any[];
        summaryKPIs: {
            areaWithSoilDataHa: number;
            areaWithErosionRiskDataHa: number;
            soilObservationsCount: any;
            areasForAssessmentCount: any;
            averagePh: number;
            acidityStatus: any;
            limeRequirementTonnesPerHa: number;
            organicCarbonPct: number;
            soilTexture: any;
            cationExchangeCapacityMeq: number;
            nitrogenRating: any;
            phosphorusRating: any;
            potassiumRating: any;
            erosionControlPct: number;
            radicalTerracingGapHa: number;
            modelledErosionSusceptibilityIndex: number;
            slopeSteepPct: number;
            slopeModeratePct: number;
            slopeGentlePct: number;
            seasonalRainfallMm: number;
            organicFarmerPct: number;
            inorganicFarmerPct: number;
            fertNpkPct: number;
            fertUreaPct: number;
            fertDapPct: number;
            fertLimePct: number;
            priorityScore: number;
            priorityTier: any;
        };
        soilObservations: any;
        conservationProjects: any;
        documentedInterventions: any;
        sectorSoilProfiles: any;
        candidatePriorityAreas: any;
        temporalComparisons: {
            indicator: string;
            unit: string;
            earlier_value: number | null;
            later_value: number;
            change: string;
            change_direction: string;
            comparability_status: string;
            method_notes: string;
        }[];
        historicalProgression: {
            season_code: any;
            year: any;
            observation_date: any;
            soil_ph: number | null;
            organic_carbon_pct: number | null;
            erosion_control_pct: number | null;
            inorganic_farmer_pct: number | null;
            organic_farmer_pct: number | null;
            modelled_erosion_index: number | null;
        }[];
        cropSoilLinkage: {
            crop_name: string;
            terraced_yield_t_ha: number;
            unterraced_yield_t_ha: number;
            limed_yield_t_ha: number;
            unlimed_yield_t_ha: number;
            yield_gain_pct: string;
            limiting_factor: string;
        }[];
        dataQualityAndMethodology: {
            scientificPrinciple: string;
            representativenessRule: string;
            measuredVsModelled: {
                measured: string;
                reported: string;
                modelled: string;
            };
            interventionLifecycle: string;
            sources: string[];
            lastObservationDate: string;
        };
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
