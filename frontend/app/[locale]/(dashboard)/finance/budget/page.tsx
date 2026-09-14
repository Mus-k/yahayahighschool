/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Building2, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, ShieldCheck,
  AlertTriangle, ArrowRight, Sparkles, Users, PieChart,
  GraduationCap, UserCheck, Edit2, Trash2, ArrowLeftRight, X,
  TrendingUp, TrendingDown, Layers, ChevronRight, Check, Printer,
  Landmark, HelpCircle, FileCheck, Share2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { DepartmentBudget } from '@/types/finance.types';
import type { Section, Teacher, AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface BudgetLineCategory {
  name: string;
  amount: number;
}

export default function DepartmentalBudgetsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI State
  const [query, setQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Inspection, Modals & Creation
  const [inspectedBudget, setInspectedBudget] = useState<DepartmentBudget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);

  // Form State for Budget Allocation
  const [formSectionId, setFormSectionId] = useState('');
  const [formDepartmentName, setFormDepartmentName] = useState('');
  const [formCostCenterCode, setFormCostCenterCode] = useState('');
  const [formHeadOfDepartment, setFormHeadOfDepartment] = useState('');
  const [formAcademicYearCode, setFormAcademicYearCode] = useState('2026-2027');
  const [formAllocatedAmount, setFormAllocatedAmount] = useState('');
  const [formCategories, setFormCategories] = useState<BudgetLineCategory[]>([
    { name: 'Instructional Supplies & Curriculum', amount: 0 },
    { name: 'Laboratory & Digital Equipment', amount: 0 },
    { name: 'Field Activities & Academic Competitions', amount: 0 },
    { name: 'Faculty Continuous Professional Dev.', amount: 0 }
  ]);

  // Transfer Funds State
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetData, sectionData, teacherData, yearData] = await Promise.all([
        financeService.getBudgets().catch(() => []),
        erpService.getSections(locale).catch(() => []),
        erpService.getTeachers({ pageSize: 100 }, locale).then(r => r.data).catch(() => []),
        erpService.getAcademicYears(locale).catch(() => [])
      ]);

      setBudgets(budgetData || []);
      setSections(sectionData || []);
      setTeachers(teacherData || []);
      setAcademicYears(yearData || []);

      if (yearData && yearData.length > 0) {
        const curr = yearData.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || yearData[0];
        if (curr?.name) setFormAcademicYearCode(curr.name);
      }
    } catch {
      toast.error(t('Failed to load departmental budgets.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  // Handle section selection in modal - auto-fills HOD & Code
  const handleSectionSelect = (secId: string) => {
    setFormSectionId(secId);
    if (!secId || secId === 'custom') {
      return;
    }
    const matched = sections.find(s => String(s.id) === secId || s.documentId === secId);
    if (matched) {
      setFormDepartmentName(matched.name);
      setFormCostCenterCode(`CC-${matched.code || String(matched.id)}`);
      
      // Auto-assign section head if assigned
      if (matched.academicHead?.name) {
        setFormHeadOfDepartment(matched.academicHead.name);
      } else if (matched.homeroomTeacher?.name) {
        setFormHeadOfDepartment(matched.homeroomTeacher.name);
      } else if (teachers.length > 0) {
        setFormHeadOfDepartment(teachers[0].name);
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setFormSectionId('');
    setFormDepartmentName('');
    setFormCostCenterCode(`CC-${Date.now().toString().slice(-4)}`);
    setFormHeadOfDepartment(teachers[0]?.name || '');
    setFormAllocatedAmount('');
    setFormCategories([
      { name: 'Instructional Supplies & Curriculum', amount: 0 },
      { name: 'Laboratory & Digital Equipment', amount: 0 },
      { name: 'Field Activities & Academic Competitions', amount: 0 },
      { name: 'Faculty Continuous Professional Dev.', amount: 0 }
    ]);
    if (sections.length > 0) {
      handleSectionSelect(String(sections[0].id));
    }
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (budget: DepartmentBudget) => {
    setEditingBudget(budget);
    setFormDepartmentName(budget.departmentName || budget.budgetTitle || '');
    setFormCostCenterCode(budget.code || `CC-${budget.id}`);
    setFormHeadOfDepartment(typeof budget.headOfDepartment === 'string' ? budget.headOfDepartment : (budget.headOfDepartment?.name || ''));
    setFormAcademicYearCode(budget.academicYearCode || '2026-2027');
    setFormAllocatedAmount(String(budget.allocatedAmount || 0));
    setShowEditModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocNum = parseFloat(formAllocatedAmount || '0');
    if (!formDepartmentName.trim()) {
      toast.error(t('Please specify the department / academic section name'));
      return;
    }
    if (isNaN(allocNum) || allocNum <= 0) {
      toast.error(t('Allocation ceiling amount must be greater than zero'));
      return;
    }

    try {
      if (editingBudget) {
        const updated: DepartmentBudget = {
          ...editingBudget,
          departmentName: formDepartmentName,
          budgetTitle: formDepartmentName,
          code: formCostCenterCode,
          headOfDepartment: formHeadOfDepartment,
          academicYearCode: formAcademicYearCode,
          allocatedAmount: allocNum,
          remainingAmount: allocNum - Number(editingBudget.spentAmount || 0),
          utilizationPercentage: allocNum > 0 ? Number(((Number(editingBudget.spentAmount || 0) / allocNum) * 100).toFixed(1)) : 0,
          status: (Number(editingBudget.spentAmount || 0) / allocNum) > 0.9 ? 'exceeded' : (Number(editingBudget.spentAmount || 0) / allocNum) > 0.75 ? 'warning' : 'on_track'
        };

        await financeService.updateDepartmentalBudget(editingBudget.id, updated);
        setBudgets(budgets.map(b => b.id === editingBudget.id ? updated : b));
        if (inspectedBudget?.id === editingBudget.id) setInspectedBudget(updated);
        toast.success(`${t('Updated budget allocation for')} ${formDepartmentName}`);
        setShowEditModal(false);
      } else {
        const newBudget: Partial<DepartmentBudget> = {
          code: formCostCenterCode || `CC-${Date.now().toString().slice(-4)}`,
          departmentName: formDepartmentName,
          budgetTitle: formDepartmentName,
          headOfDepartment: formHeadOfDepartment || (teachers[0]?.name ?? 'Section Lead'),
          academicYearCode: formAcademicYearCode,
          allocatedAmount: allocNum,
          committedAmount: 0,
          spentAmount: 0,
          remainingAmount: allocNum,
          varianceAmount: 0,
          utilizationPercentage: 0,
          currency: 'USD',
          status: 'on_track',
          categories: formCategories.filter(c => c.amount > 0)
        };

        const created = await financeService.createDepartmentalBudget(newBudget);
        setBudgets([created, ...budgets]);
        toast.success(`${t('Allocated new budget ceiling for')} ${formDepartmentName} ($${allocNum.toLocaleString()})`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error(t('Failed to save budget allocation'));
    }
  };

  const handleDeleteBudget = async (id: string, name: string) => {
    if (!confirm(`${t('Are you sure you want to remove budget ceiling for')} "${name}"?`)) return;
    try {
      await financeService.deleteDepartmentalBudget(id);
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success(`${t('Removed budget')} ${name}`);
      if (inspectedBudget?.id === id) setInspectedBudget(null);
    } catch {
      toast.error(t('Failed to delete budget'));
    }
  };

  const handleTransferFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount || '0');
    if (!transferSourceId || !transferTargetId) {
      toast.error(t('Please select both source and destination cost centers'));
      return;
    }
    if (transferSourceId === transferTargetId) {
      toast.error(t('Source and destination cost centers cannot be identical'));
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('Please enter a valid transfer amount'));
      return;
    }

    const src = budgets.find(b => b.id === transferSourceId);
    const tgt = budgets.find(b => b.id === transferTargetId);

    if (!src || !tgt) return;
    if (Number(src.remainingAmount || 0) < amountNum) {
      toast.error(`${t('Insufficient reserve in source cost center')}: ${src.departmentName} ($${Number(src.remainingAmount).toFixed(2)})`);
      return;
    }

    try {
      await financeService.reallocateBudget(transferSourceId, transferTargetId, amountNum, transferNotes);

      const nextBudgets = budgets.map(b => {
        if (b.id === transferSourceId) {
          const newAlloc = Number(b.allocatedAmount) - amountNum;
          const newRem = Number(b.remainingAmount) - amountNum;
          return { ...b, allocatedAmount: newAlloc, remainingAmount: newRem };
        }
        if (b.id === transferTargetId) {
          const newAlloc = Number(b.allocatedAmount) + amountNum;
          const newRem = Number(b.remainingAmount) + amountNum;
          return { ...b, allocatedAmount: newAlloc, remainingAmount: newRem };
        }
        return b;
      });

      setBudgets(nextBudgets);
      if (inspectedBudget) {
        const updatedInspected = nextBudgets.find(b => b.id === inspectedBudget.id);
        if (updatedInspected) setInspectedBudget(updatedInspected);
      }

      toast.success(`${t('Successfully reallocated')} $${amountNum.toLocaleString()} ${t('from')} ${src.departmentName} ${t('to')} ${tgt.departmentName}`);
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferNotes('');
    } catch {
      toast.error(t('Fund reallocation failed'));
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredBudgets.map(b => ({
      Code: b.code || b.id,
      Department: b.departmentName || b.budgetTitle,
      HOD: typeof b.headOfDepartment === 'string' ? b.headOfDepartment : b.headOfDepartment?.name,
      AcademicYear: b.academicYearCode,
      AllocatedUSD: Number(b.allocatedAmount || 0).toFixed(2),
      SpentUSD: Number(b.spentAmount || 0).toFixed(2),
      RemainingUSD: Number(b.remainingAmount || 0).toFixed(2),
      UtilizationRate: `${Number(b.utilizationPercentage || 0).toFixed(1)}%`,
      Status: b.status || 'on_track'
    }));
    financeService.exportToCSV(dataToExport, `departmental-budgets-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(t('Budget spreadsheet downloaded'));
  };

  // Filtered dataset
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const dName = (b.departmentName || b.budgetTitle || '').toLowerCase();
      const hName = (typeof b.headOfDepartment === 'string' ? b.headOfDepartment : (b.headOfDepartment?.name || '')).toLowerCase();
      const code = (b.code || '').toLowerCase();
      const matchQ = !query || dName.includes(query.toLowerCase()) || hName.includes(query.toLowerCase()) || code.includes(query.toLowerCase());

      const matchSection = selectedSectionFilter === 'all' || dName.includes(selectedSectionFilter.toLowerCase());
      const matchYear = selectedYearFilter === 'all' || b.academicYearCode === selectedYearFilter;
      const matchStatus = selectedStatusFilter === 'all' || b.status === selectedStatusFilter;

      return matchQ && matchSection && matchYear && matchStatus;
    });
  }, [budgets, query, selectedSectionFilter, selectedYearFilter, selectedStatusFilter]);

  const activeFiltersCount = [
    selectedSectionFilter !== 'all',
    selectedYearFilter !== 'all',
    selectedStatusFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  const totalAllocated = useMemo(() => budgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + (Number(b.spentAmount) || 0), 0), [budgets]);
  const totalRemaining = useMemo(() => budgets.reduce((s, b) => s + (Number(b.remainingAmount) || 0), 0), [budgets]);
  const avgUtilization = useMemo(() => {
    if (totalAllocated === 0) return 0;
    return (totalSpent / totalAllocated) * 100;
  }, [totalAllocated, totalSpent]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_allocated',
      title: t('Total Institutional Budget Ceiling'),
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} ${t('campus cost center departments')} (${sections.length} ${t('sections in DB')})`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'total_spent',
      title: t('Total YTD Departmental Spend'),
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${avgUtilization.toFixed(1)}% ${t('total institutional budget utilization')}`,
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'remaining_capacity',
      title: t('Available Budget Reserves'),
      value: `$${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Uncommitted operating capital ceiling'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'variance_alerts',
      title: t('Departmental Variance Warning'),
      value: `${budgets.filter(b => b.status === 'warning' || b.status === 'exceeded').length} ${t('Alerts')}`,
      subtitle: t('Cost centers approaching or exceeding 90% allocation'),
      trendDirection: budgets.filter(b => b.status === 'warning' || b.status === 'exceeded').length > 0 ? 'down' : 'up',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
    }
  ];

  const columns = useMemo<ColumnDef<DepartmentBudget, any>[]>(() => [
    {
      accessorKey: 'departmentName',
      header: t('Academic Section / Cost Center & HOD'),
      cell: ({ row }) => {
        const b = row.original;
        const hodName = typeof b.headOfDepartment === 'string' ? b.headOfDepartment : (b.headOfDepartment?.name || 'Section Lead');
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{b.departmentName || b.budgetTitle}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <UserCheck className="w-3 h-3" /> {hodName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">• {b.code || `CC-${b.id}`}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'utilizationPercentage',
      header: t('Budget Utilization vs Actual Spend'),
      cell: ({ row }) => {
        const b = row.original;
        const u = Number(b.utilizationPercentage || 0);
        return (
          <div className="space-y-1.5 w-full max-w-xs">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-300 font-bold">${Number(b.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('spent')}</span>
              <span className={`font-black ${u > 90 ? 'text-rose-400' : u > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {u.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all rounded-full ${
                  u > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse' :
                  u > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${Math.min(u, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'allocatedAmount',
      header: `${t('Annual Allocation')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white block">
          ${Number(row.original.allocatedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'remainingAmount',
      header: `${t('Remaining Reserve')} ($)`,
      cell: ({ row }) => {
        const rem = Number(row.original.remainingAmount || 0);
        return (
          <span className={`font-mono text-xs sm:text-sm font-black block ${rem <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ${rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'on_track'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setInspectedBudget(b)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
              title={t('Inspect budget document & dossier')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('Inspect')}</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(b)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title={t('Edit budget ceiling')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteBudget(b.id, b.departmentName || b.budgetTitle)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title={t('Delete budget')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Departmental Budget vs Actual Spend & Variance Reporting')}
      description={t('SAP S/4HANA departmental cost-center control. Monitor annual budget allocations across all academic sections & departments, track real-time expenditure utilization, and prevent unauthorized overspending.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Payroll & Budget') }, { label: t('Departmental Budgets') }]}
      icon={<Building2 className="w-8 h-8 text-sky-400" />}
      recordCount={filteredBudgets.length}
      recordLabel={t('Cost Centers')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedSectionFilter('all');
        setSelectedYearFilter('all');
        setSelectedStatusFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-sky-400" />
            <span>{t('Transfer Funds')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Allocate Section Budget')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Staff Payroll Runs')}</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('Operating Expenses')}</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>{t('Departmental Budget vs Actual')}</span>
        </Link>
        <Link href="/finance/budget/departments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Line Item Allocations')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search budgets by department cost center name or Head of Department (HOD)...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Departmental budget figures refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedSectionFilter('all');
          setSelectedYearFilter('all');
          setSelectedStatusFilter('all');
        }}
        createButtonLabel={t('+ Allocate Budget')}
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Academic Section DB Filter */}
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              aria-label="Filter by Academic Section"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer max-w-[200px]"
            >
              <option value="all">{t('All Sections (DB)')}</option>
              {sections.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            {/* Academic Year DB Filter */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              aria-label="Filter by Academic Year"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Fiscal Years')}</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.name}>
                  {y.name} {y.isCurrent ? `(${t('Current')})` : ''}
                </option>
              ))}
            </select>

            {/* Budget Health Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Budget Status"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{t('All Health Statuses')}</option>
              <option value="on_track">{t('On Track (< 75%)')}</option>
              <option value="warning">{t('Warning (75% - 90%)')}</option>
              <option value="exceeded">{t('Exceeded (> 90%)')}</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredBudgets}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setInspectedBudget(row)}
        onRowClick={(row) => setInspectedBudget(row)}
        emptyStateProps={{
          title: t('No Departmental Budgets Found'),
          description: t('No cost centers have been assigned budget ceilings for this academic year.'),
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedSectionFilter('all');
            setSelectedYearFilter('all');
            setSelectedStatusFilter('all');
          },
          createLabel: t('Allocate Cost Center Budget'),
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Modern Dedicated Budget Inspector & Document Dossier Panel */}
      {inspectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header / Brand Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {inspectedBudget.code || `CC-${inspectedBudget.id}`}
                    </span>
                    <StatusBadge status={inspectedBudget.status || 'on_track'} size="sm" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    {inspectedBudget.departmentName || inspectedBudget.budgetTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('Print Slip')}</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenEditModal(inspectedBudget);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('Edit Ceiling')}</span>
                </button>
                <button
                  onClick={() => setInspectedBudget(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">{t('Annual Ceiling')}</span>
                <span className="text-base sm:text-lg font-black text-white font-mono mt-1 block">
                  ${Number(inspectedBudget.allocatedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">{t('Disbursed Spend')}</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono mt-1 block">
                  ${Number(inspectedBudget.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">{t('Available Reserve')}</span>
                <span className={`text-base sm:text-lg font-black font-mono mt-1 block ${Number(inspectedBudget.remainingAmount || 0) <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${Number(inspectedBudget.remainingAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">{t('Utilization')}</span>
                <span className={`text-base sm:text-lg font-black font-mono mt-1 block ${Number(inspectedBudget.utilizationPercentage || 0) > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Number(inspectedBudget.utilizationPercentage || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Utilization Gauge */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {t('Budget Utilization & Consumption Rate')}
                </span>
                <span className="text-slate-400 font-mono">
                  ${Number(inspectedBudget.spentAmount || 0).toFixed(2)} / ${Number(inspectedBudget.allocatedAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all rounded-full ${
                    Number(inspectedBudget.utilizationPercentage || 0) > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                    Number(inspectedBudget.utilizationPercentage || 0) > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(Number(inspectedBudget.utilizationPercentage || 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Governance Details & Section Head */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  {t('Responsible Section Head / HOD')}
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-300">
                    {typeof inspectedBudget.headOfDepartment === 'string' ? inspectedBudget.headOfDepartment[0] : 'H'}
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {typeof inspectedBudget.headOfDepartment === 'string' ? inspectedBudget.headOfDepartment : (inspectedBudget.headOfDepartment?.name || 'Section Lead')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {t('Authorized Faculty Lead')} • {inspectedBudget.academicYearCode || '2026-2027'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {t('Fiscal Governance Standard')}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('Cost center governed under SAP S/4HANA double-entry compliance rules. Overspending requires prior financial reallocation approved by the Director.')}
                </p>
              </div>
            </div>

            {/* Itemized Categories Breakdown */}
            {inspectedBudget.categories && inspectedBudget.categories.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Itemized Category Allocations')}</h4>
                <div className="space-y-2">
                  {inspectedBudget.categories.map((cat: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">${Number(cat.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Certification Footer */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('Certified Cost Center Ledger Record')} • {inspectedBudget.academicYearCode}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">ID: {inspectedBudget.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Allocation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-black text-white">{t('Allocate Section / Department Budget Ceiling')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Academic Section from DB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    <span>{t('Academic Section (from Database)')}</span>
                  </label>
                  <select
                    value={formSectionId}
                    onChange={(e) => handleSectionSelect(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- {t('Select Academic Section')} --</option>
                    {sections.map(s => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    <option value="custom">-- {t('Custom Department / Faculty')} --</option>
                  </select>
                </div>

                {/* Section Head / HOD from DB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <span>{t('Section Head / HOD (from Faculty DB)')}</span>
                  </label>
                  <select
                    value={formHeadOfDepartment}
                    onChange={(e) => setFormHeadOfDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {teachers.map(teach => (
                      <option key={teach.id} value={teach.name}>
                        {teach.name} ({teach.schoolId || 'Faculty'})
                      </option>
                    ))}
                    {teachers.length === 0 && <option value="Section Head">Section Head</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Department / Cost Center Name')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Quran & Hifz Division"
                    value={formDepartmentName}
                    onChange={(e) => setFormDepartmentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Cost Center GL Code')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-HIFZ-01"
                    value={formCostCenterCode}
                    onChange={(e) => setFormCostCenterCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Academic Fiscal Year')}</label>
                  <select
                    value={formAcademicYearCode}
                    onChange={(e) => setFormAcademicYearCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                    {academicYears.length === 0 && <option value="2026-2027">2026-2027</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Total Annual Allocation Ceiling ($ USD)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="25000"
                    value={formAllocatedAmount}
                    onChange={(e) => setFormAllocatedAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Authorize Budget Ceiling')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">{t('Adjust Budget Ceiling')}: {editingBudget.departmentName}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Department Name')}</label>
                <input
                  type="text"
                  required
                  value={formDepartmentName}
                  onChange={(e) => setFormDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Head of Department / Section Lead')}</label>
                <select
                  value={formHeadOfDepartment}
                  onChange={(e) => setFormHeadOfDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {teachers.map(teach => (
                    <option key={teach.id} value={teach.name}>
                      {teach.name}
                    </option>
                  ))}
                  {teachers.length === 0 && <option value={formHeadOfDepartment}>{formHeadOfDepartment}</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Annual Allocation Ceiling ($)')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formAllocatedAmount}
                  onChange={(e) => setFormAllocatedAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{t('Currently Spent YTD')}:</span>
                  <span className="text-white font-bold">${Number(editingBudget.spentAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('New Remaining Reserve')}:</span>
                  <span className="text-emerald-400 font-bold">${(parseFloat(formAllocatedAmount || '0') - Number(editingBudget.spentAmount || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md">{t('Update Ceiling')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">{t('Reallocate Inter-Departmental Budget Reserves')}</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleTransferFunds} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Source Cost Center (Debit Reserve)')}</label>
                <select
                  value={transferSourceId}
                  onChange={(e) => setTransferSourceId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- {t('Select Source Department')} --</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.departmentName} (${Number(b.remainingAmount || 0).toFixed(0)} {t('available')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Destination Cost Center (Credit Reserve)')}</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- {t('Select Destination Department')} --</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Transfer Amount ($ USD)')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Reallocation Justification / Notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Reallocation for urgent STEM robotics kit purchase"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md">{t('Execute Reallocation')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
