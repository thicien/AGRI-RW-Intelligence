import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostHarvestService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * 1. Overview Summary of Post-Harvest Collection, Storage, Processing & Value Addition
   */
  async getSummary(seasonCode: string = '2026B') {
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
        content:
          "A facility's absence from our database does not prove that no facility exists in the area. Label these as unrecorded facilities or potential coverage gaps until local verification is completed. Similarly, do not claim that a specific percentage of produce is lost unless the loss data supports that estimate.",
        nisr_source: 'NISR Seasonal Agricultural Survey Table 13 (Production) & Table 14 (Farmer Use of Produce).',
      },
    };
  }

  /**
   * 2. All 30 Districts Post-Harvest Statistics for Given Season
   */
  async getDistricts(seasonCode: string = '2026B') {
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
    return rows.map((r: any) => ({
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

  /**
   * 3. Available Seasons List
   */
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
    return rows.map((r: any) => ({
      season_code: r.season_code,
      year: Number(r.year),
      season_name: r.season_name,
      districts_covered: Number(r.districts_covered),
      total_production_mt: Number(r.total_production_mt),
      total_market_surplus_mt: Number(r.total_market_surplus_mt),
    }));
  }

  /**
   * 4. Documented Facilities with Geographic Location & Capacity
   */
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
    return rows.map((r: any) => ({
      ...r,
      storage_capacity_tonnes: Number(r.storage_capacity_tonnes || 0),
      processing_capacity_tonnes_day: Number(r.processing_capacity_tonnes_day || 0),
      drying_capacity_tonnes_day: Number(r.drying_capacity_tonnes_day || 0),
      cold_storage_capacity_tonnes: Number(r.cold_storage_capacity_tonnes || 0),
      longitude: r.longitude ? Number(r.longitude) : 30.0,
      latitude: r.latitude ? Number(r.latitude) : -1.9,
    }));
  }

  /**
   * 5. Opportunity & Gap Screening for Post-Harvest & Processing Investments (MCDA 0-100)
   */
  async getGapScreening(seasonCode: string = '2026B') {
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
    return rows.map((r: any, index: number) => ({
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

  /**
   * 6. District Pre-Feasibility Investment Dossier
   */
  async getSiteDossier(districtName: string = 'Nyagatare', seasonCode: string = '2026B') {
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
      local_facilities: facilitiesRes.map((f: any) => ({
        ...f,
        storage_capacity_tonnes: Number(f.storage_capacity_tonnes || 0),
        processing_capacity_tonnes_day: Number(f.processing_capacity_tonnes_day || 0),
        drying_capacity_tonnes_day: Number(f.drying_capacity_tonnes_day || 0),
        cold_storage_capacity_tonnes: Number(f.cold_storage_capacity_tonnes || 0),
        longitude: f.longitude ? Number(f.longitude) : null,
        latitude: f.latitude ? Number(f.latitude) : null,
      })),
      historical_trend: trendRes.map((t: any) => ({
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
      safeguard_disclaimer:
        "CRITICAL SAFEGUARD: A facility's absence from our database does not prove that no facility exists in this area. Label these as unrecorded facilities or potential coverage gaps until local verification is completed. Similarly, do not claim that a specific percentage of produce is lost unless the loss data supports that estimate.",
    };
  }

  /**
   * 7. National Post-Harvest & Storage Decision Intelligence Workspace
   * Connects seasonal crop production with documented storage infrastructure,
   * collection facilities, cold-chain capacity, and evidence-based gap screening.
   */
  async getDecisionWorkspace(
    seasonCode: string = '2025A',
    compareSeasonCode?: string,
    province: string = 'ALL',
    layer: string = 'ALL',
    facilityType: string = 'ALL',
    crop: string = 'ALL',
  ) {
    // 1. Available Seasons Catalog
    const seasonsRes = await this.dataSource.query(`
      SELECT DISTINCT 
        season_code,
        year,
        season_name,
        COUNT(district_name) AS districts_reported
      FROM agrilens.post_harvest_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year DESC, season_code DESC;
    `);

    const availableSeasons = seasonsRes.map((s: any) => ({
      code: s.season_code,
      year: Number(s.year),
      label: `${s.season_code} (${s.year} ${s.season_name})`,
      districtsCount: Number(s.districts_reported),
    }));

    // Validate seasonCode
    const validSeason = availableSeasons.some((s: any) => s.code === seasonCode)
      ? seasonCode
      : (availableSeasons[0]?.code || '2025A');

    // Auto-determine compareSeason if not provided or identical
    let validCompareSeason = compareSeasonCode;
    if (!validCompareSeason || validCompareSeason === validSeason) {
      const currentYear = Number(validSeason.slice(0, 4));
      const currentLetter = validSeason.slice(4);
      const sameLetterPrevYear = `${currentYear - 1}${currentLetter}`;
      const foundSameLetter = availableSeasons.find((s: any) => s.code === sameLetterPrevYear);
      if (foundSameLetter) {
        validCompareSeason = sameLetterPrevYear;
      } else {
        const currIdx = availableSeasons.findIndex((s: any) => s.code === validSeason);
        validCompareSeason = (currIdx >= 0 && currIdx + 1 < availableSeasons.length)
          ? availableSeasons[currIdx + 1].code
          : '';
      }
    }

    // 2. Query All Documented Agri-Facilities (97 records)
    const facilitiesQuery = `
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
        ROUND(ST_X(f.location::geometry)::numeric, 5) AS longitude,
        ROUND(ST_Y(f.location::geometry)::numeric, 5) AS latitude
      FROM agrilens.agri_facilities f
      LEFT JOIN agrilens.administrative_units u ON f.admin_unit_id = u.id
      ORDER BY f.storage_capacity_tonnes DESC;
    `;
    const facilitiesRows = await this.dataSource.query(facilitiesQuery);
    const facilitiesList = facilitiesRows.map((f: any) => ({
      ...f,
      storage_capacity_tonnes: Number(f.storage_capacity_tonnes || 0),
      processing_capacity_tonnes_day: Number(f.processing_capacity_tonnes_day || 0),
      drying_capacity_tonnes_day: Number(f.drying_capacity_tonnes_day || 0),
      cold_storage_capacity_tonnes: Number(f.cold_storage_capacity_tonnes || 0),
      longitude: f.longitude ? Number(f.longitude) : 30.0,
      latitude: f.latitude ? Number(f.latitude) : -1.9,
    }));

    // Group facilities by type
    const facilityTypeCounts: Record<string, { count: number; storage: number; proc: number; cold: number }> = {};
    for (const f of facilitiesList) {
      if (!facilityTypeCounts[f.facility_type]) {
        facilityTypeCounts[f.facility_type] = { count: 0, storage: 0, proc: 0, cold: 0 };
      }
      facilityTypeCounts[f.facility_type].count += 1;
      facilityTypeCounts[f.facility_type].storage += f.storage_capacity_tonnes;
      facilityTypeCounts[f.facility_type].proc += f.processing_capacity_tonnes_day;
      facilityTypeCounts[f.facility_type].cold += f.cold_storage_capacity_tonnes;
    }
    const availableFacilityTypes = Object.entries(facilityTypeCounts).map(([type, stats]) => ({
      type,
      count: stats.count,
      total_storage_tonnes: Math.round(stats.storage),
      total_processing_tonnes_day: Math.round(stats.proc),
      total_cold_storage_tonnes: Math.round(stats.cold),
    }));

    // 3. National Summary (Current vs Comparison Season) using CTEs
    const nationalQuery = `
      WITH curr AS (
        SELECT 
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
          COUNT(CASE WHEN capacity_status = 'CRITICAL_DEFICIT' THEN 1 END) AS critical_deficit_districts_count,
          COUNT(CASE WHEN capacity_status = 'MODERATE_DEFICIT' THEN 1 END) AS moderate_deficit_districts_count,
          COUNT(district_name) AS districts_reporting
        FROM agrilens.post_harvest_season_statistics
        WHERE season_code = $1
      ),
      prev AS (
        SELECT 
          ROUND(COALESCE(SUM(total_crop_production_mt), 0)::numeric, 1) AS prev_crop_production_mt,
          ROUND(COALESCE(SUM(market_surplus_volume_mt), 0)::numeric, 1) AS prev_market_surplus_volume_mt,
          ROUND(COALESCE(SUM(documented_storage_capacity_mt), 0)::numeric, 1) AS prev_storage_capacity_mt,
          ROUND(COALESCE(SUM(storage_capacity_gap_mt), 0)::numeric, 1) AS prev_storage_capacity_gap_mt
        FROM agrilens.post_harvest_season_statistics
        WHERE season_code = $2
      )
      SELECT curr.*, prev.* FROM curr CROSS JOIN prev;
    `;

    const nationalRes = await this.dataSource.query(nationalQuery, [validSeason, validCompareSeason || validSeason]);
    const currSummary = nationalRes[0] || {};

    const calcChange = (curr: number | null, prev: number | null): number | null => {
      if (curr === null || prev === null || prev === undefined || prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const prodChangePct = calcChange(
      Number(currSummary.total_crop_production_mt || 0),
      Number(currSummary.prev_crop_production_mt || 0),
    );
    const surplusChangePct = calcChange(
      Number(currSummary.total_market_surplus_volume_mt || 0),
      Number(currSummary.prev_market_surplus_volume_mt || 0),
    );
    const storageChangePct = calcChange(
      Number(currSummary.total_documented_storage_capacity_mt || 0),
      Number(currSummary.prev_storage_capacity_mt || 0),
    );

    const nationalSummary = {
      season: validSeason,
      compareSeason: validCompareSeason,
      total_crop_production_mt: Number(currSummary.total_crop_production_mt || 0),
      prev_crop_production_mt: Number(currSummary.prev_crop_production_mt || 0),
      production_change_pct: prodChangePct,
      total_market_surplus_volume_mt: Number(currSummary.total_market_surplus_volume_mt || 0),
      prev_market_surplus_volume_mt: Number(currSummary.prev_market_surplus_volume_mt || 0),
      surplus_change_pct: surplusChangePct,
      total_documented_storage_capacity_mt: Number(currSummary.total_documented_storage_capacity_mt || 0),
      prev_storage_capacity_mt: Number(currSummary.prev_storage_capacity_mt || 0),
      storage_change_pct: storageChangePct,
      total_processing_capacity_mt_day: Number(currSummary.total_processing_capacity_mt_day || 0),
      total_cold_storage_capacity_mt: Number(currSummary.total_cold_storage_capacity_mt || 0),
      total_drying_capacity_mt_day: Number(currSummary.total_drying_capacity_mt_day || 0),
      total_storage_capacity_gap_mt: Number(currSummary.total_storage_capacity_gap_mt || 0),
      national_avg_utilization_pct: Number(currSummary.national_avg_utilization_pct || 0),
      national_avg_sold_pct: Number(currSummary.national_avg_sold_pct || 0),
      national_avg_consumed_pct: Number(currSummary.national_avg_consumed_pct || 0),
      national_avg_stored_pct: Number(currSummary.national_avg_stored_pct || 0),
      national_avg_lost_pct: Number(currSummary.national_avg_lost_pct || 0),
      critical_deficit_districts_count: Number(currSummary.critical_deficit_districts_count || 0),
      moderate_deficit_districts_count: Number(currSummary.moderate_deficit_districts_count || 0),
      total_documented_facilities: facilitiesList.length,
      operational_facilities_count: facilitiesList.filter((f: any) => f.status === 'OPERATIONAL').length,
      districts_reporting: Number(currSummary.districts_reporting || 0),
      districts_expected: 30,
      data_coverage_pct: Math.round((Number(currSummary.districts_reporting || 0) / 30) * 100),
      safeguard_disclaimer:
        'Potential capacity gap reflects estimated peak surplus exceeding local static storage. It highlights districts for storage assessment rather than confirmed post-harvest spoilage.',
    };

    // 4. District-Level Statistics with CTEs
    const districtStatsQuery = `
      WITH curr AS (
        SELECT 
          s.*
        FROM agrilens.post_harvest_season_statistics s
        WHERE s.season_code = $1
      ),
      prev AS (
        SELECT 
          district_name,
          total_crop_production_mt AS prev_production_mt,
          market_surplus_volume_mt AS prev_surplus_mt,
          documented_storage_capacity_mt AS prev_storage_capacity_mt,
          storage_capacity_gap_mt AS prev_gap_mt
        FROM agrilens.post_harvest_season_statistics
        WHERE season_code = $2
      )
      SELECT 
        curr.*,
        prev.prev_production_mt,
        prev.prev_surplus_mt,
        prev.prev_storage_capacity_mt,
        prev.prev_gap_mt
      FROM curr
      LEFT JOIN prev ON LOWER(TRIM(curr.district_name)) = LOWER(TRIM(prev.district_name))
      ORDER BY curr.investment_opportunity_score DESC, curr.market_surplus_volume_mt DESC;
    `;

    const districtRows = await this.dataSource.query(districtStatsQuery, [
      validSeason,
      validCompareSeason || validSeason,
    ]);

    const districts = districtRows.map((row: any) => {
      const prodChange = calcChange(Number(row.total_crop_production_mt || 0), Number(row.prev_production_mt || 0));
      const surplusChange = calcChange(Number(row.market_surplus_volume_mt || 0), Number(row.prev_surplus_mt || 0));

      const matchingFacilities = facilitiesList.filter(
        (f: any) => f.district_name && f.district_name.toLowerCase() === row.district_name.toLowerCase()
      );

      return {
        id: row.id,
        district_name: row.district_name,
        province_name: row.province_name,
        season_code: row.season_code,
        year: Number(row.year),
        season_name: row.season_name,
        
        // Production
        total_crop_production_mt: Number(row.total_crop_production_mt || 0),
        prev_production_mt: row.prev_production_mt !== null ? Number(row.prev_production_mt) : null,
        production_change_pct: prodChange,
        maize_production_mt: Number(row.maize_production_mt || 0),
        beans_production_mt: Number(row.beans_production_mt || 0),
        irish_potato_production_mt: Number(row.irish_potato_production_mt || 0),
        cassava_production_mt: Number(row.cassava_production_mt || 0),
        paddy_rice_production_mt: Number(row.paddy_rice_production_mt || 0),
        banana_production_mt: Number(row.banana_production_mt || 0),
        vegetables_fruits_production_mt: Number(row.vegetables_fruits_production_mt || 0),

        // Utilization
        pct_harvest_sold: Number(row.pct_harvest_sold || 0),
        pct_harvest_consumed: Number(row.pct_harvest_consumed || 0),
        pct_harvest_stored: Number(row.pct_harvest_stored || 0),
        pct_harvest_lost: Number(row.pct_harvest_lost || 0),
        market_surplus_volume_mt: Number(row.market_surplus_volume_mt || 0),
        prev_surplus_mt: row.prev_surplus_mt !== null ? Number(row.prev_surplus_mt) : null,
        surplus_change_pct: surplusChange,

        // Capacities & Gaps
        documented_storage_capacity_mt: Number(row.documented_storage_capacity_mt || 0),
        documented_processing_capacity_mt_day: Number(row.documented_processing_capacity_mt_day || 0),
        cold_storage_capacity_mt: Number(row.cold_storage_capacity_mt || 0),
        drying_capacity_mt_day: Number(row.drying_capacity_mt_day || 0),
        storage_capacity_gap_mt: Number(row.storage_capacity_gap_mt || 0),
        storage_utilization_pct: Number(row.storage_utilization_pct || 0),
        capacity_status: row.capacity_status,
        verification_status: row.verification_status,

        // Logistics & Investment
        avg_distance_to_facility_km: Number(row.avg_distance_to_facility_km || 0),
        avg_distance_to_paved_road_km: Number(row.avg_distance_to_paved_road_km || 0),
        documented_facilities_count: matchingFacilities.length,
        primary_processed_products: row.primary_processed_products,
        investment_opportunity_score: Number(row.investment_opportunity_score || 0),
        investment_tier: row.investment_tier,
        recommended_investment: row.recommended_investment,
        evidence_sources: row.evidence_sources,
        has_data: true,
        matching_facilities: matchingFacilities,
      };
    });

    // Apply optional province filtering
    const filteredDistricts = province && province !== 'ALL'
      ? districts.filter((d: any) => d.province_name.toLowerCase().includes(province.toLowerCase()))
      : districts;

    // 5. Multi-Season Trends (2014A to 2026C)
    const trendsQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND(COALESCE(SUM(total_crop_production_mt), 0)::numeric, 0) AS total_crop_production_mt,
        ROUND(COALESCE(SUM(market_surplus_volume_mt), 0)::numeric, 0) AS market_surplus_volume_mt,
        ROUND(COALESCE(SUM(documented_storage_capacity_mt), 0)::numeric, 0) AS documented_storage_capacity_mt,
        ROUND(COALESCE(SUM(storage_capacity_gap_mt), 0)::numeric, 0) AS storage_capacity_gap_mt,
        ROUND(AVG(pct_harvest_lost)::numeric, 1) AS avg_harvest_lost_pct
      FROM agrilens.post_harvest_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year ASC, season_code ASC;
    `;
    const trendsRows = await this.dataSource.query(trendsQuery);
    const seasonalTrends = trendsRows.map((t: any) => ({
      season_code: t.season_code,
      year: Number(t.year),
      season_name: t.season_name,
      total_crop_production_mt: Number(t.total_crop_production_mt || 0),
      market_surplus_volume_mt: Number(t.market_surplus_volume_mt || 0),
      documented_storage_capacity_mt: Number(t.documented_storage_capacity_mt || 0),
      storage_capacity_gap_mt: Number(t.storage_capacity_gap_mt || 0),
      avg_harvest_lost_pct: Number(t.avg_harvest_lost_pct || 0),
    }));

    // 6. Crop-Specific Production & Storage Profiles
    const cropTotalsQuery = `
      SELECT 
        ROUND(COALESCE(SUM(maize_production_mt), 0)::numeric, 0) AS maize_mt,
        ROUND(COALESCE(SUM(beans_production_mt), 0)::numeric, 0) AS beans_mt,
        ROUND(COALESCE(SUM(irish_potato_production_mt), 0)::numeric, 0) AS potato_mt,
        ROUND(COALESCE(SUM(cassava_production_mt), 0)::numeric, 0) AS cassava_mt,
        ROUND(COALESCE(SUM(paddy_rice_production_mt), 0)::numeric, 0) AS rice_mt,
        ROUND(COALESCE(SUM(banana_production_mt), 0)::numeric, 0) AS banana_mt,
        ROUND(COALESCE(SUM(vegetables_fruits_production_mt), 0)::numeric, 0) AS horticulture_mt
      FROM agrilens.post_harvest_season_statistics
      WHERE season_code = $1;
    `;
    const cropTotalsRes = await this.dataSource.query(cropTotalsQuery, [validSeason]);
    const ct = cropTotalsRes[0] || {};

    const cropBreakdown = [
      { crop: 'Maize (Grain)', volume_mt: Number(ct.maize_mt || 0), storageReq: 'Dry Aerated Grain Silo / Hermetic Bag', coldChainNeeded: false },
      { crop: 'Irish Potato', volume_mt: Number(ct.potato_mt || 0), storageReq: 'Diffused Light Store (DLS) / Cold Room', coldChainNeeded: true },
      { crop: 'Cassava (Roots)', volume_mt: Number(ct.cassava_mt || 0), storageReq: 'Rapid Processing / HQCF Milling (<48h)', coldChainNeeded: false },
      { crop: 'Beans (Pulses)', volume_mt: Number(ct.beans_mt || 0), storageReq: 'Dry Hermetic Storage / Warehouse', coldChainNeeded: false },
      { crop: 'Cooking & Beer Banana', volume_mt: Number(ct.banana_mt || 0), storageReq: 'Ripening / Processing / Brewery', coldChainNeeded: false },
      { crop: 'Vegetables & Fruits', volume_mt: Number(ct.horticulture_mt || 0), storageReq: 'Refrigerated Cold Chain & Packhouses', coldChainNeeded: true },
      { crop: 'Paddy Rice', volume_mt: Number(ct.rice_mt || 0), storageReq: 'Rice Mill Dry Silo & Milling Facility', coldChainNeeded: false },
    ];

    // 7. Evidence-Based Investment Pre-Screening Candidates
    const candidateDistricts = districts
      .filter((d: any) => d.investment_tier === 'TIER_1_URGENT_COLLECTION_HUB' || d.storage_capacity_gap_mt > 50000 || d.investment_opportunity_score >= 60)
      .slice(0, 8)
      .map((d: any) => {
        const flags: string[] = [];
        if (d.storage_capacity_gap_mt > 60000) flags.push(`Severe Storage Deficit (${d.storage_capacity_gap_mt.toLocaleString()} MT gap)`);
        if (d.avg_distance_to_facility_km > 7.0) flags.push(`High Smallholder Travel Radius (${d.avg_distance_to_facility_km} km to nearest facility)`);
        if (d.market_surplus_volume_mt > 80000) flags.push(`High Marketable Surplus (${d.market_surplus_volume_mt.toLocaleString()} MT)`);
        if (d.documented_processing_capacity_mt_day === 0) flags.push(`Zero Documented Agro-Processing Infrastructure`);
        if (d.cold_storage_capacity_mt === 0 && (d.vegetables_fruits_production_mt > 15000 || d.irish_potato_production_mt > 30000)) {
          flags.push(`Cold Chain Absence for Perishable Harvest`);
        }

        return {
          district_name: d.district_name,
          province_name: d.province_name,
          investment_opportunity_score: d.investment_opportunity_score,
          investment_tier: d.investment_tier,
          screening_flags: flags,
          production_metrics: {
            total_production_mt: d.total_crop_production_mt,
            market_surplus_volume_mt: d.market_surplus_volume_mt,
            maize_mt: d.maize_production_mt,
            irish_potato_mt: d.irish_potato_production_mt,
            vegetables_fruits_mt: d.vegetables_fruits_production_mt,
          },
          capacity_metrics: {
            documented_storage_mt: d.documented_storage_capacity_mt,
            processing_mt_day: d.documented_processing_capacity_mt_day,
            cold_storage_mt: d.cold_storage_capacity_mt,
            capacity_gap_mt: d.storage_capacity_gap_mt,
            facilities_count: d.documented_facilities_count,
          },
          recommended_investment: d.recommended_investment,
          pre_feasibility_checklist: [
            { step: 'Local Storage Capacity & Utilization Audit', status: 'REQUIRED_PRIOR_TO_CAPEX', note: 'Verify private, cooperative, and commercial warehouse occupancy before proposing new construction.' },
            { step: 'Logistics & Feeder Road Accessibility', status: 'RECOMMENDED', note: 'Assess unpaved feeder road conditions during peak rainy harvest seasons.' },
            { step: 'Three-Phase Industrial Power Availability', status: 'RECOMMENDED', note: 'Check grid connection stability for cold storage chillers and grain dryers.' },
            { step: 'Cooperative Governance & Offtake Agreements', status: 'REQUIRED', note: 'Validate farmer aggregation commitments with commercial aggregators or RGCC.' },
          ],
          missing_evidence_note: 'Unrecorded private storage, seasonal grain flows between adjacent districts, and informal trade volumes require field confirmation before allocating capital.',
          institutional_safeguard: 'Flagged strictly as a Potential Area for Assessment. Does not constitute an automatic infrastructure construction prescription.',
        };
      });

    const criteriaWeights = [
      { criterion: 'Market Surplus Volume Scale', weightPercent: 35, description: 'Volume of commercial harvest sold into market channels requiring storage.' },
      { criterion: 'Documented Storage Capacity Gap', weightPercent: 30, description: 'Peak seasonal surplus exceeding verified local warehouse and silo capacity.' },
      { criterion: 'Smallholder Logistics & Distance Barrier', weightPercent: 20, description: 'Average distance smallholders travel to reach collection and drying hubs.' },
      { criterion: 'Agro-Processing & Value Addition Deficit', weightPercent: 15, description: 'Lack of local milling, drying, or cold-chain infrastructure.' },
    ];

    return {
      meta: {
        monitoredSeason: validSeason,
        compareSeason: validCompareSeason,
        availableSeasons,
        availableFacilityTypes,
        availableCrops: ['ALL', 'Maize', 'Beans', 'Irish Potato', 'Cassava', 'Paddy Rice', 'Banana', 'Vegetables & Fruits'],
        intelligenceLayers: [
          { id: 'storage', label: 'Documented Storage Capacity', defaultIndicator: 'documented_storage_capacity_mt' },
          { id: 'facilities', label: 'Facility Distribution & Density', defaultIndicator: 'documented_facilities_count' },
          { id: 'gap', label: 'Production-to-Capacity Gap', defaultIndicator: 'storage_capacity_gap_mt' },
          { id: 'collection', label: 'Collection & Aggregation Infrastructure', defaultIndicator: 'market_surplus_volume_mt' },
          { id: 'processing', label: 'Agro-Processing Capacity', defaultIndicator: 'documented_processing_capacity_mt_day' },
        ],
        dataSources: [
          'National Institute of Statistics of Rwanda (NISR), Seasonal Agricultural Survey (SAS 2014-2026)',
          'Ministry of Agriculture and Animal Resources (MINAGRI) & RGCC Strategic Grain Reserve',
          'Ministry of Trade & Industry (MINICOM) National Agro-Processing Facility Register',
        ],
      },
      nationalSummary,
      districts: filteredDistricts,
      facilitiesList,
      seasonalTrends,
      cropBreakdown,
      investmentScreening: {
        criteriaWeights,
        candidateDistricts,
      },
    };
  }
}

