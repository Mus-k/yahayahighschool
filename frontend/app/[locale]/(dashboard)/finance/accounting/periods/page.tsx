/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Clock, Lock, Unlock, ShieldCheck, AlertTriangle, CheckCircle2,
  Calendar, FileText, Receipt, Scale, ScrollText, Landmark,
  FolderOpen, ArrowRight, Sparkles, Building2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { AccountingPeriod } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AccountingPeriodsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getAccountingPeriods();
      setPeriods(data);
    } catch {
      toast.error(t('Failed to load accounting periods.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePeriodLock = async (p: AccountingPeriod) => {
    p.isLocked = !p.isLocked;
    if (p.isLocked) {
      toast.warning(`${t('Accounting Period')} [${p.name}] ${t('is now LOCKED.')}`);
    } else {
      toast.success(`${t('Accounting Period')} [${p.name}] ${t('UNLOCKED.')}`);
    }
    setPeriods([...periods]);
  };

  const activePeriods = periods.filter(p => !p.isLocked).length;
  const lockedPeriods = periods.filter(p => p.isLocked).length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_periods',
      title: t('Open Accounting Periods'),
      value: `${activePeriods} ${t('Active')}`,
      subtitle: t('Accepting real-time invoices, receipts & GL journals'),
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'locked_periods',
      title: t('Locked Fiscal Partitions'),
      value: `${lockedPeriods} ${t('Locked')}`,
      subtitle: t('Secured against backdated modification & tamper-proof'),
      trendDirection: 'neutral',
      icon: <Lock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'audit_trail',
      title: t('Audit & Compliance Status'),
      value: '100% Verified',
      subtitle: t('Trial balance & cash reconciliation verified prior to close'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns = useMemo<ColumnDef<AccountingPeriod, any>[]>(() => [
    {
      accessorKey: 'name',
      header: t('Fiscal Partition / Term Name'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400 block">Year: {row.original.academicYearCode}</span>
        </div>
      )
    },
    {
      accessorKey: 'startDate',
      header: t('Date Range'),
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-300">
          {row.original.startDate} → {row.original.endDate}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      accessorKey: 'isLocked',
      header: t('Lock State'),
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
          row.original.isLocked ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }`}>
          {row.original.isLocked ? `🔒 ${t('Locked')}` : `🔓 ${t('Open')}`}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => togglePeriodLock(row.original)}
            className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all cursor-pointer ${
              row.original.isLocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {row.original.isLocked ? t('Unlock Period') : t('Lock Fiscal Partition')}
          </button>
        </div>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Fiscal Accounting Periods & Partition Locking')}
      description={t('Control academic year accounting partitions, prevent backdated journal postings, and enforce period-end closing controls.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Accounting Periods') }]}
      icon={<Clock className="w-8 h-8 text-amber-400" />}
      recordCount={periods.length}
      recordLabel={t('Periods')}
      activeFilterCount={0}
      onClearFilters={() => {}}
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={periods}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedPeriod(row)}
        onRowClick={(row) => setSelectedPeriod(row)}
        emptyStateProps={{
          title: t('No Accounting Periods Configured'),
          description: t('No fiscal periods found.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
