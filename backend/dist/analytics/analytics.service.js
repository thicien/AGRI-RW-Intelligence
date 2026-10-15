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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let AnalyticsService = class AnalyticsService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getExportIntelligence() {
        const statsQuery = `
      SELECT 
        es.id,
        p.name AS product_name,
        p.product_code,
        p.product_category,
        d.country_name AS destination_country,
        d.region AS destination_region,
        es.export_quantity_tonnes,
        es.export_value_usd,
        es.unit_value_usd_per_tonne,
        es.hs_code,
        es.period_start,
        es.period_end
      FROM agrilens.export_statistics es
      JOIN agrilens.agricultural_products p ON p.id = es.product_id
      JOIN agrilens.export_destinations d ON d.id = es.destination_id
      ORDER BY es.export_value_usd DESC;
    `;
        const summaryQuery = `
      SELECT 
        ROUND(COALESCE(SUM(export_value_usd), 0)::numeric, 2) AS total_export_value_usd,
        ROUND(COALESCE(SUM(export_quantity_tonnes), 0)::numeric, 1) AS total_export_quantity_tonnes,
        COUNT(DISTINCT product_id) AS total_commodities,
        COUNT(DISTINCT destination_id) AS total_destinations
      FROM agrilens.export_statistics;
    `;
        const [stats, summary] = await Promise.all([
            this.dataSource.query(statsQuery),
            this.dataSource.query(summaryQuery),
        ]);
        return {
            summary: summary[0] || {},
            trades: stats,
        };
    }
    async getExportOpportunities() {
        const query = `
      SELECT 
        eoa.id AS assessment_id,
        p.name AS product_name,
        p.product_code,
        p.product_category,
        d.country_name AS destination_country,
        d.region AS destination_region,
        eoa.opportunity_score,
        eoa.opportunity_level,
        eoa.production_availability_score,
        eoa.market_demand_score,
        eoa.logistics_score,
        eoa.standards_readiness_score,
        eoa.risk_score,
        eoa.explanation,
        eoa.limitations,
        COALESCE(
          json_agg(
            json_build_object(
              'id', eoe.id,
              'type', eoe.evidence_type,
              'summary', eoe.evidence_summary,
              'direction', eoe.contribution_direction
            )
          ) FILTER (WHERE eoe.id IS NOT NULL), '[]'::json
        ) AS evidence_chain
      FROM agrilens.export_opportunity_assessments eoa
      JOIN agrilens.agricultural_products p ON p.id = eoa.product_id
      JOIN agrilens.export_destinations d ON d.id = eoa.destination_id
      LEFT JOIN agrilens.export_opportunity_evidence eoe ON eoe.assessment_id = eoa.id
      GROUP BY eoa.id, p.name, p.product_code, p.product_category, d.country_name, d.region
      ORDER BY eoa.opportunity_score DESC;
    `;
        const rows = await this.dataSource.query(query);
        return {
            totalAssessments: rows.length,
            opportunities: rows,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map