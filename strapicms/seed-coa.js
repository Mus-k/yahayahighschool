const { Client } = require('pg');

async function run() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();

  const now = new Date();
  
  const accounts = [
    { code: '1010', name: 'Bank Account (Islamic/Commercial)', type: 'Asset' },
    { code: '1020', name: 'Mobile Money Account (Orange/MTN/Wave)', type: 'Asset' },
    { code: '1030', name: 'Cash Account', type: 'Asset' },
    { code: '1040', name: 'Cheque Account', type: 'Asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
    { code: '1500', name: 'Campus Land & Buildings', type: 'Asset' },
    { code: '2010', name: 'Accounts Payable', type: 'Liability' },
    { code: '2020', name: 'Unearned / Prepaid Tuition', type: 'Liability' },
    { code: '2050', name: 'Advance Wallet Liability', type: 'Liability' },
    { code: '3010', name: 'Retained Institutional Equity', type: 'Equity' },
    { code: '4010', name: 'Academic Tuition Fees', type: 'Revenue' },
    { code: '4020', name: 'Waqf & Donations', type: 'Revenue' },
    { code: '4030', name: 'Auxiliary Services', type: 'Revenue' },
    { code: '5010', name: 'Faculty Salaries', type: 'Expense' },
    { code: '5020', name: 'Campus Utilities', type: 'Expense' },
    { code: '5030', name: 'IT Infrastructure', type: 'Expense' }
  ];

  try {
    for (const acc of accounts) {
      let res = await client.query("SELECT id FROM finance_accounts WHERE account_code = $1", [acc.code]);
      if (res.rows.length === 0) {
        await client.query(
          "INSERT INTO finance_accounts (account_code, account_name, account_type, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [acc.code, acc.name, acc.type, true, now, now]
        );
        console.log(`Inserted account ${acc.code} - ${acc.name}`);
      } else {
        console.log(`Account ${acc.code} already exists`);
      }
    }
    console.log("Chart of Accounts seeded successfully.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();
