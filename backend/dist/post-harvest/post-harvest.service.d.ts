import { DataSource } from 'typeorm';
export declare class PostHarvestService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSummary(seasonCode?: string): Promise<{
        season: string;
        metrics: {
            total_crop_production_mt: number;
            total_market_surplus_volume_mt: number;
            total_documented_storage_capacity_mt: number;
            total_processing_capacity_mt_day: number;
            total_cold_storage_capacity_mt: number;
            total_drying_capacity_mt_day: number;
            total_storage_capacity_gap_mt: number;
            national_avg_utilization_pct: number;
            national_avg_sold_pct: number;
            national_avg_consumed_pct: number;
            national_avg_stored_pct: number;
            national_avg_lost_pct: number;
            national_avg_distance_facility_km: number;
            national_avg_distance_road_km: number;
            national_avg_investment_score: number;
            critical_deficit_districts_count: number;
            moderate_deficit_districts_count: number;
            survey_required_districts_count: number;
            tier1_urgent_districts_count: number;
        };
        crop_breakdown_mt: {
            maize: number;
            beans: number;
            irish_potato: number;
            cassava: number;
            paddy_rice: number;
            banana: number;
            vegetables_fruits: number;
        };
        facilities_infrastructure: {
            total_documented_facilities: number;
            operational_facilities: number;
            silos_count: number;
            warehouses_count: number;
            cold_stores_count: number;
            processing_plants_count: number;
            collection_centers_count: number;
            total_facility_storage_tonnes: number;
            total_facility_processing_tonnes_day: number;
        };
        safeguard_notice: {
            title: string;
            content: string;
            nisr_source: string;
        };
    }>;
    getDistricts(seasonCode?: string): Promise<any>;
    getSeasons(): Promise<any>;
    getFacilities(): Promise<any>;
    getGapScreening(seasonCode?: string): Promise<any>;
    getSiteDossier(districtName?: string, seasonCode?: string): Promise<{
        district_name: string;
        season: string;
        current_status: any;
        local_facilities: any;
        historical_trend: any;
        safeguard_disclaimer: string;
    }>;
}
