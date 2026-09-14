const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src', 'api', 'finance-account');

const dirs = [
  path.join(basePath, 'content-types', 'finance-account'),
  path.join(basePath, 'controllers'),
  path.join(basePath, 'services'),
  path.join(basePath, 'routes')
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(basePath, 'content-types', 'finance-account', 'schema.json'), JSON.stringify({
  "kind": "collectionType",
  "collectionName": "finance_accounts",
  "info": {
    "singularName": "finance-account",
    "pluralName": "finance-accounts",
    "displayName": "Finance Account",
    "description": "Standard institutional chart of accounts"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "accountCode": {
      "type": "string",
      "unique": true,
      "required": true
    },
    "accountName": {
      "type": "string",
      "required": true
    },
    "accountType": {
      "type": "enumeration",
      "enum": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
      ],
      "required": true
    },
    "parentAccountCode": {
      "type": "string"
    },
    "isControlAccount": {
      "type": "boolean",
      "default": false
    },
    "isActive": {
      "type": "boolean",
      "default": true
    },
    "description": {
      "type": "string"
    }
  }
}, null, 2));

fs.writeFileSync(path.join(basePath, 'controllers', 'finance-account.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::finance-account.finance-account');`);

fs.writeFileSync(path.join(basePath, 'routes', 'finance-account.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::finance-account.finance-account');`);

fs.writeFileSync(path.join(basePath, 'services', 'finance-account.ts'), `import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::finance-account.finance-account');`);

console.log('Created finance-account API');
