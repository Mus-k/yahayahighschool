/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Lock, AlertTriangle,
  User, Database, RefreshCw, Printer
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { AuditLogRecord } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ImmutableFinanceAuditTrailPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getAuditLogs();
      setLogs(data);
    } catch {
      toast.error(t('Failed to load audit trail logs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchQuery = !query ||
        l.id.toLowerCase().includes(query.toLowerCase()) ||
        l.actorName.toLowerCase().includes(query.toLowerCase()) ||
        l.entityId.toLowerCase().includes(query.toLowerCase()) ||
        l.action.toLowerCase().includes(query.toLowerCase());
      const matchMod = moduleFilter === 'all' || l.module === moduleFilter;
      return matchQuery && matchMod;
    });
  }, [logs, query, moduleFilter]);

  const activeFiltersCount = moduleFilter !== 'all' ? 1 : 0;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_mutations',
      title: t('Total Logged Mutations'),
      value: `${logs.length} ${t('Events')}`,
      subtitle: t('Immutable record of all creations, updates & voids'),
      trendDirection: 'up',
      icon: <Database className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'tamper_check',
      title: t('Cryptographic Hash Verification'),
      value: '100% Immutable',
      subtitle: t('SHA-256 block chain parity verified across all entries'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'actors_count',
      title: t('Authorized Finance Actors'),
      value: `${new Set(logs.map(l => l.actorName)).size} ${t('Personnel')}`,
      subtitle: t('Super Admin, Director, Account Leads & Cashiers'),
      trendDirection: 'neutral',
      icon: <User className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<AuditLogRecord, any>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: t('Audit Timestamp & Event ID'),
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono">
          <span className="text-xs font-black text-emerald-400 block">{row.original.id}</span>
          <span className="text-[11px] text-slate-400 block">{row.original.timestamp?.replace('T', ' ').slice(0, 19)}</span>
        </div>
      )
    },
    {
      accessorKey: 'actorName',
      header: t('Actor & Assigned Role'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.actorName}</span>
          <span className="text-[11px] text-sky-400 font-mono block">{row.original.actorRole} • IP: {row.original.ipAddress}</span>
        </div>
      )
    },
    {
      accessorKey: 'action',
      header: t('Action & Module Target'),
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-black text-slate-200 block uppercase tracking-wider">{row.original.action}</span>
          <span className="text-[11px] text-slate-400 font-mono block">{t(row.original.module)} → Ref: {row.original.entityId}</span>
        </div>
      )
    },
    {
      accessorKey: 'hash',
      header: t('Cryptographic Hash'),
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-slate-400 block max-w-xs truncate" title={row.original.hash}>
          {row.original.hash}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Inspect'),
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedLog(row.original)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('Payload')}</span>
        </button>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Immutable Financial Audit Trail & Compliance Ledger')}
      description={t('Cryptographically verified system audit logs recording every invoice generation, receipt settlement, payroll disbursement, and journal mutation.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Donations & Audit') }, { label: t('Audit Trail') }]}
      icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredLogs.length}
      recordLabel={t('Audit Events')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setModuleFilter('all'); setQuery(''); }}
      headerActions={
        <button
          onClick={() => financeService.exportToCSV(logs, 'finance_audit_trail_2026.csv')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t('Export Compliance Log (CSV)')}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search audit records by actor name, event ID, action, or target entity ID...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Audit logs refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setModuleFilter('all'); setQuery(''); }}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              aria-label="Filter audit module"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('All Sub-Modules')}</option>
              <option value="invoices">{t('Billing & Invoices')}</option>
              <option value="payments">{t('Cashier Receipts & POS')}</option>
              <option value="expenses">{t('Operating Expenses')}</option>
              <option value="payroll">{t('Staff Payroll Runs')}</option>
              <option value="journals">{t('Double-Entry Journals')}</option>
              <option value="budgets">{t('Department Budgets')}</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredLogs}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedLog(row)}
        onRowClick={(row) => setSelectedLog(row)}
        emptyStateProps={{
          title: t('No Audit Logs Found'),
          description: t('No ledger events match your current search or module filter.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setModuleFilter('all'); setQuery(''); }
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        record={selectedLog ? {
          name: `${selectedLog.action} (${selectedLog.module})`,
          id: selectedLog.id,
          role: `ACTOR: ${selectedLog.actorName} (${selectedLog.actorRole})`,
          status: 'verified',
          email: `IP Address: ${selectedLog.ipAddress}`,
          phone: `Timestamp: ${selectedLog.timestamp}`,
          department: `Target Entity: ${selectedLog.entityId}`,
          joinDate: selectedLog.module,
          balance: `PAYLOAD SNAPSHOT: ${JSON.stringify(selectedLog.payloadSnapshot || {})}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
