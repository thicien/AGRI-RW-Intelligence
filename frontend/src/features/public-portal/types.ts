export type PublicSection = 
  | 'productivity'
  | 'irrigation'
  | 'soil'
  | 'post-harvest'
  | 'export';

export interface PublicFilterState {
  section: PublicSection;
  year: number;
  season: string; // '2025A', '2025B', '2026B', etc.
  seasonLetter: 'A' | 'B' | 'C';
  district: string; // 'ALL' or specific district name
  crop: string;
  searchQuery: string;
  viewMode: 'visual' | 'table';
}

export interface SeasonInfo {
  id?: string;
  season_code: string;
  name: string;
  year: number;
  official_label?: string;
  total_records?: string;
  crops_monitored?: string;
  districts_monitored?: string;
  total_production_mt?: string;
}

export interface DistrictRankingItem {
  rank: number;
  district: string;
  province: string;
  value: number;
  displayValue: string;
  unit: string;
  nationalBenchmark?: number;
  benchmarkDeltaPct?: number;
  sourceCitation: string;
  methodologyType: 'RECORDED_STATISTIC' | 'DERIVED_ESTIMATE' | 'MODELLED_ASSESSMENT';
  statusNote?: string;
}

export interface ProductivityOverview {
  season_code: string;
  year: number;
  total_production_mt: number;
  total_cultivated_area_ha: number;
  total_harvested_area_ha: number;
  weighted_national_yield_t_ha: number;
  total_crops_monitored: number;
  total_districts_monitored: number;
  national_unharvested_rate_pct: number;
}

export interface CropStatItem {
  crop_name: string;
  production_tonnes: number;
  cultivated_area_ha: number;
  harvested_area_ha: number;
  yield_t_ha: number;
  unharvested_loss_pct: number;
}

export interface IrrigationOverview {
  season_code: string;
  year: number;
  total_modern_irrigated_ha: number;
  total_traditional_irrigated_ha: number;
  total_irrigated_ha: number;
  total_cultivated_ha: number;
  national_irrigation_access_pct: number;
  national_irrigation_gap_ha: number;
  documented_schemes_count: number;
  total_command_area_ha: number;
  total_scheme_beneficiaries: number;
}

export interface SoilOverview {
  season_code: string;
  year: number;
  total_cultivated_ha: number;
  total_erosion_control_ha: number;
  national_erosion_control_pct: number;
  total_agroforestry_ha: number;
  total_organic_fertilizer_ha: number;
  national_avg_organic_farmer_pct: number;
  total_inorganic_fertilizer_ha: number;
  national_avg_inorganic_farmer_pct: number;
  avg_npk_pct: number;
  avg_urea_pct: number;
  avg_dap_pct: number;
  avg_lime_pct: number;
  national_avg_soil_ph: number;
  national_avg_erosion_susceptibility: number;
  total_conservation_gap_ha: number;
  severe_erosion_hotspots_count: number;
}

export interface PostHarvestOverview {
  total_crop_production_mt: number;
  total_market_surplus_volume_mt: number;
  total_documented_storage_capacity_mt: number;
  total_cold_storage_capacity_mt: number;
  total_processing_capacity_mt_day: number;
  total_storage_capacity_gap_mt: number;
  national_avg_sold_pct: number;
  national_avg_consumed_pct: number;
  national_avg_stored_pct: number;
  national_avg_lost_pct: number;
  national_avg_distance_facility_km: number;
  documented_facilities_count: number;
}

export interface ExportOverview {
  total_export_value_usd: number;
  total_export_quantity_mt: number;
  total_import_value_usd: number;
  total_import_quantity_mt: number;
  net_trade_balance_usd: number;
  total_national_production_mt: number;
  total_market_surplus_mt: number;
  total_exportable_surplus_mt: number;
  national_avg_export_readiness: number;
  total_export_ready_cooperatives: number;
  top_export_products: Array<{
    name: string;
    export_mt: number;
    value_usd: number;
    fob_price_usd_kg: number;
    destination: string;
  }>;
}

export interface SafeguardNotice {
  title: string;
  content: string;
  sourceCitation: string;
}
