const { Client } = require('pg'); 
const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 }); 
client.connect().then(() => {
  client.query("UPDATE footer_configs SET locale = 'en' WHERE locale IS NULL; UPDATE contact_infos SET locale = 'en' WHERE locale IS NULL;")
  .then(() => {
    console.log('Locale updated successfully!'); 
    client.end();
  })
  .catch((err) => {
    console.error('Error:', err);
    client.end();
  });
});
