/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Scale, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Landmark, Layers,
  FolderOpen, Folder, ArrowRight, Sparkles, Building2, ChevronRight
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount, AccountType } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ChartOfAccountsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Account form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Asset');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getChartOfAccounts();
      setAccounts(data);
    } catch {
      toast.error(t('Failed to load Chart of Accounts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchQuery = !query ||
        a.accountCode.toLowerCase().includes(query.toLowerCase()) ||
        a.accountName.toLowerCase().includes(query.toLowerCase());
      const matchType = typeFilter === 'all' || a.accountType === typeFilter;
      return matchQuery && matchType;
    });
  }, [accounts, query, typeFilter]);

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error(t('Account code and name are required.'));
      return;
    }
    const created: ChartOfAccount = {
      id: `COA-${Date.now()}`,
      accountCode: code,
      accountName: name,
      accountType: type as AccountType,
      isControlAccount: false,
      currency: 'USD',
      currentBalance: 0,
      isActive: true
    };
    setAccounts([created, ...accounts]);
    toast.success(`${t('Created General Ledger account')}: ${code} - ${name}`);
    setCode('');
    setName('');
    setShowCreateModal(false);
  };

  const totalAssets = useMemo(() => accounts.filter(a => a.accountType === 'Asset').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalLiabilities = useMemo(() => accounts.filter(a => a.accountType === 'Liability').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalEquity = useMemo(() => accounts.filter(a => a.accountType === 'Equity').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalRevenue = useMemo(() => accounts.filter(a => a.accountType === 'Revenue').reduce((s, x) => s + x.currentBalance, 0), [accounts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'assets',
      title: t('Total Assets (Series 1000)'),
      value: `$${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Bank accounts, mobile wallets, cash & AR balances'),
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      isActive: typeFilter === 'Asset',
      onClick: () => setTypeFilter(typeFilter === 'Asset' ? 'all' : 'Asset')
    },
    {
      id: 'liabilities',
      title: t('Total Liabilities (Series 2000)'),
      value: `$${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Vendor payables, claims & prepaid tuition'),
      trendDirection: 'neutral',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      isActive: typeFilter === 'Liability',
      onClick: () => setTypeFilter(typeFilter === 'Liability' ? 'all' : 'Liability')
    },
    {
      id: 'equity',
      title: t('Institutional Equity (Series 3000)'),
      value: `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('School capital reserves & Waqf endowment fund'),
      trendDirection: 'up',
      icon: <Scale className="w-5 h-5 text-sky-400" />,
      isActive: typeFilter === 'Equity',
      onClick: () => setTypeFilter(typeFilter === 'Equity' ? 'all' : 'Equity')
    },
    {
      id: 'revenue',
      title: t('YTD Revenue (Series 4000)'),
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Tuition collections, waqf donations & fee revenue'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      isActive: typeFilter === 'Revenue',
      onClick: () => setTypeFilter(typeFilter === 'Revenue' ? 'all' : 'Revenue')
    }
  ];

  const columns = useMemo<ColumnDef<ChartOfAccount, any>[]>(() => [
    {
      accessorKey: 'accountCode',
      header: t('Account Code & Name'),
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
      header: t('Classification'),
      cell: ({ row }) => {
        const type = row.original.accountType;
        const color = type === 'Asset' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          type === 'Liability' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
          type === 'Equity' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
          type === 'Revenue' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
          'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            {t(type)}
          </span>
        );
      }
    },
    {
      accessorKey: 'currentBalance',
      header: t('Live GL Balance ($ USD)'),
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          ${row.original.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'isActive',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
      title={t('SAP S/4HANA-Grade Chart of Accounts (COA) Console')}
      description={t('Standard institutional chart of accounts for double-entry bookkeeping across all school partitions.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Chart of Accounts') }]}
      icon={<Scale className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredAccounts.length}
      recordLabel={t('GL Accounts')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(accounts, 'chart_of_accounts.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('Create GL Account')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
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
        <Link href="/finance/accounting/accounts" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Bank Reconciliations')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search GL accounts by code or name...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Chart of Accounts refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        createButtonLabel={t('New GL Account')}
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredAccounts}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedAccount(row)}
        onRowClick={(row) => setSelectedAccount(row)}
        emptyStateProps={{
          title: t('No GL Accounts Found'),
          description: t('No General Ledger accounts match your query.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); },
          createLabel: t('Create First Account'),
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">{t('Create General Ledger Account')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Account Code (e.g. 1050, 2040, 5070)')}</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="1050"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Account Title / Name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Petty Cash"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Account Type')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Asset">{t('Asset (1000 Series)')}</option>
                  <option value="Liability">{t('Liability (2000 Series)')}</option>
                  <option value="Equity">{t('Equity (3000 Series)')}</option>
                  <option value="Revenue">{t('Revenue (4000 Series)')}</option>
                  <option value="Expense">{t('Expense (5000 Series)')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Save GL Account')}</button>
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
          role: `GL ${selectedAccount.accountType.toUpperCase()} ACCOUNT`,
          status: selectedAccount.isActive ? 'active' : 'inactive',
          email: `Classification: ${selectedAccount.accountType}`,
          phone: `Currency: ${selectedAccount.currency}`,
          department: `Normal Balance: ${selectedAccount.accountType === 'Asset' || selectedAccount.accountType === 'Expense' ? 'Debit' : 'Credit'}`,
          joinDate: selectedAccount.accountCode.slice(0, 1) + '000 Series',
          balance: `LIVE GL BALANCE: $${selectedAccount.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
