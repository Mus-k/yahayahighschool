/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, Building2,
  AlertCircle, ArrowRight, Check, X, Eye, Filter, RefreshCw,
  Coins, ArrowLeftRight, Layers, PieChart, FileText
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { DepartmentBudget, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BudgetApprovalsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<DepartmentBudget | null>(null);

  // Role-Based Authorization & Segregation of Duties
  const userRole = (role || user?.role?.type || '').toLowerCase();
  const isAccountantOnly = userRole === 'accountant';
  const canApprove = !isAccountantOnly; // Account Lead, Admin, Director, Super Admin

  // ── Currency Converter Helper ──────────────────────────────────────────────
  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === 'USD') return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return found?.symbol || (selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'TRY' ? '₺' : selectedCurrency === 'XOF' ? 'CFA' : selectedCurrency === 'GNF' ? 'FG' : selectedCurrency === 'GBP' ? '£' : selectedCurrency === 'SAR' ? '﷼' : selectedCurrency);
  }, [currencies, selectedCurrency]);

  const formatMoney = useCallback((amountUSD: number) => {
    const converted = Number(amountUSD || 0) * activeCurrencyRate;
    return `${activeCurrencySymbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [activeCurrencyRate, activeCurrencySymbol]);

  const handleCurrencyChange = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yahaya_selected_currency', newCurr);
      localStorage.setItem('selected_currency', newCurr);
      window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: newCurr }));
    }
    toast.info(`${t('Budget queue converted to')} ${newCurr}`);
  };

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetData, currs, settings] = await Promise.all([
        financeService.getBudgets().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);
      setBudgets(budgetData || []);
      setCurrencies(currs || []);

      let active = 'USD';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency') || localStorage.getItem('yahaya_default_currency');
        if (saved) active = saved;
        else if (settings?.defaultCurrency) active = settings.defaultCurrency;
      } else if (settings?.defaultCurrency) {
        active = settings.defaultCurrency;
      }
      setSelectedCurrency(active);
      setBaseCurrency(settings?.defaultCurrency || 'USD');
    } catch {
      toast.error(t('Failed to load budget approvals queue.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBudgets();

    const onCurrencyChange = (e: any) => {
      if (e.detail) setSelectedCurrency(e.detail);
    };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    return () => {
      window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
    };
  }, [fetchBudgets]);

  const handleAction = async (b: DepartmentBudget, nextStatus: string) => {
    if (!canApprove && (nextStatus === 'approved' || nextStatus === 'on_track')) {
      toast.error(t('Accountants cannot approve budgets. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const targetId = (b as any).documentId || b.id;
    try {
      await financeService.updateDepartmentalBudget(targetId, { status: nextStatus as any });
      toast.success(`${t('Budget for')} ${b.departmentName} ${t('status updated to')} [${nextStatus.toUpperCase()}].`);
      fetchBudgets();
    } catch {
      toast.error(t('Failed to update budget status'));
    }
  };

  const handleBatchApprove = async () => {
    if (!canApprove) {
      toast.error(t('Accountants cannot approve budgets. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const pending = budgets.filter(b => b.status === 'draft' || b.status === 'submitted' || b.status === 'pending_approval');
    if (pending.length === 0) {
      toast.info(t('No pending budget allocations to approve.'));
      return;
    }

    try {
      await Promise.all(
        pending.map(b => {
          const targetId = (b as any).documentId || b.id;
          return financeService.updateDepartmentalBudget(targetId, { status: 'on_track' as any });
        })
      );
      toast.success(`${t('Batch approved')} ${pending.length} ${t('departmental budget allocations!')}`);
      fetchBudgets();
    } catch {
      toast.error(t('Failed to batch approve budgets.'));
    }
  };

  const pendingBudgets = useMemo(() =>
    budgets.filter(b => b.status === 'draft' || b.status === 'submitted' || b.status === 'pending_approval'),
    [budgets]
  );
  const pendingAmount = useMemo(() =>
    pendingBudgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0),
    [pendingBudgets]
  );
  const totalAllocated = useMemo(() =>
    budgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0),
    [budgets]
  );

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_allocations',
      title: t('Pending Budget Authorizations'),
      value: `${pendingBudgets.length} ${t('Budgets')}`,
      subtitle: `${t('Queued Allocation')}: ${formatMoney(pendingAmount)}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_budgets',
      title: t('Active Approved Cost Centers'),
      value: `${budgets.filter(b => b.status === 'on_track' || b.status === 'approved').length} ${t('Approved')}`,
      subtitle: `${t('Total Master Budget')}: ${formatMoney(totalAllocated)}`,
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'warning_centers',
      title: t('High Utilization / Exceeded'),
      value: `${budgets.filter(b => b.status === 'warning' || b.status === 'exceeded').length} ${t('Watchlist')}`,
      subtitle: t('Requires reallocation or spending freeze'),
      trendDirection: 'down',
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />
    }
  ];

  const columns: ColumnDef<DepartmentBudget, any>[] = [
    {
      accessorKey: 'code',
      header: t('Cost Center & Title'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-sky-400 block">{row.original.code}</span>
          <span className="font-bold text-white text-xs block">{row.original.departmentName}</span>
          <span className="text-[11px] text-slate-400 font-medium block">{row.original.budgetTitle}</span>
        </div>
      )
    },
    {
      accessorKey: 'headOfDepartment',
      header: t('Head of Department'),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-200 block">
            {typeof row.original.headOfDepartment === 'string' ? row.original.headOfDepartment : (row.original.headOfDepartment?.name || 'Department Lead')}
          </span>
          <span className="text-slate-500 text-[11px] font-mono">{row.original.academicYearCode || '2026-2027'}</span>
        </div>
      )
    },
    {
      accessorKey: 'allocatedAmount',
      header: `${t('Allocated Limit')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          {formatMoney(Number(row.original.allocatedAmount || 0))}
        </span>
      )
    },
    {
      accessorKey: 'utilizationPercentage',
      header: t('Current Utilization'),
      cell: ({ row }) => {
        const util = Number(row.original.utilizationPercentage || 0);
        return (
          <div className="space-y-1.5 min-w-[120px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white">{util}%</span>
              <span className="text-slate-400">{formatMoney(Number(row.original.spentAmount || 0))}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${util > 90 ? 'bg-rose-500' : util > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Authorization Stage'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Workflow Actions'),
      cell: ({ row }) => {
        const b = row.original;
        const isPending = b.status === 'draft' || b.status === 'submitted' || b.status === 'pending_approval';

        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {isPending && !canApprove && (
              <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-[10px] font-bold">
                {t('Awaiting Lead Sign-off')}
              </span>
            )}
            {isPending && canApprove && (
              <>
                <button
                  onClick={() => handleAction(b, 'on_track')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>{t('Authorize Budget')}</span>
                </button>
                <button
                  onClick={() => handleAction(b, 'rejected')}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                  title={t('Reject Request')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {!isPending && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{t('Authorized')}</span>
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Executive Departmental Budget Authorization Queue')}
      description={t('Executive supervision and certified sign-off on academic, operational, and facility cost center allocations and fund reallocations.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Departmental Budgets'), href: '/finance/budget' }, { label: t('Approvals') }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-400" />}
      recordCount={budgets.length}
      recordLabel={t('Cost Centers')}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Multi-Currency Dropdown Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
            <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">{t('Currency')}:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer font-mono"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode} className="bg-slate-900 text-white">
                    {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? `• ${t('Base')}` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
                  <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
                  <option value="TRY" className="bg-slate-900 text-white">TRY (₺)</option>
                  <option value="XOF" className="bg-slate-900 text-white">XOF (CFA)</option>
                  <option value="GNF" className="bg-slate-900 text-white">GNF (FG)</option>
                  <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
                  <option value="SAR" className="bg-slate-900 text-white">SAR (﷼)</option>
                </>
              )}
            </select>
          </div>

          <Link
            href="/finance/budget"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            ← {t('Back to Budget Allocations')}
          </Link>

          {canApprove && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('Batch Authorize Pending')}</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Segregation of Duties Notice for Accountant */}
      {isAccountantOnly && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{t('Segregation of Duties Policy')}:</strong> {t('Accountants can review and prepare budget allocations. Final authorization requires Account Lead, Director, or Super Admin digital signature.')}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700 uppercase">
            {t('Read-Only Mode')}
          </span>
        </div>
      )}

      <EnterpriseDataGrid
        data={budgets}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Budget Allocations Awaiting Approval'),
          description: t('All departmental and section cost center limits are authorized and active.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
