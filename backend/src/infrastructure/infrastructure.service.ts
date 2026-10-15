import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InfrastructureService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getFacilities() {
    const query = `
      SELECT 
        f.id,
        f.facility_code,
        f.name,
        au.name AS district_name,
        au.code AS district_code,
        f.facility_type,
        f.status,
        f.owner_type,
        f.operator_name,
        f.storage_capacity_tonnes,
        f.drying_capacity_tonnes_day,
        f.cold_storage_capacity_tonnes,
        f.processing_capacity_tonnes_day,
        f.year_established,
        ST_X(f.location) AS longitude,
        ST_Y(f.location) AS latitude,
        f.last_verified_at
      FROM agrilens.agri_facilities f
      JOIN agrilens.administrative_units au ON au.id = f.admin_unit_id
      ORDER BY f.storage_capacity_tonnes DESC NULLS LAST;
    `;

    const rows = await this.dataSource.query(query);

    return {
      type: 'FeatureCollection',
      features: rows.map((r: any) => ({
        type: 'Feature',
        properties: {
          id: r.id,
          code: r.facility_code,
          name: r.name,
          district: r.district_name,
          districtCode: r.district_code,
          type: r.facility_type,
          status: r.status,
          owner: r.owner_type,
          operator: r.operator_name,
          storageCapacity: parseFloat(r.storage_capacity_tonnes || 0),
          dryingCapacity: parseFloat(r.drying_capacity_tonnes_day || 0),
          coldStorageCapacity: parseFloat(r.cold_storage_capacity_tonnes || 0),
          processingCapacity: parseFloat(r.processing_capacity_tonnes_day || 0),
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
        },
      })),
      facilities: rows,
    };
  }

  async getCapacityAnalysis() {
    const query = `
      SELECT 
        f.id,
        f.facility_code,
        f.name AS facility_name,
        au.name AS district_name,
        f.facility_type,
        f.storage_capacity_tonnes,
        f.processing_capacity_tonnes_day,
        fss.quantity_received_tonnes,
        fss.quantity_stored_tonnes,
        ROUND((fss.quantity_received_tonnes / NULLIF(f.storage_capacity_tonnes, 0) * 100)::numeric, 1) AS utilization_rate_pct,
        fss.quantity_lost_tonnes,
        ROUND((fss.quantity_lost_tonnes / NULLIF(fss.quantity_received_tonnes, 0) * 100)::numeric, 2) AS post_harvest_loss_pct,
        CASE 
          WHEN (fss.quantity_received_tonnes / NULLIF(f.storage_capacity_tonnes, 0)) >= 0.90 THEN 'CAPACITY_CONSTRAINED'
          WHEN (fss.quantity_received_tonnes / NULLIF(f.storage_capacity_tonnes, 0)) >= 0.70 THEN 'OPTIMAL_OPERATING'
          ELSE 'UNDER_UTILIZED'
        END AS capacity_status
      FROM agrilens.agri_facilities f
      JOIN agrilens.administrative_units au ON au.id = f.admin_unit_id
      LEFT JOIN agrilens.facility_seasonal_statistics fss ON fss.facility_id = f.id
      ORDER BY f.storage_capacity_tonnes DESC NULLS LAST;
    `;

    const summaryQuery = `
      SELECT 
        ROUND(COALESCE(SUM(f.storage_capacity_tonnes), 0)::numeric, 1) AS total_storage_capacity_tonnes,
        ROUND(COALESCE(SUM(fss.quantity_received_tonnes), 0)::numeric, 1) AS total_quantity_received_tonnes,
        ROUND(COALESCE(SUM(fss.quantity_stored_tonnes), 0)::numeric, 1) AS total_quantity_stored_tonnes,
        ROUND(COALESCE(SUM(fss.quantity_lost_tonnes), 0)::numeric, 1) AS total_quantity_lost_tonnes,
        ROUND((SUM(fss.quantity_received_tonnes) / NULLIF(SUM(f.storage_capacity_tonnes), 0) * 100)::numeric, 1) AS overall_utilization_pct
      FROM agrilens.agri_facilities f
      LEFT JOIN agrilens.facility_seasonal_statistics fss ON fss.facility_id = f.id;
    `;

    const [rows, summary] = await Promise.all([
      this.dataSource.query(query),
      this.dataSource.query(summaryQuery),
    ]);

    return {
      summary: summary[0] || {},
      facilities: rows,
    };
  }
}
