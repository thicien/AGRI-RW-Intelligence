import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface ProductivityFilter {
  season?: string;
  crop?: string;
  province?: string;
  district?: string;
}

@Injectable()
export class CropStatisticsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * 1. Overview Summary of Agricultural Productivity
   */
  async getSummary(seasonCode: string = '2025A') {
    const summaryQuery = `
      SELECT 
        s.season_code,
        s.year,
        ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 1) AS total_production_mt,
        ROUND(COALESCE(SUM(cs.area_ha), 0)::numeric, 1) AS total_cultivated_area_ha,
        ROUND(COALESCE(SUM(cs.harvested_area_ha), 0)::numeric, 1) AS total_harvested_area_ha,
        ROUND((COALESCE(SUM(cs.production_tonnes), 0) / NULLIF(SUM(cs.harvested_area_ha), 0))::numeric, 2) AS weighted_national_yield_t_ha,
        COUNT(DISTINCT cs.crop_id) AS total_crops_monitored,
        COUNT(DISTINCT cs.admin_unit_id) AS total_districts_monitored,
        ROUND(((SUM(cs.area_ha) - SUM(cs.harvested_area_ha)) / NULLIF(SUM(cs.area_ha), 0) * 100)::numeric, 1) AS national_unharvested_rate_pct
      FROM agrilens.crop_statistics cs
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE s.season_code = $1
      GROUP BY s.season_code, s.year;
    `;

    const topCropsQuery = `
      SELECT 
        c.name AS crop_name,
        ROUND(SUM(cs.production_tonnes)::numeric, 1) AS production_tonnes,
        ROUND(SUM(cs.area_ha)::numeric, 1) AS cultivated_area_ha,
        ROUND(SUM(cs.harvested_area_ha)::numeric, 1) AS harvested_area_ha,
        ROUND((SUM(cs.production_tonnes) / NULLIF(SUM(cs.harvested_area_ha), 0))::numeric, 2) AS yield_t_ha,
        ROUND(((SUM(cs.area_ha) - SUM(cs.harvested_area_ha)) / NULLIF(SUM(cs.area_ha), 0) * 100)::numeric, 1) AS unharvested_loss_pct
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE s.season_code = $1
      GROUP BY c.name
      ORDER BY production_tonnes DESC;
    `;

    const [summaryRes, topCropsRes] = await Promise.all([
      this.dataSource.query(summaryQuery, [seasonCode]),
      this.dataSource.query(topCropsQuery, [seasonCode]),
    ]);

    return {
      season: seasonCode,
      overview: summaryRes[0] || {
        season_code: seasonCode,
        total_production_mt: 0,
        total_cultivated_area_ha: 0,
        total_harvested_area_ha: 0,
        weighted_national_yield_t_ha: 0,
      },
      crops: topCropsRes,
    };
  }

  /**
   * 2. Compare Crops Across 30 Districts (League Table & Benchmarks)
   */
  async getDistrictComparisons(cropName: string = 'Maize', seasonCode: string = '2025A') {
    // 1. Calculate national benchmark for this crop
    const nationalBenchQuery = `
      SELECT 
        ROUND((SUM(cs.production_tonnes) / NULLIF(SUM(cs.harvested_area_ha), 0))::numeric, 2) AS national_mean_yield,
        ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS average_district_yield,
        ROUND(STDDEV_POP(cs.yield_t_ha)::numeric, 2) AS yield_std_dev
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE LOWER(c.name) = LOWER($1) AND s.season_code = $2;
    `;

    // 2. Fetch all 30 districts with provincial context and deficit calculation
    const query = `
      SELECT 
        au.id AS district_id,
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        c.name AS crop_name,
        s.season_code,
        ROUND(cs.area_ha::numeric, 1) AS cultivated_area_ha,
        ROUND(cs.harvested_area_ha::numeric, 1) AS harvested_area_ha,
        ROUND(cs.production_tonnes::numeric, 1) AS production_tonnes,
        ROUND(cs.yield_t_ha::numeric, 2) AS yield_t_ha,
        cs.yield_calculation_method,
        ROUND(GREATEST(0, cs.area_ha - cs.harvested_area_ha)::numeric, 1) AS unharvested_area_ha,
        ROUND((GREATEST(0, cs.area_ha - cs.harvested_area_ha) / NULLIF(cs.area_ha, 0) * 100)::numeric, 1) AS unharvested_rate_pct
      FROM agrilens.crop_statistics cs
      JOIN agrilens.administrative_units au ON au.id = cs.admin_unit_id
      LEFT JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE LOWER(c.name) = LOWER($1) AND s.season_code = $2
      ORDER BY cs.yield_t_ha DESC NULLS LAST;
    `;

    const [benchmarks, rows] = await Promise.all([
      this.dataSource.query(nationalBenchQuery, [cropName, seasonCode]),
      this.dataSource.query(query, [cropName, seasonCode]),
    ]);

    const nationalMean = parseFloat(benchmarks[0]?.national_mean_yield || benchmarks[0]?.average_district_yield || 1.5);
    const stdDev = parseFloat(benchmarks[0]?.yield_std_dev || 0.4);

    // Enrich rows with deficit %, z-score, and performance tier
    const enrichedRows = rows.map((r: any, idx: number) => {
      const yieldVal = parseFloat(r.yield_t_ha || 0);
      const deficitPct = nationalMean > 0 
        ? Math.round(((yieldVal - nationalMean) / nationalMean) * 1000) / 10 
        : 0;
      const zScore = stdDev > 0 
        ? Math.round(((yieldVal - nationalMean) / stdDev) * 100) / 100 
        : 0;

      let tier = 'AVERAGE';
      if (deficitPct >= 20) tier = 'SUPERIOR';
      else if (deficitPct >= 5) tier = 'ABOVE_AVERAGE';
      else if (deficitPct > -15) tier = 'AVERAGE';
      else if (deficitPct > -30) tier = 'BELOW_AVERAGE';
      else tier = 'CRITICAL_DEFICIT';

      return {
        ...r,
        rank: idx + 1,
        national_benchmark_yield: nationalMean,
        yield_deficit_pct: deficitPct,
        yield_z_score: zScore,
        performance_tier: tier,
      };
    });

    return {
      crop: cropName,
      season: seasonCode,
      nationalBenchmark: {
        meanYield: nationalMean,
        stdDev: stdDev,
        totalDistrictsReporting: rows.length,
      },
      districts: enrichedRows,
    };
  }

  /**
   * 3. Season A vs Season B Direct Comparison
   */
  async getSeasonalComparison(cropName: string = 'Maize', year: number = 2025) {
    const seasonACode = `${year}A`;
    const seasonBCode = `${year}B`;

    const query = `
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        c.name AS crop_name,
        -- Season A values
        ROUND(a.yield_t_ha::numeric, 2) AS season_a_yield,
        ROUND(a.production_tonnes::numeric, 1) AS season_a_production,
        ROUND(a.area_ha::numeric, 1) AS season_a_cultivated,
        ROUND(a.harvested_area_ha::numeric, 1) AS season_a_harvested,
        -- Season B values
        ROUND(b.yield_t_ha::numeric, 2) AS season_b_yield,
        ROUND(b.production_tonnes::numeric, 1) AS season_b_production,
        ROUND(b.area_ha::numeric, 1) AS season_b_cultivated,
        ROUND(b.harvested_area_ha::numeric, 1) AS season_b_harvested,
        -- Variations
        ROUND(((b.yield_t_ha - a.yield_t_ha) / NULLIF(a.yield_t_ha, 0) * 100)::numeric, 1) AS yield_change_pct,
        ROUND(((b.production_tonnes - a.production_tonnes) / NULLIF(a.production_tonnes, 0) * 100)::numeric, 1) AS production_change_pct,
        ROUND(((b.area_ha - a.area_ha) / NULLIF(a.area_ha, 0) * 100)::numeric, 1) AS area_change_pct
      FROM agrilens.administrative_units au
      LEFT JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      CROSS JOIN (SELECT id, name FROM agrilens.crops WHERE LOWER(name) = LOWER($1)) c
      LEFT JOIN (
        SELECT cs.* 
        FROM agrilens.crop_statistics cs
        JOIN agrilens.seasons s ON s.id = cs.season_id
        WHERE s.season_code = $2
      ) a ON a.admin_unit_id = au.id AND a.crop_id = c.id
      LEFT JOIN (
        SELECT cs.* 
        FROM agrilens.crop_statistics cs
        JOIN agrilens.seasons s ON s.id = cs.season_id
        WHERE s.season_code = $3
      ) b ON b.admin_unit_id = au.id AND b.crop_id = c.id
      WHERE au.unit_type = 'DISTRICT'
      ORDER BY yield_change_pct ASC NULLS LAST;
    `;

    const rows = await this.dataSource.query(query, [cropName, seasonACode, seasonBCode]);

    return {
      crop: cropName,
      year: year,
      seasonA: seasonACode,
      seasonB: seasonBCode,
      comparisons: rows,
    };
  }

  /**
   * 4. Multi-Season Historical Trends (2024A, 2024B, 2025A, 2025B)
   */
  async getMultiYearTrends(cropName: string = 'Maize', districtCode?: string) {
    let query = `
      SELECT 
        s.season_code,
        s.year,
        s.name AS season_name,
        c.name AS crop_name,
        ROUND(SUM(cs.production_tonnes)::numeric, 1) AS production_tonnes,
        ROUND(SUM(cs.area_ha)::numeric, 1) AS cultivated_area_ha,
        ROUND(SUM(cs.harvested_area_ha)::numeric, 1) AS harvested_area_ha,
        ROUND((SUM(cs.production_tonnes) / NULLIF(SUM(cs.harvested_area_ha), 0))::numeric, 2) AS yield_t_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      JOIN agrilens.administrative_units au ON au.id = cs.admin_unit_id
      WHERE LOWER(c.name) = LOWER($1)
    `;
    const params: any[] = [cropName];

    if (districtCode) {
      query += ` AND (LOWER(au.code) = LOWER($2) OR LOWER(au.name) = LOWER($2))`;
      params.push(districtCode);
    }

    query += `
      GROUP BY s.season_code, s.year, s.name, c.name
      ORDER BY s.year ASC, s.season_code ASC;
    `;

    const rows = await this.dataSource.query(query, params);

    return {
      crop: cropName,
      district: districtCode || 'National Total',
      trends: rows,
    };
  }

  /**
   * 5. Lower-Performing Areas & Transparent Investigation Priority Ranking
   * Ranks areas requiring agricultural extension support and field investigation.
   */
  async getUnderperformingAreas(seasonCode: string = '2025A', cropName: string = 'Maize') {
    // We join crop statistics with:
    // - climate indicators (rainfall, drought index)
    // - soil observations (soil pH)
    // - practice observations (fertilizer, terracing)
    // - irrigation stats (irrigated area)
    const query = `
      WITH crop_bench AS (
        SELECT 
          (SUM(production_tonnes) / NULLIF(SUM(harvested_area_ha), 0)) AS national_mean
        FROM agrilens.crop_statistics cs
        JOIN agrilens.crops c ON c.id = cs.crop_id
        JOIN agrilens.seasons s ON s.id = cs.season_id
        WHERE LOWER(c.name) = LOWER($1) AND s.season_code = $2
      ),
      prior_season AS (
        SELECT 
          cs.admin_unit_id,
          cs.yield_t_ha AS prior_yield
        FROM agrilens.crop_statistics cs
        JOIN agrilens.crops c ON c.id = cs.crop_id
        JOIN agrilens.seasons s ON s.id = cs.season_id
        WHERE LOWER(c.name) = LOWER($1) 
          AND s.season_code = (CASE WHEN $2 = '2025A' THEN '2024A' WHEN $2 = '2025B' THEN '2024B' ELSE '2024A' END)
      ),
      soil_ph AS (
        SELECT 
          so.admin_unit_id,
          ROUND(AVG(so.value_numeric)::numeric, 1) AS soil_ph,
          MAX(so.soil_type) AS soil_type
        FROM agrilens.soil_observations so
        JOIN agrilens.soil_indicator_types sit ON sit.id = so.indicator_type_id
        WHERE sit.code = 'SOIL_PH'
        GROUP BY so.admin_unit_id
      ),
      climate AS (
        SELECT 
          ci.admin_unit_id,
          ROUND(ci.rainfall_mm::numeric, 0) AS rainfall_mm,
          ROUND(ci.temperature_c::numeric, 1) AS temperature_c,
          ROUND(ci.drought_index::numeric, 2) AS drought_index
        FROM agrilens.climate_indicators ci
        WHERE ci.observation_date = (CASE WHEN $2 LIKE '%A' THEN '2025-01-15'::date ELSE '2025-06-15'::date END)
      ),
      irrigation AS (
        SELECT 
          iss.admin_unit_id,
          ROUND(SUM(iss.area_irrigated_ha)::numeric, 1) AS irrigated_ha
        FROM agrilens.irrigation_season_statistics iss
        JOIN agrilens.seasons s ON s.id = iss.season_id
        WHERE s.season_code = $2
        GROUP BY iss.admin_unit_id
      ),
      practices AS (
        SELECT 
          po.admin_unit_id,
          MAX(CASE WHEN ap.code = 'MINERAL_FERTILIZER' THEN po.area_ha ELSE NULL END) AS fert_area_ha,
          MAX(CASE WHEN ap.code = 'TERRACING' THEN po.area_ha ELSE NULL END) AS terrace_area_ha
        FROM agrilens.practice_observations po
        JOIN agrilens.agricultural_practices ap ON ap.id = po.practice_id
        JOIN agrilens.seasons s ON s.id = po.season_id
        WHERE s.season_code = $2
        GROUP BY po.admin_unit_id
      )
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        prov.name AS province_name,
        c.name AS crop_name,
        s.season_code,
        ROUND(cs.yield_t_ha::numeric, 2) AS current_yield_t_ha,
        ROUND(cb.national_mean::numeric, 2) AS national_benchmark_yield,
        ROUND(ps.prior_yield::numeric, 2) AS prior_year_yield_t_ha,
        ROUND(cs.area_ha::numeric, 1) AS cultivated_area_ha,
        ROUND(cs.harvested_area_ha::numeric, 1) AS harvested_area_ha,
        ROUND(GREATEST(0, cs.area_ha - cs.harvested_area_ha)::numeric, 1) AS unharvested_area_ha,
        ROUND((GREATEST(0, cs.area_ha - cs.harvested_area_ha) / NULLIF(cs.area_ha, 0) * 100)::numeric, 1) AS unharvested_loss_pct,
        -- Deficit % vs National Benchmark
        ROUND(((cs.yield_t_ha - cb.national_mean) / NULLIF(cb.national_mean, 0) * 100)::numeric, 1) AS yield_deficit_pct,
        -- Year-over-Year Yield Decline %
        ROUND(((cs.yield_t_ha - ps.prior_yield) / NULLIF(ps.prior_yield, 0) * 100)::numeric, 1) AS yoy_yield_change_pct,
        -- Contextual Explanatory Signals
        sph.soil_ph,
        sph.soil_type,
        cl.rainfall_mm,
        cl.temperature_c,
        cl.drought_index,
        COALESCE(ir.irrigated_ha, 0) AS modern_irrigated_ha,
        pr.fert_area_ha,
        pr.terrace_area_ha
      FROM agrilens.crop_statistics cs
      CROSS JOIN crop_bench cb
      JOIN agrilens.administrative_units au ON au.id = cs.admin_unit_id
      LEFT JOIN agrilens.administrative_units prov ON prov.id = au.parent_id
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      LEFT JOIN prior_season ps ON ps.admin_unit_id = cs.admin_unit_id
      LEFT JOIN soil_ph sph ON sph.admin_unit_id = cs.admin_unit_id
      LEFT JOIN climate cl ON cl.admin_unit_id = cs.admin_unit_id
      LEFT JOIN irrigation ir ON ir.admin_unit_id = cs.admin_unit_id
      LEFT JOIN practices pr ON pr.admin_unit_id = cs.admin_unit_id
      WHERE LOWER(c.name) = LOWER($1) AND s.season_code = $2
      ORDER BY yield_deficit_pct ASC;
    `;

    const rawDistricts = await this.dataSource.query(query, [cropName, seasonCode]);

    // Calculate Composite Investigation Priority Score (0-100)
    // Higher score = Greater need for field verification / extension services
    const rankedDistricts = rawDistricts.map((d: any) => {
      const deficit = parseFloat(d.yield_deficit_pct || 0); // negative is lower yield
      const yoyDecline = parseFloat(d.yoy_yield_change_pct || 0);
      const unharvestedRate = parseFloat(d.unharvested_loss_pct || 0);
      const drought = parseFloat(d.drought_index || 0.2);
      const ph = parseFloat(d.soil_ph || 6.0);

      // Score components:
      // 1. Deficit component: 0 if yield >= national mean; up to 45 pts for steep deficits (-45% deficit = 45 pts)
      const deficitScore = deficit < 0 ? Math.min(45, Math.abs(deficit)) : 0;
      
      // 2. Decline component: up to 25 pts for declining yield year-over-year
      const declineScore = yoyDecline < 0 ? Math.min(25, Math.abs(yoyDecline) * 0.8) : 0;

      // 3. Unharvested crop loss gap: up to 20 pts
      const harvestLossScore = Math.min(20, unharvestedRate * 0.8);

      // 4. Climate / soil stress signals: up to 10 pts
      const stressScore = (drought > 0.35 ? 5 : 0) + (ph < 5.3 ? 5 : 0);

      const compositeScore = Math.round(deficitScore + declineScore + harvestLossScore + stressScore);

      // Priority Tier
      let priorityTier = 'STABLE';
      if (compositeScore >= 60) priorityTier = 'CRITICAL_INVESTIGATION';
      else if (compositeScore >= 40) priorityTier = 'MODERATE_CONCERN';
      else if (compositeScore >= 25) priorityTier = 'WATCHLIST';

      // Generate transparent signal tags
      const signals: string[] = [];
      if (deficit <= -25) signals.push(`Reported yield is ${Math.abs(deficit)}% below national benchmark.`);
      if (yoyDecline <= -15) signals.push(`Yield declined by ${Math.abs(yoyDecline)}% compared to prior year.`);
      if (unharvestedRate >= 15) signals.push(`High planted-to-harvested loss gap (${unharvestedRate}% unharvested).`);
      if (ph < 5.3) signals.push(`Strong soil acidity detected (pH ${ph}) - verify if lime was applied.`);
      if (drought >= 0.40) signals.push(`Elevated seasonal drought stress index (${drought}) in low-irrigation sector.`);
      if (d.modern_irrigated_ha < 100 && drought >= 0.35) signals.push('Low irrigation coverage under moisture stress conditions.');

      return {
        ...d,
        investigation_priority_score: compositeScore,
        investigation_priority_tier: priorityTier,
        signals_for_extension_officer: signals,
      };
    });

    return {
      crop: cropName,
      season: seasonCode,
      disclaimer: 'IMPORTANT: Low yield is an evidence-backed signal for extension investigation, not proof of single causation. AgriLens identifies lower-performing areas to direct field support without assuming unverified causes.',
      criteria: [
        'Yield Deficit vs National Mean (Weight: 45%)',
        'Year-over-Year Seasonal Decline % (Weight: 25%)',
        'Cultivated vs Harvested Loss Gap % (Weight: 20%)',
        'Soil Acidity & Drought Stress Indicators (Weight: 10%)',
      ],
      lowerPerformingAreas: rankedDistricts.filter((d: any) => d.investigation_priority_score >= 25),
      allDistrictsRanked: rankedDistricts,
    };
  }

  /**
   * 6. District Officer Investigation Dossier
   * Provides deep-dive evidence, comparisons, and suggested field questions for a specific district.
   */
  async getDistrictInvestigationDossier(districtCode: string, cropName: string = 'Maize', seasonCode: string = '2025A') {
    const comparisons = await this.getDistrictComparisons(cropName, seasonCode);
    const underperforming = await this.getUnderperformingAreas(seasonCode, cropName);

    const districtData = underperforming.allDistrictsRanked.find(
      (d: any) => d.district_code.toLowerCase() === districtCode.toLowerCase() || 
                  d.district_name.toLowerCase() === districtCode.toLowerCase()
    );

    if (!districtData) {
      return { error: `District '${districtCode}' not found.` };
    }

    // Historical trends for this district
    const historical = await this.getMultiYearTrends(cropName, districtData.district_code);

    // Comparable districts in the same province
    const provincialPeers = underperforming.allDistrictsRanked.filter(
      (d: any) => d.province_name === districtData.province_name && d.district_code !== districtData.district_code
    );

    return {
      dossierTitle: `Agricultural Extension Investigation Dossier: ${districtData.district_name} District`,
      target: {
        districtName: districtData.district_name,
        districtCode: districtData.district_code,
        province: districtData.province_name,
        crop: cropName,
        season: seasonCode,
      },
      productivityMetrics: {
        yieldTonnesHa: districtData.current_yield_t_ha,
        nationalBenchmark: districtData.national_benchmark_yield,
        yieldDeficitPct: districtData.yield_deficit_pct,
        cultivatedAreaHa: districtData.cultivated_area_ha,
        harvestedAreaHa: districtData.harvested_area_ha,
        unharvestedRatePct: districtData.unharvested_loss_pct,
        yoyYieldChangePct: districtData.yoy_yield_change_pct,
        investigationPriorityScore: districtData.investigation_priority_score,
        priorityTier: districtData.investigation_priority_tier,
      },
      contextualIndicators: {
        soilPh: districtData.soil_ph,
        soilType: districtData.soil_type,
        rainfallMm: districtData.rainfall_mm,
        temperatureC: districtData.temperature_c,
        droughtIndex: districtData.drought_index,
        modernIrrigationHa: districtData.modern_irrigated_ha,
      },
      provincialPeers: provincialPeers.slice(0, 4).map((p: any) => ({
        districtName: p.district_name,
        yieldTonnesHa: p.current_yield_t_ha,
        yieldDeficitPct: p.yield_deficit_pct,
      })),
      historicalTrajectory: historical.trends,
      fieldInvestigationChecklist: [
        {
          check: 'Crop Emergence & Stand Count',
          rationale: `Check if seed germination or post-planting dry spells contributed to the ${districtData.unharvested_loss_pct}% unharvested gap.`,
        },
        {
          check: 'Soil Chemistry & Acidity Verification',
          rationale: `Soil pH is ${districtData.soilPh || 'unknown'}. Test for aluminium toxicity if pH < 5.3 and verify agricultural lime availability.`,
        },
        {
          check: 'Pest & Disease Pressure',
          rationale: 'Verify whether Fall Armyworm (FAW) or maize streak virus outbreaks occurred in lower-altitude sectors during this season.',
        },
        {
          check: 'Fertilizer Application Timing & Quality',
          rationale: 'Confirm whether basal DAP and top-dressing Urea were applied according to RAB recommended dosages.',
        },
        {
          check: 'Supplemental Water / Irrigation Access',
          rationale: `District has ${districtData.modern_irrigated_ha || 0} Ha of modern irrigation. Assess if small-scale mobile pumping could protect vulnerable hillsides.`,
        },
      ],
      officialSources: [
        'National Institute of Statistics of Rwanda (NISR) - Seasonal Agricultural Survey (SAS)',
        'Ministry of Agriculture and Animal Resources (MINAGRI)',
        'Rwanda Agriculture and Animal Resources Development Board (RAB)',
        'Rwanda Meteorology Agency (Meteo Rwanda)',
      ],
      disclaimer: 'This dossier is designed to guide agricultural extension officers and planners with evidence-based diagnostic pointers. Low yield is an indicator for on-the-ground investigation, not definitive proof of a single root cause.',
    };
  }

  /**
   * 7. Master List of All Monitored Crops
   */
  async getCropsMasterList() {
    return this.dataSource.query(`
      SELECT 
        c.id,
        c.name,
        c.category,
        c.code,
        COUNT(cs.id) AS total_records,
        ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS historical_mean_yield,
        ROUND(MAX(cs.yield_t_ha)::numeric, 2) AS max_yield,
        COUNT(DISTINCT cs.season_id) AS seasons_monitored
      FROM agrilens.crops c
      LEFT JOIN agrilens.crop_statistics cs ON cs.crop_id = c.id
      GROUP BY c.id, c.name, c.category, c.code
      ORDER BY total_records DESC, c.name ASC;
    `);
  }

  /**
   * 8. Master List of All Monitored Seasons (2018A - 2026B)
   */
  async getSeasonsMasterList() {
    return this.dataSource.query(`
      SELECT 
        s.id,
        s.season_code,
        s.name,
        s.year,
        s.official_label,
        COUNT(cs.id) AS total_records,
        COUNT(DISTINCT cs.crop_id) AS crops_monitored,
        COUNT(DISTINCT cs.admin_unit_id) AS districts_monitored,
        ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 1) AS total_production_mt
      FROM agrilens.seasons s
      LEFT JOIN agrilens.crop_statistics cs ON cs.season_id = s.id
      GROUP BY s.id, s.season_code, s.name, s.year, s.official_label
      ORDER BY s.year DESC, s.season_code DESC;
    `);
  }

  /**
   * 9. Data Quality & Foundation Pipeline Audit Report
   */
  async getDataQualityReport() {
    const [overall, qualityBreakdown, seasonAudit, recentJob] = await Promise.all([
      this.dataSource.query(`
        SELECT 
          COUNT(id) AS total_records,
          COUNT(DISTINCT crop_id) AS distinct_crops,
          COUNT(DISTINCT admin_unit_id) AS distinct_districts,
          COUNT(DISTINCT season_id) AS distinct_seasons,
          ROUND(SUM(production_tonnes)::numeric, 1) AS total_production_mt,
          ROUND(SUM(area_ha)::numeric, 1) AS total_cultivated_ha,
          ROUND(SUM(harvested_area_ha)::numeric, 1) AS total_harvested_ha,
          ROUND((SUM(production_tonnes) / NULLIF(SUM(harvested_area_ha), 0))::numeric, 2) AS aggregate_weighted_yield
        FROM agrilens.crop_statistics;
      `),
      this.dataSource.query(`
        SELECT 
          COALESCE(data_quality_status, 'VERIFIED') AS status,
          COUNT(id) AS records_count,
          ROUND((COUNT(id)::numeric / (SELECT COUNT(*)::numeric FROM agrilens.crop_statistics) * 100), 2) AS pct
        FROM agrilens.crop_statistics
        GROUP BY data_quality_status
        ORDER BY records_count DESC;
      `),
      this.dataSource.query(`
        SELECT 
          s.season_code,
          s.year,
          s.name AS season_name,
          COUNT(cs.id) AS records,
          COUNT(DISTINCT cs.crop_id) AS crops,
          ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS avg_yield,
          COUNT(CASE WHEN cs.data_quality_status = 'HARVEST_GAP_WARNING' THEN 1 END) AS gap_warnings,
          COUNT(CASE WHEN cs.data_quality_status = 'OUTLIER_INVESTIGATION_FLAG' THEN 1 END) AS outlier_flags
        FROM agrilens.crop_statistics cs
        JOIN agrilens.seasons s ON s.id = cs.season_id
        GROUP BY s.season_code, s.year, s.name
        ORDER BY s.year DESC, s.season_code DESC;
      `),
      this.dataSource.query(`
        SELECT * FROM agrilens.data_import_jobs
        ORDER BY started_at DESC
        LIMIT 1;
      `),
    ]);

    return {
      foundationOverview: overall[0] || {},
      qualityStatusBreakdown: qualityBreakdown,
      seasonsAudit: seasonAudit,
      latestPipelineJob: recentJob[0] || null,
      rulesEnforced: [
        {
          ruleCode: 'DQ-1',
          name: 'Harvest Area Feasibility (Harvested <= Cultivated)',
          description: 'Validates that harvested area does not exceed planted/cultivated area beyond a 5% margin of error.',
        },
        {
          ruleCode: 'DQ-2',
          name: 'Biological Yield Consistency (Yield = Production / Harvested Area)',
          description: 'Calculates yield strictly against harvested area in compatible metric units (t/ha = MT / Ha).',
        },
        {
          ruleCode: 'DQ-3',
          name: 'Extreme Statistical Outlier Sentinel',
          description: 'Flags anomalies exceeding 3 sigma (or >80 t/ha) for on-the-ground validation.',
        },
        {
          ruleCode: 'DQ-4',
          name: 'Lineage & Provenance Traceability',
          description: 'Every record stores exact source NISR spreadsheet file, sheet, and version ID.',
        },
      ],
    };
  }
}

