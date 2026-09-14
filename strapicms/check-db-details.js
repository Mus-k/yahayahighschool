const { Client } = require('pg');

async function checkDetails() {
  const c = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await c.connect();

  console.log('--- INVOICES ---');
  const invoices = await c.query('SELECT * FROM finance_invoices');
  console.log(invoices.rows);

  console.log('--- RECEIPTS ---');
  const receipts = await c.query('SELECT * FROM finance_receipts');
  console.log(receipts.rows);

  console.log('--- LEDGER ENTRIES ---');
  const ledgers = await c.query('SELECT * FROM finance_ledger_entrys');
  console.log(ledgers.rows);

  console.log('--- ACCOUNTS ---');
  const accounts = await c.query('SELECT * FROM finance_accounts');
  console.log(accounts.rows);

  await c.end();
}

checkDetails().catch(console.error);
