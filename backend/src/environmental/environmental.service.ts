import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EnvironmentalService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSoilFertility() {
    const query = `
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        sit.code AS indicator_code,
        sit.name AS indicator_name,
        so.value_numeric,
        so.unit,
        so.soil_type,
        so.measurement_method,
        so.notes
      FROM agrilens.soil_observations so
      JOIN agrilens.administrative_units au ON au.id = so.admin_unit_id
      JOIN agrilens.soil_indicator_types sit ON sit.id = so.indicator_type_id
      ORDER BY au.name, sit.code;
    `;

    const rows = await this.dataSource.query(query);

    // Group by district
    const districtsMap = new Map();
    rows.forEach((r: any) => {
      if (!districtsMap.has(r.district_name)) {
        districtsMap.set(r.district_name, {
          district_code: r.district_code,
          district_name: r.district_name,
          soil_type: r.soil_type,
          indicators: {},
        });
      }
      districtsMap.get(r.district_name).indicators[r.indicator_code] = {
        value: parseFloat(r.value_numeric),
        unit: r.unit,
        method: r.measurement_method,
      };
    });

    return {
      totalDistrictsTested: districtsMap.size,
      samples: Array.from(districtsMap.values()),
    };
  }

  async getConservationPractices(seasonCode: string = '2025A') {
    const summaryQuery = `
      SELECT 
        ap.code AS practice_code,
        ap.name AS practice_name,
        ap.domain,
        ROUND(COALESCE(SUM(po.area_ha), 0)::numeric, 1) AS total_area_ha,
        ROUND(COALESCE(AVG(po.adoption_rate), 0)::numeric * 100, 2) AS average_adoption_pct,
        COUNT(DISTINCT po.admin_unit_id) AS districts_reported
      FROM agrilens.practice_observations po
      JOIN agrilens.agricultural_practices ap ON ap.id = po.practice_id
      JOIN agrilens.seasons s ON s.id = po.season_id
      WHERE s.season_code = $1
      GROUP BY ap.code, ap.name, ap.domain
      ORDER BY total_area_ha DESC;
    `;

    const districtBreakdownQuery = `
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        ap.code AS practice_code,
        ap.name AS practice_name,
        po.area_ha,
        ROUND(po.adoption_rate::numeric * 100, 2) AS adoption_pct
      FROM agrilens.practice_observations po
      JOIN agrilens.agricultural_practices ap ON ap.id = po.practice_id
      JOIN agrilens.administrative_units au ON au.id = po.admin_unit_id
      JOIN agrilens.seasons s ON s.id = po.season_id
      WHERE s.season_code = $1
      ORDER BY au.name, ap.name;
    `;

    const [summary, breakdown] = await Promise.all([
      this.dataSource.query(summaryQuery, [seasonCode]),
      this.dataSource.query(districtBreakdownQuery, [seasonCode]),
    ]);

    return {
      season: seasonCode,
      practicesSummary: summary,
      districtBreakdown: breakdown,
    };
  }

  async getSeasonalComparison() {
    const query = `
      SELECT 
        s.season_code,
        ap.name AS practice_name,
        ROUND(COALESCE(SUM(po.area_ha), 0)::numeric, 1) AS total_area_ha
      FROM agrilens.practice_observations po
      JOIN agrilens.agricultural_practices ap ON ap.id = po.practice_id
      JOIN agrilens.seasons s ON s.id = po.season_id
      WHERE s.season_code IN ('2025A', '2025B')
      GROUP BY s.season_code, ap.name
      ORDER BY ap.name, s.season_code;
    `;

    const rows = await this.dataSource.query(query);
    return {
      comparison: rows,
    };
  }
}
