/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Layers, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, Coins, Sparkles,
  ArrowRight, ShieldCheck, Settings, BookOpen, GraduationCap, ScrollText,
  Trash2, Edit2, X, RefreshCw, Check
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/services/api.service';
import { erpService } from '@/services/erp.service';
import type { AcademicYear, GradeLevel } from '@/types/erp.types';
import type { FeeStructure } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface FeeItemInput {
  id: string;
  category: 'Tuition' | 'Registration' | 'Library' | 'Laboratory' | 'Examination' | 'Sports' | 'Transport' | 'Hostel' | 'Other';
  description: string;
  amount: number;
}

export default function FeeStructuresPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { can } = usePermissions();
  const isAdmin = Boolean(can.isAdmin);

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Drawers & Modals
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAcademicYearCode, setFormAcademicYearCode] = useState('2026-2027');
  const [formGradeCode, setFormGradeCode] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formItems, setFormItems] = useState<FeeItemInput[]>([
    { id: '1', category: 'Tuition', description: 'Core Academic Tuition Fee', amount: 0 },
    { id: '2', category: 'Library', description: 'Library & Digital Database Access', amount: 0 },
    { id: '3', category: 'Laboratory', description: 'Science & Computer Lab Maintenance', amount: 0 },
    { id: '4', category: 'Examination', description: 'Term Assessment & Certification Fee', amount: 0 }
  ]);
  const [formInstallmentAllowed, setFormInstallmentAllowed] = useState(true);
  const [formScholarshipEligible, setFormScholarshipEligible] = useState(true);

  const [currencies, setCurrencies] = useState<any[]>([]);
  const STORAGE_KEY = 'yahaya_fee_structures_cache';

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, years, grades, currs] = await Promise.all([
        apiClient.get('/finance-fee-structures?populate=*').catch(() => ({ data: { data: [] } })),
        erpService.getAcademicYears(locale).catch(() => []),
        erpService.getGradeLevels(locale).catch(() => []),
        apiClient.get('/finance-currencies').catch(() => ({ data: { data: [] } }))
      ]);

      const rawData = res.data?.data || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        setStructures(rawData);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData)); } catch {}
        }
      } else {
        // Fallback to local storage cache if available
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
              setStructures(JSON.parse(cached));
            } else {
              setStructures([]);
            }
          } catch {
            setStructures([]);
          }
        }
      }

      setAcademicYears(years || []);
      setGradeLevels(grades || []);
      setCurrencies(currs?.data?.data || []);

      if (years && years.length > 0) {
        const curr = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (curr?.name) {
          setFormAcademicYearCode(curr.name);
        }
      }

      if (grades && grades.length > 0 && !formGradeCode) {
        setFormGradeCode(grades[0].code || grades[0].name);
      }
    } catch {
      toast.error(t('Failed to load fee structure templates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  // Handle Form Item changes
  const handleItemAmountChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...formItems];
    updated[index].amount = num;
    setFormItems(updated);
  };

  const handleItemDescChange = (index: number, val: string) => {
    const updated = [...formItems];
    updated[index].description = val;
    setFormItems(updated);
  };

  const handleItemCategoryChange = (index: number, val: any) => {
    const updated = [...formItems];
    updated[index].category = val;
    setFormItems(updated);
  };

  const handleAddLineItem = () => {
    setFormItems([
      ...formItems,
      { id: Date.now().toString(), category: 'Other', description: 'Additional Fee Component', amount: 0 }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (formItems.length <= 1) {
      toast.warning(t('Fee structure must have at least one line item'));
      return;
    }
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const totalCalculatedFee = useMemo(() => {
    return formItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  }, [formItems]);

  const handleOpenCreateModal = () => {
    setEditingStructureId(null);
    setFormName('');
    setFormItems([
      { id: '1', category: 'Tuition', description: 'Core Academic Tuition Fee', amount: 1200 },
      { id: '2', category: 'Library', description: 'Library & Digital Database Access', amount: 150 },
      { id: '3', category: 'Laboratory', description: 'Science & Computer Lab Maintenance', amount: 150 },
      { id: '4', category: 'Examination', description: 'Term Assessment & Certification Fee', amount: 100 }
    ]);
    setFormInstallmentAllowed(true);
    setFormScholarshipEligible(true);
    if (gradeLevels.length > 0) {
      setFormGradeCode(gradeLevels[0].code || gradeLevels[0].name);
    }
    setShowModal(true);
  };

  const handleOpenEditModal = (struct: FeeStructure) => {
    const targetId = struct.documentId || struct.id;
    setEditingStructureId(targetId);
    setFormName(struct.title || struct.name || '');
    setFormAcademicYearCode(struct.academicYearCode || '2026-2027');
    setFormGradeCode(struct.gradeCode || (gradeLevels[0]?.code ?? ''));
    setFormCurrency(struct.currency || 'USD');
    setFormInstallmentAllowed(struct.installmentAllowed ?? true);
    setFormScholarshipEligible(struct.scholarshipEligible ?? true);

    if (Array.isArray(struct.items) && struct.items.length > 0) {
      setFormItems(struct.items.map((it: any, i: number) => ({
        id: it.id || String(i + 1),
        category: it.category || 'Tuition',
        description: it.description || it.name || 'Component Fee',
        amount: Number(it.amount || it.unitAmount || 0)
      })));
    } else {
      setFormItems([
        { id: '1', category: 'Tuition', description: 'Core Academic Tuition Fee', amount: Number(struct.totalAnnualFee || struct.amount || 0) }
      ]);
    }
    setShowModal(true);
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t('Permission denied: Fee structures can only be managed by Administrators.'));
      return;
    }
    if (!formName.trim()) {
      toast.error(t('Fee structure title is required.'));
      return;
    }
    if (totalCalculatedFee <= 0) {
      toast.error(t('Total fee amount must be greater than zero.'));
      return;
    }

    const payload = {
      title: formName,
      name: formName,
      code: `FEE-${formGradeCode || 'ALL'}-${Date.now().toString().slice(-4)}`,
      academicYearCode: formAcademicYearCode,
      gradeCode: formGradeCode,
      currency: formCurrency,
      totalAnnualFee: totalCalculatedFee,
      totalAmount: totalCalculatedFee,
      amount: totalCalculatedFee,
      installmentAllowed: formInstallmentAllowed,
      scholarshipEligible: formScholarshipEligible,
      isActive: true,
      items: formItems.map(it => ({
        category: it.category,
        description: it.description,
        amount: Number(it.amount) || 0
      }))
    };

    try {
      if (editingStructureId) {
        let updatedRecord: any = { ...payload, id: editingStructureId, documentId: editingStructureId };
        try {
          const res = await apiClient.put(`/finance-fee-structures/${editingStructureId}`, { data: payload });
          if (res?.data?.data) updatedRecord = res.data.data;
        } catch { /* fallback to local persistence */ }

        const next = structures.map(s => (s.id === editingStructureId || s.documentId === editingStructureId) ? { ...s, ...updatedRecord } : s);
        setStructures(next);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        toast.success(`${t('Fee structure template updated')}: ${formName}`);
      } else {
        let createdRecord: any = { ...payload, id: `FEE-${Date.now().toString().slice(-5)}` };
        try {
          const res = await apiClient.post('/finance-fee-structures', { data: payload });
          if (res?.data?.data) createdRecord = res.data.data;
        } catch { /* fallback to local persistence */ }

        const next = [createdRecord, ...structures];
        setStructures(next);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        toast.success(`${t('Created fee structure template')}: ${formName}`);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to save fee structure'));
    }
  };

  const handleDeleteStructure = async (idOrDocId: string | number, name: string) => {
    if (!isAdmin) {
      toast.error(t('Permission denied: Fee structures can only be deleted by Administrators.'));
      return;
    }
    if (!confirm(`${t('Are you sure you want to remove fee structure template')} "${name}"?`)) return;
    try {
      try {
        await apiClient.delete(`/finance-fee-structures/${idOrDocId}`);
      } catch { /* fallback */ }

      const next = structures.filter(s => s.id !== idOrDocId && s.documentId !== idOrDocId);
      setStructures(next);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      toast.success(`${t('Removed fee structure')}: ${name}`);
      if (selectedStructure?.id === idOrDocId || selectedStructure?.documentId === idOrDocId) {
        setSelectedStructure(null);
      }
    } catch {
      toast.error(t('Failed to delete fee structure'));
    }
  };

  // Filtered dataset
  const filteredStructures = useMemo(() => {
    return structures.filter(s => {
      const title = (s.name || s.title || '').toLowerCase();
      const grade = (s.gradeCode || '').toLowerCase();
      const matchQuery = !query || title.includes(query.toLowerCase()) || grade.includes(query.toLowerCase());
      const matchGrade = selectedGradeFilter === 'all' || s.gradeCode === selectedGradeFilter;
      const matchYear = selectedYearFilter === 'all' || s.academicYearCode === selectedYearFilter;
      return matchQuery && matchGrade && matchYear;
    });
  }, [structures, query, selectedGradeFilter, selectedYearFilter]);

  const activeFiltersCount = [selectedGradeFilter !== 'all', selectedYearFilter !== 'all', query.length > 0].filter(Boolean).length;

  const totalTemplates = structures.length;
  const activeTemplates = useMemo(() => structures.filter(s => s.isActive !== false).length, [structures]);
  const avgAnnualFee = useMemo(() => {
    if (structures.length === 0) return 0;
    return structures.reduce((s, x) => s + (Number(x.totalAnnualFee || x.totalAmount || x.amount) || 0), 0) / structures.length;
  }, [structures]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_templates',
      title: t('Total Fee Templates'),
      value: String(totalTemplates),
      subtitle: `${activeTemplates} ${t('Active Templates')}`,
      trendDirection: 'neutral',
      icon: <Layers className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'grade_coverage',
      title: t('Grade Levels Configured'),
      value: `${gradeLevels.length} ${t('Levels in DB')}`,
      subtitle: `${new Set(structures.map(s => s.gradeCode).filter(Boolean)).size} ${t('active structure schedules')}`,
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'avg_fee',
      title: t('Average Annual Fee Schedule'),
      value: `$${avgAnnualFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Base tuition, library, science lab & exam fees'),
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'academic_partition',
      title: t('Academic Year Partitions'),
      value: `${academicYears.length} ${t('Years')}`,
      subtitle: `${formAcademicYearCode} ${t('active partition')}`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<FeeStructure, any>[]>(() => [
    {
      accessorKey: 'name',
      header: t('Fee Structure Name & Grade'),
      cell: ({ row }) => {
        const s = row.original;
        const matchedGrade = gradeLevels.find(g => g.code === s.gradeCode || g.name === s.gradeCode);
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{s.name || s.title}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {matchedGrade ? matchedGrade.name : (s.gradeCode || t('All Grades'))}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">• {s.academicYearCode || '2026-2027'}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'totalAnnualFee',
      header: `${t('Annual Total Fee')} ($)`,
      cell: ({ row }) => {
        const amount = Number(row.original.totalAnnualFee || row.original.totalAmount || row.original.amount || 0);
        return (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      id: 'breakdown',
      header: t('Tranche Tranche Split (Term 1/2/3)'),
      cell: ({ row }) => {
        const amount = Number(row.original.totalAnnualFee || row.original.totalAmount || row.original.amount || 0);
        const t1 = amount * 0.4;
        const t2 = amount * 0.3;
        const t3 = amount * 0.3;
        return (
          <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
            <span>T1 (40%): <strong>${t1.toFixed(0)}</strong></span> • <span>T2 (30%): <strong>${t2.toFixed(0)}</strong></span> • <span>T3 (30%): <strong>${t3.toFixed(0)}</strong></span>
          </div>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.isActive !== false ? 'active' : 'inactive'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedStructure(s)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
              title={t('Inspect breakdown')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('Inspect')}</span>
            </button>
            {isAdmin ? (
              <>
                <button
                  onClick={() => handleOpenEditModal(s)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                  title={t('Edit template')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteStructure(s.documentId || s.id, s.title || s.name)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                  title={t('Delete template')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <Link
                href={`/finance/billing/invoices?structureId=${s.documentId || s.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-all border border-emerald-500/30 shadow-sm"
                title={t('Bill students using this structure')}
              >
                <FileText className="w-3 h-3" />
                <span>{t('Bill')}</span>
              </Link>
            )}
          </div>
        );
      }
    }
  ], [gradeLevels, locale, isAdmin]);

  return (
    <EnterpriseModuleShell
      title={t('Standard Fee Structure Templates & Tier Management')}
      description={t('Define grade-level fee schedules, recurring laboratory/library components, and certification fee rules.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Fee Structures') }]}
      icon={<Layers className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredStructures.length}
      recordLabel={t('Structures')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedGradeFilter('all');
        setSelectedYearFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('Admin Governed Policies')}</span>
            </span>
          )}
          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{t('Student Invoices')}</span>
          </Link>
          <Link
            href="/finance/billing/payments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>{t('Collect Payments')}</span>
          </Link>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('+ Create Fee Structure')}</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 mb-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white leading-tight">{t('Institutional Policy Notice')}</p>
              <p className="text-[11px] text-slate-400">
                {t('Fee schedules and rate structures are established by School Administrators. Accountants and Finance Staff use these approved matrices to issue student invoices and record collections.')}
              </p>
            </div>
          </div>
          <Link
            href="/finance/billing/invoices"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('Issue Student Invoice')} →</span>
          </Link>
        </div>
      )}

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{t('Fee Structures')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('Fee Parameters (Settings)')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search fee structure templates by name or grade code...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Fee structures refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedGradeFilter('all');
          setSelectedYearFilter('all');
        }}
        createButtonLabel={isAdmin ? t('+ New Fee Template') : undefined}
        onCreate={isAdmin ? handleOpenCreateModal : undefined}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grade Level DB Selector */}
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              aria-label="Filter by Grade Level from Database"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer max-w-[200px]"
            >
              <option value="all">{t('All Grade Levels (DB)')}</option>
              {gradeLevels.map(g => (
                <option key={g.id} value={g.code || g.name}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>

            {/* Academic Year DB Selector */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              aria-label="Filter by Academic Year"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Academic Years')}</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.name}>
                  {y.name} {y.isCurrent ? `(${t('Current')})` : ''}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredStructures}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedStructure(row)}
        onRowClick={(row) => setSelectedStructure(row)}
        emptyStateProps={{
          title: t('No Fee Structures Found'),
          description: t('No fee templates match your search or filter selection.'),
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedGradeFilter('all');
            setSelectedYearFilter('all');
          },
          createLabel: t('Create First Structure'),
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Create & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">
                  {editingStructureId ? t('Edit Fee Structure Template') : t('Create Fee Structure Template')}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Fee Structure Title')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10 STEM & Secondary Tuition Schedule"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dynamic Grade Level from DB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span>{t('Grade Level')}</span>
                  </label>
                  <select
                    value={formGradeCode}
                    onChange={(e) => setFormGradeCode(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {gradeLevels.length > 0 ? (
                      gradeLevels.map(g => (
                        <option key={g.id} value={g.code || g.name}>
                          {g.name} ({g.code})
                        </option>
                      ))
                    ) : (
                      <option value="GRADE-10">Grade 10</option>
                    )}
                  </select>
                </div>

                {/* Academic Year from DB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{t('Academic Year')}</span>
                  </label>
                  <select
                    value={formAcademicYearCode}
                    onChange={(e) => setFormAcademicYearCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {academicYears.length > 0 ? (
                      academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)
                    ) : (
                      <option value="2026-2027">2026-2027</option>
                    )}
                  </select>
                </div>

                {/* Multi-Currency Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>{t('Currency')}</span>
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {currencies.length > 0 ? (
                      currencies.map(c => (
                        <option key={c.id || c.isoCode} value={c.isoCode || c.currencyCode || c.name}>
                          {c.isoCode || c.currencyCode} ({c.symbol || '$'}) — {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="USD">USD ($) — US Dollar</option>
                        <option value="LRD">LRD ($) — Liberian Dollar</option>
                        <option value="NGN">NGN (₦) — Nigerian Naira</option>
                        <option value="EUR">EUR (€) — Euro</option>
                        <option value="GBP">GBP (£) — British Pound</option>
                        <option value="TRY">TRY (₺) — Turkish Lira</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic Line Item Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Fee Components & Breakdown')}</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('Add Component')}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemCategoryChange(idx, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Tuition">{t('Tuition')}</option>
                        <option value="Registration">{t('Registration')}</option>
                        <option value="Library">{t('Library')}</option>
                        <option value="Laboratory">{t('Laboratory')}</option>
                        <option value="Examination">{t('Examination')}</option>
                        <option value="Sports">{t('Sports')}</option>
                        <option value="Transport">{t('Transport')}</option>
                        <option value="Hostel">{t('Hostel')}</option>
                        <option value="Other">{t('Other')}</option>
                      </select>

                      <input
                        type="text"
                        placeholder={t('Component description...')}
                        value={item.description}
                        onChange={(e) => handleItemDescChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                      />

                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount || ''}
                          onChange={(e) => handleItemAmountChange(idx, e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">{t('Total Calculated Annual Fee')}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tranche 1 (40%): ${(totalCalculatedFee * 0.4).toFixed(2)} • Tranche 2/3 (30%): ${(totalCalculatedFee * 0.3).toFixed(2)}
                  </span>
                </div>
                <span className="font-mono text-xl font-black text-emerald-400">
                  ${totalCalculatedFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formInstallmentAllowed}
                      onChange={(e) => setFormInstallmentAllowed(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300 font-bold">{t('Installment Tranches Allowed')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formScholarshipEligible}
                      onChange={(e) => setFormScholarshipEligible(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300 font-bold">{t('Scholarship Eligible')}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Save Fee Structure')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedStructure}
        onClose={() => setSelectedStructure(null)}
        record={selectedStructure ? {
          name: selectedStructure.name || selectedStructure.title,
          id: selectedStructure.id,
          role: `GRADE: ${gradeLevels.find(g => g.code === selectedStructure.gradeCode || g.name === selectedStructure.gradeCode)?.name || selectedStructure.gradeCode || 'All Grades'}`,
          status: selectedStructure.isActive !== false ? 'active' : 'inactive',
          email: `Academic Year: ${selectedStructure.academicYearCode || '2026-2027'}`,
          phone: `Components: ${selectedStructure.items?.length || 1} Itemized Lines`,
          department: `Currency: ${selectedStructure.currency || 'USD'}`,
          joinDate: selectedStructure.academicYearCode,
          balance: `ANNUAL TOTAL: $${(Number(selectedStructure.totalAnnualFee || selectedStructure.totalAmount || selectedStructure.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
