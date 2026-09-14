const { Client } = require('pg');

async function findUser() {
  const c = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await c.connect();
  // Find first superadmin or any user we can test with
  const res = await c.query("SELECT id, username, email FROM up_users LIMIT 5");
  console.log('Users:', res.rows);
  await c.end();
}
findUser().catch(console.error);
