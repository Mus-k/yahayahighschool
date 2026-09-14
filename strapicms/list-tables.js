const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
client.connect().then(() => {
  client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%user%'")
  .then(res => {
    console.log(res.rows);
    client.end();
  });
});
