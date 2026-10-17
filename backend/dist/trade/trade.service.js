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
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let TradeService = class TradeService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getSummary(seasonCode = '2026B') {
        const tradeSummaryQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND(COALESCE(SUM(export_value_usd), 0)::numeric, 0) AS total_export_value_usd,
        ROUND(COALESCE(SUM(export_quantity_mt), 0)::numeric, 0) AS total_export_quantity_mt,
        ROUND(COALESCE(SUM(import_value_usd), 0)::numeric, 0) AS total_import_value_usd,
        ROUND(COALESCE(SUM(import_quantity_mt), 0)::numeric, 0) AS total_import_quantity_mt,
        ROUND((COALESCE(SUM(export_value_usd), 0) - COALESCE(SUM(import_value_usd), 0))::numeric, 0) AS net_trade_balance_usd,
        COUNT(CASE WHEN net_trade_status = 'NET_EXPORTER' THEN 1 END) AS net_exporter_commodities_count,
        COUNT(CASE WHEN net_trade_status = 'NET_IMPORTER' THEN 1 END) AS import_substitution_commodities_count,
        ROUND(AVG(growth_trend_pct)::numeric, 1) AS avg_export_growth_pct
      FROM agrilens.trade_season_statistics
      WHERE season_code = $1
      GROUP BY season_code, year, season_name;
    `;
        const districtSummaryQuery = `
      SELECT 
        ROUND(COALESCE(SUM(total_crop_production_mt), 0)::numeric, 0) AS total_national_production_mt,
        ROUND(COALESCE(SUM(market_surplus_volume_mt), 0)::numeric, 0) AS total_market_surplus_mt,
        ROUND(COALESCE(SUM(estimated_exportable_volume_mt), 0)::numeric, 0) AS total_exportable_surplus_mt,
        ROUND(AVG(export_readiness_score)::numeric, 1) AS national_avg_export_readiness,
        ROUND(AVG(distance_to_exit_km)::numeric, 1) AS national_avg_distance_exit_km,
        COUNT(CASE WHEN export_tier = 'TIER_1_GLOBAL_EXPORT_HUB' THEN 1 END) AS tier1_global_hubs_count,
        COUNT(CASE WHEN export_tier = 'TIER_2_REGIONAL_EXPORTER' THEN 1 END) AS tier2_regional_exporters_count,
        SUM(cooperatives_export_ready_count) AS total_export_ready_cooperatives
      FROM agrilens.district_export_supply_statistics
      WHERE season_code = $1;
    `;
        const topProductQuery = `
      SELECT product_name, export_value_usd, export_quantity_mt, unit_value_usd_per_mt
      FROM agrilens.trade_season_statistics
      WHERE season_code = $1
      ORDER BY export_value_usd DESC
      LIMIT 1;
    `;
        const [tradeRes, districtRes, topProdRes] = await Promise.all([
            this.dataSource.query(tradeSummaryQuery, [seasonCode]),
            this.dataSource.query(districtSummaryQuery, [seasonCode]),
            this.dataSource.query(topProductQuery, [seasonCode]),
        ]);
        const trade = tradeRes[0] || {};
        const district = districtRes[0] || {};
        const topProd = topProdRes[0] || {};
        return {
            season: seasonCode,
            metrics: {
                total_export_value_usd: Number(trade.total_export_value_usd || 0),
                total_export_quantity_mt: Number(trade.total_export_quantity_mt || 0),
                total_import_value_usd: Number(trade.total_import_value_usd || 0),
                total_import_quantity_mt: Number(trade.total_import_quantity_mt || 0),
                net_trade_balance_usd: Number(trade.net_trade_balance_usd || 0),
                net_exporter_commodities_count: Number(trade.net_exporter_commodities_count || 0),
                import_substitution_commodities_count: Number(trade.import_substitution_commodities_count || 0),
                avg_export_growth_pct: Number(trade.avg_export_growth_pct || 0),
                total_national_production_mt: Number(district.total_national_production_mt || 0),
                total_market_surplus_mt: Number(district.total_market_surplus_mt || 0),
                total_exportable_surplus_mt: Number(district.total_exportable_surplus_mt || 0),
                national_avg_export_readiness: Number(district.national_avg_export_readiness || 0),
                national_avg_distance_exit_km: Number(district.national_avg_distance_exit_km || 0),
                tier1_global_hubs_count: Number(district.tier1_global_hubs_count || 0),
                tier2_regional_exporters_count: Number(district.tier2_regional_exporters_count || 0),
                total_export_ready_cooperatives: Number(district.total_export_ready_cooperatives || 0),
            },
            top_export_product: topProd ? {
                name: topProd.product_name,
                value_usd: Number(topProd.export_value_usd || 0),
                volume_mt: Number(topProd.export_quantity_mt || 0),
                unit_value_usd_per_mt: Number(topProd.unit_value_usd_per_mt || 0),
            } : null,
            safeguard_notice: {
                title: 'Critical Safeguard on Export & Import Market Opportunities',
                content: 'Strong production or export growth does not automatically establish profitability or future demand. The system accounts for missing trade data, quality requirements, international competition, transport costs and destination-market rules. Any export-opportunity score is a screening tool, not a guarantee of commercial success.',
                sources: 'MINICOM, NAEB Official Trade Reports, NISR Seasonal Agricultural Survey Table 13 & 14.',
            },
        };
    }
    async getProductsTrade(seasonCode = '2026B') {
        const query = `
      SELECT 
        id,
        season_code,
        year,
        season_name,
        product_name,
        product_category,
        hs_code,
        ROUND(domestic_production_mt::numeric, 0) AS domestic_production_mt,
        ROUND(export_quantity_mt::numeric, 0) AS export_quantity_mt,
        ROUND(export_value_usd::numeric, 0) AS export_value_usd,
        ROUND(unit_value_usd_per_mt::numeric, 0) AS unit_value_usd_per_mt,
        ROUND(import_quantity_mt::numeric, 0) AS import_quantity_mt,
        ROUND(import_value_usd::numeric, 0) AS import_value_usd,
        net_trade_status,
        growth_trend_pct,
        performance_status,
        primary_destinations,
        peak_months,
        phytosanitary_rules
      FROM agrilens.trade_season_statistics
      WHERE season_code = $1
      ORDER BY export_value_usd DESC;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return rows.map((r) => ({
            ...r,
            domestic_production_mt: Number(r.domestic_production_mt),
            export_quantity_mt: Number(r.export_quantity_mt),
            export_value_usd: Number(r.export_value_usd),
            unit_value_usd_per_mt: Number(r.unit_value_usd_per_mt),
            import_quantity_mt: Number(r.import_quantity_mt),
            import_value_usd: Number(r.import_value_usd),
            growth_trend_pct: Number(r.growth_trend_pct),
            primary_destinations: r.primary_destinations || [],
            peak_months: r.peak_months || [],
            phytosanitary_rules: r.phytosanitary_rules || {},
        }));
    }
    async getDistricts(seasonCode = '2026B') {
        const query = `
      SELECT 
        d.id,
        d.district_name,
        d.province_name,
        d.season_code,
        d.year,
        d.season_name,
        d.primary_export_crops,
        ROUND(d.total_crop_production_mt::numeric, 0) AS total_crop_production_mt,
        ROUND(d.market_surplus_volume_mt::numeric, 0) AS market_surplus_volume_mt,
        ROUND(d.estimated_exportable_volume_mt::numeric, 0) AS estimated_exportable_volume_mt,
        d.export_readiness_score,
        d.export_tier,
        d.nearest_exit_hub,
        d.distance_to_exit_km,
        d.cooperatives_export_ready_count,
        d.quality_certification_pct,
        ROUND(ST_X(ST_Centroid(u.geometry))::numeric, 4) AS longitude,
        ROUND(ST_Y(ST_Centroid(u.geometry))::numeric, 4) AS latitude
      FROM agrilens.district_export_supply_statistics d
      LEFT JOIN agrilens.administrative_units u ON d.admin_unit_id = u.id
      WHERE d.season_code = $1
      ORDER BY d.export_readiness_score DESC, d.estimated_exportable_volume_mt DESC;
    `;
        const rows = await this.dataSource.query(query, [seasonCode]);
        return rows.map((r) => ({
            ...r,
            total_crop_production_mt: Number(r.total_crop_production_mt),
            market_surplus_volume_mt: Number(r.market_surplus_volume_mt),
            estimated_exportable_volume_mt: Number(r.estimated_exportable_volume_mt),
            export_readiness_score: Number(r.export_readiness_score),
            distance_to_exit_km: Number(r.distance_to_exit_km),
            cooperatives_export_ready_count: Number(r.cooperatives_export_ready_count),
            quality_certification_pct: Number(r.quality_certification_pct),
            primary_export_crops: r.primary_export_crops || [],
            longitude: r.longitude ? Number(r.longitude) : 30.0,
            latitude: r.latitude ? Number(r.latitude) : -1.9,
        }));
    }
    async getSeasons() {
        const query = `
      SELECT 
        season_code,
        year,
        season_name,
        ROUND(SUM(export_value_usd)::numeric, 0) AS total_export_value_usd,
        ROUND(SUM(export_quantity_mt)::numeric, 0) AS total_export_quantity_mt,
        ROUND(SUM(import_value_usd)::numeric, 0) AS total_import_value_usd
      FROM agrilens.trade_season_statistics
      GROUP BY season_code, year, season_name
      ORDER BY year DESC, season_code DESC;
    `;
        const rows = await this.dataSource.query(query);
        return rows.map((r) => ({
            season_code: r.season_code,
            year: Number(r.year),
            season_name: r.season_name,
            total_export_value_usd: Number(r.total_export_value_usd || 0),
            total_export_quantity_mt: Number(r.total_export_quantity_mt || 0),
            total_import_value_usd: Number(r.total_import_value_usd || 0),
        }));
    }
    async getOpportunityScreening() {
        const query = `
      SELECT 
        eoa.id AS assessment_id,
        p.name AS product_name,
        p.product_code,
        p.product_category,
        d.country_name AS destination_country,
        d.region AS destination_region,
        ROUND((eoa.opportunity_score * 100)::numeric, 1) AS opportunity_score,
        eoa.opportunity_level,
        ROUND((eoa.production_availability_score * 100)::numeric, 1) AS production_availability_score,
        ROUND((eoa.market_demand_score * 100)::numeric, 1) AS market_demand_score,
        ROUND((eoa.logistics_score * 100)::numeric, 1) AS logistics_score,
        ROUND((eoa.standards_readiness_score * 100)::numeric, 1) AS standards_readiness_score,
        ROUND((eoa.risk_score * 100)::numeric, 1) AS risk_score,
        eoa.explanation,
        eoa.limitations
      FROM agrilens.export_opportunity_assessments eoa
      JOIN agrilens.agricultural_products p ON p.id = eoa.product_id
      JOIN agrilens.export_destinations d ON d.id = eoa.destination_id
      ORDER BY eoa.opportunity_score DESC;
    `;
        const rows = await this.dataSource.query(query);
        return rows.map((r, index) => ({
            rank: index + 1,
            assessment_id: r.assessment_id,
            product_name: r.product_name,
            product_code: r.product_code,
            product_category: r.product_category,
            destination_country: r.destination_country,
            destination_region: r.destination_region,
            opportunity_score: Number(r.opportunity_score),
            opportunity_level: r.opportunity_level,
            production_availability_score: Number(r.production_availability_score),
            market_demand_score: Number(r.market_demand_score),
            logistics_score: Number(r.logistics_score),
            standards_readiness_score: Number(r.standards_readiness_score),
            risk_score: Number(r.risk_score),
            explanation: r.explanation,
            limitations: r.limitations,
        }));
    }
    async getCommercialDossier(productName = 'Hass Avocado', destinationCountry = 'Netherlands') {
        const historicalQuery = `
      SELECT 
        season_code,
        year,
        season_name,
        domestic_production_mt,
        export_quantity_mt,
        export_value_usd,
        unit_value_usd_per_mt,
        growth_trend_pct
      FROM agrilens.trade_season_statistics
      WHERE product_name = $1
      ORDER BY year ASC, season_code ASC;
    `;
        const assessmentQuery = `
      SELECT 
        eoa.*,
        p.name AS product_name,
        d.country_name AS destination_country,
        d.region AS destination_region
      FROM agrilens.export_opportunity_assessments eoa
      JOIN agrilens.agricultural_products p ON p.id = eoa.product_id
      JOIN agrilens.export_destinations d ON d.id = eoa.destination_id
      WHERE p.name = $1 AND (d.country_name ILIKE $2 OR d.country_name ILIKE $3)
      LIMIT 1;
    `;
        const sourcingDistrictsQuery = `
      SELECT 
        district_name,
        province_name,
        total_crop_production_mt,
        market_surplus_volume_mt,
        estimated_exportable_volume_mt,
        export_readiness_score,
        nearest_exit_hub,
        distance_to_exit_km
      FROM agrilens.district_export_supply_statistics
      WHERE season_code = '2026B' AND primary_export_crops::text ILIKE $1
      ORDER BY export_readiness_score DESC
      LIMIT 6;
    `;
        const [histRes, assessRes, distRes] = await Promise.all([
            this.dataSource.query(historicalQuery, [productName]),
            this.dataSource.query(assessmentQuery, [productName, `%${destinationCountry}%`, `%${destinationCountry.split(' ')[0]}%`]),
            this.dataSource.query(sourcingDistrictsQuery, [`%${productName.split(' ')[0]}%`]),
        ]);
        const assess = assessRes[0] || null;
        return {
            product_name: productName,
            destination_country: destinationCountry,
            assessment: assess ? {
                ...assess,
                opportunity_score: Number(assess.opportunity_score) * 100,
                production_availability_score: Number(assess.production_availability_score) * 100,
                market_demand_score: Number(assess.market_demand_score) * 100,
                logistics_score: Number(assess.logistics_score) * 100,
                standards_readiness_score: Number(assess.standards_readiness_score) * 100,
                risk_score: Number(assess.risk_score) * 100,
            } : null,
            historical_trend: histRes.map((h) => ({
                season_code: h.season_code,
                year: Number(h.year),
                season_name: h.season_name,
                domestic_production_mt: Number(h.domestic_production_mt),
                export_quantity_mt: Number(h.export_quantity_mt),
                export_value_usd: Number(h.export_value_usd),
                unit_value_usd_per_mt: Number(h.unit_value_usd_per_mt),
                growth_trend_pct: Number(h.growth_trend_pct),
            })),
            top_sourcing_districts: distRes.map((d) => ({
                district_name: d.district_name,
                province_name: d.province_name,
                total_crop_production_mt: Number(d.total_crop_production_mt),
                market_surplus_volume_mt: Number(d.market_surplus_volume_mt),
                estimated_exportable_volume_mt: Number(d.estimated_exportable_volume_mt),
                export_readiness_score: Number(d.export_readiness_score),
                nearest_exit_hub: d.nearest_exit_hub,
                distance_to_exit_km: Number(d.distance_to_exit_km),
            })),
            safeguard_disclaimer: 'CRITICAL SAFEGUARD: Strong production or export growth does not automatically establish profitability or future demand. The system accounts for missing trade data, quality requirements, competition, transport costs and destination-market rules. Any export-opportunity score is a screening tool, not a guarantee of commercial success.',
        };
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], TradeService);
//# sourceMappingURL=trade.service.js.map