const { Client } = require('pg');

async function run() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'up_%'");
    console.log(res.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();
