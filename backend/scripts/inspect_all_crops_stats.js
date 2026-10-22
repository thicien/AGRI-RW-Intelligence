const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'agrilens_db',
  user: 'postgres',
  password: 'Mug2thi4'
});

async function run() {
  await client.connect();
  const q = `
    SELECT 
      c.id,
      c.name AS crop_name,
      c.category,
      ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 0) AS total_prod_tonnes,
      ROUND(COALESCE(AVG(cs.yield_t_ha), 0)::numeric, 2) AS avg_yield_t_ha,
      ROUND(COALESCE(SUM(cs.area_ha), 0)::numeric, 0) AS total_area_ha,
      ROUND(COALESCE(SUM(cs.harvested_area_ha), 0)::numeric, 0) AS total_harvested_ha,
      ROUND(COALESCE(SUM(cs.irrigated_area_ha), 0)::numeric, 0) AS total_irrigated_ha,
      COUNT(cs.id) AS observations_count,
      COUNT(DISTINCT s.id) AS seasons_count
    FROM agrilens.crops c
    LEFT JOIN agrilens.crop_statistics cs ON c.id = cs.crop_id
    LEFT JOIN agrilens.seasons s ON cs.season_id = s.id
    GROUP BY c.id, c.name, c.category
    ORDER BY total_prod_tonnes DESC;
  `;
  const res = await client.query(q);
  console.log('Total crops:', res.rows.length);
  res.rows.forEach(r => {
    console.log(
      r.crop_name.padEnd(20),
      '| Cat:', (r.category || 'General').padEnd(16),
      '| Prod:', Number(r.total_prod_tonnes).toLocaleString().padStart(12), 'MT',
      '| Yield:', String(r.avg_yield_t_ha).padStart(6), 't/ha',
      '| Area:', Number(r.total_area_ha).toLocaleString().padStart(11), 'ha',
      '| Seasons:', r.seasons_count
    );
  });
  await client.end();
}

run().catch(console.error);
