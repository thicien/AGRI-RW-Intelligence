"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHarvestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let PostHarvestService = class PostHarvestService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getSummary(seasonCode = '2026B') {
        const summaryQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND(COALESCE(SUM(total_crop_production_mt), 0)::numeric, 1) AS total_crop_production_mt,
        ROUND(COALESCE(SUM(market_surplus_volume_mt), 0)::numeric, 1) AS total_market_surplus_volume_mt,
        ROUND(COALESCE(SUM(documented_storage_capacity_mt), 0)::numeric, 1) AS total_documented_storage_capacity_mt,
        ROUND(COALESCE(SUM(documented_processing_capacity_mt_day), 0)::numeric, 1) AS total_processing_capacity_mt_day,
        ROUND(COALESCE(SUM(cold_storage_capacity_mt), 0)::numeric, 1) AS total_cold_storage_capacity_mt,
        ROUND(COALESCE(SUM(drying_capacity_mt_day), 0)::numeric, 1) AS total_drying_capacity_mt_day,
        ROUND(COALESCE(SUM(storage_capacity_gap_mt), 0)::numeric, 1) AS total_storage_capacity_gap_mt,
        ROUND(AVG(storage_utilization_pct)::numeric, 1) AS national_avg_utilization_pct,
        ROUND(AVG(pct_harvest_sold)::numeric, 1) AS national_avg_sold_pct,
        ROUND(AVG(pct_harvest_consumed)::numeric, 1) AS national_avg_consumed_pct,
        ROUND(AVG(pct_harvest_stored)::numeric, 1) AS national_avg_stored_pct,
        ROUND(AVG(pct_harvest_lost)::numeric, 1) AS national_avg_lost_pct,
        ROUND(AVG(avg_distance_to_facility_km)::numeric, 1) AS national_avg_distance_facility_km,
        ROUND(AVG(avg_distance_to_paved_road_km)::numeric, 1) AS national_avg_distance_road_km,
        ROUND(AVG(investment_opportunity_score)::numeric, 1) AS national_avg_investment_score,
        COUNT(CASE WHEN capacity_status = 'CRITICAL_DEFICIT' THEN 1 END) AS critical_deficit_districts_count,
        COUNT(CASE WHEN capacity_status = 'MODERATE_DEFICIT' THEN 1 END) AS moderate_deficit_districts_count,
        COUNT(CASE WHEN verification_status = 'SURVEY_REQUIRED' THEN 1 END) AS survey_required_districts_count,
        COUNT(CASE WHEN investment_tier = 'TIER_1_URGENT_COLLECTION_HUB' THEN 1 END) AS tier1_urgent_districts_count
      FROM agrilens.post_harvest_season_statistics
      WHERE season_code = $1
      GROUP BY season_code, year, season_name;
    `;
        const facilitiesSummaryQuery = `
      SELECT 
        COUNT(id) AS total_documented_facilities,
        COUNT(CASE WHEN status = 'OPERATIONAL' THEN 1 END) AS operational_facilities,
        COUNT(CASE WHEN facility_type = 'SILO' THEN 1 END) AS silos_count,
        COUNT(CASE WHEN facility_type = 'WAREHOUSE' THEN 1 END) AS warehouses_count,
        COUNT(CASE WHEN facility_type = 'COLD_STORAGE' THEN 1 END) AS cold_stores_count,
        COUNT(CASE WHEN facility_type = 'PROCESSING_PLANT' THEN 1 END) AS processing_plants_count,
        COUNT(CASE WHEN facility_type = 'COLLECTION_CENTER' THEN 1 END) AS collection_centers_count,
        ROUND(COALESCE(SUM(storage_capacity_tonnes), 0)::numeric, 1) AS total_facility_storage_tonnes,
        ROUND(COALESCE(SUM(processing_capacity_tonnes_day), 0)::numeric, 1) AS total_facility_processing_tonnes_day
      FROM agrilens.agri_facilities;
    `;
        const cropProductionQuery = `
      SELECT 
        ROUND(COALESCE(SUM(maize_production_mt), 0)::numeric, 1) AS total_maize_mt,
        ROUND(COALESCE(SUM(beans_production_mt), 0)::numeric, 1) AS total_beans_mt,
        ROUND(COALESCE(SUM(irish_potato_production_mt), 0)::numeric, 1) AS total_irish_potato_mt,
        ROUND(COALESCE(SUM(cassava_production_mt), 0)::numeric, 1) AS total_cassava_mt,
        ROUND(COALESCE(SUM(paddy_rice_production_mt), 0)::numeric, 1) AS total_paddy_rice_mt,
        ROUND(COALESCE(SUM(banana_production_mt), 0)::numeric, 1) AS total_banana_mt,
        ROUND(COALESCE(SUM(vegetables_fruits_production_mt), 0)::numeric, 1) AS total_vegetables_fruits_mt
      FROM agrilens.post_harvest_season_statistics
      WHERE season_code = $1;
    `;
        const [summaryRes, facilitiesRes, cropsRes] = await Promise.all([
            this.dataSource.query(summaryQuery, [seasonCode]),
            this.dataSource.query(facilitiesSummaryQuery),
            this.dataSource.query(cropProductionQuery, [seasonCode]),
        ]);
        const summary = summaryRes[0] || {};
        const facilities = facilitiesRes[0] || {};
        const crops = cropsRes[0] || {};
        return {
            season: seasonCode,
            metrics: {
                total_crop_production_mt: Number(summary.total_crop_production_mt || 0),
                total_market_surplus_volume_mt: Number(summary.total_market_surplus_volume_mt || 0),
                total_documented_storage_capacity_mt: Number(summary.total_documented_storage_capacity_mt || 0),
                total_processing_capacity_mt_day: Number(summary.total_processing_capacity_mt_day || 0),
                total_cold_storage_capacity_mt: Number(summary.total_cold_storage_capacity_mt || 0),
                total_drying_capacity_mt_day: Number(summary.total_drying_capacity_mt_day || 0),
                total_storage_capacity_gap_mt: Number(summary.total_storage_capacity_gap_mt || 0),
                national_avg_utilization_pct: Number(summary.national_avg_utilization_pct || 0),
                national_avg_sold_pct: Number(summary.national_avg_sold_pct || 0),
                national_avg_consumed_pct: Number(summary.national_avg_consumed_pct || 0),
                national_avg_stored_pct: Number(summary.national_avg_stored_pct || 0),
                national_avg_lost_pct: Number(summary.national_avg_lost_pct || 0),
                national_avg_distance_facility_km: Number(summary.national_avg_distance_facility_km || 0),
                national_avg_distance_road_km: Number(summary.national_avg_distance_road_km || 0),
                national_avg_investment_score: Number(summary.national_avg_investment_score || 0),
                critical_deficit_districts_count: Number(summary.critical_deficit_districts_count || 0),
                moderate_deficit_districts_count: Number(summary.moderate_deficit_districts_count || 0),
                survey_required_districts_count: Number(summary.survey_required_districts_count || 0),
                tier1_urgent_districts_count: Number(summary.tier1_urgent_districts_count || 0),
            },
            crop_breakdown_mt: {
                maize: Number(crops.total_maize_mt || 0),
                beans: Number(crops.total_beans_mt || 0),
                irish_potato: Number(crops.total_irish_potato_mt || 0),
                cassava: Number(crops.total_cassava_mt || 0),
                paddy_rice: Number(crops.total_paddy_rice_mt || 0),
                banana: Number(crops.total_banana_mt || 0),
                vegetables_fruits: Number(crops.total_vegetables_fruits_mt || 0),
            },
            facilities_infrastructure: {
                total_documented_facilities: Number(facilities.total_documented_facilities || 0),
                operational_facilities: Number(facilities.operational_facilities || 0),
                silos_count: Number(facilities.silos_count || 0),
                warehouses_count: Number(facilities.warehouses_count || 0),
                cold_stores_count: Number(facilities.cold_stores_count || 0),
                processing_plants_count: Number(facilities.processing_plants_count || 0),
                collection_centers_count: Number(facilities.collection_centers_count || 0),
                total_facility_storage_tonnes: Number(facilities.total_facility_storage_tonnes || 0),
                total_facility_processing_tonnes_day: Number(facilities.total_facility_processing_tonnes_day || 0),
            },
            safeguard_notice: {
                title: 'Critical Safeguard Notice on Post-Harvest Data',
                content: "A facility's absence from our database does not prove that no facility exists in the area. Label these as unrecorded facilities or potential coverage gaps until local verification is completed. Similarly, do not claim that a specific percentage of produce is lost unless the loss data supports that estimate.",
                nisr_source: 'NISR Seasonal Agricultural Survey Table 13 (Production) & Table 14 (Farmer Use of Produce).',
            },
        };
    }
    async getDistricts(seasonCode = '2026B') {
        const query = `
      SELECT 
        s.id,
        s.district_name,
        s.province_name,
        s.season_code,
        s.year,
        s.season_name,
        s.total_crop_production_mt,
        s.maize_production_mt,
        s.beans_production_mt,
        s.irish_potato_production_mt,
        s.cassava_production_mt,
        s.paddy_rice_production_mt,
        s.banana_production_mt,
        s.vegetables_fruits_production_mt,
        s.pct_harvest_sold,
        s.pct_harvest_consumed,
        s.pct_harvest_stored,
        s.pct_harvest_lost,
        s.market_surplus_volume_mt,
        s.documented_storage_capacity_mt,
        s.documented_processing_capacity_mt_day,
        s.cold_storage_capacity_mt,
        s.drying_capacity_mt_day,
        s.storage_capacity_gap_mt,
        s.storage_utilization_pct,
        s.capacity_status,
        s.verification_status,
        s.avg_distance_to_facility_km,
        s.avg_distance_to_paved_road_km,
        s.documented_facilities_count,
        s.primary_processed_products,
        s.investment_opportunity_score,
        s.investment_tier,
        s.recommended_investment,
        s.evidence_sources,
        ROUND(ST_X(ST_Centroid(u.geometry))::numeric, 4) AS longitude,
        ROUND(ST_Y(ST_Centroid(u.geometry))::numeric, 4) AS latitude
      FROM agrilens.post_harvest_season_statistics s
      LEFT JOIN agrilens.administrative_units u ON s.admin_unit_id = u.id
      WHERE s.season_code = $1
      ORDER BY s.investment_opportunity_score DESC, s.market_surplus_volume_mt DESC;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return rows.map((r) => ({
            ...r,
            total_crop_production_mt: Number(r.total_crop_production_mt),
            maize_production_mt: Number(r.maize_production_mt),
            beans_production_mt: Number(r.beans_production_mt),
            irish_potato_production_mt: Number(r.irish_potato_production_mt),
            cassava_production_mt: Number(r.cassava_production_mt),
            paddy_rice_production_mt: Number(r.paddy_rice_production_mt),
            banana_production_mt: Number(r.banana_production_mt),
            vegetables_fruits_production_mt: Number(r.vegetables_fruits_production_mt),
            pct_harvest_sold: Number(r.pct_harvest_sold),
            pct_harvest_consumed: Number(r.pct_harvest_consumed),
            pct_harvest_stored: Number(r.pct_harvest_stored),
            pct_harvest_lost: Number(r.pct_harvest_lost),
            market_surplus_volume_mt: Number(r.market_surplus_volume_mt),
            documented_storage_capacity_mt: Number(r.documented_storage_capacity_mt),
            documented_processing_capacity_mt_day: Number(r.documented_processing_capacity_mt_day),
            cold_storage_capacity_mt: Number(r.cold_storage_capacity_mt),
            drying_capacity_mt_day: Number(r.drying_capacity_mt_day),
            storage_capacity_gap_mt: Number(r.storage_capacity_gap_mt),
            storage_utilization_pct: Number(r.storage_utilization_pct),
            avg_distance_to_facility_km: Number(r.avg_distance_to_facility_km),
            avg_distance_to_paved_road_km: Number(r.avg_distance_to_paved_road_km),
            documented_facilities_count: Number(r.documented_facilities_count),
            investment_opportunity_score: Number(r.investment_opportunity_score),
            longitude: r.longitude ? Number(r.longitude) : 30.0,
            latitude: r.latitude ? Number(r.latitude) : -1.9,
        }));
    }
    async getSeasons() {
        const query = `
      SELECT 
        season_code,
        year,
        season_name,
        COUNT(district_name) AS districts_covered,
        ROUND(SUM(total_crop_production_mt)::numeric, 0) AS total_production_mt,
        ROUND(SUM(market_surplus_volume_mt)::numeric, 0) AS total_market_surplus_mt
      FROM agrilens.post_harvest_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year DESC, season_code DESC;
    `;
        const rows = await this.dataSource.query(query);
        return rows.map((r) => ({
            season_code: r.season_code,
            year: Number(r.year),
            season_name: r.season_name,
            districts_covered: Number(r.districts_covered),
            total_production_mt: Number(r.total_production_mt),
            total_market_surplus_mt: Number(r.total_market_surplus_mt),
        }));
    }
    async getFacilities() {
        const query = `
      SELECT 
        f.id,
        f.name,
        f.facility_code,
        f.facility_type,
        f.status,
        f.owner_type,
        f.operator_name,
        ROUND(f.storage_capacity_tonnes::numeric, 1) AS storage_capacity_tonnes,
        ROUND(f.processing_capacity_tonnes_day::numeric, 1) AS processing_capacity_tonnes_day,
        ROUND(f.drying_capacity_tonnes_day::numeric, 1) AS drying_capacity_tonnes_day,
        ROUND(f.cold_storage_capacity_tonnes::numeric, 1) AS cold_storage_capacity_tonnes,
        f.year_established,
        f.last_verified_at,
        f.attributes,
        u.name AS district_name,
        ROUND(ST_X(f.location)::numeric, 5) AS longitude,
        ROUND(ST_Y(f.location)::numeric, 5) AS latitude
      FROM agrilens.agri_facilities f
      LEFT JOIN agrilens.administrative_units u ON f.admin_unit_id = u.id
      ORDER BY f.storage_capacity_tonnes DESC;
    `;
        const rows = await this.dataSource.query(query);
        return rows.map((r) => ({
            ...r,
            storage_capacity_tonnes: Number(r.storage_capacity_tonnes || 0),
            processing_capacity_tonnes_day: Number(r.processing_capacity_tonnes_day || 0),
            drying_capacity_tonnes_day: Number(r.drying_capacity_tonnes_day || 0),
            cold_storage_capacity_tonnes: Number(r.cold_storage_capacity_tonnes || 0),
            longitude: r.longitude ? Number(r.longitude) : 30.0,
            latitude: r.latitude ? Number(r.latitude) : -1.9,
        }));
    }
    async getGapScreening(seasonCode = '2026B') {
        const query = `
      SELECT 
        s.district_name,
        s.province_name,
        s.season_code,
        s.investment_opportunity_score,
        s.investment_tier,
        s.market_surplus_volume_mt,
        s.total_crop_production_mt,
        s.storage_capacity_gap_mt,
        s.documented_storage_capacity_mt,
        s.documented_processing_capacity_mt_day,
        s.avg_distance_to_facility_km,
        s.avg_distance_to_paved_road_km,
        s.capacity_status,
        s.verification_status,
        s.primary_processed_products,
        s.recommended_investment,
        ROUND(ST_X(ST_Centroid(u.geometry))::numeric, 4) AS longitude,
        ROUND(ST_Y(ST_Centroid(u.geometry))::numeric, 4) AS latitude
      FROM agrilens.post_harvest_season_statistics s
      LEFT JOIN agrilens.administrative_units u ON s.admin_unit_id = u.id
      WHERE s.season_code = $1
      ORDER BY s.investment_opportunity_score DESC;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return rows.map((r, index) => ({
            rank: index + 1,
            district_name: r.district_name,
            province_name: r.province_name,
            season_code: r.season_code,
            investment_opportunity_score: Number(r.investment_opportunity_score),
            investment_tier: r.investment_tier,
            market_surplus_volume_mt: Number(r.market_surplus_volume_mt),
            total_crop_production_mt: Number(r.total_crop_production_mt),
            storage_capacity_gap_mt: Number(r.storage_capacity_gap_mt),
            documented_storage_capacity_mt: Number(r.documented_storage_capacity_mt),
            documented_processing_capacity_mt_day: Number(r.documented_processing_capacity_mt_day),
            avg_distance_to_facility_km: Number(r.avg_distance_to_facility_km),
            avg_distance_to_paved_road_km: Number(r.avg_distance_to_paved_road_km),
            capacity_status: r.capacity_status,
            verification_status: r.verification_status,
            primary_processed_products: r.primary_processed_products || [],
            recommended_investment: r.recommended_investment || {},
            longitude: r.longitude ? Number(r.longitude) : 30.0,
            latitude: r.latitude ? Number(r.latitude) : -1.9,
        }));
    }
    async getSiteDossier(districtName = 'Nyagatare', seasonCode = '2026B') {
        const currentQuery = `
      SELECT 
        s.*,
        ROUND(ST_X(ST_Centroid(u.geometry))::numeric, 4) AS longitude,
        ROUND(ST_Y(ST_Centroid(u.geometry))::numeric, 4) AS latitude
      FROM agrilens.post_harvest_season_statistics s
      LEFT JOIN agrilens.administrative_units u ON s.admin_unit_id = u.id
      WHERE s.district_name = $1 AND s.season_code = $2;
    `;
        const trendQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        total_crop_production_mt,
        market_surplus_volume_mt,
        storage_capacity_gap_mt,
        pct_harvest_sold,
        pct_harvest_lost,
        investment_opportunity_score
      FROM agrilens.post_harvest_season_statistics
      WHERE district_name = $1
      ORDER BY year ASC, season_code ASC;
    `;
        const facilitiesQuery = `
      SELECT 
        f.name,
        f.facility_type,
        f.status,
        f.storage_capacity_tonnes,
        f.processing_capacity_tonnes_day,
        f.drying_capacity_tonnes_day,
        f.cold_storage_capacity_tonnes,
        f.operator_name,
        ROUND(ST_X(f.location)::numeric, 5) AS longitude,
        ROUND(ST_Y(f.location)::numeric, 5) AS latitude
      FROM agrilens.agri_facilities f
      LEFT JOIN agrilens.administrative_units u ON f.admin_unit_id = u.id
      WHERE u.name = $1;
    `;
        const [currentRes, trendRes, facilitiesRes] = await Promise.all([
            this.dataSource.query(currentQuery, [districtName, seasonCode]),
            this.dataSource.query(trendQuery, [districtName]),
            this.dataSource.query(facilitiesQuery, [districtName]),
        ]);
        const current = currentRes[0] || null;
        return {
            district_name: districtName,
            season: seasonCode,
            current_status: current
                ? {
                    ...current,
                    total_crop_production_mt: Number(current.total_crop_production_mt),
                    maize_production_mt: Number(current.maize_production_mt),
                    beans_production_mt: Number(current.beans_production_mt),
                    irish_potato_production_mt: Number(current.irish_potato_production_mt),
                    cassava_production_mt: Number(current.cassava_production_mt),
                    paddy_rice_production_mt: Number(current.paddy_rice_production_mt),
                    banana_production_mt: Number(current.banana_production_mt),
                    vegetables_fruits_production_mt: Number(current.vegetables_fruits_production_mt),
                    market_surplus_volume_mt: Number(current.market_surplus_volume_mt),
                    documented_storage_capacity_mt: Number(current.documented_storage_capacity_mt),
                    documented_processing_capacity_mt_day: Number(current.documented_processing_capacity_mt_day),
                    cold_storage_capacity_mt: Number(current.cold_storage_capacity_mt),
                    drying_capacity_mt_day: Number(current.drying_capacity_mt_day),
                    storage_capacity_gap_mt: Number(current.storage_capacity_gap_mt),
                    storage_utilization_pct: Number(current.storage_utilization_pct),
                    pct_harvest_sold: Number(current.pct_harvest_sold),
                    pct_harvest_consumed: Number(current.pct_harvest_consumed),
                    pct_harvest_stored: Number(current.pct_harvest_stored),
                    pct_harvest_lost: Number(current.pct_harvest_lost),
                    avg_distance_to_facility_km: Number(current.avg_distance_to_facility_km),
                    avg_distance_to_paved_road_km: Number(current.avg_distance_to_paved_road_km),
                    investment_opportunity_score: Number(current.investment_opportunity_score),
                    longitude: current.longitude ? Number(current.longitude) : 30.0,
                    latitude: current.latitude ? Number(current.latitude) : -1.9,
                }
                : null,
            local_facilities: facilitiesRes.map((f) => ({
                ...f,
                storage_capacity_tonnes: Number(f.storage_capacity_tonnes || 0),
                processing_capacity_tonnes_day: Number(f.processing_capacity_tonnes_day || 0),
                drying_capacity_tonnes_day: Number(f.drying_capacity_tonnes_day || 0),
                cold_storage_capacity_tonnes: Number(f.cold_storage_capacity_tonnes || 0),
                longitude: f.longitude ? Number(f.longitude) : null,
                latitude: f.latitude ? Number(f.latitude) : null,
            })),
            historical_trend: trendRes.map((t) => ({
                season_code: t.season_code,
                year: Number(t.year),
                season_name: t.season_name,
                total_crop_production_mt: Number(t.total_crop_production_mt),
                market_surplus_volume_mt: Number(t.market_surplus_volume_mt),
                storage_capacity_gap_mt: Number(t.storage_capacity_gap_mt),
                pct_harvest_sold: Number(t.pct_harvest_sold),
                pct_harvest_lost: Number(t.pct_harvest_lost),
                investment_opportunity_score: Number(t.investment_opportunity_score),
            })),
            safeguard_disclaimer: "CRITICAL SAFEGUARD: A facility's absence from our database does not prove that no facility exists in this area. Label these as unrecorded facilities or potential coverage gaps until local verification is completed. Similarly, do not claim that a specific percentage of produce is lost unless the loss data supports that estimate.",
        };
    }
};
exports.PostHarvestService = PostHarvestService;
exports.PostHarvestService = PostHarvestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], PostHarvestService);
//# sourceMappingURL=post-harvest.service.js.map