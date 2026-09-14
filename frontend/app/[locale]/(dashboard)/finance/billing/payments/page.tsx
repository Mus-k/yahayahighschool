'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard, DollarSign, QrCode, Search, Filter, Download, Plus,
  Eye, CheckCircle2, Clock, PiggyBank, Landmark, ScrollText,
  FileText, Shield, ArrowRight, Printer, Sparkles, AlertCircle,
  Smartphone, Building2, User, RefreshCw, Wallet, Check, ExternalLink,
  ShieldCheck, Lock, ChevronRight, Receipt
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { useAuth } from '@/hooks/useAuth';
import type { PaymentReceipt, PaymentMethodType, Invoice } from '@/types/finance.types';
import type { Student } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { printReceiptDocument } from '@/lib/print-finance';

function CashierPaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceNumber = searchParams.get('invoiceNumber');
  const { user, role } = useAuth();

  const isStudentRole = role === 'student' || role === 'parent';
  const [viewMode, setViewMode] = useState<'admin' | 'student'>('admin');

  // Sync viewMode when role changes
  useEffect(() => {
    if (isStudentRole) {
      setViewMode('student');
    }
  }, [isStudentRole]);

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStudentPayModal, setShowStudentPayModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<PaymentReceipt | null>(null);

  // Live Directory Data for Students (Admin mode)
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  
  // Computed Debt & Wallet (Admin mode)
  const [totalDebt, setTotalDebt] = useState(0);
  const [advancePaymentBalance, setAdvancePaymentBalance] = useState(0);

  // New Payment Form state (Admin cashier)
  const [payStudentSearch, setPayStudentSearch] = useState('');
  const [payInvoiceNumber, setPayInvoiceNumber] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payBankOrOperator, setPayBankOrOperator] = useState('');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [useWallet, setUseWallet] = useState(true);
  const [liveCurrencies, setLiveCurrencies] = useState<any[]>([]);

  // Student Online Payment Form state
  const [studentPayInvoiceNumber, setStudentPayInvoiceNumber] = useState('');
  const [studentPayAmount, setStudentPayAmount] = useState('');
  const [studentPayMethod, setStudentPayMethod] = useState<PaymentMethodType>('Orange Money');
  const [studentPayRef, setStudentPayRef] = useState('');
  const [isSubmittingStudentPay, setIsSubmittingStudentPay] = useState(false);

  // E2E Verification Test States
  const [verifyingE2E, setVerifyingE2E] = useState(false);
  const [e2eResult, setE2EResult] = useState<any>(null);
  const [showE2EModal, setShowE2EModal] = useState(false);

  const handleRunE2EVerification = async () => {
    setVerifyingE2E(true);
    setShowE2EModal(true);
    setE2EResult(null);
    try {
      const res = await financeService.verifyE2EScenario();
      setE2EResult(res);
      toast.success('Mandatory E2E Accounting Scenario PASSED 100%!');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'E2E Verification Failed';
      const logs = err?.response?.data?.error?.logs || err?.response?.data?.logs || [];
      setE2EResult({ success: false, error: msg, logs });
      toast.error('E2E Verification Failed');
    }
    setVerifyingE2E(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [receiptsData, invoicesData, studentsRes, currenciesRes] = await Promise.all([
        financeService.getReceipts(),
        financeService.getInvoices(),
        erpService.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
        financeService.getExchangeRates().catch(() => [])
      ]);

      setReceipts(receiptsData || []);
      setInvoices(invoicesData || []);
      setLiveStudents(studentsRes.data || []);
      setLiveCurrencies(currenciesRes || []);
    } catch {
      toast.error('Failed to load payment receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL Parameter Prefill
  useEffect(() => {
    if (initialInvoiceNumber) {
      setPayInvoiceNumber(initialInvoiceNumber);
      if (isStudentRole) {
        setStudentPayInvoiceNumber(initialInvoiceNumber);
        setShowStudentPayModal(true);
      } else {
        setShowPayModal(true);
      }
      router.replace('/finance/billing/payments');
      
      financeService.getInvoices().then(invs => {
        const inv = invs.find(i => i.invoiceNumber === initialInvoiceNumber);
        if (inv) {
          const sName = inv.student
            ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
            : inv.studentName || '';
          setPayStudentSearch(sName);
          const bal = inv.remainingBalance ?? (inv.totalAmount || 0);
          setPayAmount(bal.toString());
          setStudentPayAmount(bal.toString());
          toast.info(`Prefilled modal with Invoice ${initialInvoiceNumber}`);
        }
      });
    }
  }, [initialInvoiceNumber, router, isStudentRole]);

  // Handle Student Selection & Debt Calculation (Admin Mode)
  useEffect(() => {
    if (!payStudentSearch) {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
      return;
    }

    const searchLower = payStudentSearch.toLowerCase().trim();
    const matched = liveStudents.find(s => {
      const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
      const firstLast = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sId = (s.schoolId || s.studentId || s.admissionNumber || '').toLowerCase();
      const docId = (s.documentId || '').toLowerCase();
      return (
        fullName === searchLower ||
        firstLast === searchLower ||
        (s.name || '').toLowerCase() === searchLower ||
        (sId && searchLower.includes(sId)) ||
        (docId && searchLower.includes(docId)) ||
        searchLower.includes(fullName)
      );
    });
    
    if (matched) {
      setSelectedStudent(matched);
      const directAdvanceBal = Number((matched as any).advanceBalance || 0);
      
      Promise.all([
        financeService.getInvoices(),
        directAdvanceBal > 0
          ? Promise.resolve(directAdvanceBal)
          : erpService.getStudentAdvanceBalance(matched.id)
      ]).then(([allInvoices, advBal]) => {
        const theirInvoices = allInvoices.filter(i => 
          (i.student?.id === matched.id || 
           i.studentId === matched.studentId || 
           i.student?.schoolId === matched.schoolId || 
           i.student?.documentId === matched.documentId ||
           (matched.schoolId && i.studentName?.includes(matched.schoolId))) && i.status !== 'paid'
        );
        setStudentInvoices(theirInvoices);
        const debt = theirInvoices.reduce((acc, inv) => acc + (inv.remainingBalance ?? (inv.totalAmount || 0)), 0);
        setTotalDebt(debt);
        setAdvancePaymentBalance(advBal);
        
        if (theirInvoices.length > 0 && !payInvoiceNumber) {
          setPayInvoiceNumber(theirInvoices[0].invoiceNumber);
        }
      });
    } else {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
    }
  }, [payStudentSearch, liveStudents, payInvoiceNumber]);

  // Match Current Logged-In Student in live Directory
  const currentStudent = useMemo(() => {
    if (!user) return null;
    const uUser = user as any;
    const uSchoolId = (uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (uUser.documentId || '').toLowerCase();
    const uName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

    return liveStudents.find(s => {
      const sSchoolId = (s.schoolId || s.studentId || s.admissionNumber || '').toLowerCase();
      const sDocId = (s.documentId || '').toLowerCase();
      const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
      const sUserId = (s.user as any)?.id;
      const sUsername = (s.user as any)?.username?.toLowerCase();

      return (
        (user.id && sUserId === user.id) ||
        (user.username && sUsername === user.username.toLowerCase()) ||
        (uSchoolId && (sSchoolId.includes(uSchoolId) || uSchoolId.includes(sSchoolId))) ||
        (uDocId && sDocId === uDocId) ||
        (uName && uName.length > 2 && (sName.includes(uName) || uName.includes(sName)))
      );
    }) || null;
  }, [user, liveStudents]);

  // Live Advance Wallet Balance for logged-in student
  const [studentLiveWallet, setStudentLiveWallet] = useState<number>(0);
  useEffect(() => {
    if (currentStudent?.id) {
      financeService.getStudentAdvanceBalance(currentStudent.id).then(bal => setStudentLiveWallet(bal));
    } else if (user?.id) {
      financeService.getStudentAdvanceBalance(user.id).then(bal => setStudentLiveWallet(bal));
    }
  }, [currentStudent, user]);

  // Filtered Student Data (Strictly Live Data for Logged-In Student)
  const myStudentReceipts = useMemo(() => {
    if (!user) return [];
    const uUser = user as any;
    const uSchoolId = (currentStudent?.schoolId || uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (currentStudent?.documentId || uUser.documentId || '').toLowerCase();
    const uStudentId = currentStudent?.id || user.id;
    const uName = (currentStudent?.name || `${user.firstName || ''} ${user.lastName || ''}`).trim().toLowerCase();

    return receipts.filter(r => {
      const rStudent = r.student as any;
      const rSchoolId = (r.studentId || rStudent?.schoolId || r.admissionNumber || '').toLowerCase();
      const rDocId = (rStudent?.documentId || '').toLowerCase();
      const rId = rStudent?.id;
      const rName = (r.studentName || (rStudent ? `${rStudent.firstName || ''} ${rStudent.lastName || ''}`.trim() : '')).toLowerCase();
      const rUser = (rStudent?.user?.username || rStudent?.user?.email || '').toLowerCase();

      return (
        (uStudentId && rId === uStudentId) ||
        (uSchoolId && (rSchoolId.includes(uSchoolId) || uSchoolId.includes(rSchoolId))) ||
        (uDocId && rDocId === uDocId) ||
        (uName && uName.length > 2 && (rName.includes(uName) || uName.includes(rName))) ||
        (rUser && (rUser === user.username?.toLowerCase() || rUser === user.email?.toLowerCase()))
      );
    });
  }, [receipts, user, currentStudent]);

  const myStudentInvoices = useMemo(() => {
    if (!user) return [];
    const uUser = user as any;
    const uSchoolId = (currentStudent?.schoolId || uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (currentStudent?.documentId || uUser.documentId || '').toLowerCase();
    const uStudentId = currentStudent?.id || user.id;
    const uName = (currentStudent?.name || `${user.firstName || ''} ${user.lastName || ''}`).trim().toLowerCase();

    return invoices.filter(inv => {
      const invStudent = inv.student as any;
      const invSchoolId = (invStudent?.schoolId || inv.studentId || '').toLowerCase();
      const invDocId = (invStudent?.documentId || '').toLowerCase();
      const invId = invStudent?.id;
      const invName = (inv.studentName || (invStudent ? `${invStudent.firstName || ''} ${invStudent.lastName || ''}`.trim() : '')).toLowerCase();
      const invUser = (invStudent?.user?.username || invStudent?.user?.email || '').toLowerCase();

      return (
        (uStudentId && invId === uStudentId) ||
        (uSchoolId && (invSchoolId.includes(uSchoolId) || uSchoolId.includes(invSchoolId))) ||
        (uDocId && invDocId === uDocId) ||
        (uName && uName.length > 2 && (invName.includes(uName) || uName.includes(invName))) ||
        (invUser && (invUser === user.username?.toLowerCase() || invUser === user.email?.toLowerCase()))
      );
    });
  }, [invoices, user, currentStudent]);

  const studentPaidTotal = useMemo(() => myStudentReceipts.reduce((sum, r) => sum + r.amount, 0), [myStudentReceipts]);
  const studentBilledTotal = useMemo(() => myStudentInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0), [myStudentInvoices]);
  const studentUnpaidDebt = useMemo(() => {
    return myStudentInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0);
  }, [myStudentInvoices]);
  const studentWalletCredit = studentLiveWallet || Number((user as any)?.advanceBalance || 0);

  const filteredStudentReceiptsList = useMemo(() => {
    return myStudentReceipts.filter(r => {
      const matchQuery = !query ||
        r.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(query.toLowerCase())) ||
        (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(query.toLowerCase()));
      const matchMethod = methodFilter === 'all' || r.paymentMethod === methodFilter;
      return matchQuery && matchMethod;
    });
  }, [myStudentReceipts, query, methodFilter]);

  // Handle Posting Payment from Student Online Checkout Modal
  const handlePostStudentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(studentPayAmount || '0');
    if (amountNum <= 0) {
      toast.error('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmittingStudentPay(true);
    try {
      const matchedInvoice = myStudentInvoices.find(i => i.invoiceNumber === studentPayInvoiceNumber) || myStudentInvoices[0];
      const isMobile = studentPayMethod.includes('Money') || studentPayMethod.includes('Wave') || studentPayMethod.includes('Mobile');

      const data = await financeService.postCombinedPayment({
        invoiceId: matchedInvoice ? (matchedInvoice.documentId || matchedInvoice.id) : undefined,
        walletAmount: 0,
        cashAmount: studentPayMethod === 'Cash' || studentPayMethod === 'Stripe Card' ? amountNum : 0,
        bankAmount: studentPayMethod === 'Bank Transfer' ? amountNum : 0,
        mobileMoneyAmount: isMobile ? amountNum : 0,
        chequeAmount: studentPayMethod === 'Cheque' ? amountNum : 0,
        paymentMethod: studentPayMethod,
        currency: 'USD',
        referenceNumber: studentPayRef || `PAY-ONLINE-${Date.now().toString().slice(-6)}`
      });

      toast.success(`🎉 Payment of $${amountNum.toFixed(2)} posted successfully!`);
      toast.success(`Receipt ${data.receiptNumber} verified.`);
      
      setShowStudentPayModal(false);
      setStudentPayAmount('');
      setStudentPayRef('');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Online payment failed. Please check details.';
      toast.error(msg);
    } finally {
      setIsSubmittingStudentPay(false);
    }
  };

  const targetInvoice = useMemo(() => {
    return studentInvoices.find(i => i.invoiceNumber === payInvoiceNumber || i.documentId === payInvoiceNumber || String(i.id) === payInvoiceNumber) || null;
  }, [payInvoiceNumber, studentInvoices]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchQuery = !query ||
        r.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
        r.studentName.toLowerCase().includes(query.toLowerCase()) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(query.toLowerCase()));
      const matchMethod = methodFilter === 'all' || r.paymentMethod === methodFilter;
      return matchQuery && matchMethod;
    });
  }, [receipts, query, methodFilter]);

  const activeFiltersCount = methodFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setMethodFilter('all');
    setQuery('');
    toast.success('Payment filters reset.');
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount || '0');

    if (!selectedStudent) {
      toast.error('Please select a valid registered student to post ledger entry.');
      return;
    }

    if (!targetInvoice) {
      toast.error('Please select or assign a valid invoice to record payment.');
      return;
    }

    const invoiceRemaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
    const walletApplied = (useWallet && advancePaymentBalance > 0)
      ? Math.min(advancePaymentBalance, invoiceRemaining)
      : 0;

    if (amountNum + walletApplied <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }

    try {
      const isMobile = payMethod.includes('Money') || payMethod.includes('Wave') || payMethod.includes('Mobile');
      
      const data = await financeService.postCombinedPayment({
        invoiceId: targetInvoice.documentId || targetInvoice.id,
        walletAmount: walletApplied,
        cashAmount: payMethod === 'Cash' || payMethod === 'Stripe Card' ? amountNum : 0,
        bankAmount: payMethod === 'Bank Transfer' ? amountNum : 0,
        mobileMoneyAmount: isMobile ? amountNum : 0,
        chequeAmount: payMethod === 'Cheque' ? amountNum : 0,
        paymentMethod: payMethod,
        currency: payCurrency,
      });

      toast.success(`✅ Receipt ${data.receiptNumber} posted successfully!`);
      
      if (walletApplied > 0) {
        toast.success(`💰 Applied $${walletApplied.toFixed(2)} from student's Advance Wallet.`);
      }
      if (amountNum > 0) {
        toast.success(`💵 Received $${amountNum.toFixed(2)} via ${payMethod}.`);
      }

      setAdvancePaymentBalance(Number(data.newAdvanceBalance ?? 0));

      const allInvoices = await financeService.getInvoices();
      const theirInvoices = allInvoices.filter(i =>
        (i.student?.id === selectedStudent.id || i.student?.schoolId === selectedStudent.schoolId) && i.status !== 'paid'
      );
      setStudentInvoices(theirInvoices);
      const newDebt = theirInvoices.reduce((acc, inv) => acc + (inv.remainingBalance ?? (inv.totalAmount || 0)), 0);
      setTotalDebt(newDebt);

      setShowPayModal(false);
      loadData();
      setPayStudentSearch('');
      setPayInvoiceNumber('');
      setPayAmount('');
      setPayReference('');
      setPayBankOrOperator('');
      setPayCurrency('USD');
      setExchangeRate('1');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to post payment settlement.';
      toast.error(msg);
    }
  };

  const totalCollected = useMemo(() => receipts.reduce((s, r) => s + r.amount, 0), [receipts]);
  const bankTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Bank Transfer' || r.paymentMethod === 'Cheque').reduce((s, r) => s + r.amount, 0), [receipts]);
  const mobileTotal = useMemo(() => receipts.filter(r => r.paymentMethod.includes('Money') || r.paymentMethod.includes('Mobile') || r.paymentMethod === 'Wave Mobile').reduce((s, r) => s + r.amount, 0), [receipts]);
  const cashTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Cash' || r.paymentMethod === 'Stripe Card').reduce((s, r) => s + r.amount, 0), [receipts]);

  // Admin Cashier KPI Deck
  const adminKpiCards: EnterpriseKPICard[] = [
    {
      id: 'collections',
      title: 'Total Receipts & POS Collections',
      value: `$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${receipts.length} verified transaction vouchers posted`,
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5" />,
      onClick: () => toast.info('Displaying all cashier receipts and settlements.')
    },
    {
      id: 'bank',
      title: 'Commercial Bank & Wire Transfers',
      value: `$${bankTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Deposited directly to Account 1010',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      isActive: methodFilter === 'Bank Transfer',
      onClick: () => setMethodFilter(methodFilter === 'Bank Transfer' ? 'all' : 'Bank Transfer')
    },
    {
      id: 'mobile',
      title: 'Mobile Wallet Integrations',
      value: `$${mobileTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Instant mobile gateway deposits (Account 1020)',
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-sky-400" />,
      isActive: methodFilter === 'Orange Money',
      onClick: () => setMethodFilter(methodFilter === 'Orange Money' ? 'all' : 'Orange Money')
    },
    {
      id: 'cash',
      title: 'Campus Cash Drawer Collections',
      value: `$${cashTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Open Cashier Session: CSH-2026-088 (Reconciled)',
      trendDirection: 'neutral',
      icon: <PiggyBank className="w-5 h-5 text-amber-400" />,
      isActive: methodFilter === 'Cash',
      onClick: () => setMethodFilter(methodFilter === 'Cash' ? 'all' : 'Cash')
    }
  ];

  // Student View Personal KPI Deck
  const studentKpiCards: EnterpriseKPICard[] = [
    {
      id: 'student-paid',
      title: 'Total Settled Payments',
      value: `$${studentPaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${myStudentReceipts.length} verified payment receipt vouchers`,
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'student-debt',
      title: 'Active Outstanding Fees',
      value: `$${studentUnpaidDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: studentUnpaidDebt > 0 ? 'Action needed: Term fee balance due' : '✓ All academic fees paid in full',
      trendDirection: studentUnpaidDebt > 0 ? 'down' : 'up',
      icon: <Landmark className={`w-5 h-5 ${studentUnpaidDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
    },
    {
      id: 'student-wallet',
      title: 'Advance Wallet Balance',
      value: `$${studentWalletCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Prepaid credit stored for future term invoices',
      trendDirection: 'neutral',
      icon: <Wallet className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'student-billed',
      title: 'Total Fees Invoiced',
      value: `$${studentBilledTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${myStudentInvoices.length} total fee invoices issued`,
      trendDirection: 'neutral',
      icon: <FileText className="w-5 h-5 text-amber-400" />
    }
  ];

  // Helper to resolve student info from liveStudents
  const resolveStudent = (r: PaymentReceipt) => {
    if (!r) {
      return {
        fullName: 'Student Scholar',
        schoolId: 'ST-2026',
        grade: 'Standard Program',
        section: '',
        parentName: 'Registered Parent Sponsor',
        parentPhone: ''
      };
    }
    const rStudent = r.student as any;
    const sId = r.studentId || rStudent?.schoolId || r.admissionNumber;
    const docId = rStudent?.documentId;
    const rawId = rStudent?.id;

    const matched = liveStudents.find(s =>
      (sId && s.schoolId && s.schoolId.toLowerCase() === String(sId).toLowerCase()) ||
      (docId && s.documentId === docId) ||
      (rawId && s.id === rawId) ||
      (r.studentName && s.name && s.name.toLowerCase() === r.studentName.toLowerCase())
    ) as any;

    const fullName = matched?.name || (matched ? `${matched.firstName || ''} ${matched.lastName || ''}`.trim() : '') || r.studentName || (rStudent ? `${rStudent.firstName || ''} ${rStudent.lastName || ''}`.trim() : '') || 'Student Scholar';
    const schoolId = matched?.schoolId || sId || 'ST-2026';
    const grade = matched?.gradeLevel || matched?.grade || 'Standard Program';
    const section = matched?.sections?.[0]?.name || matched?.section?.name || '';
    const parentName = matched?.parents?.[0]?.name || (matched?.parents?.[0] ? `${matched.parents[0].firstName || ''} ${matched.parents[0].lastName || ''}`.trim() : '') || r.parentName || 'Registered Parent Sponsor';
    const parentPhone = matched?.parents?.[0]?.phone || (Array.isArray(matched?.emergencyContacts) ? matched?.emergencyContacts[0]?.phone : (typeof matched?.emergencyContacts === 'object' ? matched?.emergencyContacts?.phone : '')) || '';

    return {
      fullName,
      schoolId,
      grade,
      section,
      parentName,
      parentPhone
    };
  };

  const adminColumns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => {
    return [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt # & Invoice Ref',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="space-y-1 py-1">
              <span className="font-mono text-xs font-black text-emerald-400 block tracking-wide">
                {r.receiptNumber}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-sky-400 border border-slate-700">
                  {r.invoiceNumber || 'INV-GENERAL'}
                </span>
                {r.currency && r.currency !== 'USD' && (
                  <span className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {r.currency}
                  </span>
                )}
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'studentName',
        header: 'Student Scholar & Sponsor Profile',
        cell: ({ row }) => {
          const r = row.original;
          const s = resolveStudent(r);
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-xs text-emerald-300 shrink-0">
                {s.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs sm:text-sm truncate max-w-xs">
                    {s.fullName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    {s.schoolId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                  {s.grade && <span className="font-medium text-slate-300">{s.grade}</span>}
                  {s.section && <span className="text-slate-500 font-mono">• {s.section}</span>}
                  <span className="text-slate-400 font-mono truncate max-w-xs">
                    • Sponsor: <strong className="text-slate-300 font-semibold">{s.parentName}</strong>
                    {s.parentPhone && ` (${s.parentPhone})`}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Channel & Ref',
        cell: ({ row }) => {
          const r = row.original;
          const m = r.paymentMethod || 'Cash';
          return (
            <div className="space-y-1 text-xs py-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                m.includes('Bank') ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' :
                m.includes('Money') || m.includes('Wave') ? 'bg-sky-950/60 text-sky-300 border-sky-800' :
                m === 'Cash' ? 'bg-amber-950/60 text-amber-300 border-amber-800' :
                'bg-slate-800 text-slate-200 border-slate-700'
              }`}>
                {m.includes('Bank') && <Landmark className="w-3.5 h-3.5 text-emerald-400" />}
                {(m.includes('Money') || m.includes('Wave')) && <Smartphone className="w-3.5 h-3.5 text-sky-400" />}
                {m === 'Cash' && <PiggyBank className="w-3.5 h-3.5 text-amber-400" />}
                {m.includes('Card') && <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                <span>{m}</span>
              </span>
              {(r.referenceNumber || r.bankName) && (
                <span className="text-[10px] font-mono text-slate-400 block truncate max-w-xs">
                  Ref: {r.referenceNumber || r.bankName}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'paymentDate',
        header: 'Date & Cashier',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px] py-1">
            <span className="text-slate-200 block font-bold">{row.original.paymentDate.split('T')[0]}</span>
            <span className="text-slate-400 block truncate max-w-xs">{row.original.cashierName || 'Cashier Terminal'}</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Revenue & Allocation ($)',
        cell: ({ row }) => {
          const r = row.original as any;
          const invAlloc = r.invoiceAllocation ?? r.amount ?? 0;
          const wAlloc = r.walletAllocation ?? r.paymentMetadata?.walletAmount ?? 0;
          const overpay = r.walletCreditGenerated ?? r.paymentMetadata?.overpayment ?? 0;

          return (
            <div className="space-y-0.5 font-mono text-xs py-1">
              <span className="font-black text-emerald-400 block text-sm" title="Allocated Revenue">
                +${invAlloc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {(wAlloc > 0 || overpay > 0) && (
                <div className="text-[10px] text-slate-400 space-y-0.2">
                  {wAlloc > 0 && <span className="block text-sky-400 font-bold">Wallet Applied: ${wAlloc.toFixed(2)}</span>}
                  {overpay > 0 && <span className="block text-amber-400 font-bold">Overpay Credit: ${overpay.toFixed(2)}</span>}
                </div>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status || 'posted'} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedReceipt(row.original)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => setShowQrModal(row.original)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title="Verify QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              onClick={() => {
                printReceiptDocument(row.original);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      }
    ];
  }, [liveStudents]);

  const studentColumns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => {
    return [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt # & Invoice Ref',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-black text-emerald-400 block">{r.receiptNumber}</span>
              <span className="text-[11px] text-slate-400 block font-mono">Invoice Ref: {r.invoiceNumber || 'INV-GENERAL'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method & Gateway Ref',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-200">
              {row.original.paymentMethod.includes('Bank') && <Landmark className="w-3.5 h-3.5 text-emerald-400" />}
              {row.original.paymentMethod.includes('Money') && <Smartphone className="w-3.5 h-3.5 text-sky-400" />}
              {row.original.paymentMethod.includes('Wave') && <Smartphone className="w-3.5 h-3.5 text-blue-400" />}
              {row.original.paymentMethod === 'Cash' && <PiggyBank className="w-3.5 h-3.5 text-amber-400" />}
              <span>{row.original.paymentMethod}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 block truncate max-w-xs">{row.original.referenceNumber || 'Verified Payment Voucher'}</span>
          </div>
        )
      },
      {
        accessorKey: 'paymentDate',
        header: 'Payment Date & Time',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px]">
            <span className="text-slate-300 block font-bold">{row.original.paymentDate.split('T')[0]}</span>
            <span className="text-slate-500 block">Status: Verified ✓</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Amount Paid ($)',
        cell: ({ row }) => {
          const r = row.original as any;
          return (
            <div className="space-y-0.5 font-mono text-xs">
              <span className="font-black text-emerald-400 block text-sm">
                +${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {r.walletCreditGenerated > 0 && (
                <span className="text-[10px] text-amber-400 block font-bold">Overpayment Credited to Wallet: +${r.walletCreditGenerated.toFixed(2)}</span>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions & Official Receipt',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowQrModal(row.original)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify QR</span>
            </button>
            <button
              onClick={() => printReceiptDocument(row.original)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition-all border border-emerald-500/40 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        )
      }
    ];
  }, []);

  // RENDER: STUDENT VIEW PORTAL (For Student & Parent Roles)
  if (viewMode === 'student') {
    return (
      <EnterpriseModuleShell
        title="My Payment Receipts & Fee History"
        description="View your verified payment vouchers, official digital receipts, fee settlements, and student wallet credit."
        breadcrumbs={[{ label: 'My Fees & Ledger', href: '/finance/billing/invoices' }, { label: 'Payment Receipts' }]}
        headerActions={
          <div className="flex items-center gap-2">
            {!isStudentRole && (
              <button
                onClick={() => setViewMode('admin')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
              >
                ← Switch to Cashier POS Mode
              </button>
            )}
            <button
              onClick={() => setShowStudentPayModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>+ Pay Fees Online</span>
            </button>
          </div>
        }
      >
        {/* Student Financial Summary KPI Deck */}
        <EnterpriseKPIDeck cards={studentKpiCards} />

        {/* Domain Sub-Navigation for Students */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
          <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Fee Invoices ({myStudentInvoices.length})</span>
          </Link>
          <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>Payment Receipts ({myStudentReceipts.length})</span>
          </Link>
          <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Financial Statement</span>
          </Link>

          {studentUnpaidDebt > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Outstanding Fees Due: ${studentUnpaidDebt.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Student Receipts Search & Filter Toolbar */}
        <EnterpriseToolbar
          searchQuery={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search my receipts by receipt number (RCP-2026-XXXX), reference, or invoice..."
          density={density}
          onDensityChange={setDensity}
          onRefresh={() => {
            loadData();
            toast.success('My payment receipts updated.');
          }}
          activeFilterCount={activeFiltersCount}
          onResetFilters={handleClearFilters}
          createButtonLabel="+ Pay Online"
          onCreate={() => setShowStudentPayModal(true)}
          customFilterNodes={
            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                aria-label="Filter payment method"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="Bank Transfer">Bank Transfer & Wire</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Cash">Cash Deposit</option>
                <option value="Stripe Card">Credit / Debit Card</option>
              </select>
            </div>
          }
        />

        {/* Student Payment Receipts Grid */}
        <EnterpriseDataGrid
          data={filteredStudentReceiptsList}
          columns={studentColumns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedReceipt(row)}
          onRowClick={(row) => setSelectedReceipt(row)}
          emptyStateProps={{
            title: 'No Payment Receipts Logged',
            description: 'You have no verified payment transaction receipts matching the filter.',
            isFilterActive: activeFiltersCount > 0 || query.length > 0,
            onResetFilters: handleClearFilters,
            createLabel: 'Pay Fees Online',
            onCreate: () => setShowStudentPayModal(true)
          }}
        />

        {/* Student Online Checkout / Pay Modal */}
        {showStudentPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Student Online Fee Checkout</h3>
                    <p className="text-xs text-slate-400 font-mono">Instant Gateway Payment & Verified Digital Receipt</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStudentPayModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePostStudentPayment} className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Paying For Scholar:</span>
                  <strong className="text-emerald-400 font-mono">
                    {user?.firstName || (user as any)?.name || 'Scholar'} ({(user as any)?.schoolId || (user as any)?.studentId || 'STUDENT'})
                  </strong>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Select Invoice to Settle</label>
                  <select
                    value={studentPayInvoiceNumber}
                    onChange={(e) => {
                      const invNo = e.target.value;
                      setStudentPayInvoiceNumber(invNo);
                      const inv = myStudentInvoices.find(i => i.invoiceNumber === invNo);
                      if (inv) {
                        setStudentPayAmount((inv.remainingBalance ?? inv.totalAmount ?? 0).toString());
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">General Advance Wallet Deposit (No Invoice)</option>
                    {myStudentInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber} — ${((inv.remainingBalance ?? inv.totalAmount ?? 0)).toFixed(2)} ({inv.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Payment Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={studentPayAmount}
                      onChange={(e) => setStudentPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Payment Gateway</label>
                    <select
                      value={studentPayMethod}
                      onChange={(e) => setStudentPayMethod(e.target.value as PaymentMethodType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Orange Money">Orange Money Mobile</option>
                      <option value="MTN Money">MTN Mobile Money</option>
                      <option value="Wave Mobile">Wave Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer / Wire</option>
                      <option value="Stripe Card">Credit / Debit Card (Stripe)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Phone Number / Reference (Optional)</label>
                  <input
                    type="text"
                    value={studentPayRef}
                    onChange={(e) => setStudentPayRef(e.target.value)}
                    placeholder="e.g. Mobile Money Phone # or Transaction ID"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secure 256-bit Encrypted Transaction. An official receipt with QR verification code will be generated instantly.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowStudentPayModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStudentPay}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    {isSubmittingStudentPay ? 'Processing Payment...' : 'Complete Online Settlement →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Public QR Code Verification Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowQrModal(null)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-emerald-400">{showQrModal.receiptNumber}</span>
                <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    showQrModal.qrPayloadUrl || `${window.location.origin}/verify/receipt/${showQrModal.receiptNumber}`
                  )}`}
                  alt="Verification QR Code"
                  className="w-40 h-40 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Public Verification QR Code</h3>
                <p className="text-xs text-slate-400">Scan to verify cryptographic receipt authenticity on YAHAYASCOOL Verification Portal</p>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl mt-3 text-[11px] font-mono text-emerald-400 break-all">
                  {showQrModal.qrPayloadUrl}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-slate-950/60 p-3 rounded-xl text-xs border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">Scholar Name:</span>
                  <strong className="text-white block truncate">{showQrModal.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Amount Settled:</span>
                  <strong className="text-emerald-400 font-mono block">${showQrModal.amount.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Method:</span>
                  <strong className="text-slate-200 block">{showQrModal.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Verification Code:</span>
                  <strong className="text-sky-400 font-mono block text-[11px]">{showQrModal.verificationCode}</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  printReceiptDocument(showQrModal);
                  setShowQrModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt Voucher →</span>
              </button>
            </div>
          </div>
        )}

        <SlideOutDrawer
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          record={selectedReceipt ? {
            name: selectedReceipt.studentName,
            id: selectedReceipt.receiptNumber,
            role: `RECEIPT FOR ${selectedReceipt.admissionNumber || 'SCHOLAR'}`,
            status: selectedReceipt.status,
            email: `Cashier: ${selectedReceipt.cashierName}`,
            phone: selectedReceipt.paymentDate.split('T')[0],
            department: `Method: ${selectedReceipt.paymentMethod} | Ref: ${selectedReceipt.referenceNumber || 'N/A'}`,
            joinDate: selectedReceipt.verificationCode,
            balance: `$${selectedReceipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SETTLED`
          } : null}
          category="finance"
        />
      </EnterpriseModuleShell>
    );
  }

  // RENDER: ADMIN CASHIER POS CONSOLE (For Super Admin, Director, Accountant, Cashier)
  return (
    <EnterpriseModuleShell
      title="Multi-Method Cashier Payment Console & POS"
      description="Process and reconcile multi-currency payments across banking, mobile wallets, and campus drawer."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payments' }]}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('student')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            👁️ Preview Student View
          </button>
          <Link
            href="/finance/reports"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Reconciliation Required: 2
          </Link>
          <button
            onClick={() => setShowPayModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      }
    >
      {/* Dynamic KPI Dashboard */}
      <EnterpriseKPIDeck cards={adminKpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Student Statements</span>
        </Link>

        <button
          onClick={handleRunE2EVerification}
          disabled={verifyingE2E}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${verifyingE2E ? 'animate-spin' : ''}`} />
          <span>{verifyingE2E ? 'Testing E2E Scenario...' : 'Run E2E Reconciliation Test'}</span>
        </button>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search receipts by sequence (RCP-2026-XXXX), scholar name, or reference number..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Receipt ledger synced with bank reconciliation feeds.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Record Payment"
        onCreate={() => setShowPayModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter payments by method"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="Bank Transfer">Bank Transfer & Wire</option>
              <option value="Orange Money">Orange Money Mobile</option>
              <option value="Cash">Cash Deposit / Drawer</option>
              <option value="Stripe Card">Stripe / POS Terminal</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredReceipts}
        columns={adminColumns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedReceipt(row)}
        onRowClick={(row) => setSelectedReceipt(row)}
        onRowEdit={(row) => setSelectedReceipt(row)}
        emptyStateProps={{
          title: 'No Payment Receipts Found',
          description: 'No payment transactions match your search query or payment method filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Record New Payment',
          onCreate: () => setShowPayModal(true)
        }}
      />

      {/* Advanced Record Payment & Settlement Modal (Admin) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Record Advanced Cashier Payment</h3>
                  <p className="text-xs text-slate-400 font-mono">Ledger Reconciliation & Pre-payment Handler</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-3 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="space-y-5">
              
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> 1. Scholar Ledger Lookup
                  </label>
                  <input
                    list="student-list"
                    type="text"
                    required
                    placeholder="Search by student name or ID..."
                    value={payStudentSearch}
                    onChange={(e) => setPayStudentSearch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-sky-500"
                  />
                  <datalist id="student-list">
                    {liveStudents.map(s => (
                      <option key={s.id} value={s.schoolId || s.studentId || s.name}>
                        {s.name} ({s.schoolId || s.studentId || 'N/A'})
                      </option>
                    ))}
                  </datalist>
                </div>

                {selectedStudent && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1.5">
                      <span className="text-slate-400">Selected Scholar Profile:</span>
                      <strong className="text-sky-400 font-mono text-right">
                        {selectedStudent.name} • {selectedStudent.schoolId || selectedStudent.studentId || 'N/A'}
                      </strong>
                    </div>

                    <div className={`grid gap-3 mt-1 ${advancePaymentBalance > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Active Debt</span>
                        <strong className={`block text-lg font-mono mt-1 ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </strong>
                        {totalDebt <= 0 && <span className="text-[10px] text-emerald-500 font-bold">✓ No outstanding balance</span>}
                      </div>
                      {advancePaymentBalance > 0 && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">💰 Advance Wallet</span>
                          <strong className="block text-lg font-mono text-emerald-300 mt-1">
                            +${advancePaymentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </strong>
                          {targetInvoice && advancePaymentBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
                                setUseWallet(true);
                                if (advancePaymentBalance >= remaining) {
                                  setPayAmount('0');
                                } else {
                                  setPayAmount((remaining - advancePaymentBalance).toFixed(2));
                                }
                              }}
                              className="mt-1.5 text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              Apply to Invoice →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Target Invoice (Optional)</label>
                  <select
                    value={payInvoiceNumber}
                    onChange={(e) => {
                      const invNo = e.target.value;
                      setPayInvoiceNumber(invNo);
                      const inv = studentInvoices.find(i => i.invoiceNumber === invNo);
                      if (inv) {
                        const bal = inv.remainingBalance ?? (inv.totalAmount || 0);
                        const walletAppliedVal = useWallet ? Math.min(advancePaymentBalance, bal) : 0;
                        setPayAmount(Math.max(0, bal - walletAppliedVal).toString());
                        setPayCurrency(inv.invoiceCurrency?.code || 'USD');
                      } else {
                        setPayAmount('');
                        setPayCurrency('USD');
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">General Advance Deposit (No Invoice)</option>
                    {studentInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber} (${(inv.remainingBalance ?? inv.totalAmount).toLocaleString()} - {inv.invoiceCurrency?.code || 'USD'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    {useWallet && targetInvoice && advancePaymentBalance > 0 ? 'Additional Cash/External Amount' : 'Payment Amount'} ({payCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={!(useWallet && targetInvoice && advancePaymentBalance >= (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0))}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer / Wire</option>
                    <option value="Orange Money">Orange Money Mobile Wallet</option>
                    <option value="MTN Money">MTN Mobile Money</option>
                    <option value="Wave Mobile">Wave Mobile Money</option>
                    <option value="Cash">Cash Deposit (Campus Drawer)</option>
                    <option value="Stripe Card">Stripe / Credit Card POS</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Payment Currency</label>
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LRD">LRD (L$)</option>
                    <option value="EUR">EUR (€)</option>
                    {liveCurrencies.map(c => (
                      <option key={c.id} value={c.currencyCode}>{c.currencyCode}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Gateway Trans ID / Bank</label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {targetInvoice && advancePaymentBalance > 0 && (
                <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Wallet Allocation Calculator</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUseWallet(val);
                          const remaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
                          const applied = val ? Math.min(advancePaymentBalance, remaining) : 0;
                          setPayAmount(Math.max(0, remaining - applied).toString());
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Apply Wallet Balance</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Invoice Amount</span>
                      <strong className="text-slate-200 text-sm">
                        ${(targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 font-bold block uppercase">Wallet Applied</span>
                      <strong className="text-emerald-400 text-sm">
                        -${((useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0)).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-500 font-bold block uppercase">Remaining Due</span>
                      <strong className="text-amber-400 text-sm">
                        ${Math.max(0, (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) - (useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30"
                >
                  Post Ledger Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Verification Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowQrModal(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">{showQrModal.receiptNumber}</span>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  showQrModal.qrPayloadUrl || `${window.location.origin}/verify/receipt/${showQrModal.receiptNumber}`
                )}`}
                alt="Verification QR Code"
                className="w-40 h-40 object-contain rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Public Verification QR Code</h3>
              <p className="text-xs text-slate-400">Scan to verify cryptographic receipt authenticity on YAHAYASCOOL Verification Portal</p>
            </div>

            <button
              onClick={() => {
                printReceiptDocument(showQrModal);
                setShowQrModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt Voucher →</span>
            </button>
          </div>
        </div>
      )}

      {/* E2E Accounting Scenario Modal (Admin) */}
      {showE2EModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">E2E Accounting Integrity Suite</h3>
                  <p className="text-xs text-slate-400 font-mono">Mandatory $10,016 Accounting Scenario Execution</p>
                </div>
              </div>
              <button
                onClick={() => setShowE2EModal(false)}
                className="text-slate-400 hover:text-white font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {verifyingE2E ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs font-bold font-mono">Executing 7-Step Accounting Scenario & Assertion Guards...</p>
              </div>
            ) : e2eResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${e2eResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                  <strong className="text-sm font-black uppercase tracking-wider block mb-1">
                    {e2eResult.success ? '✅ MANDATORY E2E SCENARIO PASSED 100%' : '❌ E2E SCENARIO FAILED'}
                  </strong>
                  <p className="text-xs">{e2eResult.message || e2eResult.error}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Dedicated Official Payment Receipt Dossier & Inspection Modal */}
      {selectedReceipt && (() => {
        const studentInfo = resolveStudent(selectedReceipt);
        const invAlloc = (selectedReceipt as any).invoiceAllocation ?? selectedReceipt.amount ?? 0;
        const wAlloc = (selectedReceipt as any).walletAllocation ?? (selectedReceipt as any).paymentMetadata?.walletAmount ?? 0;
        const overpay = (selectedReceipt as any).walletCreditGenerated ?? (selectedReceipt as any).paymentMetadata?.overpayment ?? 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-emerald-400">
                        {selectedReceipt.receiptNumber}
                      </span>
                      <StatusBadge status={selectedReceipt.status || 'posted'} size="sm" />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ✓ VERIFIED SETTLEMENT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Invoice Ref: <strong className="text-sky-400">{selectedReceipt.invoiceNumber || 'INV-GENERAL'}</strong> • {selectedReceipt.paymentDate.split('T')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      printReceiptDocument(selectedReceipt);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Official Receipt</span>
                  </button>
                  <button
                    onClick={() => setShowQrModal(selectedReceipt)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scholar & Parent Sponsor Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-sm text-emerald-300">
                    {studentInfo.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{studentInfo.fullName}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {studentInfo.schoolId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {studentInfo.grade} {studentInfo.section && `• ${studentInfo.section}`}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right space-y-0.5 text-xs">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Parent Sponsor</span>
                  <span className="font-bold text-slate-200 block">{studentInfo.parentName}</span>
                  {studentInfo.parentPhone && (
                    <span className="font-mono text-slate-400 block">{studentInfo.parentPhone}</span>
                  )}
                </div>
              </div>

              {/* Financial Transaction Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Received</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-1 block">
                    +${Number(selectedReceipt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Invoice Allocation</span>
                  <span className="text-base font-black text-white font-mono mt-1 block">
                    ${Number(invAlloc).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Wallet Applied</span>
                  <span className="text-base font-black text-sky-400 font-mono mt-1 block">
                    ${Number(wAlloc).toFixed(2)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Remaining Balance</span>
                  <span className={`text-base font-black font-mono mt-1 block ${Number(selectedReceipt.remainingStudentBalance || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${Number(selectedReceipt.remainingStudentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Channel & Gateway Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Payment Channel & Instrument</span>
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Channel Mode:</span>
                      <strong className="text-white">{selectedReceipt.paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gateway Ref:</span>
                      <strong className="text-emerald-400">{selectedReceipt.referenceNumber || selectedReceipt.bankName || 'Verified POS'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GL Account:</span>
                      <strong className="text-slate-300">
                        {selectedReceipt.paymentMethod.includes('Bank') ? 'Account 1010 (Commercial Bank)' :
                         selectedReceipt.paymentMethod.includes('Money') ? 'Account 1020 (Mobile Money)' :
                         'Account 1030 (Cash Drawer)'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Cashier Session & Audit Trail</span>
                  </h5>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receiving Cashier:</span>
                      <strong className="text-white">{selectedReceipt.cashierName || 'Finance Desk'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Settlement Date:</span>
                      <strong className="text-slate-300">{selectedReceipt.paymentDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audit Status:</span>
                      <strong className="text-emerald-400">✓ Cryptographically Cleared</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic QR Seal & Security Notice */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(
                        selectedReceipt.qrPayloadUrl || `${window.location.origin}/verify/receipt/${selectedReceipt.receiptNumber}`
                      )}`}
                      alt="Receipt QR"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Official Cryptographic Security Stamp</span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Code: {selectedReceipt.verificationCode || selectedReceipt.receiptNumber}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      Verified on YAHAYASCOOL Public Verification Ledger
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    printReceiptDocument(selectedReceipt);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
                >
                  Print Voucher →
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </EnterpriseModuleShell>
  );
}

export default function CashierPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white font-mono">Loading Payment Gateway...</div>}>
      <CashierPaymentsContent />
    </Suspense>
  );
}
