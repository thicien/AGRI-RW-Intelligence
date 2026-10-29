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
    getProductivity(district?: string, season?: string, compareSeason?: string, compareMode?: string, stabilityThreshold?: string, auth?: string): Promise<{
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
    getIrrigation(district?: string, season?: string, compareSeason?: string, compareMode?: string, auth?: string): Promise<{
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
    getSoil(district?: string, season?: string, compareSeason?: string, compareMode?: string, auth?: string): Promise<{
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
    getPostHarvest(district?: string, season?: string, compareSeason?: string, compareMode?: string, auth?: string): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
            province: any;
        };
        season: {
            active: any;
            comparison: string | undefined;
            active_label: any;
            comparison_label: any;
        };
        availableSeasons: any[];
        summaryKPIs: {
            documentedFacilitiesCount: any;
            operationalFacilitiesCount: any;
            partialFacilitiesCount: any;
            nonOperationalFacilitiesCount: any;
            installedStorageCapacityTonnes: any;
            usableStorageCapacityTonnes: any;
            occupiedStorageCapacityTonnes: any;
            storageUtilizationPct: number;
            totalProductionTonnes: number;
            productionRequiringHandlingTonnes: number;
            marketSurplusVolumeTonnes: number;
            estimatedStorageDemandTonnes: number;
            potentialStorageGapTonnes: number;
            lossRatePct: number;
            documentedLossTonnes: number;
            coldStorageCapacityTonnes: any;
            dryingCapacityTonnesDay: any;
            processingCapacityTonnesDay: any;
            areasForAssessmentCount: number;
            avgDistanceToFacilityKm: number;
            avgDistanceToRoadKm: number;
        };
        facilitiesInventory: any;
        capacityAndDemand: {
            installedStorageCapacityTonnes: any;
            usableStorageCapacityTonnes: any;
            occupiedStorageCapacityTonnes: any;
            estimatedDemandTonnes: number;
            potentialCapacityGapTonnes: number;
            formula: string;
            cropComparisons: {
                crop_name: string;
                production_mt: number;
                pct_sold: number;
                pct_stored: number;
                pct_consumed: number;
                pct_lost: number;
                handled_volume_mt: number;
                estimated_demand_mt: number;
                compatible_usable_capacity_mt: any;
                potential_capacity_gap_mt: number;
                shelf_life_category: string;
                gap_status: string;
                handling_notes: string;
            }[];
            facilityTypeBreakdown: {
                type: string;
                count: any;
                capacity_tonnes: any;
            }[];
            demandMethodologyNotes: string;
        };
        postHarvestLosses: {
            overallLossRatePct: number;
            totalQuantityLostTonnes: number;
            stages: {
                stage_name: string;
                stage_order: number;
                loss_rate_pct: number;
                quantity_lost_mt: number;
                denominator_definition: string;
                evidence_type: string;
                primary_vulnerable_crops: string[];
                documented_causes: string;
                recommended_intervention: string;
            }[];
            lossFormula: string;
            scientificSafeguards: {
                measuredVsEstimatedRule: string;
                denominatorClarity: string;
            };
        };
        temporalComparison: {
            indicator: string;
            unit: string;
            current_value: any;
            compare_value: any;
            abs_change: number;
            pct_change: string;
            comparability_status: string;
            notes: string;
        }[];
        accessAndSpatialGaps: {
            sectors: any;
            summary: {
                criticalDeficitSectorsCount: any;
                moderateDeficitSectorsCount: any;
                adequateSectorsCount: any;
                sectorsWithUnknownStatusFacsCount: any;
                highColdChainDeficitSectorsCount: any;
            };
        };
        priorityInvestmentAreas: {
            rank: number;
            site_name: string;
            sector_name: any;
            priority_tier: string;
            focus_crops: any;
            production_volume_mt: any;
            market_surplus_mt: any;
            nearby_facilities_summary: string;
            available_usable_capacity_mt: any;
            evidence_of_loss: string;
            estimated_gap_mt: any;
            calculation_method: string;
            missing_data_uncertainty: string;
            suggested_next_step: string;
            estimated_budget_rwf: number;
            target_beneficiaries_households: number;
        }[];
        interventionsMonitoring: any;
        dataCoverageAndQuality: {
            primarySources: string[];
            capacityUnitDefinitions: {
                installedCapacity: string;
                usableCapacity: string;
                occupiedCapacity: string;
                throughput: string;
                estimatedDemand: string;
            };
            safeguards: string[];
        };
    }>;
    getExports(district?: string, season?: string, compareSeason?: string, compareMode?: string, auth?: string): Promise<{
        district: {
            id: any;
            name: any;
            code: any;
            province: any;
        };
        season: {
            active: string;
            comparison: string | null;
            active_label: any;
            comparison_label: any;
        };
        availableSeasons: any[];
        summaryKPIs: {
            totalCropProductionTonnes: any;
            potentialMarketableSurplusTonnes: any;
            estimatedExportableVolumeTonnes: any;
            exportLinkedCropsCount: any;
            totalRecordedCropsCount: any;
            areasForExportAssessmentCount: any;
            exportReadinessScore: number;
            exportTier: any;
            nearestExitHub: any;
            distanceToExitKm: number;
            exportReadyCooperativesCount: number;
            qualityCertificationPct: number;
        };
        cropExportPortfolio: any;
        temporalComparison: any;
        marketableSurplusModel: {
            formula: string;
            surplusSummary: {
                totalProductionMT: any;
                totalMarketableSurplusMT: any;
                totalExportableSurplusMT: any;
                avgSurplusRatioPct: number;
            };
            methodologyNotes: string;
        };
        marketAndTradeIntelligence: {
            targetMarkets: {
                region: string;
                keyProducts: string;
                marketEntryRequirements: string;
                pricingEnvironment: string;
            }[];
        };
        opportunityRanking: any;
        exportReadinessAndConstraints: {
            crossModuleConstraints: {
                domain: string;
                description: string;
            }[];
        };
        recommendationsAndMonitoring: {
            districtActionRoadmap: {
                phase: string;
                action: string;
            }[];
            activeInterventions: any;
        };
        dataCoverageAndQuality: {
            primarySources: string[];
            safeguardPrinciples: string[];
        };
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
