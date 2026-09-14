const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:1339/api/finance-receipts', {
      data: {
        paymentAmount: 2,
        baseAmount: 2,
        paymentMethod: 'Advance Wallet',
        receiptNumber: `RCP-TEST-${Date.now()}`,
        status: 'completed',
        student: 83, // Ahmet Camara ID
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data?.error || err.message);
  }
}
test();
