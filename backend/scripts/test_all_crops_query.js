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
  
  // All crops query
  const allCropsQuery = `
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

  const rows = (await client.query(allCropsQuery)).rows;
  console.log('Total crops returned:', rows.length);
  console.log('Sample crops:', rows.slice(0, 5));

  // Multi-season trajectory by crop
  const cropTrajectoryQuery = `
    SELECT 
      c.name AS crop_name,
      s.year,
      s.name AS season_name,
      s.season_code,
      ROUND(COALESCE(SUM(cs.production_tonnes), 0)::numeric, 0) AS prod_tonnes,
      ROUND(COALESCE(AVG(cs.yield_t_ha), 0)::numeric, 2) AS yield_t_ha
    FROM agrilens.crop_statistics cs
    JOIN agrilens.crops c ON cs.crop_id = c.id
    JOIN agrilens.seasons s ON cs.season_id = s.id
    GROUP BY c.name, s.year, s.name, s.season_code
    ORDER BY s.year ASC, s.season_code ASC;
  `;
  const trajectoryRows = (await client.query(cropTrajectoryQuery)).rows;
  console.log('Total trajectory points:', trajectoryRows.length);

  await client.end();
}

run().catch(console.error);
