export type FinanceRole = 'super_admin' | 'account_lead' | 'accountant' | 'director' | 'parent' | 'student';

export type EnterpriseWorkflowStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'closed'
  | 'pending'
  | 'active'
  | string;

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type PaymentMethodType = 
  | 'Cash'
  | 'Bank Transfer'
  | 'Orange Money'
  | 'MTN Money'
  | 'Wave Mobile'
  | 'Stripe Card'
  | 'PayPal'
  | 'POS Terminal'
  | 'Cheque'
  | 'Manual Adjustment'
  | 'Scholarship Credit'
  | 'Advance Wallet';

export interface MultilingualText {
  en: string;
  fr?: string;
  ar?: string;
  tr?: string;
}

// 1. Academic Year Separation & Partitioning
export interface FinancialPartition {
  schoolId?: string;
  campusId?: string;
  academicYearId?: string;
  academicYearCode?: string; // e.g. "2026-2027"
  termId?: string;
  termName?: string;
}

// 2. Student Financial Account & Ledger
export interface StudentFinanceAccount extends FinancialPartition {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  gradeCode: string;
  sectionName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  netBalance: number;       // Positive means student owes school; negative means credit/overpaid
  netBalanceDue?: number;   // alias for netBalance
  totalInvoiced: number;
  totalInvoicedYTD?: number;// alias for totalInvoiced
  totalPaid: number;
  totalPaidYTD?: number;    // alias for totalPaid
  gradeLevel?: string;      // alias for gradeCode
  totalDiscounts: number;
  totalScholarships: number;
  financialHold: boolean;
  holdReasons: ('report_cards' | 'exams' | 'promotions' | 'certificates')[];
  currency: string;
  updatedAt: string;
}

export interface StudentLedgerEntry extends FinancialPartition {
  id: string;
  studentId: string;
  documentNumber: string;   // e.g., INV-2026-000001 or RCP-2026-000001
  type: 'debit' | 'credit'; // Debit increases owed balance (invoices, late fees); Credit reduces owed balance (payments, scholarships)
  description: string;
  amount: number;
  runningBalance: number;
  transactionDate: string;
  referenceId?: string;
  postedBy: string;
}

// 3. Dynamic Fee Structures
export interface FeeStructureItem {
  id: string;
  name: string;
  category: 'Registration' | 'Tuition' | 'Hostel' | 'Library' | 'Laboratory' | 'Transport' | 'Examination' | 'Other';
  amount: number;
  isRecurring: boolean; // recurring each term or one-time
  isOptional: boolean;
}

export interface FeeStructure extends FinancialPartition {
  id: string;
  code?: string;
  title?: string;
  name: any; // alias for title
  description?: string;
  targetGrades?: string[];
  gradeCode: any;
  studentCategory?: string;
  programId?: string;
  programName?: string;
  currency?: string;
  items: any[];
  totalAmount?: number;
  totalAnnualFee: any; // alias for totalAmount
  amount?: number;
  isOptional?: boolean;
  isActive: boolean;
  createdAt: any;
  [key: string]: any;
}

// 4. Installment Plans & Automatic Late Fee Rules
export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
}

export interface InstallmentPlan extends FinancialPartition {
  id: string;
  studentId: string;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  frequency: 'Monthly' | 'Bi-Monthly' | 'Termly' | 'Custom';
  schedule: InstallmentScheduleItem[];
  status: 'active' | 'completed' | 'defaulted';
  createdAt: string;
}

export interface LateFeeRule extends FinancialPartition {
  id: string;
  name: string;
  gracePeriodDays: number;
  feeType: 'percentage' | 'fixed';
  feeValue: number;
  maxAccumulatedFee?: number;
  isActive: boolean;
}

// 5. Invoices
export interface InvoiceLineItem {
  id: string;
  description: string;
  category: string;
  unitAmount: number;
  quantity: number;
  totalAmount: number;
  feeStructureItemId?: string;
}

export interface Invoice extends FinancialPartition {
  id: string;
  documentId?: string;
  invoiceNumber: string; // INV-YYYY-XXXXXX
  studentId: string;
  student?: any;
  installments?: any;
  invoiceCurrency?: any;
  baseCurrency?: string;
  studentName: string;
  admissionNumber: string;
  parentName: string;
  parentEmail: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  scholarshipAmount: number;
  lateFeeAmount: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: EnterpriseWorkflowStatus;
  notes?: string;
  installmentPlanId?: string;
  createdBy: string;
  approvedBy?: string;
}

// 6. Multi-Method Payments, Gateways & Cashier Sessions
export interface CashierSession {
  id: string;
  sessionCode?: string; // CSH-YYYY-XXXX
  sessionNumber: string; // alias for sessionCode
  cashierName: string;
  cashierUserId?: string;
  schoolId?: string;
  campusId?: string;
  openingDate?: string;
  openedAt: string; // alias for openingDate
  closingDate?: string;
  closedAt?: string; // alias for closingDate
  status: 'open' | 'closed' | 'reconciling' | string;
  openingCash: number;
  expectedClosingCash: number;
  actualClosingCash?: number;
  varianceAmount?: number;
  variance: number; // alias for varianceAmount
  receiptsCount?: number;
  totalCollections: any; // supports number or { cash: number, ... }
  notes?: string;
  [key: string]: any;
}

export interface PaymentReceipt extends FinancialPartition {
  id: string;
  receiptNumber: string; // RCP-YYYY-XXXXXX
  invoiceId?: string;
  invoiceNumber?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  parentName: string;
  cashierName: string;
  cashierSessionId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  referenceNumber?: string;
  bankName?: string;
  mobileOperator?: 'Orange' | 'MTN' | 'Wave' | 'Other' | string;
  gatewayTransactionId?: string;
  gatewayStatus?: 'succeeded' | 'pending' | 'failed' | 'refunded' | string;
  paymentDate: string;
  remainingStudentBalance: number;
  notes?: string;
  verificationCode: string; // For public verification /verify/receipt/[code]
  qrPayloadUrl: string;
  attachments?: string[];
  status: 'posted' | 'reconciled' | 'cancelled' | 'refunded' | string;
  [key: string]: any;
}

// 7. Scholarships & Discounts
export interface Scholarship extends FinancialPartition {
  id: string;
  code?: string;
  scholarshipCode?: string; // alias for code
  name: any;
  studentId?: string;
  studentName?: string;
  sponsorName?: string;
  sponsorType?: string;
  type: any;
  coverageType?: 'percentage' | 'fixed' | string;
  coverageValue?: number;
  coveragePercentage?: number;
  maxAmountPerStudent?: number;
  validFrom?: string;
  validTo?: string;
  allocatedBudget?: number;
  totalAllocated: any;
  totalDisbursed: any;
  utilizedAmount?: number;
  recipientCount?: number;
  activeRecipientsCount: any;
  status: string;
  isActive: any;
  awardedDate?: string;
  [key: string]: any;
}

export interface DiscountRule extends FinancialPartition {
  id: string;
  code?: string;
  name: string;
  type: string;
  discountValue?: any;
  value: any; // alias for discountValue
  isPercentage?: boolean;
  requiresApprovalAbove?: number;
  activeBeneficiariesCount: any;
  applicableFeeIds?: string[];
  isActive: boolean;
  [key: string]: any;
}

// 8. Staff Payroll & HR Integration
export interface HRStaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  department: string;
  baseSalary: number;
  hourlyRate: number;
  workingDaysInPeriod: number;
  daysPresent: number;
  daysLate: number;
  unpaidLeaveDays: number;
  attendancePercentage: number;
  approvedOvertimeHours: number;
  overtimeRateMultiplier: number;
  taxRatePercentage: number;
  healthInsuranceDeduction: number;
  pensionContribution: number;
  [key: string]: any;
}

export interface PayslipItem {
  name: string;
  type: 'earning' | 'allowance' | 'bonus' | 'overtime' | 'deduction' | 'tax' | 'loan_repayment';
  amount: number;
}

export interface Payslip extends FinancialPartition {
  id: string;
  payslipNumber: string; // PSL-YYYY-XXXXXX
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: 'Teacher' | 'Worker' | 'Driver' | 'Director' | 'Imam' | 'Muezzin' | 'Administrator';
  bankAccountDetails: string;
  basicSalary: number;
  totalAllowances: number;
  overtimeAllowances: number;
  attendanceDeductions: number; // Linked to LMS/Worker attendance
  leaveDeductions: number;
  taxAmount: number;
  otherDeductions: number;
  netSalary: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: EnterpriseWorkflowStatus;
  items: PayslipItem[];
  issuedDate: string;
}

export interface PayrollRun extends FinancialPartition {
  id: string;
  runNumber: string; // PAY-YYYY-XXXXXX
  payrollNumber: any; // alias for runNumber
  title: string;
  month: number;
  year: number;
  payPeriod: any;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  deductionsAmount: any; // alias for totalDeductions
  totalTaxes: number;
  totalNetPay: number;
  netPayable: any; // alias for totalNetPay
  staffName: any;
  staffRole: any;
  department: any;
  attendanceRate: any;
  overtimeHours: any;
  overtimeAmount: any;
  baseSalary: any;
  currency: string;
  status: EnterpriseWorkflowStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  paidDate?: string;
  journalEntryId?: string;
  [key: string]: any;
}

// 9. Categorized Expense Management
export interface ExpenseRequestItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExpenseRequest extends FinancialPartition {
  id: string;
  expenseNumber: string; // EXP-YYYY-XXXXXX
  voucherNumber: any; // alias for expenseNumber
  title: string;
  category: string;
  departmentName: string;
  department?: string; // alias for departmentName
  departmentBudgetId?: string;
  requestedBy: string;
  requestedUserId: string;
  amount: number;
  currency: string;
  status: EnterpriseWorkflowStatus;
  items: ExpenseRequestItem[];
  vendorName: any;
  invoiceReference?: string;
  paymentMethod?: PaymentMethodType;
  attachments?: string[];
  submittedAt: string;
  date?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  journalEntryId?: string;
  rejectionReason?: string;
  [key: string]: any;
}

export type ExpenseVoucher = ExpenseRequest;

// 10. Departmental Budget vs. Actual Analytics
export interface DepartmentBudget extends FinancialPartition {
  id: string;
  code: string;
  departmentName: string;
  headOfDepartment: any;
  budgetTitle: string;
  allocatedAmount: number;
  committedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  varianceAmount: number;
  utilizationPercentage: number;
  currency: string;
  status: string;
  approvedBy?: string;
  [key: string]: any;
}

export type DepartmentalBudget = DepartmentBudget;

// 11. Professional Double-Entry Accounting Engine
export interface ChartOfAccount {
  id: string;
  accountCode: string; // e.g. 1000, 1010, 2000, 4000, 5000
  accountName: string;
  accountType: AccountType;
  parentAccountCode?: string;
  isControlAccount: boolean;
  isActive: boolean;
  currentBalance: number;
  currency: string;
  description?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debitAmount?: any;
  creditAmount?: any;
  debit?: any; // alias or value
  credit?: any; // alias or value
  memo?: string;
  studentId?: string;
  employeeId?: string;
  vendorName?: string;
  [key: string]: any;
}

export interface JournalEntry extends FinancialPartition {
  id: string;
  journalNumber: string; // JRN-YYYY-XXXXXX
  title: string;
  description?: any; // alias for title
  transactionDate: string;
  postingDate?: any; // alias for transactionDate
  sourceDocumentNumber?: string; // INV, RCP, EXP, PAY
  referenceNumber?: any; // alias for sourceDocumentNumber
  sourceModule: 'student_billing' | 'payroll' | 'expenses' | 'donations' | 'manual_journal' | 'closing_entry' | string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  lines: JournalLine[];
  status: 'posted' | 'draft' | 'cancelled' | string;
  postedBy: string;
  postedAt: string;
  [key: string]: any;
}

// 12. Multi-Currency Bank & Cash Treasury
export interface BankAccount {
  id: string;
  accountCode: string; // Links to Chart of Accounts e.g. 1010
  accountName: string;
  accountType: 'Bank Account' | 'Cash Drawer' | 'Petty Cash' | 'Mobile Money Wallet';
  bankName?: string;
  accountNumber?: string;
  currency: string;
  currentBalance: number;
  reconciledBalance: number;
  lastReconciledDate?: string;
  isActive: boolean;
}

// 13. Accounting Period Control
export interface AccountingPeriod extends FinancialPartition {
  id: string;
  code?: string;
  periodCode?: string; // e.g., "2026-Q1" or "2026-07"
  periodNumber?: string; // alias for periodCode
  name: string;
  fiscalYear?: string;
  startDate: string;
  endDate: string;
  status?: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  notes?: string;
}

// 14. Immutable Finance Audit Log
export interface FinanceAuditLog {
  id: string;
  logNumber: string;
  action: 'create' | 'update' | 'approve' | 'pay' | 'cancel' | 'lock_period' | 'post_journal';
  entityType: 'invoice' | 'payment' | 'expense' | 'payroll' | 'budget' | 'journal' | 'account' | 'period';
  entityId: string;
  entityNumber: string;
  performedBy: string;
  performedUserId: string;
  roleName: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  changeSummary: string;
}

// 15. Executive Dashboard & Analytics
export interface ExecutiveFinanceStats {
  kpi: {
    totalRevenueYTD: number;
    outstandingFees: number;
    todayCollections: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    payrollThisMonth: number;
    pendingApprovalsCount: number;
    pendingInvoicesCount: number;
    activeStudentsCount: number;
    activeScholarshipsTotal: number;
    netCashFlow: number;
    feeCollectionRate: number; // percentage e.g. 88.5
  };
  charts: {
    revenueVsExpenseMonthly: { month: string; revenue: number; expense: number; net: number }[];
    collectionsByMethod: { method: string; amount: number; percentage: number }[];
    expensesByCategory: { category: string; amount: number; percentage: number }[];
    budgetVsActualDepartment: { department: string; allocated: number; spent: number }[];
  };
  treasuryInsights: {
    totalBankBalance: number;
    totalCashInDrawer: number;
    totalMobileMoney: number;
    estimatedRunwayMonths: number;
  };
  recentTransactions: {
    id: string;
    documentNumber: string;
    title: string;
    type: 'Tuition Receipt' | 'Expense Disbursement' | 'Payroll Payment' | 'Waqf Donation';
    amount: number;
    date: string;
    status: string;
  }[];
  treasury?: {
    bank?: { name: string; balance: number; currency: string };
    mobileMoney?: { name: string; balance: number; currency: string };
    cashDrawer?: { name: string; balance: number; currency: string };
    cheque?: { name: string; balance: number; currency: string };
  };
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  action: string;
  module: string;
  entityId: string;
  details: string;
  hash?: string;
  payloadSnapshot?: any;
}

export interface DonationRecord {
  id: string;
  receiptNumber: string;
  campaignName: string;
  donorName: string;
  donorEmail?: string;
  paymentMethod: string;
  date: string;
  amount: number;
  currency?: string;
  status?: string;
  isAnonymous?: boolean;
  receiptIssued?: boolean;
  notes?: string;
  [key: string]: any;
}

export interface FinancialLedgerTransaction extends FinancialPartition {
  id: string;
  transactionId: string;
  type: string;
  description: string;
  partyName?: string;
  date: string;
  referenceId?: string;
  debitAmount: number;
  creditAmount: number;
  status: string;
  currency?: string;
  [key: string]: any;
}

export interface MultiCurrencyRate {
  id: string;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  exchangeRateToUSD: number;
  isBase?: boolean;
  isBaseCurrency?: boolean;
  isActive?: boolean;
  isAutoSynced?: boolean;
  lastUpdated: string;
  [key: string]: any;
}

export interface FinanceSettings {
  id?: string;
  fiscalYearStart?: string;
  defaultCurrency?: string;
  lateFeeRule?: string;
  enableFinancialHolds?: boolean;
  autoReceiptNumbering?: string;
  doubleEntryParity?: string;
  [key: string]: any;
}
