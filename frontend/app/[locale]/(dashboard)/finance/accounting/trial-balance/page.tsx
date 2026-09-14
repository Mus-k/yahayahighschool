/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Scale, Download, Printer, CheckCircle2, AlertTriangle,
  Landmark, FileText, ScrollText, Clock, FolderOpen
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { toast } from 'sonner';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debitBalance: number;
  creditBalance: number;
}

export default function TrialBalancePage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getChartOfAccounts();
      setCoa(data);
    } catch {
      toast.error(t('Failed to load Trial Balance.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tbRows = useMemo<TrialBalanceRow[]>(() => {
    return coa.map(a => {
      let deb = 0;
      let cred = 0;
      if (a.accountType === 'Asset' || a.accountType === 'Expense') {
        deb = a.currentBalance >= 0 ? a.currentBalance : 0;
        cred = a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0;
      } else {
        cred = a.currentBalance >= 0 ? a.currentBalance : 0;
        deb = a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0;
      }
      return {
        code: a.accountCode,
        name: a.accountName,
        type: a.accountType,
        debitBalance: deb,
        creditBalance: cred
      };
    });
  }, [coa]);

  const totalDebits = useMemo(() => tbRows.reduce((s, r) => s + r.debitBalance, 0), [tbRows]);
  const totalCredits = useMemo(() => tbRows.reduce((s, r) => s + r.creditBalance, 0), [tbRows]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'tb_debits',
      title: t('Total System Trial Debits'),
      value: `$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Combined Asset & Expense normal balances'),
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'tb_credits',
      title: t('Total System Trial Credits'),
      value: `$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Combined Liability, Equity & Revenue normal balances'),
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'tb_variance',
      title: t('Trial Balance Equilibrium'),
      value: Math.abs(totalDebits - totalCredits) < 0.01 ? t('100% BALANCED') : t('OUT OF BALANCE'),
      subtitle: Math.abs(totalDebits - totalCredits) < 0.01 ? t('Zero variance detected across all GL accounts') : t('Audit intervention required'),
      trendDirection: Math.abs(totalDebits - totalCredits) < 0.01 ? 'up' : 'down',
      icon: Math.abs(totalDebits - totalCredits) < 0.01 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
    }
  ];

  const columns = useMemo<ColumnDef<TrialBalanceRow, any>[]>(() => [
    {
      accessorKey: 'code',
      header: t('Account Code & Name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-mono">
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-black text-xs">{row.original.code}</span>
          <span className="font-bold text-white text-xs sm:text-sm">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: t('Classification'),
      cell: ({ row }) => <span className="text-xs font-bold text-slate-300 uppercase font-mono">{t(row.original.type)}</span>
    },
    {
      accessorKey: 'debitBalance',
      header: `${t('Debit Balance')} (DR $)`,
      cell: ({ row }) => (
        <span className={`font-mono text-xs sm:text-sm font-black ${row.original.debitBalance > 0 ? 'text-sky-400' : 'text-slate-600'}`}>
          {row.original.debitBalance > 0 ? `$${row.original.debitBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
        </span>
      )
    },
    {
      accessorKey: 'creditBalance',
      header: `${t('Credit Balance')} (CR $)`,
      cell: ({ row }) => (
        <span className={`font-mono text-xs sm:text-sm font-black ${row.original.creditBalance > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
          {row.original.creditBalance > 0 ? `$${row.original.creditBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
        </span>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('System Trial Balance Statement')}
      description={t('SAP S/4HANA equilibrium verification. Aggregates all ending General Ledger debit balances against credit balances to certify trial balance accuracy.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Trial Balance') }]}
      icon={<Scale className="w-8 h-8 text-sky-400" />}
      recordCount={tbRows.length}
      recordLabel={t('Accounts')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(tbRows, 'trial_balance_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Official TB')}</span>
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
        <Link href="/finance/accounting/trial-balance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          <span>{t('Trial Balance Statement')}</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={tbRows}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Trial Balance Data'),
          description: t('No GL accounts exist.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
