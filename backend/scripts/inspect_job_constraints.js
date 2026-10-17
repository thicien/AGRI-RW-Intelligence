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

  const c = await client.query(`
    SELECT pg_get_constraintdef(oid) as def
    FROM pg_constraint 
    WHERE conname = 'chk_import_file_format'
  `);
  console.log('chk_import_file_format:', c.rows[0]?.def);

  const statusChk = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint 
    WHERE conname LIKE '%status%' AND conrelid = 'agrilens.data_import_jobs'::regclass
  `);
  console.log('status checks:', statusChk.rows);

  await client.end();
}

inspect().catch(console.error);
