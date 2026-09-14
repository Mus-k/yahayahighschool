/**
 * finance-receipt lifecycles.ts
 *
 * CRITICAL: All DB updates run SYNCHRONOUSLY inside afterCreate (no process.nextTick).
 * This ensures invoice balances and student advance wallet are updated BEFORE
 * Strapi returns the HTTP response, so the frontend re-fetch always sees fresh data.
 */

function extractPrimitiveIdOrDoc(val: any): string | number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') return val;
  if (typeof val === 'object') {
    if (val.documentId && typeof val.documentId === 'string') return val.documentId;
    if (val.id && (typeof val.id === 'number' || typeof val.id === 'string')) return val.id;
    if (Array.isArray(val.set) && val.set.length > 0) return extractPrimitiveIdOrDoc(val.set[0]);
    if (Array.isArray(val.connect) && val.connect.length > 0) return extractPrimitiveIdOrDoc(val.connect[0]);
    if (Array.isArray(val) && val.length > 0) return extractPrimitiveIdOrDoc(val[0]);
  }
  return null;
}

export default {
  async afterCreate(event: any) {
    const { result } = event;
    if (!result) return;

    const rawData = event.params?.data || {};
    const paymentMetadata = result.paymentMetadata || rawData.paymentMetadata || {};

    if (paymentMetadata.isCombined || (paymentMetadata.provider === 'Advance Wallet' && paymentMetadata.gatewayStatus === 'AUTO_APPLIED')) {
      strapi.log.info(`[Receipt Lifecycle] Bypassing controller-handled receipt ${result.receiptNumber}`);
      return;
    }

    try {
      const paymentAmount = Number(result.paymentAmount || rawData.paymentAmount || result.amount || 0);
      const baseAmount = Number(result.baseAmount || rawData.baseAmount || paymentAmount);
      const exchangeRate = Number(result.exchangeRateToInvoice || rawData.exchangeRateToInvoice || 1);

      if (paymentAmount <= 0) return;

      // 1. Resolve Student
      const rawStudent = rawData.student || result.student;
      const studentRef = extractPrimitiveIdOrDoc(rawStudent);
      let student: any = null;
      if (studentRef) {
        const isNumeric = typeof studentRef === 'number' || (!isNaN(Number(studentRef)) && String(Number(studentRef)) === String(studentRef));
        if (isNumeric) {
          student = await strapi.db.query('api::student.student').findOne({
            where: { id: Number(studentRef) },
          });
        } else {
          student = await strapi.db.query('api::student.student').findOne({
            where: { documentId: String(studentRef) },
          });
          if (!student) {
            student = await strapi.db.query('api::student.student').findOne({
              where: { schoolId: String(studentRef) },
            });
          }
        }
      }

      const studentId = student ? student.id : null;

      // 2. Resolve Invoice
      const rawInvoice = rawData.invoice || result.invoice;
      const invoiceRef = extractPrimitiveIdOrDoc(rawInvoice);
      let invoice: any = null;
      if (invoiceRef) {
        const isNumeric = typeof invoiceRef === 'number' || (!isNaN(Number(invoiceRef)) && String(Number(invoiceRef)) === String(invoiceRef));
        if (isNumeric) {
          invoice = await strapi.db.query('api::finance-invoice.finance-invoice').findOne({
            where: { id: Number(invoiceRef) },
          });
        } else {
          invoice = await strapi.db.query('api::finance-invoice.finance-invoice').findOne({
            where: { documentId: String(invoiceRef) },
          });
          if (!invoice) {
            invoice = await strapi.db.query('api::finance-invoice.finance-invoice').findOne({
              where: { invoiceNumber: String(invoiceRef) },
            });
          }
        }
      }

      // 3. Link student and invoice to the receipt document if missing
      if (result.id && (invoice || student)) {
        try {
          const receiptUpdate: any = {};
          if (invoice) receiptUpdate.invoice = invoice.id;
          if (student) receiptUpdate.student = student.id;
          await strapi.db.query('api::finance-receipt.finance-receipt').update({
            where: { id: result.id },
            data: receiptUpdate,
          });
        } catch (err: any) {
          strapi.log.warn('[Receipt Lifecycle] Failed linking receipt relations:', err?.message || err);
        }
      }

      let amountCoveringInvoice = 0;
      let overpaymentInPayCurrency = 0;

      if (invoice) {
        try {
          const invoiceId = invoice.id;
          const totalAmount = Number(invoice.totalAmount || 0);
          const alreadyPaid = Number(invoice.paidAmount || 0);
          const currentRemaining = Math.max(0, totalAmount - alreadyPaid);

          const paymentInInvoiceCurrency = paymentAmount * exchangeRate;

          if (paymentInInvoiceCurrency >= currentRemaining) {
            amountCoveringInvoice = currentRemaining;
            const overpaymentInInvoiceCurrency = paymentInInvoiceCurrency - currentRemaining;
            overpaymentInPayCurrency = exchangeRate > 0 ? overpaymentInInvoiceCurrency / exchangeRate : overpaymentInInvoiceCurrency;
          } else {
            amountCoveringInvoice = paymentInInvoiceCurrency;
            overpaymentInPayCurrency = 0;
          }

          const newPaidAmount = alreadyPaid + amountCoveringInvoice;
          const newRemainingBalance = Math.max(0, totalAmount - newPaidAmount);

          let newStatus = invoice.status;
          if (newRemainingBalance <= 0) {
            newStatus = 'paid';
          } else if (newPaidAmount > 0) {
            newStatus = 'partially_paid';
          }

          await strapi.db.query('api::finance-invoice.finance-invoice').update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaidAmount,
              remainingBalance: newRemainingBalance,
              status: newStatus as any,
            },
          });

          strapi.log.info(
            `[Receipt Lifecycle] Invoice ${invoice.invoiceNumber} (id=${invoiceId}) updated: paid=${newPaidAmount}, remaining=${newRemainingBalance}, status=${newStatus}`
          );
        } catch (err: any) {
          strapi.log.error('[Receipt Lifecycle] Failed to update invoice:', err?.message || err);
        }
      } else {
        overpaymentInPayCurrency = paymentAmount;
      }

      // 4. Update Student Advance Wallet
      const paymentMethod = result.paymentMethod || rawData.paymentMethod;
      let walletDeduction = 0;
      if (paymentMethod === 'Advance Wallet') {
        walletDeduction = paymentAmount;
      }

      const netWalletChange = overpaymentInPayCurrency - walletDeduction;

      if (studentId && netWalletChange !== 0) {
        try {
          const currentAdvance = Number(student.advanceBalance || 0);
          const newAdvance = currentAdvance + netWalletChange;

          await strapi.db.query('api::student.student').update({
            where: { id: studentId },
            data: { advanceBalance: newAdvance } as any,
          });

          const txType = netWalletChange > 0 ? 'advance_deposit' : 'wallet_used';
          const changeAmount = Math.abs(netWalletChange);
          const lastWalletTx = await strapi.db.query('api::wallet-transaction.wallet-transaction').findOne({
            where: { student: studentId },
            orderBy: { transactionDate: 'desc' },
          }) as any;
          const prevWalletRunning = lastWalletTx ? Number(lastWalletTx.runningBalance || 0) : 0;
          const newWalletRunning = prevWalletRunning + netWalletChange;

          await strapi.db.query('api::wallet-transaction.wallet-transaction').create({
            data: {
              student: studentId,
              transactionType: txType,
              amount: changeAmount,
              runningBalance: newWalletRunning,
              referenceNumber: result.receiptNumber,
              user: 'System / Lifecycle',
              reason: txType === 'advance_deposit' ? 'Excess payment credit to wallet' : 'Wallet used to settle invoice',
              transactionDate: new Date().toISOString(),
            },
          });

          strapi.log.info(
            `[Receipt Lifecycle] Student ${student.schoolId} advance wallet: ${currentAdvance} → ${newAdvance} (change: ${netWalletChange > 0 ? '+' : ''}${netWalletChange})`
          );
        } catch (err: any) {
          strapi.log.error('[Receipt Lifecycle] Failed to update student advance wallet:', err?.message || err);
        }
      }

      // 5. Student Ledger Entry
      if (studentId) {
        try {
          const lastLedger = await strapi.db
            .query('api::finance-ledger-entry.finance-ledger-entry')
            .findOne({
              where: { student: studentId },
              orderBy: { transactionDate: 'desc' },
            });

          const prevRunning = lastLedger ? Number((lastLedger as any).runningBalance || 0) : 0;
          const newRunningBalance = prevRunning - baseAmount;

          const ledgerType = overpaymentInPayCurrency > 0 && amountCoveringInvoice === 0
            ? 'advance_deposit'
            : overpaymentInPayCurrency > 0
            ? 'credit_with_advance'
            : 'credit';

          const description =
            overpaymentInPayCurrency > 0
              ? `Payment Received: ${result.receiptNumber} (Invoice settled + $${overpaymentInPayCurrency.toFixed(2)} credited to Advance Wallet)`
              : `Payment Received: ${result.receiptNumber}`;

          await strapi.db.query('api::finance-ledger-entry.finance-ledger-entry').create({
            data: {
              student: studentId,
              documentNumber: result.receiptNumber,
              type: ledgerType,
              description,
              baseAmount: baseAmount,
              runningBalance: newRunningBalance,
              transactionDate: new Date().toISOString().split('T')[0],
            } as any,
          });
        } catch (err: any) {
          strapi.log.error('[Receipt Lifecycle] Failed to create ledger entry:', err?.message || err);
        }
      }

      // 6. Double-Entry Journal
      try {
        const entryNumber = `JRN-${Date.now()}`;
        await strapi.db.query('api::finance-journal-entry.finance-journal-entry').create({
          data: {
            entryNumber,
            date: new Date().toISOString().split('T')[0],
            description: `Payment Receipt ${result.receiptNumber}`,
            totalDebitBase: baseAmount,
            totalCreditBase: baseAmount,
            status: 'posted',
            lines: [
              { account: 'Cash / Bank', type: 'debit', amount: baseAmount },
              { account: 'Accounts Receivable', type: 'credit', amount: baseAmount },
            ],
          } as any,
        });
      } catch (err: any) {
        strapi.log.warn('[Receipt Lifecycle] Journal entry failed:', err?.message || err);
      }
    } catch (err: any) {
      strapi.log.error('[Receipt Lifecycle] Critical afterCreate error:', err?.message || err);
    }
  },
};
