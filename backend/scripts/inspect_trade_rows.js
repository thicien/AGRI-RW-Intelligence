const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'Mug2thi4', database: 'agrilens_db' });

async function run() {
  await c.connect();
  const d = await c.query("SELECT * FROM agrilens.export_destinations;");
  console.log('Destinations:', d.rows);
  const p = await c.query("SELECT * FROM agrilens.agricultural_products;");
  console.log('Agricultural products:', p.rows);
  const a = await c.query("SELECT * FROM agrilens.export_opportunity_assessments;");
  console.log('Assessments:', a.rows);
  await c.end();
}
run();
