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

  const idxs = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'agrilens' AND tablename = 'crop_statistics'
  `);
  console.log('Existing indexes:', idxs.rows);

  await client.end();
}

inspect().catch(console.error);
