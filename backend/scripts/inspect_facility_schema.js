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

  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid) 
    FROM pg_constraint c 
    JOIN pg_namespace n ON n.oid = c.connamespace 
    WHERE conname LIKE '%facility%';
  `);
  console.log('Constraints:', res.rows);

  const existing = await client.query('SELECT DISTINCT facility_type, owner_type FROM agrilens.agri_facilities;');
  console.log('Existing types:', existing.rows);

  await client.end();
}

main().catch(console.error);
