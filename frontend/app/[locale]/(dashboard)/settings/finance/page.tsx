/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Settings, Save, ShieldCheck, DollarSign, Globe, Percent,
  CreditCard, Award, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Building2, Landmark, FileText, ArrowRight,
  Sliders, Smartphone, QrCode, ExternalLink, PiggyBank
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { FinanceSettings, MultiCurrencyRate } from '@/types/finance.types';
import type { AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

export default function FinanceSettingsOverviewPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYearName, setActiveYearName] = useState<string>('');
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states with clean defaults
  const [fiscalYearStart, setFiscalYearStart] = useState('2026-09-01');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [lateFeeRule, setLateFeeRule] = useState('5% after 14 days of invoice maturity');
  const [enableFinancialHolds, setEnableFinancialHolds] = useState(true);
  const [holdsDays, setHoldsDays] = useState('15');
  const [autoReceiptNumbering, setAutoReceiptNumbering] = useState('REC-2026-XXXXXX');
  const [doubleEntryParity, setDoubleEntryParity] = useState('Enforce strict Debits == Credits (SAP S/4HANA standard)');
  const [waqfEndowmentSubsidy, setWaqfEndowmentSubsidy] = useState('100% Full Tuition Coverage');

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, years, ratesData] = await Promise.all([
        financeService.getSettings(),
        erpService.getAcademicYears(locale).catch(() => []),
        financeService.getExchangeRates().catch(() => [])
      ]);

      setSettings(settingsData);
      setCurrencies(ratesData || []);

      if (settingsData) {
        setFiscalYearStart(settingsData.fiscalYearStart || '2026-09-01');
        setDefaultCurrency(settingsData.defaultCurrency || 'USD');
        setLateFeeRule(settingsData.lateFeeRule || settingsData.lateFeePolicy || '5% after 14 days of invoice maturity');
        setEnableFinancialHolds(settingsData.enableFinancialHolds ?? true);
        setAutoReceiptNumbering(settingsData.autoReceiptNumbering || 'REC-2026-XXXXXX');
      }

      if (years && years.length > 0) {
        setAcademicYears(years);
        const curr = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (curr?.name) setActiveYearName(curr.name);
      }
    } catch {
      toast.error(t('Failed to load institutional finance settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await financeService.updateSettings({
        fiscalYearStart,
        defaultCurrency,
        lateFeePolicy: lateFeeRule,
        lateFeeRule,
        enableFinancialHolds,
        autoReceiptNumbering,
        doubleEntryParity
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('yahaya_selected_currency', defaultCurrency);
        localStorage.setItem('selected_currency', defaultCurrency);
        localStorage.setItem('yahaya_default_currency', defaultCurrency);
        window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: defaultCurrency }));
      }

      toast.success(t('Institutional financial governance policies saved successfully!'));
    } catch {
      toast.error(t('Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrencyObj = useMemo(() => {
    return currencies.find(c => c.currencyCode === defaultCurrency) || {
      currencyCode: defaultCurrency,
      symbol: '$',
      currencyName: 'US Dollar'
    };
  }, [currencies, defaultCurrency]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fiscal_year',
      title: t('Institutional Fiscal Year Partition'),
      value: fiscalYearStart ? `${t('Starts')} ${fiscalYearStart}` : t('Active Partition'),
      subtitle: activeYearName ? `${t('Academic Year')} ${activeYearName} ${t('active partition')}` : t('Annual academic partition'),
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'base_currency',
      title: t('Base Institutional Currency'),
      value: `${defaultCurrency} (${selectedCurrencyObj.symbol || '$'})`,
      subtitle: `${currencies.length} ${t('operating currencies configured in multi-currency engine')}`,
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'accounting_standard',
      title: t('Double-Entry Accounting Standard'),
      value: t('Strict SAP / Odoo Parity'),
      subtitle: t('Every transaction requires balanced GL debit & credit postings'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'holds_engine',
      title: t('Automated Academic Financial Holds'),
      value: enableFinancialHolds ? t('ENABLED') : t('DISABLED'),
      subtitle: `${t('Overdue')} > ${holdsDays} ${t('days triggers report card lock')}`,
      trendDirection: enableFinancialHolds ? 'up' : 'down',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Institutional Finance Governance & ERP Settings')}
      description={t('SAP S/4HANA & Odoo financial configuration hub. Define global fiscal year boundaries, base operating currencies, multi-currency parity links, tax exemptions, and automated academic financial holds.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Finance Settings') }]}
      icon={<Settings className="w-8 h-8 text-emerald-400" />}
      recordCount={5}
      recordLabel={t('Governance Pillars')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? t('Saving Governance Policies...') : t('Save Policy Parameters')}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      {/* Main Settings & Policy Grid */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Pillar 1: Fiscal Year & Base Operating Currency */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">1. {t('Fiscal Year & Base Currency Engine')}</h3>
            </div>
            <Link
              href="/settings/finance/currencies"
              className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>{t('Manage Rates')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {/* Academic Fiscal Year from DB */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Active Academic Year Partition (from DB)')}</label>
              <select
                value={activeYearName}
                onChange={(e) => {
                  setActiveYearName(e.target.value);
                  const matched = academicYears.find(y => y.name === e.target.value);
                  if (matched?.startDate) setFiscalYearStart(matched.startDate);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {academicYears.map(y => (
                  <option key={y.id} value={y.name}>
                    {y.name} {y.isCurrent ? `(${t('Current Active')})` : ''} — {y.startDate} → {y.endDate}
                  </option>
                ))}
                {academicYears.length === 0 && <option value="AY 2026-2027">AY 2026-2027 (Default)</option>}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Fiscal Year Start Date')}</label>
                <input
                  type="date"
                  value={fiscalYearStart}
                  onChange={(e) => setFiscalYearStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Dynamic Currency Select from Multi-Currency Database */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Default Base Operating Currency')}</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.currencyCode} value={c.currencyCode}>
                      {c.currencyCode} ({c.symbol}) — {c.currencyName}
                    </option>
                  ))}
                  {currencies.length === 0 && (
                    <>
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="XOF">XOF (CFA) — CFA Franc</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Receipt Serial Numbering Rule')}</label>
              <input
                type="text"
                value={autoReceiptNumbering}
                onChange={(e) => setAutoReceiptNumbering(e.target.value)}
                placeholder="REC-2026-XXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Live Parity Snapshot Widget */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  {t('Live Parity Links (vs 1 USD)')}:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">BCEAO / ECB Central Parity</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono font-bold">
                {currencies.slice(0, 5).map(c => (
                  <span key={c.currencyCode} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    {c.currencyCode}: <strong className="text-emerald-400">{Number(c.exchangeRateToUSD).toFixed(2)}</strong> {c.symbol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Governance, Holds & Double-Entry Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">2. {t('Compliance & Academic Holds Engine')}</h3>
            </div>
            <Link
              href="/settings/finance/fees"
              className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>{t('Penalty Rules')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Automated Late Penalty Rule')}</label>
              <input
                type="text"
                value={lateFeeRule}
                onChange={(e) => setLateFeeRule(e.target.value)}
                placeholder="e.g. 5% after 14 days of invoice maturity"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{t('Automated Academic Financial Holds')}</span>
                  <span className="text-[11px] text-slate-400 block">{t('Blocks report cards, certificates & exam permits when fee balance is overdue')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableFinancialHolds}
                  onChange={(e) => setEnableFinancialHolds(e.target.checked)}
                  aria-label="Toggle automated academic financial holds"
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Double-Entry Ledger Integrity Rule')}</label>
              <input
                type="text"
                disabled
                value={doubleEntryParity}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold opacity-80"
              />
            </div>

            {/* Quick Governance Links Card */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/settings/finance/tax"
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-amber-400">0% / 18%</span>
                </div>
                <span className="text-xs font-bold text-white block mt-2">{t('VAT & Tax Rules')}</span>
                <span className="text-[10px] text-slate-500 block">{t('Educational exemptions')}</span>
              </Link>

              <Link
                href="/settings/finance/methods"
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-400">5 Active</span>
                </div>
                <span className="text-xs font-bold text-white block mt-2">{t('Payment Channels')}</span>
                <span className="text-[10px] text-slate-500 block">{t('Stripe, Orange, Wave, POS')}</span>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </EnterpriseModuleShell>
  );
}
