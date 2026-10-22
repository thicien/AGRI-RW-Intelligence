const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Mug2thi4',
  database: 'agrilens_db'
});

async function main() {
  await client.connect();
  const yrs = await client.query('SELECT DISTINCT year FROM agrilens.seasons ORDER BY year ASC');
  console.log('Years in seasons table:', yrs.rows.map(r => r.year));
  
  const multiYear = await client.query(`
    SELECT 
      s.year,
      s.name as season_name,
      s.season_code,
      COUNT(cs.id) as records,
      ROUND(SUM(cs.production_tonnes)::numeric, 0) as prod,
      ROUND(AVG(cs.yield_t_ha)::numeric, 2) as yield,
      ROUND(SUM(cs.area_ha)::numeric, 0) as area
    FROM agrilens.crop_statistics cs
    JOIN agrilens.seasons s ON cs.season_id = s.id
    GROUP BY s.year, s.name, s.season_code
    ORDER BY s.year ASC, s.name ASC
  `);
  console.log('Multi-year records count:', multiYear.rows.length);
  console.log('Sample seasons:', multiYear.rows.slice(0, 15));
  await client.end();
}

main().catch(console.error);
