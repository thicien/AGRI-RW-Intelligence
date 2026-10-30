import API_BASE_URL from '../../config/api';
import type { 
  SeasonInfo, 
  ProductivityOverview, 
  CropStatItem, 
  IrrigationOverview, 
  SoilOverview, 
  PostHarvestOverview, 
  ExportOverview 
} from './types';

function getApiBase(): string {
  return API_BASE_URL;
}

export const RWANDA_DISTRICTS: string[] = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

export const DISTRICT_PROVINCES: Record<string, string> = {
  'Bugesera': 'Eastern Province',
  'Burera': 'Northern Province',
  'Gakenke': 'Northern Province',
  'Gasabo': 'City of Kigali',
  'Gatsibo': 'Eastern Province',
  'Gicumbi': 'Northern Province',
  'Gisagara': 'Southern Province',
  'Huye': 'Southern Province',
  'Kamonyi': 'Southern Province',
  'Karongi': 'Western Province',
  'Kayonza': 'Eastern Province',
  'Kicukiro': 'City of Kigali',
  'Kirehe': 'Eastern Province',
  'Muhanga': 'Southern Province',
  'Musanze': 'Northern Province',
  'Ngoma': 'Eastern Province',
  'Ngororero': 'Western Province',
  'Nyabihu': 'Western Province',
  'Nyagatare': 'Eastern Province',
  'Nyamagabe': 'Southern Province',
  'Nyamasheke': 'Western Province',
  'Nyanza': 'Southern Province',
  'Nyarugenge': 'City of Kigali',
  'Nyaruguru': 'Southern Province',
  'Rubavu': 'Western Province',
  'Ruhango': 'Southern Province',
  'Rulindo': 'Northern Province',
  'Rusizi': 'Western Province',
  'Rutsiro': 'Western Province',
  'Rwamagana': 'Eastern Province'
};

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Musanze': [29.635, -1.502],
  'Nyagatare': [30.328, -1.298],
  'Bugesera': [30.150, -2.150],
  'Gicumbi': [30.060, -1.610],
  'Huye': [29.740, -2.597],
  'Rubavu': [29.255, -1.676],
  'Burera': [29.830, -1.450],
  'Gakenke': [29.780, -1.700],
  'Rulindo': [29.980, -1.740],
  'Gatsibo': [30.450, -1.600],
  'Kayonza': [30.550, -1.900],
  'Kirehe': [30.650, -2.250],
  'Ngoma': [30.500, -2.170],
  'Rwamagana': [30.430, -1.950],
  'Gisagara': [29.850, -2.620],
  'Nyanza': [29.750, -2.350],
  'Ruhango': [29.780, -2.220],
  'Muhanga': [29.750, -2.080],
  'Kamonyi': [29.900, -2.000],
  'Nyamagabe': [29.500, -2.470],
  'Nyaruguru': [29.550, -2.720],
  'Nyabihu': [29.500, -1.650],
  'Rutsiro': [29.330, -1.930],
  'Karongi': [29.350, -2.150],
  'Ngororero': [29.600, -1.860],
  'Rusizi': [28.900, -2.480],
  'Nyamasheke': [29.150, -2.350],
  'Gasabo': [30.120, -1.900],
  'Kicukiro': [30.100, -1.990],
  'Nyarugenge': [30.040, -1.960]
};

/**
 * Fetch master seasons list from backend
 */
export async function fetchPublicSeasons(): Promise<SeasonInfo[]> {
  try {
    const res = await fetch(`${getApiBase()}/crop-statistics/seasons`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API error fetching seasons, using fallback list', err);
  }
  // Fallback verified seasons list
  return [
    { season_code: '2026B', name: 'Season B', year: 2026, official_label: '2026 Season B' },
    { season_code: '2025B', name: 'Season B', year: 2025, official_label: '2025 Season B' },
    { season_code: '2025A', name: 'Season A', year: 2025, official_label: '2025 Season A' },
    { season_code: '2025C', name: 'Season C', year: 2025, official_label: '2025 Season C' },
    { season_code: '2024B', name: 'Season B', year: 2024, official_label: '2024 Season B' },
    { season_code: '2024A', name: 'Season A', year: 2024, official_label: '2024 Season A' },
    { season_code: '2024C', name: 'Season C', year: 2024, official_label: '2024 Season C' },
    { season_code: '2023B', name: 'Season B', year: 2023, official_label: '2023 Season B' },
    { season_code: '2023A', name: 'Season A', year: 2023, official_label: '2023 Season A' },
    { season_code: '2023C', name: 'Season C', year: 2023, official_label: '2023 Season C' },
    { season_code: '2022B', name: 'Season B', year: 2022, official_label: '2022 Season B' },
    { season_code: '2022A', name: 'Season A', year: 2022, official_label: '2022 Season A' },
  ];
}

/**
 * Fetch crops master list
 */
export async function fetchPublicCrops(): Promise<string[]> {
  try {
    const res = await fetch(`${getApiBase()}/crop-statistics/crops`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((c: any) => typeof c === 'string' ? c : c.name);
      }
    }
  } catch (err) {
    console.warn('API error fetching crops, using fallback list', err);
  }
  return [
    'Maize', 'Beans', 'Irish Potato', 'Rice', 'Cassava', 
    'Banana', 'Sorghum', 'Wheat', 'Sweet Potato', 'Soybeans'
  ];
}

/**
 * 01. Productivity Section Data
 */
export async function fetchProductivityData(seasonCode: string, cropName: string = 'Maize', district?: string) {
  try {
    const [summaryRes, comparisonRes, cropsListRes] = await Promise.all([
      fetch(`${getApiBase()}/crop-statistics/summary?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/crop-statistics/district-comparison?crop=${encodeURIComponent(cropName)}&season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/crop-statistics/crops`).catch(() => null),
    ]);

    let overview: ProductivityOverview = {
      season_code: seasonCode,
      year: parseInt(seasonCode.substring(0, 4), 10) || 2025,
      total_production_mt: 0,
      total_cultivated_area_ha: 0,
      total_harvested_area_ha: 0,
      weighted_national_yield_t_ha: 0,
      total_crops_monitored: 0,
      total_districts_monitored: 30,
      national_unharvested_rate_pct: 0,
    };

    let crops: CropStatItem[] = [];
    if (summaryRes && summaryRes.ok) {
      const json = await summaryRes.json();
      if (json.overview) {
        overview = {
          season_code: json.overview.season_code || seasonCode,
          year: json.overview.year || parseInt(seasonCode.substring(0, 4), 10),
          total_production_mt: parseFloat(json.overview.total_production_mt || 0),
          total_cultivated_area_ha: parseFloat(json.overview.total_cultivated_area_ha || json.overview.total_area_ha || 0),
          total_harvested_area_ha: parseFloat(json.overview.total_harvested_area_ha || 0),
          weighted_national_yield_t_ha: parseFloat(json.overview.weighted_national_yield_t_ha || json.overview.average_yield_t_ha || 0),
          total_crops_monitored: parseInt(json.overview.total_crops_monitored || '0', 10),
          total_districts_monitored: parseInt(json.overview.total_districts_monitored || '30', 10),
          national_unharvested_rate_pct: parseFloat(json.overview.national_unharvested_rate_pct || 0),
        };
      }
      if (Array.isArray(json.crops)) {
        crops = json.crops.map((c: any) => ({
          crop_name: c.crop_name || c.name,
          production_tonnes: parseFloat(c.production_tonnes || 0),
          cultivated_area_ha: parseFloat(c.cultivated_area_ha || c.area_ha || 0),
          harvested_area_ha: parseFloat(c.harvested_area_ha || 0),
          yield_t_ha: parseFloat(c.yield_t_ha || 0),
          unharvested_loss_pct: parseFloat(c.unharvested_loss_pct || 0),
        }));
      }
    }

    let districtComparisons: any[] = [];
    let benchmark: any = null;
    if (comparisonRes && comparisonRes.ok) {
      const compJson = await comparisonRes.json();
      districtComparisons = compJson.districts || [];
      benchmark = compJson.benchmark || null;
    }

    return {
      overview,
      crops,
      districtComparisons,
      benchmark,
    };
  } catch (error) {
    console.error('Error fetching productivity data:', error);
    throw error;
  }
}

/**
 * 02. Irrigation Section Data
 */
export async function fetchIrrigationData(seasonCode: string) {
  try {
    const [summaryRes, districtsRes, schemesRes, screeningRes] = await Promise.all([
      fetch(`${getApiBase()}/irrigation/summary?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/irrigation/districts?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/irrigation/schemes`).catch(() => null),
      fetch(`${getApiBase()}/irrigation/opportunity-screening?season=${seasonCode}`).catch(() => null),
    ]);

    let overview: IrrigationOverview = {
      season_code: seasonCode,
      year: parseInt(seasonCode.substring(0, 4), 10) || 2026,
      total_modern_irrigated_ha: 0,
      total_traditional_irrigated_ha: 0,
      total_irrigated_ha: 0,
      total_cultivated_ha: 0,
      national_irrigation_access_pct: 0,
      national_irrigation_gap_ha: 0,
      documented_schemes_count: 0,
      total_command_area_ha: 0,
      total_scheme_beneficiaries: 0,
    };

    if (summaryRes && summaryRes.ok) {
      const json = await summaryRes.json();
      const raw = json.overview || {};
      const infra = json.infrastructure || {};
      overview = {
        season_code: raw.season_code || seasonCode,
        year: raw.year || parseInt(seasonCode.substring(0, 4), 10),
        total_modern_irrigated_ha: parseFloat(raw.total_modern_irrigated_ha || 0),
        total_traditional_irrigated_ha: parseFloat(raw.total_traditional_irrigated_ha || 0),
        total_irrigated_ha: parseFloat(raw.total_irrigated_ha || 0),
        total_cultivated_ha: parseFloat(raw.total_cultivated_ha || 0),
        national_irrigation_access_pct: parseFloat(raw.national_irrigation_access_pct || 0),
        national_irrigation_gap_ha: parseFloat(raw.national_irrigation_gap_ha || 0),
        documented_schemes_count: parseInt(infra.documented_schemes_count || '0', 10),
        total_command_area_ha: parseFloat(infra.total_command_area_ha || 0),
        total_scheme_beneficiaries: parseInt(infra.total_scheme_beneficiaries || '0', 10),
      };
    }

    let districts: any[] = [];
    if (districtsRes && districtsRes.ok) {
      districts = await districtsRes.json();
    }

    let schemes: any[] = [];
    if (schemesRes && schemesRes.ok) {
      const sJson = await schemesRes.json();
      schemes = sJson.schemes || sJson.rawAssets || [];
    }

    let screening: any[] = [];
    if (screeningRes && screeningRes.ok) {
      const scrJson = await screeningRes.json();
      screening = scrJson.rankedPotentialSites || scrJson.rankings || [];
    }

    return {
      overview,
      districts,
      schemes,
      screening,
    };
  } catch (error) {
    console.error('Error fetching irrigation data:', error);
    throw error;
  }
}

/**
 * 03. Soil Conservation Section Data
 */
export async function fetchSoilData(seasonCode: string) {
  try {
    const [summaryRes, districtsRes, rankingRes, projectsRes] = await Promise.all([
      fetch(`${getApiBase()}/soil-fertility/summary?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/soil-fertility/districts?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/soil-fertility/priority-ranking?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/soil-fertility/projects`).catch(() => null),
    ]);

    let overview: SoilOverview = {
      season_code: seasonCode,
      year: parseInt(seasonCode.substring(0, 4), 10) || 2026,
      total_cultivated_ha: 0,
      total_erosion_control_ha: 0,
      national_erosion_control_pct: 0,
      total_agroforestry_ha: 0,
      total_organic_fertilizer_ha: 0,
      national_avg_organic_farmer_pct: 0,
      total_inorganic_fertilizer_ha: 0,
      national_avg_inorganic_farmer_pct: 0,
      avg_npk_pct: 0,
      avg_urea_pct: 0,
      avg_dap_pct: 0,
      avg_lime_pct: 0,
      national_avg_soil_ph: 0,
      national_avg_erosion_susceptibility: 0,
      total_conservation_gap_ha: 0,
      severe_erosion_hotspots_count: 0,
    };

    if (summaryRes && summaryRes.ok) {
      const json = await summaryRes.json();
      const raw = json.overview || {};
      overview = {
        season_code: raw.season_code || seasonCode,
        year: raw.year || parseInt(seasonCode.substring(0, 4), 10),
        total_cultivated_ha: parseFloat(raw.total_cultivated_ha || 0),
        total_erosion_control_ha: parseFloat(raw.total_erosion_control_ha || 0),
        national_erosion_control_pct: parseFloat(raw.national_erosion_control_pct || 0),
        total_agroforestry_ha: parseFloat(raw.total_agroforestry_ha || 0),
        total_organic_fertilizer_ha: parseFloat(raw.total_organic_fertilizer_ha || 0),
        national_avg_organic_farmer_pct: parseFloat(raw.national_avg_organic_farmer_pct || 0),
        total_inorganic_fertilizer_ha: parseFloat(raw.total_inorganic_fertilizer_ha || 0),
        national_avg_inorganic_farmer_pct: parseFloat(raw.national_avg_inorganic_farmer_pct || 0),
        avg_npk_pct: parseFloat(raw.avg_npk_pct || 0),
        avg_urea_pct: parseFloat(raw.avg_urea_pct || 0),
        avg_dap_pct: parseFloat(raw.avg_dap_pct || 0),
        avg_lime_pct: parseFloat(raw.avg_lime_pct || 0),
        national_avg_soil_ph: parseFloat(raw.national_avg_soil_ph || 0),
        national_avg_erosion_susceptibility: parseFloat(raw.national_avg_erosion_susceptibility || 0),
        total_conservation_gap_ha: parseFloat(raw.total_conservation_gap_ha || 0),
        severe_erosion_hotspots_count: parseInt(raw.severe_erosion_hotspots_count || '0', 10),
      };
    }

    let districts: any[] = [];
    if (districtsRes && districtsRes.ok) {
      districts = await districtsRes.json();
    }

    let ranking: any[] = [];
    if (rankingRes && rankingRes.ok) {
      ranking = await rankingRes.json();
    }

    let projects: any[] = [];
    if (projectsRes && projectsRes.ok) {
      projects = await projectsRes.json();
    }

    return {
      overview,
      districts,
      ranking,
      projects,
    };
  } catch (error) {
    console.error('Error fetching soil data:', error);
    throw error;
  }
}

/**
 * 04. Post-Harvest Section Data
 */
export async function fetchPostHarvestData(seasonCode: string) {
  try {
    const [summaryRes, districtsRes, facilitiesRes, gapRes] = await Promise.all([
      fetch(`${getApiBase()}/post-harvest/summary?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/post-harvest/districts?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/post-harvest/facilities`).catch(() => null),
      fetch(`${getApiBase()}/post-harvest/gap-screening?season=${seasonCode}`).catch(() => null),
    ]);

    let overview: PostHarvestOverview = {
      total_crop_production_mt: 0,
      total_market_surplus_volume_mt: 0,
      total_documented_storage_capacity_mt: 0,
      total_cold_storage_capacity_mt: 0,
      total_processing_capacity_mt_day: 0,
      total_storage_capacity_gap_mt: 0,
      national_avg_sold_pct: 0,
      national_avg_consumed_pct: 0,
      national_avg_stored_pct: 0,
      national_avg_lost_pct: 0,
      national_avg_distance_facility_km: 0,
      documented_facilities_count: 0,
    };

    let safeguardNotice = {
      title: 'Safeguard Notice on Post-Harvest Infrastructure',
      content: 'A facility absence in documentation does not prove an absence on the ground. Unrecorded facilities represent potential coverage gaps rather than definitive shortages.',
      sourceCitation: 'NISR Seasonal Agricultural Survey Table 13 & 14, MINAGRI RGCC Registry'
    };

    if (summaryRes && summaryRes.ok) {
      const json = await summaryRes.json();
      const m = json.metrics || {};
      overview = {
        total_crop_production_mt: parseFloat(m.total_crop_production_mt || 0),
        total_market_surplus_volume_mt: parseFloat(m.total_market_surplus_volume_mt || 0),
        total_documented_storage_capacity_mt: parseFloat(m.total_documented_storage_capacity_mt || 0),
        total_cold_storage_capacity_mt: parseFloat(m.total_cold_storage_capacity_mt || 0),
        total_processing_capacity_mt_day: parseFloat(m.total_processing_capacity_mt_day || 0),
        total_storage_capacity_gap_mt: parseFloat(m.total_storage_capacity_gap_mt || 0),
        national_avg_sold_pct: parseFloat(m.national_avg_sold_pct || 0),
        national_avg_consumed_pct: parseFloat(m.national_avg_consumed_pct || 0),
        national_avg_stored_pct: parseFloat(m.national_avg_stored_pct || 0),
        national_avg_lost_pct: parseFloat(m.national_avg_lost_pct || 0),
        national_avg_distance_facility_km: parseFloat(m.national_avg_distance_facility_km || 0),
        documented_facilities_count: parseInt(json.facilities_infrastructure?.documented_facilities_count || '0', 10),
      };
      if (json.safeguard_notice) {
        safeguardNotice = {
          title: json.safeguard_notice.title || safeguardNotice.title,
          content: json.safeguard_notice.content || safeguardNotice.content,
          sourceCitation: json.safeguard_notice.nisr_source || safeguardNotice.sourceCitation,
        };
      }
    }

    let districts: any[] = [];
    if (districtsRes && districtsRes.ok) {
      districts = await districtsRes.json();
    }

    let facilities: any[] = [];
    if (facilitiesRes && facilitiesRes.ok) {
      const facJson = await facilitiesRes.json();
      facilities = Array.isArray(facJson) ? facJson : (facJson.facilities || []);
    }

    let gapScreening: any[] = [];
    if (gapRes && gapRes.ok) {
      gapScreening = await gapRes.json();
    }

    return {
      overview,
      districts,
      facilities,
      gapScreening,
      safeguardNotice,
    };
  } catch (error) {
    console.error('Error fetching post-harvest data:', error);
    throw error;
  }
}

/**
 * 05. Export Market Opportunities Section Data
 */
export async function fetchExportData(seasonCode: string) {
  try {
    const [summaryRes, districtsRes, productsRes, oppRes] = await Promise.all([
      fetch(`${getApiBase()}/trade/summary?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/trade/districts?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/trade/products-trade?season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/trade/opportunity-screening`).catch(() => null),
    ]);

    let overview: ExportOverview = {
      total_export_value_usd: 0,
      total_export_quantity_mt: 0,
      total_import_value_usd: 0,
      total_import_quantity_mt: 0,
      net_trade_balance_usd: 0,
      total_national_production_mt: 0,
      total_market_surplus_mt: 0,
      total_exportable_surplus_mt: 0,
      national_avg_export_readiness: 0,
      total_export_ready_cooperatives: 0,
      top_export_products: [],
    };

    let safeguardNotice = {
      title: 'Critical Safeguard on Export & Import Market Opportunities',
      content: 'Strong production growth does not automatically establish profitability. Quality certification, destination SPS requirements, and transport logistics determine commercial feasibility.',
      sourceCitation: 'MINICOM, NAEB Official Trade Reports, NISR Seasonal Agricultural Survey'
    };

    if (summaryRes && summaryRes.ok) {
      const json = await summaryRes.json();
      const m = json.metrics || {};
      overview = {
        total_export_value_usd: parseFloat(m.total_export_value_usd || 0),
        total_export_quantity_mt: parseFloat(m.total_export_quantity_mt || 0),
        total_import_value_usd: parseFloat(m.total_import_value_usd || 0),
        total_import_quantity_mt: parseFloat(m.total_import_quantity_mt || 0),
        net_trade_balance_usd: parseFloat(m.net_trade_balance_usd || 0),
        total_national_production_mt: parseFloat(m.total_national_production_mt || 0),
        total_market_surplus_mt: parseFloat(m.total_market_surplus_mt || 0),
        total_exportable_surplus_mt: parseFloat(m.total_exportable_surplus_mt || 0),
        national_avg_export_readiness: parseFloat(m.national_avg_export_readiness || 0),
        total_export_ready_cooperatives: parseInt(m.total_export_ready_cooperatives || '0', 10),
        top_export_products: [],
      };
      if (json.safeguard_notice) {
        safeguardNotice = {
          title: json.safeguard_notice.title || safeguardNotice.title,
          content: json.safeguard_notice.content || safeguardNotice.content,
          sourceCitation: json.safeguard_notice.sources || safeguardNotice.sourceCitation,
        };
      }
    }

    let districts: any[] = [];
    if (districtsRes && districtsRes.ok) {
      districts = await districtsRes.json();
    }

    let products: any[] = [];
    if (productsRes && productsRes.ok) {
      const pJson = await productsRes.json();
      products = Array.isArray(pJson) ? pJson : (pJson.products || []);
      if (products.length > 0) {
        overview.top_export_products = products.map((p: any) => ({
          name: p.name || p.commodity || p.product_name,
          export_mt: parseFloat(p.export_tonnes || p.export_mt || 0),
          value_usd: parseFloat(p.export_value_usd || p.value_usd || 0),
          fob_price_usd_kg: parseFloat(p.fob_price_usd_kg || p.price_kg || 0),
          destination: p.primary_destination || p.destination || 'EU / Regional',
        }));
      }
    }

    let opportunities: any[] = [];
    if (oppRes && oppRes.ok) {
      opportunities = await oppRes.json();
    }

    return {
      overview,
      districts,
      products,
      opportunities,
      safeguardNotice,
    };
  } catch (error) {
    console.error('Error fetching export data:', error);
    throw error;
  }
}

/**
 * Fetch detailed district dossier across modules
 */
export async function fetchDistrictDossier(districtName: string, seasonCode: string) {
  try {
    const [prodRes, irrRes, soilRes, phRes, expRes] = await Promise.all([
      fetch(`${getApiBase()}/district/productivity?district=${encodeURIComponent(districtName)}&season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/district/irrigation?district=${encodeURIComponent(districtName)}&season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/district/soil?district=${encodeURIComponent(districtName)}&season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/district/post-harvest?district=${encodeURIComponent(districtName)}&season=${seasonCode}`).catch(() => null),
      fetch(`${getApiBase()}/district/exports?district=${encodeURIComponent(districtName)}&season=${seasonCode}`).catch(() => null),
    ]);

    return {
      productivity: prodRes && prodRes.ok ? await prodRes.json() : null,
      irrigation: irrRes && irrRes.ok ? await irrRes.json() : null,
      soil: soilRes && soilRes.ok ? await soilRes.json() : null,
      postHarvest: phRes && phRes.ok ? await phRes.json() : null,
      exports: expRes && expRes.ok ? await expRes.json() : null,
    };
  } catch (error) {
    console.error(`Error fetching district dossier for ${districtName}:`, error);
    return null;
  }
}
