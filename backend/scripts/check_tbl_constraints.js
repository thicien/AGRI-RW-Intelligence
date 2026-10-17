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

  for (const tbl of ['seasons', 'crops']) {
    console.log(`=== Constraints on ${tbl} ===`);
    const c = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'agrilens' AND conrelid = ('agrilens.' || $1)::regclass
    `, [tbl]);
    console.log(c.rows);
  }

  await client.end();
}

inspect().catch(console.error);
