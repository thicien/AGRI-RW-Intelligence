import { DataSource } from 'typeorm';
export declare class TradeService {
    private dataSource;
    constructor(dataSource: DataSource);
    getSummary(seasonCode?: string): Promise<{
        season: string;
        metrics: {
            total_export_value_usd: number;
            total_export_quantity_mt: number;
            total_import_value_usd: number;
            total_import_quantity_mt: number;
            net_trade_balance_usd: number;
            net_exporter_commodities_count: number;
            import_substitution_commodities_count: number;
            avg_export_growth_pct: number;
            total_national_production_mt: number;
            total_market_surplus_mt: number;
            total_exportable_surplus_mt: number;
            national_avg_export_readiness: number;
            national_avg_distance_exit_km: number;
            tier1_global_hubs_count: number;
            tier2_regional_exporters_count: number;
            total_export_ready_cooperatives: number;
        };
        top_export_product: {
            name: any;
            value_usd: number;
            volume_mt: number;
            unit_value_usd_per_mt: number;
        } | null;
        safeguard_notice: {
            title: string;
            content: string;
            sources: string;
        };
    }>;
    getProductsTrade(seasonCode?: string): Promise<any>;
    getDistricts(seasonCode?: string): Promise<any>;
    getSeasons(): Promise<any>;
    getOpportunityScreening(): Promise<any>;
    getCommercialDossier(productName?: string, destinationCountry?: string): Promise<{
        product_name: string;
        destination_country: string;
        assessment: any;
        historical_trend: any;
        top_sourcing_districts: any;
        safeguard_disclaimer: string;
    }>;
}
