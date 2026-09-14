/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, HeartHandshake, Receipt, Wallet, ArrowRight,
  Plus, Eye, AlertTriangle, Clock, Shield, FileText, CreditCard,
  Landmark, Scale, ScrollText, BarChart3, RefreshCw, Globe, FolderOpen
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { ExecutiveFinanceStats, MultiCurrencyRate } from '@/types/finance.types';
import type { AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function FinanceOverviewPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [stats, setStats] = useState<ExecutiveFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Reconciliation state
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [reconciliationDetails, setReconciliationDetails] = useState<any>(null);

  // 1. Fetch Academic Years
  useEffect(() => {
    erpService.getAcademicYears().then(years => {
      if (years && years.length > 0) {
        setAcademicYears(years);
        const currentYear = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (currentYear?.name) {
          setAcademicYear(currentYear.name);
        }
      }
    }).catch(() => {
      // Fallback
    });
  }, []);

  // 2. Fetch Currency Settings & Exchange Rates
  useEffect(() => {
    const initCurrency = async () => {
      try {
        const [settingsData, ratesData] = await Promise.all([
          financeService.getSettings(),
          financeService.getExchangeRates()
        ]);
        if (ratesData && ratesData.length > 0) {
          setCurrencies(ratesData);
        }
        let initialCurr = 'USD';
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency') || localStorage.getItem('yahaya_default_currency');
          if (saved) initialCurr = saved;
          else if (settingsData?.defaultCurrency) initialCurr = settingsData.defaultCurrency;
        } else if (settingsData?.defaultCurrency) {
          initialCurr = settingsData.defaultCurrency;
        }
        setSelectedCurrency(initialCurr);
        setBaseCurrency(settingsData?.defaultCurrency || 'USD');
      } catch {}
    };
    initCurrency();

    const onCurrencyChange = (e: any) => {
      const newCurr = e.detail;
      if (newCurr) {
        setSelectedCurrency(newCurr);
      }
    };
    const onSettingsUpdate = (e: any) => {
      if (e.detail?.defaultCurrency) {
        setSelectedCurrency(e.detail.defaultCurrency);
        setBaseCurrency(e.detail.defaultCurrency);
      }
    };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    window.addEventListener('finance_settings_updated', onSettingsUpdate);
    return () => {
      window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
      window.removeEventListener('finance_settings_updated', onSettingsUpdate);
    };
  }, []);

  // ── Currency Converter Helper ──────────────────────────────────────────────
  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === 'USD') return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return found?.symbol || (selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'TRY' ? '₺' : selectedCurrency === 'XOF' ? 'CFA' : selectedCurrency === 'GBP' ? '£' : selectedCurrency);
  }, [currencies, selectedCurrency]);

  const formatMoney = useCallback((amountUSD: number) => {
    const converted = Number(amountUSD || 0) * activeCurrencyRate;
    return `${activeCurrencySymbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [activeCurrencyRate, activeCurrencySymbol]);

  // 3. Fetch Executive Stats
  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExecutiveStats(academicYear);
      setStats(data);
    } catch {
      toast.error(t('Failed to load executive finance statistics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [academicYear]);

  // 4. Ledger Reconciliation Sanity Check
  useEffect(() => {
    Promise.all([
      financeService.getInvoices(),
      financeService.getReceipts()
    ]).then(([allInvoices, allReceipts]) => {
      const sumInvoiced = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      const sumPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
      const sumRemaining = allInvoices.reduce((sum, inv) => sum + Number(inv.remainingBalance || 0), 0);
      const sumReceiptsAllocated = allReceipts.reduce((sum, rec) => sum + Number(rec.invoiceAllocation || rec.paymentAmount || rec.amount || 0), 0);
      const hasNegativeInvoice = allInvoices.some(inv => Number(inv.remainingBalance || 0) < -0.01 || Number(inv.paidAmount || 0) < -0.01);
      const invoiceMismatch = Math.abs(sumInvoiced - (sumPaid + sumRemaining)) > 0.01;

      if (invoiceMismatch || hasNegativeInvoice) {
        setReconciliationError(t('Finance Integrity Warning'));
        setReconciliationDetails({
          sumInvoiced,
          sumPaid,
          sumRemaining,
          sumReceipts: sumReceiptsAllocated,
          hasNegativeInvoice,
          invoiceMismatch,
          receiptMismatch: false
        });
      } else {
        setReconciliationError(null);
        setReconciliationDetails(null);
      }
    }).catch(err => {
      console.warn('Reconciliation check note:', err);
    });
  }, [stats]);

  const transactions = useMemo(() => {
    if (!stats) return [];
    return stats.recentTransactions.filter(tx => {
      const matchQuery = !query ||
        tx.title.toLowerCase().includes(query.toLowerCase()) ||
        tx.documentNumber.toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === 'all' || tx.type === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [stats, query, categoryFilter]);

  const activeFiltersCount = categoryFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setQuery('');
    toast.success(t('Filters reset'));
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: 'revenue',
        title: t('Tuition & Fee Revenue (YTD)'),
        value: formatMoney(stats.kpi.totalRevenueYTD),
        subtitle: `${t('Collection rate')}: ${stats.kpi.feeCollectionRate}% (${stats.kpi.activeStudentsCount} ${t('active scholars')})`,
        trendDirection: 'up',
        icon: <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        isActive: categoryFilter === 'Tuition Receipt',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Tuition Receipt' ? 'all' : 'Tuition Receipt');
        },
        badgeText: `${academicYear} • ${selectedCurrency}`
      },
      {
        id: 'outstanding',
        title: t('Outstanding Student Fees'),
        value: formatMoney(stats.kpi.outstandingFees),
        subtitle: `${stats.kpi.pendingInvoicesCount} ${t('invoices pending settlement')}`,
        trendDirection: stats.kpi.outstandingFees > 0 ? 'down' : 'neutral',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        onClick: () => toast.info(t('View detailed student accounts receivable in Billing Suite.'))
      },
      {
        id: 'expenses',
        title: t('Operating Expenses (YTD)'),
        value: formatMoney(stats.kpi.monthlyExpenses),
        subtitle: `${stats.kpi.pendingApprovalsCount} ${t('requisitions awaiting review')}`,
        trendDirection: 'neutral',
        icon: <Receipt className="w-5 h-5 text-rose-500" />,
        isActive: categoryFilter === 'Expense Disbursement',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Expense Disbursement' ? 'all' : 'Expense Disbursement');
        }
      },
      {
        id: 'payroll',
        title: t('Monthly Staff Payroll'),
        value: formatMoney(stats.kpi.payrollThisMonth),
        subtitle: `${t('Faculty & administrative compensation')}`,
        trendDirection: 'neutral',
        icon: <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        isActive: categoryFilter === 'Payroll Payment',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Payroll Payment' ? 'all' : 'Payroll Payment');
        }
      }
    ];
  }, [stats, categoryFilter, academicYear, selectedCurrency, locale, formatMoney]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'documentNumber',
      header: t('Document & Title'),
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{tx.documentNumber}</span>
            <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
              {tx.title}
            </p>
          </div>
        );
      }
    },
    {
      accessorKey: 'type',
      header: t('Category'),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold">
          {row.original.type === 'Tuition Receipt' && <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          {row.original.type === 'Expense Disbursement' && <Receipt className="w-3.5 h-3.5 text-rose-500" />}
          {row.original.type === 'Payroll Payment' && <Wallet className="w-3.5 h-3.5 text-amber-500" />}
          {row.original.type === 'Waqf Donation' && <HeartHandshake className="w-3.5 h-3.5 text-sky-500" />}
          {t(row.original.type)}
        </span>
      )
    },
    {
      accessorKey: 'date',
      header: t('Posting Date'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold block">{row.original.date}</span>
      )
    },
    {
      accessorKey: 'amount',
      header: `${t('Amount')} (${selectedCurrency})`,
      cell: ({ row }) => {
        const tx = row.original;
        const isIncome = tx.amount > 0;
        return (
          <span className={`font-mono text-xs sm:text-sm font-extrabold ${
            isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {isIncome ? '+' : ''}{formatMoney(Math.abs(tx.amount))}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={String(row.original.status).toLowerCase()} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRow(row.original);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('Inspect')}</span>
        </button>
      )
    }
  ], [selectedCurrency, locale, formatMoney]);

  return (
    <EnterpriseModuleShell
      title={t('Executive Finance & Accounting ERP Dashboard')}
      description={t('SAP S/4HANA-grade financial administration with automated double-entry accounting, budget vs. actual analytics, academic year separation, and multi-method treasury control.')}
      breadcrumbs={[{ label: t('School ERP') }, { label: t('Finance Overview') }]}
      icon={<Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={transactions.length}
      recordLabel={t('Recent Vouchers')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Currency Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Currency')}:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                const newCurr = e.target.value;
                setSelectedCurrency(newCurr);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('yahaya_selected_currency', newCurr);
                  localStorage.setItem('selected_currency', newCurr);
                  window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: newCurr }));
                }
                toast.info(`${t('Display currency switched to')} ${newCurr}`);
              }}
              aria-label="Select Operating Currency"
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.currencyCode} value={c.currencyCode} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c.currencyCode} ({c.symbol}) — {c.currencyName}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">USD ($) — US Dollar</option>
                  <option value="EUR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">EUR (€) — Euro</option>
                  <option value="TRY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">TRY (₺) — Turkish Lira</option>
                  <option value="XOF" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">XOF (CFA) — CFA Franc</option>
                  <option value="GNF" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">GNF (FG) — Guinean Franc</option>
                  <option value="GBP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">GBP (£) — British Pound</option>
                  <option value="SAR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SAR (﷼) — Saudi Riyal</option>
                </>
              )}
            </select>
          </div>

          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Academic Year')}:</span>
            <select
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                toast.info(`${t('Switched financial partition to')} ${e.target.value}`);
              }}
              aria-label="Select Academic Year"
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {academicYears.length > 0 ? (
                academicYears.map(y => (
                  <option key={y.id} value={y.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {y.name} {y.isCurrent || y.recordStatus === 'active' || y.status === 'current' ? `(${t('Active Term')})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="2026-2027" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2026-2027 ({t('Active Term')})</option>
                  <option value="2025-2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2025-2026</option>
                </>
              )}
            </select>
          </div>

          <Link
            href="/finance/accounting/ledger"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs"
          >
            <FolderOpen className="w-4 h-4 text-sky-500" />
            <span>{t('General Ledger')}</span>
          </Link>
          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('+ Create Invoice')}</span>
          </Link>
          <Link
            href="/finance/accounting/journals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs"
          >
            <ScrollText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('+ Post Journal')}</span>
          </Link>
        </div>
      }
    >
      {/* Finance Integrity Warning Alert */}
      {reconciliationError && reconciliationDetails && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3 mb-4 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
            <strong className="text-xs font-bold uppercase tracking-wider">{reconciliationError}</strong>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {t('The automated financial engine has detected ledger inconsistencies in the active partition')}:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              <span>{t('Invoiced Revenue')}:</span>
              <strong className="block text-slate-900 dark:text-slate-100">{formatMoney(reconciliationDetails.sumInvoiced)}</strong>
            </div>
            <div>
              <span>{t('Paid + Outstanding')}:</span>
              <strong className="block text-slate-900 dark:text-slate-100">{formatMoney(reconciliationDetails.sumPaid + reconciliationDetails.sumRemaining)}</strong>
            </div>
            <div>
              <span>{t('Total Receipts')}:</span>
              <strong className="block text-slate-900 dark:text-slate-100">{formatMoney(reconciliationDetails.sumReceipts)}</strong>
            </div>
            <div>
              <span>{t('Status')}:</span>
              <strong className={`block ${reconciliationDetails.invoiceMismatch || reconciliationDetails.receiptMismatch ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                {reconciliationDetails.invoiceMismatch ? t('Invoice Sum Mismatch') : reconciliationDetails.receiptMismatch ? t('Receipt Ledger Drift') : t('Balanced')}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Clickable KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Treasury Insights & Runway Panel */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('Multi-Currency Bank & Cash Treasury')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('Real-time balances across commercial banks, mobile money wallets, and petty cash')}</p>
                </div>
              </div>
              <Link href="/finance/accounting/accounts" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>{t('Reconcile Treasury')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/70 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{t('Commercial Bank Accounts (1010)')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-emerald-400 block">{formatMoney(stats.treasuryInsights.totalBankBalance)}</span>
                <span className="text-xs text-slate-500 mt-1 block">{t('Institutional Bank Accounts')}</span>
              </div>
              <div className="bg-slate-50/70 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{t('Mobile Money Wallets (1020)')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-sky-400 block">{formatMoney(stats.treasuryInsights.totalMobileMoney)}</span>
                <span className="text-xs text-slate-500 mt-1 block">{t('Orange Money & MTN Merchant Wallets')}</span>
              </div>
              <div className="bg-slate-50/70 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{t('Campus Cash Drawer (1030)')}</span>
                <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-amber-400 block">{formatMoney(stats.treasuryInsights.totalCashInDrawer)}</span>
                <span className="text-xs text-slate-500 mt-1 block">{t('Cashier Petty Cash Drawer')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>{t('Treasury Health')}</span>
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">{t('Estimated Runway')}</h4>
              <p className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-1">{stats.treasuryInsights.estimatedRunwayMonths} {t('Months')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('Based on current monthly payroll and operating expense burn rate of')} {formatMoney(stats.kpi.monthlyExpenses)}/mo.</p>
            </div>
            <Link
              href="/finance/budget"
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition-all shadow-xs block"
            >
              {t('Inspect Department Budgets →')}
            </Link>
          </div>
        </div>
      )}

      {/* Quick Domain Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/finance/accounting/chart" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('Chart of Accounts')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Assets, Liabilities, & Equity')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>

        <Link href="/finance/billing/invoices" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('Student Invoices')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Fee billing & installment plans')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </Link>

        <Link href="/finance/billing/payments" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('Cashier & Payments')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Receipts, POS, & Orange Money')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link href="/finance/accounting/journals" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('Double-Entry Journals')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Debits == Credits compliance')}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
        </Link>
      </div>

      {/* Budget vs Actual Variance Table */}
      {stats && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('Department Budget vs. Actual Utilization')} ({academicYear})</h3>
            </div>
            <Link href="/finance/budget" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('Full Budget Console →')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.charts.budgetVsActualDepartment.map((b, idx) => {
              const percentage = b.allocated > 0 ? Math.min(100, Math.round((b.spent / b.allocated) * 100)) : 0;
              const isWarning = percentage > 85;
              return (
                <div key={idx} className="bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[180px]">{t(b.department)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {percentage}% {t('Used')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>{t('Spent')}: <strong className="text-slate-900 dark:text-white">{formatMoney(b.spent)}</strong></span>
                    <span>{t('Allocated')}: <strong className="text-indigo-600 dark:text-indigo-400">{formatMoney(b.allocated)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search vouchers by document number (INV, RCP, EXP, PAY) or title...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadStats();
          toast.success(t('Financial ledger synchronized'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel={t('+ Post Manual Journal')}
        onCreate={() => toast.info(t('Opened Manual Double-Entry Journal wizard.'))}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter vouchers by type"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Voucher Categories')}</option>
              <option value="Tuition Receipt">{t('Tuition Receipts (RCP)')}</option>
              <option value="Expense Disbursement">{t('Expense Disbursements (EXP)')}</option>
              <option value="Payroll Payment">{t('Staff Payroll Settlements (PAY)')}</option>
              <option value="Waqf Donation">{t('Waqf Donations (DON)')}</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={transactions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        emptyStateProps={{
          title: t('No Vouchers Found'),
          description: t('No accounting entries match your search query or category filter.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: t('Create New Journal Voucher'),
          onCreate: () => toast.info(t('Opened new journal voucher modal'))
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.title,
          id: selectedRow.documentNumber,
          role: `${selectedRow.type.toUpperCase()}`,
          status: selectedRow.status,
          email: selectedRow.date,
          balance: `${formatMoney(Math.abs(selectedRow.amount))} (${selectedRow.status.toUpperCase()})`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
