const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'Mug2thi4', database: 'agrilens_db' });

async function run() {
  await c.connect();
  const query = `
      SELECT 
        s.id,
        s.district_name,
        s.province_name,
        s.season_code,
        s.year,
        s.season_name,
        s.total_crop_production_mt,
        s.maize_production_mt,
        s.beans_production_mt,
        s.irish_potato_production_mt,
        s.cassava_production_mt,
        s.paddy_rice_production_mt,
        s.banana_production_mt,
        s.vegetables_fruits_production_mt,
        s.pct_harvest_sold,
        s.pct_harvest_consumed,
        s.pct_harvest_stored,
        s.pct_harvest_lost,
        s.market_surplus_volume_mt,
        s.documented_storage_capacity_mt,
        s.documented_processing_capacity_mt_day,
        s.cold_storage_capacity_mt,
        s.drying_capacity_mt_day,
        s.storage_capacity_gap_mt,
        s.storage_utilization_pct,
        s.capacity_status,
        s.verification_status,
        s.avg_distance_to_facility_km,
        s.avg_distance_to_paved_road_km,
        s.documented_facilities_count,
        s.primary_processed_products,
        s.investment_opportunity_score,
        s.investment_tier,
        s.recommended_investment,
        s.evidence_sources,
        ROUND(ST_X(ST_Centroid(u.geometry))::numeric, 4) AS longitude,
        ROUND(ST_Y(ST_Centroid(u.geometry))::numeric, 4) AS latitude
      FROM agrilens.post_harvest_season_statistics s
      LEFT JOIN agrilens.administrative_units u ON s.admin_unit_id = u.id
      WHERE s.season_code = $1
      ORDER BY s.investment_opportunity_score DESC, s.market_surplus_volume_mt DESC;
  `;
  try {
    const res = await c.query(query, ['2026B']);
    console.log('Success, row count:', res.rows.length);
  } catch (err) {
    console.error('SQL Error:', err.message);
  }
  await c.end();
}
run();
