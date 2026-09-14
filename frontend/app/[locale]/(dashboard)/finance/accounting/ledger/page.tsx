/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  FolderOpen, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Scale, ScrollText,
  Landmark, ShieldCheck, ArrowRight, Printer, Sparkles,
  Coins, Layers, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount, JournalEntry, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GLPostingRow {
  id: string;
  journalId: string | number;
  journalNumber: string;
  postingDate: string;
  sourceModule: string;
  accountCode: string;
  accountName: string;
  memo: string;
  referenceNumber: string;
  debit: number;
  credit: number;
  runningBalance: number;
  originalJournal?: any;
}

export default function GeneralLedgerDrillDownPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  // Multi-Currency State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Ledger State
  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('1010');
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<GLPostingRow | null>(null);

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
    toast.info(`${t('General Ledger converted to')} ${newCurr}`);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coaList, jrnList, currs, settings] = await Promise.all([
        financeService.getChartOfAccounts().catch(() => []),
        financeService.getJournalEntries().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);

      setCoa(coaList || []);
      setJournals(jrnList || []);
      setCurrencies(currs || []);

      if (coaList && coaList.length > 0) {
        if (!selectedCode || !coaList.some(a => a.accountCode === selectedCode)) {
          setSelectedCode(coaList[0].accountCode);
        }
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
    } catch {
      toast.error(t('Failed to load General Ledger data.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCode, t]);

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

  const currentAccount = useMemo(() => {
    return coa.find(a => a.accountCode === selectedCode) || coa[0] || null;
  }, [coa, selectedCode]);

  // ── Double-Entry GL Line Postings Engine with GAAP Running Balance ──────────
  const glRows = useMemo<GLPostingRow[]>(() => {
    if (!currentAccount) return [];
    let runBal = 0;
    const rows: GLPostingRow[] = [];

    // Chronological order from oldest to newest for running balance
    const sorted = [...journals].sort((a: any, b: any) => {
      const dateA = a.postingDate || a.transactionDate || (a.date ? String(a.date).split('T')[0] : '') || '';
      const dateB = b.postingDate || b.transactionDate || (b.date ? String(b.date).split('T')[0] : '') || '';
      return dateA.localeCompare(dateB);
    });

    for (const j of sorted as any[]) {
      const journalNumber = j.journalNumber || j.entryNumber || `JRN-${j.id || 'AUTO'}`;
      const postingDate = j.postingDate || j.transactionDate || (j.date ? String(j.date).split('T')[0] : '') || '—';
      const referenceNumber = j.referenceNumber || j.sourceDocumentNumber || '—';
      const description = j.description || j.title || 'Journal Entry';
      const sourceModule = j.sourceModule || 'manual_journal';

      for (let i = 0; i < (j.lines || []).length; i++) {
        const l = j.lines[i];
        let accountName = l.accountName || l.account || '';
        let accountCode = l.accountCode || '';

        // Extract account code from string like "Bank Account (1010)"
        if (accountName && !accountCode) {
          const match = accountName.match(/\((\d+)\)/);
          if (match) {
            accountCode = match[1];
            accountName = accountName.replace(/\(\d+\)/, '').trim();
          } else if (accountName.toLowerCase().includes('receivable')) {
            accountCode = '1100';
          } else if (accountName.toLowerCase().includes('bank') || accountName.toLowerCase().includes('cash')) {
            accountCode = '1010';
          } else if (accountName.toLowerCase().includes('revenue') || accountName.toLowerCase().includes('tuition')) {
            accountCode = '4010';
          } else if (accountName.toLowerCase().includes('payable')) {
            accountCode = '2010';
          } else if (accountName.toLowerCase().includes('expense') || accountName.toLowerCase().includes('salary')) {
            accountCode = '5010';
          }
        }

        if (accountCode === currentAccount.accountCode || (accountCode && currentAccount.accountCode && accountCode.trim() === currentAccount.accountCode.trim())) {
          let debit = 0;
          let credit = 0;

          if (l.type === 'debit') {
            debit = Number(l.amount || l.debit || l.debitAmount || 0);
          } else if (l.type === 'credit') {
            credit = Number(l.amount || l.credit || l.creditAmount || 0);
          } else {
            debit = Number(l.debitAmount ?? l.debit ?? 0);
            credit = Number(l.creditAmount ?? l.credit ?? 0);
          }

          // Strict GAAP normal balance rules
          if (currentAccount.accountType === 'Asset' || currentAccount.accountType === 'Expense') {
            runBal += (debit - credit);
          } else {
            runBal += (credit - debit);
          }

          rows.push({
            id: l.id || `${j.id}-${i}`,
            journalId: j.id || j.documentId,
            journalNumber,
            postingDate,
            sourceModule,
            accountCode: currentAccount.accountCode,
            accountName: currentAccount.accountName,
            memo: l.memo || description,
            referenceNumber,
            debit,
            credit,
            runningBalance: runBal,
            originalJournal: j
          });
        }
      }
    }

    return rows.reverse();
  }, [currentAccount, journals]);

  const filteredRows = useMemo(() => {
    return glRows.filter(r => {
      const q = query.toLowerCase();
      const matchQ = !query ||
        r.journalNumber.toLowerCase().includes(q) ||
        r.memo.toLowerCase().includes(q) ||
        r.referenceNumber.toLowerCase().includes(q);
      const matchFrom = !dateFrom || r.postingDate >= dateFrom;
      const matchTo = !dateTo || r.postingDate <= dateTo;
      return matchQ && matchFrom && matchTo;
    });
  }, [glRows, query, dateFrom, dateTo]);

  const totalDebits = useMemo(() => filteredRows.reduce((s, r) => s + r.debit, 0), [filteredRows]);
  const totalCredits = useMemo(() => filteredRows.reduce((s, r) => s + r.credit, 0), [filteredRows]);
  const currentNetBalance = filteredRows.length > 0 ? filteredRows[0].runningBalance : (currentAccount?.currentBalance || 0);

  const filteredCoa = useMemo(() => {
    if (accountCategoryFilter === 'all') return coa;
    return coa.filter(a => a.accountType === accountCategoryFilter);
  }, [coa, accountCategoryFilter]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'current_balance',
      title: `${currentAccount?.accountName || t('Account')} (${currentAccount?.accountCode || '---'})`,
      value: formatMoney(Math.abs(currentNetBalance)),
      subtitle: `${t('Certified Net Balance')} • ${currentAccount?.accountType || 'Asset'} (${currentNetBalance >= 0 ? t('Normal Parity') : t('Contra/Credit')})`,
      trendDirection: currentNetBalance >= 0 ? 'up' : 'down',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'total_debits',
      title: `${t('Cumulative Period Debits (DR)')} (${selectedCurrency})`,
      value: formatMoney(totalDebits),
      subtitle: `${filteredRows.filter(r => r.debit > 0).length} ${t('Debit Postings')}`,
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'total_credits',
      title: `${t('Cumulative Period Credits (CR)')} (${selectedCurrency})`,
      value: formatMoney(totalCredits),
      subtitle: `${filteredRows.filter(r => r.credit > 0).length} ${t('Credit Postings')}`,
      trendDirection: 'neutral',
      icon: <Receipt className="w-5 h-5 text-indigo-400" />
    },
    {
      id: 'postings_count',
      title: t('Total Activity Lines'),
      value: `${filteredRows.length} ${t('Postings')}`,
      subtitle: `${t('Double-Entry Trail')} • ${selectedCurrency}`,
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<GLPostingRow, any>[]>(() => [
    {
      accessorKey: 'postingDate',
      header: t('Date & Voucher Ref'),
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-xs">
          <span className="font-bold text-white block">{row.original.postingDate}</span>
          <span className="text-[11px] text-emerald-400 block font-semibold">{row.original.journalNumber}</span>
          {row.original.referenceNumber !== '—' && (
            <span className="text-[10px] text-slate-400 block">{row.original.referenceNumber}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'memo',
      header: t('Transaction Memo & Description'),
      cell: ({ row }) => (
        <div className="space-y-1 py-1 max-w-md">
          <span className="font-medium text-white text-xs sm:text-sm block truncate">
            {row.original.memo}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
              {row.original.sourceModule.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'debit',
      header: `${t('Debit (DR)')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-sky-300">
          {row.original.debit > 0 ? formatMoney(row.original.debit) : '—'}
        </span>
      )
    },
    {
      accessorKey: 'credit',
      header: `${t('Credit (CR)')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-indigo-300">
          {row.original.credit > 0 ? formatMoney(row.original.credit) : '—'}
        </span>
      )
    },
    {
      accessorKey: 'runningBalance',
      header: `${t('Running Balance')} (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          {formatMoney(row.original.runningBalance)}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedRow(row.original)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Drill-Down')}</span>
        </button>
      )
    }
  ], [locale, selectedCurrency, formatMoney, t]);

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.info(t('No ledger postings to export.'));
      return;
    }
    const exportData = filteredRows.map(r => ({
      'Posting Date': r.postingDate,
      'Voucher #': r.journalNumber,
      'Account Code': r.accountCode,
      'Account Name': r.accountName,
      'Transaction Memo': r.memo,
      'Reference': r.referenceNumber,
      [`Debit (${selectedCurrency})`]: (r.debit * activeCurrencyRate).toFixed(2),
      [`Credit (${selectedCurrency})`]: (r.credit * activeCurrencyRate).toFixed(2),
      [`Running Balance (${selectedCurrency})`]: (r.runningBalance * activeCurrencyRate).toFixed(2)
    }));
    financeService.exportToCSV(exportData, `GeneralLedger_${selectedCode}_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(t('General Ledger CSV exported successfully.'));
  };

  const activeFiltersCount = [
    !!query,
    !!dateFrom,
    !!dateTo,
    accountCategoryFilter !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setAccountCategoryFilter('all');
  };

  return (
    <EnterpriseModuleShell
      title={t('General Ledger Drill-Down & Account Card')}
      description={t('Full SAP-grade double-entry transaction trail with cumulative running balance calculations per Chart of Accounts classification and real-time multi-currency conversion.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('General Ledger') }]}
      icon={<FolderOpen className="w-8 h-8 text-sky-400" />}
      recordCount={filteredRows.length}
      recordLabel={t('Postings')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
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
              aria-label="Select General Ledger Currency"
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

          {/* Account Selector Dropdown */}
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            {filteredCoa.map(a => (
              <option key={a.accountCode} value={a.accountCode} className="bg-slate-900 text-white">
                {a.accountCode} — {a.accountName} ({a.accountType})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export GL CSV')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Chart of Accounts (16 GL)')}</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('Manual Journal Entries')}</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{t('General Ledger')}</span>
        </Link>
        <Link href="/finance/accounting/trial-balance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Trial Balance Equilibrium')}</span>
        </Link>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase">{t('Account Category')}:</span>
          {['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(cat => (
            <button
              key={cat}
              onClick={() => setAccountCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                accountCategoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              {cat === 'all' ? t('All Accounts') : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('From')}:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('To')}:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900/60 transition-all cursor-pointer"
            >
              {t('Clear Filters')}
            </button>
          )}
        </div>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search ledger postings by journal voucher #, memo, or narrative...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('General Ledger refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
      />

      <EnterpriseDataGrid
        data={filteredRows}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        emptyStateProps={{
          title: `${t('No Transactions on Account')} ${selectedCode}`,
          description: `${t('No journal entries have been posted to')} ${currentAccount?.accountName || 'this account'}.`,
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: clearFilters
        }}
      />

      {/* Slide-Out Drilldown Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          name: `${selectedRow.journalNumber} — ${selectedRow.accountName}`,
          id: String(selectedRow.id),
          role: `GL ACCOUNT: ${selectedRow.accountCode} (${currentAccount?.accountType || 'Asset'})`,
          status: 'posted',
          email: `Posting Date: ${selectedRow.postingDate} | Ref: ${selectedRow.referenceNumber}`,
          phone: `Transaction Narrative: ${selectedRow.memo}`,
          department: `Debit: ${formatMoney(selectedRow.debit)} | Credit: ${formatMoney(selectedRow.credit)}`,
          joinDate: selectedRow.postingDate,
          balance: `CUMULATIVE RUNNING BALANCE: ${formatMoney(selectedRow.runningBalance)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
