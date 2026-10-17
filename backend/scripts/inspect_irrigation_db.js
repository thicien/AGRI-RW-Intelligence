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
    ORDER BY table_name;
  `);
  console.log('Tables in agrilens schema:');
  console.log(tables.rows.map(t => t.table_name).join(', '));

  // Check irrigation tables
  const irrigationTables = tables.rows.map(t => t.table_name).filter(t => t.includes('irrig') || t.includes('water') || t.includes('climate') || t.includes('soil') || t.includes('terrain') || t.includes('scheme') || t.includes('practice'));
  console.log('\nRelevant Irrigation/Environment Tables:', irrigationTables);

  for (const t of irrigationTables) {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'agrilens' AND table_name = $1
    `, [t]);
    const cnt = await client.query(`SELECT COUNT(*) FROM agrilens.${t}`);
    console.log(`\nTable ${t} (${cnt.rows[0].count} rows):`);
    console.log(cols.rows.map(c => `  ${c.column_name}: ${c.data_type}`).join('\n'));
  }

  await client.end();
}

inspect().catch(console.error);
