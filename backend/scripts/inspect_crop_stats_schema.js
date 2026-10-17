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

  console.log('=== CROP_STATISTICS CONSTRAINTS ===');
  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'agrilens' AND conrelid = 'agrilens.crop_statistics'::regclass
  `);
  console.log(constraints.rows);

  console.log('\n=== CROP_STATISTICS COLUMNS ===');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'agrilens' AND table_name = 'crop_statistics'
  `);
  console.log(cols.rows);

  await client.end();
}

inspect().catch(console.error);
