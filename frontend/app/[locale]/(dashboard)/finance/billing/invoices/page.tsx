/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  FileText, Plus, Search, Filter, Download, Eye, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Percent, Layers, Award, Coins,
  Calendar, User, Mail, Shield, ArrowRight, Printer, Sparkles, Activity, X, Edit3
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { Invoice, InvoiceLineItem } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { erpService } from '@/services/erp.service';
import type { Student, Parent } from '@/types/erp.types';
import { printInvoiceDocument } from '@/lib/print-finance';

export default function StudentInvoicesPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user, role } = useAuth();

  // Role Evaluation for Invoice Operations
  const userRoleStr = String(role || user?.role?.type || user?.role?.name || '').toLowerCase();
  const isAdmin = userRoleStr.includes('admin') || userRoleStr.includes('director') || userRoleStr.includes('super');
  const isAccountLead = userRoleStr.includes('lead') || userRoleStr.includes('account-lead');
  const isAccountant = userRoleStr.includes('accountant') && !isAccountLead;

  const canCreateInvoice = isAdmin || isAccountLead || isAccountant;

  const canEditInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead || isAccountant) {
      return inv.status === 'draft' || inv.status === 'pending_payment' || inv.status === 'submitted';
    }
    return false;
  };

  const canDeleteInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead || isAccountant) {
      return inv.status === 'draft' || inv.status === 'pending_payment' || inv.status === 'submitted';
    }
    return false;
  };

  const canApproveInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead) {
      return inv.status === 'draft' || inv.status === 'submitted';
    }
    return false;
  };

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Live Directory Data
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [liveParents, setLiveParents] = useState<Parent[]>([]);

  // New Invoice Form state - clean empty defaults
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newAdmissionNumber, setNewAdmissionNumber] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newTuitionAmount, setNewTuitionAmount] = useState('');
  const [newLibraryAmount, setNewLibraryAmount] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState('');
  const [newScholarshipAmount, setNewScholarshipAmount] = useState('');
  const [newLateFeeAmount, setNewLateFeeAmount] = useState('');
  const [newInstallmentFrequency, setNewInstallmentFrequency] = useState('Termly');
  const [newCurrency, setNewCurrency] = useState('USD');

  // Edit Invoice Form state
  const [editStudentId, setEditStudentId] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editTuitionAmount, setEditTuitionAmount] = useState('');
  const [editLibraryAmount, setEditLibraryAmount] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (selectedInvoice) {
      const sName = selectedInvoice.student
        ? `${selectedInvoice.student.firstName || ''} ${selectedInvoice.student.lastName || ''}`.trim() || selectedInvoice.student.name || selectedInvoice.studentName || ''
        : selectedInvoice.studentName || '';
      setEditStudentName(sName);
      setEditStudentId(selectedInvoice.student?.id ? String(selectedInvoice.student.id) : '');
      setEditTuitionAmount((selectedInvoice.subtotal || selectedInvoice.totalAmount || 0).toString());
      setEditLibraryAmount('0');
      setEditStatus(selectedInvoice.status || 'draft');
      setEditDueDate(selectedInvoice.dueDate || '');
      setEditNotes(selectedInvoice.notes || '');
    }
  }, [selectedInvoice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getInvoices(statusFilter);
      setInvoices(data);

      const [studentsRes, parentsRes] = await Promise.all([
        erpService.getStudents({ pageSize: 1000 }).catch(() => ({ data: [] })),
        erpService.getParents({ pageSize: 1000 }).catch(() => ({ data: [] }))
      ]);
      setLiveStudents(studentsRes.data || []);
      setLiveParents(parentsRes.data || []);
    } catch {
      toast.error(t('Failed to load student invoices or directory data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const sName = inv.student
        ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
        : inv.studentName || '';
      const pName = inv.student?.parent?.name
        ? `${inv.student.parent.firstName || ''} ${inv.student.parent.lastName || ''}`.trim() || inv.student.parent.name
        : inv.parentName || inv.student?.parentName || '';
      const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || '';
      const matchQuery = !query ||
        (inv.invoiceNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        sName.toLowerCase().includes(query.toLowerCase()) ||
        pName.toLowerCase().includes(query.toLowerCase()) ||
        admNo.toLowerCase().includes(query.toLowerCase());
      return matchQuery;
    });
  }, [invoices, query]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setStatusFilter('all');
    setQuery('');
    toast.success(t('Invoice filters reset.'));
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewStudentName(val);
    const student = liveStudents.find(s =>
      s.name === val ||
      s.studentId === val ||
      s.schoolId === val ||
      `${s.firstName || ''} ${s.lastName || ''}`.trim() === val
    );
    if (student) {
      const displayName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || '';
      setNewStudentName(displayName);
      setNewStudentId(String(student.id));
      setNewAdmissionNumber(student.admissionNumber || student.schoolId || student.studentId || '');

      if (student.parents && student.parents.length > 0) {
        const parent = student.parents[0];
        const pName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.name || '';
        setNewParentName(pName);
        setNewParentEmail(parent.email || '');
      } else {
        setNewParentName('');
        setNewParentEmail('');
      }
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateInvoice) {
      toast.error(t('Your role does not have permission to create invoices.'));
      return;
    }

    const subtotal = parseFloat(newTuitionAmount || '0') + parseFloat(newLibraryAmount || '0');
    const discount = parseFloat(newDiscountAmount || '0');
    const scholarship = parseFloat(newScholarshipAmount || '0');
    const lateFee = parseFloat(newLateFeeAmount || '0');
    const total = Math.max(0, subtotal - discount - scholarship + lateFee);

    try {
      const created = await financeService.createInvoice({
        studentId: newStudentId,
        studentName: newStudentName,
        admissionNumber: newAdmissionNumber,
        parentName: newParentName,
        parentEmail: newParentEmail,
        invoiceCurrency: newCurrency as any,
        baseCurrency: 'USD' as any,
        subtotal,
        discountAmount: discount,
        scholarshipAmount: scholarship,
        lateFeeAmount: lateFee,
        totalAmount: total,
        items: [
          { id: 'ITM-N1', description: 'Term 1 Tuition Fee', category: 'Tuition', unitAmount: parseFloat(newTuitionAmount || '0'), quantity: 1, totalAmount: parseFloat(newTuitionAmount || '0') },
          { id: 'ITM-N2', description: 'Campus Library & Digital Archive Fee', category: 'Library', unitAmount: parseFloat(newLibraryAmount || '0'), quantity: 1, totalAmount: parseFloat(newLibraryAmount || '0') }
        ],
        notes: `Installment Plan: ${newInstallmentFrequency}. Auto-assessed fee items.`
      });

      toast.success(`${t('Generated invoice')} ${created.invoiceNumber || ''}!`);
      setShowCreateModal(false);
      loadData();
    } catch {
      toast.error(t('Failed to create invoice'));
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!canEditInvoice(selectedInvoice)) {
      toast.error(t('Your role cannot edit this invoice status.'));
      return;
    }

    const targetId = selectedInvoice.documentId || selectedInvoice.id;
    const subtotal = parseFloat(editTuitionAmount || '0') + parseFloat(editLibraryAmount || '0');
    const paidAmount = selectedInvoice.paidAmount || 0;
    const remainingBalance = Math.max(0, subtotal - paidAmount);

    try {
      await financeService.updateInvoice(String(targetId), {
        studentId: editStudentId || undefined,
        subtotal,
        totalAmount: subtotal,
        remainingBalance,
        status: editStatus as any,
        dueDate: editDueDate || undefined,
        notes: editNotes || undefined,
      });

      toast.success(`${t('Updated invoice')} ${selectedInvoice.invoiceNumber}!`);
      setShowEditModal(false);
      loadData();
      setSelectedInvoice(null);
    } catch {
      toast.error(t('Failed to update invoice'));
    }
  };

  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((s, i) => s + (Number(i.remainingBalance ?? (Number(i.totalAmount || 0) - Number(i.paidAmount || 0)))), 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.status === 'overdue').length, [invoices]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_invoiced',
      title: t('Total Invoiced (Academic Year)'),
      value: `$${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${invoices.length} ${t('total active student fee accounts')}`,
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => toast.info(t('Displaying all institutional invoices.'))
    },
    {
      id: 'collected',
      title: t('Collected Revenue via Invoices'),
      value: `$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${Math.round((totalCollected / (totalInvoiced || 1)) * 100)}% ${t('settlement collection rate')}`,
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      onClick: () => setStatusFilter('paid')
    },
    {
      id: 'outstanding',
      title: t('Remaining Outstanding Balance'),
      value: `$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Accounts receivable awaiting parent payment'),
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-sky-400" />,
      onClick: () => setStatusFilter('partially_paid')
    },
    {
      id: 'overdue',
      title: t('Overdue Invoices'),
      value: `${overdueCount} ${t('Accounts')}`,
      subtitle: t('Automatic late fee rules active'),
      trendDirection: 'down',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      isActive: statusFilter === 'overdue',
      onClick: () => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')
    }
  ];

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: t('Invoice #'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-emerald-600 block">{row.original.invoiceNumber}</span>
      )
    },
    {
      accessorKey: 'studentName',
      header: t('Scholar Details'),
      cell: ({ row }) => {
        const inv = row.original;
        const sName = inv.student
          ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || 'Unknown Scholar'
          : inv.studentName || 'Unknown Scholar';
        const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || 'N/A';
        const pName = inv.student?.parents?.[0]?.name || inv.parentName || 'N/A';
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
              {sName}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {admNo} • {pName}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'issueDate',
      header: t('Issue & Due Date'),
      cell: ({ row }) => {
        const inv = row.original;
        const issueStr = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        return (
          <div className="flex flex-col text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{t('Issue')}: {issueStr || '---'}</span>
            <span className="text-slate-500 font-mono text-[11px]">{t('Due')}: {dueStr}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'paidAmount',
      header: t('Paid Amount'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
          ${(Number(row.original.paidAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'totalAmount',
      header: `${t('Total / Balance')} ($)`,
      cell: ({ row }) => {
        const total = Number(row.original.totalAmount) || 0;
        const bal = Number(row.original.remainingBalance ?? (total - Number(row.original.paidAmount || 0)));
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-bold ${bal > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {t('Bal')}: ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Settlement Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedInvoice(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('Inspect')}</span>
          </button>
          <Link
            href={`/finance/billing/payments?invoiceNumber=${row.original.invoiceNumber}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-800 shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t('Pay')}</span>
          </Link>
        </div>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Student Billing & Itemized Fee Invoices')}
      description={t('Sequential invoice generator (INV-YYYY-XXXXXX) with automatic fee structure attachment, scholarship/discount calculation, installment payment schedules, and automated late fee rules.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Invoices') }]}
      icon={<FileText className="w-8 h-8" />}
      recordCount={filteredInvoices.length}
      recordLabel={t('Invoices')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(invoices, 'invoices_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{t('Export CSV')}</span>
          </button>
          {canCreateInvoice && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('Generate Invoice')}</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('Student Statements')}</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Fee Structures')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search invoices by invoice number, scholar name, parent, or admission #...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Invoices refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
      />

      <EnterpriseDataGrid
        data={filteredInvoices}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedInvoice(row)}
        onRowClick={(row) => setSelectedInvoice(row)}
        emptyStateProps={{
          title: t('No Invoices Found'),
          description: t('No billing records match your search query or status filter.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: t('Generate First Invoice'),
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Generate Student Fee Invoice')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Select Scholar / Student')}</label>
                <input
                  type="text"
                  list="students-list"
                  required
                  value={newStudentName}
                  onChange={handleStudentSelect}
                  placeholder={t('Type student name or admission number...')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
                <datalist id="students-list">
                  {liveStudents.map(s => (
                    <option key={s.id} value={`${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name}>
                      {s.admissionNumber || s.schoolId} - Grade {s.gradeLevel || 'N/A'}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Tuition Fee Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={newTuitionAmount}
                    onChange={(e) => setNewTuitionAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Library & Archive Fee ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={newLibraryAmount}
                    onChange={(e) => setNewLibraryAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Discount Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newDiscountAmount}
                    onChange={(e) => setNewDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Scholarship Credit ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newScholarshipAmount}
                    onChange={(e) => setNewScholarshipAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Generate Invoice')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-6 h-6 text-sky-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Edit Invoice')} {selectedInvoice.invoiceNumber}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Scholar / Student Name')}</label>
                <input
                  type="text"
                  readOnly
                  value={editStudentName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Total Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTuitionAmount}
                    onChange={(e) => setEditTuitionAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Invoice Status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="draft">{t('Draft')}</option>
                    <option value="pending_payment">{t('Pending Payment')}</option>
                    <option value="partially_paid">{t('Partially Paid')}</option>
                    <option value="paid">{t('Paid')}</option>
                    <option value="cancelled">{t('Cancelled')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md">{t('Save Invoice Changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer for Invoice Inspection */}
      <SlideOutDrawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        record={selectedInvoice ? {
          name: selectedInvoice.student
            ? `${selectedInvoice.student.firstName || ''} ${selectedInvoice.student.lastName || ''}`.trim() || selectedInvoice.student.name || selectedInvoice.studentName || 'Unknown Scholar'
            : selectedInvoice.studentName || 'Unknown Scholar',
          id: selectedInvoice.invoiceNumber,
          role: `Admission: ${selectedInvoice.student?.admissionNumber || selectedInvoice.student?.schoolId || selectedInvoice.admissionNumber || 'N/A'}`,
          status: selectedInvoice.status,
          email: selectedInvoice.parentEmail || 'No Email Provided',
          phone: selectedInvoice.issueDate ? `Issued: ${selectedInvoice.issueDate}` : 'N/A',
        } : null}
        category="finance"
        hideIntelligence={true}
        quickActions={selectedInvoice ? [
          ...(canApproveInvoice(selectedInvoice) ? [{
            id: 'approve',
            label: selectedInvoice.status === 'draft' ? t('Approve Invoice') : (isAdmin ? t('Un-approve Invoice') : t('Approved')),
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: selectedInvoice.status === 'draft' ? 'primary' as const : undefined,
            onClick: async () => {
              const targetId = selectedInvoice.documentId || selectedInvoice.id;
              const newStatus = selectedInvoice.status === 'draft' ? 'pending_payment' : 'draft';
              try {
                await financeService.updateInvoiceStatus(String(targetId), newStatus);
                toast.success(`${t('Invoice')} ${selectedInvoice.invoiceNumber} status updated to ${newStatus}!`);
                loadData();
                setSelectedInvoice(prev => prev ? { ...prev, status: newStatus } : null);
              } catch {
                toast.error(t('Failed to update invoice status.'));
              }
            }
          }] : []),
          ...(canEditInvoice(selectedInvoice) ? [{
            id: 'edit',
            label: t('Edit Invoice'),
            icon: <Edit3 className="w-3.5 h-3.5 text-sky-500" />,
            onClick: () => setShowEditModal(true)
          }] : []),
          {
            id: 'preview',
            label: t('Preview'),
            icon: <Eye className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          {
            id: 'download',
            label: t('Download PDF'),
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          {
            id: 'print',
            label: t('Print'),
            icon: <Printer className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          ...(canDeleteInvoice(selectedInvoice) ? [{
            id: 'delete',
            label: t('Delete'),
            icon: <X className="w-3.5 h-3.5" />,
            variant: 'danger' as const,
            onClick: async () => {
              const targetId = selectedInvoice.documentId || selectedInvoice.id;
              try {
                await financeService.deleteInvoice(String(targetId));
                toast.error(`${t('Invoice')} ${selectedInvoice.invoiceNumber} ${t('has been permanently deleted.')}`);
                setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id && inv.documentId !== selectedInvoice.documentId));
                setSelectedInvoice(null);
              } catch {
                toast.error(t('Failed to delete invoice from server.'));
              }
            }
          }] : [])
        ] : []}
        statsBarOverride={selectedInvoice ? (
          <>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
              {t('Total')}: <strong className="text-slate-900 dark:text-white">${(Number(selectedInvoice.totalAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
              {t('Balance Due')}: <strong className={(Number(selectedInvoice.remainingBalance ?? (Number(selectedInvoice.totalAmount || 0) - Number(selectedInvoice.paidAmount || 0)))) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>${(Number(selectedInvoice.remainingBalance ?? (Number(selectedInvoice.totalAmount || 0) - Number(selectedInvoice.paidAmount || 0)))).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
          </>
        ) : undefined}
      />
    </EnterpriseModuleShell>
  );
}
