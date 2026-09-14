const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src', 'api', 'finance-reports');

const dirs = [
  path.join(basePath, 'controllers'),
  path.join(basePath, 'routes'),
  path.join(basePath, 'services')
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(basePath, 'routes', 'custom-reports.ts'), `
export default {
  routes: [
    {
      method: 'POST',
      path: '/finance-reports/generate',
      handler: 'finance-reports.generateStatement',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
`);

fs.writeFileSync(path.join(basePath, 'controllers', 'finance-reports.ts'), `
import { factories } from '@strapi/strapi';
import crypto from 'crypto';

export default factories.createCoreController('api::finance-journal-entry.finance-journal-entry', ({ strapi }) => ({
  async generateStatement(ctx) {
    try {
      const { 
        academicYear, 
        term, 
        period, 
        campus, 
        currency, 
        dateRange, 
        reportType 
      } = ctx.request.body?.data || ctx.request.body || {};

      // Build filters
      const filters: any = { status: 'posted' };
      if (dateRange && dateRange.start && dateRange.end) {
        filters.date = { $gte: dateRange.start, $lte: dateRange.end };
      }

      // 1. Fetch Journal Entries
      const entries = await strapi.db.query('api::finance-journal-entry.finance-journal-entry').findMany({
        where: filters,
        populate: ['lines'],
      });

      // 2. Validate Reconciliation
      let totalDebits = 0;
      let totalCredits = 0;

      entries.forEach((entry: any) => {
        totalDebits += Number(entry.totalDebitBase || 0);
        totalCredits += Number(entry.totalCreditBase || 0);
      });

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return ctx.badRequest('Reconciliation Error', {
          message: \`Financial statements cannot be generated. Debits ($$\{totalDebits.toFixed(2)}\) do not equal Credits ($$\{totalCredits.toFixed(2)}\).\`
        });
      }

      // 3. Aggregate Accounts
      const balances: Record<string, number> = {};
      
      // Fallback Chart of Accounts Mapping if DB chart is empty
      const accountTypes: Record<string, string> = {
        '1010': 'Asset',
        '1020': 'Asset',
        '1030': 'Asset',
        '1040': 'Asset',
        '1100': 'Asset', // AR
        '1500': 'Asset', // Property
        '2010': 'Liability', // AP
        '2020': 'Liability', // Unearned
        '2050': 'Liability', // Advance Wallet
        '3010': 'Equity',
        '4010': 'Revenue',
        '4020': 'Revenue',
        '4030': 'Revenue',
        '5010': 'Expense',
        '5020': 'Expense',
        '5030': 'Expense'
      };

      entries.forEach((entry: any) => {
        if (entry.lines && Array.isArray(entry.lines)) {
          entry.lines.forEach((line: any) => {
            // Extract code like "Bank Account (1010)" -> "1010"
            let codeMatch = line.account?.match(/\\((\\d{4})\\)/);
            let code = codeMatch ? codeMatch[1] : line.account;
            
            if (!balances[code]) balances[code] = 0;
            
            const amt = Number(line.amount || 0);
            
            // Debit adds to Assets/Expenses, Credit reduces.
            // Debit reduces Liab/Eq/Rev, Credit adds.
            const type = accountTypes[code] || 'Asset';
            
            if (type === 'Asset' || type === 'Expense') {
              if (line.type === 'debit') balances[code] += amt;
              else balances[code] -= amt;
            } else {
              if (line.type === 'credit') balances[code] += amt;
              else balances[code] -= amt;
            }
          });
        }
      });

      // 4. Generate Output Report
      const reportHash = crypto.createHash('sha256').update(JSON.stringify(balances) + Date.now()).digest('hex');

      return ctx.send({
        success: true,
        reportHash,
        totalDebits,
        totalCredits,
        balances,
        generationDate: new Date().toISOString()
      });

    } catch (err: any) {
      ctx.throw(500, err.message);
    }
  }
}));
`);

console.log('Created finance-reports custom API');
