const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });
  await client.connect();
  const c1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='agrilens' AND table_name='interventions'");
  console.log('Interventions columns:', c1.rows.map(r => `${r.column_name} (${r.data_type})`));
  const c2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='agrilens' AND table_name='field_observations'");
  console.log('Field observations columns:', c2.rows.map(r => `${r.column_name} (${r.data_type})`));
  await client.end();
}

main().catch(console.error);
