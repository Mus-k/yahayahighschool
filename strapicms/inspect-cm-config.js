const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    database: 'yahaya_scool',
    user: 'postgres',
    password: 'postgres18',
  });

  await client.connect();

  const r = await client.query(
    "SELECT key, value FROM strapi_core_store_settings WHERE key LIKE '%section%' OR key LIKE '%course-offering%'"
  );
  r.rows.forEach(row => {
    console.log('\n=== KEY:', row.key, '===');
    try {
      console.log(JSON.stringify(JSON.parse(row.value), null, 2));
    } catch(e) {
      console.log(row.value);
    }
  });

  await client.end();
}

run().catch(console.error);
