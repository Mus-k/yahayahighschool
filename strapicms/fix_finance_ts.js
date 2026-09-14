const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map(subdir => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const financeApis = [
  'finance-accounting-period', 'finance-budget', 'finance-currency', 'finance-exchange-rate', 
  'finance-expense', 'finance-hold', 'finance-invoice', 'finance-journal-entry', 
  'finance-ledger-entry', 'finance-payroll', 'finance-receipt', 'finance-scholarship', 
  'finance-sequence-counter'
];

let fixedCount = 0;

for (const api of financeApis) {
  const baseDir = path.join('C:/Users/pc/YAHAYASCHOOL/strapicms/src/api', api);
  if (!fs.existsSync(baseDir)) continue;

  // Controller
  const ctrlPath = path.join(baseDir, 'controllers', `${api}.ts`);
  if (fs.existsSync(ctrlPath)) {
    fs.writeFileSync(ctrlPath, `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${api}.${api}');\n`);
    fixedCount++;
  }

  // Route
  const routePath = path.join(baseDir, 'routes', `${api}.ts`);
  if (fs.existsSync(routePath)) {
    fs.writeFileSync(routePath, `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${api}.${api}');\n`);
    fixedCount++;
  }

  // Service
  const svcPath = path.join(baseDir, 'services', `${api}.ts`);
  if (fs.existsSync(svcPath)) {
    if (api === 'finance-sequence-counter') {
      fs.writeFileSync(svcPath, `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::finance-sequence-counter.finance-sequence-counter', ({ strapi }: { strapi: any }) => ({\n  async generateNextSequence(moduleCode: string, prefix: string, padding = 6) {\n    const entry = await strapi.db.query('api::finance-sequence-counter.finance-sequence-counter').findOne({\n      where: { moduleCode }\n    });\n    let currentSeq = 1;\n    if (entry) {\n      currentSeq = (entry.lastSequenceNumber || 0) + 1;\n      await strapi.db.query('api::finance-sequence-counter.finance-sequence-counter').update({\n        where: { id: entry.id },\n        data: { lastSequenceNumber: currentSeq }\n      });\n    } else {\n      await strapi.db.query('api::finance-sequence-counter.finance-sequence-counter').create({\n        data: { moduleCode, lastSequenceNumber: 1 }\n      });\n    }\n    const formattedSeq = String(currentSeq).padStart(padding, '0');\n    return prefix ? \`\${prefix}-\${formattedSeq}\` : formattedSeq;\n  }\n}));\n`);
    } else {
      fs.writeFileSync(svcPath, `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${api}.${api}');\n`);
    }
    fixedCount++;
  }

  // Lifecycles
  const lifecyclePath = path.join(baseDir, 'content-types', api, 'lifecycles.ts');
  if (fs.existsSync(lifecyclePath)) {
    const content = fs.readFileSync(lifecyclePath, 'utf8');
    // Ensure lifecycles has export default and typed parameters
    const fixedContent = content
      .replace(/module\.exports\s*=/, 'export default')
      .replace(/async afterCreate\(event\)/g, 'async afterCreate(event: any)')
      .replace(/async afterUpdate\(event\)/g, 'async afterUpdate(event: any)');
    fs.writeFileSync(lifecyclePath, fixedContent);
    fixedCount++;
  }
}

console.log(`Successfully fixed TypeScript syntax across ${fixedCount} files!`);
