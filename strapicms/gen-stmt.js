const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src', 'api', 'finance-financial-statement');

const dirs = [
  path.join(basePath, 'content-types', 'finance-financial-statement'),
  path.join(basePath, 'controllers'),
  path.join(basePath, 'services'),
  path.join(basePath, 'routes')
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(basePath, 'content-types', 'finance-financial-statement', 'schema.json'), JSON.stringify({
  "kind": "collectionType",
  "collectionName": "finance_financial_statements",
  "info": {
    "singularName": "finance-financial-statement",
    "pluralName": "finance-financial-statements",
    "displayName": "Finance Financial Statement",
    "description": "Generated institutional financial statement versions"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "reportType": {
      "type": "string"
    },
    "period": {
      "type": "string"
    },
    "academicYear": {
      "type": "string"
    },
    "generationDate": {
      "type": "datetime"
    },
    "generatedBy": {
      "type": "string"
    },
    "reportData": {
      "type": "json"
    },
    "reportHash": {
      "type": "string"
    },
    "status": {
      "type": "enumeration",
      "enum": ["Draft", "Reviewed", "Certified"],
      "default": "Draft"
    }
  }
}, null, 2));

fs.writeFileSync(path.join(basePath, 'controllers', 'finance-financial-statement.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::finance-financial-statement.finance-financial-statement');`);

fs.writeFileSync(path.join(basePath, 'routes', 'finance-financial-statement.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::finance-financial-statement.finance-financial-statement');`);

fs.writeFileSync(path.join(basePath, 'services', 'finance-financial-statement.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::finance-financial-statement.finance-financial-statement');`);

console.log('Created finance-financial-statement API');
