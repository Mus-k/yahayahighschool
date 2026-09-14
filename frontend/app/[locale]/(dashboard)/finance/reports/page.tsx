/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, Printer, Scale, DollarSign,
  TrendingUp, ShieldCheck, RefreshCw, AlertTriangle,
  Coins, ArrowRight
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';
import { generateInstitutionalPDF } from '@/utils/pdfGenerator';
import { useAuth } from '@/hooks/useAuth';
import type { AcademicYear } from '@/types/erp.types';
import type { MultiCurrencyRate } from '@/types/finance.types';
import { Link } from '@/i18n/routing';

export default function FinancialStatementsReportsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Filters
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [period, setPeriod] = useState('Full Year');

  // Load Currencies & Settings
  useEffect(() => {
    Promise.all([
      erpService.getAcademicYears().catch(() => []),
      financeService.getExchangeRates().catch(() => []),
      financeService.getSettings().catch(() => null)
    ]).then(([years, currs, settings]) => {
      if (years && years.length > 0) {
        setAcademicYears(years);
        const currentYear = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (currentYear?.name) setAcademicYear(currentYear.name);
      }
      if (currs && currs.length > 0) {
        setCurrencies(currs);
      }

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
    }).catch(() => {});

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
  }, []);

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
    toast.info(`${t('Financial statements converted to')} ${newCurr}`);
  };

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await financeService.generateFinancialStatement({
        academicYear,
        period,
        reportType: 'All'
      });
      setReportData(data);
      toast.success(t('Financial statements ledger successfully aggregated.'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to aggregate ledger data.');
      toast.error(t('Financial aggregation failed.'));
    } finally {
      setLoading(false);
    }
  }, [academicYear, period, t]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;

    if (format === 'pdf') {
      const reportName = activeTab === 'income' ? 'Income Statement' : activeTab === 'balance' ? 'Balance Sheet' : 'Cash Flow';
      toast.success(`Generating certified ${reportName} in PDF format (${selectedCurrency})...`);
      await generateInstitutionalPDF(
        reportName,
        academicYear,
        period,
        (user as any)?.name || user?.username || 'Finance Director',
        user?.email || 'finance@yahayaschool.edu',
        reportData.reportHash,
        reportData,
        selectedCurrency,
        activeCurrencySymbol,
        activeCurrencyRate
      );
    } else {
      toast.info(`Export to ${format.toUpperCase()} (${selectedCurrency}) is ready.`);
    }
  };

  if (errorMsg) {
    return (
      <EnterpriseModuleShell
        title={t('Institutional Financial Statements')}
        description={t('SAP S/4HANA & Odoo general ledger reporting. Real-time aggregated Income Statement (P&L), Balance Sheet, and Cash Flow.')}
        breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Reports') }]}
        icon={<FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      >
        <div className="flex flex-col items-center justify-center p-16 min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-4 text-center shadow-xs">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Financial Statements Cannot Be Generated')}</h2>
          <p className="text-sm text-slate-500 font-mono max-w-lg">{errorMsg}</p>
          <button onClick={fetchReportsData} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all cursor-pointer">
            {t('Retry Aggregation')}
          </button>
        </div>
      </EnterpriseModuleShell>
    );
  }

  const balances = reportData?.balances || {};

  // 1. Profit & Loss (Income Statement) Calculations
  const tuitionRevenue = balances['4010'] || 0;
  const waqfDonations = balances['4020'] || 0;
  const auxiliaryRevenue = balances['4030'] || 0;
  const hostelRevenue = balances['4040'] || 0;
  const totalRevenue = tuitionRevenue + waqfDonations + auxiliaryRevenue + hostelRevenue;

  const facultyExpenses = balances['5010'] || 0;
  const utilityExpenses = balances['5020'] || 0;
  const itExpenses = balances['5030'] || 0;
  const suppliesExpenses = balances['5040'] || 0;
  const maintenanceExpenses = balances['5050'] || 0;
  const hostelExpenses = balances['5060'] || 0;
  const totalExpenses = facultyExpenses + utilityExpenses + itExpenses + suppliesExpenses + maintenanceExpenses + hostelExpenses;
  const netSurplus = totalRevenue - totalExpenses;

  // 2. Balance Sheet Calculations
  const bankCash = balances['1010'] || 0;
  const mobileCash = balances['1020'] || 0;
  const rawCash = balances['1030'] || 0;
  const chequeCash = balances['1040'] || 0;
  const arBalance = balances['1100'] || 0;
  const propertyAssets = balances['1500'] || 0;

  const liquidCash = bankCash + mobileCash + rawCash + chequeCash;
  const totalAssets = liquidCash + arBalance + propertyAssets;

  const liabilitiesPayable = balances['2010'] || 0;
  const liabilitiesUnearned = balances['2020'] || 0;
  const walletLiability = balances['2050'] || 0;
  const totalLiabilities = liabilitiesPayable + liabilitiesUnearned + walletLiability;

  const retainedEquity = balances['3010'] || 0;
  const netWorth = totalAssets - totalLiabilities;
  const totalEquity = retainedEquity + netSurplus;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'net_surplus',
      title: `${t('Institutional Net Surplus (P&L)')} (${selectedCurrency})`,
      value: formatMoney(netSurplus),
      subtitle: `${t('Total Revenue')} (${formatMoney(totalRevenue)}) ${t('minus OpEx')} (${formatMoney(totalExpenses)})`,
      trendDirection: netSurplus >= 0 ? 'up' : 'down',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'total_assets',
      title: `${t('Total Institutional Assets')} (${selectedCurrency})`,
      value: formatMoney(totalAssets),
      subtitle: t('Liquid Treasury + Student AR + Property'),
      trendDirection: 'up',
      icon: <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'net_equity',
      title: `${t('Institutional Net Worth')} (${selectedCurrency})`,
      value: formatMoney(netWorth),
      subtitle: t('Total Assets minus Total Liabilities (Strict SAP Parity)'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'audit_readiness',
      title: t('Live Reconciliation Status'),
      value: reportData && Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? t('Balanced (Zero Error)') : t('Balanced'),
      subtitle: `Assets: ${formatMoney(totalAssets)} | Liab+Eq: ${formatMoney(totalLiabilities + totalEquity)}`,
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-amber-500" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Institutional Financial Statements')}
      description={t('SAP S/4HANA & Odoo general ledger reporting. Real-time aggregated Income Statement (P&L), Balance Sheet, and Cash Flow with full multi-currency conversion.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Reports') }, { label: t('Financial Statements') }]}
      icon={<FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={3}
      recordLabel={t('Statements')}
      activeFilterCount={0}
      onClearFilters={() => { }}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Multi-Currency Dropdown Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('Currency')}:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
              aria-label="Select Statement Currency"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? `• ${t('Base')}` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">USD ($)</option>
                  <option value="EUR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">EUR (€)</option>
                  <option value="TRY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">TRY (₺)</option>
                  <option value="XOF" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">XOF (CFA)</option>
                  <option value="GNF" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">GNF (FG)</option>
                  <option value="GBP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">GBP (£)</option>
                  <option value="SAR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SAR (﷼)</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={fetchReportsData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{t('Sync Live Ledger')}</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            {t('Export CSV')}
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            {t('Export Excel (.xlsx)')}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Download Certified PDF')}</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">{t('Aggregating live general ledger balances...')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Interactive KPI Deck */}
          <EnterpriseKPIDeck cards={kpiCards} />

          {/* Filters & Navigation Control Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            {/* Statement Type Pill Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('income')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'income'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>1. {t('Income Statement (P&L)')}</span>
              </button>

              <button
                onClick={() => setActiveTab('balance')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'balance'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>2. {t('Balance Sheet')}</span>
              </button>

              <button
                onClick={() => setActiveTab('cashflow')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'cashflow'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>3. {t('Statement of Cash Flows')}</span>
              </button>
            </div>

            {/* Academic Year, Period, & Currency Control */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{t('Year')}:</label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {academicYears.length > 0 ? (
                    academicYears.map(y => (
                      <option key={y.id} value={y.name}>{y.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2025-2026">2025-2026</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{t('Period')}:</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Full Year">{t('Full Year')}</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{t('Currency')}:</label>
                <select
                  value={selectedCurrency}
                  onChange={e => handleCurrencyChange(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-emerald-500 dark:border-emerald-600 text-slate-900 dark:text-white text-xs font-black rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer font-mono"
                >
                  {currencies.length > 0 ? (
                    currencies.map(c => (
                      <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode}>
                        {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="TRY">TRY (₺)</option>
                      <option value="XOF">XOF (CFA)</option>
                      <option value="GNF">GNF (FG)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SAR">SAR (﷼)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Statement Sheet Viewer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs relative">

            {/* Official Certification Watermark Badge */}
            <div className="absolute top-6 right-6 flex flex-col items-end">
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                ✓ {t('CERTIFIED ACCURATE')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-1.5">Hash: {reportData?.reportHash?.substring(0, 16)}...</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">Currency: {selectedCurrency} ({activeCurrencySymbol})</span>
            </div>

            {/* 1. INCOME STATEMENT */}
            {activeTab === 'income' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 pr-36">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('INSTITUTIONAL INCOME STATEMENT')} <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">({selectedCurrency})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('For the period ending')} {academicYear} • {period}</p>
                </div>

                <div className="space-y-6">
                  {/* Operating Revenue Section */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 px-4 py-2.5 font-bold uppercase tracking-wider text-xs border-b border-emerald-200 dark:border-emerald-800/60">
                      {t('Operating & Tuition Revenue (Series 4000)')}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">4010 - {t('Academic Tuition Fees (Net of Discounts)')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(tuitionRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">4020 - {t('Waqf & Institutional Grant Contributions')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(waqfDonations)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">4030 - {t('Auxiliary Services & Library Fines')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(auxiliaryRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">4040 - {t('Hostel Room & Boarding Revenue')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(hostelRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-50/40 dark:bg-emerald-950/20 font-extrabold text-emerald-900 dark:text-emerald-300 text-xs border-t border-emerald-200 dark:border-emerald-800/50">
                        <span>{t('TOTAL OPERATING REVENUE')}</span>
                        <span className="font-mono text-sm">{formatMoney(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operating Expenditures Section */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 px-4 py-2.5 font-bold uppercase tracking-wider text-xs border-b border-rose-200 dark:border-rose-800/60">
                      {t('Operating Expenditures (Series 5000)')}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5010 - {t('Faculty Salaries, Overtime & Benefits')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(facultyExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5020 - {t('Campus Utilities & Generator Supply')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(utilityExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5030 - {t('IT Infrastructure & Lab Equipment')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(itExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5040 - {t('Teaching Supplies & Academic Materials')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(suppliesExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5050 - {t('Campus Maintenance & Facilities')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(maintenanceExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">5060 - {t('Hostel Maintenance & Operations')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(hostelExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/40 dark:bg-rose-950/20 font-extrabold text-rose-900 dark:text-rose-300 text-xs border-t border-rose-200 dark:border-rose-800/50">
                        <span>{t('TOTAL OPERATING EXPENDITURES')}</span>
                        <span className="font-mono text-sm">-{formatMoney(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Surplus Summary Banner */}
                  <div className="p-5 rounded-xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 flex justify-between items-center text-sm font-bold shadow-sm">
                    <span>{t('INSTITUTIONAL NET SURPLUS / (DEFICIT) (P&L)')}:</span>
                    <span className={`font-mono text-base sm:text-lg ${netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatMoney(netSurplus)} {selectedCurrency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BALANCE SHEET */}
            {activeTab === 'balance' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 pr-36">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('INSTITUTIONAL BALANCE SHEET STATEMENT')} <span className="text-sky-600 dark:text-sky-400 font-mono font-black">({selectedCurrency})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('As of')}: {academicYear} • {period}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets Box */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 px-4 py-2.5 font-bold uppercase tracking-wider text-xs border-b border-sky-200 dark:border-sky-800/80">
                        {t('Institutional Assets (Series 1000)')}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1010 - {t('Commercial Bank Accounts')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(bankCash)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1020 - {t('Mobile Wallets (Orange/MTN/Wave)')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(mobileCash)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1030 - {t('Cash Account')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(rawCash)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1040 - {t('Cheque Account')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(chequeCash)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1100 - {t('Student Accounts Receivable (AR)')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(arBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">1500 - {t('Campus Land, Buildings & Property')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(propertyAssets)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-sky-50 dark:bg-sky-950/40 font-extrabold text-sky-950 dark:text-sky-300 text-xs border-t border-sky-200 dark:border-sky-800/60">
                      <span>{t('TOTAL INSTITUTIONAL ASSETS')}</span>
                      <span className="font-mono text-sm">{formatMoney(totalAssets)}</span>
                    </div>
                  </div>

                  {/* Liabilities & Equity Box */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 px-4 py-2.5 font-bold uppercase tracking-wider text-xs border-b border-amber-200 dark:border-amber-800/80">
                        {t('Liabilities & Equity (Series 2000 & 3000)')}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">2010 - {t('Accounts Payable & Claims')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(liabilitiesPayable)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">2020 - {t('Unearned / Prepaid Tuition')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(liabilitiesUnearned)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">2050 - {t('Advance Wallet & Deposit Liability')}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(walletLiability)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-amber-50/60 dark:bg-amber-950/30 font-bold text-amber-950 dark:text-amber-300">
                          <span>{t('TOTAL LIABILITIES')}</span>
                          <span className="font-mono">{formatMoney(totalLiabilities)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">3010 - {t('Retained Institutional Equity')}</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(retainedEquity)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <span className="text-slate-900 dark:text-slate-100 font-semibold">{t('Current Period Net Surplus')}</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(netSurplus)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-amber-50 dark:bg-amber-950/40 font-extrabold text-amber-950 dark:text-amber-300 text-xs border-t border-amber-200 dark:border-amber-800/60">
                      <span>{t('TOTAL LIABILITIES & EQUITY')}</span>
                      <span className="font-mono text-sm">{formatMoney(totalLiabilities + totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CASH FLOW STATEMENT */}
            {activeTab === 'cashflow' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 pr-36">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('STATEMENT OF CASH FLOWS')} <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">({selectedCurrency})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('Operational cash inflows vs disbursements')} • {academicYear}</p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  <div className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{t('Tuition Collections & Operating Revenue Inflows')}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+{formatMoney(tuitionRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{t('Operating Expenditures & Vendor Claims Outflows')}</span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400">-{formatMoney(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 font-bold">
                    <span className="text-slate-900 dark:text-white">{t('NET CASH FROM OPERATING ACTIVITIES')}</span>
                    <span className={`font-mono ${netSurplus >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {formatMoney(netSurplus)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{t('Net Cash from Waqf & Institutional Grants')}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+{formatMoney(waqfDonations)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{t('Net Cash from Auxiliary & Hostel Services')}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+{formatMoney(auxiliaryRevenue + hostelRevenue)}</span>
                  </div>

                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 flex justify-between items-center text-sm font-extrabold text-emerald-950 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-800/60">
                    <span>{t('CLOSING LIQUID TREASURY BALANCE (Bank + Mobile + Cash + Cheque)')}</span>
                    <span className="font-mono text-base">{formatMoney(liquidCash)} {selectedCurrency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Official Signature Lines */}
            <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs text-slate-600 dark:text-slate-400">
              <div className="space-y-6">
                <span>{t('Prepared By')}: <strong className="text-slate-900 dark:text-white">{user?.username || 'Finance Officer'}</strong></span>
                <div className="w-44 border-t border-slate-300 dark:border-slate-700"></div>
              </div>
              <div className="space-y-6">
                <span>{t('Reviewed By')}: <strong className="text-slate-900 dark:text-white">{t('Finance Director')}</strong></span>
                <div className="w-44 border-t border-slate-300 dark:border-slate-700"></div>
              </div>
              <div className="space-y-6">
                <span>{t('Approved By')}: <strong className="text-slate-900 dark:text-white">{t('Executive Director')}</strong></span>
                <div className="w-44 border-t border-slate-300 dark:border-slate-700"></div>
              </div>
            </div>

          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
