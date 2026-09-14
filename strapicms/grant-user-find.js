const { Client } = require('pg');
async function run() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();
  
  const action = 'plugin::users-permissions.user.find';
  const resRoles = await client.query('SELECT id FROM up_roles');
  
  const resPerm = await client.query('SELECT id FROM up_permissions WHERE action = $1', [action]);
  let permId;
  if (resPerm.rows.length === 0) {
    const insertRes = await client.query('INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id', [action]);
    permId = insertRes.rows[0].id;
  } else {
    permId = resPerm.rows[0].id;
  }
  
  for (const role of resRoles.rows) {
    const resLink = await client.query('SELECT id FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2', [permId, role.id]);
    if (resLink.rows.length === 0) {
      await client.query('INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)', [permId, role.id]);
    }
  }
  
  console.log('Successfully granted user.find to all roles');
  await client.end();
}
run().catch(console.error);
