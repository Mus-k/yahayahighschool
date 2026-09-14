export default {
  routes: [
    {
      method: 'POST',
      path: '/finance-receipts/apply-wallet',
      handler: 'finance-receipt.applyWallet',
    },
    {
      method: 'POST',
      path: '/finance-receipts/combined-payment',
      handler: 'finance-receipt.combinedPayment',
    },
    {
      method: 'POST',
      path: '/finance-receipts/verify-e2e',
      handler: 'finance-receipt.verifyE2EScenario',
    },
  ],
};
