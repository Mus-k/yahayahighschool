/**
 * Custom route: POST /api/finance-receipts/apply-wallet
 * Applies a student's advance wallet balance to an invoice atomically.
 * This bypasses the lifecycle hook to guarantee the DB update succeeds.
 *
 * SECURITY: Both routes require JWT authentication (Strapi default).
 * Do NOT set auth: false — these endpoints mutate financial records.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/finance-receipts/apply-wallet',
      handler: 'finance-receipt.applyWallet',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/finance-receipts/combined-payment',
      handler: 'finance-receipt.combinedPayment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/finance-receipts/verify-e2e',
      handler: 'finance-receipt.verifyE2EScenario',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
