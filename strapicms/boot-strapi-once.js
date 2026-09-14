const strapi = require('@strapi/strapi').createStrapi();
strapi.start().then(() => {
  console.log("Strapi started successfully and database migrated!");
  process.exit(0);
}).catch(err => {
  console.error("Failed to boot Strapi:", err);
  process.exit(1);
});
