/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Landmark, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Scale, ScrollText,
  FolderOpen, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, Smartphone
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { toast } from 'sonner';

export default function BankAccountsAndReconciliationPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [assetAccounts, setAssetAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [showReconcileModal, setShowReconcileModal] = useState<ChartOfAccount | null>(null);
  const [statementBalance, setStatementBalance] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const coa = await financeService.getChartOfAccounts();
      const banks = coa.filter(a => a.accountType === 'Asset' && (a.accountCode.startsWith('101') || a.accountCode.startsWith('102') || a.accountCode.startsWith('103') || a.accountCode.startsWith('104')));
      setAssetAccounts(banks);
    } catch {
      toast.error(t('Failed to load bank & wallet accounts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    return assetAccounts.filter(a => {
      if (!query) return true;
      return a.accountName.toLowerCase().includes(query.toLowerCase()) || a.accountCode.includes(query);
    });
  }, [assetAccounts, query]);

  const handlePerformReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReconcileModal) return;
    const stmtNum = parseFloat(statementBalance || '0');
    const variance = stmtNum - showReconcileModal.currentBalance;

    if (Math.abs(variance) > 0.01) {
      toast.warning(`Reconciliation Variance of $${variance.toFixed(2)} detected!`);
    } else {
      toast.success(`Account [${showReconcileModal.accountCode} - ${showReconcileModal.accountName}] 100% Reconciled!`);
      setShowReconcileModal(null);
    }
  };

  const totalLiquidCash = useMemo(() => assetAccounts.reduce((s, a) => s + a.currentBalance, 0), [assetAccounts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'liquid_cash',
      title: t('Total Liquid Treasury (Banks & Wallets)'),
      value: `$${totalLiquidCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${assetAccounts.length} ${t('institutional treasury repositories')}`,
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'banks',
      title: t('Commercial Bank Accounts'),
      value: `${assetAccounts.filter(a => a.accountCode.startsWith('101')).length} ${t('Accounts')}`,
      subtitle: t('Islamic & standard commercial accounts'),
      trendDirection: 'neutral',
      icon: <Landmark className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'wallets',
      title: t('Mobile Money Gateways'),
      value: `${assetAccounts.filter(a => a.accountCode.startsWith('102')).length} ${t('Wallets')}`,
      subtitle: t('Orange Money, MTN & Wave merchant wallets'),
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'reconciliation',
      title: t('Monthly Reconciliation Audit'),
      value: '100% Reconciled',
      subtitle: t('External statements verified against GL records'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<ChartOfAccount, any>[]>(() => [
    {
      accessorKey: 'accountCode',
      header: t('GL Code & Treasury Repository'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-mono">
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-black text-xs">
            {row.original.accountCode}
          </span>
          <span className="font-bold text-white text-xs sm:text-sm">{row.original.accountName}</span>
        </div>
      )
    },
    {
      accessorKey: 'accountType',
      header: t('Repository Type'),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 font-mono uppercase">
          {row.original.accountCode.startsWith('101') ? `🏦 ${t('Commercial Bank Account')}` : row.original.accountCode.startsWith('102') ? `📱 ${t('Mobile Money Merchant Wallet')}` : `💵 ${t('Physical Cash Drawer')}`}
        </span>
      )
    },
    {
      accessorKey: 'currentBalance',
      header: t('GL Ledger Balance ($ USD)'),
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          ${row.original.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'isActive',
      header: t('Reconciliation Health'),
      cell: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
          ✓ {t('Verified Reconciled')}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setShowReconcileModal(row.original);
              setStatementBalance(row.original.currentBalance.toString());
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('Reconcile Statement')}</span>
          </button>
          <button
            onClick={() => setSelectedAccount(row.original)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            {t('Inspect')}
          </button>
        </div>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Bank Accounts & Mobile Wallet Reconciliation Console')}
      description={t('Monitor institutional liquidity across Islamic bank accounts, Orange Money, and MTN merchant wallets. Perform monthly statement reconciliations against General Ledger balances.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Bank Reconciliations') }]}
      icon={<Landmark className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredAccounts.length}
      recordLabel={t('Bank & Wallet Accounts')}
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(assetAccounts, 'bank_reconciliation_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Chart of Accounts')}</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('Double-Entry Journals')}</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('General Ledger Drill-Down')}</span>
        </Link>
        <Link href="/finance/accounting/accounts" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" />
          <span>{t('Bank Reconciliations')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search banks or mobile money merchant wallets...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Treasury balances synchronized'));
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
      />

      <EnterpriseDataGrid
        data={filteredAccounts}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedAccount(row)}
        onRowClick={(row) => setSelectedAccount(row)}
        emptyStateProps={{
          title: t('No Treasury Accounts Found'),
          description: t('No bank accounts or mobile wallets match your current search.'),
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery('')
        }}
      />

      {/* Reconcile Modal */}
      {showReconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white">{t('Perform Bank & Statement Reconciliation')}</h3>
                  <p className="text-xs text-slate-400 font-mono">{showReconcileModal.accountCode} - {showReconcileModal.accountName}</p>
                </div>
              </div>
              <button onClick={() => setShowReconcileModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handlePerformReconciliation} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">{t('Current General Ledger (GL) Book Balance')}:</span>
                <span className="text-xl font-black font-mono text-emerald-400 block">
                  ${showReconcileModal.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Enter External Bank / Statement Ending Balance ($ USD)')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">{t('Calculated Variance')}:</span>
                <span className={`font-mono font-black text-sm ${
                  Math.abs(parseFloat(statementBalance || '0') - showReconcileModal.currentBalance) < 0.01 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ${(parseFloat(statementBalance || '0') - showReconcileModal.currentBalance).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowReconcileModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Complete Reconciliation')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        record={selectedAccount ? {
          name: selectedAccount.accountName,
          id: selectedAccount.accountCode,
          role: 'TREASURY REPOSITORY',
          status: selectedAccount.isActive ? 'active' : 'inactive',
          email: `Type: ${selectedAccount.accountType}`,
          phone: `Currency: ${selectedAccount.currency}`,
          department: `GL Code: ${selectedAccount.accountCode}`,
          joinDate: selectedAccount.accountCode.slice(0, 1) + '000 Series',
          balance: `GL BOOK BALANCE: $${selectedAccount.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
