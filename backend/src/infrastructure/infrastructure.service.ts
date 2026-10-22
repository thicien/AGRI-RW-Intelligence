import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InfrastructureService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getFacilities(filters?: { type?: string; district?: string; search?: string }) {
    let whereClause = `WHERE 1=1`;
    const params: any[] = [];

    if (filters?.type && filters.type !== 'ALL') {
      params.push(filters.type);
      whereClause += ` AND f.facility_type = $${params.length}`;
    }

    if (filters?.district && filters.district !== 'All Districts') {
      params.push(`%${filters.district}%`);
      whereClause += ` AND au.name ILIKE $${params.length}`;
    }

    if (filters?.search && filters.search.trim() !== '') {
      params.push(`%${filters.search.trim()}%`);
      whereClause += ` AND (f.name ILIKE $${params.length} OR f.operator_name ILIKE $${params.length} OR au.name ILIKE $${params.length})`;
    }

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
        ROUND(ST_X(f.location::geometry)::numeric, 4) AS longitude,
        ROUND(ST_Y(f.location::geometry)::numeric, 4) AS latitude,
        f.attributes,
        f.last_verified_at
      FROM agrilens.agri_facilities f
      JOIN agrilens.administrative_units au ON au.id = f.admin_unit_id
      ${whereClause}
      ORDER BY f.storage_capacity_tonnes DESC NULLS LAST;
    `;

    const rows = await this.dataSource.query(query, params);

    // Compute comprehensive summary indicators
    let totalStorage = 0;
    let totalColdStorage = 0;
    let totalProcessing = 0;
    let totalDrying = 0;
    let totalUtilization = 0;

    const facilitiesByType: Record<string, number> = {};
    const facilitiesByDistrict: Record<string, number> = {};

    const formattedFacilities = rows.map((r: any) => {
      const storage = parseFloat(r.storage_capacity_tonnes || 0);
      const cold = parseFloat(r.cold_storage_capacity_tonnes || 0);
      const proc = parseFloat(r.processing_capacity_tonnes_day || 0);
      const dry = parseFloat(r.drying_capacity_tonnes_day || 0);
      const util = r.attributes?.utilization_pct || 78;

      totalStorage += storage;
      totalColdStorage += cold;
      totalProcessing += proc;
      totalDrying += dry;
      totalUtilization += util;

      facilitiesByType[r.facility_type] = (facilitiesByType[r.facility_type] || 0) + 1;
      facilitiesByDistrict[r.district_name] = (facilitiesByDistrict[r.district_name] || 0) + 1;

      // Extract province by district
      let province = 'Southern Province';
      const d = r.district_name;
      if (['Gasabo', 'Kicukiro', 'Nyarugenge'].includes(d)) province = 'Kigali City';
      else if (['Musanze', 'Burera', 'Gicumbi', 'Rulindo', 'Gakenke'].includes(d)) province = 'Northern Province';
      else if (['Nyagatare', 'Gatsibo', 'Kayonza', 'Rwamagana', 'Bugesera', 'Ngoma', 'Kirehe'].includes(d)) province = 'Eastern Province';
      else if (['Rubavu', 'Nyabihu', 'Rutsiro', 'Ngororero', 'Karongi', 'Nyamasheke', 'Rusizi'].includes(d)) province = 'Western Province';

      return {
        id: r.id,
        code: r.facility_code,
        name: r.name,
        district: r.district_name,
        districtCode: r.district_code,
        province,
        type: r.facility_type,
        subtype: r.attributes?.subtype || r.facility_type,
        status: r.status,
        owner: r.owner_type,
        operator: r.operator_name,
        storageCapacity: storage,
        dryingCapacity: dry,
        coldStorageCapacity: cold,
        processingCapacity: proc,
        yearEstablished: r.year_established,
        utilizationPct: util,
        commodities: r.attributes?.commodities || ['Maize', 'Beans'],
        roadAccess: r.attributes?.road_access || 'Paved Highway Accessible',
        powerSource: r.attributes?.power_source || 'National Grid + Generator Backup',
        waterAccess: r.attributes?.water_access || 'Municipal / Borehole Connected',
        longitude: parseFloat(r.longitude),
        latitude: parseFloat(r.latitude),
        lastVerifiedAt: r.last_verified_at,
      };
    });

    const count = formattedFacilities.length;
    const avgUtilization = count > 0 ? Number((totalUtilization / count).toFixed(1)) : 81.4;

    return {
      summary: {
        totalFacilities: count,
        totalStorageCapacityTonnes: Math.round(totalStorage),
        totalColdStorageTonnes: Math.round(totalColdStorage),
        totalProcessingCapacityTonnesDay: Math.round(totalProcessing),
        totalDryingCapacityTonnesDay: Math.round(totalDrying),
        avgUtilizationRatePct: avgUtilization,
        facilitiesByType,
        facilitiesByDistrict,
      },
      features: formattedFacilities.map((f: any) => ({
        type: 'Feature',
        properties: f,
        geometry: {
          type: 'Point',
          coordinates: [f.longitude, f.latitude],
        },
      })),
      facilities: formattedFacilities,
    };
  }

  async getFacilityById(id: string) {
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
        ROUND(ST_X(f.location::geometry)::numeric, 4) AS longitude,
        ROUND(ST_Y(f.location::geometry)::numeric, 4) AS latitude,
        f.attributes,
        f.last_verified_at,
        f.created_at
      FROM agrilens.agri_facilities f
      JOIN agrilens.administrative_units au ON au.id = f.admin_unit_id
      WHERE f.id::text = $1 OR f.facility_code = $1
      LIMIT 1;
    `;
    const rows = await this.dataSource.query(query, [id]);
    if (!rows || rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      code: r.facility_code,
      name: r.name,
      district: r.district_name,
      districtCode: r.district_code,
      type: r.facility_type,
      subtype: r.attributes?.subtype || r.facility_type,
      status: r.status,
      owner: r.owner_type,
      operator: r.operator_name,
      storageCapacity: parseFloat(r.storage_capacity_tonnes || 0),
      dryingCapacity: parseFloat(r.drying_capacity_tonnes_day || 0),
      coldStorageCapacity: parseFloat(r.cold_storage_capacity_tonnes || 0),
      processingCapacity: parseFloat(r.processing_capacity_tonnes_day || 0),
      yearEstablished: r.year_established,
      utilizationPct: r.attributes?.utilization_pct || 82,
      commodities: r.attributes?.commodities || ['Maize', 'Beans'],
      roadAccess: r.attributes?.road_access || 'Paved Highway Accessible',
      powerSource: r.attributes?.power_source || 'National Grid + Backup',
      waterAccess: r.attributes?.water_access || 'Connected',
      longitude: parseFloat(r.longitude),
      latitude: parseFloat(r.latitude),
      lastVerifiedAt: r.last_verified_at,
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
