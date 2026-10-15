import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class IrrigationService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getPotential(seasonCode: string = '2025A') {
    const query = `
      SELECT 
        au.id AS district_id,
        au.code AS district_code,
        au.name AS district_name,
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS total_irrigated_ha,
        COUNT(DISTINCT ia.id) AS registered_assets_count,
        ROUND(COALESCE(SUM(ia.area_command_ha), 0)::numeric, 1) AS total_command_ha,
        COALESCE(SUM(ia.beneficiaries_count), 0) AS total_beneficiaries,
        CASE 
          WHEN COALESCE(SUM(iss.area_irrigated_ha), 0) >= 4000 THEN 'VERY_HIGH'
          WHEN COALESCE(SUM(iss.area_irrigated_ha), 0) >= 2000 THEN 'HIGH'
          WHEN COALESCE(SUM(iss.area_irrigated_ha), 0) >= 800 THEN 'MEDIUM'
          ELSE 'DEVELOPING'
        END AS irrigation_potential_tier
      FROM agrilens.administrative_units au
      LEFT JOIN agrilens.seasons s ON s.season_code = $1
      LEFT JOIN agrilens.irrigation_season_statistics iss 
        ON iss.admin_unit_id = au.id AND iss.season_id = s.id
      LEFT JOIN agrilens.irrigation_assets ia 
        ON ia.admin_unit_id = au.id
      WHERE au.unit_type = 'DISTRICT'
      GROUP BY au.id, au.code, au.name
      ORDER BY total_irrigated_ha DESC;
    `;

    const summaryQuery = `
      SELECT 
        ROUND(COALESCE(SUM(iss.area_irrigated_ha), 0)::numeric, 1) AS national_irrigated_ha,
        COUNT(DISTINCT ia.id) AS national_schemes_count,
        ROUND(COALESCE(SUM(ia.area_command_ha), 0)::numeric, 1) AS national_command_ha,
        COALESCE(SUM(ia.beneficiaries_count), 0) AS national_beneficiaries
      FROM agrilens.irrigation_season_statistics iss
      JOIN agrilens.seasons s ON s.id = iss.season_id AND s.season_code = $1
      CROSS JOIN agrilens.irrigation_assets ia;
    `;

    const [rows, summary] = await Promise.all([
      this.dataSource.query(query, [seasonCode]),
      this.dataSource.query(summaryQuery, [seasonCode]),
    ]);

    return {
      season: seasonCode,
      summary: summary[0] || {},
      rankings: rows,
    };
  }

  async getAssets() {
    const query = `
      SELECT 
        ia.id,
        ia.name,
        au.name AS district_name,
        au.code AS district_code,
        ia.irrigation_type,
        ia.water_source,
        ia.irrigation_method,
        ia.area_command_ha,
        ia.area_irrigable_ha,
        ia.beneficiaries_count,
        ia.operator_name,
        ia.status,
        ST_X(ia.location) AS longitude,
        ST_Y(ia.location) AS latitude
      FROM agrilens.irrigation_assets ia
      JOIN agrilens.administrative_units au ON au.id = ia.admin_unit_id
      ORDER BY ia.area_command_ha DESC NULLS LAST;
    `;

    const rows = await this.dataSource.query(query);

    return {
      type: 'FeatureCollection',
      features: rows.map((r: any) => ({
        type: 'Feature',
        properties: {
          id: r.id,
          name: r.name,
          district: r.district_name,
          districtCode: r.district_code,
          irrigationType: r.irrigation_type,
          waterSource: r.water_source,
          method: r.irrigation_method,
          commandHa: r.area_command_ha,
          irrigableHa: r.area_irrigable_ha,
          beneficiaries: r.beneficiaries_count,
          operator: r.operator_name,
          status: r.status,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
        },
      })),
      rawAssets: rows,
    };
  }
}
