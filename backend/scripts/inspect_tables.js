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
  for (const t of ['irrigation_season_statistics', 'soil_fertility_season_statistics', 'post_harvest_season_statistics', 'trade_season_statistics']) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'agrilens' AND table_name = $1 
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\nColumns of ${t}:`, res.rows.map(r => `${r.column_name} (${r.data_type})`));
  }
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
