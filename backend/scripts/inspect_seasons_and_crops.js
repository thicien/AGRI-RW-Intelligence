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
  const seasons = await client.query('SELECT id, season_code, year, name FROM agrilens.seasons ORDER BY year, season_code;');
  console.log('Total seasons:', seasons.rows.length);
  console.log(seasons.rows.map(s => s.season_code).join(', '));
  
  const coffee = await client.query("SELECT id, name FROM agrilens.crops WHERE name ILIKE '%coffee%' OR name ILIKE '%tea%';");
  console.log('Coffee and Tea crops:', coffee.rows);
  
  await client.end();
}

run().catch(console.error);
