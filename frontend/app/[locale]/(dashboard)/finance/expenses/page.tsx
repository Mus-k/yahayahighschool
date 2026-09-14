/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Receipt, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, ShieldCheck, AlertCircle, ArrowRight,
  Sparkles, Building2, User, Upload, Printer, Users
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { ExpenseRequest } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { generateExpenseVoucherPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

export default function CategorizedOperatingExpensesPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Expense Form state - clean empty defaults
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Utilities' | 'Equipment' | 'Maintenance' | 'Supplies' | 'Salaries' | 'Other'>('Utilities');
  const [department, setDepartment] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenseRequests();
      setExpenses(data);
    } catch {
      toast.error(t('Failed to load operating expenses.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchQuery = !query ||
        (e.voucherNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.vendorName || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [expenses, query, categoryFilter]);

  const activeFiltersCount = categoryFilter !== 'all' ? 1 : 0;

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      toast.error(t('Title and expense amount are required.'));
      return;
    }
    const amountNum = parseFloat(amount || '0');
    const requestedBy = (user as any)?.name || user?.username || 'Finance Officer';

    try {
      const created = await financeService.createExpenseRequest({
        voucherNumber: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        category,
        department: department || 'Campus Operations & Facilities',
        amount: amountNum,
        vendorName: vendorName || 'Direct Vendor',
        invoiceReference: invoiceReference || undefined,
        requestedBy,
        status: 'submitted'
      });

      setExpenses([created, ...expenses]);
      toast.success(`${t('Created Expense Claim')} ${created.voucherNumber || 'EXP'} ($${amountNum.toFixed(2)})`);
      setTitle('');
      setDepartment('');
      setAmount('');
      setVendorName('');
      setInvoiceReference('');
      setShowCreateModal(false);
    } catch (err: any) {
      toast.error(t('Failed to create expense claim'));
    }
  };

  const handleAdvanceWorkflow = async (e: ExpenseRequest) => {
    const nextMap: Record<string, string> = {
      draft: 'submitted',
      submitted: 'reviewed',
      reviewed: 'approved',
      approved: 'paid'
    };
    const next = nextMap[e.status || 'submitted'] || 'paid';
    const targetId = e.documentId || e.id;
    try {
      await financeService.updateExpenseStatus(String(targetId), next);
      toast.success(`${t('Expense')} ${e.voucherNumber} ${t('advanced to')} ${next.toUpperCase()}`);
      loadData();
    } catch {
      toast.error(t('Failed to advance workflow'));
    }
  };

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const pendingApprovals = useMemo(() => expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length, [expenses]);
  const disbursedTotal = useMemo(() => expenses.filter(e => e.status === 'paid').reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_expenses',
      title: t('Total Incurred Operating Expenses (YTD)'),
      value: `$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${expenses.length} ${t('claims and disbursement vouchers')}`,
      trendDirection: 'up',
      icon: <Receipt className="w-5 h-5 text-rose-400" />,
      isActive: categoryFilter === 'all',
      onClick: () => setCategoryFilter('all')
    },
    {
      id: 'pending_approvals',
      title: t('Pending Multi-Stage Approvals'),
      value: `${pendingApprovals} ${t('Claims')}`,
      subtitle: t('Requisitions awaiting Director authorization'),
      trendDirection: pendingApprovals > 0 ? 'down' : 'up',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      onClick: () => toast.info(t('Inspect approval queue in Approvals view.'))
    },
    {
      id: 'disbursed_funds',
      title: t('Disbursed & Settled Capital Outflows'),
      value: `$${disbursedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Settled via commercial bank or mobile money'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<ExpenseRequest, any>[]>(() => [
    {
      accessorKey: 'voucherNumber',
      header: t('Voucher # & Title'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-rose-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-white text-xs sm:text-sm block max-w-sm truncate">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: t('Category & Department'),
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {t(row.original.category)}
          </span>
          <span className="text-[11px] text-slate-400 block truncate max-w-xs">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: t('Vendor / Payee'),
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-slate-200 block">{row.original.vendorName}</span>
          {row.original.invoiceReference && <span className="text-[10px] text-slate-400 font-mono">Ref: {row.original.invoiceReference}</span>}
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: `${t('Claim Amount')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-rose-400 block">
          -${(Number(row.original.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Workflow Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            {e.status !== 'paid' && (
              <button
                onClick={() => handleAdvanceWorkflow(e)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {e.status === 'submitted' ? t('Review') : e.status === 'reviewed' ? t('Approve') : t('Disburse')}
              </button>
            )}
            <button
              onClick={() => setSelectedExpense(e)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              {t('Inspect')}
            </button>
          </div>
        );
      }
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Operating Expenses & Supplier Claims Console')}
      description={t('Multi-stage expense requisition lifecycle (Draft → Submitted → Reviewed → Approved → Paid). Automated GL posting upon disbursement.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Payroll & Budget') }, { label: t('Operating Expenses') }]}
      icon={<Receipt className="w-8 h-8 text-rose-400" />}
      recordCount={filteredExpenses.length}
      recordLabel={t('Claims')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setCategoryFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{t('Approval Queue')}</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Create Expense Claim')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Staff Payroll Runs')}</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5" />
          <span>{t('Operating Expenses')}</span>
        </Link>
        <Link href="/finance/expenses/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('Multi-Stage Approvals')}</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Departmental Budget vs Actual')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search expenses by voucher #, title, vendor name, or department...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Operating expenses refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setCategoryFilter('all'); setQuery(''); }}
        createButtonLabel={t('+ New Expense Claim')}
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredExpenses}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedExpense(row)}
        onRowClick={(row) => setSelectedExpense(row)}
        emptyStateProps={{
          title: t('No Expenses Found'),
          description: t('No operating expenses match your search or filter criteria.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setCategoryFilter('all'); setQuery(''); },
          createLabel: t('Log First Expense Claim'),
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-6 h-6 text-rose-400" />
                <h3 className="text-base font-black text-white">{t('Create Operating Expense Claim')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Expense Title / Purpose')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Consumables & Reagents"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('GL Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Utilities">{t('Utilities (5020)')}</option>
                    <option value="Equipment">{t('Equipment & IT (5030)')}</option>
                    <option value="Supplies">{t('Teaching Supplies (5040)')}</option>
                    <option value="Maintenance">{t('Maintenance & Repairs (5050)')}</option>
                    <option value="Salaries">{t('Staff Salaries & Benefits (5010)')}</option>
                    <option value="Other">{t('Other Operating Expense')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Department / Cost Center')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Vendor / Supplier Name')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Dakar Lab Supplies Ltd"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Claim Amount ($ USD)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="450"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Submit Expense Claim')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        record={selectedExpense ? {
          name: selectedExpense.title,
          id: selectedExpense.voucherNumber,
          role: `VENDOR: ${selectedExpense.vendorName || 'Direct'}`,
          status: selectedExpense.status || 'submitted',
          email: `Requested By: ${selectedExpense.requestedBy || 'Staff'}`,
          phone: `Category: ${selectedExpense.category}`,
          department: `Dept: ${selectedExpense.department}`,
          joinDate: selectedExpense.status,
          balance: `AMOUNT: $${(Number(selectedExpense.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
