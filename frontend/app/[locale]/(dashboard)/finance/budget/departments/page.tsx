/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Building2, PieChart, ShieldCheck, Clock, DollarSign,
  AlertTriangle, ArrowRight, CheckCircle2, Plus
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { DepartmentalBudget } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DepartmentLineItemControlPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [budgets, setBudgets] = useState<DepartmentalBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const data = await financeService.getBudgets();
        setBudgets(data);
      } catch {
        toast.error(t('Failed to load departmental line item allocations.'));
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  const totalAllocated = budgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (Number(b.spentAmount) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'allocated',
      title: t('Total Line Item Allocation Ceiling'),
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} ${t('institutional departments')}`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'spent',
      title: t('Real-Time Line Item Drawdown'),
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% ${t('total drawdown')}`,
      trendDirection: 'neutral',
      icon: <PieChart className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'governance',
      title: t('Line Item Transfer Governance'),
      value: t('Restricted (HOD/Director)'),
      subtitle: t('Mandatory approval for inter-department budget reallocations'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<DepartmentalBudget, any>[] = [
    {
      accessorKey: 'departmentName',
      header: t('Department & Cost Center HOD'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs block">{row.original.departmentName}</span>
          <span className="text-[11px] text-slate-400 font-mono block">HOD: {row.original.headOfDepartment}</span>
        </div>
      )
    },
    {
      accessorKey: 'allocatedAmount',
      header: `${t('Line Item Allocation')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          ${(Number(row.original.allocatedAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'spentAmount',
      header: `${t('Disbursed Drawdown')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
          ${(Number(row.original.spentAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'remainingAmount',
      header: `${t('Available Line Capacity')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${(Number(row.original.remainingAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Capacity Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Departmental Line Item Fiscal Control')}
      description={t('Granular sub-ledger spending constraints, preventing department budget overflows across academic disciplines.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Payroll & Budget'), href: '/finance/budget' }, { label: t('Department Control') }]}
      icon={<Building2 className="w-8 h-8 text-sky-400" />}
      recordCount={budgets.length}
      recordLabel={t('Departments')}
      headerActions={
        <Link
          href="/finance/budget"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
        >
          ← {t('Back to Global Budget')}
        </Link>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={budgets}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Department Line Items Found'),
          description: t('No departmental cost centers found.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
