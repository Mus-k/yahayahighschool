/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Award, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, HeartHandshake, Sparkles,
  ArrowRight, ShieldCheck, User, Building2, Layers
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { Scholarship } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ScholarshipsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Scholarship form state - clean empty defaults
  const [name, setName] = useState('');
  const [type, setType] = useState<'merit' | 'need' | 'waqf_sponsored' | 'staff_child'>('waqf_sponsored');
  const [coveragePercentage, setCoveragePercentage] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [totalAllocated, setTotalAllocated] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getScholarships();
      setScholarships(data);
    } catch {
      toast.error(t('Failed to load scholarship grants.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredScholarships = useMemo(() => {
    return scholarships.filter(s => {
      const matchQuery = !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.sponsorName && s.sponsorName.toLowerCase().includes(query.toLowerCase()));
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [scholarships, query, typeFilter]);

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coveragePercentage) {
      toast.error(t('Grant title and coverage percentage are required.'));
      return;
    }
    const coverageNum = parseFloat(coveragePercentage || '100');
    const allocNum = parseFloat(totalAllocated || '0');

    try {
      const created = await financeService.createScholarship({
        name,
        type,
        coveragePercentage: coverageNum,
        maxAmount: allocNum,
        sponsorName: sponsorName || undefined,
        totalAllocated: allocNum,
        totalDisbursed: 0,
        activeRecipientsCount: 0
      });

      setScholarships([created, ...scholarships]);
      toast.success(`${t('Created scholarship grant')}: ${created.name}`);
      setName('');
      setCoveragePercentage('');
      setSponsorName('');
      setTotalAllocated('');
      setShowCreateModal(false);
    } catch {
      toast.error(t('Failed to create scholarship grant'));
    }
  };

  const totalFundAllocated = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.totalAllocated) || 0), 0), [scholarships]);
  const totalFundDisbursed = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.totalDisbursed) || 0), 0), [scholarships]);
  const totalScholarsBenefiting = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.activeRecipientsCount) || 0), 0), [scholarships]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_fund',
      title: t('Total Waqf & Scholarship Fund'),
      value: `$${totalFundAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${scholarships.length} ${t('active institutional endowment grants')}`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'disbursed',
      title: t('Disbursed to Student Accounts'),
      value: `$${totalFundDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${totalFundAllocated > 0 ? ((totalFundDisbursed / totalFundAllocated) * 100).toFixed(1) : 0}% ${t('utilization rate')}`,
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'recipients',
      title: t('Active Beneficiaries (Scholars)'),
      value: `${totalScholarsBenefiting} ${t('Scholars')}`,
      subtitle: t('Full and partial tuition waiver recipients'),
      trendDirection: 'up',
      icon: <User className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'sponsors',
      title: t('Endowment Grant Sponsors'),
      value: `${scholarships.filter(s => s.sponsorName).length} ${t('Partners')}`,
      subtitle: t('Waqf institutions and private benefactors'),
      trendDirection: 'neutral',
      icon: <Building2 className="w-5 h-5 text-indigo-400" />
    }
  ];

  const columns = useMemo<ColumnDef<Scholarship, any>[]>(() => [
    {
      accessorKey: 'name',
      header: t('Grant Name & Sponsor'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] text-slate-400 block font-mono">Sponsor: {row.original.sponsorName || t('School General Endowment')}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: t('Classification'),
      cell: ({ row }) => {
        const type = row.original.type;
        const color = type === 'merit' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
          type === 'need' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          type === 'staff_child' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
          'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            {t(type)}
          </span>
        );
      }
    },
    {
      accessorKey: 'coveragePercentage',
      header: t('Tuition Waiver Coverage'),
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          {row.original.coveragePercentage}% {t('Waiver')}
        </span>
      )
    },
    {
      accessorKey: 'totalAllocated',
      header: `${t('Endowment Pool')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white block">
          ${(Number(row.original.totalAllocated) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'activeRecipientsCount',
      header: t('Scholars Supported'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-300">
          {row.original.activeRecipientsCount} {t('Scholars')}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedScholarship(row.original)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('Inspect')}</span>
        </button>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Scholarships & Waqf Endowment Grants Console')}
      description={t('Configure merit grants, orphan sponsorships, and financial need fee exemptions. Automatically integrates into invoice generation.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Scholarships') }]}
      icon={<Award className="w-8 h-8 text-sky-400" />}
      recordCount={filteredScholarships.length}
      recordLabel={t('Grants')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/discounts"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('Discount Rules')}</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Create Scholarship Grant')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>{t('Scholarships & Grants')}</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('Discount Policies')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search scholarships by grant title or sponsor name...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Scholarship grants refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        createButtonLabel={t('+ New Grant')}
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredScholarships}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedScholarship(row)}
        onRowClick={(row) => setSelectedScholarship(row)}
        emptyStateProps={{
          title: t('No Scholarship Grants Found'),
          description: t('No grants or endowments match your filter criteria.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); },
          createLabel: t('Create First Grant'),
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Scholarship Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-black text-white">{t('Create Scholarship / Endowment Grant')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateScholarship} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Grant Title / Award Name')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hifz Excellence Grant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Grant Type')}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="waqf_sponsored">{t('Waqf Sponsored')}</option>
                    <option value="merit">{t('Merit Based')}</option>
                    <option value="need">{t('Financial Need')}</option>
                    <option value="staff_child">{t('Staff Child')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Tuition Waiver (%)')}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="100"
                    value={coveragePercentage}
                    onChange={(e) => setCoveragePercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Sponsor Organization')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Barakah Waqf"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Total Endowment Pool ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={totalAllocated}
                    onChange={(e) => setTotalAllocated(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Save Scholarship Grant')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedScholarship}
        onClose={() => setSelectedScholarship(null)}
        record={selectedScholarship ? {
          name: selectedScholarship.name,
          id: selectedScholarship.id,
          role: `SCHOLARSHIP (${selectedScholarship.type.toUpperCase()})`,
          status: 'active',
          email: `Sponsor: ${selectedScholarship.sponsorName || 'General Endowment'}`,
          phone: `Coverage: ${selectedScholarship.coveragePercentage}% Tuition Waiver`,
          department: `Recipients: ${selectedScholarship.activeRecipientsCount} scholars`,
          joinDate: selectedScholarship.type,
          balance: `ENDOWMENT POOL: $${(Number(selectedScholarship.totalAllocated) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
