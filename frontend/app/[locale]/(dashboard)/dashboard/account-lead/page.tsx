/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Activity, CheckCircle2, HeartHandshake, RefreshCw, ShieldCheck,
  Wallet, DollarSign, Clock, FileText, Landmark, Scale, BarChart3,
  FolderOpen, Building2, Coins, ArrowRight, Layers, AlertTriangle,
  Receipt, ArrowUpRight, ArrowDownRight, UserCheck, Award
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { Link } from '@/i18n/routing';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services/dashboard.service';
import { financeService } from '@/services/finance.service';
import type { DepartmentBudget, ExpenseRequest, PayrollRun, MultiCurrencyRate } from '@/types/finance.types';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Layer 1 — Executive Approval & Governance KPI Cards
  { id: 'stat-payroll-approvals', title: 'Payroll Authorization Queue', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-expense-approvals', title: 'Expense Voucher Queue', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-budget-approvals', title: 'Budget Allocation Sign-Off', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-donations-lead', title: 'Waqf & Donation Funds', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },

  // Layer 2 — Quick Command Hub
  { id: 'action-governance-hub', title: 'Two-Tier Governance & Approval Hub', layer: 'action', isVisible: true, isPinned: true, size: 'large' },

  // Layer 3 — Live Analytics & Audit Logs
  { id: 'chart-budget-utilization', title: 'Department Budget vs. Actual Expenditure', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-audit-logs', title: 'Certified Financial Audit Trail', layer: 'action', isVisible: true, isPinned: false, size: 'normal' },
];

export default function AccountLeadDashboardPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  // Multi-Currency State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Live Data State
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

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
    toast.info(`${t('Account Lead portal converted to')} ${newCurr}`);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadRes, payrollRes, expenseRes, budgetRes, currs, settings] = await Promise.all([
        dashboardService.getAccountLeadDashboard().catch(() => null),
        financeService.getPayrollRuns().catch(() => []),
        financeService.getExpenseRequests().catch(() => []),
        financeService.getBudgets().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);

      setDashboardData(leadRes);
      setPayrollRuns(payrollRes || []);
      setExpenses(expenseRes || []);
      setBudgets(budgetRes || []);
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
      toast.error(t('Failed to load Account Lead live dashboard data.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();

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

  // Pending Queues Calculations
  const pendingPayrolls = useMemo(() =>
    payrollRuns.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft'),
    [payrollRuns]
  );
  const pendingPayrollTotalUSD = useMemo(() =>
    pendingPayrolls.reduce((s, p) => s + (Number(p.netPayable) || 0), 0),
    [pendingPayrolls]
  );

  const pendingExpenses = useMemo(() =>
    expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed'),
    [expenses]
  );
  const pendingExpenseTotalUSD = useMemo(() =>
    pendingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [pendingExpenses]
  );

  const pendingBudgets = useMemo(() =>
    budgets.filter(b => b.status === 'draft' || b.status === 'submitted' || b.status === 'pending_approval'),
    [budgets]
  );
  const pendingBudgetTotalUSD = useMemo(() =>
    pendingBudgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0),
    [pendingBudgets]
  );

  // Dynamic Chart Data derived from live budgets
  const budgetChartData = useMemo(() => {
    if (budgets && budgets.length > 0) {
      return budgets.slice(0, 6).map(b => ({
        department: b.departmentName || b.budgetTitle || 'Dept',
        budget: Math.round(Number(b.allocatedAmount || 0) * activeCurrencyRate),
        actual: Math.round(Number(b.spentAmount || 0) * activeCurrencyRate),
      }));
    }
    return [
      { department: 'Instruction & Academics', budget: 150000 * activeCurrencyRate, actual: 112000 * activeCurrencyRate },
      { department: 'Campus Facilities & Power', budget: 85000 * activeCurrencyRate, actual: 64000 * activeCurrencyRate },
      { department: 'IT & Digital Infrastructure', budget: 45000 * activeCurrencyRate, actual: 38000 * activeCurrencyRate },
      { department: 'Hostel & Boarding', budget: 60000 * activeCurrencyRate, actual: 52000 * activeCurrencyRate },
      { department: 'Fleet & Logistics', budget: 35000 * activeCurrencyRate, actual: 29000 * activeCurrencyRate },
    ];
  }, [budgets, activeCurrencyRate]);

  return (
    <PageContainer>
      <PageHeader
        title={t('Executive Finance Lead & Comptroller Portal')}
        description={t('Master governance cockpit for budget authorization, payroll sign-off, expense approval, and audit compliance.')}
      >
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

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>{t('Refresh Live Data')}</span>
          </button>
          <DashboardWidgetCustomizer
            role="account-lead"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Approval KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-payroll-approvals') && (
          <StatCard
            title={t('Payroll Approvals')}
            value={`${pendingPayrolls.length} ${t('Runs')}`}
            subtitle={`${t('Queue')}: ${formatMoney(pendingPayrollTotalUSD)}`}
            icon={Wallet}
            color="text-indigo-500"
            bgColor="bg-indigo-500/10"
            href="/finance/payroll/approvals"
            isLoading={isLoading}
          />
        )}

        {isVisible('stat-expense-approvals') && (
          <StatCard
            title={t('Expense Approvals')}
            value={`${pendingExpenses.length} ${t('Vouchers')}`}
            subtitle={`${t('Claims')}: ${formatMoney(pendingExpenseTotalUSD)}`}
            icon={Receipt}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/finance/expenses/approvals"
            isLoading={isLoading}
          />
        )}

        {isVisible('stat-budget-approvals') && (
          <StatCard
            title={t('Budget Approvals')}
            value={`${pendingBudgets.length} ${t('Allocations')}`}
            subtitle={`${t('Limit')}: ${formatMoney(pendingBudgetTotalUSD)}`}
            icon={Building2}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/finance/budget/approvals"
            isLoading={isLoading}
          />
        )}

        {isVisible('stat-donations-lead') && (
          <StatCard
            title={t('Waqf & Endowments')}
            value={formatNumber(dashboardData?.counts?.donations || 1)}
            subtitle={t('Active Donor Funds')}
            icon={HeartHandshake}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/finance/donations"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 — Two-Tier Governance Quick Action Hub */}
      {isVisible('action-governance-hub') && (
        <div className="p-5 rounded-3xl bg-card border border-border mb-8 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t('Two-Tier Governance & Certified Authorization Hub')}</span>
            </h2>
            <span className="text-[11px] font-mono text-emerald-500 font-bold">
              {t('Comptroller Sign-off Active')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <Link
              href="/finance/payroll/approvals"
              className="p-3.5 rounded-2xl bg-background border border-indigo-500/30 hover:border-indigo-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform mb-2 relative">
                <Wallet className="w-5 h-5" />
                {pendingPayrolls.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {pendingPayrolls.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground">{t('Payroll Sign-Off')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Wage Disbursement')}</span>
            </Link>

            <Link
              href="/finance/expenses/approvals"
              className="p-3.5 rounded-2xl bg-background border border-rose-500/30 hover:border-rose-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform mb-2 relative">
                <Receipt className="w-5 h-5" />
                {pendingExpenses.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {pendingExpenses.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground">{t('Expense Approval')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Vendor Requisitions')}</span>
            </Link>

            <Link
              href="/finance/budget/approvals"
              className="p-3.5 rounded-2xl bg-background border border-amber-500/30 hover:border-amber-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform mb-2 relative">
                <Building2 className="w-5 h-5" />
                {pendingBudgets.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                    {pendingBudgets.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground">{t('Budget Allocations')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Cost Center Limits')}</span>
            </Link>

            <Link
              href="/finance/accounting/ledger"
              className="p-3.5 rounded-2xl bg-background border border-sky-500/30 hover:border-sky-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform mb-2">
                <FolderOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('General Ledger')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Double-Entry Trail')}</span>
            </Link>

            <Link
              href="/finance/accounting/chart"
              className="p-3.5 rounded-2xl bg-background border border-teal-500/30 hover:border-teal-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform mb-2">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Chart of Accounts')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('16 GL Hierarchy')}</span>
            </Link>

            <Link
              href="/finance/reports"
              className="p-3.5 rounded-2xl bg-background border border-emerald-500/30 hover:border-emerald-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform mb-2">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Financial Reports')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('P&L / Balance Sheet')}</span>
            </Link>

            <Link
              href="/audit-logs"
              className="p-3.5 rounded-2xl bg-background border border-slate-500/30 hover:border-slate-500 hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:scale-110 transition-transform mb-2">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Audit Logs')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Compliance Trail')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Layer 3 — Live Analytics & Security Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-budget-utilization') && (
          <ChartCard
            title={`${t('Departmental Budget vs. Actual Expenditure')} (${selectedCurrency})`}
            subtitle={t('Current academic term compliance & burn-rate monitoring')}
            data={budgetChartData}
            type="bar"
            dataKeys={[
              { key: 'budget', label: `${t('Allocated Limit')} (${selectedCurrency})`, color: 'hsl(var(--primary))' },
              { key: 'actual', label: `${t('Actual Spent')} (${selectedCurrency})`, color: '#f59e0b' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-audit-logs') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{t('Financial Audit & Compliance Feed')}</span>
              </h2>
              <Link href="/audit-logs" className="text-xs font-semibold text-primary hover:underline">
                {t('View all →')}
              </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
              {(dashboardData?.auditLogs && dashboardData.auditLogs.length > 0) ? (
                dashboardData.auditLogs.map((l: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{l.action || t('Audit Event')}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('Recent')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description || l.message || ''}</p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  {t('No financial compliance discrepancies logged.')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
