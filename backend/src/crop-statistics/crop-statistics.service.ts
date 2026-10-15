import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CropStatisticsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSummary(seasonCode: string = '2025A') {
    const summaryQuery = `
      SELECT 
        s.season_code,
        ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 1) AS total_production_mt,
        ROUND(COALESCE(SUM(cs.area_ha), 0)::numeric, 1) AS total_area_ha,
        ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS average_yield_t_ha,
        COUNT(DISTINCT cs.crop_id) AS total_crops_monitored,
        COUNT(DISTINCT cs.admin_unit_id) AS total_districts_monitored
      FROM agrilens.crop_statistics cs
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE s.season_code = $1
      GROUP BY s.season_code;
    `;

    const topCropsQuery = `
      SELECT 
        c.name AS crop_name,
        ROUND(SUM(cs.production_tonnes)::numeric, 1) AS production_tonnes,
        ROUND(SUM(cs.area_ha)::numeric, 1) AS area_ha,
        ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS yield_t_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE s.season_code = $1
      GROUP BY c.name
      ORDER BY production_tonnes DESC;
    `;

    const [summaryRes, topCropsRes] = await Promise.all([
      this.dataSource.query(summaryQuery, [seasonCode]),
      this.dataSource.query(topCropsQuery, [seasonCode]),
    ]);

    return {
      season: seasonCode,
      overview: summaryRes[0] || {
        season_code: seasonCode,
        total_production_mt: 0,
        total_area_ha: 0,
        average_yield_t_ha: 0,
      },
      crops: topCropsRes,
    };
  }

  async getByCrop(cropName?: string, seasonCode: string = '2025A') {
    let query = `
      SELECT 
        au.code AS district_code,
        au.name AS district_name,
        c.name AS crop_name,
        s.season_code,
        cs.area_ha,
        cs.production_tonnes,
        cs.yield_t_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.administrative_units au ON au.id = cs.admin_unit_id
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      WHERE s.season_code = $1
    `;
    const params: any[] = [seasonCode];

    if (cropName) {
      query += ` AND LOWER(c.name) = LOWER($2)`;
      params.push(cropName);
    }

    query += ` ORDER BY cs.production_tonnes DESC NULLS LAST;`;

    const rows = await this.dataSource.query(query, params);
    return {
      season: seasonCode,
      crop: cropName || 'ALL',
      count: rows.length,
      data: rows,
    };
  }

  async getTrends() {
    const query = `
      SELECT 
        c.name AS crop_name,
        s.season_code,
        s.year,
        ROUND(SUM(cs.production_tonnes)::numeric, 1) AS production_tonnes,
        ROUND(SUM(cs.area_ha)::numeric, 1) AS area_ha,
        ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS yield_t_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.crops c ON c.id = cs.crop_id
      JOIN agrilens.seasons s ON s.id = cs.season_id
      GROUP BY c.name, s.season_code, s.year
      ORDER BY c.name, s.season_code;
    `;

    const rows = await this.dataSource.query(query);
    return {
      trends: rows,
    };
  }
}
