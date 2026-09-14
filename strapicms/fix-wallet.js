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
  try {
    await client.query("UPDATE students SET advance_balance = 5.00 WHERE school_id = 'AC000000001'");
    console.log('Successfully updated advance_balance to 5.00 for AC000000001');
  } catch (err) {
    console.error('Error:', err.message);
  }
  await client.end();
}
run();
