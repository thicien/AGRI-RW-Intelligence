import { DataSource } from 'typeorm';
export const publicProductionQuery = `SELECT au.name AS district, prov.name AS province, s.season_code, s.year, c.name AS crop,
 cs.production_tonnes AS production, cs.area_ha AS area,cs.data_quality_status AS quality_status,ds.name AS source_name,d.name AS dataset_name FROM agrilens.crop_statistics cs
 JOIN agrilens.administrative_units au ON au.id=cs.admin_unit_id
 LEFT JOIN agrilens.administrative_units prov ON prov.id=au.parent_id
 JOIN agrilens.seasons s ON s.id=cs.season_id JOIN agrilens.crops c ON c.id=cs.crop_id
 LEFT JOIN agrilens.dataset_versions dv ON dv.id=cs.dataset_version_id
 LEFT JOIN agrilens.datasets d ON d.id=dv.dataset_id LEFT JOIN agrilens.data_sources ds ON ds.id=d.source_id
 WHERE au.unit_type='DISTRICT' ORDER BY s.season_code,au.name,c.name`;
export async function publicFacilities(db: DataSource) {
  return db.query(`SELECT f.id,f.name,au.name AS district,prov.name AS province,f.facility_type,f.status,
 f.storage_capacity_tonnes AS storage,f.processing_capacity_tonnes_day AS processing,
 f.drying_capacity_tonnes_day AS drying,f.cold_storage_capacity_tonnes AS cold,
 CASE WHEN ST_GeometryType(f.location)='ST_Point' THEN ST_X(f.location) END AS longitude,
 CASE WHEN ST_GeometryType(f.location)='ST_Point' THEN ST_Y(f.location) END AS latitude,
 f.attributes->'commodities' AS commodities, f.attributes->>'export_role' AS export_role,
 f.last_verified_at::text AS last_verified_at,ds.name AS source_name,d.name AS dataset_name,
 'UNVERIFIED_REGISTRY' AS evidence
 FROM agrilens.agri_facilities f JOIN agrilens.administrative_units au ON au.id=f.admin_unit_id
 LEFT JOIN agrilens.administrative_units prov ON prov.id=au.parent_id
 LEFT JOIN agrilens.dataset_versions dv ON dv.id=f.dataset_version_id
 LEFT JOIN agrilens.datasets d ON d.id=dv.dataset_id LEFT JOIN agrilens.data_sources ds ON ds.id=d.source_id
 ORDER BY au.name,f.name`);
}
