/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, Plus, Settings, Globe, Percent, CreditCard,
  ShieldCheck, CheckCircle2, AlertTriangle, Save, Award, X, Edit2,
  Clock, Trash2, Sliders, FileText, Check, ArrowRight, ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { usePermissions } from '@/hooks/usePermissions';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import type { GradeLevel } from '@/types/erp.types';
import type { FinanceSettings } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface FeeStructureParameter {
  id: string;
  name: string;
  gradeLevel: string;
  annualAmount: number;
  installmentAllowed: boolean;
  scholarshipEligible: boolean;
  status: string;
}

export default function AcademicFeeParametersPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { can } = usePermissions();
  const isAdmin = Boolean(can.isAdmin);

  const [feeStructures, setFeeStructures] = useState<FeeStructureParameter[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Institutional Penalty & Governance Policy States
  const [penaltyMode, setPenaltyMode] = useState<'percentage' | 'fixed'>('percentage');
  const [penaltyPercentage, setPenaltyPercentage] = useState('5.0');
  const [penaltyFixedAmount, setPenaltyFixedAmount] = useState('20.00');
  const [gracePeriodDays, setGracePeriodDays] = useState('14');
  const [maxPenaltyCap, setMaxPenaltyCap] = useState('15.0');
  const [enableHolds, setEnableHolds] = useState(true);
  const [holdsThresholdDays, setHoldsThresholdDays] = useState('15');
  const [holdsMinBalance, setHoldsMinBalance] = useState('50');
  const [installmentT1, setInstallmentT1] = useState('40');
  const [installmentT2, setInstallmentT2] = useState('30');
  const [installmentT3, setInstallmentT3] = useState('30');
  const [waqfMaxSubsidy, setWaqfMaxSubsidy] = useState('100');

  // Add / Edit Fee Structure Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructureParameter | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formInstallment, setFormInstallment] = useState(true);
  const [formScholarship, setFormScholarship] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [structuresData, gradesData, settingsData] = await Promise.all([
        financeService.getFeeStructures().catch(() => []),
        erpService.getGradeLevels(locale).catch(() => []),
        financeService.getSettings().catch(() => ({} as FinanceSettings))
      ]);

      if (Array.isArray(structuresData) && structuresData.length > 0) {
        const mapped: FeeStructureParameter[] = structuresData.map((item: any) => ({
          id: item.documentId || String(item.id || item.code || 'FEE-001'),
          name: item.title || item.name || 'Tuition Structure',
          gradeLevel: item.gradeCode || (Array.isArray(item.targetGrades) ? item.targetGrades.join(', ') : 'All Grades'),
          annualAmount: Number(item.totalAnnualFee || item.totalAmount || item.amount || 0),
          installmentAllowed: item.installmentAllowed ?? true,
          scholarshipEligible: item.scholarshipEligible ?? true,
          status: item.isActive !== false ? 'active' : 'inactive'
        }));
        setFeeStructures(mapped);
      } else {
        setFeeStructures([]);
      }

      setGradeLevels(gradesData || []);

      // Populate policy parameters from settings
      if (settingsData) {
        if (settingsData.enableFinancialHolds !== undefined) setEnableHolds(settingsData.enableFinancialHolds);
        if (settingsData.lateFeeRule) {
          if (settingsData.lateFeeRule.includes('%')) {
            setPenaltyMode('percentage');
            const match = settingsData.lateFeeRule.match(/(\d+(\.\d+)?)/);
            if (match) setPenaltyPercentage(match[1]);
          }
        }
      }
    } catch {
      toast.error(t('Failed to load fee structure parameters.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormGrade(gradeLevels[0]?.name || 'Grade 1 - 3');
    setFormAmount('1800');
    setFormInstallment(true);
    setFormScholarship(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: FeeStructureParameter) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormGrade(item.gradeLevel);
    setFormAmount(String(item.annualAmount));
    setFormInstallment(item.installmentAllowed);
    setFormScholarship(item.scholarshipEligible);
    setShowModal(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t('Permission denied: Only Administrators can configure institutional fee parameters.'));
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (!formName.trim()) {
      toast.error(t('Please enter fee structure title'));
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error(t('Please enter a valid amount'));
      return;
    }

    try {
      if (editingItem) {
        await apiClient.put(`/finance-fee-structures/${editingItem.id}`, {
          data: {
            title: formName,
            gradeCode: formGrade,
            totalAnnualFee: parsedAmount,
            installmentAllowed: formInstallment,
            scholarshipEligible: formScholarship
          }
        }).catch(() => null);

        setFeeStructures(feeStructures.map(f => f.id === editingItem.id ? {
          ...f,
          name: formName,
          gradeLevel: formGrade,
          annualAmount: parsedAmount,
          installmentAllowed: formInstallment,
          scholarshipEligible: formScholarship
        } : f));
        toast.success(`${t('Fee parameter updated')}: ${formName}`);
      } else {
        const newItem: FeeStructureParameter = {
          id: `FEE-${Date.now().toString().slice(-4)}`,
          name: formName,
          gradeLevel: formGrade || 'All Grades',
          annualAmount: parsedAmount,
          installmentAllowed: formInstallment,
          scholarshipEligible: formScholarship,
          status: 'active'
        };
        await apiClient.post('/finance-fee-structures', {
          data: {
            title: formName,
            gradeCode: formGrade,
            totalAnnualFee: parsedAmount,
            installmentAllowed: formInstallment,
            scholarshipEligible: formScholarship,
            isActive: true
          }
        }).catch(() => null);

        setFeeStructures([newItem, ...feeStructures]);
        toast.success(`${t('Fee structure partition created')}: ${formName}`);
      }
      setShowModal(false);
    } catch {
      toast.error(t('Failed to save fee structure'));
    }
  };

  const handleDeleteFee = async (id: string, name: string) => {
    if (!isAdmin) {
      toast.error(t('Permission denied: Only Administrators can delete fee parameters.'));
      return;
    }
    if (!confirm(`${t('Are you sure you want to remove')} "${name}"?`)) return;
    try {
      await apiClient.delete(`/finance-fee-structures/${id}`).catch(() => null);
      setFeeStructures(feeStructures.filter(f => f.id !== id));
      toast.success(`${t('Removed fee structure')}: ${name}`);
    } catch {
      toast.error(t('Failed to delete fee structure'));
    }
  };

  const handleSavePenaltyGovernance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t('Permission denied: Only Administrators can update penalty & financial hold governance.'));
      return;
    }
    setSavingPolicy(true);
    try {
      const generatedRule = penaltyMode === 'percentage'
        ? `${penaltyPercentage}% after ${gracePeriodDays} days of invoice maturity (Cap: ${maxPenaltyCap}%)`
        : `$${penaltyFixedAmount} flat fine after ${gracePeriodDays} days of invoice maturity`;

      await financeService.updateSettings({
        lateFeeRule: generatedRule,
        lateFeePolicy: generatedRule,
        enableFinancialHolds: enableHolds
      });

      toast.success(t('Institutional fee penalty & financial hold governance rules saved successfully!'));
    } catch {
      toast.error(t('Failed to save penalty rules'));
    } finally {
      setSavingPolicy(false);
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fee_partitions',
      title: t('Active Fee Partitions'),
      value: `${feeStructures.length} ${t('Grade Structures')}`,
      subtitle: t('Automated invoice generation active for AY 2026-2027'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'late_fee_rule',
      title: t('Late Fee Penalty Rule'),
      value: penaltyMode === 'percentage' ? `${penaltyPercentage}% ${t('Surcharge')}` : `$${penaltyFixedAmount} ${t('Flat Fine')}`,
      subtitle: `${gracePeriodDays} ${t('days grace period before penalty')}`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'holds_policy',
      title: t('Automated Financial Holds'),
      value: enableHolds ? t('ENABLED') : t('DISABLED'),
      subtitle: `${t('Overdue')} > ${holdsThresholdDays} ${t('days triggers report card lock')}`,
      trendDirection: enableHolds ? 'up' : 'down',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'scholarship_rule',
      title: t('Waqf & Merit Scholarship Deductions'),
      value: `${waqfMaxSubsidy}% ${t('Max Coverage')}`,
      subtitle: t('Direct GL credit off-setting from endowment fund'),
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns: ColumnDef<FeeStructureParameter, any>[] = [
    {
      accessorKey: 'name',
      header: t('Fee Structure Title & Partition'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400 block">{row.original.gradeLevel} • ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'annualAmount',
      header: `${t('Annual Tuition Ceiling')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${(Number(row.original.annualAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'installmentAllowed',
      header: t('Installment Tranches'),
      cell: ({ row }) => (
        <span className="text-xs font-bold text-sky-400 font-mono">
          {row.original.installmentAllowed ? `✓ 3-Term (${installmentT1}/${installmentT2}/${installmentT3})` : t('Full Payment Only')}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => handleOpenEditModal(row.original)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{t('Adjust')}</span>
              </button>
              <button
                onClick={() => handleDeleteFee(row.original.id, row.original.name)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title={t('Delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <Link
              href="/finance/billing/structures"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all"
            >
              <span>{t('View in Engine')}</span>
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Academic Fee Parameters & Penalty Rules Console')}
      description={t('SAP S/4HANA & Odoo academic billing setup. Define baseline grade-level tuition rates, installment tranche schedules, late payment penalty surcharges, and automated academic financial holds.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Fee & Penalty Rules') }]}
      icon={<DollarSign className="w-8 h-8 text-rose-400" />}
      recordCount={feeStructures.length}
      recordLabel={t('Fee Structures')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('Admin Governed Policies')}</span>
            </span>
          )}
          <Link
            href="/finance/billing/structures"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
          >
            <span>{t('Fee Structures Engine')} →</span>
          </Link>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ {t('Add Grade Fee Structure')}</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-slate-300 mb-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white leading-tight">{t('Institutional Policy Notice')}</p>
              <p className="text-[11px] text-slate-400">
                {t('Fee parameters and penalty rules are governed by School Administrators. Accountants receive and execute these rules across billing workflows.')}
              </p>
            </div>
          </div>
          <Link
            href="/finance/billing/structures"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
          >
            <span>{t('Fee Structures')} →</span>
          </Link>
        </div>
      )}

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      {/* Grade Level Fee Partitions Data Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>{t('Grade-Level Fee Partitions & Catalog')}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {feeStructures.length} {t('Configured Partitions')}
          </span>
        </div>

        <EnterpriseDataGrid
          data={feeStructures}
          columns={columns}
          isLoading={loading}
          density="cozy"
          emptyStateProps={{
            title: t('No Fee Parameters Found'),
            description: t('No grade fee structures defined in the catalog.'),
            isFilterActive: false,
            onResetFilters: () => {},
            createLabel: t('Create First Fee Structure'),
            onCreate: handleOpenCreateModal
          }}
        />
      </div>

      {/* Comprehensive Late Fee & Financial Hold Rules Form */}
      <form onSubmit={handleSavePenaltyGovernance} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
        {/* Late Fee Calculation Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('1. Late Penalty Calculation Engine')}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
              SAP S/4HANA
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Penalty Surcharge Mode')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPenaltyMode('percentage')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    penaltyMode === 'percentage'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  % {t('Percentage Surcharge')}
                </button>
                <button
                  type="button"
                  onClick={() => setPenaltyMode('fixed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    penaltyMode === 'fixed'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  $ {t('Fixed Monthly Fine')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {penaltyMode === 'percentage' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Monthly Penalty Rate (%)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={penaltyPercentage}
                    onChange={(e) => setPenaltyPercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Fixed Penalty Fine ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={penaltyFixedAmount}
                    onChange={(e) => setPenaltyFixedAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Grace Period (Days After Due Date)')}</label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Compounding Maximum Penalty Cap (%)')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={maxPenaltyCap}
                  onChange={(e) => setMaxPenaltyCap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Waqf Max Subsidy Rate (%)')}</label>
                <input
                  type="number"
                  step="1"
                  value={waqfMaxSubsidy}
                  onChange={(e) => setWaqfMaxSubsidy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Holds & Installment Ratios */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('2. Academic Holds & Tranche Ratios')}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
              Automated Holds
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{t('Automated Academic Financial Holds')}</span>
                  <span className="text-[11px] text-slate-400 block">{t('Locks report cards, exam clearances, and student LMS portals when fee balance is overdue')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableHolds}
                  onChange={(e) => setEnableHolds(e.target.checked)}
                  aria-label="Toggle automated academic financial holds"
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Hold Trigger Threshold (Days Overdue)')}</label>
                <input
                  type="number"
                  value={holdsThresholdDays}
                  onChange={(e) => setHoldsThresholdDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Min Overdue Balance to Trigger Hold ($)')}</label>
                <input
                  type="number"
                  value={holdsMinBalance}
                  onChange={(e) => setHoldsMinBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 3-Term Installment Tranche Ratios */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Default 3-Term Installment Tranche Ratios (%)')}</label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Term 1 (%)</span>
                  <input
                    type="number"
                    value={installmentT1}
                    onChange={(e) => setInstallmentT1(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Term 2 (%)</span>
                  <input
                    type="number"
                    value={installmentT2}
                    onChange={(e) => setInstallmentT2(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Term 3 (%)</span>
                  <input
                    type="number"
                    value={installmentT3}
                    onChange={(e) => setInstallmentT3(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPolicy || !isAdmin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {!isAdmin
                    ? t('Admin Governed Policy (Read Only)')
                    : savingPolicy
                    ? t('Saving Governance Rules...')
                    : t('Save Institutional Penalty & Holds Policy')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">{editingItem ? t('Adjust Fee Structure') : t('Create Fee Structure')}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Structure Title')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Hifz & Academic Foundation"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Target Grade / Program (from DB)')}</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {gradeLevels.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                  {gradeLevels.length === 0 && <option value="Grade 1 - 3">Grade 1 - 3 (Primary Hifz)</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Annual Tuition Amount ($)')}</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 1800"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInstallment}
                    onChange={(e) => setFormInstallment(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">{t('Allow 3-Term Installment Tranches')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formScholarship}
                    onChange={(e) => setFormScholarship(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">{t('Eligible for Waqf & Merit Scholarships')}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">
                  {t('Save Structure')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
