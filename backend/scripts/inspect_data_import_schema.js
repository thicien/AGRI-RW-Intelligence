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

  for (const t of ['data_sources', 'datasets', 'dataset_versions', 'data_import_jobs', 'data_import_rows']) {
    console.log(`\n=== Table: ${t} ===`);
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'agrilens' AND table_name = $1
    `, [t]);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`));
  }

  await client.end();
}

inspect().catch(console.error);
