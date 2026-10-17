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

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'agrilens'
    ORDER BY table_name
  `);
  console.log('Tables in agrilens schema:', tables.rows.map(r => r.table_name));

  await client.end();
}

inspect().catch(console.error);
