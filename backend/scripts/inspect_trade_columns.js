const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'Mug2thi4', database: 'agrilens_db' });

async function run() {
  await c.connect();
  const tables = ['export_destinations', 'export_opportunity_assessments', 'export_statistics', 'market_indicators'];
  for (const t of tables) {
    const cols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='agrilens' AND table_name='${t}' ORDER BY ordinal_position;`);
    const count = await c.query(`SELECT COUNT(*) FROM agrilens.${t};`);
    console.log(`\nTable ${t} (Rows: ${count.rows[0].count}):`);
    console.table(cols.rows);
  }
  await c.end();
}
run();
