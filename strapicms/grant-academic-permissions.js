const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'yahaya_scool',
  user: 'postgres',
  password: 'postgres18'
});

const academicApis = [
  'gpa-configuration', 'grading-policy', 'academic-regulation', 
  'exam-timetable', 'student-grade', 'gpa-history', 'academic-appeal', 
  'graduation-clearance', 'academic-calendar', 'academic-audit-log',
  'grading-scheme', 'grade-band', 'assessment-category', 'exam-session',
  'academic-transcript', 'academic-certificate', 'promotion-record', 'curriculum'
];

const actions = ['find', 'findOne', 'create', 'update', 'delete'];

client.connect().then(async () => {
  console.log('Connected to PostgreSQL database yahaya_scool.');
  
  const rolesRes = await client.query('SELECT id, type FROM up_roles');
  const roleIds = rolesRes.rows.map(r => r.id);

  let insertedCount = 0;
  let linkedCount = 0;

  for (const api of academicApis) {
    for (const action of actions) {
      const actionStr = `api::${api}.${api}.${action}`;
      
      let permRes = await client.query('SELECT id FROM up_permissions WHERE action = $1', [actionStr]);
      let permId;

      if (permRes.rows.length === 0) {
        const docId = crypto.randomBytes(12).toString('hex');
        const now = new Date();
        const insertRes = await client.query(
          'INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [docId, actionStr, now, now, now]
        );
        permId = insertRes.rows[0].id;
        insertedCount++;
        console.log(`Inserted permission: ${actionStr}`);
      } else {
        permId = permRes.rows[0].id;
      }

      for (const roleId of roleIds) {
        const linkRes = await client.query(
          'SELECT * FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2',
          [permId, roleId]
        );
        if (linkRes.rows.length === 0) {
          await client.query(
            'INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)',
            [permId, roleId]
          );
          linkedCount++;
        }
      }
    }
  }

  console.log(`✅ Academic Permissions Seeding Complete! Inserted ${insertedCount} new permissions, created ${linkedCount} role links.`);
  client.end();
}).catch(err => {
  console.error('PG Error:', err);
  process.exit(1);
});
