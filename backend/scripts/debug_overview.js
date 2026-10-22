const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Mug2thi4',
  database: 'agrilens_db',
});

async function main() {
  await client.connect();
  const ds = { query: (q, p) => client.query(q, p).then(r => r.rows) };

  const districtName = 'Musanze';
  const seasonCode = '2026B';

  try {
    const res = await ds.query(`
      SELECT id, name, code, parent_id
      FROM agrilens.administrative_units
      WHERE name ILIKE $1 AND unit_type = 'DISTRICT'
      LIMIT 1;
    `, [districtName.trim()]);
    console.log('District:', res[0]);

    const sectors = await ds.query(`
      SELECT id, name, code
      FROM agrilens.administrative_units
      WHERE parent_id = $1 AND unit_type = 'SECTOR'
      ORDER BY name ASC;
    `, [res[0].id]);
    console.log('Sectors count:', sectors.length);

    const kpiRes = await ds.query(`
      SELECT 
        ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 0) AS total_crop_production_tonnes,
        ROUND(COALESCE(AVG(cs.yield_t_ha), 0)::numeric, 2) AS average_yield_t_ha,
        ROUND(COALESCE(SUM(cs.area_ha), 0)::numeric, 0) AS total_cultivated_area_ha,
        COUNT(DISTINCT cs.crop_id) AS recorded_crops_count,
        COUNT(DISTINCT cs.id) AS data_points_count
      FROM agrilens.crop_statistics cs
      JOIN agrilens.seasons s ON cs.season_id = s.id
      JOIN agrilens.administrative_units au ON cs.admin_unit_id = au.id
      WHERE au.name ILIKE $1 AND s.season_code = $2;
    `, [`%${res[0].name}%`, seasonCode]);
    console.log('KPI:', kpiRes[0]);

    const intCountRes = await ds.query(`
      SELECT COUNT(*) AS count
      FROM agrilens.interventions
      WHERE district_name ILIKE $1;
    `, [res[0].name]);
    console.log('Interventions count:', intCountRes[0]);

    const rawSeasonalTrends = await ds.query(`
      SELECT 
        s.year,
        s.season_code,
        ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 0) AS production_tonnes,
        ROUND(COALESCE(AVG(cs.yield_t_ha), 0)::numeric, 2) AS yield_t_ha,
        ROUND(COALESCE(SUM(cs.area_ha), 0)::numeric, 0) AS area_ha
      FROM agrilens.crop_statistics cs
      JOIN agrilens.seasons s ON cs.season_id = s.id
      JOIN agrilens.administrative_units au ON cs.admin_unit_id = au.id
      WHERE au.name ILIKE $1 AND s.year >= 2020
      GROUP BY s.year, s.season_code
      ORDER BY s.year ASC, s.season_code ASC;
    `, [`%${res[0].name}%`]);
    console.log('Trends rows:', rawSeasonalTrends.length);

    const intQuery = `
      SELECT 
        id, title, description, status, priority_level, challenge_area, 
        sector_name, target_metric, budget_rwf, target_beneficiaries, start_date, end_date
      FROM agrilens.interventions
      WHERE district_name ILIKE $1
      ORDER BY 
        CASE priority_level
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END, created_at DESC
      LIMIT 8;
    `;
    const intRes = await ds.query(intQuery, [res[0].name]);
    console.log('Interventions rows:', intRes.length);

    console.log('ALL QUERIES PASSED SUCCESSFULY!');
  } catch (err) {
    console.error('FAILED AT:', err);
  } finally {
    await client.end();
  }
}

main();
