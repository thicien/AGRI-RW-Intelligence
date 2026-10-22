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

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'agrilens' ORDER BY table_name"
  );
  console.log('Tables in agrilens schema:', tables.rows.map(t => t.table_name));

  const dsCols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'agrilens' AND table_name = 'datasets'"
  );
  console.log('datasets columns:', dsCols.rows);

  const dsvCols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'agrilens' AND table_name = 'dataset_versions'"
  );
  console.log('dataset_versions columns:', dsvCols.rows);

  const sampleDatasets = await client.query('SELECT * FROM agrilens.datasets LIMIT 5');
  console.log('sample datasets count:', sampleDatasets.rows.length);
  if (sampleDatasets.rows.length > 0) {
    console.log('First dataset sample:', sampleDatasets.rows[0]);
  }

  // Check data quality issues or staging tables
  const dqCols = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'agrilens' AND (table_name LIKE '%validation%' OR table_name LIKE '%quality%' OR table_name LIKE '%job%' OR table_name LIKE '%stage%' OR table_name LIKE '%error%')"
  );
  console.log('Validation/quality/job tables:', dqCols.rows.map(r => r.table_name));

  await client.end();
}

main().catch(console.error);
