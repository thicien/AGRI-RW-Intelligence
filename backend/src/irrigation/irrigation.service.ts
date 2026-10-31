import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class IrrigationService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * 1. Overview Summary of Seasonal Irrigation Coverage
   */
  async getSummary(seasonCode: string = '2026B') {
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

  /**
   * 2. All 30 Districts Seasonal Irrigation Statistics & Gap
   */
  async getDistricts(seasonCode: string = '2026B') {
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

  /**
   * 3. Available Seasons for Irrigation Monitoring
   */
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

  /**
   * 4. Multi-Criteria Small-Scale Irrigation Opportunity Screening & Ranking
   */
  async getOpportunityScreening(seasonCode: string = '2026B') {
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
        ROUND(COALESCE(iss.total_cultivated_ha, 0)::numeric, 1) AS total_cultivated_ha,
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
      ORDER BY iss.modern_irrigated_ha DESC NULLS LAST, iss.opportunity_score DESC;
    `;

    const rawRows = await this.dataSource.query(query, [seasonCode]);
    const rows = rawRows.map((r: any) => ({
      ...r,
      total_irrigated_ha: parseFloat(r.current_modern_irrigated_ha || 0),
      modern_irrigated_ha: parseFloat(r.current_modern_irrigated_ha || 0),
      total_cultivated_ha: parseFloat(r.total_cultivated_ha || 0),
      irrigation_potential_tier: r.feasibility_tier,
    }));

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
      rankings: rows,
    };
  }

  /**
   * 5. Documented Irrigation Schemes & Infrastructure
   */
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
      features: rows.map((r: any) => ({
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
      rawAssets: rows,
      schemes: rows,
    };
  }

  /**
   * 6. In-Depth Engineering Pre-Feasibility Dossier for a Selected District
   */
  async getSiteDossier(districtIdentifier: string, seasonCode: string = '2026B') {
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
    if (!districtData || districtData.length === 0) return null;

    const row = districtData[0];

    // Fetch crops cultivated in this district for crop water demand overlay
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

    // Fetch existing irrigation assets in this district
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

  /**
   * 7. National Irrigation Planning & Opportunity Decision Workspace
   */
  async getDecisionWorkspace(
    seasonCode: string = '2025A',
    compareSeasonCode?: string,
    province: string = 'ALL',
    facilityType: string = 'ALL',
  ) {
    // 1. Available Seasons
    const seasonsRes = await this.dataSource.query(`
      SELECT DISTINCT s.season_code, s.year, s.name, s.official_label
      FROM agrilens.seasons s
      JOIN agrilens.irrigation_season_statistics iss ON iss.season_id = s.id
      ORDER BY s.year DESC, s.season_code DESC;
    `);

    const validSeason = seasonsRes.some((s: any) => s.season_code === seasonCode)
      ? seasonCode
      : (seasonsRes[0]?.season_code || '2025A');

    // 2. Comparable season
    let validCompareSeason = compareSeasonCode;
    if (!validCompareSeason) {
      const match = validSeason.match(/^(\d{4})([A-Za-z])$/);
      if (match) {
        const yr = parseInt(match[1], 10) - 1;
        const letter = match[2].toUpperCase();
        const candidate = `${yr}${letter}`;
        if (seasonsRes.some((s: any) => s.season_code === candidate)) {
          validCompareSeason = candidate;
        }
      }
      if (!validCompareSeason) {
        const currIdx = seasonsRes.findIndex((s: any) => s.season_code === validSeason);
        validCompareSeason = seasonsRes[currIdx + 1]?.season_code || seasonsRes[1]?.season_code || validSeason;
      }
    }

    // 3. Facility Types catalog
    const facilityTypesRes = await this.dataSource.query(`
      SELECT DISTINCT irrigation_type, COUNT(*) as count
      FROM agrilens.irrigation_assets
      GROUP BY irrigation_type
      ORDER BY count DESC, irrigation_type ASC;
    `);

    // 4. National summary current season
    const currentSummaryRes = await this.dataSource.query(`
      SELECT 
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(SUM(iss.total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
        ROUND((COALESCE(SUM(iss.area_irrigated_ha), 0) / NULLIF(SUM(iss.total_cultivated_ha), 0) * 100)::numeric, 2) AS coverage_pct,
        COUNT(DISTINCT iss.admin_unit_id) AS districts_reporting
      FROM agrilens.irrigation_season_statistics iss
      JOIN agrilens.seasons s ON s.id = iss.season_id
      WHERE s.season_code = $1;
    `, [validSeason]);
    const currSummary = currentSummaryRes[0] || {};

    // Compare season summary
    const compareSummaryRes = await this.dataSource.query(`
      SELECT 
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(SUM(iss.total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
        ROUND((COALESCE(SUM(iss.area_irrigated_ha), 0) / NULLIF(SUM(iss.total_cultivated_ha), 0) * 100)::numeric, 2) AS coverage_pct
      FROM agrilens.irrigation_season_statistics iss
      JOIN agrilens.seasons s ON s.id = iss.season_id
      WHERE s.season_code = $1;
    `, [validCompareSeason]);
    const prevSummary = compareSummaryRes[0] || {};

    const currIrr = Number(currSummary.total_irrigated_ha || 0);
    const prevIrr = Number(prevSummary.total_irrigated_ha || 0);
    const currCult = Number(currSummary.total_cultivated_ha || 0);
    const prevCult = Number(prevSummary.total_cultivated_ha || 0);
    const currCov = Number(currSummary.coverage_pct || 0);
    const prevCov = Number(prevSummary.coverage_pct || 0);

    const irrChangePct = prevIrr > 0 ? Math.round(((currIrr - prevIrr) / prevIrr) * 1000) / 10 : null;
    const cultChangePct = prevCult > 0 ? Math.round(((currCult - prevCult) / prevCult) * 1000) / 10 : null;
    const covChangePct = prevCov > 0 ? Math.round(((currCov - prevCov) / prevCov) * 1000) / 10 : null;

    // Infrastructure overall summary
    const assetsSummaryRes = await this.dataSource.query(`
      SELECT 
        COUNT(DISTINCT ia.id) AS documented_facilities_count,
        ROUND(COALESCE(SUM(ia.area_command_ha), 0)::numeric, 1) AS total_command_area_ha,
        ROUND(COALESCE(SUM(ia.area_irrigable_ha), 0)::numeric, 1) AS total_irrigable_area_ha,
        COALESCE(SUM(ia.beneficiaries_count), 0) AS total_beneficiaries
      FROM agrilens.irrigation_assets ia;
    `);
    const assetsSummary = assetsSummaryRes[0] || {};

    const nationalSummary = {
      season: validSeason,
      compareSeason: validCompareSeason,
      total_irrigated_ha: currIrr,
      prev_irrigated_ha: prevIrr > 0 ? prevIrr : null,
      irrigated_change_pct: irrChangePct,
      total_cultivated_ha: currCult,
      prev_cultivated_ha: prevCult > 0 ? prevCult : null,
      cultivated_change_pct: cultChangePct,
      national_coverage_pct: currCov,
      prev_coverage_pct: prevCov > 0 ? prevCov : null,
      coverage_change_pct: covChangePct,
      documented_facilities_count: Number(assetsSummary.documented_facilities_count || 0),
      total_command_area_ha: Number(assetsSummary.total_command_area_ha || 0),
      total_irrigable_area_ha: Number(assetsSummary.total_irrigable_area_ha || 0),
      total_beneficiaries: Number(assetsSummary.total_beneficiaries || 0),
      districts_reporting: Number(currSummary.districts_reporting || 0),
      districts_expected: 30,
      data_coverage_pct: Math.round(((Number(currSummary.districts_reporting || 0)) / 30) * 100),
      calculation_rule_note: 'Irrigation coverage is calculated strictly as Irrigated Area ÷ Cultivated Area within the same seasonal agricultural cycle.',
    };

    // 5. District Level Statistics (30 Districts) with CTEs
    const districtStatsQuery = `
      WITH curr AS (
        SELECT 
          iss.admin_unit_id,
          ROUND(COALESCE(iss.area_irrigated_ha, 0)::numeric, 1) AS area_irrigated_ha,
          ROUND(COALESCE(iss.total_cultivated_ha, 0)::numeric, 1) AS cultivated_area_ha,
          ROUND(COALESCE(iss.irrigation_access_pct, 0)::numeric, 2) AS coverage_pct,
          ROUND(COALESCE(iss.water_deficit_mm, 0)::numeric, 0) AS water_deficit_mm,
          ROUND(COALESCE(iss.drought_vulnerability_index, 0)::numeric, 2) AS drought_index,
          ROUND(COALESCE(iss.terrain_slope_pct, 0)::numeric, 1) AS terrain_slope_pct,
          ROUND(COALESCE(iss.water_source_distance_km, 0)::numeric, 1) AS water_source_distance_km,
          ROUND(COALESCE(iss.road_distance_km, 0)::numeric, 1) AS road_distance_km,
          ROUND(COALESCE(iss.opportunity_score, 0)::numeric, 1) AS opportunity_score,
          iss.feasibility_tier,
          iss.recommended_technology,
          iss.irrigation_type_breakdown,
          iss.soil_texture,
          ROUND(COALESCE(iss.soil_ph, 0)::numeric, 1) AS soil_ph,
          iss.feasibility_prerequisites,
          COUNT(iss.id) AS current_records_count
        FROM agrilens.irrigation_season_statistics iss
        WHERE iss.season_id = (SELECT id FROM agrilens.seasons WHERE season_code = $1 LIMIT 1)
        GROUP BY 
          iss.admin_unit_id, iss.area_irrigated_ha, iss.total_cultivated_ha, iss.irrigation_access_pct,
          iss.water_deficit_mm, iss.drought_vulnerability_index, iss.terrain_slope_pct,
          iss.water_source_distance_km, iss.road_distance_km, iss.opportunity_score,
          iss.feasibility_tier, iss.recommended_technology, iss.irrigation_type_breakdown,
          iss.soil_texture, iss.soil_ph, iss.feasibility_prerequisites
      ),
      prev AS (
        SELECT 
          iss.admin_unit_id,
          ROUND(COALESCE(iss.area_irrigated_ha, 0)::numeric, 1) AS prev_irrigated_ha,
          ROUND(COALESCE(iss.irrigation_access_pct, 0)::numeric, 2) AS prev_coverage_pct
        FROM agrilens.irrigation_season_statistics iss
        WHERE iss.season_id = (SELECT id FROM agrilens.seasons WHERE season_code = $2 LIMIT 1)
      ),
      facilities AS (
        SELECT 
          ia.admin_unit_id,
          COUNT(ia.id) AS facility_count,
          ROUND(COALESCE(SUM(ia.area_command_ha), 0)::numeric, 1) AS documented_command_ha,
          ROUND(COALESCE(SUM(ia.area_irrigable_ha), 0)::numeric, 1) AS documented_irrigable_ha,
          COALESCE(SUM(ia.beneficiaries_count), 0) AS total_beneficiaries
        FROM agrilens.irrigation_assets ia
        GROUP BY ia.admin_unit_id
      )
      SELECT 
        au.id AS district_id,
        au.name AS district_name,
        au.code AS district_code,
        prov.name AS province_name,
        COALESCE(curr.area_irrigated_ha, 0) AS area_irrigated_ha,
        COALESCE(curr.cultivated_area_ha, 0) AS cultivated_area_ha,
        COALESCE(curr.coverage_pct, 0) AS coverage_pct,
        prev.prev_irrigated_ha,
        prev.prev_coverage_pct,
        COALESCE(curr.current_records_count, 0) AS current_records_count,
        COALESCE(f.facility_count, 0) AS facility_count,
        COALESCE(f.documented_command_ha, 0) AS documented_command_ha,
        COALESCE(f.documented_irrigable_ha, 0) AS documented_irrigable_ha,
        COALESCE(f.total_beneficiaries, 0) AS total_beneficiaries,
        curr.water_deficit_mm,
        curr.drought_index,
        curr.terrain_slope_pct,
        curr.water_source_distance_km,
        curr.road_distance_km,
        curr.opportunity_score,
        curr.feasibility_tier,
        curr.recommended_technology,
        curr.irrigation_type_breakdown,
        curr.soil_texture,
        curr.soil_ph,
        curr.feasibility_prerequisites
      FROM agrilens.administrative_units au
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      LEFT JOIN curr ON curr.admin_unit_id = au.id
      LEFT JOIN prev ON prev.admin_unit_id = au.id
      LEFT JOIN facilities f ON f.admin_unit_id = au.id
      WHERE au.unit_type = 'DISTRICT'
      ORDER BY COALESCE(curr.area_irrigated_ha, 0) DESC;
    `;

    const districtRows = await this.dataSource.query(districtStatsQuery, [validSeason, validCompareSeason]);

    // Rank by coverage % as well
    const byCoverage = [...districtRows].sort((a, b) => Number(b.coverage_pct || 0) - Number(a.coverage_pct || 0));
    const coverageRankMap = new Map<string, number>();
    byCoverage.forEach((d, idx) => coverageRankMap.set(d.district_id, idx + 1));

    const processedDistricts = districtRows.map((r: any, idx: number) => {
      const irr = Number(r.area_irrigated_ha || 0);
      const prevI = Number(r.prev_irrigated_ha || 0);
      const cov = Number(r.coverage_pct || 0);
      const prevC = Number(r.prev_coverage_pct || 0);
      const hasData = Number(r.current_records_count) > 0;
      const sharePct = currIrr > 0 ? Math.round((irr / currIrr) * 1000) / 10 : 0;
      const chgPct = (prevI > 0 && hasData) ? Math.round(((irr - prevI) / prevI) * 1000) / 10 : null;
      const covChgPct = (prevC > 0 && hasData) ? Math.round(((cov - prevC) / prevC) * 1000) / 10 : null;

      return {
        district_id: r.district_id,
        district_name: r.district_name,
        district_code: r.district_code,
        province_name: r.province_name,
        area_irrigated_ha: hasData ? irr : null,
        cultivated_area_ha: hasData ? Number(r.cultivated_area_ha || 0) : null,
        coverage_pct: hasData ? cov : null,
        prev_irrigated_ha: prevI > 0 ? prevI : null,
        prev_coverage_pct: prevC > 0 ? prevC : null,
        irrigated_change_pct: chgPct,
        coverage_change_pct: covChgPct,
        national_share_pct: sharePct,
        rank: idx + 1,
        coverage_rank: coverageRankMap.get(r.district_id) || (idx + 1),
        has_data: hasData,
        facility_count: Number(r.facility_count || 0),
        documented_command_ha: Number(r.documented_command_ha || 0),
        documented_irrigable_ha: Number(r.documented_irrigable_ha || 0),
        total_beneficiaries: Number(r.total_beneficiaries || 0),
        water_deficit_mm: Number(r.water_deficit_mm || 0),
        drought_index: Number(r.drought_index || 0),
        terrain_slope_pct: Number(r.terrain_slope_pct || 0),
        water_source_distance_km: Number(r.water_source_distance_km || 0),
        road_distance_km: Number(r.road_distance_km || 0),
        opportunity_score: Number(r.opportunity_score || 0),
        feasibility_tier: r.feasibility_tier || 'TIER_4_MICRO_CATCHMENT_ONLY',
        recommended_technology: r.recommended_technology || 'Solar Micro-Drip',
        irrigation_type_breakdown: r.irrigation_type_breakdown || {},
        soil_texture: r.soil_texture || 'Clay Loam',
        soil_ph: Number(r.soil_ph || 5.8),
        feasibility_prerequisites: r.feasibility_prerequisites || [
          'Verify seasonal stream flow rate with Meteo Rwanda / RWB',
          'Conduct topographical survey for gravity head alignment',
          'Assess cooperative willingness to manage O&M tariffs',
        ],
      };
    });

    // 6. Chronological multi-season irrigation trends
    const trendsQuery = `
      SELECT 
        s.season_code,
        s.year,
        s.name,
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS total_irrigated_ha,
        ROUND(COALESCE(SUM(iss.total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
        ROUND((COALESCE(SUM(iss.area_irrigated_ha), 0) / NULLIF(SUM(iss.total_cultivated_ha), 0) * 100)::numeric, 2) AS coverage_pct
      FROM agrilens.seasons s
      JOIN agrilens.irrigation_season_statistics iss ON iss.season_id = s.id
      GROUP BY s.season_code, s.year, s.name
      ORDER BY s.year ASC, s.season_code ASC;
    `;
    const trendsRes = await this.dataSource.query(trendsQuery);
    const validTrends = trendsRes.map((r: any) => ({
      season_code: r.season_code,
      year: r.year,
      name: r.name,
      total_irrigated_ha: Number(r.total_irrigated_ha || 0),
      total_cultivated_ha: Number(r.total_cultivated_ha || 0),
      coverage_pct: Number(r.coverage_pct || 0),
    }));

    // 7. Documented Facilities from agrilens.irrigation_assets
    const facilitiesQuery = `
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
        COALESCE(ia.beneficiaries_count, 0) AS beneficiaries_count,
        ia.operator_name,
        ia.status,
        ST_X(ia.location) AS longitude,
        ST_Y(ia.location) AS latitude
      FROM agrilens.irrigation_assets ia
      JOIN agrilens.administrative_units au ON au.id = ia.admin_unit_id
      JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      ORDER BY ia.area_command_ha DESC NULLS LAST;
    `;
    const facilitiesRows = await this.dataSource.query(facilitiesQuery);
    const facilitiesList = facilitiesRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      district_name: r.district_name,
      district_code: r.district_code,
      province_name: r.province_name,
      irrigation_type: r.irrigation_type,
      water_source: r.water_source,
      irrigation_method: r.irrigation_method,
      area_command_ha: Number(r.area_command_ha || 0),
      area_irrigable_ha: Number(r.area_irrigable_ha || 0),
      beneficiaries_count: Number(r.beneficiaries_count || 0),
      operator_name: r.operator_name,
      status: r.status,
      longitude: Number(r.longitude || 0),
      latitude: Number(r.latitude || 0),
    }));

    // 8. Alerts: Expanding, Declining, Stable
    const validWithPrev = processedDistricts.filter((d: any) => d.irrigated_change_pct !== null);
    const alerts = {
      large_expansions: validWithPrev.filter((d: any) => (d.irrigated_change_pct ?? 0) >= 10),
      large_declines: validWithPrev.filter((d: any) => (d.irrigated_change_pct ?? 0) <= -10),
      stable_districts: validWithPrev.filter((d: any) => Math.abs(d.irrigated_change_pct ?? 0) <= 3),
    };

    // 9. Potential Irrigation Intervention Opportunities (Evidence-Based Screening)
    const candidateDistricts = processedDistricts
      .filter((d: any) => d.has_data)
      .map((d: any) => {
        const gapHa = Math.max(0, (d.cultivated_area_ha || 0) - (d.area_irrigated_ha || 0));
        let flagReason = 'Potential Area for Assessment: High cultivated footprint with low recorded irrigation';
        if ((d.coverage_pct ?? 0) < 2.0) {
          flagReason = 'Potential Area for Assessment: Critical coverage gap (<2%) in high agricultural zone';
        } else if ((d.water_deficit_mm ?? 0) > 160) {
          flagReason = 'Potential Area for Assessment: Severe seasonal water deficit and drought exposure';
        }

        return {
          district_id: d.district_id,
          district_name: d.district_name,
          province_name: d.province_name,
          coverage_pct: d.coverage_pct,
          area_irrigated_ha: d.area_irrigated_ha,
          cultivated_area_ha: d.cultivated_area_ha,
          irrigation_gap_ha: gapHa,
          water_deficit_mm: d.water_deficit_mm,
          drought_index: d.drought_index,
          terrain_slope_pct: d.terrain_slope_pct,
          opportunity_score: d.opportunity_score,
          feasibility_tier: d.feasibility_tier,
          recommended_technology: d.recommended_technology,
          flag_reason: flagReason,
          existing_facilities_count: d.facility_count,
          existing_command_ha: d.documented_command_ha,
          mandatory_checks: [
            'Verify seasonal stream/river gauge data with Meteo Rwanda & RWB',
            'Conduct detailed slope and soil infiltration test (<8% gradient optimal)',
            'Confirm land tenure and environmental safeguard clearance from REMA',
            'Validate farmers cooperative willingness and water tariff structure',
          ],
        };
      })
      .sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);

    return {
      meta: {
        selectedSeason: validSeason,
        compareSeason: validCompareSeason,
        availableSeasons: seasonsRes.map((s: any) => ({ code: s.season_code, label: s.name, year: s.year })),
        availableFacilityTypes: facilityTypesRes.map((f: any) => ({ type: f.irrigation_type, count: parseInt(f.count, 10) })),
      },
      nationalSummary,
      districts: processedDistricts,
      seasonalTrends: validTrends,
      facilitiesList,
      alerts,
      opportunityScreening: {
        candidateDistricts: candidateDistricts.slice(0, 10),
        criteriaWeights: [
          { name: 'Agricultural Intensity & Cultivated Area', weightPct: 25, rationale: 'Prioritizes locations where crop production volume is significant.' },
          { name: 'Seasonal Water Deficit & Drought Risk', weightPct: 25, rationale: 'Identifies where precipitation gaps cause crop failure.' },
          { name: 'Water Resource Proximity', weightPct: 25, rationale: 'Assesses proximity to perennial water bodies, lakes, and rivers.' },
          { name: 'Terrain & Slope Suitability', weightPct: 15, rationale: 'Rewards gentle gradients that lower pumping head and erosion.' },
          { name: 'Road & Post-Harvest Transport Access', weightPct: 10, rationale: 'Ensures harvested irrigated output reaches cold storage or markets.' },
        ],
        safeguardNotice: 'CRITICAL PLANNING SAFEGUARD: A map showing low recorded irrigation does not automatically conclude that an area has available water, suitable terrain, or economic viability. Wording is strictly designated as "Potential Area for Assessment" pending technical field investigation.',
      },
    };
  }
}

