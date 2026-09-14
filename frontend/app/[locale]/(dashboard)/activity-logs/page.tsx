/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  AlignLeft, Search, Filter, Download, RefreshCw, Eye,
  ShieldCheck, AlertTriangle, UserCheck, Clock, Activity,
  Layers, FileText, CheckCircle2, ShieldAlert, Cpu, Sparkles,
  ExternalLink, Calendar, X, Globe, Terminal, ChevronRight, DollarSign
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { auditService, type ActivityItem } from '@/services/audit.service';
import { financeService } from '@/services/finance.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ActivityLogsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Inspection
  const [inspectedActivity, setInspectedActivity] = useState<ActivityItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await auditService.getActivityLogs();
      setActivities(data || []);
    } catch {
      toast.error(t('Failed to load user activity logs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  // Relative Time Formatter
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return t('Just now');
      if (diffMin < 60) return `${diffMin} ${t('mins ago')}`;
      if (diffHour < 24) return `${diffHour} ${t('hours ago')}`;
      if (diffDay === 1) return t('Yesterday');
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Filtered dataset
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const u = (act.user || '').toLowerCase();
      const a = (act.action || '').toLowerCase();
      const tg = (act.target || '').toLowerCase();
      const r = (act.role || '').toLowerCase();
      const ip = (act.ipAddress || '').toLowerCase();
      const q = query.toLowerCase();

      const matchQuery = !query || u.includes(q) || a.includes(q) || tg.includes(q) || r.includes(q) || ip.includes(q);
      const matchModule = selectedModule === 'all' || act.module === selectedModule;
      const matchSeverity = selectedSeverity === 'all' || act.severity === selectedSeverity;
      const matchRole = selectedRole === 'all' || act.role === selectedRole;

      return matchQuery && matchModule && matchSeverity && matchRole;
    });
  }, [activities, query, selectedModule, selectedSeverity, selectedRole]);

  const activeFiltersCount = [
    selectedModule !== 'all',
    selectedSeverity !== 'all',
    selectedRole !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  const handleExportCSV = () => {
    const exportRows = filteredActivities.map(act => ({
      ID: act.id,
      Timestamp: act.timestamp,
      User: act.user,
      Role: act.role,
      Module: act.module,
      Action: act.action,
      Target: act.target || '',
      Severity: act.severity,
      IPAddress: act.ipAddress || '127.0.0.1'
    }));
    financeService.exportToCSV(exportRows, `system-activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(t('Activity logs exported to CSV successfully'));
  };

  // Distinct Filter Options
  const distinctModules = useMemo(() => Array.from(new Set(activities.map(a => a.module).filter(Boolean))), [activities]);
  const distinctRoles = useMemo(() => Array.from(new Set(activities.map(a => a.role).filter(Boolean))), [activities]);

  // KPI Calculations
  const criticalCount = useMemo(() => activities.filter(a => a.severity === 'critical' || a.severity === 'high').length, [activities]);
  const uniqueActors = useMemo(() => new Set(activities.map(a => a.user).filter(Boolean)).size, [activities]);
  const topModule = useMemo(() => {
    if (activities.length === 0) return 'System';
    const counts: Record<string, number> = {};
    activities.forEach(a => { counts[a.module] = (counts[a.module] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Directory';
  }, [activities]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_events',
      title: t('Total User Activity Events'),
      value: String(activities.length),
      subtitle: `${uniqueActors} ${t('active authenticated users recorded')}`,
      trendDirection: 'up',
      icon: <Activity className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'active_actors',
      title: t('Active Administrative Actors'),
      value: `${uniqueActors} ${t('Actors')}`,
      subtitle: t('Super Admins, Directors, Faculty & Bursar staff'),
      trendDirection: 'up',
      icon: <UserCheck className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'security_flags',
      title: t('High Severity Mutations'),
      value: `${criticalCount} ${t('Events')}`,
      subtitle: t('Permission escalations & critical record modifications'),
      trendDirection: criticalCount > 0 ? 'down' : 'up',
      icon: <ShieldAlert className={`w-5 h-5 ${criticalCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
    },
    {
      id: 'dominant_module',
      title: t('Dominant Activity Stream'),
      value: topModule,
      subtitle: t('Highest volume workflow partition'),
      trendDirection: 'neutral',
      icon: <Layers className="w-5 h-5 text-amber-400" />
    }
  ];

  const getModuleBadge = (mod: string) => {
    switch (mod.toLowerCase()) {
      case 'directory': return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
      case 'finance': return 'bg-amber-950/60 text-amber-300 border-amber-800';
      case 'lms': return 'bg-sky-950/60 text-sky-300 border-sky-800';
      case 'qms': return 'bg-purple-950/60 text-purple-300 border-purple-800';
      case 'security': return 'bg-rose-950/60 text-rose-300 border-rose-800';
      case 'hostel': return 'bg-teal-950/60 text-teal-300 border-teal-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'info': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const columns = useMemo<ColumnDef<ActivityItem, any>[]>(() => [
    {
      accessorKey: 'user',
      header: t('Actor & Role'),
      cell: ({ row }) => {
        const act = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center font-black text-xs text-emerald-400">
              {act.user.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-white text-xs sm:text-sm block">{act.user}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                {act.role}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'action',
      header: t('Activity & Mutation Description'),
      cell: ({ row }) => {
        const act = row.original;
        return (
          <div className="space-y-0.5 max-w-md">
            <p className="text-xs font-semibold text-slate-200 leading-snug">{act.action}</p>
            {act.target && (
              <span className="text-[11px] font-mono text-emerald-400/90 block truncate">
                Target: {act.target}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'module',
      header: t('Module'),
      cell: ({ row }) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border font-mono ${getModuleBadge(row.original.module)}`}>
          {row.original.module}
        </span>
      )
    },
    {
      accessorKey: 'severity',
      header: t('Severity'),
      cell: ({ row }) => (
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getSeverityBadge(row.original.severity)}`}>
          {row.original.severity}
        </span>
      )
    },
    {
      accessorKey: 'timestamp',
      header: t('Time & Relative'),
      cell: ({ row }) => (
        <div className="text-right sm:text-left space-y-0.5">
          <span className="text-xs font-mono font-bold text-white block">{formatTimeAgo(row.original.timestamp)}</span>
          <span className="text-[10px] font-mono text-slate-400 block">
            {new Date(row.original.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      id: 'actions',
      header: t('Inspect'),
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInspectedActivity(row.original);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('Details')}</span>
        </button>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Enterprise User Activity & Workflow Stream')}
      description={t('Live real-time stream of all user interactions, administrative operations, academic mark submissions, and financial authorizations across Yahaya School ERP.')}
      breadcrumbs={[{ label: t('System Admin') }, { label: t('Audit & Security') }, { label: t('Activity Logs') }]}
      icon={<AlignLeft className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredActivities.length}
      recordLabel={t('Activity Events')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedModule('all');
        setSelectedSeverity('all');
        setSelectedRole('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Table Grid')}
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timeline' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Timeline Stream')}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => {
              loadData();
              toast.success(t('Activity stream refreshed'));
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('Live Refresh')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Quick Navigation / Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/activity-logs" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5" />
          <span>{t('User Activity Stream')}</span>
        </Link>
        <Link href="/audit-logs" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Security & Immutable Audit')}</span>
        </Link>
        <Link href="/finance/audit" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('Finance GL Audit Trail')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search live activities by user name, action, target resource, or IP address...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Activity stream refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedModule('all');
          setSelectedSeverity('all');
          setSelectedRole('all');
        }}
        createButtonLabel={t('Export Activity Log')}
        onCreate={handleExportCSV}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Module Filter */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              aria-label="Filter by System Module"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Modules')}</option>
              {distinctModules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by Severity"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Severities')}</option>
              <option value="info">{t('Info')}</option>
              <option value="normal">{t('Normal')}</option>
              <option value="warning">{t('Warning')}</option>
              <option value="high">{t('High')}</option>
              <option value="critical">{t('Critical')}</option>
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              aria-label="Filter by Actor Role"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Roles')}</option>
              {distinctRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        }
      />

      {viewMode === 'grid' ? (
        <EnterpriseDataGrid
          data={filteredActivities}
          columns={columns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setInspectedActivity(row)}
          onRowClick={(row) => setInspectedActivity(row)}
          emptyStateProps={{
            title: t('No Activity Logs Found'),
            description: t('No activity events match your search or filter criteria.'),
            isFilterActive: activeFiltersCount > 0,
            onResetFilters: () => {
              setQuery('');
              setSelectedModule('all');
              setSelectedSeverity('all');
              setSelectedRole('all');
            }
          }}
        />
      ) : (
        /* Timeline View */
        <div className="space-y-4 pt-2">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="font-bold text-sm">{t('No activity events recorded.')}</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setInspectedActivity(act)}
                  className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-md group cursor-pointer"
                >
                  {/* Timeline Node Point */}
                  <div className="absolute -left-6 sm:-left-8 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500 group-hover:scale-125 transition-transform" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{act.user}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {act.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getModuleBadge(act.module)}`}>
                        {act.module}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 font-bold">{formatTimeAgo(act.timestamp)}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-200 leading-relaxed">{act.action}</p>

                  <div className="flex items-center justify-between gap-4 mt-3 pt-2 text-xs font-mono text-slate-400">
                    <span>{act.target ? `Target: ${act.target}` : `IP: ${act.ipAddress || '127.0.0.1'}`}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {t('Inspect Details')} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Details Inspector Modal */}
      {inspectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{t('Activity Event Details & Audit Trail')}</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {inspectedActivity.id}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectedActivity(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actor Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center font-black text-emerald-300 text-sm">
                  {inspectedActivity.user.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-black text-white text-base block">{inspectedActivity.user}</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">{inspectedActivity.role}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getSeverityBadge(inspectedActivity.severity)}`}>
                {inspectedActivity.severity.toUpperCase()}
              </span>
            </div>

            {/* Event Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">{t('Target Resource')}</span>
                <span className="text-white font-bold block truncate">{inspectedActivity.target || t('System Core')}</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">{t('Functional Module')}</span>
                <span className="text-emerald-400 font-bold block">{inspectedActivity.module}</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">{t('Timestamp (ISO 8601)')}</span>
                <span className="text-white font-bold block">{new Date(inspectedActivity.timestamp).toLocaleString()}</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">{t('IP Address & Client')}</span>
                <span className="text-sky-400 font-bold block truncate">{inspectedActivity.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Action Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Action Payload Description')}</h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-mono">
                {inspectedActivity.action}
              </div>
            </div>

            {/* Metadata Diff viewer if present */}
            {inspectedActivity.metadata && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  {t('Event Metadata Snapshot')}
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono overflow-x-auto max-h-40">
                  {JSON.stringify(inspectedActivity.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectedActivity(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
