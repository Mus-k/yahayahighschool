"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    async afterCreate(event) {
        const { result } = event;
        if (!result)
            return;
        try {
            const baseAmount = Number(result.baseTotalAmount || result.totalAmount || 0);
            if (baseAmount <= 0)
                return;
            let entryNumber = `JRN-${Date.now()}`;
            // Safe creation of Journal Entry
            try {
                await strapi.documents('api::finance-journal-entry.finance-journal-entry').create({
                    data: {
                        entryNumber,
                        date: new Date().toISOString().split('T')[0],
                        description: `Invoice ${result.invoiceNumber || ''} recognized`,
                        totalDebitBase: baseAmount,
                        totalCreditBase: baseAmount,
                        status: 'posted',
                        lines: [
                            { account: 'Accounts Receivable', type: 'debit', amount: baseAmount },
                            { account: 'Tuition Revenue', type: 'credit', amount: baseAmount }
                        ]
                    }
                });
            }
            catch (err) {
                // Journal entry creation is secondary
            }
            // Safe creation of Student Ledger Entry
            if (result.student) {
                try {
                    const studentId = typeof result.student === 'object' ? result.student.id : result.student;
                    const lastLedgers = await strapi.documents('api::finance-ledger-entry.finance-ledger-entry').findMany({
                        filters: { student: { id: { $eq: studentId } } },
                        limit: 1,
                    });
                    const lastLedger = lastLedgers === null || lastLedgers === void 0 ? void 0 : lastLedgers[0];
                    const runningBalance = (lastLedger ? Number(lastLedger.runningBalance || 0) : 0) + baseAmount;
                    await strapi.documents('api::finance-ledger-entry.finance-ledger-entry').create({
                        data: {
                            student: studentId,
                            documentNumber: result.invoiceNumber,
                            type: 'debit',
                            description: `Invoice Charge: ${result.invoiceNumber}`,
                            baseAmount: baseAmount,
                            runningBalance: runningBalance,
                            transactionDate: new Date().toISOString().split('T')[0],
                        }
                    });
                }
                catch (err) {
                    // Student ledger entry creation is secondary
                }
            }
        }
        catch (err) {
            // Synchronous lifecycle error handler
        }
    }
};
