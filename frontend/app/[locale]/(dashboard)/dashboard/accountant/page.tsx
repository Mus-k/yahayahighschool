/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DollarSign, Wallet, Receipt, TrendingUp, RefreshCw,
  HeartHandshake, CheckCircle2, AlertCircle, ArrowRight,
  Coins, ArrowUpRight, ArrowDownRight, Layers, FileText,
  CreditCard, Landmark, PiggyBank, Plus, Check, Clock,
  ExternalLink, BarChart3, Filter, ShieldCheck, Search, Scale,
  FolderOpen
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { Link } from '@/i18n/routing';
import { dashboardService, type AccountantDashboardData } from '@/services/dashboard.service';
import { financeService } from '@/services/finance.service';
import type { MultiCurrencyRate, Invoice, PaymentReceipt, FeeStructure, ChartOfAccount } from '@/types/finance.types';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-invoiced', title: 'Total Invoiced Revenue', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-treasury', title: 'Total Liquidity (Cash & Bank)', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-receivables', title: 'Outstanding Receivables', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-expenses', title: 'Operating Expenses & Payroll', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-statement', title: 'Certified Financial Statement Summary', layer: 'summary', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-cashflow', title: 'Monthly Cash Flow & Liquidity', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-treasury', title: 'Treasury & Account Distribution', layer: 'chart', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'table-invoices', title: 'Pending Invoices & Clearance Queue', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
  { id: 'table-receipts', title: 'Recent Payment Receipts', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-quick', title: 'Financial Command Center Quick Actions', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function AccountantDashboardPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Live Data State
  const [dashboardData, setDashboardData] = useState<AccountantDashboardData | null>(null);
  const [executiveStats, setExecutiveStats] = useState<any>(null);
  const [financialStatement, setFinancialStatement] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'structures'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');

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

  // ── Load All Live Financial Reports & Data ─────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dash,
        exec,
        statement,
        currs,
        invs,
        rcpts,
        structs,
        accts,
        exps,
        settingsData
      ] = await Promise.all([
        dashboardService.getAccountantDashboard().catch(() => null),
        financeService.getExecutiveStats('2026-2027').catch(() => null),
        financeService.generateFinancialStatement({ academicYear: '2026-2027' }).catch(() => null),
        financeService.getExchangeRates().catch(() => []),
        financeService.getInvoices().catch(() => []),
        financeService.getReceipts().catch(() => []),
        financeService.getFeeStructures().catch(() => []),
        financeService.getChartOfAccounts().catch(() => []),
        financeService.getExpenses().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);

      setDashboardData(dash);
      setExecutiveStats(exec);
      setFinancialStatement(statement);
      setCurrencies(currs || []);
      setInvoices(invs || []);
      setReceipts(rcpts || []);
      setFeeStructures(structs || []);
      setAccounts(accts || []);
      setExpenses(exps || []);

      // Resolve base and active currency from settings / local storage
      let activeCurr = 'USD';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency') || localStorage.getItem('yahaya_default_currency');
        if (saved) activeCurr = saved;
        else if (settingsData?.defaultCurrency) activeCurr = settingsData.defaultCurrency;
      } else if (settingsData?.defaultCurrency) {
        activeCurr = settingsData.defaultCurrency;
      }

      setSelectedCurrency(activeCurr);
      setBaseCurrency(settingsData?.defaultCurrency || 'USD');
    } catch {
      toast.error(t('Failed to load live accountant financial data.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();

    // Listen for currency updates across settings & executive tabs
    const onCurrencyChange = (e: any) => {
      if (e.detail) setSelectedCurrency(e.detail);
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
  }, [loadData]);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  // ── Pure Live Aggregated Calculations (Zero hardcoded numbers) ──────────────
  const totalInvoicedUSD = useMemo(() => {
    const sumFromInvoices = invoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0);
    if (sumFromInvoices > 0) return sumFromInvoices;
    if (executiveStats?.kpi?.totalRevenueYTD || executiveStats?.kpi?.outstandingFees) {
      return Number(executiveStats.kpi.totalRevenueYTD || 0) + Number(executiveStats.kpi.outstandingFees || 0);
    }
    return Number(financialStatement?.balances?.['4010'] || 0) + Number(financialStatement?.balances?.['1100'] || 0);
  }, [invoices, executiveStats, financialStatement]);

  const collectedRevenueUSD = useMemo(() => {
    const sumReceipts = receipts.reduce((s, r) => s + Number(r.paymentAmount || r.amount || 0), 0);
    if (sumReceipts > 0) return sumReceipts;
    if (executiveStats?.kpi?.totalRevenueYTD) return Number(executiveStats.kpi.totalRevenueYTD);
    return Number(financialStatement?.totalRevenue || 0);
  }, [receipts, executiveStats, financialStatement]);

  const outstandingReceivablesUSD = useMemo(() => {
    const sumFromInvoices = invoices.reduce((s, inv) => {
      const st = (inv.status || '').toLowerCase();
      if (st !== 'paid' && st !== 'cancelled' && st !== 'voided') {
        return s + Number(inv.remainingBalance ?? (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)));
      }
      return s;
    }, 0);
    if (sumFromInvoices > 0) return sumFromInvoices;
    if (executiveStats?.kpi?.outstandingFees) return Number(executiveStats.kpi.outstandingFees);
    return Number(financialStatement?.balances?.['1100'] || 0);
  }, [invoices, executiveStats, financialStatement]);

  const collectionRate = useMemo(() => {
    const total = totalInvoicedUSD > 0 ? totalInvoicedUSD : (collectedRevenueUSD + outstandingReceivablesUSD);
    if (total <= 0) return 100;
    return Number(((collectedRevenueUSD / total) * 100).toFixed(1));
  }, [collectedRevenueUSD, totalInvoicedUSD, outstandingReceivablesUSD]);

  const totalTreasuryBalanceUSD = useMemo(() => {
    if (executiveStats?.treasuryInsights) {
      const t = executiveStats.treasuryInsights;
      return Number(t.totalBankBalance || 0) + Number(t.totalMobileMoney || 0) + Number(t.totalCashInDrawer || 0) + Number(t.totalChequeInClearing || 0);
    }
    if (financialStatement?.balances) {
      const b = financialStatement.balances;
      return Number(b['1010'] || 0) + Number(b['1020'] || 0) + Number(b['1030'] || 0) + Number(b['1040'] || 0);
    }
    return accounts
      .filter(a => a.accountType === 'Asset' && (a.accountCode?.startsWith('10') || a.accountName?.toLowerCase().includes('cash') || a.accountName?.toLowerCase().includes('bank')))
      .reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);
  }, [executiveStats, financialStatement, accounts]);

  const monthlyExpensesUSD = useMemo(() => {
    if (executiveStats?.kpi?.monthlyExpenses !== undefined || executiveStats?.kpi?.payrollThisMonth !== undefined) {
      return Number(executiveStats.kpi.monthlyExpenses || 0) + Number(executiveStats.kpi.payrollThisMonth || 0);
    }
    if (financialStatement?.totalExpenses) return Number(financialStatement.totalExpenses);
    return expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [executiveStats, financialStatement, expenses]);

  // ── Live Monthly Cashflow Series (Zero Hardcoding) ───────────────────────────
  const cashflowChartData = useMemo(() => {
    if (executiveStats?.charts?.revenueVsExpenseMonthly && executiveStats.charts.revenueVsExpenseMonthly.length > 0) {
      return executiveStats.charts.revenueVsExpenseMonthly.map((m: any) => ({
        month: m.month,
        inflow: Math.round(Number(m.revenue || 0) * activeCurrencyRate),
        outflow: Math.round(Number(m.expense || 0) * activeCurrencyRate)
      }));
    }

    const monthNames = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyMap: Record<string, { inflow: number; outflow: number }> = {};
    monthNames.forEach(m => { monthlyMap[m] = { inflow: 0, outflow: 0 }; });

    receipts.forEach((r: any) => {
      const dateStr = r.paymentDate || r.createdAt;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          const m = d.toLocaleString('en-US', { month: 'short' });
          if (monthlyMap[m]) {
            monthlyMap[m].inflow += Number(r.paymentAmount || r.amount || 0);
          }
        } catch {}
      }
    });

    expenses.forEach((e: any) => {
      const dateStr = e.createdAt || e.date;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          const m = d.toLocaleString('en-US', { month: 'short' });
          if (monthlyMap[m]) {
            monthlyMap[m].outflow += Number(e.amount || 0);
          }
        } catch {}
      }
    });

    return monthNames.map(m => ({
      month: m,
      inflow: Math.round(monthlyMap[m].inflow * activeCurrencyRate),
      outflow: Math.round(monthlyMap[m].outflow * activeCurrencyRate)
    }));
  }, [executiveStats, receipts, expenses, activeCurrencyRate]);

  // ── Live Treasury Breakdown by Account (From General Ledger & Reports) ───────
  const treasuryBreakdown = useMemo(() => {
    if (accounts.length > 0) {
      const liquidAccounts = accounts.filter(a =>
        a.accountCode?.startsWith('10') ||
        a.accountType === 'Asset' ||
        a.accountName.toLowerCase().includes('bank') ||
        a.accountName.toLowerCase().includes('cash') ||
        a.accountName.toLowerCase().includes('money')
      );
      if (liquidAccounts.length > 0) {
        return liquidAccounts.slice(0, 4).map(a => ({
          name: a.accountName,
          code: a.accountCode,
          balance: Number(a.currentBalance || 0),
          category: a.accountType || 'Asset Vault'
        }));
      }
    }

    if (executiveStats?.treasuryInsights) {
      const t = executiveStats.treasuryInsights;
      return [
        { name: 'Commercial Operating Bank Accounts', code: 'ACC-1010', balance: Number(t.totalBankBalance || 0), category: 'Commercial Banking' },
        { name: 'Mobile Money Gateway (Orange & MTN)', code: 'ACC-1020', balance: Number(t.totalMobileMoney || 0), category: 'Digital Wallets' },
        { name: 'Campus Cash Drawer & Vault', code: 'ACC-1030', balance: Number(t.totalCashInDrawer || 0), category: 'Cashier Safe' },
        { name: 'Undeposited Cheques in Clearing', code: 'ACC-1040', balance: Number(t.totalChequeInClearing || 0), category: 'Cheques Clearing' }
      ];
    }

    return [];
  }, [accounts, executiveStats]);

  // Filtered Tables
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchTerm.toLowerCase();
      const match = !q || (inv.studentName || '').toLowerCase().includes(q) || (inv.invoiceNumber || '').toLowerCase().includes(q);
      return match;
    }).slice(0, 8);
  }, [invoices, searchTerm]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rc => {
      const q = searchTerm.toLowerCase();
      const match = !q || (rc.studentName || '').toLowerCase().includes(q) || (rc.receiptNumber || '').toLowerCase().includes(q);
      return match;
    }).slice(0, 8);
  }, [receipts, searchTerm]);

  const pendingInvoicesCount = useMemo(() => invoices.filter(i => (i.status || '').toLowerCase() !== 'paid').length, [invoices]);

  const handleCurrencyChange = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yahaya_selected_currency', newCurr);
      localStorage.setItem('selected_currency', newCurr);
      window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: newCurr }));
    }
    toast.info(`${t('Display currency switched to')} ${newCurr}`);
  };

  return (
    <PageContainer>
      {/* ── Multi-Currency Command Bar & Page Header ── */}
      <PageHeader
        title={t('Enterprise Accountant Command Center')}
        description={t('Multi-currency ledger, institutional fee collections, treasury liquidity, and financial reconciliation.')}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Currency Dropdown Selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-sm">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Display Currency')}:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-1 font-mono"
              aria-label="Select Active Display Currency"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode} className="bg-slate-900 text-white">
                    {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? `• ${t('Base')}` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD" className="bg-slate-900 text-white">USD ($) • US Dollar</option>
                  <option value="EUR" className="bg-slate-900 text-white">EUR (€) • Euro</option>
                  <option value="TRY" className="bg-slate-900 text-white">TRY (₺) • Turkish Lira</option>
                  <option value="XOF" className="bg-slate-900 text-white">XOF (CFA) • CFA Franc</option>
                  <option value="GNF" className="bg-slate-900 text-white">GNF (FG) • Guinean Franc</option>
                  <option value="GBP" className="bg-slate-900 text-white">GBP (£) • British Pound</option>
                  <option value="SAR" className="bg-slate-900 text-white">SAR (﷼) • Saudi Riyal</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-emerald-400', isLoading && 'animate-spin')} />
            <span>{t('Refresh Live Data')}</span>
          </button>

          <DashboardWidgetCustomizer
            role="accountant"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Multi-Currency Rate Strip */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-emerald-400 font-black shrink-0">
          <GlobeIcon className="w-3.5 h-3.5" />
          <span>{t('Active FX Rates')}:</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-300 font-mono flex-wrap">
          {currencies.map(c => {
            const code = c.currencyCode || (c as any).isoCode;
            const rate = Number(c.exchangeRateToUSD || (c as any).rate || 1);
            return (
              <span key={code} className={cn('px-2 py-0.5 rounded-lg border', code === selectedCurrency ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400')}>
                1 USD = {rate.toLocaleString('en-US', { minimumFractionDigits: 2 })} {code}
              </span>
            );
          })}
          {currencies.length === 0 && (
            <span className="text-slate-400 font-sans">
              USD (1.00) • EUR (0.92) • TRY (34.20) • XOF (605.50) • GNF (8,600.00) • GBP (0.78) • SAR (3.75)
            </span>
          )}
        </div>
        <div className="ml-auto shrink-0">
          <Link href="/settings/finance/currencies" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <span>{t('Manage Currencies')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Layer 1: Financial Executive KPI Deck (Live Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-invoiced') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Invoiced Revenue')}</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(totalInvoicedUSD)}</h3>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {collectionRate}% {t('Collected')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">({formatMoney(collectedRevenueUSD)})</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
            </div>
          </div>
        )}

        {isVisible('stat-treasury') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Treasury Liquidity')}</span>
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(totalTreasuryBalanceUSD)}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{treasuryBreakdown.length} {t('Active Bank & Cash Vaults')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((totalTreasuryBalanceUSD / Math.max(monthlyExpensesUSD * 3, 1)) * 100))}%` }} />
            </div>
          </div>
        )}

        {isVisible('stat-receivables') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Outstanding Receivables')}</span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(outstandingReceivablesUSD)}</h3>
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingInvoicesCount} {t('Pending Clearance Invoices')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((outstandingReceivablesUSD / Math.max(totalInvoicedUSD, 1)) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {isVisible('stat-expenses') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Monthly Outflows')}</span>
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(monthlyExpensesUSD)}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>{expenses.length} {t('Operational & Payroll Vouchers')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((monthlyExpensesUSD / Math.max(collectedRevenueUSD, 1)) * 100))}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Certified Financial Statement Snapshot (From Live GL Engine) ── */}
      {financialStatement && isVisible('stat-statement') && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 mb-8 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {t('Certified Financial Statement & General Ledger Snapshot')} ({financialStatement.academicYear || '2026-2027'})
              </h3>
            </div>
            <Link href="/finance/reports/statements" className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1">
              <span>{t('Full P&L & Balance Sheet')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('Total Recognized Revenue')}</span>
              <span className="text-base font-black font-mono text-emerald-400">{formatMoney(Number(financialStatement.totalRevenue || 0))}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{t('Tuition, Waqf, & Auxiliary')}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('Total Recognized Expenses')}</span>
              <span className="text-base font-black font-mono text-rose-400">{formatMoney(Number(financialStatement.totalExpenses || 0))}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{t('Payroll & Operational Claims')}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('Net Operating Surplus (EBITDA)')}</span>
              <span className={cn('text-base font-black font-mono', Number(financialStatement.netSurplus || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatMoney(Number(financialStatement.netSurplus || 0))}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{t('Annual Fiscal Margin')}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('Total Certified Assets')}</span>
              <span className="text-base font-black font-mono text-sky-400">{formatMoney(Number(financialStatement.totalAssets || 0))}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{t('Cash, Bank, AR, & Property')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Layer 2: Visualizations & Charts (Live Data) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {isVisible('chart-cashflow') && (
          <ChartCard
            title={`${t('Monthly Cash Flow Dynamics')} (${selectedCurrency})`}
            subtitle={t('Inflows from tuition/donations vs Outflows from payroll/expenses')}
            data={cashflowChartData}
            type="bar"
            dataKeys={[
              { key: 'inflow', label: `${t('Inflow')} (${activeCurrencySymbol})`, color: '#10b981' },
              { key: 'outflow', label: `${t('Outflow')} (${activeCurrencySymbol})`, color: '#f43f5e' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('chart-treasury') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-black text-white">{t('Treasury Vault Distribution')}</h3>
                </div>
                <Link href="/finance/accounting/accounts" className="text-xs text-sky-400 hover:underline font-bold">
                  {t('View All')} →
                </Link>
              </div>

              <div className="space-y-3">
                {treasuryBreakdown.length > 0 ? (
                  treasuryBreakdown.map((acct, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white leading-tight">{acct.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{acct.code} • {acct.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {formatMoney(acct.balance)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">{t('No treasury vault accounts configured.')}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t('Total Liquid Assets')}:</span>
              <span className="font-mono font-black text-white text-sm">{formatMoney(totalTreasuryBalanceUSD)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Layer 3: Quick Action Hub ── */}
      {isVisible('action-quick') && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 mb-8 shadow-md">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('Accountant Quick Action Hub')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <Link
              href="/finance/billing/payments"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Record Payment')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Cashier / POS')}</span>
            </Link>

            <Link
              href="/finance/billing/structures"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Fee Structures')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Tuition Schedules')}</span>
            </Link>

            <Link
              href="/finance/billing/invoices"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Issue Invoice')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Student Billing')}</span>
            </Link>

            <Link
              href="/finance/expenses"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform mb-2">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Expense Voucher')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Disbursement')}</span>
            </Link>

            <Link
              href="/finance/accounting/ledger"
              className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 hover:border-emerald-500 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group shadow-sm"
            >
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform mb-2">
                <FolderOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('General Ledger')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Double-Entry Trail')}</span>
            </Link>

            <Link
              href="/finance/accounting/journals"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform mb-2">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Journals')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Manual Vouchers')}</span>
            </Link>

            <Link
              href="/finance/reports/statements"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform mb-2">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Financial Reports')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('P&L / Balance Sheet')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Layer 4: Interactive Clearance & Transaction Tables (Live Data) ── */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('Pending Invoices & Clearance Queue')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {pendingInvoicesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'receipts' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('Recent Payment Receipts')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {receipts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('structures')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'structures' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('Active Fee Schedules')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {feeStructures.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('Filter records by student or ID...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Invoice #')}</th>
                  <th className="pb-3 px-3">{t('Student & Grade')}</th>
                  <th className="pb-3 px-3">{t('Total Amount')}</th>
                  <th className="pb-3 px-3">{t('Paid')}</th>
                  <th className="pb-3 px-3">{t('Balance Due')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Status')}</th>
                  <th className="pb-3 px-3 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{inv.studentName || 'Student'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.academicYearId || '2026-2027'}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{formatMoney(Number(inv.totalAmount || 0))}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{formatMoney(Number(inv.paidAmount || 0))}</td>
                      <td className="py-3 px-3 font-mono font-black text-rose-400">
                        {formatMoney(Number(inv.remainingBalance ?? (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0))))}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inv.status || 'pending'} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/finance/billing/payments?studentId=${inv.studentId || ''}&invoiceId=${inv.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{t('Collect')}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {t('No pending invoices found matching your criteria.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Receipts */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Receipt #')}</th>
                  <th className="pb-3 px-3">{t('Student')}</th>
                  <th className="pb-3 px-3">{t('Method / Channel')}</th>
                  <th className="pb-3 px-3">{t('Amount Received')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Date & Time')}</th>
                  <th className="pb-3 px-3">{t('Cashier')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{rc.receiptNumber}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{rc.studentName || 'Student'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {rc.paymentMethod || 'Cash Desk'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-400">{formatMoney(Number(rc.amount || rc.paymentAmount || 0))}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {rc.paymentDate || rc.createdAt ? new Date(rc.paymentDate || rc.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{rc.cashierName || 'Accountant'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {t('No payment receipts recorded yet.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Fee Structures */}
        {activeTab === 'structures' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Fee Schedule Name')}</th>
                  <th className="pb-3 px-3">{t('Grade Code')}</th>
                  <th className="pb-3 px-3">{t('Academic Year')}</th>
                  <th className="pb-3 px-3">{t('Annual Total')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Tranche Breakdown')}</th>
                  <th className="pb-3 px-3 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {feeStructures.length > 0 ? (
                  feeStructures.map((struct) => {
                    const annual = Number(struct.totalAnnualFee || struct.totalAmount || struct.amount || 0);
                    return (
                      <tr key={struct.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{struct.title || struct.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {struct.gradeCode || 'All Grades'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">{struct.academicYearCode || '2026-2027'}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-400">{formatMoney(annual)}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          T1 (40%): {formatMoney(annual * 0.4)} • T2 (30%): {formatMoney(annual * 0.3)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href="/finance/billing/structures"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-all"
                          >
                            <Layers className="w-3 h-3" />
                            <span>{t('Manage')}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {t('No fee schedules found.')}{' '}
                      <Link href="/finance/billing/structures" className="text-emerald-400 hover:underline font-bold">
                        {t('Create first template')} →
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
