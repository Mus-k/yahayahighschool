const axios = require('axios');

async function test() {
  try {
    const invRes = await axios.get('http://127.0.0.1:1339/api/finance-invoices?filters[invoiceNumber][$eq]=INV-2026-7194');
    const invoice = invRes.data.data[0];
    if (!invoice) {
      console.log('Invoice not found');
      return;
    }
    
    console.log('Found invoice doc id:', invoice.documentId);
    
    const res = await axios.post('http://127.0.0.1:1339/api/finance-receipts', {
      data: {
        paymentAmount: 2,
        baseAmount: 2,
        paymentMethod: 'Advance Wallet',
        receiptNumber: `RCP-TEST-INV-${Date.now()}`,
        status: 'completed',
        student: 83, // Ahmet Camara ID
        invoice: invoice.documentId
      }
    });
    console.log('Success receipt:', res.data);
  } catch (err) {
    console.error('Error occurred');
    console.dir(err?.response?.data || err, { depth: null });
  }
}
test();
