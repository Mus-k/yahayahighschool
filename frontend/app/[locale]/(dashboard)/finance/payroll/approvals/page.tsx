/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, FileText,
  Users, AlertCircle, ArrowRight, Check, X, Eye, Filter, Receipt, Building2,
  Coins, RefreshCw
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { PayrollRun, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function PayrollApprovalsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
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
    toast.info(`${t('Payroll queue converted to')} ${newCurr}`);
  };

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const [data, currs, settings] = await Promise.all([
        financeService.getPayrollRuns().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);
      setPayrolls(data || []);
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
      toast.error(t('Failed to load payroll approval queue.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPayrolls();

    const onCurrencyChange = (e: any) => {
      if (e.detail) setSelectedCurrency(e.detail);
    };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    return () => {
      window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
    };
  }, [fetchPayrolls]);

  const handleApproveBatch = async () => {
    if (!canApprove) {
      toast.error(t('Accountants cannot approve payroll. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const pending = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft');
    if (pending.length === 0) {
      toast.info(t('No pending payroll vouchers to approve.'));
      return;
    }

    try {
      await Promise.all(
        pending.map(p => {
          const targetId = (p as any).documentId || p.id;
          return financeService.updatePayrollStatus(targetId, 'approved');
        })
      );
      toast.success(`${t('Batch approved')} ${pending.length} ${t('payroll vouchers!')}`);
      fetchPayrolls();
    } catch {
      toast.error(t('Failed to approve batch payroll runs.'));
    }
  };

  const handleSingleAction = async (p: PayrollRun, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    if (!canApprove && nextStatus === 'approved') {
      toast.error(t('Accountants cannot approve payroll. Approval requires Account Lead signature (Segregation of Duties).'));
      return;
    }

    const targetId = (p as any).documentId || p.id;
    const refNum = p.payrollNumber || `PAY-2026-${String(p.id).padStart(4, '0')}`;

    try {
      if (nextStatus === 'paid') {
        await financeService.processPayrollDisbursement(targetId);
        toast.success(`${t('Payroll')} ${refNum} ${t('disbursed & posted to General Ledger!')}`);
      } else {
        await financeService.updatePayrollStatus(targetId, nextStatus);
        toast.success(`${t('Payroll voucher')} ${refNum} ${t('moved to')} [${nextStatus.toUpperCase()}].`);
      }
      fetchPayrolls();
    } catch {
      toast.error(t('Action failed'));
    }
  };

  const pendingApprovalsCount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').length;
  const pendingAmount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').reduce((s, p) => s + (Number(p.netPayable) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_approvals',
      title: t('Pending Payroll Authorization'),
      value: `${pendingApprovalsCount} ${t('Vouchers')}`,
      subtitle: `${t('Total Payout Queue')}: ${formatMoney(pendingAmount)}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_runs',
      title: t('Certified Approved Vouchers'),
      value: `${payrolls.filter(p => p.status === 'approved').length} ${t('Ready')}`,
      subtitle: t('Cleared by Account Lead & Director'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'payout_complete',
      title: t('Disbursed / Paid Status'),
      value: `${payrolls.filter(p => p.status === 'paid' || p.status === 'closed').length} ${t('Payouts')}`,
      subtitle: t('Bank wire and mobile money executed'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<PayrollRun, any>[] = [
    {
      accessorKey: 'payrollNumber',
      header: t('Payroll Ref & Employee'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-indigo-400 block">{row.original.payrollNumber || `PAY-${row.original.id}`}</span>
          <span className="font-bold text-white text-xs block">{row.original.employeeName}</span>
          <span className="text-[11px] text-slate-400 font-mono block">{row.original.roleTitle}</span>
        </div>
      )
    },
    {
      accessorKey: 'payPeriodMonth',
      header: t('Pay Period'),
      cell: ({ row }) => (
        <div className="text-xs font-mono">
          <span className="text-slate-300 block">{row.original.payPeriodMonth} {row.original.payPeriodYear}</span>
          <span className="text-slate-500 text-[11px]">{t('Gross')}: {formatMoney(Number(row.original.grossSalary) || 0)}</span>
        </div>
      )
    },
    {
      accessorKey: 'netPayable',
      header: `${t('Net Disbursable')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          {formatMoney(Number(row.original.netPayable) || 0)}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Authorization Stage'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Workflow Actions'),
      cell: ({ row }) => {
        const p = row.original;
        const isPending = p.status === 'draft' || p.status === 'submitted' || p.status === 'reviewed';

        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {/* Review Action (Accountant or Lead) */}
            {(p.status === 'draft' || p.status === 'submitted') && (
              <button
                onClick={() => handleSingleAction(p, 'reviewed')}
                className="px-2.5 py-1 rounded-xl bg-sky-950/60 text-sky-300 hover:bg-sky-900 border border-sky-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {t('Mark Reviewed')}
              </button>
            )}

            {/* Approve Action (Account Lead / Admin / Director ONLY) */}
            {isPending && !canApprove && (
              <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-[10px] font-bold">
                {t('Awaiting Lead Sign-off')}
              </span>
            )}
            {isPending && canApprove && (
              <button
                onClick={() => handleSingleAction(p, 'approved')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('Approve Voucher')}</span>
              </button>
            )}

            {/* Disburse Payment (Executed by cashier/accountant after approval) */}
            {p.status === 'approved' && (
              <button
                onClick={() => handleSingleAction(p, 'paid')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t('Disburse Net Pay')}</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Executive Payroll Approval & Disbursement Authorization Queue')}
      description={t('Two-tier governance workflow for academic faculty and staff monthly wage vouchers prior to treasury bank disbursement.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Staff Payroll'), href: '/finance/payroll' }, { label: t('Approvals') }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-400" />}
      recordCount={payrolls.length}
      recordLabel={t('Vouchers')}
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
            href="/finance/payroll"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            ← {t('Back to Payroll Runs')}
          </Link>

          {canApprove && (
            <button
              onClick={handleApproveBatch}
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
              <strong>{t('Segregation of Duties Policy')}:</strong> {t('Accountants can review and disburse certified payroll. Approval requires Account Lead, Director, or Super Admin authorization signature.')}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700 uppercase">
            {t('Preparer Mode')}
          </span>
        </div>
      )}

      <EnterpriseDataGrid
        data={payrolls}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Payroll Runs Awaiting Approval'),
          description: t('All staff payroll vouchers are approved or disbursed.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
