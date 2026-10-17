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
exports.SoilFertilityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let SoilFertilityService = class SoilFertilityService {
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
    async getDistricts(seasonCode = '2026B') {
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
    async getPriorityRanking(seasonCode = '2026B') {
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
    async getHistoricalCorrelation(districtName = 'Gicumbi') {
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
    async getSiteDossier(districtName, seasonCode = '2026B') {
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
};
exports.SoilFertilityService = SoilFertilityService;
exports.SoilFertilityService = SoilFertilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], SoilFertilityService);
//# sourceMappingURL=soil-fertility.service.js.map