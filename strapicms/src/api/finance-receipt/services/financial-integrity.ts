/**
 * Financial Integrity Guard Service
 * Provides invariant validation functions for accounting transactions.
 * If any check fails, throws a descriptive error to trigger database transaction ROLLBACK.
 */

export interface InvoiceIntegrityCheck {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
}

export interface WalletIntegrityCheck {
  openingBalance: number;
  credits: number;
  debits: number;
  closingBalance: number;
}

export interface JournalIntegrityCheck {
  totalDebit: number;
  totalCredit: number;
}

export interface LedgerIntegrityCheck {
  openingBalance: number;
  debits: number;
  credits: number;
  closingBalance: number;
}

export function assertInvoiceIntegrity(check: InvoiceIntegrityCheck): void {
  const diff = Math.abs(check.totalAmount - (check.paidAmount + check.remainingBalance));
  if (diff > 0.005) {
    throw new Error(
      `[Financial Integrity Violation] Invoice imbalance: Total ($${check.totalAmount.toFixed(2)}) != Paid ($${check.paidAmount.toFixed(2)}) + Remaining ($${check.remainingBalance.toFixed(2)})`
    );
  }
}

export function assertJournalIntegrity(check: JournalIntegrityCheck): void {
  const diff = Math.abs(check.totalDebit - check.totalCredit);
  if (diff > 0.005) {
    throw new Error(
      `[Financial Integrity Violation] Double-Entry Journal mismatch: Total Debit ($${check.totalDebit.toFixed(2)}) != Total Credit ($${check.totalCredit.toFixed(2)})`
    );
  }
}

export function assertWalletIntegrity(check: WalletIntegrityCheck): void {
  const expectedClosing = check.openingBalance + check.credits - check.debits;
  const diff = Math.abs(expectedClosing - check.closingBalance);
  if (diff > 0.005) {
    throw new Error(
      `[Financial Integrity Violation] Wallet running balance error: Opening ($${check.openingBalance.toFixed(2)}) + Credits ($${check.credits.toFixed(2)}) - Debits ($${check.debits.toFixed(2)}) = Expected $${expectedClosing.toFixed(2)}, got Closing $${check.closingBalance.toFixed(2)}`
    );
  }
}

export function assertLedgerIntegrity(check: LedgerIntegrityCheck): void {
  const expectedClosing = check.openingBalance + check.debits - check.credits;
  const diff = Math.abs(expectedClosing - check.closingBalance);
  if (diff > 0.005) {
    throw new Error(
      `[Financial Integrity Violation] Student Ledger balance mismatch: Opening ($${check.openingBalance.toFixed(2)}) + Debits ($${check.debits.toFixed(2)}) - Credits ($${check.credits.toFixed(2)}) = Expected $${expectedClosing.toFixed(2)}, got Closing $${check.closingBalance.toFixed(2)}`
    );
  }
}

export function assertSystemWideReconciliation(invoiced: number, revenue: number, outstanding: number): void {
  const diff = Math.abs(invoiced - (revenue + outstanding));
  if (diff > 0.005) {
    throw new Error(
      `[Financial Integrity Violation] System-wide Reconciliation Error: Invoiced ($${invoiced.toFixed(2)}) != Revenue ($${revenue.toFixed(2)}) + Outstanding ($${outstanding.toFixed(2)})`
    );
  }
}
