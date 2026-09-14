const { Client } = require('pg');
async function check() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();
  const res = await client.query("SELECT * FROM up_permissions WHERE action = 'api::finance-reports.finance-reports.generateStatement'");
  console.log('Permissions:', res.rows);
  const links = await client.query("SELECT * FROM up_permissions_role_lnk WHERE permission_id = (SELECT id FROM up_permissions WHERE action = 'api::finance-reports.finance-reports.generateStatement')");
  console.log('Links:', links.rows);
  await client.end();
}
check();
