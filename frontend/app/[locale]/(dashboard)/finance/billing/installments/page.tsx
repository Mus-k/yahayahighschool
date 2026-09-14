/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, CheckCircle2, AlertTriangle,
  FileText, ArrowRight, Percent,
  Layers, ShieldCheck
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { Invoice } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface InstallmentRow {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  admissionNumber?: string;
  installmentIndex: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  remainingBalance: number;
  status: 'paid' | 'pending_payment' | 'partially_paid' | 'overdue';
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InstallmentPlansPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity]   = useState<TableDensity>('cozy');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getInvoices();
      setInvoices(data || []);
    } catch {
      toast.error(t('Failed to load installment plans.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Flatten invoices to individual installment milestones
  const allInstallments = useMemo<InstallmentRow[]>(() => {
    const rows: InstallmentRow[] = [];
    const today = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      const studentTitle = inv.studentName || (inv.student ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() : 'Student');
      const instList = inv.installments || [];

      if (instList.length > 0) {
        instList.forEach((inst: any, idx: number) => {
          let st = (inst.status || 'pending_payment') as any;
          if (st === 'pending_payment' && inst.dueDate && inst.dueDate < today && (inst.remainingBalance ?? inst.amount) > 0) {
            st = 'overdue';
          }

          rows.push({
            id: `${inv.id}-inst-${idx + 1}`,
            invoiceId: String(inv.id),
            invoiceNumber: inv.invoiceNumber,
            studentName: studentTitle,
            admissionNumber: (inv.student as any)?.admissionNumber || inv.admissionNumber,
            installmentIndex: idx + 1,
            totalInstallments: instList.length,
            dueDate: inst.dueDate ? String(inst.dueDate).split('T')[0] : '—',
            amount: Number(inst.amount || 0),
            remainingBalance: Number(inst.remainingBalance ?? (st === 'paid' ? 0 : inst.amount)),
            status: st,
          });
        });
      } else {
        // Single payment plan represented as 1 installment
        let st: any = inv.status === 'paid' ? 'paid' : (inv.status === 'partially_paid' ? 'partially_paid' : 'pending_payment');
        if (st === 'pending_payment' && inv.dueDate && inv.dueDate < today) {
          st = 'overdue';
        }
        rows.push({
          id: `${inv.id}-single`,
          invoiceId: String(inv.id),
          invoiceNumber: inv.invoiceNumber,
          studentName: studentTitle,
          admissionNumber: (inv.student as any)?.admissionNumber || inv.admissionNumber,
          installmentIndex: 1,
          totalInstallments: 1,
          dueDate: inv.dueDate ? String(inv.dueDate).split('T')[0] : '—',
          amount: Number(inv.totalAmount || 0),
          remainingBalance: Number(inv.remainingBalance ?? 0),
          status: st,
        });
      }
    });

    return rows;
  }, [invoices]);

  const filteredInstallments = useMemo(() => {
    return allInstallments.filter(r => {
      const q = query.toLowerCase();
      const matchQ = !query ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.admissionNumber || '').toLowerCase().includes(q);
      const matchSt = statusFilter === 'all' || r.status === statusFilter;
      return matchQ && matchSt;
    });
  }, [allInstallments, query, statusFilter]);

  const totalCommitted = useMemo(() => allInstallments.reduce((s, r) => s + r.amount, 0), [allInstallments]);
  const totalCollected = useMemo(() => allInstallments.reduce((s, r) => s + (r.amount - r.remainingBalance), 0), [allInstallments]);
  const overdueCount   = useMemo(() => allInstallments.filter(r => r.status === 'overdue').length, [allInstallments]);
  const activePlansCount = useMemo(() => new Set(allInstallments.map(r => r.invoiceId)).size, [allInstallments]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_plans',
      title: t('Active Installment Plans'),
      value: `${activePlansCount}`,
      subtitle: `${allInstallments.length} ${t('scheduled tranches')}`,
      trendDirection: 'up',
      icon: <Layers className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'total_scheduled',
      title: t('Total Scheduled Tuition'),
      value: `$${fmt(totalCommitted)}`,
      subtitle: t('Across all quarterly/monthly deferred plans'),
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'total_collected',
      title: t('Installments Cleared'),
      value: `$${fmt(totalCollected)}`,
      subtitle: `${totalCommitted > 0 ? ((totalCollected / totalCommitted) * 100).toFixed(1) : 0}% ${t('collection rate')}`,
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'overdue_installments',
      title: t('Overdue Milestones'),
      value: `${overdueCount}`,
      subtitle: overdueCount > 0 ? t('Action required on deferred tranches') : t('All payments on schedule'),
      trendDirection: overdueCount > 0 ? 'down' : 'up',
      icon: <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
    }
  ];

  const columns = useMemo<ColumnDef<InstallmentRow, any>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: t('Invoice & Milestone'),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <Link
              href={`/finance/billing/invoices?search=${r.invoiceNumber}`}
              className="font-mono text-xs font-black text-emerald-400 hover:underline block"
            >
              {r.invoiceNumber}
            </Link>
            <span className="text-[11px] font-bold text-slate-300">
              {t('Tranche')} {r.installmentIndex} of {r.totalInstallments}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: t('Student Profile'),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <p className="font-bold text-white text-xs">{r.studentName}</p>
            {r.admissionNumber && (
              <span className="font-mono text-[10px] text-slate-400 block">{r.admissionNumber}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: t('Maturity / Due Date'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-300 whitespace-nowrap">
          {row.original.dueDate}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: `${t('Tranche Amount')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-white whitespace-nowrap">
          ${fmt(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalance',
      header: `${t('Outstanding')} ($)`,
      cell: ({ row }) => (
        <span className={`font-mono text-xs font-black whitespace-nowrap ${row.original.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          ${fmt(row.original.remainingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('Settlement Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <Link
          href={`/finance/billing/payments?invoiceNumber=${row.original.invoiceNumber}`}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-all border border-emerald-500/20"
        >
          <span>{t('Collect')}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ], [locale]);

  const clearFilters = () => { setStatusFilter('all'); setQuery(''); };

  return (
    <EnterpriseModuleShell
      title={t('Tuition Installment Plans & Deferred Schedules')}
      description={t('Structured 4-quarter and custom deferred tuition schedules. Automated maturity tracking with direct cashier collection workflows.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing & Invoicing') }, { label: t('Installments') }]}
      icon={<Percent className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredInstallments.length}
      recordLabel={t('Payment Milestones')}
      activeFilterCount={statusFilter !== 'all' ? 1 : 0}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 shadow-sm"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>{t('View Invoices')}</span>
          </Link>
          <Link
            href="/finance/billing/payments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all"
          >
            <DollarSign className="w-4 h-4 stroke-[3]" />
            <span>{t('Collect Payment')}</span>
          </Link>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('Fee Structures')}</span>
        </Link>
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('Invoices')}</span>
        </Link>
        <Link href="/finance/billing/installments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
          <span>{t('Installment Plans')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Payments & Receipts')}</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
          <span>{t('Account Statements')}</span>
        </Link>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {['all', 'pending_payment', 'partially_paid', 'paid', 'overdue'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st === 'all' ? t('All Milestones') : t(st)}
          </button>
        ))}
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search by invoice, student name, or admission number...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success(t('Installment plans refreshed.')); }}
        activeFilterCount={statusFilter !== 'all' ? 1 : 0}
        onResetFilters={clearFilters}
        createButtonLabel={t('+ Create Invoice Plan')}
        onCreate={() => toast.info(t('Generate new installment plans via Invoices > Create Invoice.'))}
      />

      <EnterpriseDataGrid
        data={filteredInstallments}
        columns={columns}
        isLoading={loading}
        density={density}
        emptyStateProps={{
          title: t('No Installment Plans Found'),
          description: t('No payment plan tranches match your active search or filter parameters.'),
          isFilterActive: statusFilter !== 'all' || query.length > 0,
          onResetFilters: clearFilters,
          createLabel: t('Generate Student Invoice'),
          onCreate: () => {},
        }}
      />
    </EnterpriseModuleShell>
  );
}
