import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

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
}
