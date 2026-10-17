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
exports.IrrigationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let IrrigationService = class IrrigationService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getSummary(seasonCode = '2026B') {
        const summaryQuery = `
      SELECT 
        s.season_code,
        s.year,
        s.name AS season_name,
        ROUND(COALESCE(SUM(iss.modern_irrigated_ha), 0)::numeric, 1) AS total_modern_irrigated_ha,
        ROUND(COALESCE(SUM(iss.traditional_irrigated_ha), 0)::numeric, 1) AS total_traditional_irrigated_ha,
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(SUM(iss.total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
        ROUND((COALESCE(SUM(iss.area_irrigated_ha), 0) / NULLIF(SUM(iss.total_cultivated_ha), 0) * 100)::numeric, 2) AS national_irrigation_access_pct,
        ROUND(COALESCE(SUM(iss.total_cultivated_ha) - SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS national_irrigation_gap_ha,
        ROUND(AVG(iss.opportunity_score)::numeric, 1) AS national_avg_opportunity_score,
        COUNT(CASE WHEN iss.feasibility_tier = 'TIER_1_IMMEDIATE_FEASIBILITY' THEN 1 END) AS tier1_priority_districts_count
      FROM agrilens.irrigation_season_statistics iss
      JOIN agrilens.seasons s ON s.id = iss.season_id
      WHERE s.season_code = $1
      GROUP BY s.season_code, s.year, s.name;
    `;
        const assetsQuery = `
      SELECT 
        COUNT(DISTINCT ia.id) AS documented_schemes_count,
        ROUND(COALESCE(SUM(ia.area_command_ha), 0)::numeric, 1) AS total_command_area_ha,
        ROUND(COALESCE(SUM(ia.area_irrigable_ha), 0)::numeric, 1) AS total_irrigable_area_ha,
        COALESCE(SUM(ia.beneficiaries_count), 0) AS total_scheme_beneficiaries
      FROM agrilens.irrigation_assets ia;
    `;
        const [summaryRes, assetsRes] = await Promise.all([
            this.dataSource.query(summaryQuery, [seasonCode]),
            this.dataSource.query(assetsQuery),
        ]);
        return {
            season: seasonCode,
            overview: summaryRes[0] || {
                season_code: seasonCode,
                total_modern_irrigated_ha: 0,
                total_traditional_irrigated_ha: 0,
                total_irrigated_ha: 0,
                national_irrigation_access_pct: 0,
                national_irrigation_gap_ha: 0,
                national_avg_opportunity_score: 0,
                tier1_priority_districts_count: 0,
            },
            infrastructure: assetsRes[0] || {},
        };
    }
    async getDistricts(seasonCode = '2026B') {
        const query = `
      SELECT 
        au.id AS district_id,
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        s.season_code,
        ROUND(COALESCE(iss.modern_irrigated_ha, 0)::numeric, 1) AS modern_irrigated_ha,
        ROUND(COALESCE(iss.traditional_irrigated_ha, 0)::numeric, 1) AS traditional_irrigated_ha,
        ROUND(COALESCE(iss.area_irrigated_ha, 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(iss.total_cultivated_ha, 0)::numeric, 1) AS total_cultivated_ha,
        ROUND(COALESCE(iss.irrigation_access_pct, 0)::numeric, 2) AS irrigation_access_pct,
        ROUND(GREATEST(0, COALESCE(iss.total_cultivated_ha, 0) - COALESCE(iss.area_irrigated_ha, 0))::numeric, 1) AS irrigation_gap_ha,
        ROUND(COALESCE(iss.water_deficit_mm, 0)::numeric, 0) AS water_deficit_mm,
        ROUND(COALESCE(iss.drought_vulnerability_index, 0)::numeric, 2) AS drought_vulnerability_index,
        ROUND(COALESCE(iss.terrain_slope_pct, 0)::numeric, 1) AS terrain_slope_pct,
        ROUND(COALESCE(iss.water_source_distance_km, 0)::numeric, 1) AS water_source_distance_km,
        ROUND(COALESCE(iss.road_distance_km, 0)::numeric, 1) AS road_distance_km,
        iss.soil_texture,
        ROUND(COALESCE(iss.soil_ph, 0)::numeric, 1) AS soil_ph,
        ROUND(COALESCE(iss.opportunity_score, 0)::numeric, 1) AS opportunity_score,
        iss.feasibility_tier,
        iss.recommended_technology,
        iss.irrigation_type_breakdown,
        iss.water_source_breakdown,
        COUNT(DISTINCT ia.id) AS registered_schemes_count,
        'POTENTIAL_SITE_UNVERIFIED' AS verification_status
      FROM agrilens.administrative_units au
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      JOIN agrilens.seasons s ON s.season_code = $1
      LEFT JOIN agrilens.irrigation_season_statistics iss 
        ON iss.admin_unit_id = au.id AND iss.season_id = s.id
      LEFT JOIN agrilens.irrigation_assets ia 
        ON ia.admin_unit_id = au.id
      WHERE au.unit_type = 'DISTRICT'
      GROUP BY 
        au.id, au.code, au.name, prov.name, s.season_code,
        iss.modern_irrigated_ha, iss.traditional_irrigated_ha, iss.area_irrigated_ha,
        iss.total_cultivated_ha, iss.irrigation_access_pct, iss.water_deficit_mm,
        iss.drought_vulnerability_index, iss.terrain_slope_pct, iss.water_source_distance_km,
        iss.road_distance_km, iss.soil_texture, iss.soil_ph, iss.opportunity_score,
        iss.feasibility_tier, iss.recommended_technology, iss.irrigation_type_breakdown,
        iss.water_source_breakdown
      ORDER BY iss.modern_irrigated_ha DESC NULLS LAST;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return rows;
    }
    async getSeasons() {
        const query = `
      SELECT 
        s.id,
        s.season_code,
        s.name,
        s.year,
        s.official_label,
        COUNT(iss.id) AS records_count,
        ROUND(COALESCE(SUM(iss.modern_irrigated_ha), 0)::numeric, 1) AS total_modern_irrigated_ha
      FROM agrilens.seasons s
      JOIN agrilens.irrigation_season_statistics iss ON iss.season_id = s.id
      GROUP BY s.id, s.season_code, s.name, s.year, s.official_label
      ORDER BY s.year DESC, s.season_code DESC;
    `;
        return this.dataSource.query(query);
    }
    async getOpportunityScreening(seasonCode = '2026B') {
        const query = `
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        s.season_code,
        ROUND(COALESCE(iss.opportunity_score, 0)::numeric, 1) AS opportunity_score,
        iss.feasibility_tier,
        iss.recommended_technology,
        ROUND(COALESCE(iss.modern_irrigated_ha, 0)::numeric, 1) AS current_modern_irrigated_ha,
        ROUND(COALESCE(iss.irrigation_access_pct, 0)::numeric, 2) AS current_access_pct,
        ROUND(GREATEST(0, COALESCE(iss.total_cultivated_ha, 0) - COALESCE(iss.area_irrigated_ha, 0))::numeric, 1) AS unmet_irrigation_gap_ha,
        ROUND(COALESCE(iss.water_deficit_mm, 0)::numeric, 0) AS water_deficit_mm,
        ROUND(COALESCE(iss.drought_vulnerability_index, 0)::numeric, 2) AS drought_index,
        ROUND(COALESCE(iss.terrain_slope_pct, 0)::numeric, 1) AS slope_pct,
        CASE 
          WHEN iss.terrain_slope_pct <= 5 THEN 'GENTLE_VALLEY_OR_PLAIN'
          WHEN iss.terrain_slope_pct <= 12 THEN 'MODERATE_PLATEAU_SLOPE'
          ELSE 'STEEP_EROSION_RISK_SLOPE'
        END AS terrain_classification,
        ROUND(COALESCE(iss.water_source_distance_km, 0)::numeric, 1) AS distance_to_water_km,
        ROUND(COALESCE(iss.road_distance_km, 0)::numeric, 1) AS distance_to_road_km,
        iss.soil_texture,
        ROUND(COALESCE(iss.soil_ph, 0)::numeric, 1) AS soil_ph,
        -- Score Criteria Breakdown (0-100 total)
        ROUND(LEAST(25, (iss.total_cultivated_ha / 55000.0) * 25)::numeric, 1) AS criteria_agri_intensity_score,
        ROUND((iss.drought_vulnerability_index * 25.0)::numeric, 1) AS criteria_water_deficit_score,
        ROUND(GREATEST(5, 25.0 - (iss.water_source_distance_km * 4.5))::numeric, 1) AS criteria_water_proximity_score,
        ROUND(GREATEST(2, 15.0 - (iss.terrain_slope_pct * 0.65))::numeric, 1) AS criteria_terrain_suitability_score,
        ROUND(GREATEST(2, 10.0 - (iss.road_distance_km * 2.2))::numeric, 1) AS criteria_road_market_access_score,
        iss.feasibility_prerequisites,
        'POTENTIAL SITE — PRE-FEASIBILITY VERIFICATION REQUIRED' AS mandatory_verification_label
      FROM agrilens.administrative_units au
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      JOIN agrilens.seasons s ON s.season_code = $1
      JOIN agrilens.irrigation_season_statistics iss 
        ON iss.admin_unit_id = au.id AND iss.season_id = s.id
      WHERE au.unit_type = 'DISTRICT'
      ORDER BY iss.opportunity_score DESC;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return {
            season: seasonCode,
            safeguardNotice: 'CRITICAL SAFEGUARD: A map showing low irrigation coverage is not enough to conclude that a site is suitable for irrigation. Water availability, seasonal demand, terrain, infrastructure cost, environmental constraints and legal requirements must be assessed. Model-generated locations are strictly labelled as potential sites until on-the-ground feasibility verification is conducted.',
            criteriaWeights: [
                { name: 'Agricultural Intensity & Cultivated Footprint', weightPct: 25, maxPoints: 25, rationale: 'Prioritizes areas with high cultivated land and critical crop production potential.' },
                { name: 'Water Deficit & Seasonal Drought Vulnerability', weightPct: 25, maxPoints: 25, rationale: 'Identifies where dry spells and ETc deficits cause the most severe yield penalties.' },
                { name: 'Water Resource Proximity & Availability', weightPct: 25, maxPoints: 25, rationale: 'Measures distance to reliable perennial rivers, lakes, reservoirs, or shallow aquifers.' },
                { name: 'Terrain & Slope Feasibility', weightPct: 15, maxPoints: 15, rationale: 'Rewards gentle slopes (<8%) that minimize pumping energy and infrastructure erosion risk.' },
                { name: 'Road & Market Transport Access', weightPct: 10, maxPoints: 10, rationale: 'Ensures harvested irrigated high-value produce can reach aggregation and cooling hubs.' },
            ],
            rankedPotentialSites: rows,
        };
    }
    async getSchemes() {
        const query = `
      SELECT 
        ia.id,
        ia.name,
        au.name AS district_name,
        au.code AS district_code,
        prov.name AS province_name,
        ia.irrigation_type,
        ia.water_source,
        ia.irrigation_method,
        ROUND(COALESCE(ia.area_command_ha, 0)::numeric, 1) AS area_command_ha,
        ROUND(COALESCE(ia.area_irrigable_ha, 0)::numeric, 1) AS area_irrigable_ha,
        ia.beneficiaries_count,
        ia.operator_name,
        ia.status,
        ST_X(ia.location) AS longitude,
        ST_Y(ia.location) AS latitude
      FROM agrilens.irrigation_assets ia
      JOIN agrilens.administrative_units au ON au.id = ia.admin_unit_id
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      ORDER BY ia.area_command_ha DESC NULLS LAST;
    `;
        const rows = await this.dataSource.query(query);
        return {
            type: 'FeatureCollection',
            features: rows.map((r) => ({
                type: 'Feature',
                properties: {
                    id: r.id,
                    name: r.name,
                    district: r.district_name,
                    districtCode: r.district_code,
                    province: r.province_name,
                    irrigationType: r.irrigation_type,
                    waterSource: r.water_source,
                    method: r.irrigation_method,
                    commandHa: parseFloat(r.area_command_ha),
                    irrigableHa: parseFloat(r.area_irrigable_ha),
                    beneficiaries: r.beneficiaries_count,
                    operator: r.operator_name,
                    status: r.status,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
                },
            })),
            schemesList: rows,
        };
    }
    async getSiteDossier(districtIdentifier, seasonCode = '2026B') {
        const query = `
      SELECT 
        au.id AS district_id,
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        s.season_code,
        s.year,
        s.name AS season_name,
        ROUND(COALESCE(iss.modern_irrigated_ha, 0)::numeric, 1) AS modern_irrigated_ha,
        ROUND(COALESCE(iss.traditional_irrigated_ha, 0)::numeric, 1) AS traditional_irrigated_ha,
        ROUND(COALESCE(iss.area_irrigated_ha, 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(iss.total_cultivated_ha, 0)::numeric, 1) AS total_cultivated_ha,
        ROUND(COALESCE(iss.irrigation_access_pct, 0)::numeric, 2) AS irrigation_access_pct,
        ROUND(GREATEST(0, COALESCE(iss.total_cultivated_ha, 0) - COALESCE(iss.area_irrigated_ha, 0))::numeric, 1) AS irrigation_gap_ha,
        ROUND(COALESCE(iss.water_deficit_mm, 0)::numeric, 0) AS water_deficit_mm,
        ROUND(COALESCE(iss.drought_vulnerability_index, 0)::numeric, 2) AS drought_vulnerability_index,
        ROUND(COALESCE(iss.terrain_slope_pct, 0)::numeric, 1) AS terrain_slope_pct,
        ROUND(COALESCE(iss.water_source_distance_km, 0)::numeric, 1) AS water_source_distance_km,
        ROUND(COALESCE(iss.road_distance_km, 0)::numeric, 1) AS road_distance_km,
        iss.soil_texture,
        ROUND(COALESCE(iss.soil_ph, 0)::numeric, 1) AS soil_ph,
        ROUND(COALESCE(iss.opportunity_score, 0)::numeric, 1) AS opportunity_score,
        iss.feasibility_tier,
        iss.recommended_technology,
        iss.irrigation_type_breakdown,
        iss.water_source_breakdown,
        iss.feasibility_prerequisites,
        iss.source_reference
      FROM agrilens.administrative_units au
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      JOIN agrilens.seasons s ON s.season_code = $2
      LEFT JOIN agrilens.irrigation_season_statistics iss 
        ON iss.admin_unit_id = au.id AND iss.season_id = s.id
      WHERE (LOWER(au.code) = LOWER($1) OR LOWER(au.name) = LOWER($1))
      LIMIT 1;
    `;
        const districtData = await this.dataSource.query(query, [districtIdentifier, seasonCode]);
        if (!districtData || districtData.length === 0)
            return null;
        const row = districtData[0];
        const cropsRes = await this.dataSource.query(`
      SELECT 
        c.name AS crop_name,
        ROUND(cs.area_ha::numeric, 1) AS area_ha,
        ROUND(cs.production_tonnes::numeric, 1) AS production_tonnes,
        ROUND(cs.yield_t_ha::numeric, 2) AS yield_t_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE cs.admin_unit_id = $1 AND s.season_code = $2
      ORDER BY cs.area_ha DESC
      LIMIT 8;
    `, [row.district_id, seasonCode]);
        const districtAssets = await this.dataSource.query(`
      SELECT 
        id, name, irrigation_type, water_source, irrigation_method,
        ROUND(area_command_ha::numeric, 1) AS command_ha,
        status, operator_name
      FROM agrilens.irrigation_assets
      WHERE admin_unit_id = $1;
    `, [row.district_id]);
        return {
            district: {
                id: row.district_id,
                code: row.district_code,
                name: row.district_name,
                province: row.province_name,
            },
            season: seasonCode,
            metrics: {
                modernIrrigatedHa: parseFloat(row.modern_irrigated_ha),
                traditionalIrrigatedHa: parseFloat(row.traditional_irrigated_ha),
                totalIrrigatedHa: parseFloat(row.total_irrigated_ha),
                totalCultivatedHa: parseFloat(row.total_cultivated_ha),
                accessRatePct: parseFloat(row.irrigation_access_pct),
                irrigationGapHa: parseFloat(row.irrigation_gap_ha),
                waterDeficitMm: parseFloat(row.water_deficit_mm),
                droughtIndex: parseFloat(row.drought_vulnerability_index),
                slopePct: parseFloat(row.terrain_slope_pct),
                waterSourceDistanceKm: parseFloat(row.water_source_distance_km),
                roadDistanceKm: parseFloat(row.road_distance_km),
                soilTexture: row.soil_texture,
                soilPh: parseFloat(row.soil_ph),
                opportunityScore: parseFloat(row.opportunity_score),
                feasibilityTier: row.feasibility_tier,
                recommendedTechnology: row.recommended_technology,
            },
            technologyDistribution: row.irrigation_type_breakdown || {},
            waterSourceDistribution: row.water_source_breakdown || {},
            priorityCropsAtRisk: cropsRes,
            existingSchemes: districtAssets,
            feasibilityChecklist: row.feasibility_prerequisites || [],
            provenance: row.source_reference,
            safeguardNotice: 'CRITICAL SAFEGUARD: Model-generated opportunity scores highlight prospective sites for technical investigation. They do not constitute final engineering design approval. Mandatory water balance verification and environmental impact permits from REMA/RWB must be secured prior to capital commitment.',
        };
    }
};
exports.IrrigationService = IrrigationService;
exports.IrrigationService = IrrigationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], IrrigationService);
//# sourceMappingURL=irrigation.service.js.map