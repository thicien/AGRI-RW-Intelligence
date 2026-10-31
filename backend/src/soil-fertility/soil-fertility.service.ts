import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SoilFertilityService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * 1. Overview Summary of Soil Conservation & Fertility
   */
  async getSummary(seasonCode: string = '2026B') {
    const summaryQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND(COALESCE(SUM(total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
        ROUND(COALESCE(SUM(erosion_control_ha), 0)::numeric, 1) AS total_erosion_control_ha,
        ROUND((COALESCE(SUM(erosion_control_ha), 0) / NULLIF(SUM(total_cultivated_ha), 0) * 100)::numeric, 1) AS national_erosion_control_pct,
        ROUND(COALESCE(SUM(agroforestry_ha), 0)::numeric, 1) AS total_agroforestry_ha,
        ROUND(COALESCE(SUM(organic_fertilizer_ha), 0)::numeric, 1) AS total_organic_fertilizer_ha,
        ROUND(AVG(organic_farmer_pct)::numeric, 1) AS national_avg_organic_farmer_pct,
        ROUND(COALESCE(SUM(inorganic_fertilizer_ha), 0)::numeric, 1) AS total_inorganic_fertilizer_ha,
        ROUND(AVG(inorganic_farmer_pct)::numeric, 1) AS national_avg_inorganic_farmer_pct,
        ROUND(AVG(fert_npk_pct)::numeric, 1) AS avg_npk_pct,
        ROUND(AVG(fert_urea_pct)::numeric, 1) AS avg_urea_pct,
        ROUND(AVG(fert_dap_pct)::numeric, 1) AS avg_dap_pct,
        ROUND(AVG(fert_lime_pct)::numeric, 1) AS avg_lime_pct,
        ROUND(AVG(soil_ph)::numeric, 2) AS national_avg_soil_ph,
        ROUND(AVG(modelled_erosion_susceptibility_index)::numeric, 1) AS national_avg_erosion_susceptibility,
        ROUND(COALESCE(SUM(conservation_gap_ha), 0)::numeric, 1) AS total_conservation_gap_ha,
        ROUND(COALESCE(SUM(radical_terracing_gap_ha), 0)::numeric, 1) AS total_radical_terracing_gap_ha,
        ROUND(AVG(crop_yield_maize_kg_ha)::numeric, 0) AS national_avg_maize_yield,
        ROUND(AVG(crop_yield_beans_kg_ha)::numeric, 0) AS national_avg_beans_yield,
        ROUND(AVG(crop_yield_potato_kg_ha)::numeric, 0) AS national_avg_potato_yield,
        COUNT(CASE WHEN acidity_status = 'HIGH_ACIDIC_CRITICAL' THEN 1 END) AS high_acidity_districts_count,
        COUNT(CASE WHEN degree_severe_pct >= 2.0 THEN 1 END) AS severe_erosion_hotspots_count,
        COUNT(CASE WHEN priority_tier = 'TIER_1_URGENT_INTERVENTION' THEN 1 END) AS tier1_priority_districts_count
      FROM agrilens.soil_fertility_season_statistics
      WHERE season_code = $1
      GROUP BY season_code, year, season_name;
    `;

    const projectsQuery = `
      SELECT 
        COUNT(id) AS total_projects_count,
        COUNT(CASE WHEN status = 'OPERATIONAL' THEN 1 END) AS operational_projects_count,
        ROUND(COALESCE(SUM(command_area_ha), 0)::numeric, 1) AS total_command_area_ha,
        COALESCE(SUM(beneficiary_farmers), 0) AS total_beneficiary_farmers
      FROM agrilens.soil_conservation_projects;
    `;

    const [summaryRes, projectsRes] = await Promise.all([
      this.dataSource.query(summaryQuery, [seasonCode]),
      this.dataSource.query(projectsQuery),
    ]);

    return {
      season: seasonCode,
      overview: summaryRes[0] || {
        season_code: seasonCode,
        total_cultivated_ha: 0,
        total_erosion_control_ha: 0,
        national_erosion_control_pct: 0,
        total_agroforestry_ha: 0,
        total_organic_fertilizer_ha: 0,
        total_inorganic_fertilizer_ha: 0,
        national_avg_inorganic_farmer_pct: 0,
        total_radical_terracing_gap_ha: 0,
        high_acidity_districts_count: 0,
        severe_erosion_hotspots_count: 0,
      },
      projectsSummary: projectsRes[0] || {},
    };
  }

  /**
   * 2. All 30 Districts Seasonal Soil Conservation & Fertility Statistics
   */
  async getDistricts(seasonCode: string = '2026B') {
    const query = `
      SELECT 
        id,
        district_name,
        province_name,
        season_code,
        year,
        season_name,
        total_cultivated_ha,
        erosion_control_ha,
        erosion_control_pct,
        agroforestry_ha,
        organic_fertilizer_ha,
        organic_farmer_pct,
        organic_plot_pct,
        inorganic_fertilizer_ha,
        inorganic_farmer_pct,
        inorganic_plot_pct,
        fert_npk_pct,
        fert_urea_pct,
        fert_dap_pct,
        fert_lime_pct,
        fert_other_pct,
        erosion_low_rate_pct,
        erosion_mod_rate_pct,
        erosion_severe_rate_pct,
        degree_severe_pct,
        degree_moderate_pct,
        degree_low_pct,
        degree_very_low_pct,
        soil_ph,
        acidity_status,
        lime_requirement_tons_per_ha,
        organic_carbon_pct,
        soil_texture,
        cation_exchange_capacity_meq,
        nitrogen_rating,
        phosphorus_rating,
        potassium_rating,
        modelled_erosion_susceptibility_index,
        slope_steep_pct,
        slope_moderate_pct,
        slope_gentle_pct,
        seasonal_rainfall_mm,
        rainfall_erosivity_index,
        conservation_gap_ha,
        radical_terracing_gap_ha,
        crop_yield_maize_kg_ha,
        crop_yield_beans_kg_ha,
        crop_yield_potato_kg_ha,
        crop_yield_cassava_kg_ha,
        productivity_index,
        priority_score,
        priority_tier,
        evidence_sources,
        indicator_breakdown,
        recommended_interventions
      FROM agrilens.soil_fertility_season_statistics
      WHERE season_code = $1
      ORDER BY priority_score DESC, district_name ASC;
    `;

    return this.dataSource.query(query, [seasonCode]);
  }

  /**
   * 3. Catalog of Available Seasons
   */
  async getSeasons() {
    const query = `
      SELECT DISTINCT 
        season_code,
        year,
        season_name,
        COUNT(district_name) AS districts_reported
      FROM agrilens.soil_fertility_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year DESC, season_code DESC;
    `;

    return this.dataSource.query(query);
  }

  /**
   * 4. Multi-Criteria Priority Ranking
   */
  async getPriorityRanking(seasonCode: string = '2026B') {
    const query = `
      SELECT 
        district_name,
        province_name,
        season_code,
        priority_score,
        priority_tier,
        soil_ph,
        acidity_status,
        lime_requirement_tons_per_ha,
        degree_severe_pct,
        degree_moderate_pct,
        erosion_severe_rate_pct,
        modelled_erosion_susceptibility_index,
        slope_steep_pct,
        conservation_gap_ha,
        radical_terracing_gap_ha,
        inorganic_farmer_pct,
        organic_farmer_pct,
        evidence_sources,
        indicator_breakdown,
        recommended_interventions
      FROM agrilens.soil_fertility_season_statistics
      WHERE season_code = $1
      ORDER BY priority_score DESC;
    `;

    const rankedDistricts = await this.dataSource.query(query, [seasonCode]);

    return {
      season: seasonCode,
      criteriaWeights: [
        { criterion: 'Severe Erosion Risk & Terrain Slope Hazard', weightPercent: 35, metric: 'degree_severe_pct + slope_steep_pct + erosion_severe_rate_pct' },
        { criterion: 'Measured Soil Acidity Deficit & Lime Need', weightPercent: 30, metric: 'soil_ph < 5.5 (lime requirement t/ha)' },
        { criterion: 'Steep Slope Radical Terracing Gap', weightPercent: 20, metric: 'conservation_gap_ha & radical_terracing_gap_ha' },
        { criterion: 'Fertilizer Nutrient Depletion / Adoption Gap', weightPercent: 15, metric: '100 - inorganic_farmer_pct' },
      ],
      rankedDistricts,
    };
  }

  /**
   * 5. Catalog of Documented Soil Conservation Projects
   */
  async getProjects() {
    const query = `
      SELECT 
        id,
        code,
        name,
        district_name,
        province_name,
        project_type,
        command_area_ha,
        beneficiary_farmers,
        status,
        primary_technologies,
        funding_source,
        key_impact
      FROM agrilens.soil_conservation_projects
      ORDER BY command_area_ha DESC;
    `;

    return this.dataSource.query(query);
  }

  /**
   * 6. Multi-Season Practice Adoption vs. Crop Productivity Trajectory
   */
  async getHistoricalCorrelation(districtName: string = 'Gicumbi') {
    const query = `
      SELECT 
        season_code,
        year,
        season_name,
        erosion_control_pct,
        organic_farmer_pct,
        inorganic_farmer_pct,
        crop_yield_maize_kg_ha,
        crop_yield_beans_kg_ha,
        crop_yield_potato_kg_ha,
        productivity_index
      FROM agrilens.soil_fertility_season_statistics
      WHERE LOWER(TRIM(district_name)) = LOWER(TRIM($1))
      ORDER BY year ASC, season_code ASC;
    `;

    const rows = await this.dataSource.query(query, [districtName]);
    return {
      district: districtName,
      timeline: rows,
    };
  }

  /**
   * 7. Detailed District Site Pre-Feasibility Dossier with Critical Safeguard Separation
   */
  async getSiteDossier(districtName: string, seasonCode: string = '2026B') {
    const query = `
      SELECT 
        sf.*,
        p.name AS matching_project_name,
        p.code AS matching_project_code,
        p.primary_technologies AS project_technologies,
        p.funding_source,
        p.key_impact
      FROM agrilens.soil_fertility_season_statistics sf
      LEFT JOIN agrilens.soil_conservation_projects p 
        ON LOWER(TRIM(p.district_name)) = LOWER(TRIM(sf.district_name))
      WHERE LOWER(TRIM(sf.district_name)) = LOWER(TRIM($1))
        AND sf.season_code = $2;
    `;

    const res = await this.dataSource.query(query, [districtName, seasonCode]);
    if (!res || res.length === 0) {
      return null;
    }

    const row = res[0];

    // Explicit 3-Way Indicator Separation (Critical Safeguard)
    const threeWayIndicatorSeparation = {
      measuredSoilCondition: {
        title: 'Indicator 1: Measured Soil Condition (Laboratory & Field Tested)',
        ph: Number(row.soil_ph),
        acidityStatus: row.acidity_status,
        limeRequirementTonsPerHa: Number(row.lime_requirement_tons_per_ha),
        soilOrganicCarbonPct: Number(row.organic_carbon_pct),
        soilTexture: row.soil_texture,
        cationExchangeCapacityMeq: Number(row.cation_exchange_capacity_meq),
        nitrogenRating: row.nitrogen_rating,
        phosphorusRating: row.phosphorus_rating,
        potassiumRating: row.potassium_rating,
        safeguardNote: 'Laboratory measurement reflects true soil chemistry. Do not prescribe exact lime or fertilizer without field test validation.'
      },
      modelledErosionSusceptibility: {
        title: 'Indicator 2: Modelled Erosion Susceptibility (GIS & Terrain Simulation)',
        susceptibilityIndex: Number(row.modelled_erosion_susceptibility_index),
        slopeSteepPct: Number(row.slope_steep_pct),
        slopeModeratePct: Number(row.slope_moderate_pct),
        slopeGentlePct: Number(row.slope_gentle_pct),
        seasonalRainfallMm: Number(row.seasonal_rainfall_mm),
        rainfallErosivityIndex: Number(row.rainfall_erosivity_index),
        safeguardNote: 'Modelled susceptibility reflects topography and climate hazard, NOT the current physical state of the topsoil.'
      },
      reportedPracticeAdoption: {
        title: 'Indicator 3: Reported Practice Adoption (NISR Farm Household Surveys)',
        erosionControlPct: Number(row.erosion_control_pct),
        agroforestryHa: Number(row.agroforestry_ha),
        organicFarmerPct: Number(row.organic_farmer_pct),
        inorganicFarmerPct: Number(row.inorganic_farmer_pct),
        fertilizerTypes: {
          npk: Number(row.fert_npk_pct),
          urea: Number(row.fert_urea_pct),
          dap: Number(row.fert_dap_pct),
          lime: Number(row.fert_lime_pct),
        },
        safeguardNote: 'Reported practice adoption reflects farmer-declared management, which may differ from engineering-standard execution.'
      }
    };

    // Mandatory 5-Point Engineering & Agronomic Checklist
    const engineeringChecklist = [
      {
        item: 'Soil pH & Aluminum Toxicity Survey',
        status: row.soil_ph < 5.2 ? 'CRITICAL_ACTION_REQUIRED' : 'ACCEPTABLE',
        details: row.soil_ph < 5.2 
          ? `District soil pH is ${row.soil_ph} (high acidity). Aluminum toxicity inhibits root elongation. Calcic lime application (${row.lime_requirement_tons_per_ha} t/ha) required prior to planting.`
          : `District soil pH is ${row.soil_ph}. Soil reaction is favorable for standard cereal/legume cultivation.`
      },
      {
        item: 'Slope & Severe Erosion Runoff Screen',
        status: row.degree_severe_pct > 2.0 ? 'HIGH_RISK_GULLY_HAZARD' : 'MODERATE_EROSION_RISK',
        details: `${row.degree_severe_pct}% plots suffer from severe rill/gully erosion and landslides. Modelled terrain susceptibility index is ${row.modelled_erosion_susceptibility_index}/100.`
      },
      {
        item: 'Radical Bench Terracing Unmet Need',
        status: row.conservation_gap_ha > 2000 ? 'URGENT_TERRACING_PROGRAM' : 'TARGETED_EXPANSION',
        details: `Estimated ${Number(row.conservation_gap_ha).toLocaleString()} Ha of steep cultivated hillsides require radical bench terraces with stone risers and drainage cut-offs.`
      },
      {
        item: 'Organic Matter & Agroforestry Coverage',
        status: row.agroforestry_ha > 20000 ? 'WELL_ESTABLISHED' : 'ENHANCEMENT_NEEDED',
        details: `${Number(row.agroforestry_ha).toLocaleString()} Ha under agroforestry trees. Organic fertilizer is applied by ${row.organic_farmer_pct}% of farmers.`
      },
      {
        item: 'Smart Nkunganire Subsidy Integration',
        status: 'ELIGIBLE_FOR_NATIONAL_SUBSIDY',
        details: `Subsidized NPK 17-17-17, DAP, Urea, and Agricultural Lime through MINAGRI/RAB agro-dealer network.`
      }
    ];

    const limeRequirementTotalTons = Math.round(Number(row.conservation_gap_ha || 1500) * Number(row.lime_requirement_tons_per_ha || 1.5));
    const estimatedTerracingInvestmentUsd = Math.round(Number(row.conservation_gap_ha) * 1250);

    return {
      district: row.district_name,
      province: row.province_name,
      season: row.season_code,
      threeWayIndicatorSeparation,
      cropYields: {
        maize: Number(row.crop_yield_maize_kg_ha),
        beans: Number(row.crop_yield_beans_kg_ha),
        potato: Number(row.crop_yield_potato_kg_ha),
        cassava: Number(row.crop_yield_cassava_kg_ha),
        productivityIndex: Number(row.productivity_index)
      },
      engineeringChecklist,
      soilPrescription: {
        recommendedInterventions: row.recommended_interventions,
        totalDistrictLimeNeedTons: limeRequirementTotalTons,
        estimatedTerracingBudgetUsd: estimatedTerracingInvestmentUsd,
        matchedProject: row.matching_project_name ? {
          name: row.matching_project_name,
          code: row.matching_project_code,
          technologies: row.project_technologies,
          funding: row.funding_source,
          impact: row.key_impact
        } : null
      },
      evidenceSources: row.evidence_sources
    };
  }

  /**
   * 8. National Soil Health, Fertility & Conservation Decision Intelligence Workspace
   * Provides unified national aggregates, 30-district statistics, multi-season trends,
   * documented conservation projects, and evidence-based pre-screening.
   */
  async getDecisionWorkspace(
    seasonCode: string = '2025A',
    compareSeasonCode?: string,
    province: string = 'ALL',
    layer: string = 'ALL',
    projectType: string = 'ALL',
  ) {
    // 1. Available seasons catalog
    const seasonsRes = await this.dataSource.query(`
      SELECT DISTINCT 
        season_code,
        year,
        season_name,
        COUNT(district_name) AS districts_reported
      FROM agrilens.soil_fertility_season_statistics
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

    // 2. National Summary (Current vs Comparison) using CTEs
    const nationalQuery = `
      WITH curr AS (
        SELECT 
          ROUND(COALESCE(SUM(total_cultivated_ha), 0)::numeric, 1) AS total_cultivated_ha,
          ROUND(COALESCE(SUM(erosion_control_ha), 0)::numeric, 1) AS total_erosion_control_ha,
          ROUND((COALESCE(SUM(erosion_control_ha), 0) / NULLIF(SUM(total_cultivated_ha), 0) * 100)::numeric, 1) AS national_erosion_control_pct,
          ROUND(COALESCE(SUM(agroforestry_ha), 0)::numeric, 1) AS total_agroforestry_ha,
          ROUND(COALESCE(SUM(organic_fertilizer_ha), 0)::numeric, 1) AS total_organic_fertilizer_ha,
          ROUND(AVG(organic_farmer_pct)::numeric, 1) AS national_avg_organic_farmer_pct,
          ROUND(AVG(organic_plot_pct)::numeric, 1) AS national_avg_organic_plot_pct,
          ROUND(COALESCE(SUM(inorganic_fertilizer_ha), 0)::numeric, 1) AS total_inorganic_fertilizer_ha,
          ROUND(AVG(inorganic_farmer_pct)::numeric, 1) AS national_avg_inorganic_farmer_pct,
          ROUND(AVG(inorganic_plot_pct)::numeric, 1) AS national_avg_inorganic_plot_pct,
          ROUND(AVG(fert_npk_pct)::numeric, 1) AS avg_npk_pct,
          ROUND(AVG(fert_urea_pct)::numeric, 1) AS avg_urea_pct,
          ROUND(AVG(fert_dap_pct)::numeric, 1) AS avg_dap_pct,
          ROUND(AVG(fert_lime_pct)::numeric, 1) AS avg_lime_pct,
          ROUND(AVG(fert_other_pct)::numeric, 1) AS avg_other_pct,
          ROUND(AVG(soil_ph)::numeric, 2) AS national_avg_soil_ph,
          ROUND(AVG(organic_carbon_pct)::numeric, 2) AS national_avg_organic_carbon_pct,
          ROUND(AVG(cation_exchange_capacity_meq)::numeric, 1) AS national_avg_cec,
          ROUND(AVG(modelled_erosion_susceptibility_index)::numeric, 1) AS national_avg_erosion_susceptibility,
          COUNT(CASE WHEN acidity_status = 'HIGH_ACIDIC_CRITICAL' THEN 1 END) AS high_acidity_districts_count,
          COUNT(CASE WHEN degree_severe_pct >= 2.0 THEN 1 END) AS severe_erosion_hotspots_count,
          ROUND(COALESCE(SUM(conservation_gap_ha), 0)::numeric, 1) AS total_conservation_gap_ha,
          ROUND(COALESCE(SUM(radical_terracing_gap_ha), 0)::numeric, 1) AS total_radical_terracing_gap_ha,
          COUNT(district_name) AS districts_reporting
        FROM agrilens.soil_fertility_season_statistics
        WHERE season_code = $1
      ),
      prev AS (
        SELECT 
          ROUND(COALESCE(SUM(total_cultivated_ha), 0)::numeric, 1) AS prev_cultivated_ha,
          ROUND(COALESCE(SUM(erosion_control_ha), 0)::numeric, 1) AS prev_erosion_control_ha,
          ROUND((COALESCE(SUM(erosion_control_ha), 0) / NULLIF(SUM(total_cultivated_ha), 0) * 100)::numeric, 1) AS prev_erosion_control_pct,
          ROUND(AVG(organic_farmer_pct)::numeric, 1) AS prev_organic_farmer_pct,
          ROUND(AVG(inorganic_farmer_pct)::numeric, 1) AS prev_inorganic_farmer_pct,
          ROUND(AVG(soil_ph)::numeric, 2) AS prev_soil_ph
        FROM agrilens.soil_fertility_season_statistics
        WHERE season_code = $2
      )
      SELECT curr.*, prev.* FROM curr CROSS JOIN prev;
    `;

    const nationalRes = await this.dataSource.query(nationalQuery, [validSeason, validCompareSeason || validSeason]);
    const currSummary = nationalRes[0] || {};

    // Projects overall summary
    const projectsSummaryRes = await this.dataSource.query(`
      SELECT 
        COUNT(id) AS documented_projects_count,
        ROUND(COALESCE(SUM(command_area_ha), 0)::numeric, 1) AS total_command_area_ha,
        COALESCE(SUM(beneficiary_farmers), 0) AS total_beneficiary_farmers
      FROM agrilens.soil_conservation_projects;
    `);
    const pSum = projectsSummaryRes[0] || {};

    const calcChange = (curr: number | null, prev: number | null): number | null => {
      if (curr === null || prev === null || prev === undefined || prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const erosionChangePct = calcChange(
      Number(currSummary.national_erosion_control_pct || 0),
      Number(currSummary.prev_erosion_control_pct || 0),
    );
    const inorganicChangePct = calcChange(
      Number(currSummary.national_avg_inorganic_farmer_pct || 0),
      Number(currSummary.prev_inorganic_farmer_pct || 0),
    );
    const organicChangePct = calcChange(
      Number(currSummary.national_avg_organic_farmer_pct || 0),
      Number(currSummary.prev_organic_farmer_pct || 0),
    );

    const nationalSummary = {
      season: validSeason,
      compareSeason: validCompareSeason,
      total_cultivated_ha: Number(currSummary.total_cultivated_ha || 0),
      prev_cultivated_ha: Number(currSummary.prev_cultivated_ha || 0),
      total_erosion_control_ha: Number(currSummary.total_erosion_control_ha || 0),
      national_erosion_control_pct: Number(currSummary.national_erosion_control_pct || 0),
      prev_erosion_control_pct: Number(currSummary.prev_erosion_control_pct || 0),
      erosion_control_change_pct: erosionChangePct,
      total_agroforestry_ha: Number(currSummary.total_agroforestry_ha || 0),
      total_organic_fertilizer_ha: Number(currSummary.total_organic_fertilizer_ha || 0),
      national_avg_organic_farmer_pct: Number(currSummary.national_avg_organic_farmer_pct || 0),
      national_avg_organic_plot_pct: Number(currSummary.national_avg_organic_plot_pct || 0),
      organic_change_pct: organicChangePct,
      total_inorganic_fertilizer_ha: Number(currSummary.total_inorganic_fertilizer_ha || 0),
      national_avg_inorganic_farmer_pct: Number(currSummary.national_avg_inorganic_farmer_pct || 0),
      national_avg_inorganic_plot_pct: Number(currSummary.national_avg_inorganic_plot_pct || 0),
      inorganic_change_pct: inorganicChangePct,
      fert_breakdown: {
        npk: Number(currSummary.avg_npk_pct || 0),
        urea: Number(currSummary.avg_urea_pct || 0),
        dap: Number(currSummary.avg_dap_pct || 0),
        lime: Number(currSummary.avg_lime_pct || 0),
        other: Number(currSummary.avg_other_pct || 0),
      },
      national_avg_soil_ph: Number(currSummary.national_avg_soil_ph || 0),
      national_avg_organic_carbon_pct: Number(currSummary.national_avg_organic_carbon_pct || 0),
      national_avg_cec: Number(currSummary.national_avg_cec || 0),
      national_avg_erosion_susceptibility: Number(currSummary.national_avg_erosion_susceptibility || 0),
      high_acidity_districts_count: Number(currSummary.high_acidity_districts_count || 0),
      severe_erosion_hotspots_count: Number(currSummary.severe_erosion_hotspots_count || 0),
      total_conservation_gap_ha: Number(currSummary.total_conservation_gap_ha || 0),
      total_radical_terracing_gap_ha: Number(currSummary.total_radical_terracing_gap_ha || 0),
      documented_projects_count: Number(pSum.documented_projects_count || 0),
      total_project_command_area_ha: Number(pSum.total_command_area_ha || 0),
      total_beneficiary_farmers: Number(pSum.total_beneficiary_farmers || 0),
      districts_reporting: Number(currSummary.districts_reporting || 0),
      districts_expected: 30,
      data_coverage_pct: Math.round((Number(currSummary.districts_reporting || 0) / 30) * 100),
      denominator_definition: 'Reported practice adoption reflects percentage of surveyed agricultural plots/farmers from NISR SAS; measured soil properties reflect laboratory analysis from RAB soil archives.',
    };

    // 3. Documented Conservation Projects List
    const projectsList = await this.dataSource.query(`
      SELECT 
        id, code, name, district_name, province_name, project_type,
        command_area_ha, beneficiary_farmers, status, primary_technologies,
        funding_source, key_impact
      FROM agrilens.soil_conservation_projects
      ORDER BY command_area_ha DESC;
    `);

    // Available project types
    const typeCountMap: Record<string, number> = {};
    for (const p of projectsList) {
      typeCountMap[p.project_type] = (typeCountMap[p.project_type] || 0) + 1;
    }
    const availableProjectTypes = Object.entries(typeCountMap).map(([type, count]) => ({
      type,
      count,
    }));

    // 4. District Level Statistics with CTEs
    const districtStatsQuery = `
      WITH curr AS (
        SELECT 
          sf.*
        FROM agrilens.soil_fertility_season_statistics sf
        WHERE sf.season_code = $1
      ),
      prev AS (
        SELECT 
          district_name,
          erosion_control_pct AS prev_erosion_control_pct,
          organic_farmer_pct AS prev_organic_farmer_pct,
          inorganic_farmer_pct AS prev_inorganic_farmer_pct,
          soil_ph AS prev_soil_ph
        FROM agrilens.soil_fertility_season_statistics
        WHERE season_code = $2
      )
      SELECT 
        curr.*,
        prev.prev_erosion_control_pct,
        prev.prev_organic_farmer_pct,
        prev.prev_inorganic_farmer_pct,
        prev.prev_soil_ph
      FROM curr
      LEFT JOIN prev ON LOWER(TRIM(curr.district_name)) = LOWER(TRIM(prev.district_name))
      ORDER BY curr.priority_score DESC, curr.district_name ASC;
    `;

    const districtRows = await this.dataSource.query(districtStatsQuery, [
      validSeason,
      validCompareSeason || validSeason,
    ]);

    const districts = districtRows.map((row: any) => {
      const erosionChange = calcChange(Number(row.erosion_control_pct || 0), Number(row.prev_erosion_control_pct || 0));
      const inorganicChange = calcChange(Number(row.inorganic_farmer_pct || 0), Number(row.prev_inorganic_farmer_pct || 0));
      const organicChange = calcChange(Number(row.organic_farmer_pct || 0), Number(row.prev_organic_farmer_pct || 0));

      const matchingProjects = projectsList.filter(
        (p: any) => p.district_name.toLowerCase() === row.district_name.toLowerCase()
      );

      const cultivatedHa = Number(row.total_cultivated_ha || 0);
      const agroforestryHa = Number(row.agroforestry_ha || 0);
      const agroforestryPct = cultivatedHa > 0 ? Math.round((agroforestryHa / cultivatedHa) * 1000) / 10 : 0;

      return {
        id: row.id,
        district_name: row.district_name,
        province_name: row.province_name,
        season_code: row.season_code,
        year: Number(row.year),
        season_name: row.season_name,
        total_cultivated_ha: cultivatedHa,
        
        // Erosion prevention
        erosion_control_ha: Number(row.erosion_control_ha || 0),
        erosion_control_pct: Number(row.erosion_control_pct || 0),
        prev_erosion_control_pct: row.prev_erosion_control_pct !== null ? Number(row.prev_erosion_control_pct) : null,
        erosion_control_change_pct: erosionChange,
        agroforestry_ha: agroforestryHa,
        agroforestry_pct: agroforestryPct,
        radical_terracing_gap_ha: Number(row.radical_terracing_gap_ha || 0),
        conservation_gap_ha: Number(row.conservation_gap_ha || 0),

        // Organic inputs
        organic_fertilizer_ha: Number(row.organic_fertilizer_ha || 0),
        organic_farmer_pct: Number(row.organic_farmer_pct || 0),
        organic_plot_pct: Number(row.organic_plot_pct || 0),
        prev_organic_farmer_pct: row.prev_organic_farmer_pct !== null ? Number(row.prev_organic_farmer_pct) : null,
        organic_change_pct: organicChange,

        // Mineral / Inorganic fertilizer
        inorganic_fertilizer_ha: Number(row.inorganic_fertilizer_ha || 0),
        inorganic_farmer_pct: Number(row.inorganic_farmer_pct || 0),
        inorganic_plot_pct: Number(row.inorganic_plot_pct || 0),
        prev_inorganic_farmer_pct: row.prev_inorganic_farmer_pct !== null ? Number(row.prev_inorganic_farmer_pct) : null,
        inorganic_change_pct: inorganicChange,

        // Fertilizer types breakdown
        fert_npk_pct: Number(row.fert_npk_pct || 0),
        fert_urea_pct: Number(row.fert_urea_pct || 0),
        fert_dap_pct: Number(row.fert_dap_pct || 0),
        fert_lime_pct: Number(row.fert_lime_pct || 0),
        fert_other_pct: Number(row.fert_other_pct || 0),

        // Erosion severity and degrees
        erosion_severe_rate_pct: Number(row.erosion_severe_rate_pct || 0),
        erosion_mod_rate_pct: Number(row.erosion_mod_rate_pct || 0),
        erosion_low_rate_pct: Number(row.erosion_low_rate_pct || 0),
        degree_severe_pct: Number(row.degree_severe_pct || 0),
        degree_moderate_pct: Number(row.degree_moderate_pct || 0),
        degree_low_pct: Number(row.degree_low_pct || 0),
        degree_very_low_pct: Number(row.degree_very_low_pct || 0),

        // Measured soil condition
        soil_ph: Number(row.soil_ph || 0),
        prev_soil_ph: row.prev_soil_ph !== null ? Number(row.prev_soil_ph) : null,
        acidity_status: row.acidity_status,
        lime_requirement_tons_per_ha: Number(row.lime_requirement_tons_per_ha || 0),
        organic_carbon_pct: Number(row.organic_carbon_pct || 0),
        soil_texture: row.soil_texture,
        cation_exchange_capacity_meq: Number(row.cation_exchange_capacity_meq || 0),
        nitrogen_rating: row.nitrogen_rating,
        phosphorus_rating: row.phosphorus_rating,
        potassium_rating: row.potassium_rating,

        // Modelled erosion & terrain
        modelled_erosion_susceptibility_index: Number(row.modelled_erosion_susceptibility_index || 0),
        slope_steep_pct: Number(row.slope_steep_pct || 0),
        slope_moderate_pct: Number(row.slope_moderate_pct || 0),
        slope_gentle_pct: Number(row.slope_gentle_pct || 0),
        seasonal_rainfall_mm: Number(row.seasonal_rainfall_mm || 0),
        rainfall_erosivity_index: Number(row.rainfall_erosivity_index || 0),

        // Productivity & crop yields
        crop_yield_maize_kg_ha: Number(row.crop_yield_maize_kg_ha || 0),
        crop_yield_beans_kg_ha: Number(row.crop_yield_beans_kg_ha || 0),
        crop_yield_potato_kg_ha: Number(row.crop_yield_potato_kg_ha || 0),
        crop_yield_cassava_kg_ha: Number(row.crop_yield_cassava_kg_ha || 0),
        productivity_index: Number(row.productivity_index || 0),

        // Priority & recommendations
        priority_score: Number(row.priority_score || 0),
        priority_tier: row.priority_tier,
        recommended_interventions: row.recommended_interventions,
        evidence_sources: row.evidence_sources,
        indicator_breakdown: row.indicator_breakdown,
        has_data: true,
        matching_projects: matchingProjects,
        projects_count: matchingProjects.length,
      };
    });

    // Apply optional province filtering
    const filteredDistricts = province && province !== 'ALL'
      ? districts.filter((d: any) => d.province_name.toLowerCase().includes(province.toLowerCase()))
      : districts;

    // 5. Seasonal Trends (Chronological from 2014A to 2026C)
    const trendsQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND((COALESCE(SUM(erosion_control_ha), 0) / NULLIF(SUM(total_cultivated_ha), 0) * 100)::numeric, 1) AS erosion_control_pct,
        ROUND(AVG(organic_farmer_pct)::numeric, 1) AS organic_farmer_pct,
        ROUND(AVG(inorganic_farmer_pct)::numeric, 1) AS inorganic_farmer_pct,
        ROUND(AVG(soil_ph)::numeric, 2) AS avg_soil_ph,
        ROUND(COALESCE(SUM(total_cultivated_ha), 0)::numeric, 0) AS total_cultivated_ha,
        ROUND(COALESCE(SUM(erosion_control_ha), 0)::numeric, 0) AS total_erosion_control_ha
      FROM agrilens.soil_fertility_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year ASC, season_code ASC;
    `;
    const trendsRows = await this.dataSource.query(trendsQuery);
    const seasonalTrends = trendsRows.map((t: any) => ({
      season_code: t.season_code,
      year: Number(t.year),
      season_name: t.season_name,
      erosion_control_pct: Number(t.erosion_control_pct || 0),
      organic_farmer_pct: Number(t.organic_farmer_pct || 0),
      inorganic_farmer_pct: Number(t.inorganic_farmer_pct || 0),
      avg_soil_ph: Number(t.avg_soil_ph || 0),
      total_cultivated_ha: Number(t.total_cultivated_ha || 0),
      total_erosion_control_ha: Number(t.total_erosion_control_ha || 0),
    }));

    // 6. Intervention Pre-Screening Candidates (Evidence-based screening)
    const candidateDistricts = districts
      .filter((d: any) => d.priority_tier === 'TIER_1_URGENT_INTERVENTION' || d.priority_score >= 65 || d.soil_ph < 5.2 || d.degree_severe_pct >= 2.0)
      .slice(0, 8)
      .map((d: any) => {
        const flags: string[] = [];
        if (d.soil_ph < 5.2) flags.push(`Critical Acidity (pH ${d.soil_ph}, Lime need ${d.lime_requirement_tons_per_ha} t/ha)`);
        if (d.degree_severe_pct >= 2.0) flags.push(`Severe Erosion Hotspot (${d.degree_severe_pct}% plots affected)`);
        if (d.slope_steep_pct > 40) flags.push(`Steep Slope Gradient (${d.slope_steep_pct}% hillsides >25% incline)`);
        if (d.radical_terracing_gap_ha > 1500) flags.push(`Radical Terracing Gap (${d.radical_terracing_gap_ha.toLocaleString()} ha unmet)`);
        if (d.inorganic_farmer_pct < 45) flags.push(`Low Mineral Fertilizer Adoption (${d.inorganic_farmer_pct}% farmers)`);

        return {
          district_name: d.district_name,
          province_name: d.province_name,
          priority_score: d.priority_score,
          priority_tier: d.priority_tier,
          screening_flags: flags,
          measured_indicators: {
            soil_ph: d.soil_ph,
            acidity_status: d.acidity_status,
            lime_requirement_tons_per_ha: d.lime_requirement_tons_per_ha,
            organic_carbon_pct: d.organic_carbon_pct,
            cation_exchange_capacity_meq: d.cation_exchange_capacity_meq,
          },
          modelled_indicators: {
            erosion_susceptibility_index: d.modelled_erosion_susceptibility_index,
            slope_steep_pct: d.slope_steep_pct,
            rainfall_erosivity_index: d.rainfall_erosivity_index,
          },
          reported_indicators: {
            erosion_control_pct: d.erosion_control_pct,
            organic_farmer_pct: d.organic_farmer_pct,
            inorganic_farmer_pct: d.inorganic_farmer_pct,
            radical_terracing_gap_ha: d.radical_terracing_gap_ha,
          },
          pre_feasibility_checklist: [
            { step: 'Laboratory Soil Core Testing', status: 'REQUIRED_PRIOR_TO_LIME_DISTRIBUTION', note: 'Verify aluminum saturation and buffer pH across target sectors.' },
            { step: 'Micro-Catchment Terrain Survey', status: 'RECOMMENDED', note: 'Survey slope stability, stone availability, and drainage discharge pathways.' },
            { step: 'Community Mobilization & VUP Integration', status: 'RECOMMENDED', note: 'Coordinate radical terracing public works through Vision 2020 Umurenge Programme.' },
            { step: 'Smart Nkunganire Lime Subsidy Alignment', status: 'CONFIRMED_ELIGIBLE', note: 'Align with MINAGRI/RAB subsidized travertine delivery channels.' },
          ],
          missing_evidence_note: 'Plot-level soil pH variance, groundwater depth, and seasonal labor availability require field confirmation before engineering work commences.',
          institutional_safeguard: 'Flagged strictly as a Potential Area for Assessment. Does not constitute an automatic engineering prescription.',
        };
      });

    const criteriaWeights = [
      { criterion: 'Severe Erosion Risk & Slope Gradient Hazard', weightPercent: 35, description: 'Steep hillsides (>25% slope) and severe rill/gully erosion frequency.' },
      { criterion: 'Measured Soil Acidity Deficit & Lime Requirement', weightPercent: 30, description: 'Laboratory-verified soil pH < 5.5 and calcium/magnesium saturation deficit.' },
      { criterion: 'Radical Bench Terracing Unmet Need', weightPercent: 20, description: 'Documented hectares of cultivated hillsides lacking physical terrace protection.' },
      { criterion: 'Fertilizer Nutrient Depletion / Adoption Gap', weightPercent: 15, description: 'Sub-optimal mineral/organic input adoption rates relative to district target.' },
    ];

    return {
      meta: {
        monitoredSeason: validSeason,
        compareSeason: validCompareSeason,
        availableSeasons,
        availableProjectTypes,
        intelligenceLayers: [
          { id: 'fertility', label: 'Fertility-Management Adoption', defaultIndicator: 'inorganic_farmer_pct' },
          { id: 'erosion', label: 'Soil Erosion Prevention', defaultIndicator: 'erosion_control_pct' },
          { id: 'soil_condition', label: 'Measured Soil Condition', defaultIndicator: 'soil_ph' },
          { id: 'priorities', label: 'Conservation & Liming Priorities', defaultIndicator: 'priority_score' },
        ],
        dataSources: [
          'National Institute of Statistics of Rwanda (NISR), Seasonal Agricultural Survey (SAS 2014-2026)',
          'Rwanda Agriculture and Animal Resources Development Board (RAB), National Soil Information System (RwandaSIS)',
          'Ministry of Agriculture and Animal Resources (MINAGRI), Catchment Rehabilitation and Liming Programs',
        ],
      },
      nationalSummary,
      districts: filteredDistricts,
      seasonalTrends,
      projectsList,
      interventionScreening: {
        criteriaWeights,
        candidateDistricts,
      },
    };
  }
}

