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
  const res = await client.query("SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conname = 'chk_agri_facility_type'");
  console.log('chk_agri_facility_type:', res.rows[0]?.pg_get_constraintdef);
  await client.end();
}

run().catch(console.error);
