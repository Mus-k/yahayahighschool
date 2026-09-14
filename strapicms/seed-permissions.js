const { Client } = require('pg');

async function seed() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();

  const actions = [
    'api::dashboard.dashboard.getAdminDashboard',
    'api::dashboard.dashboard.getTeacherDashboard',
    'api::dashboard.dashboard.getStudentDashboard',
    'api::dashboard.dashboard.getParentDashboard'
  ];

  // Get all roles
  const resRoles = await client.query('SELECT id, name FROM up_roles');
  
  for (const role of resRoles.rows) {
    for (const action of actions) {
      // Check if permission exists
      const resPerm = await client.query('SELECT id FROM up_permissions WHERE action = $1', [action]);
      let permId;
      if (resPerm.rows.length === 0) {
        const insertRes = await client.query(
          "INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id",
          [action]
        );
        permId = insertRes.rows[0].id;
      } else {
        permId = resPerm.rows[0].id;
      }
      
      // Check link
      const resLink = await client.query(
        'SELECT id FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2',
        [permId, role.id]
      );
      if (resLink.rows.length === 0) {
        await client.query(
          'INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)',
          [permId, role.id]
        );
      }
    }
  }

  console.log('Permissions seeded successfully!');
  await client.end();
}
seed().catch(e => console.error(e));
