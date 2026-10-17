const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Mug2thi4',
  database: process.env.DB_NAME || 'agrilens_db',
});

async function main() {
  await client.connect();
  const res = await client.query(
    "SELECT unit_type, count(*) FROM agrilens.administrative_units GROUP BY unit_type"
  );
  console.log('Unit types:', res.rows);

  const districts = await client.query(
    "SELECT id, name, code FROM agrilens.administrative_units WHERE unit_type = 'DISTRICT' ORDER BY name LIMIT 10"
  );
  console.log('Sample districts:', districts.rows);

  const users = await client.query("SELECT id, full_name, email FROM agrilens.users");
  console.log('Users in agrilens.users:', users.rows);

  const userRoles = await client.query(
    "SELECT ur.user_id, u.email, r.name as role FROM agrilens.user_roles ur JOIN agrilens.users u ON ur.user_id = u.id JOIN agrilens.roles r ON ur.role_id = r.id"
  );
  console.log('User roles in agrilens.user_roles:', userRoles.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
