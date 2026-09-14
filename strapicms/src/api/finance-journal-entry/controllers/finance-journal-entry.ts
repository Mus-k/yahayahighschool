import { factories } from '@strapi/strapi';
import crypto from 'crypto';

export default factories.createCoreController('api::finance-journal-entry.finance-journal-entry', ({ strapi }) => ({
  async generateStatement(ctx) {
    console.log('[FINANCE-REPORTS] generateStatement executing double-entry aggregation engine...');
    try {
      const knex = strapi.db.connection;

      let totalDebits = 0;
      let totalCredits = 0;
      const balances: Record<string, number> = {
        '1010': 0, // Bank Account
        '1020': 0, // Mobile Money
        '1030': 0, // Cash
        '1040': 0, // Cheque
        '1100': 0, // Accounts Receivable
        '1500': 0, // Property & Assets
        '2010': 0, // Accounts Payable
        '2020': 0, // Unearned Tuition
        '2050': 0, // Advance Wallet Liability
        '3010': 0, // Retained Equity
        '4010': 0, // Tuition Revenue
        '4020': 0, // Waqf & Donations
        '4030': 0, // Auxiliary Revenue
        '5010': 0, // Faculty Salaries & HR Benefits
        '5020': 0, // Utilities
        '5030': 0, // IT Infrastructure
      };

      // 1. Invoices Aggregation (Revenue Recognition & AR Creation)
      const invoices = await knex('finance_invoices').select('*');

      invoices.forEach((inv: any) => {
        const amt = Number(inv.total_amount || inv.base_total_amount || inv.subtotal || 0);
        if (amt > 0) {
          // Double-Entry: Debit AR (1100), Credit Tuition Revenue (4010)
          totalDebits += amt;
          totalCredits += amt;

          balances['1100'] += amt; // Debit increases AR Asset
          balances['4010'] += amt; // Credit increases Tuition Revenue
        }
      });

      // 2. Receipts / POS Payments Aggregation (Cash Collection, AR Settlement & Wallet Liabilities)
      const receipts = await knex('finance_receipts').select('*');

      receipts.forEach((rcp: any) => {
        const totalReceived = Number(rcp.total_received || rcp.payment_amount || rcp.base_amount || 0);
        let appliedAmount = Number(rcp.applied_amount || 0);
        const walletCreated = Number(rcp.wallet_credit_created || rcp.wallet_credit_generated || 0);

        if (appliedAmount === 0 && totalReceived > 0) {
          appliedAmount = Math.max(0, totalReceived - walletCreated);
        }

        if (totalReceived > 0) {
          totalDebits += totalReceived;
          totalCredits += (appliedAmount + walletCreated);

          const method = (rcp.payment_method || '').toLowerCase();
          let cashAccount = '1010'; // Default Bank Account
          if (method.includes('mobile')) cashAccount = '1020';
          else if (method.includes('cash')) cashAccount = '1030';
          else if (method.includes('cheque')) cashAccount = '1040';

          balances[cashAccount] += totalReceived; // Debit increases Cash/Bank Asset
          balances['1100'] -= appliedAmount;    // Credit decreases AR Asset
          balances['2050'] += walletCreated;       // Credit increases Advance Wallet Liability
        }
      });

      // 3. Paid Payroll Runs Aggregation (Faculty Salaries & HR Benefits Expenses)
      const payrolls = await knex('finance_payrolls').whereIn('status', ['paid', 'disbursed', 'closed']).select('*');

      payrolls.forEach((p: any) => {
        const netPay = Number(p.net_payable || p.base_salary || 0);
        if (netPay > 0) {
          // Double-Entry: Debit Faculty Salaries Expense (5010), Credit Bank Treasury (1010)
          totalDebits += netPay;
          totalCredits += netPay;

          balances['5010'] += netPay; // Debit increases Faculty Salaries Expense
          balances['1010'] -= netPay; // Credit decreases Bank Treasury Asset
        }
      });

      // 4. Manual Journal Entries Aggregation
      const manualEntries = await knex('finance_journal_entrys').select('*');
      if (manualEntries.length > 0) {
        const entryIds = manualEntries.map((e: any) => e.id);
        const lines = await knex('finance_journal_entrys_lines').whereIn('finance_journal_entry_id', entryIds);
        
        lines.forEach((line: any) => {
          let codeMatch = line.account?.match(/\((\d{4})\)/);
          let code = codeMatch ? codeMatch[1] : line.account;
          if (!balances[code]) balances[code] = 0;
          const amt = Number(line.amount || 0);
          
          if (line.type === 'debit') {
            totalDebits += amt;
            balances[code] += amt;
          } else if (line.type === 'credit') {
            totalCredits += amt;
            balances[code] += amt;
          }
        });
      }

      // 5. Double-Entry Reconciliation Check
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        console.log('[FINANCE-REPORTS] Reconciliation mismatch! Debits:', totalDebits, 'Credits:', totalCredits);
        return ctx.conflict('Reconciliation Mismatch', {
          message: `Financial statements cannot be generated. Debits ($${totalDebits.toFixed(2)}) do not equal Credits ($${totalCredits.toFixed(2)}).`
        });
      }

      // 6. Generate Cryptographic Audit Hash
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
      console.error('[FINANCE-REPORTS] Aggregation Error:', err);
      ctx.throw(500, err.message);
    }
  }
}));
