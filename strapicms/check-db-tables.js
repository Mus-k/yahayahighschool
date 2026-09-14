const { Client } = require('pg');

async function check() {
  const c = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await c.connect();

  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%finance%'");
  console.log('FINANCE TABLES:', tables.rows.map(t => t.table_name));

  for (const t of tables.rows) {
    const count = await c.query(`SELECT count(*) FROM "${t.table_name}"`);
    console.log(`Table ${t.table_name}: ${count.rows[0].count} rows`);
  }

  await c.end();
}

check().catch(console.error);
