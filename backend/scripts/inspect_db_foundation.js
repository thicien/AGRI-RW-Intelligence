const { Client } = require('pg');

async function inspect() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();

  console.log('=== SEASONS SCHEMA ===');
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'agrilens' AND table_name = 'seasons'
  `);
  console.log(cols.rows);

  console.log('=== ALL SEASONS ===');
  const seasons = await client.query('SELECT * FROM agrilens.seasons ORDER BY season_code');
  console.log(seasons.rows);

  console.log('\n=== ALL CROPS ===');
  const crops = await client.query('SELECT id, name, category FROM agrilens.crops ORDER BY name');
  console.log(`Total crops: ${crops.rows.length}`);
  console.log(crops.rows.map(c => `${c.name} (${c.category})`));

  console.log('\n=== STATS PER SEASON ===');
  const stats = await client.query(`
    SELECT s.season_code, count(cs.id) as rows_count, count(DISTINCT cs.crop_id) as crops_count, count(DISTINCT cs.admin_unit_id) as districts_count
    FROM agrilens.crop_statistics cs
    JOIN agrilens.seasons s ON s.id = cs.season_id
    GROUP BY s.season_code
    ORDER BY s.season_code
  `);
  console.log(stats.rows);

  await client.end();
}

inspect().catch(console.error);
