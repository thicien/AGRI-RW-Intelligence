const { Client } = require('pg');

async function inspectDistricts() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();

  const res = await client.query(`
    SELECT id, code, name, parent_id
    FROM agrilens.administrative_units 
    WHERE unit_type = 'DISTRICT'
    ORDER BY name
  `);
  console.log(`Found ${res.rows.length} districts in database:`);
  console.log(res.rows.map(d => `${d.name} (${d.code})`));

  await client.end();
}

inspectDistricts().catch(console.error);
