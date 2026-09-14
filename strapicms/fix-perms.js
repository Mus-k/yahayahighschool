const { Client } = require('pg');

async function run() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();

  const now = new Date();
  const actions = [
    'api::finance-receipt.finance-receipt.applyWallet',
    'api::finance-receipt.finance-receipt.combinedPayment',
    'api::finance-receipt.finance-receipt.verifyE2EScenario'
  ];

  try {
    const resRole = await client.query("SELECT id FROM up_roles WHERE type = 'authenticated'");
    const roleId = resRole.rows[0].id;
    console.log("Authenticated Role ID:", roleId);

    for (const action of actions) {
      let permRes = await client.query("SELECT id FROM up_permissions WHERE action = $1", [action]);
      let permId;
      if (permRes.rows.length === 0) {
        const insertRes = await client.query("INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, $2, $3) RETURNING id", [action, now, now]);
        permId = insertRes.rows[0].id;
        console.log(`Inserted permission ${action} with ID ${permId}`);
      } else {
        permId = permRes.rows[0].id;
        console.log(`Permission ${action} already exists with ID ${permId}`);
      }

      const linkRes = await client.query("SELECT * FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2", [permId, roleId]);
      if (linkRes.rows.length === 0) {
        await client.query("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)", [permId, roleId]);
        console.log(`Linked permission ${action} to role ${roleId}`);
      } else {
        console.log(`Permission ${action} already linked to role ${roleId}`);
      }
    }
    console.log("Permissions seeded successfully.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();
