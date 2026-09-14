const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DATABASE_USERNAME || 'postgres',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  database: process.env.DATABASE_NAME || 'yahaya_scool',
  password: process.env.DATABASE_PASSWORD || 'postgres18',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
});

async function run() {
  await client.connect();
  console.log('[Debug] Dumping student_enrollments rows...');
  const se = await client.query('SELECT * FROM student_enrollments');
  console.log(se.rows);

  console.log('[Debug] Dumping teacher_assignments rows...');
  const ta = await client.query('SELECT * FROM teacher_assignments');
  console.log(ta.rows);

  await client.end();
}

run().catch(async err => {
  console.error('[Debug] Error:', err.message);
  try { await client.end(); } catch(e) {}
});
