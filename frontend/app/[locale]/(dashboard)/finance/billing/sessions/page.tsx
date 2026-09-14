/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  PiggyBank, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, ShieldCheck, AlertTriangle,
  Lock, Unlock, RefreshCw, Printer, UserCheck, ScrollText
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { CashierSession } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CashierSessionsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getCashierSessions();
      setSessions(data);
    } catch {
      toast.error(t('Failed to load cashier sessions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchQuery = !query ||
        (s.sessionNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.cashierName || '').toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [sessions, query, statusFilter]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(openingCash || '0');
    const cashierName = (user as any)?.name || user?.username || 'Finance Cashier';

    try {
      const newSession: CashierSession = {
        id: `CSH-${Date.now()}`,
        sessionNumber: `CSH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        cashierId: String(user?.id || '1'),
        cashierName,
        openedAt: new Date().toISOString(),
        openingCash: amountNum,
        totalCollections: 0,
        expectedClosingCash: amountNum,
        variance: 0,
        status: 'open'
      };

      setSessions([newSession, ...sessions]);
      toast.success(`${t('Opened Cashier Session')} ${newSession.sessionNumber} with $${newSession.openingCash.toFixed(2)} float.`);
      setOpeningCash('');
      setShowOpenModal(false);
    } catch {
      toast.error(t('Failed to open cashier session'));
    }
  };

  const handleCloseSession = async (session: CashierSession) => {
    if (session.status !== 'open') return;
    session.status = 'closed';
    session.closedAt = new Date().toISOString();
    setSessions([...sessions]);
    toast.success(`${t('Reconciled and closed Cashier Session')} ${session.sessionNumber}.`);
  };

  const activeSessionsCount = sessions.filter(s => s.status === 'open').length;
  const totalCashCollectedToday = sessions.filter(s => s.status === 'open').reduce((sum, s) => sum + (Number(s.totalCollections) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_sessions',
      title: t('Open Cashier Sessions'),
      value: `${activeSessionsCount} ${t('Sessions')}`,
      subtitle: t('Campus cashier terminal drawers active'),
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-emerald-400" />,
      onClick: () => setStatusFilter('open')
    },
    {
      id: 'drawer_collections',
      title: t('Current Open Drawer Collections'),
      value: `$${totalCashCollectedToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Cash, POS card, and physical cheque receipts today'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'reconciled_history',
      title: t('Reconciled Drawer Sessions'),
      value: `${sessions.filter(s => s.status === 'closed').length} ${t('Closed')}`,
      subtitle: t('Reconciliation variance audits stored'),
      trendDirection: 'neutral',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />,
      onClick: () => setStatusFilter('closed')
    }
  ];

  const columns = useMemo<ColumnDef<CashierSession, any>[]>(() => [
    {
      accessorKey: 'sessionNumber',
      header: t('Session ID & Cashier'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.sessionNumber}</span>
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.cashierName}</span>
        </div>
      )
    },
    {
      accessorKey: 'openedAt',
      header: t('Timing & Float'),
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs font-mono">
          <span className="text-slate-300 block">{t('Opened')}: {row.original.openedAt ? row.original.openedAt.split('T')[0] : '---'}</span>
          <span className="text-[11px] text-slate-400 block">{t('Opening Float')}: ${(Number(row.original.openingCash) || 0).toFixed(2)}</span>
        </div>
      )
    },
    {
      accessorKey: 'totalCollections',
      header: `${t('Total Collections')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          +${(Number(row.original.totalCollections) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Session Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {s.status === 'open' && (
              <button
                onClick={() => handleCloseSession(s)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-black text-xs transition-all border border-rose-500/40 shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('Reconcile & Close')}</span>
              </button>
            )}
            <button
              onClick={() => setSelectedSession(s)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              {t('Inspect')}
            </button>
          </div>
        );
      }
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Cashier Terminal Sessions & Drawer Reconciliation')}
      description={t('Manage open cashier drawers, track POS cash collections, calculate end-of-day reconciliation variances, and seal audit records.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Cashier Sessions') }]}
      icon={<PiggyBank className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredSessions.length}
      recordLabel={t('Sessions')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/payments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>{t('Payment Reception')}</span>
          </Link>
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Open Cashier Session')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link href="/finance/billing/sessions" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <PiggyBank className="w-3.5 h-3.5" />
          <span>{t('Cashier Sessions')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search sessions by session ID or cashier name...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Cashier sessions refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel={t('+ Open Session')}
        onCreate={() => setShowOpenModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredSessions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedSession(row)}
        onRowClick={(row) => setSelectedSession(row)}
        emptyStateProps={{
          title: t('No Cashier Sessions Found'),
          description: t('No drawer sessions match your filter criteria.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: t('Open First Session'),
          onCreate: () => setShowOpenModal(true)
        }}
      />

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Unlock className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">{t('Open New Cashier Terminal Drawer')}</h3>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Assigned Cashier Officer')}</label>
                <input
                  type="text"
                  readOnly
                  value={(user as any)?.name || user?.username || 'Finance Cashier'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Initial Opening Cash Float ($ USD)')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="200"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowOpenModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Open Drawer & Start Session')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        record={selectedSession ? {
          name: selectedSession.sessionNumber,
          id: selectedSession.id,
          role: `CASHIER: ${selectedSession.cashierName}`,
          status: selectedSession.status,
          email: `Opened: ${selectedSession.openedAt}`,
          phone: `Float: $${(Number(selectedSession.openingCash) || 0).toFixed(2)}`,
          department: `Collections: $${(Number(selectedSession.totalCollections) || 0).toFixed(2)}`,
          joinDate: selectedSession.status,
          balance: `DRAWER TOTAL: $${((Number(selectedSession.openingCash) || 0) + (Number(selectedSession.totalCollections) || 0)).toFixed(2)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
