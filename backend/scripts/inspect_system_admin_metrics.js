const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Mug2thi4',
  database: 'agrilens_db'
});

async function main() {
  await client.connect();

  const start = Date.now();
  await client.query('SELECT 1');
  const latency = Date.now() - start;
  console.log('Database ping latency:', latency, 'ms');

  const size = await client.query("SELECT pg_size_pretty(pg_database_size('agrilens_db')) AS db_size");
  console.log('Database size:', size.rows[0].db_size);

  const conns = await client.query("SELECT count(*) FROM pg_stat_activity WHERE datname = 'agrilens_db'");
  console.log('Active DB connections:', conns.rows[0].count);

  const usersCount = await client.query("SELECT count(*), count(CASE WHEN status = 'ACTIVE' THEN 1 END) as active, count(CASE WHEN status = 'SUSPENDED' THEN 1 END) as suspended FROM agrilens.users");
  console.log('Users counts:', usersCount.rows[0]);

  const auditEvents = await client.query("SELECT count(*), count(CASE WHEN action LIKE '%DENIED%' OR action LIKE '%VIOLATION%' THEN 1 END) as violations FROM agrilens.audit_logs");
  console.log('Audit events:', auditEvents.rows[0]);

  const tableSizes = await client.query(`
    SELECT 
      relname AS table_name,
      n_live_tup AS estimated_rows,
      pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE n.nspname = 'agrilens'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 6;
  `);
  console.log('Top table sizes:', tableSizes.rows);

  await client.end();
}

main().catch(console.error);
