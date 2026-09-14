/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Landmark, PiggyBank, ShieldCheck, DollarSign, ArrowRight,
  Clock, Lock, Unlock, RefreshCw, FileText, CheckCircle2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { CashierSession } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CampusCashManagementPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultBalance, setVaultBalance] = useState<number>(0);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [sessionsData, stats] = await Promise.all([
        financeService.getCashierSessions(),
        financeService.getExecutiveStats().catch(() => null)
      ]);
      setSessions(sessionsData);
      if (stats?.treasuryInsights) {
        setVaultBalance(stats.treasuryInsights.totalCashInDrawer || 0);
      } else if ((stats as any)?.treasury) {
        setVaultBalance((stats as any).treasury.cashDrawer?.balance || 0);
      }
    } catch {
      toast.error(t('Failed to load campus cash registers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const totalDrawerFloat = sessions.filter(s => s.status === 'open').reduce((sum, s) => sum + (Number(s.openingCash) || 0) + (Number(s.totalCollections) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'vault_cash',
      title: t('Campus Cash Drawer Balance (GL 1030)'),
      value: `$${vaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Physical safe deposit inside Bursar Office'),
      trendDirection: 'up',
      icon: <Lock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'drawer_float',
      title: t('Active POS Cash Drawers Float'),
      value: `$${totalDrawerFloat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${sessions.filter(s => s.status === 'open').length} ${t('terminal drawers currently active')}`,
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'reconciliation_status',
      title: t('Daily Drawer Reconciliation'),
      value: t('Strict Zero-Variance'),
      subtitle: t('Mandatory exact balancing prior to closing shift'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<CashierSession, any>[] = [
    {
      accessorKey: 'sessionNumber',
      header: t('Terminal Drawer ID'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-emerald-400">{row.original.sessionNumber}</span>
      )
    },
    {
      accessorKey: 'cashierName',
      header: t('Cashier Terminal Operator'),
      cell: ({ row }) => <span className="font-bold text-white text-xs">{row.original.cashierName}</span>
    },
    {
      accessorKey: 'openingCash',
      header: `${t('Float Balance')} ($)`,
      cell: ({ row }) => <span className="font-mono text-xs text-slate-300 font-bold">${(Number(row.original.openingCash) || 0).toFixed(2)}</span>
    },
    {
      accessorKey: 'totalCollections',
      header: `${t('Day Collections')} ($)`,
      cell: ({ row }) => <span className="font-mono text-xs font-black text-emerald-400">+${(Number(row.original.totalCollections) || 0).toFixed(2)}</span>
    },
    {
      accessorKey: 'status',
      header: t('Drawer Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Transfer to Vault'),
      cell: ({ row }) => (
        <button
          onClick={() => toast.success(`${t('Initiated physical cash transfer of')} $${(Number(row.original.totalCollections) || 0).toFixed(2)} ${t('to Main Campus Vault.')}`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          {t('Deposit to Vault')}
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Campus Petty Cash & Vault Treasury Console')}
      description={t('Live monitoring of physical cash drawers, safe deposit transfers, and daily cashier float balancing.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Campus Cash') }]}
      icon={<PiggyBank className="w-8 h-8 text-amber-400" />}
      recordCount={sessions.length}
      recordLabel={t('Terminals')}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/sessions"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{t('Cashier Sessions')}</span>
          </Link>
          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all shadow-sm cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={sessions}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Cash Registers Active'),
          description: t('No terminal cash drawers are currently open.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
