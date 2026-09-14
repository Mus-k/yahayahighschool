const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
client.connect().then(() => {
  client.query('SELECT count(*) FROM up_users').then(res => {
    console.log("Users count: ", res.rows[0].count);
    client.end();
  });
});
