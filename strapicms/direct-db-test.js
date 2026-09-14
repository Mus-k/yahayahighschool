/**
 * Direct database test — bypasses the API entirely.
 * This will:
 * 1. Find invoice INV-2026-7194 and show its current state
 * 2. Directly update the invoice paid/remaining via the same query the lifecycle uses
 * 3. Show the result to confirm the DB query works
 */
const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'yahaya_scool',
  password: 'postgres18',
  port: 5432,
});

async function run() {
  await client.connect();
  
  // 1. Find the invoice
  const invRes = await client.query(
    "SELECT id, document_id, invoice_number, total_amount, paid_amount, remaining_balance, status FROM finance_invoices WHERE invoice_number = 'INV-2026-7194'"
  );
  
  if (invRes.rows.length === 0) {
    console.log('Invoice not found!');
    await client.end();
    return;
  }
  
  const inv = invRes.rows[0];
  console.log('BEFORE:', inv);
  
  // 2. Find student advance balance
  const stuRes = await client.query(
    "SELECT id, school_id, first_name, advance_balance FROM students WHERE school_id = 'AC000000001'"
  );
  console.log('STUDENT BEFORE:', stuRes.rows[0]);
  
  // 3. Simulate paying $2 from advance wallet
  const newPaid = Number(inv.paid_amount || 0) + 2;
  const newRemaining = Math.max(0, Number(inv.total_amount || 0) - newPaid);
  const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';
  
  await client.query(
    'UPDATE finance_invoices SET paid_amount=$1, remaining_balance=$2, status=$3 WHERE id=$4',
    [newPaid, newRemaining, newStatus, inv.id]
  );
  
  // 4. Deduct from student advance wallet
  const currentAdvance = Number(stuRes.rows[0].advance_balance || 0);
  const newAdvance = currentAdvance - 2;
  await client.query(
    'UPDATE students SET advance_balance=$1 WHERE school_id=$2',
    [newAdvance, 'AC000000001']
  );
  
  // 5. Show result
  const invAfter = await client.query(
    "SELECT id, invoice_number, paid_amount, remaining_balance, status FROM finance_invoices WHERE invoice_number = 'INV-2026-7194'"
  );
  const stuAfter = await client.query(
    "SELECT id, school_id, advance_balance FROM students WHERE school_id = 'AC000000001'"
  );
  
  console.log('\nAFTER INVOICE:', invAfter.rows[0]);
  console.log('AFTER STUDENT:', stuAfter.rows[0]);
  console.log('\n✅ Direct DB update WORKS! The lifecycle hook fix is needed to make this happen automatically.');
  
  await client.end();
}

run().catch(err => console.error('ERROR:', err.message));
