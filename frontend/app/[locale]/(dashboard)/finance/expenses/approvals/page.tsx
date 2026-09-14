/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, ArrowLeft, RefreshCw, Check,
  AlertCircle, DollarSign, Coins, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ExpenseRequest, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ExpenseApprovalsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
    toast.info(`${t('Expense queue converted to')} ${newCurr}`);
  };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [data, currs, settings] = await Promise.all([
        financeService.getExpenseRequests().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);
      setExpenses(data || []);
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
      toast.error(t('Failed to load expense approvals queue.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchExpenses();

    const onCurrencyChange = (e: any) => {
      if (e.detail) setSelectedCurrency(e.detail);
    };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    return () => {
      window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
    };
  }, [fetchExpenses]);

  const handleAction = async (e: ExpenseRequest, nextStatus: 'reviewed' | 'approved' | 'paid' | 'rejected') => {
    if (!canApprove && nextStatus === 'approved') {
      toast.error(t('Accountants cannot approve expenses. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const targetId = e.documentId || e.id;
    try {
      if (targetId) {
        await financeService.updateExpenseStatus(String(targetId), nextStatus);
      }
      e.status = nextStatus as any;
      setExpenses([...expenses]);
      toast.success(`${t('Expense')} ${e.voucherNumber || 'Voucher'} ${t('status updated to')} [${nextStatus.toUpperCase()}].`);
      fetchExpenses();
    } catch {
      toast.error(t('Failed to update expense status'));
    }
  };

  const handleBatchApprove = async () => {
    if (!canApprove) {
      toast.error(t('Accountants cannot approve expenses. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed');
    if (pending.length === 0) {
      toast.info(t('No pending claims to approve.'));
      return;
    }

    try {
      await Promise.all(pending.map(e => {
        const targetId = e.documentId || e.id;
        return targetId ? financeService.updateExpenseStatus(String(targetId), 'approved') : Promise.resolve(null);
      }));
      pending.forEach(e => { e.status = 'approved'; });
      setExpenses([...expenses]);
      toast.success(`${t('Batch approved')} ${pending.length} ${t('expense claims!')}`);
      fetchExpenses();
    } catch {
      toast.error(t('Failed to batch approve expenses'));
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length;
  const pendingAmount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_claims',
      title: t('Pending Expense Authorization'),
      value: `${pendingCount} ${t('Vouchers')}`,
      subtitle: `${t('Total Claim Queue')}: ${formatMoney(pendingAmount)}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'approved_ready',
      title: t('Approved Claims for Payout'),
      value: `${expenses.filter(e => e.status === 'approved').length} ${t('Ready')}`,
      subtitle: t('Cleared by Account Lead & Director'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'reimbursed',
      title: t('Disbursed Vendor Payments'),
      value: `${expenses.filter(e => e.status === 'paid' || e.status === 'closed').length} ${t('Disbursed')}`,
      subtitle: t('Bank & mobile settlements complete'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns: ColumnDef<ExpenseRequest, any>[] = [
    {
      accessorKey: 'voucherNumber',
      header: t('Voucher # & Title'),
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: t('Category & Department'),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t(row.original.category)}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: t('Payee & Requested By'),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">{row.original.vendorName}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.requestedBy}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: `${t('Claim Amount')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 block">
          {formatMoney(Number(row.original.amount) || 0)}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Current Stage'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Workflow Actions'),
      cell: ({ row }) => {
        const e = row.original;
        const isPending = e.status === 'submitted' || e.status === 'reviewed';

        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {e.status === 'submitted' && (
              <button
                onClick={() => handleAction(e, 'reviewed')}
                className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
              >
                {t('Mark Reviewed')}
              </button>
            )}

            {/* Approval is restricted to Account Lead / Director / Admin */}
            {isPending && !canApprove && (
              <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-[10px] font-bold">
                {t('Awaiting Lead Sign-off')}
              </span>
            )}
            {isPending && canApprove && (
              <button
                onClick={() => handleAction(e, 'approved')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('Approve Claim')}</span>
              </button>
            )}

            {e.status === 'approved' && (
              <button
                onClick={() => handleAction(e, 'paid')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t('Disburse Payment')}</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Multi-Stage Expense Authorization & Payment Queue')}
      description={t('Executive authorization queue for operational expenses, utility disbursements, and procurement claims before treasury settlement.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Operating Expenses'), href: '/finance/expenses' }, { label: t('Approvals') }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={expenses.length}
      recordLabel={t('Claims')}
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
            href="/finance/expenses"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Back to Expenses')}</span>
          </Link>

          {canApprove && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('Batch Approve All Pending')}</span>
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
              <strong>{t('Segregation of Duties Policy')}:</strong> {t('Accountants can review and disburse certified expense vouchers. Final claim approval requires Account Lead, Director, or Super Admin authorization signature.')}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700 uppercase">
            {t('Preparer Mode')}
          </span>
        </div>
      )}

      <EnterpriseDataGrid
        data={expenses}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Expenses Awaiting Approval'),
          description: t('All operational expense requisitions have been processed and authorized.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
