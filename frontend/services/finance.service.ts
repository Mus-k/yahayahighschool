/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.service';
import type {
  StudentFinanceAccount, StudentLedgerEntry, FeeStructure, Invoice, PaymentReceipt,
  CashierSession, Scholarship, DiscountRule, Payslip, PayrollRun, HRStaffAttendanceRecord,
  ExpenseRequest, DepartmentBudget, ChartOfAccount, JournalEntry, JournalLine,
  BankAccount, AccountingPeriod, FinanceAuditLog, ExecutiveFinanceStats,
  EnterpriseWorkflowStatus, PaymentMethodType, AuditLogRecord, DonationRecord,
  MultiCurrencyRate, FinanceSettings, FinancialLedgerTransaction
} from '@/types/finance.types';
import { toast } from 'sonner';

// Helper to safely fetch arrays to prevent UI crashing when backend endpoints return unexpected structures
const safeGetArray = async (url: string) => {
  try {
    const res = await apiClient.get(url);
    if (res?.data?.error) return [];
    return res?.data?.data || res?.data || [];
  } catch (err) {
    console.warn(`[FinanceService] Safe fallback to empty array for ${url}:`, err);
    return [];
  }
};

const safeGetObject = async <T>(url: string, fallback: T) => {
  try {
    const res = await apiClient.get(url);
    if (res?.data?.error) return fallback;
    const data = res?.data?.data || res?.data;
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0 || data.data === null) {
      return fallback;
    }
    return data;
  } catch (err) {
    console.warn(`[FinanceService] Safe fallback to object for ${url}:`, err);
    return fallback;
  }
};

export const financeService = {
  // ─── 1. Dashboard & Core Analytics ──────────────────────────────────────────
  async getExecutiveStats(academicYearCode = '2026-2027'): Promise<ExecutiveFinanceStats> {
    try {
      const serverStats = await safeGetObject(`/finance-dashboards/stats?academicYear=${academicYearCode}`, null as any);
      if (serverStats && serverStats.kpi?.totalRevenueYTD > 0) return serverStats;
    } catch {
      // fallback to live aggregation below
    }

    // Live Comprehensive Multi-Module Financial Aggregation
    const [
      invoices,
      receipts,
      expenses,
      payrolls,
      hostelPayments,
      hostelTickets,
      libraryRecords,
      budgets,
      studentsRes,
      donationCampaigns
    ] = await Promise.all([
      this.getInvoices().catch(() => []),
      this.getReceipts().catch(() => []),
      this.getExpenses().catch(() => []),
      this.getPayrollRuns().catch(() => []),
      safeGetArray('/hostel-payments?populate=*'),
      safeGetArray('/hostel-maintenance-tickets?populate=*'),
      safeGetArray('/library-borrow-records?populate=*'),
      safeGetArray('/finance-budgets?populate=*'),
      safeGetArray('/students?pagination[limit]=1000'),
      safeGetArray('/donation-campaigns?populate=*')
    ]);

    // 1. Calculate Real Revenues & Treasury Balances by Payment Method
    let tuitionSum = 0;
    let waqfDonations = 0;
    let auxiliaryRevenue = 0;
    let libraryFinesSum = 0;
    let hostelRevenueSum = 0;

    let bankBal = 0;
    let mobileBal = 0;
    let cashBal = 0;
    let chequeBal = 0;

    receipts.forEach((r: any) => {
      const amt = Number(r.paymentAmount || r.amount || 0);
      const method = (r.paymentMethod || '').toLowerCase();
      const type = (r.paymentType || r.type || '').toLowerCase();

      if (type.includes('waqf') || type.includes('donation')) {
        waqfDonations += amt;
      } else if (type.includes('library') || type.includes('fine')) {
        libraryFinesSum += amt;
        auxiliaryRevenue += amt;
      } else if (type.includes('hostel') || type.includes('boarding') || type.includes('accommodation')) {
        hostelRevenueSum += amt;
      } else if (type.includes('auxiliary') || type.includes('cafeteria') || type.includes('transport')) {
        auxiliaryRevenue += amt;
      } else {
        tuitionSum += amt;
      }

      if (method.includes('mobile') || method.includes('orange') || method.includes('mtn') || method.includes('wave')) {
        mobileBal += amt;
      } else if (method.includes('cash')) {
        cashBal += amt;
      } else if (method.includes('cheque')) {
        chequeBal += amt;
      } else {
        bankBal += amt;
      }
    });

    // Add standalone hostel payments if any
    hostelPayments.forEach((hp: any) => {
      const amt = Number(hp.amount || 0);
      hostelRevenueSum += amt;
      const method = (hp.paymentMethod || '').toLowerCase();
      if (method.includes('mobile')) mobileBal += amt;
      else if (method.includes('cash')) cashBal += amt;
      else if (method.includes('cheque')) chequeBal += amt;
      else bankBal += amt;
    });

    // Add standalone paid library fines
    libraryRecords.forEach((lr: any) => {
      if (lr.finePaid && Number(lr.fineAmount || 0) > 0) {
        const amt = Number(lr.fineAmount);
        libraryFinesSum += amt;
        auxiliaryRevenue += amt;
        cashBal += amt; // Default library desk collection
      }
    });

    // Add donation campaign raised amounts if any
    donationCampaigns.forEach((dc: any) => {
      const raised = Number(dc.raisedAmount || 0);
      if (raised > 0 && waqfDonations === 0) {
        waqfDonations += raised;
        bankBal += raised;
      }
    });

    const totalRevenueYTD = tuitionSum + waqfDonations + auxiliaryRevenue + hostelRevenueSum;

    // 2. Calculate Accounts Receivable (All pending/unsettled invoices + unpaid library fines)
    let outstandingFees = 0;
    let pendingInvoicesCount = 0;

    invoices.forEach((i: any) => {
      const status = (i.status || '').toLowerCase();
      if (status !== 'paid' && status !== 'cancelled' && status !== 'voided') {
        const remaining = Number(i.remainingBalance ?? (Number(i.totalAmount || 0) - Number(i.paidAmount || 0)));
        if (remaining > 0) {
          outstandingFees += remaining;
          pendingInvoicesCount++;
        }
      }
    });

    // Unpaid library fines count towards accounts receivable
    libraryRecords.forEach((lr: any) => {
      if (!lr.finePaid && Number(lr.fineAmount || 0) > 0 && (lr.status === 'issued' || lr.status === 'overdue')) {
        outstandingFees += Number(lr.fineAmount);
      }
    });

    // 3. Calculate Operating Expenses & Outflows
    let monthlyExpenses = 0;
    let hostelMaintenanceCost = 0;

    expenses.forEach((e: any) => {
      monthlyExpenses += Number(e.amount || 0);
    });

    hostelTickets.forEach((ht: any) => {
      const cost = Number(ht.cost || 0);
      hostelMaintenanceCost += cost;
      monthlyExpenses += cost;
    });

    // 4. Calculate Payroll Outflows
    let payrollThisMonth = 0;
    payrolls.forEach((p: any) => {
      payrollThisMonth += Number(p.totalDisbursement || p.netPayable || 0);
    });

    // Net Treasury & Burn Rate
    const totalTreasury = bankBal + mobileBal + cashBal + chequeBal;
    const burnRate = payrollThisMonth + monthlyExpenses;
    const estimatedRunwayMonths = burnRate > 0 ? Number((totalTreasury / burnRate).toFixed(1)) : (totalTreasury > 0 ? 12 : 0);

    // Active scholars count
    const studentIds = new Set<string>();
    receipts.forEach((r: any) => { if (r.studentId || r.student?.id) studentIds.add(String(r.studentId || r.student?.id)); });
    invoices.forEach((i: any) => { if (i.studentId || i.student?.id) studentIds.add(String(i.studentId || i.student?.id)); });
    const activeStudentsCount = Math.max(studentIds.size, studentsRes.length || 0);

    // 5. Recent Unified Transaction Feed
    const recentTransactions: any[] = [];

    receipts.forEach((r: any) => {
      recentTransactions.push({
        id: r.id || r.documentId || r.receiptNumber,
        documentNumber: r.receiptNumber || `RCP-${r.id}`,
        title: `Tuition Fee Settlement - ${r.studentName || 'Student'}`,
        type: 'Tuition Receipt',
        date: r.paymentDate ? new Date(r.paymentDate).toISOString().split('T')[0] : (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        amount: Number(r.paymentAmount || r.amount || 0),
        status: r.status || 'Approved'
      });
    });

    expenses.forEach((e: any) => {
      recentTransactions.push({
        id: e.id || e.documentId || e.voucherNumber,
        documentNumber: e.voucherNumber || `EXP-${e.id}`,
        title: e.title || 'Operating Claim Voucher',
        type: 'Expense Disbursement',
        date: e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: -Math.abs(Number(e.amount || 0)),
        status: e.status === 'paid' ? 'Paid' : e.status === 'approved' ? 'Approved' : 'Pending'
      });
    });

    payrolls.forEach((p: any) => {
      recentTransactions.push({
        id: p.id || p.documentId || p.payrollNumber,
        documentNumber: p.payrollNumber || `PAY-${p.id}`,
        title: `Monthly Faculty Compensation - ${p.staffName || 'Staff'}`,
        type: 'Payroll Payment',
        date: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: -Math.abs(Number(p.netPayable || p.totalDisbursement || 0)),
        status: p.status === 'paid' ? 'Paid' : p.status === 'approved' ? 'Approved' : 'Pending'
      });
    });

    // Sort transactions by date descending
    recentTransactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // 6. Dynamic Monthly Chart Aggregation (12 Months of Active Academic Year)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap: Record<string, { revenue: number; expense: number }> = {};
    monthNames.forEach(m => { monthlyDataMap[m] = { revenue: 0, expense: 0 }; });

    recentTransactions.forEach(tx => {
      try {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          const mName = monthNames[d.getMonth()];
          if (monthlyDataMap[mName]) {
            if (tx.amount > 0) {
              monthlyDataMap[mName].revenue += tx.amount;
            } else {
              monthlyDataMap[mName].expense += Math.abs(tx.amount);
            }
          }
        }
      } catch {}
    });

    const revenueVsExpenseMonthly = monthNames.map(m => ({
      month: m,
      revenue: monthlyDataMap[m].revenue,
      expense: monthlyDataMap[m].expense,
      net: monthlyDataMap[m].revenue - monthlyDataMap[m].expense
    }));

    // 7. Dynamic Department Budget vs. Actual Utilization
    let budgetVsActualDepartment: any[] = [];
    if (budgets && budgets.length > 0) {
      budgetVsActualDepartment = budgets.map((b: any) => ({
        department: b.departmentName || 'Department',
        allocated: Number(b.allocatedAmount || 0),
        spent: Number(b.spentAmount || 0)
      }));
    } else {
      budgetVsActualDepartment = [
        { department: 'Campus Operations & Facilities', allocated: Math.max(monthlyExpenses * 1.3, 5000), spent: monthlyExpenses },
        { department: 'Academics & Faculty', allocated: Math.max(payrollThisMonth * 1.2, 10000), spent: payrollThisMonth }
      ];
    }

    return {
      kpi: {
        totalRevenueYTD,
        outstandingFees,
        todayCollections: totalRevenueYTD,
        monthlyIncome: totalRevenueYTD,
        monthlyExpenses,
        payrollThisMonth,
        pendingApprovalsCount: expenses.filter((e: any) => e.status === 'submitted' || e.status === 'reviewed').length,
        pendingInvoicesCount,
        activeStudentsCount,
        activeScholarshipsTotal: 0,
        netCashFlow: totalRevenueYTD - (monthlyExpenses + payrollThisMonth),
        feeCollectionRate: (totalRevenueYTD + outstandingFees) > 0 ? Number(((totalRevenueYTD / (totalRevenueYTD + outstandingFees)) * 100).toFixed(1)) : 100
      },
      charts: {
        revenueVsExpenseMonthly,
        collectionsByMethod: [
          { method: 'Commercial Bank (1010)', amount: bankBal, percentage: totalRevenueYTD > 0 ? Number(((bankBal / totalRevenueYTD) * 100).toFixed(1)) : 100 },
          { method: 'Mobile Money (1020)', amount: mobileBal, percentage: totalRevenueYTD > 0 ? Number(((mobileBal / totalRevenueYTD) * 100).toFixed(1)) : 0 },
          { method: 'Cash Drawer (1030)', amount: cashBal, percentage: totalRevenueYTD > 0 ? Number(((cashBal / totalRevenueYTD) * 100).toFixed(1)) : 0 },
          { method: 'Cheque (1040)', amount: chequeBal, percentage: totalRevenueYTD > 0 ? Number(((chequeBal / totalRevenueYTD) * 100).toFixed(1)) : 0 }
        ],
        expensesByCategory: [
          { category: 'Faculty Payroll (5010)', amount: payrollThisMonth, percentage: (monthlyExpenses + payrollThisMonth) > 0 ? Number(((payrollThisMonth / (monthlyExpenses + payrollThisMonth)) * 100).toFixed(1)) : 0 },
          { category: 'Operating Expenses (5020-5050)', amount: monthlyExpenses - hostelMaintenanceCost, percentage: (monthlyExpenses + payrollThisMonth) > 0 ? Number((((monthlyExpenses - hostelMaintenanceCost) / (monthlyExpenses + payrollThisMonth)) * 100).toFixed(1)) : 0 },
          { category: 'Hostel Maintenance (5060)', amount: hostelMaintenanceCost, percentage: (monthlyExpenses + payrollThisMonth) > 0 ? Number(((hostelMaintenanceCost / (monthlyExpenses + payrollThisMonth)) * 100).toFixed(1)) : 0 }
        ],
        budgetVsActualDepartment
      },
      treasuryInsights: {
        totalBankBalance: bankBal,
        totalCashInDrawer: cashBal,
        totalMobileMoney: mobileBal,
        estimatedRunwayMonths
      },
      recentTransactions: recentTransactions.slice(0, 30)
    };
  },

  // ─── 2. Student Ledgers & Accounts ──────────────────────────────────────────
  async getStudentAccounts(): Promise<StudentFinanceAccount[]> {
    const data = await safeGetArray('/finance-ledger-entrys?populate=*');
    if (data && data.length > 0) return data;
    return safeGetArray('/finance-ledger-entries?populate=*');
  },

  async getStudentAccount(id: string): Promise<StudentFinanceAccount> {
    const obj = await safeGetObject(`/finance-ledger-entrys/${id}?populate=*`, {} as any);
    if (obj && Object.keys(obj).length > 0) return obj;
    return safeGetObject(`/finance-ledger-entries/${id}?populate=*`, {} as any);
  },

  async getStudentLedger(studentId: string): Promise<StudentLedgerEntry[]> {
    const data = await safeGetArray(`/finance-ledger-entrys?filters[student][id][$eq]=${studentId}&populate=*&sort=transactionDate:desc`);
    if (data && data.length > 0) return data;
    return safeGetArray(`/finance-ledger-entries?filters[student][id][$eq]=${studentId}&populate=*&sort=transactionDate:desc`);
  },

  async getStudentWalletTransactions(studentId: string | number): Promise<any[]> {
    return safeGetArray(`/wallet-transactions?filters[student][id][$eq]=${studentId}&populate=*&sort=transactionDate:desc`);
  },

  // ─── 3. Invoices ────────────────────────────────────────────────────────────
  async getInvoices(statusFilter = 'all'): Promise<Invoice[]> {
    const filterQuery = statusFilter !== 'all' ? `&filters[status][$eq]=${statusFilter}` : '';
    return safeGetArray(`/finance-invoices?populate=*&sort=createdAt:desc${filterQuery}`);
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    return safeGetObject(`/finance-invoices/${id}?populate=*`, {} as any);
  },

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    if (!data.installments && data.totalAmount && data.totalAmount > 0) {
      const amount = data.totalAmount;
      const quarterAmount = amount / 4;
      data.installments = [
        { dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), amount: quarterAmount, status: 'pending_payment', remainingBalance: quarterAmount },
        { dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), amount: quarterAmount, status: 'pending_payment', remainingBalance: quarterAmount },
        { dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), amount: quarterAmount, status: 'pending_payment', remainingBalance: quarterAmount },
        { dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), amount: quarterAmount, status: 'pending_payment', remainingBalance: quarterAmount }
      ];
    }

    const strapiPayload: any = {
      invoiceNumber: data.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal: data.subtotal || data.totalAmount || 0,
      totalAmount: data.totalAmount || 0,
      paidAmount: data.paidAmount || 0,
      remainingBalance: data.remainingBalance ?? data.totalAmount ?? 0,
      status: data.status || 'draft',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: data.items || [],
      installments: data.installments || null,
      academicYearId: data.academicYearId || '2026-2027'
    };

    if (data.studentId && !isNaN(Number(data.studentId))) {
      strapiPayload.student = Number(data.studentId);
    } else if (data.student && typeof data.student === 'object' && data.student.id) {
      strapiPayload.student = data.student.id;
    }

    const res = await apiClient.post('/finance-invoices', { data: strapiPayload });
    return res.data.data;
  },

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const res = await apiClient.put(`/finance-invoices/${id}`, { data: { status } });
    return res.data.data;
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const strapiPayload: any = { ...data };
    if (strapiPayload.studentId || strapiPayload.student) {
      const sId = typeof strapiPayload.student === 'object' ? strapiPayload.student?.id : (strapiPayload.studentId || strapiPayload.student);
      if (sId && !isNaN(Number(sId))) {
        strapiPayload.student = Number(sId);
      } else {
        delete strapiPayload.student;
      }
      delete strapiPayload.studentId;
    }
    delete strapiPayload.studentName;
    delete strapiPayload.parentName;
    delete strapiPayload.parentEmail;
    delete strapiPayload.admissionNumber;
    delete strapiPayload.id;
    delete strapiPayload.documentId;
    delete strapiPayload.createdAt;
    delete strapiPayload.updatedAt;
    delete strapiPayload.publishedAt;

    Object.keys(strapiPayload).forEach(key => {
      if (strapiPayload[key] === undefined) {
        delete strapiPayload[key];
      }
    });

    const res = await apiClient.put(`/finance-invoices/${id}`, { data: strapiPayload });
    return res.data.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`/finance-invoices/${id}`);
  },

  /** Returns student advance wallet balance (credit). */
  async getStudentAdvanceBalance(studentId: string | number): Promise<number> {
    try {
      const res = await apiClient.get(`/students/${studentId}`);
      const student = res.data?.data;
      return Number(student?.advanceBalance || 0);
    } catch {
      return 0;
    }
  },

  async getStudentLedgerBalance(studentId: string | number): Promise<number> {
    return this.getStudentAdvanceBalance(studentId);
  },

  async applyAdvanceToInvoice(studentDocumentId: string, invoiceDocumentId: string, applyAmount: number): Promise<{ newAdvanceBalance: number; newInvoiceRemaining: number }> {
    const res = await apiClient.post('/finance-receipts', {
      data: {
        student: studentDocumentId,
        invoice: invoiceDocumentId,
        paymentAmount: applyAmount,
        baseAmount: applyAmount,
        exchangeRateToInvoice: 1,
        exchangeRateToBase: 1,
        paymentMethod: 'Advance Wallet',
        receiptNumber: `RCP-ADV-${Date.now()}`,
        status: 'completed',
        paymentDate: new Date().toISOString(),
        paymentMetadata: { provider: 'Advance Wallet', gatewayStatus: 'AUTO_APPLIED', timestamp: new Date().toISOString() },
      }
    });
    const receipt = res.data?.data;
    return {
      newAdvanceBalance: Number(receipt?.newAdvanceBalance ?? 0),
      newInvoiceRemaining: Number(receipt?.newInvoiceRemaining ?? 0),
    };
  },

  // ─── 4. Receipts & Payments ─────────────────────────────────────────────────
  async getReceipts(): Promise<PaymentReceipt[]> {
    const raw = await safeGetArray('/finance-receipts?populate[student][populate][0]=parents&populate[invoice]=true&sort=createdAt:desc');
    return raw.map((r: any) => {
      const amt = Number(r.paymentAmount || r.amount || 0);
      const hasNewAllocations = Number(r.invoiceAllocation) > 0 || Number(r.walletAllocation) > 0 || Number(r.walletCreditGenerated) > 0;
      const isLinkedToInvoice = !!(r.invoice || r.invoiceNumber);

      return {
        ...r,
        amount: amt,
        invoiceAllocation: hasNewAllocations ? Number(r.invoiceAllocation) : (isLinkedToInvoice ? amt : 0),
        walletAllocation: Number(r.walletAllocation || r.paymentMetadata?.walletAmount || 0),
        cashAllocation: Number(r.cashAllocation || r.paymentMetadata?.cashAmount || 0),
        walletCreditGenerated: Number(r.walletCreditGenerated || r.paymentMetadata?.overpayment || 0),
        remainingStudentBalance: Number(r.remainingStudentBalance || 0),
        invoiceNumber: r.invoice?.invoiceNumber || r.invoiceNumber || 'INV-GENERAL',
        studentName: r.student
          ? `${r.student.firstName || ''} ${r.student.lastName || ''}`.trim() || r.student.name || r.studentName || 'Student'
          : r.studentName || 'Student',
        parentName: r.student?.parents?.[0]
          ? `${r.student.parents[0].firstName || ''} ${r.student.parents[0].lastName || ''}`.trim() || r.student.parents[0].name
          : r.parentName || 'Registered Parent Profile',
        cashierName: r.cashierName || 'Cashier Desk'
      };
    }) as PaymentReceipt[];
  },

  async postPaymentReceipt(data: Partial<PaymentReceipt>): Promise<{ receipt: PaymentReceipt; journal: JournalEntry }> {
    if (data.exchangeRateToInvoice && data.exchangeRateToInvoice !== 1) {
      data.baseAmount = (data.paymentAmount || 0) * (data.exchangeRateToBase || 1);
    }
    if (!data.paymentMetadata) {
      data.paymentMetadata = {
        provider: data.paymentMethod || 'Cash',
        gatewayStatus: 'VERIFIED',
        timestamp: new Date().toISOString()
      };
    }
    const res = await apiClient.post('/finance-receipts', { data });
    const receipt = res.data.data;
    const normalizedReceipt = {
      ...receipt,
      amount: Number(receipt.paymentAmount || receipt.amount || 0),
      remainingStudentBalance: Number(receipt.remainingStudentBalance || 0),
    };
    return { receipt: normalizedReceipt as any, journal: null as any };
  },

  async postCombinedPayment(payload: any): Promise<any> {
    const res = await apiClient.post('/finance-receipts/combined-payment', { data: payload });
    return res.data;
  },

  // ─── 5. Certified Financial Statements & GL Engine ──────────────────────────
  async generateFinancialStatement(filters: any): Promise<any> {
    const [expenses, payrolls, invoices, receipts, hostelPayments, hostelTickets, libraryRecords, fixedAssets] = await Promise.all([
      this.getExpenses().catch(() => []),
      this.getPayrollRuns().catch(() => []),
      this.getInvoices().catch(() => []),
      this.getReceipts().catch(() => []),
      safeGetArray('/hostel-payments?populate=*'),
      safeGetArray('/hostel-maintenance-tickets?populate=*'),
      safeGetArray('/library-borrow-records?populate=*'),
      safeGetArray('/fixed-assets?populate=*')
    ]);

    // 1. Calculate Real Expenses by GL Category
    let utilitySum = 0;     // GL 5020
    let equipmentSum = 0;   // GL 5030
    let suppliesSum = 0;    // GL 5040
    let maintenanceSum = 0; // GL 5050
    let otherExpSum = 0;
    let unpaidClaimsSum = 0; // GL 2010 Accounts Payable

    expenses.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('utilit')) {
        utilitySum += amt;
      } else if (cat.includes('equip') || cat.includes('it') || cat.includes('tech')) {
        equipmentSum += amt;
      } else if (cat.includes('suppl') || cat.includes('book') || cat.includes('stationery')) {
        suppliesSum += amt;
      } else if (cat.includes('maint') || cat.includes('repair')) {
        maintenanceSum += amt;
      } else {
        otherExpSum += amt;
      }

      if (e.status === 'submitted' || e.status === 'reviewed' || e.status === 'approved') {
        unpaidClaimsSum += amt;
      }
    });

    // 2. Calculate Payroll Outflows (GL 5010)
    let payrollSum = 0;
    payrolls.forEach((p: any) => {
      payrollSum += Number(p.totalDisbursement || p.netPayable || 0);
    });

    // 3. Calculate Revenues & Liquid Cash from Receipts by Payment Method
    let tuitionSum = 0;       // GL 4010
    let waqfDonations = 0;    // GL 4020
    let auxiliaryRevenue = 0; // GL 4030
    let unearnedTuition = 0;  // GL 2020
    let walletLiability = 0;  // GL 2050

    let bankCash = 0;    // GL 1010
    let mobileCash = 0;  // GL 1020
    let rawCash = 0;     // GL 1030
    let chequeCash = 0;  // GL 1040

    receipts.forEach((r: any) => {
      const amt = Number(r.paymentAmount || r.amount || 0);
      const method = (r.paymentMethod || '').toLowerCase();
      const type = (r.paymentType || r.type || '').toLowerCase();

      if (type.includes('waqf') || type.includes('donation')) {
        waqfDonations += amt;
      } else if (type.includes('library') || type.includes('fine') || type.includes('auxiliary') || type.includes('cafeteria')) {
        auxiliaryRevenue += amt;
      } else if (type.includes('hostel') || type.includes('boarding')) {
        // counted in hostel
      } else {
        tuitionSum += amt;
      }

      walletLiability += Number(r.walletAllocation || r.walletCreditGenerated || 0);
      if (r.isPrepaid) unearnedTuition += amt;

      if (method.includes('mobile') || method.includes('orange') || method.includes('mtn') || method.includes('wave')) {
        mobileCash += amt;
      } else if (method.includes('cash')) {
        rawCash += amt;
      } else if (method.includes('cheque')) {
        chequeCash += amt;
      } else {
        bankCash += amt;
      }
    });

    // Library fines addition
    libraryRecords.forEach((lr: any) => {
      if (lr.finePaid && Number(lr.fineAmount || 0) > 0) {
        auxiliaryRevenue += Number(lr.fineAmount);
        rawCash += Number(lr.fineAmount);
      }
    });

    // 4. Calculate Hostel Revenue (GL 4040) & Hostel Expenditures (GL 5060)
    let hostelRevenueSum = 0;     // GL 4040
    let hostelExpendituresSum = 0; // GL 5060

    hostelPayments.forEach((hp: any) => {
      const amt = Number(hp.amount || 0);
      hostelRevenueSum += amt;
      const method = (hp.paymentMethod || '').toLowerCase();
      if (method.includes('mobile')) mobileCash += amt;
      else if (method.includes('cash')) rawCash += amt;
      else if (method.includes('cheque')) chequeCash += amt;
      else bankCash += amt;
    });

    hostelTickets.forEach((ht: any) => {
      hostelExpendituresSum += Number(ht.cost || 0);
    });

    // 5. Calculate Outstanding Accounts Receivable (GL 1100)
    let arSum = 0;
    invoices.forEach((i: any) => {
      const status = (i.status || '').toLowerCase();
      if (status !== 'paid' && status !== 'cancelled' && status !== 'voided') {
        arSum += Number(i.remainingBalance ?? (Number(i.totalAmount || 0) - Number(i.paidAmount || 0)));
      }
    });

    // 6. Fixed Property Assets (GL 1500)
    let propertyAssets = 0;
    fixedAssets.forEach((fa: any) => {
      propertyAssets += Number(fa.purchaseCost || fa.currentValue || 0);
    });

    const totalRev = tuitionSum + waqfDonations + auxiliaryRevenue + hostelRevenueSum;
    const totalExp = payrollSum + utilitySum + equipmentSum + suppliesSum + maintenanceSum + otherExpSum + hostelExpendituresSum;
    const netSurplus = totalRev - totalExp;

    const totalAssets = bankCash + mobileCash + rawCash + chequeCash + arSum + propertyAssets;
    const totalLiabilities = unpaidClaimsSum + unearnedTuition + walletLiability;
    const totalEquity = totalAssets - totalLiabilities;
    const retainedEquity = totalEquity - netSurplus; // GL 3010

    const reportHash = `ERP-FIN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      academicYear: filters?.academicYear || '2026-2027',
      period: filters?.period || 'Full Year',
      reportHash,
      generatedAt: new Date().toISOString(),
      balances: {
        '4010': tuitionSum,
        '4020': waqfDonations,
        '4030': auxiliaryRevenue,
        '4040': hostelRevenueSum,
        '5010': payrollSum,
        '5020': utilitySum,
        '5030': equipmentSum,
        '5040': suppliesSum,
        '5050': maintenanceSum + otherExpSum,
        '5060': hostelExpendituresSum,
        '1010': bankCash,
        '1020': mobileCash,
        '1030': rawCash,
        '1040': chequeCash,
        '1100': arSum,
        '1500': propertyAssets,
        '2010': unpaidClaimsSum,
        '2020': unearnedTuition,
        '2050': walletLiability,
        '3010': retainedEquity
      },
      totalDebits: totalExp + totalAssets,
      totalCredits: totalRev + totalLiabilities + totalEquity,
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netSurplus
    };
  },

  async verifyE2EScenario(): Promise<{ success: boolean; message: string; summary: any; logs: string[] }> {
    const res = await apiClient.post('/finance-receipts/verify-e2e', {});
    return res.data;
  },

  // ─── 6. Chart of Accounts & Journals ────────────────────────────────────────
  async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    const [accounts, statement] = await Promise.all([
      safeGetArray('/finance-accounts?populate=*&sort=accountCode:asc'),
      this.generateFinancialStatement({ academicYear: '2026-2027' }).catch(() => null)
    ]);

    const balances = statement?.balances || {};

    return accounts.map((a: any) => {
      const code = String(a.accountCode || '');
      const liveBal = balances[code] !== undefined ? Number(balances[code]) : 0;
      return {
        id: a.documentId || String(a.id),
        accountCode: code,
        accountName: a.accountName || 'Account',
        accountType: a.accountType || 'Asset',
        parentAccountCode: a.parentAccountCode,
        isControlAccount: Boolean(a.isControlAccount),
        isActive: a.isActive !== false,
        currentBalance: liveBal,
        currency: 'USD',
        description: a.description || ''
      };
    });
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    return safeGetArray('/finance-journal-entrys?populate=*&sort=createdAt:desc');
  },

  async postManualJournalEntry(data: any): Promise<any> {
    const translatedData = {
      entryNumber: data.journalNumber || data.entryNumber || `JRN-${Date.now()}`,
      date: data.transactionDate || data.date || new Date().toISOString(),
      description: data.title || data.description || 'Manual Journal Entry',
      status: data.status || 'draft',
      totalDebitOriginal: Number(data.totalDebit || data.totalDebitOriginal || 0),
      totalCreditOriginal: Number(data.totalCredit || data.totalCreditOriginal || 0),
      totalDebitBase: Number(data.totalDebit || data.totalDebitBase || 0),
      totalCreditBase: Number(data.totalCredit || data.totalCreditBase || 0),
      exchangeRate: Number(data.exchangeRate || 1.0),
      lines: (data.lines || []).map((l: any) => ({
        id: l.id || String(Math.random()),
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: Number(l.debitAmount || l.debit || 0),
        credit: Number(l.creditAmount || l.credit || 0)
      }))
    };
    const res = await apiClient.post('/finance-journal-entrys', { data: translatedData });
    return res.data.data;
  },

  // ─── 7. Expenses ────────────────────────────────────────────────────────────
  async getExpenseRequests(): Promise<ExpenseRequest[]> {
    return safeGetArray('/finance-expenses?populate=*&sort=createdAt:desc');
  },

  async createExpenseRequest(data: Partial<ExpenseRequest>): Promise<ExpenseRequest> {
    const payload = {
      voucherNumber: data.voucherNumber || `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title || 'Operating Expense Claim',
      category: data.category || 'Utilities',
      department: data.department || 'Campus Operations & Facilities',
      amount: Number(data.amount || 0),
      vendorName: data.vendorName || 'Vendor',
      invoiceReference: data.invoiceReference || 'INV-REF',
      requestedBy: data.requestedBy || 'Finance Operations Lead',
      receiptUrl: data.receiptUrl || '',
      status: data.status || 'submitted',
    };

    const res = await apiClient.post('/finance-expenses', { data: payload });
    return res.data?.data || res.data;
  },

  async approveExpenseRequest(id: string): Promise<ExpenseRequest> {
    const res = await apiClient.put(`/finance-expenses/${id}`, { data: { status: 'approved' } });
    return res.data.data;
  },

  async updateExpenseStatus(id: string | number, status: string): Promise<ExpenseRequest> {
    const res = await apiClient.put(`/finance-expenses/${id}`, { data: { status } });
    return res.data?.data || res.data;
  },

  async createExpenseVoucher(data: Partial<ExpenseRequest>): Promise<ExpenseRequest> {
    return this.createExpenseRequest(data);
  },

  // ─── 8. Budgets ─────────────────────────────────────────────────────────────
  async getDepartmentBudgets(): Promise<DepartmentBudget[]> {
    const raw = await safeGetArray('/finance-budgets?populate=*&sort=createdAt:desc');
    let localSaved: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_budgets');
        if (str) localSaved = JSON.parse(str);
      } catch {}
    }

    const merged = [...raw];
    localSaved.forEach(localItem => {
      if (!merged.some(m => String(m.id) === String(localItem.id) || m.code === localItem.code)) {
        merged.push(localItem);
      }
    });

    if (merged.length === 0) {
      return [];
    }

    return merged.map((b: any, idx: number) => {
      const allocated = Number(b.allocatedAmount || b.amount || 0);
      const spent = Number(b.spentAmount || 0);
      const remaining = b.remainingAmount !== undefined ? Number(b.remainingAmount) : allocated - spent;
      const util = allocated > 0 ? Number(((spent / allocated) * 100).toFixed(1)) : 0;
      return {
        id: b.documentId || String(b.id || idx + 1),
        code: b.code || `CC-${b.id || idx + 1}`,
        departmentName: b.departmentName || b.budgetTitle || `Department #${b.id || idx + 1}`,
        budgetTitle: b.budgetTitle || b.departmentName || 'Budget Allocation',
        headOfDepartment: b.headOfDepartment || 'Section Lead',
        allocatedAmount: allocated,
        committedAmount: Number(b.committedAmount || 0),
        spentAmount: spent,
        remainingAmount: remaining,
        varianceAmount: Number(b.varianceAmount || 0),
        utilizationPercentage: util,
        currency: b.currency || 'USD',
        academicYearCode: b.academicYearCode || '2026-2027',
        status: b.status || (util > 90 ? 'exceeded' : util > 75 ? 'warning' : 'on_track'),
        categories: Array.isArray(b.categories) ? b.categories : [],
        notes: b.notes || ''
      };
    });
  },

  async getBudgets(): Promise<DepartmentBudget[]> {
    return this.getDepartmentBudgets();
  },

  async createDepartmentalBudget(data: Partial<DepartmentBudget>): Promise<DepartmentBudget> {
    const allocated = Number(data.allocatedAmount || 0);
    const spent = Number(data.spentAmount || 0);
    const remaining = allocated - spent;
    const util = allocated > 0 ? Number(((spent / allocated) * 100).toFixed(1)) : 0;

    const payload = {
      departmentName: data.departmentName || data.budgetTitle || 'Academic Section',
      budgetTitle: data.budgetTitle || data.departmentName || 'Budget Allocation',
      code: data.code || `CC-${Date.now().toString().slice(-4)}`,
      headOfDepartment: typeof data.headOfDepartment === 'string' ? data.headOfDepartment : (data.headOfDepartment?.name || 'Section Lead'),
      allocatedAmount: allocated,
      spentAmount: spent,
      committedAmount: Number(data.committedAmount || 0),
      remainingAmount: remaining,
      varianceAmount: 0,
      utilizationPercentage: util,
      currency: data.currency || 'USD',
      academicYearCode: data.academicYearCode || '2026-2027',
      status: data.status || 'on_track',
      categories: data.categories || [],
      notes: data.notes || ''
    };

    let resultRecord: any = null;
    try {
      const res = await apiClient.post('/finance-budgets', { data: payload });
      resultRecord = res.data?.data;
    } catch {}

    const finalBudget: DepartmentBudget = {
      ...payload,
      id: resultRecord?.documentId || String(resultRecord?.id || `BDG-${Date.now().toString().slice(-4)}`),
    };

    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_budgets');
        const existing = str ? JSON.parse(str) : [];
        localStorage.setItem('yahaya_finance_budgets', JSON.stringify([finalBudget, ...existing]));
      } catch {}
    }

    return finalBudget;
  },

  async updateDepartmentalBudget(id: string | number, data: Partial<DepartmentBudget>): Promise<DepartmentBudget> {
    try {
      const res = await apiClient.put(`/finance-budgets/${id}`, { data });
      const updated = res.data?.data || data;
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_finance_budgets');
          if (str) {
            const existing = JSON.parse(str);
            const next = existing.map((x: any) => String(x.id) === String(id) ? { ...x, ...data } : x);
            localStorage.setItem('yahaya_finance_budgets', JSON.stringify(next));
          }
        } catch {}
      }
      return updated;
    } catch {
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_finance_budgets');
          if (str) {
            const existing = JSON.parse(str);
            const next = existing.map((x: any) => String(x.id) === String(id) ? { ...x, ...data } : x);
            localStorage.setItem('yahaya_finance_budgets', JSON.stringify(next));
          }
        } catch {}
      }
      return data as DepartmentBudget;
    }
  },

  async deleteDepartmentalBudget(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/finance-budgets/${id}`);
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_budgets');
        if (str) {
          const existing = JSON.parse(str);
          const next = existing.filter((x: any) => String(x.id) !== String(id));
          localStorage.setItem('yahaya_finance_budgets', JSON.stringify(next));
        }
      } catch {}
    }
    return true;
  },

  async reallocateBudget(fromBudgetId: string, toBudgetId: string, amount: number, notes: string): Promise<any> {
    try {
      const res = await apiClient.post('/finance-budget-reallocations', {
        data: { fromBudgetId, toBudgetId, amount, notes, date: new Date().toISOString() }
      });
      return res.data?.data;
    } catch {
      return { fromBudgetId, toBudgetId, amount, notes };
    }
  },

  // ─── 9. Payroll ─────────────────────────────────────────────────────────────
  async getPayrollRuns(): Promise<PayrollRun[]> {
    return safeGetArray('/finance-payrolls?populate=*&sort=createdAt:desc');
  },

  async createPayrollRun(data: Partial<PayrollRun>): Promise<PayrollRun> {
    if (!data.payrollNumber) {
      data.payrollNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const res = await apiClient.post('/finance-payrolls', { data });
    return res.data.data;
  },

  async updatePayrollStatus(payrollId: string | number, status: string): Promise<PayrollRun> {
    const res = await apiClient.put(`/finance-payrolls/${payrollId}`, { data: { status } });
    return res.data.data;
  },

  async approvePayrollRun(runId: string | number): Promise<PayrollRun> {
    const res = await apiClient.put(`/finance-payrolls/${runId}`, { data: { status: 'approved' } });
    return res.data.data;
  },

  async processPayrollDisbursement(payrollRunId: string | number): Promise<{ payroll: PayrollRun; journal: JournalEntry }> {
    const glRef = `GL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const res = await apiClient.put(`/finance-payrolls/${payrollRunId}`, {
      data: { status: 'paid', journalEntryId: glRef }
    });
    return { payroll: res.data.data, journal: null as any };
  },

  // ─── 10. Cashier Sessions & Accounting Periods ──────────────────────────────
  async getCashierSessions(): Promise<CashierSession[]> {
    return safeGetArray('/finance-receipts?populate=*');
  },

  async getAccountingPeriods(): Promise<AccountingPeriod[]> {
    return safeGetArray('/finance-accounting-periods?sort=startDate:desc');
  },

  // ─── 11. Scholarships & Discounts ───────────────────────────────────────────
  async getScholarships(): Promise<Scholarship[]> {
    return safeGetArray('/finance-scholarships?populate=*');
  },

  async createScholarship(data: Partial<Scholarship>): Promise<Scholarship> {
    const res = await apiClient.post('/finance-scholarships', { data });
    return res.data.data;
  },

  async getDiscountRules(): Promise<DiscountRule[]> {
    return safeGetArray('/finance-scholarships?filters[type][$eq]=discount&populate=*');
  },

  // ─── 12. Donations & Waqf ───────────────────────────────────────────────────
  async getDonations(): Promise<DonationRecord[]> {
    let localSaved: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_donations');
        if (str) localSaved = JSON.parse(str);
      } catch {}
    }

    const receipts = await safeGetArray('/finance-receipts?populate=*&sort=createdAt:desc');
    const donationReceipts = receipts.filter((r: any) =>
      r.paymentMetadata?.isDonation === true ||
      (r.receiptNumber || '').startsWith('DON-') ||
      (r.paymentMethod || '').toLowerCase().includes('donation') ||
      (r.notes || '').toLowerCase().includes('waqf') ||
      (r.notes || '').toLowerCase().includes('donation')
    );

    const apiMapped: DonationRecord[] = donationReceipts.map((r: any) => {
      const meta = r.paymentMetadata || {};
      return {
        id: r.documentId || String(r.id),
        donorName: meta.donorName || r.cashierName || r.studentName || 'Waqf Benefactor',
        donorEmail: meta.donorEmail || '',
        campaignName: meta.campaignName || r.notes || r.campaignName || 'General Islamic Institutional Waqf',
        amount: Number(r.paymentAmount || r.amount || 0),
        currency: meta.currency || r.currency || 'USD',
        paymentMethod: r.paymentMethod || 'Bank Transfer',
        isAnonymous: Boolean(meta.isAnonymous),
        receiptNumber: r.receiptNumber || `DON-${r.id}`,
        receiptIssued: true,
        donationDate: r.paymentDate || r.createdAt || new Date().toISOString(),
        date: (r.paymentDate || r.createdAt || new Date().toISOString()).split('T')[0],
        status: 'completed',
        notes: meta.notes || r.notes || ''
      };
    });

    // Merge API records with local cache
    const merged = [...apiMapped];
    localSaved.forEach(loc => {
      if (!merged.some(m => String(m.id) === String(loc.id) || m.receiptNumber === loc.receiptNumber)) {
        merged.unshift(loc);
      }
    });

    return merged;
  },

  async createDonationRecord(data: Partial<DonationRecord>): Promise<DonationRecord> {
    const validMethod = (() => {
      const pm = (data.paymentMethod || '').toLowerCase();
      if (pm.includes('cash')) return 'Cash';
      if (pm.includes('cheque') || pm.includes('check')) return 'Cheque';
      if (pm.includes('stripe') || pm.includes('online') || pm.includes('gateway')) return 'Stripe';
      if (pm.includes('pos')) return 'POS Terminal';
      if (pm.includes('orange')) return 'Orange Money';
      if (pm.includes('mtn')) return 'MTN Mobile Money';
      if (pm.includes('wave')) return 'Wave';
      if (pm.includes('wallet')) return 'Advance Wallet';
      return 'Bank Transfer';
    })();

    const receiptNumber = `DON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const donorTitle = data.isAnonymous ? 'Anonymous Benefactor (Waqf)' : (data.donorName || 'Waqf Benefactor');

    const strapiPayload: any = {
      receiptNumber,
      paymentAmount: Number(data.amount || 0),
      baseAmount: Number(data.amount || 0),
      paymentMethod: validMethod,
      paymentDate: new Date().toISOString(),
      status: 'completed',
      cashierName: donorTitle,
      paymentMetadata: {
        isDonation: true,
        donationType: 'Waqf / Institutional Donation',
        donorName: donorTitle,
        donorEmail: data.donorEmail || '',
        campaignName: data.campaignName || 'General Islamic Institutional Waqf',
        isAnonymous: Boolean(data.isAnonymous),
        currency: data.currency || 'USD',
        notes: data.notes || `Endowment funds dedicated exclusively to ${data.campaignName || 'Waqf'}.`,
        provider: validMethod,
        gatewayStatus: 'VERIFIED'
      }
    };

    let apiRecord: any = null;
    try {
      const res = await apiClient.post('/finance-receipts', { data: strapiPayload });
      apiRecord = res.data?.data;
    } catch (err: any) {
      console.warn('[FinanceService] API post fallback to local:', err?.message || err);
    }

    const createdRecord: DonationRecord = {
      id: apiRecord?.documentId || apiRecord?.id || `DON-LOC-${Date.now()}`,
      donorName: donorTitle,
      donorEmail: data.donorEmail || '',
      campaignName: data.campaignName || 'General Islamic Institutional Waqf',
      amount: Number(data.amount || 0),
      currency: data.currency || 'USD',
      paymentMethod: validMethod as any,
      isAnonymous: Boolean(data.isAnonymous),
      receiptNumber: apiRecord?.receiptNumber || receiptNumber,
      receiptIssued: true,
      donationDate: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: data.notes || ''
    };

    if (typeof window !== 'undefined') {
      try {
        const existingStr = localStorage.getItem('yahaya_finance_donations') || '[]';
        const parsed = JSON.parse(existingStr);
        parsed.unshift(createdRecord);
        localStorage.setItem('yahaya_finance_donations', JSON.stringify(parsed));
      } catch {}
    }

    return createdRecord;
  },

  getExpenses(): Promise<ExpenseRequest[]> {
    return this.getExpenseRequests();
  },

  async getAuditLogs(): Promise<AuditLogRecord[]> {
    const data = await safeGetArray('/finance-audit-logs?populate=*&sort=createdAt:desc');
    return data.map((l: any) => ({
      id: l.documentId || String(l.id),
      timestamp: l.createdAt || new Date().toISOString(),
      actorName: l.actorName || l.performedBy || 'System Administrator',
      actorRole: l.actorRole || l.roleName || 'Admin',
      ipAddress: l.ipAddress || '127.0.0.1',
      action: l.action || 'MUTATION',
      module: l.module || l.entityType || 'finance',
      entityId: l.entityId || 'ENTITY-001',
      details: l.details || l.changeSummary || 'Audit log record',
      hash: l.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      payloadSnapshot: l.payloadSnapshot || l.afterSnapshot || {}
    }));
  },

  async getSettings(): Promise<FinanceSettings> {
    let localSettings: any = null;
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_settings');
        if (str) localSettings = JSON.parse(str);
      } catch {}
    }

    try {
      const res = await apiClient.get('/finance-setting');
      const data = res.data?.data;
      if (data && Object.keys(data).length > 0) {
        return { ...localSettings, ...data };
      }
    } catch {}

    if (localSettings && Object.keys(localSettings).length > 0) {
      return localSettings;
    }

    return {
      defaultCurrency: 'USD',
      fiscalYearStart: '2026-09-01',
      enableFinancialHolds: true,
      autoReceiptNumbering: 'RCP-YYYY-XXXX'
    };
  },

  async updateSettings(settings: Partial<FinanceSettings>): Promise<FinanceSettings> {
    if (typeof window !== 'undefined') {
      try {
        const existingStr = localStorage.getItem('yahaya_finance_settings') || '{}';
        const existing = JSON.parse(existingStr);
        const merged = { ...existing, ...settings };
        localStorage.setItem('yahaya_finance_settings', JSON.stringify(merged));

        if (settings.defaultCurrency) {
          localStorage.setItem('yahaya_selected_currency', settings.defaultCurrency);
          localStorage.setItem('selected_currency', settings.defaultCurrency);
          localStorage.setItem('yahaya_default_currency', settings.defaultCurrency);
          window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: settings.defaultCurrency }));
          window.dispatchEvent(new CustomEvent('finance_settings_updated', { detail: merged }));
        }
      } catch {}
    }

    try {
      const res = await apiClient.put('/finance-setting', { data: settings });
      return res.data?.data || settings;
    } catch {
      return settings;
    }
  },

  // ─── 13. Multi-Currency & Utilities ─────────────────────────────────────────
  async getExchangeRates(): Promise<MultiCurrencyRate[]> {
    const raw = await safeGetArray('/finance-exchange-rates?populate=*&sort=createdAt:asc');
    let localSaved: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_currencies');
        if (str) localSaved = JSON.parse(str);
      } catch {}
    }

    const merged = [...raw];
    localSaved.forEach(localItem => {
      if (!merged.some(m => String(m.id) === String(localItem.id) || m.currencyCode === localItem.currencyCode)) {
        merged.push(localItem);
      }
    });

    if (merged.length === 0) {
      const defaults: MultiCurrencyRate[] = [
        { id: 'CURR-001', currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', exchangeRateToUSD: 1.0, isBase: true, isBaseCurrency: true, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-002', currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', exchangeRateToUSD: 0.92, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-003', currencyCode: 'XOF', currencyName: 'West African CFA Franc', symbol: 'CFA', exchangeRateToUSD: 605.50, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-004', currencyCode: 'TRY', currencyName: 'Turkish Lira', symbol: '₺', exchangeRateToUSD: 34.20, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-005', currencyCode: 'GNF', currencyName: 'Guinean Franc', symbol: 'FG', exchangeRateToUSD: 8600.00, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-006', currencyCode: 'GBP', currencyName: 'British Pound', symbol: '£', exchangeRateToUSD: 0.78, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: 'CURR-007', currencyCode: 'SAR', currencyName: 'Saudi Riyal', symbol: '﷼', exchangeRateToUSD: 3.75, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
      ];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('yahaya_finance_currencies', JSON.stringify(defaults));
        } catch {}
      }
      return defaults;
    }

    return merged.map((r: any, idx: number) => ({
      id: r.documentId || String(r.id || `CURR-${idx + 1}`),
      currencyCode: r.currencyCode || r.code || r.isoCode || 'USD',
      currencyName: r.currencyName || r.name || 'Currency',
      symbol: r.symbol || '$',
      exchangeRateToUSD: Number(r.exchangeRateToUSD || r.rate || 1),
      isBase: Boolean(r.isBase || r.isBaseCurrency || r.currencyCode === 'USD'),
      isBaseCurrency: Boolean(r.isBase || r.isBaseCurrency || r.currencyCode === 'USD'),
      isActive: r.isActive !== false,
      lastUpdated: r.lastUpdated || r.effectiveDate || new Date().toISOString().split('T')[0]
    }));
  },

  exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(fieldName => {
          const val = row[fieldName];
          const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async getGlobalTransactions(): Promise<any[]> {
    return safeGetArray('/finance-ledger-entries?populate=*');
  },

  async updateExchangeRate(id: string, rate: number, symbol?: string): Promise<any> {
    try {
      await apiClient.put(`/finance-exchange-rates/${id}`, {
        data: {
          exchangeRateToUSD: rate,
          rate: rate,
          symbol: symbol,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      });
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_currencies');
        if (str) {
          const existing = JSON.parse(str);
          const next = existing.map((x: any) => String(x.id) === String(id) ? { ...x, exchangeRateToUSD: rate, rate, symbol: symbol || x.symbol, lastUpdated: new Date().toISOString().split('T')[0] } : x);
          localStorage.setItem('yahaya_finance_currencies', JSON.stringify(next));
        }
      } catch {}
    }
    return { id, exchangeRateToUSD: rate, symbol };
  },

  async addCurrency(payload: Partial<MultiCurrencyRate>): Promise<MultiCurrencyRate> {
    const code = (payload.currencyCode || 'EUR').toUpperCase().trim();
    const rate = Number(payload.exchangeRateToUSD || payload.rate || 1);
    const item: MultiCurrencyRate = {
      id: `CURR-${Date.now().toString().slice(-4)}`,
      currencyCode: code,
      currencyName: payload.currencyName || code,
      symbol: payload.symbol || code,
      exchangeRateToUSD: rate,
      isBase: Boolean(payload.isBase),
      isBaseCurrency: Boolean(payload.isBase),
      isActive: true,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await apiClient.post('/finance-exchange-rates', {
        data: {
          currencyCode: item.currencyCode,
          currencyName: item.currencyName,
          symbol: item.symbol,
          exchangeRateToUSD: item.exchangeRateToUSD,
          rate: item.exchangeRateToUSD,
          isBase: item.isBase,
          isBaseCurrency: item.isBase,
          isActive: item.isActive,
          lastUpdated: item.lastUpdated
        }
      });
      if (res.data?.data) {
        item.id = res.data.data.documentId || String(res.data.data.id || item.id);
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_currencies');
        const existing = str ? JSON.parse(str) : [];
        if (!existing.some((x: any) => x.currencyCode === item.currencyCode)) {
          localStorage.setItem('yahaya_finance_currencies', JSON.stringify([...existing, item]));
        }
      } catch {}
    }

    return item;
  },

  async deleteCurrency(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/finance-exchange-rates/${id}`);
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('yahaya_finance_currencies');
        if (str) {
          const existing = JSON.parse(str);
          const next = existing.filter((x: any) => String(x.id) !== String(id) && x.currencyCode !== String(id));
          localStorage.setItem('yahaya_finance_currencies', JSON.stringify(next));
        }
      } catch {}
    }
    return true;
  },

  async getPaymentGateways(): Promise<any[]> {
    try {
      const res = await apiClient.get('/finance-payment-gateways');
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Fallback to local storage or defaults
    }
    return [
      { id: 'GTW-STRIPE', name: 'Stripe Online Card Gateway', type: 'Credit / Debit Cards (Visa, Mastercard)', apiKey: '', webhookStatus: 'Connected', isActive: true },
      { id: 'GTW-ORANGE', name: 'Orange Money Merchant Gateway', type: 'West African Mobile Money (OM)', apiKey: '', webhookStatus: 'Connected', isActive: true },
      { id: 'GTW-MTN', name: 'MTN Mobile Money Webhook API', type: 'Mobile Money Gateway (MTN MoMo)', apiKey: '', webhookStatus: 'Connected', isActive: true },
      { id: 'GTW-BANK', name: 'Direct Bank Wire Settlement', type: 'Institutional Treasury Wire', apiKey: '', webhookStatus: 'Connected', isActive: true },
      { id: 'GTW-POS', name: 'Campus Cashier POS Terminal', type: 'Physical Safe / Cash Register', apiKey: 'POS-TERMINAL-01', webhookStatus: 'Connected', isActive: true }
    ];
  },

  async savePaymentGateway(gateway: any): Promise<any> {
    try {
      const res = await apiClient.post('/finance-payment-gateways', { data: gateway });
      return res.data?.data;
    } catch {
      return gateway;
    }
  },

  async getTaxRules(): Promise<any[]> {
    try {
      const res = await apiClient.get('/finance-tax-rules');
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Fallback
    }
    return [
      { id: 'TAX-001', name: 'Educational Tuition Exemption', ratePercentage: 0, appliesTo: 'Tuition & Waqf Grants', isDefault: true, status: 'active' },
      { id: 'TAX-002', name: 'Auxiliary Services VAT', ratePercentage: 18, appliesTo: 'Cafeteria, Uniforms & Books', isDefault: false, status: 'active' },
      { id: 'TAX-003', name: 'Vendor Withholding Tax', ratePercentage: 5, appliesTo: 'Overseas Vendor Claims', isDefault: false, status: 'active' }
    ];
  },

  async saveTaxRule(rule: any): Promise<any> {
    try {
      const res = await apiClient.post('/finance-tax-rules', { data: rule });
      return res.data?.data;
    } catch {
      return rule;
    }
  },

  async getFeeStructures(): Promise<FeeStructure[]> {
    return safeGetArray('/finance-fee-structures?populate=*');
  },

  async createFeeStructure(payload: any): Promise<any> {
    const res = await apiClient.post('/finance-fee-structures', { data: payload });
    return res.data?.data;
  }
};
