const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'yahaya_scool',
  password: 'postgres18',
  port: 5432,
});

async function run() {
  await client.connect();
  // Strapi tables are usually plural and lowercase, like "students" or "up_users"
  try {
    const res = await client.query("SELECT * FROM students WHERE document_id IS NOT NULL LIMIT 5");
    console.log('Students:', res.rows.map(r => ({ id: r.id, school_id: r.school_id, first_name: r.first_name, advance_balance: r.advance_balance })));
  } catch (err) {
    console.error('Error:', err.message);
  }
  await client.end();
}
run();
