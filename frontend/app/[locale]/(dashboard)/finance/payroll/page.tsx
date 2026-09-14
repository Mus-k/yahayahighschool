/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Users, Plus, Search, DollarSign, FileText,
  ShieldCheck, Printer, Building2, UserCheck,
  Receipt, RefreshCw, Trash2, Edit2, X, CheckCircle2,
  AlertTriangle, ChevronRight, Clock
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
import type { PayrollRun } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { generatePayslipPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffOption {
  id: string;
  documentId: string;
  name: string;
  role: string;
  department: string;
  baseSalary: number;
  salaryGrade: string;
  type: 'teacher' | 'worker';
}

function parseSalaryGrade(grade: string | null | undefined, type: 'teacher' | 'worker'): number {
  if (!grade) return type === 'teacher' ? 2800 : 1500;
  // If grade is a pure numeric string like "50000" or "250", use it
  const numeric = parseFloat(grade.replace(/[^0-9.]/g, ''));
  if (!isNaN(numeric) && numeric > 0) return numeric;
  // Grade A1 = 3200, A2 = 2800, B1 = 2200, etc.
  const map: Record<string, number> = {
    'grade a1': 3200, 'grade a2': 2800, 'grade a3': 2500,
    'grade b1': 2200, 'grade b2': 1900, 'grade b3': 1700,
    'grade c1': 1500, 'grade c2': 1300,
  };
  return map[grade.toLowerCase().trim()] ?? (type === 'teacher' ? 2800 : 1500);
}

const WORKFLOW_NEXT: Record<string, string> = {
  draft: 'submitted',
  submitted: 'reviewed',
  reviewed: 'approved',
  approved: 'paid',
  paid: 'closed',
};

const WORKFLOW_LABEL: Record<string, string> = {
  submitted: 'Submit for Review',
  reviewed: 'Mark Reviewed',
  approved: 'Approve',
  paid: 'Disburse & Post to GL',
  closed: 'Close Run',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function StaffPayrollRunsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState<PayrollRun | null>(null);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PayrollRun | null>(null);

  // Staff picker
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffQuery, setStaffQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);

  // Form state
  const [payPeriod, setPayPeriod] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [department, setDepartment] = useState('');
  const [staffId, setStaffId] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [overtimeAmount, setOvertimeAmount] = useState('0');
  const [deductionsAmount, setDeductionsAmount] = useState('0');
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // ── Load Payrolls ──────────────────────────────────────────────────────────
  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getPayrollRuns();
      setPayrolls(data || []);
    } catch {
      toast.error(t('Failed to load payroll runs'));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load Staff from Strapi ─────────────────────────────────────────────────
  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const [teachersRes, workersRes] = await Promise.all([
        // Use flat params — nested objects cause 400 with Strapi v5
        apiClient.get('/teachers', {
          params: { 'pagination[limit]': 200, 'sort': 'name:asc' }
        }),
        apiClient.get('/workers', {
          params: { 'pagination[limit]': 200, 'sort': 'name:asc' }
        }),
      ]);

      // Filter active staff client-side (avoids 400 from nested filter params)
      const rawTeachers = (teachersRes.data?.data || []).filter((t: any) =>
        !t.employmentStatus || t.employmentStatus === 'active'
      );
      const rawWorkers = (workersRes.data?.data || []).filter((w: any) =>
        !w.employmentStatus || w.employmentStatus === 'active'
      );

      const teachers: StaffOption[] = rawTeachers.map((t: any) => ({
        id: t.schoolId || `TCH-${t.id}`,
        documentId: t.documentId,
        name: t.name || 'Unknown Teacher',
        // Teachers have no 'title' field — use specializations or a default label
        role: t.specializations || 'Academic Faculty / Teacher',
        // Teachers have no 'department' field
        department: 'Academic Faculty',
        baseSalary: parseSalaryGrade(t.salaryGrade, 'teacher'),
        salaryGrade: t.salaryGrade || 'Grade A2',
        type: 'teacher' as const,
      }));

      const workers: StaffOption[] = rawWorkers.map((w: any) => ({
        id: w.schoolId || `WRK-${w.id}`,
        documentId: w.documentId,
        name: w.name || 'Unknown Worker',
        // Workers DO have a 'role' field (real job title e.g. "Cleaner / Janitor")
        role: w.role || 'Administrative Staff',
        department: w.department || 'Operations & Support',
        baseSalary: parseSalaryGrade(w.salaryGrade, 'worker'),
        salaryGrade: w.salaryGrade || 'Grade C1',
        type: 'worker' as const,
      }));

      setStaffOptions([...teachers, ...workers]);
    } catch (err) {
      console.error('Load staff error:', err);
      toast.error(t('Failed to load staff list'));
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrolls();
    loadStaff();
  }, [loadPayrolls, loadStaff]);

  // ── Filtered staff ─────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const q = staffQuery.toLowerCase().trim();
    if (!q) return staffOptions;
    return staffOptions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  }, [staffOptions, staffQuery]);

  // ── Filtered payrolls ──────────────────────────────────────────────────────
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(p => {
      const ref = p.payrollNumber || `PAY-${new Date().getFullYear()}-${String(p.id).padStart(4, '0')}`;
      const matchQ = !query ||
        ref.toLowerCase().includes(query.toLowerCase()) ||
        (p.staffName || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.staffId || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.payPeriod || '').toLowerCase().includes(query.toLowerCase());
      const matchS = statusFilter === 'all' || p.status === statusFilter;
      return matchQ && matchS;
    });
  }, [payrolls, query, statusFilter]);

  // ── Open Create Modal ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setSelectedStaff(null);
    setStaffQuery('');
    setPayPeriod(`${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()} Monthly Run`);
    setStaffName(''); setStaffRole(''); setDepartment('');
    setStaffId(''); setBaseSalary('');
    setOvertimeAmount('0'); setDeductionsAmount('0'); setAttendanceRate(100);
    setShowModal(true);
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────
  const openEdit = (p: PayrollRun) => {
    setEditTarget(p);
    setSelectedStaff(null);
    setStaffQuery('');
    setPayPeriod(p.payPeriod || '');
    setStaffName(p.staffName || '');
    setStaffRole(p.staffRole || '');
    setDepartment(p.department || '');
    setStaffId((p as any).staffId || '');
    setBaseSalary(String(p.baseSalary || ''));
    setOvertimeAmount(String(p.overtimeAmount || '0'));
    setDeductionsAmount(String(p.deductionsAmount || '0'));
    setAttendanceRate(Number(p.attendanceRate || 100));
    setShowModal(true);
  };

  // ── Select Staff from picker ───────────────────────────────────────────────
  const handleSelectStaff = (staff: StaffOption) => {
    setSelectedStaff(staff);
    setStaffName(staff.name);
    setStaffRole(staff.role);
    setDepartment(staff.department);
    setStaffId(staff.id);
    setBaseSalary(String(staff.baseSalary));
    setOvertimeAmount('0');
    setDeductionsAmount('0');
    setAttendanceRate(100);
  };

  // ── Net payable calc ───────────────────────────────────────────────────────
  const netPayable = useMemo(() => {
    const base = parseFloat(baseSalary || '0');
    const ot = parseFloat(overtimeAmount || '0');
    const ded = parseFloat(deductionsAmount || '0');
    // Attendance deduction: if attendance < 100, pro-rate base
    const attendanceFactor = attendanceRate / 100;
    const effectiveBase = base * attendanceFactor;
    return Math.max(0, effectiveBase + ot - ded);
  }, [baseSalary, overtimeAmount, deductionsAmount, attendanceRate]);

  // ── Save (Create or Edit) ──────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) { toast.error(t('Please select a staff member')); return; }
    if (!baseSalary || parseFloat(baseSalary) <= 0) { toast.error(t('Base salary is required')); return; }
    setIsSaving(true);
    try {
      const payload = {
        payPeriod,
        staffId,
        staffName,
        staffRole,
        department,
        baseSalary: parseFloat(baseSalary),
        overtimeHours: Math.round(parseFloat(overtimeAmount || '0') / 35),
        overtimeAmount: parseFloat(overtimeAmount || '0'),
        deductionsAmount: parseFloat(deductionsAmount || '0'),
        netPayable,
        attendanceRate,
        status: editTarget?.status || 'draft',
      };

      if (editTarget) {
        const targetId = (editTarget as any).documentId || editTarget.id;
        await apiClient.put(`/finance-payrolls/${targetId}`, { data: payload });
        toast.success(t('Payroll run updated successfully'));
      } else {
        const payrollNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await apiClient.post('/finance-payrolls', { data: { ...payload, payrollNumber } });
        toast.success(`${t('Payroll run created')}: ${payrollNumber} — Net: $${netPayable.toFixed(2)}`);
      }
      setShowModal(false);
      loadPayrolls();
    } catch (err: any) {
      console.error('Save payroll error:', err);
      toast.error(err.message || t('Failed to save payroll run'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (p: PayrollRun) => {
    if (!confirm(t('Are you sure you want to delete this payroll run?'))) return;
    const targetId = (p as any).documentId || p.id;
    setDeletingId(String(p.id));
    try {
      await apiClient.delete(`/finance-payrolls/${targetId}`);
      setPayrolls(prev => prev.filter(x => x.id !== p.id));
      toast.success(t('Payroll run deleted'));
    } catch {
      toast.error(t('Failed to delete payroll run'));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Advance Workflow ───────────────────────────────────────────────────────
  const handleAdvanceWorkflow = async (p: PayrollRun) => {
    const nextStatus = WORKFLOW_NEXT[p.status];
    if (!nextStatus) return;
    const targetId = (p as any).documentId || p.id;
    const refNum = p.payrollNumber || `PAY-${new Date().getFullYear()}-${String(p.id).padStart(4, '0')}`;
    setAdvancingId(String(p.id));
    try {
      if (nextStatus === 'paid') {
        // Mark paid AND generate a GL journal entry reference
        const glRef = `GL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        await apiClient.put(`/finance-payrolls/${targetId}`, {
          data: { status: 'paid', journalEntryId: glRef }
        });
        toast.success(`✅ ${refNum} ${t('Disbursed!')} GL Journal posted: ${glRef} — Debit 5010 Faculty Salaries $${(p.netPayable || 0).toFixed(2)}, Credit 1010 Bank`);
      } else {
        await financeService.updatePayrollStatus(targetId, nextStatus);
        toast.success(`${refNum} ${t('advanced to')} [${nextStatus.toUpperCase()}]`);
      }
      loadPayrolls();
    } catch (err: any) {
      toast.error(err.message || t('Workflow update failed'));
    } finally {
      setAdvancingId(null);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filteredPayrolls.length) { toast.error(t('No records to export')); return; }
    const headers = ['Voucher Ref', 'Pay Period', 'Staff ID', 'Staff Name', 'Role', 'Dept', 'Base Salary', 'OT Amount', 'Deductions', 'Attendance %', 'Net Payable', 'Status'];
    const rows = filteredPayrolls.map(p => {
      const ref = p.payrollNumber || `PAY-${new Date().getFullYear()}-${String(p.id).padStart(4, '0')}`;
      return [
        `"${ref}"`, `"${p.payPeriod || ''}"`, `"${(p as any).staffId || ''}"`,
        `"${p.staffName || ''}"`, `"${p.staffRole || ''}"`, `"${p.department || ''}"`,
        p.baseSalary, p.overtimeAmount, p.deductionsAmount, p.attendanceRate, p.netPayable, `"${p.status}"`
      ].join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Payroll_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(t('Exported payroll runs to CSV'));
  };

  // ── KPI ────────────────────────────────────────────────────────────────────
  const totalOutflow = useMemo(() => payrolls.reduce((s, p) => s + (p.netPayable || 0), 0), [payrolls]);
  const avgAttendance = useMemo(() => payrolls.length ? payrolls.reduce((s, p) => s + (Number(p.attendanceRate) || 100), 0) / payrolls.length : 100, [payrolls]);
  const approvedCount = useMemo(() => payrolls.filter(p => p.status === 'approved' || p.status === 'paid').length, [payrolls]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'outflow', title: t('Monthly Staff Payroll Outflow'),
      value: `$${totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${payrolls.length} ${t('payroll vouchers processed')}`,
      trendDirection: 'neutral', icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'attendance', title: t('Faculty Attendance Rate'),
      value: `${avgAttendance.toFixed(1)}%`,
      subtitle: t('Verified before payout'),
      trendDirection: 'up', icon: <UserCheck className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'approved', title: t('Approved & Payout Ready'),
      value: `${approvedCount} ${t('Staff')}`,
      subtitle: t('Multi-stage approval passed'),
      trendDirection: 'up', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'payslips', title: t('Electronic Payslips'),
      value: '100% Digital',
      subtitle: t('PDF payslips with QR verification'),
      trendDirection: 'up', icon: <FileText className="w-5 h-5 text-amber-400" />
    },
  ];

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<PayrollRun, any>[]>(() => [
    {
      accessorKey: 'payrollNumber',
      header: t('Voucher & Period'),
      cell: ({ row }) => {
        const p = row.original;
        const ref = p.payrollNumber || `PAY-${new Date().getFullYear()}-${String(p.id).padStart(4, '0')}`;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 block">{ref}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{p.payPeriod || t('Monthly Run')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'staffName',
      header: t('Staff Member'),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {p.staffName}{' '}
              {(p as any).staffId && <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">({(p as any).staffId})</span>}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate max-w-[200px]">
              {p.staffRole} · {p.department}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'attendanceRate',
      header: t('Attendance & OT'),
      cell: ({ row }) => {
        const p = row.original;
        const att = Number(p.attendanceRate) || 100;
        return (
          <div className="space-y-0.5 font-mono text-xs">
            <span className={cn('font-extrabold block', att >= 90 ? 'text-emerald-600 dark:text-emerald-400' : att >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
              {att}%
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold block">+${(Number(p.overtimeAmount) || 0).toFixed(2)} OT</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'netPayable',
      header: t('Compensation'),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="space-y-0.5 font-mono text-xs">
            <span className="text-slate-600 dark:text-slate-400 block">Base: ${(Number(p.baseSalary) || 0).toFixed(2)}</span>
            {(Number(p.deductionsAmount) || 0) > 0 && (
              <span className="text-rose-600 dark:text-rose-400 block">-${(Number(p.deductionsAmount) || 0).toFixed(2)}</span>
            )}
            <span className="font-black text-emerald-700 dark:text-emerald-400 block text-sm">
              ${(Number(p.netPayable) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Workflow Stage'),
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge status={row.original.status} size="sm" />
          {row.original.journalEntryId && (
            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 block">{row.original.journalEntryId}</span>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const p = row.original;
        const nextStatus = WORKFLOW_NEXT[p.status];
        const isAdvancing = advancingId === String(p.id);
        const isDeleting = deletingId === String(p.id);
        return (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {nextStatus && (
              <button
                onClick={() => handleAdvanceWorkflow(p)}
                disabled={isAdvancing}
                title={WORKFLOW_LABEL[nextStatus] || nextStatus}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-[10px] shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isAdvancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                {WORKFLOW_LABEL[nextStatus] || nextStatus}
              </button>
            )}
            <button
              onClick={() => openEdit(p)}
              disabled={p.status === 'closed' || p.status === 'paid'}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-slate-500 hover:text-sky-600 transition cursor-pointer disabled:opacity-40"
              title={t('Edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowPayslipModal(p)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-500 hover:text-amber-600 transition cursor-pointer"
              title={t('Print Payslip')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(p)}
              disabled={p.status === 'paid' || p.status === 'closed' || isDeleting}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 transition cursor-pointer disabled:opacity-40"
              title={t('Delete')}
            >
              {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      }
    }
  ], [advancingId, deletingId, payrolls]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <EnterpriseModuleShell
      title={t('Staff Payroll Runs & HR Compensation Console')}
      description={t('Generate monthly staff payroll vouchers, manage multi-stage approval workflow, and post GL disbursements.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Payroll') }, { label: t('Staff Payroll Runs') }]}
      icon={<Users className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredPayrolls.length}
      recordLabel={t('Payroll Vouchers')}
      activeFilterCount={statusFilter !== 'all' ? 1 : 0}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/payroll/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('Approval Pipeline')}</span>
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('Generate Payroll Run')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /><span>{t('Staff Payroll Runs')}</span>
        </Link>
        <Link href="/finance/payroll/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>{t('Approval Pipeline')}</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" /><span>{t('Operating Expenses')}</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" /><span>{t('Budget vs Actual')}</span>
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'draft', 'submitted', 'reviewed', 'approved', 'paid', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer capitalize',
              statusFilter === s
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
            )}
          >
            {s === 'all' ? t('All Runs') : s}
            {s !== 'all' && (
              <span className="ml-1 opacity-70">({payrolls.filter(p => p.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search by voucher ref, staff ID, name, or period...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadPayrolls(); toast.success(t('Payroll records refreshed')); }}
        onPrint={() => window.print()}
        onExport={handleExportCSV}
        onImport={() => toast.info(t('CSV bulk import coming soon'))}
        activeFilterCount={statusFilter !== 'all' ? 1 : 0}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel={t('New Payroll Run')}
        onCreate={openCreate}
      />

      <EnterpriseDataGrid
        data={filteredPayrolls}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={row => setSelectedPayroll(row)}
        onRowClick={row => setSelectedPayroll(row)}
        emptyStateProps={{
          title: t('No Payroll Runs Found'),
          description: t('Generate your first payroll voucher for faculty or support staff.'),
          isFilterActive: statusFilter !== 'all' || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: t('Generate First Run'),
          onCreate: openCreate
        }}
      />

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editTarget ? t('Edit Payroll Run') : t('Generate Payroll Run')}
                  </h3>
                  <p className="text-[11px] text-slate-400">{t('Monthly faculty & administrative compensation voucher')}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5">
              {/* Staff picker — only in create mode */}
              {!editTarget && (
                <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider">{t('Search Staff by Name or ID')}</h4>
                    {staffLoading && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={staffQuery}
                      onChange={e => setStaffQuery(e.target.value)}
                      placeholder={t('Search by name, ID (TCH-2026-001, OK000000001), or role...')}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-600 text-white text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-slate-700 rounded-xl bg-slate-900 divide-y divide-slate-800">
                    {filteredStaff.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {staffLoading ? t('Loading staff...') : t('No staff matching your search')}
                      </div>
                    ) : filteredStaff.map(staff => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => handleSelectStaff(staff)}
                        className={cn(
                          'w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition-all',
                          selectedStaff?.id === staff.id ? 'bg-emerald-950/70 border-l-4 border-emerald-400' : ''
                        )}
                      >
                        <div>
                          <span className="font-bold text-white text-xs block">{staff.name}</span>
                          <span className="text-[11px] text-slate-400">{staff.role} · {staff.department}</span>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 text-[11px] block">{staff.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">${staff.baseSalary.toFixed(0)}/mo</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedStaff && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-emerald-300">{selectedStaff.name} ({selectedStaff.id}) — {selectedStaff.salaryGrade}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Period & Staff Details */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('Payroll Period')}</label>
                <input
                  type="text"
                  required
                  value={payPeriod}
                  onChange={e => setPayPeriod(e.target.value)}
                  placeholder="August 2026 Monthly Run"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('Staff Name')}</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('Job Role / Title')}</label>
                  <input
                    type="text"
                    required
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Compensation breakdown */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                <h4 className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider">{t('Compensation Breakdown (USD)')}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">{t('Base Salary')}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={baseSalary}
                      onChange={e => setBaseSalary(e.target.value)}
                      placeholder="2800"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">{t('Overtime (+)')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overtimeAmount}
                      onChange={e => setOvertimeAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">{t('Deductions (-)')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deductionsAmount}
                      onChange={e => setDeductionsAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-rose-400 text-xs font-mono font-bold focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Attendance rate slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300">{t('Attendance Rate')}</label>
                    <span className={cn('text-xs font-black font-mono', attendanceRate >= 90 ? 'text-emerald-400' : attendanceRate >= 75 ? 'text-amber-400' : 'text-rose-400')}>
                      {attendanceRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={attendanceRate}
                    onChange={e => setAttendanceRate(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  {attendanceRate < 100 && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('Effective base')}: ${(parseFloat(baseSalary || '0') * attendanceRate / 100).toFixed(2)} ({attendanceRate}% of base)
                    </p>
                  )}
                </div>
              </div>

              {/* Net payable preview */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-400">{t('Net Payable')}:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400 block drop-shadow-sm">
                    ${netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? t('Saving...') : editTarget ? t('Update Run') : t('Generate Run')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Payslip Modal ────────────────────────────────────────────────── */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{t('Official Payslip')}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Ref: {showPayslipModal.payrollNumber || `PAY-${new Date().getFullYear()}-${String(showPayslipModal.id).padStart(4, '0')}`} · {showPayslipModal.payPeriod}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPayslipModal(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3 text-xs font-mono">
              <div className="flex justify-between items-start border-b border-slate-700 pb-3">
                <div>
                  <h4 className="font-extrabold text-white text-base">{showPayslipModal.staffName}</h4>
                  <p className="text-slate-300 text-xs">{showPayslipModal.staffRole} · {showPayslipModal.department}</p>
                  {(showPayslipModal as any).staffId && <p className="text-emerald-400 text-[10px] font-mono mt-0.5">{(showPayslipModal as any).staffId}</p>}
                </div>
                <StatusBadge status={showPayslipModal.status} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-300">{t('Base Salary')}:</span>
                  <span className="text-white font-bold">${(Number(showPayslipModal.baseSalary) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">{t('Attendance')}: {showPayslipModal.attendanceRate || 100}%</span>
                  <span className="text-white">${(Number(showPayslipModal.baseSalary) * Number(showPayslipModal.attendanceRate || 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-emerald-400">{t('Overtime')} ({showPayslipModal.overtimeHours || 0} hrs):</span>
                  <span className="text-emerald-400 font-bold">+${(Number(showPayslipModal.overtimeAmount) || 0).toFixed(2)}</span>
                </div>
                {(Number(showPayslipModal.deductionsAmount) || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-rose-400">{t('Deductions')}:</span>
                    <span className="text-rose-400 font-bold">-${(Number(showPayslipModal.deductionsAmount) || 0).toFixed(2)}</span>
                  </div>
                )}
                {showPayslipModal.journalEntryId && (
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-sky-400">{t('GL Settlement')}:</span>
                    <span className="text-sky-400 font-bold">{showPayslipModal.journalEntryId}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-black text-white border-t border-slate-600">
                  <span className="text-sm">{t('Net Payable')}:</span>
                  <span className="text-emerald-400 text-base">${(Number(showPayslipModal.netPayable) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono">{t('QR-Verified')}: QR-PAY-{new Date().getFullYear()}</span>
              <button
                onClick={async () => {
                  toast.success(t('Generating PDF payslip...'));
                  await generatePayslipPDF(showPayslipModal);
                  setShowPayslipModal(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {t('Download PDF Payslip')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Out Drawer ─────────────────────────────────────────────── */}
      <SlideOutDrawer
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        record={selectedPayroll ? {
          name: selectedPayroll.staffName,
          id: selectedPayroll.payrollNumber || `PAY-${new Date().getFullYear()}-${String(selectedPayroll.id).padStart(4, '0')}`,
          role: selectedPayroll.staffRole,
          status: selectedPayroll.status,
          email: `${t('Department')}: ${selectedPayroll.department}`,
          phone: `${t('Period')}: ${selectedPayroll.payPeriod}`,
          department: `${t('Attendance')}: ${selectedPayroll.attendanceRate || 100}%`,
          joinDate: `${t('Base')}: $${(Number(selectedPayroll.baseSalary) || 0).toFixed(2)} | OT: +$${(Number(selectedPayroll.overtimeAmount) || 0).toFixed(2)} | Ded: -$${(Number(selectedPayroll.deductionsAmount) || 0).toFixed(2)}`,
          balance: selectedPayroll.journalEntryId
            ? `GL: ${selectedPayroll.journalEntryId} | NET: $${(Number(selectedPayroll.netPayable) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : `NET: $${(Number(selectedPayroll.netPayable) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
