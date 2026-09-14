const fs = require('fs');
const path = require('path');

const collections = [
  'finance-sequence-counter',
  'finance-invoice',
  'finance-receipt',
  'finance-journal-entry',
  'finance-ledger-entry',
  'finance-budget',
  'finance-expense',
  'finance-payroll',
  'finance-scholarship',
  'finance-accounting-period',
  'finance-hold',
  'finance-currency',
  'finance-exchange-rate'
];

const apiDir = path.join(__dirname, 'src', 'api');

collections.forEach(name => {
  const collectionDir = path.join(apiDir, name);
  
  // Create folders
  fs.mkdirSync(path.join(collectionDir, 'controllers'), { recursive: true });
  fs.mkdirSync(path.join(collectionDir, 'routes'), { recursive: true });
  fs.mkdirSync(path.join(collectionDir, 'services'), { recursive: true });
  fs.mkdirSync(path.join(collectionDir, 'content-types', name), { recursive: true });

  // 1. Controller
  fs.writeFileSync(path.join(collectionDir, 'controllers', `${name}.js`), 
`'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::${name}.${name}');
`);

  // 2. Route
  fs.writeFileSync(path.join(collectionDir, 'routes', `${name}.js`), 
`'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::${name}.${name}');
`);

  // 3. Service
  fs.writeFileSync(path.join(collectionDir, 'services', `${name}.js`), 
`'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::${name}.${name}');
`);

  // 4. Schema
  fs.writeFileSync(path.join(collectionDir, 'content-types', name, 'schema.json'), 
`{
  "kind": "collectionType",
  "collectionName": "${name.replace(/-/g, '_')}s",
  "info": {
    "singularName": "${name}",
    "pluralName": "${name}s",
    "displayName": "${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {}
}
`);

});

console.log('Successfully created ' + collections.length + ' finance collections.');
