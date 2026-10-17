const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'Mug2thi4', database: 'agrilens_db' });

async function run() {
  await c.connect();
  const res = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='agrilens' ORDER BY table_name;");
  console.log('Tables in agrilens schema:', res.rows.map(r => r.table_name));
  
  // Also check if any trade / export / import tables exist
  const tradeTables = res.rows.filter(r => r.table_name.includes('export') || r.table_name.includes('trade') || r.table_name.includes('import') || r.table_name.includes('market'));
  console.log('Existing trade-related tables:', tradeTables.map(r => r.table_name));

  await c.end();
}
run();
