const { Client } = require('pg');
async function run() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();
  
  const actions = [
    'plugin::users-permissions.user.create',
    'plugin::users-permissions.user.update',
    'plugin::users-permissions.user.destroy'
  ];
  
  // Get super-administrator role
  const roleRes = await client.query("SELECT id FROM up_roles WHERE type = 'super-administrator'");
  if (roleRes.rows.length === 0) {
    console.log('Super admin role not found');
    return;
  }
  const roleId = roleRes.rows[0].id;
  
  for (const action of actions) {
    const resPerm = await client.query('SELECT id FROM up_permissions WHERE action = $1', [action]);
    let permId;
    if (resPerm.rows.length === 0) {
      const insertRes = await client.query('INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id', [action]);
      permId = insertRes.rows[0].id;
    } else {
      permId = resPerm.rows[0].id;
    }
    
    const resLink = await client.query('SELECT id FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2', [permId, roleId]);
    if (resLink.rows.length === 0) {
      await client.query('INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)', [permId, roleId]);
    }
  }
  
  console.log('Successfully granted user CRUD permissions to super-administrator');
  await client.end();
}
run().catch(console.error);
