/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { cn } from '@/lib/utils';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  Home,
  Key,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  PauseCircle, Phone, Printer,
  QrCode, Shield,
  StickyNote, User, Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/shared/Avatar';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import { auditService } from '@/services/audit.service';
import { getAttendanceRecords } from '@/services/lms.service';
import type { Teacher, Section } from '@/types/erp.types';
import type { PayrollRun } from '@/types/finance.types';
import type { AuditLog } from '@/types/audit.types';
import type { AttendanceRecord } from '@/types/lms.types';

export type DrawerTabId =
  | 'overview'
  | 'academic'
  | 'finance'
  | 'attendance'
  | 'hostel'
  | 'quran'
  | 'documents'
  | 'timeline'
  | 'audit'
  | 'permissions'
  | 'notes';

export interface SmartQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (record: any) => void;
}

export interface SlideOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  title?: string;
  category?: 'student' | 'teacher' | 'parent' | 'worker' | 'directory' | 'finance' | 'event' | 'admissions' | 'hostel' | 'transport' | 'library' | 'inventory' | 'asset' | 'procurement' | 'generic';
  quickActions?: SmartQuickAction[];
  customTabsContent?: Partial<Record<DrawerTabId | string, React.ReactNode>>;
  tabsListOverride?: { id: DrawerTabId | string; label: string; icon: React.ReactNode }[];
  hideIntelligence?: boolean;
  statsBarOverride?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function fmtDateTime(d?: string | null) {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

function fmtMoney(v: number | string | null | undefined, currency = 'USD') {
  const n = Number(v || 0);
  return n.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 2 });
}

function statusBadgeCls(status: string) {
  const s = (status || '').toLowerCase();
  if (['active', 'full_time', 'present'].includes(s)) return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
  if (['on_leave', 'part_time', 'late'].includes(s)) return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
  if (['suspended', 'retired', 'contract', 'absent'].includes(s)) return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600';
}

function payrollStatusCls(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'approved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (s === 'pending' || s === 'draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function auditSevCls(severity: string) {
  if (severity === 'critical') return 'text-rose-600 dark:text-rose-400';
  if (severity === 'high') return 'text-amber-600 dark:text-amber-400';
  if (severity === 'medium') return 'text-sky-600 dark:text-sky-400';
  return 'text-slate-500 dark:text-slate-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function InfoCard({ label, value, mono = false, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={cn('p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs', className)}>
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      <p className={cn('text-xs font-bold text-slate-900 dark:text-white', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
      {children}
    </h3>
  );
}

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      {label && <p className="text-xs text-slate-400 mt-2">{label}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Overview
// ─────────────────────────────────────────────────────────────────────────────

function TeacherOverviewTab({ record, teacher }: { record: any; teacher: Teacher | null }) {
  const t: any = teacher || record;
  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <SectionTitle>Personal & Employment Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Full Name" value={t.name || t.fullName} />
          <InfoCard label="Staff ID" value={t.schoolId || t.teacherId} mono />
          <InfoCard label="Gender" value={t.gender ? (t.gender.charAt(0).toUpperCase() + t.gender.slice(1)) : null} />
          <InfoCard label="Employment Status" value={
            <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize', statusBadgeCls(t.employmentStatus || 'active'))}>
              {(t.employmentStatus || 'active').replace(/_/g, ' ')}
            </span>
          } />
          <InfoCard label="Employment Date" value={fmtDate(t.employmentDate)} />
          <InfoCard label="Salary Grade" value={t.salaryGrade} mono />
        </div>
      </div>

      <div>
        <SectionTitle>Academic Qualifications</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Qualifications" value={t.qualifications} />
          <InfoCard label="Specializations" value={t.specializations} />
          <InfoCard label="Experience" value={t.experienceYears != null ? `${t.experienceYears} year${t.experienceYears !== 1 ? 's' : ''}` : null} />
          {Array.isArray(t.departments) && t.departments.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Departments</span>
              <div className="flex flex-wrap gap-1.5">
                {t.departments.map((d: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full text-[10px] font-bold">
                    {d.name || d.title || d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(t.programs) && t.programs.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Programs</span>
              <div className="flex flex-wrap gap-1.5">
                {t.programs.map((p: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 rounded-full text-[10px] font-bold">
                    {p.name || p.title || p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {t.biography && (
        <div>
          <SectionTitle>Biography</SectionTitle>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">{t.biography}</p>
        </div>
      )}

      <div>
        <SectionTitle>Contact & Emergency</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {t.phone && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Phone</span>
                <strong className="text-xs font-mono text-slate-900 dark:text-white">{t.phone}</strong>
              </div>
            </div>
          )}
          {t.email && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
              <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Email</span>
                <strong className="text-xs font-mono text-slate-900 dark:text-white break-all">{t.email}</strong>
              </div>
            </div>
          )}
          {t.address && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 col-span-full shadow-2xs">
              <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Address</span>
                <strong className="text-xs text-slate-900 dark:text-white">{t.address}</strong>
              </div>
            </div>
          )}
          {t.emergencyContact && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 col-span-full shadow-2xs">
              <Phone className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">Emergency Contact</span>
                <strong className="text-xs font-mono text-slate-900 dark:text-white">{t.emergencyContact}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Classes & Subjects
// ─────────────────────────────────────────────────────────────────────────────

function TeacherClassesTab({ record, teacher }: { record: any; teacher: Teacher | null }) {
  const t: any = teacher || record;
  const sections: any[] = Array.isArray(t.sections) ? t.sections : [];
  const totalStudents = sections.reduce((sum: number, s: any) => sum + (s.students?.length || s.studentCount || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-center">
          <p className="text-2xl font-black text-sky-700 dark:text-sky-300">{sections.length}</p>
          <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase mt-1">Sections</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totalStudents || '—'}</p>
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1">Students</p>
        </div>
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-center">
          <p className="text-2xl font-black text-violet-700 dark:text-violet-300">{(t.departments || []).length || '—'}</p>
          <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase mt-1">Depts</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <div>
          <SectionTitle>Assigned Sections</SectionTitle>
          <div className="space-y-2">
            {sections.map((sec: any, i: number) => (
              <div key={sec.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{sec.sectionName || sec.name || `Section ${i + 1}`}</p>
                    {sec.code && <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{sec.code}</p>}
                  </div>
                </div>
                {(sec.students?.length || sec.studentCount) ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <Users className="w-3 h-3" />
                    {sec.students?.length || sec.studentCount}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No sections assigned yet.
        </div>
      )}

      <div>
        <SectionTitle>Academic Profile</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Specializations" value={t.specializations} />
          <InfoCard label="Qualifications" value={t.qualifications} />
          <InfoCard label="Experience Years" value={t.experienceYears != null ? `${t.experienceYears} yr${t.experienceYears !== 1 ? 's' : ''}` : null} />
          {Array.isArray(t.departments) && t.departments.length > 0 && (
            <div className="col-span-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Departments</span>
              <div className="flex flex-wrap gap-1.5">
                {t.departments.map((d: any, i: number) => (
                  <span key={i} className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full text-[10px] font-bold">
                    {d.name || d.title || d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Payroll & Salary
// ─────────────────────────────────────────────────────────────────────────────

function TeacherPayrollTab({ record, payrollRuns, loadingPayroll }: { record: any; payrollRuns: PayrollRun[]; loadingPayroll: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <SectionTitle>Salary & Employment</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Salary Grade" value={record.salaryGrade} mono />
          <InfoCard label="Employment Type" value={<span className="capitalize">{(record.employmentStatus || 'active').replace(/_/g, ' ')}</span>} />
          <InfoCard label="Employment Date" value={fmtDate(record.employmentDate)} />
        </div>
      </div>

      <div>
        <SectionTitle>Payroll Runs</SectionTitle>
        {loadingPayroll ? (
          <LoadingSpinner label="Loading payroll data…" />
        ) : payrollRuns.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Gross</th>
                  <th className="px-4 py-2.5">Deductions</th>
                  <th className="px-4 py-2.5">Net Pay</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payrollRuns.slice(0, 10).map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {run.payPeriod || (run.month && run.year ? `${new Date(0, run.month - 1).toLocaleString('default', { month: 'short' })} ${run.year}` : run.payrollNumber || '—')}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">{fmtMoney(run.totalGrossPay || run.baseSalary)}</td>
                    <td className="px-4 py-2.5 font-mono text-rose-600 dark:text-rose-400">-{fmtMoney(run.totalDeductions || run.deductionsAmount)}</td>
                    <td className="px-4 py-2.5 font-black font-mono text-emerald-700 dark:text-emerald-300">{fmtMoney(run.totalNetPay || run.netPayable)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold capitalize', payrollStatusCls(run.status || 'pending'))}>
                        {run.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No payroll records found.
          </div>
        )}
        <div className="pt-3 text-center">
          <Link href="/finance/payroll" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Open Full Payroll Console
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Attendance Logs
// ─────────────────────────────────────────────────────────────────────────────

function TeacherAttendanceTab({ attendanceRecords, loadingAttendance }: { record: any; attendanceRecords: AttendanceRecord[]; loadingAttendance: boolean }) {
  const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'Absent').length;
  const lateCount = attendanceRecords.filter(a => a.status === 'Late').length;
  const rate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : null;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{rate != null ? `${rate}%` : '—'}</p>
          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5">Rate</p>
        </div>
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-center">
          <p className="text-xl font-black text-sky-700 dark:text-sky-300">{presentCount}</p>
          <p className="text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase mt-0.5">Present</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center">
          <p className="text-xl font-black text-rose-700 dark:text-rose-300">{absentCount}</p>
          <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase mt-0.5">Absent</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-xl font-black text-amber-700 dark:text-amber-300">{lateCount}</p>
          <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">Late</p>
        </div>
      </div>

      <div>
        <SectionTitle>Recent Attendance Records</SectionTitle>
        {loadingAttendance ? (
          <LoadingSpinner label="Loading attendance logs…" />
        ) : attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceRecords.slice(0, 20).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{fmtDate(a.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold border', statusBadgeCls(a.status))}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{(a.subject as any)?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{(a.section as any)?.sectionName || (a.section as any)?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No attendance records found for this instructor.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Documents
// ─────────────────────────────────────────────────────────────────────────────

function TeacherDocumentsTab({ record, teacher }: { record: any; teacher: Teacher | null }) {
  const t: any = teacher || record;
  const docs: any[] = Array.isArray(t.documents) ? t.documents : [];
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';

  function resolveUrl(doc: any) {
    const rawUrl = doc?.url || doc?.data?.attributes?.url || '';
    return rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  function fileIconColor(mime?: string) {
    if (!mime) return 'text-slate-400';
    if (mime.includes('pdf')) return 'text-rose-500';
    if (mime.includes('image')) return 'text-sky-500';
    if (mime.includes('word') || mime.includes('document')) return 'text-blue-600';
    if (mime.includes('sheet') || mime.includes('excel')) return 'text-emerald-600';
    return 'text-slate-400';
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <SectionTitle>Staff Documents ({docs.length})</SectionTitle>
      {docs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No documents uploaded</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Upload contracts, certificates, or credentials in Strapi to display them here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: any, i: number) => {
            const docName = doc.name || doc.caption || doc.alternativeText || `Document ${i + 1}`;
            const url = resolveUrl(doc);
            const size = doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : null;
            const ext = (doc.ext || (doc.mime?.split('/')[1] || '')).toUpperCase().replace('.', '');
            return (
              <div key={doc.id || i} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                <FileText className={cn('w-5 h-5 shrink-0', fileIconColor(doc.mime))} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{docName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{ext}{size ? ` · ${size}` : ''}</p>
                </div>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Open
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Tab: Audit Logs
// ─────────────────────────────────────────────────────────────────────────────

function TeacherAuditTab({ auditLogs, loadingAudit }: { teacherId: string | number; auditLogs: AuditLog[]; loadingAudit: boolean }) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <SectionTitle>Audit Trail ({auditLogs.length})</SectionTitle>
      {loadingAudit ? (
        <LoadingSpinner label="Loading audit logs…" />
      ) : auditLogs.length > 0 ? (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{log.action}</p>
                <span className={cn('text-[9px] font-bold uppercase tracking-wide shrink-0', auditSevCls(log.severity))}>
                  {log.severity}
                </span>
              </div>
              {log.description && <p className="text-[11px] text-slate-600 dark:text-slate-300">{log.description}</p>}
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>{fmtDateTime((log as any).createdAt)}</span>
                {log.performedBy && (
                  <><span>·</span><span>by {log.performedBy.username || log.performedBy.email}</span></>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No audit logs found for this instructor.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes Tab — persisted to localStorage keyed by record id
// ─────────────────────────────────────────────────────────────────────────────

function NotesTab({ storageKey }: { storageKey: string }) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<{ text: string; date: string }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`drawer_notes_${storageKey}`);
      if (stored) setNotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  function addNote() {
    if (!noteText.trim()) return;
    const updated = [{ text: noteText.trim(), date: new Date().toISOString() }, ...notes];
    setNotes(updated);
    setNoteText('');
    try { localStorage.setItem(`drawer_notes_${storageKey}`, JSON.stringify(updated)); } catch { /* ignore */ }
    toast.success('Note saved to record timeline.');
  }

  function deleteNote(idx: number) {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    try { localStorage.setItem(`drawer_notes_${storageKey}`, JSON.stringify(updated)); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <SectionTitle>Confidential Administrative Notes</SectionTitle>
      <textarea
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Add an internal note, clearance remark, or observation… (Ctrl+Enter to save)"
        rows={3}
        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote(); }}
      />
      <button
        onClick={addNote}
        disabled={!noteText.trim()}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
      >
        Add Note
      </button>
      <div className="space-y-2.5">
        {notes.length === 0 && <p className="text-xs text-slate-400 italic">No notes yet. Add one above.</p>}
        {notes.map((note, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3 shadow-2xs">
            <div className="space-y-1 flex-1">
              <p className="text-slate-700 dark:text-slate-300">{note.text}</p>
              <p className="text-[10px] font-mono text-slate-400">{fmtDateTime(note.date)} · By Admin</p>
            </div>
            <button onClick={() => deleteNote(idx)} title="Remove note"
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer bg-transparent border-none">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SlideOutDrawer
// ─────────────────────────────────────────────────────────────────────────────

export function SlideOutDrawer({
  isOpen,
  onClose,
  record,
  title = 'Record Profile Inspection',
  category = 'generic',
  quickActions,
  customTabsContent = {},
  tabsListOverride,
  hideIntelligence = false,
  statsBarOverride,
}: SlideOutDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTabId | string>('overview');

  // Teacher enriched data state
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset state when record changes
  useEffect(() => {
    if (isOpen && record) {
      setActiveTab('overview');
      setTeacher(null);
      setPayrollRuns([]);
      setAttendanceRecords([]);
      setAuditLogs([]);
    }
  }, [record?.id, record?.documentId, isOpen]);

  // Load enriched teacher data on open
  const loadTeacherData = useCallback(async () => {
    if (!record || category !== 'teacher') return;
    const rid = record.documentId || record.id;
    if (!rid) return;
    setLoadingTeacher(true);
    try {
      const enriched = await erpService.getTeacherById(rid);
      if (enriched) setTeacher(enriched);
    } catch { /* noop */ }
    finally { setLoadingTeacher(false); }
  }, [record, category]);

  const loadPayrollData = useCallback(async () => {
    if (loadingPayroll || payrollRuns.length > 0) return;
    setLoadingPayroll(true);
    try {
      const runs = await financeService.getPayrollRuns();
      setPayrollRuns(Array.isArray(runs) ? runs : []);
    } catch { /* noop */ }
    finally { setLoadingPayroll(false); }
  }, [loadingPayroll, payrollRuns.length]);

  const loadAttendanceData = useCallback(async () => {
    if (!record || loadingAttendance || attendanceRecords.length > 0) return;
    const rid = record.id;
    if (!rid || isNaN(Number(rid))) return;
    setLoadingAttendance(true);
    try {
      const res = await getAttendanceRecords({
        filters: { teacher: { id: { $eq: Number(rid) } } },
        sort: ['date:desc'],
        pagination: { limit: 50 },
        populate: ['subject', 'section'],
      });
      const arr: AttendanceRecord[] = (res as any)?.data || [];
      setAttendanceRecords(arr);
    } catch { /* noop */ }
    finally { setLoadingAttendance(false); }
  }, [record, loadingAttendance, attendanceRecords.length]);

  const loadAuditData = useCallback(async () => {
    if (loadingAudit || auditLogs.length > 0) return;
    setLoadingAudit(true);
    try {
      const res = await auditService.getLogs({ entity: 'teacher', pageSize: 30 });
      setAuditLogs(res.data || []);
    } catch { /* noop */ }
    finally { setLoadingAudit(false); }
  }, [loadingAudit, auditLogs.length]);

  useEffect(() => {
    if (isOpen && record && category === 'teacher') loadTeacherData();
  }, [isOpen, record, category, loadTeacherData]);

  useEffect(() => {
    if (!isOpen || category !== 'teacher') return;
    if (activeTab === 'finance') loadPayrollData();
    if (activeTab === 'attendance') loadAttendanceData();
    if (activeTab === 'audit') loadAuditData();
  }, [activeTab, isOpen, category, loadPayrollData, loadAttendanceData, loadAuditData]);

  if (!isOpen || !record) return null;

  // ── Derived display values
  const name = record.name || record.fullName || record.applicantName || record.title || 'Unnamed Record';
  const idStr = record.schoolId || record.teacherId || record.studentId || record.id || 'ERP-0000';
  const roleOrGrade = record.role || record.gradeApplied || record.grade || record.category || record.department || 'General Profile';
  const statusStr = record.status || record.employmentStatus || record.state || 'Active';
  const emailOrPhone = record.email || record.phone || record.contactPhone || 'No Contact Info';
  const guardianOrSupervisor = record.parentName || record.guardian || record.supervisor || 'N/A';
  const teacherData: any = teacher || record;

  const isGreen = ['active', 'approved', 'paid', 'verified', 'enrolled', 'full_time'].some(k => (statusStr || '').toLowerCase().includes(k));
  const isRed = ['suspended', 'overdue', 'rejected', 'terminated', 'cancelled', 'retired'].some(k => (statusStr || '').toLowerCase().includes(k));
  const statusColor = isGreen
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
    : isRed
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
      : 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold';

  // ── Default Quick Actions
  const defaultActions: SmartQuickAction[] = quickActions || (
    category === 'student' ? [
      { id: 'edit', label: 'Edit Profile', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing ${name}`) },
      { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" />, onClick: () => toast.success(`Viewing attendance for ${name}`) },
      { id: 'homework', label: 'Homework', icon: <BookOpen className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened homework logs for ${name}`) },
      { id: 'fees', label: 'Fees & Billing', icon: <DollarSign className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened fee ledger for ${name}`) },
      { id: 'print', label: 'Print ID Card', icon: <Printer className="w-3.5 h-3.5" />, onClick: () => toast.success(`Printing ID Card for ${name}...`) },
      { id: 'suspend', label: 'Suspend', icon: <PauseCircle className="w-3.5 h-3.5" />, variant: 'danger', onClick: () => toast.error(`Suspension confirmation requested for ${name}`) },
    ] : category === 'teacher' ? [
      { id: 'edit', label: 'Edit Profile', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing: ${name}`) },
      { id: 'assign-sub', label: 'Assign Subject', icon: <BookOpen className="w-3.5 h-3.5" />, onClick: () => toast.success(`Assigning subject to ${name}`) },
      { id: 'assign-sec', label: 'Assign Section', icon: <Layers className="w-3.5 h-3.5" />, onClick: () => toast.success(`Assigning section to ${name}`) },
      { id: 'timetable', label: 'Timetable', icon: <Clock className="w-3.5 h-3.5" />, onClick: () => toast.info('Opened teacher timetable') },
      { id: 'eval', label: 'Evaluation', icon: <Award className="w-3.5 h-3.5" />, onClick: () => toast.info('Opened KPI evaluation') },
      { id: 'print', label: 'Print ID', icon: <Printer className="w-3.5 h-3.5" />, onClick: () => toast.success(`Printing ID Card for ${name}`) },
    ] : category === 'parent' ? [
      { id: 'fees', label: 'Fee Clearance', icon: <DollarSign className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info('Viewing family billing ledger') },
      { id: 'children', label: 'Children', icon: <Users className="w-3.5 h-3.5" />, onClick: () => toast.success(`Viewing children linked to ${name}`) },
      { id: 'msg', label: 'Send Message', icon: <MessageSquare className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opening composer for ${name}`) },
    ] : category === 'worker' ? [
      { id: 'shift', label: 'Shift Roster', icon: <Clock className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info('Opened shift schedule') },
      { id: 'payroll', label: 'Payroll Ledger', icon: <DollarSign className="w-3.5 h-3.5" />, onClick: () => toast.success('Opened worker payroll slip') },
      { id: 'leave', label: 'Leave Request', icon: <Calendar className="w-3.5 h-3.5" />, onClick: () => toast.info('Opened leave application modal') },
    ] : [
      { id: 'edit', label: 'Edit Record', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing record ${idStr}`) },
      { id: 'print', label: 'Print Summary', icon: <Printer className="w-3.5 h-3.5" />, onClick: () => toast.success('Printing record summary') },
      { id: 'audit', label: 'View Logs', icon: <History className="w-3.5 h-3.5" />, onClick: () => setActiveTab('audit') },
    ]
  );

  // ── Tab List
  const tabsList = tabsListOverride || (() => {
    switch (category) {
      case 'student': return [
        { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'academic', label: 'Academic', icon: <BookOpen className="w-3.5 h-3.5" /> },
        { id: 'finance', label: 'Finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
        { id: 'hostel', label: 'Hostel', icon: <Home className="w-3.5 h-3.5" /> },
        { id: 'quran', label: "Qur'an", icon: <Award className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'timeline', label: 'Timeline', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
        { id: 'permissions', label: 'Permissions', icon: <Key className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
      ];
      case 'teacher': return [
        { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'academic', label: 'Classes & Subjects', icon: <Layers className="w-3.5 h-3.5" /> },
        { id: 'finance', label: 'Payroll & Salary', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { id: 'attendance', label: 'Attendance Logs', icon: <Calendar className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Admin Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
      ];
      case 'parent': return [
        { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'finance', label: 'Family Ledger', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
      ];
      case 'worker': return [
        { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'finance', label: 'Payroll', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
        { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
      ];
      default: return [
        { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
      ];
    }
  })();

  // ── Sidebar intelligence stats (teacher: real computed values)
  const sidebarStats = category === 'teacher' ? [
    {
      label: 'Sections Assigned',
      value: (teacherData.sections as any[])?.length ?? '—',
      statusLabel: (teacherData.sections as any[])?.length > 0 ? 'Active' : 'None',
      statusCls: 'text-emerald-600 dark:text-emerald-400',
      detail: (teacherData.sections as any[])?.length
        ? `Assigned to ${(teacherData.sections as any[]).length} section${(teacherData.sections as any[]).length !== 1 ? 's' : ''}`
        : 'No sections assigned yet.',
    },
    {
      label: 'Attendance Rate',
      value: attendanceRecords.length > 0
        ? `${Math.round((attendanceRecords.filter(a => a.status === 'Present').length / attendanceRecords.length) * 100)}%`
        : '—',
      statusLabel: attendanceRecords.length > 0 ? 'Computed' : 'Open Tab',
      statusCls: 'text-sky-600 dark:text-sky-400',
      detail: attendanceRecords.length > 0
        ? `Based on ${attendanceRecords.length} logged records`
        : 'Open Attendance tab to compute.',
    },
    {
      label: 'Last Payroll Status',
      value: payrollRuns.length > 0 ? (payrollRuns[0]?.status || '—') : '—',
      statusLabel: payrollRuns.length > 0 ? 'Synced' : 'Open Tab',
      statusCls: 'text-amber-600 dark:text-amber-400',
      detail: payrollRuns.length > 0
        ? `Run: ${payrollRuns[0]?.payPeriod || payrollRuns[0]?.payrollNumber || 'Latest'}`
        : 'Open Payroll tab to view.',
    },
    {
      label: 'Documents on File',
      value: (teacherData.documents as any[])?.length ?? '—',
      statusLabel: 'Stored',
      statusCls: 'text-violet-600 dark:text-violet-400',
      detail: `${(teacherData.documents as any[])?.length ?? 0} staff file${(teacherData.documents as any[])?.length !== 1 ? 's' : ''} uploaded`,
    },
  ] : null;

  // ── Tab content renderer
  function renderTabContent() {
    if (customTabsContent[activeTab]) return customTabsContent[activeTab];

    if (category === 'teacher') {
      if (activeTab === 'overview') return <TeacherOverviewTab record={record} teacher={teacher} />;
      if (activeTab === 'academic') return <TeacherClassesTab record={record} teacher={teacher} />;
      if (activeTab === 'finance') return <TeacherPayrollTab record={record} payrollRuns={payrollRuns} loadingPayroll={loadingPayroll} />;
      if (activeTab === 'attendance') return <TeacherAttendanceTab record={record} attendanceRecords={attendanceRecords} loadingAttendance={loadingAttendance} />;
      if (activeTab === 'documents') return <TeacherDocumentsTab record={record} teacher={teacher} />;
      if (activeTab === 'audit') return <TeacherAuditTab teacherId={record.documentId || record.id} auditLogs={auditLogs} loadingAudit={loadingAudit} />;
      if (activeTab === 'notes') return <NotesTab storageKey={String(record.documentId || record.id)} />;
    }

    // ── Generic tab content
    switch (activeTab) {
      case 'overview': return (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <SectionTitle>Institutional Record Summary</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Full Record Name" value={name} />
              <InfoCard label="Primary ID Code" value={<span className="text-emerald-600 dark:text-emerald-400 font-mono">{idStr}</span>} />
              <InfoCard label={category === 'worker' ? 'Operational Role' : 'Assigned Program / Section'} value={roleOrGrade} />
              <InfoCard label="Status & Clearance" value={<span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />Verified & Cleared</span>} />
            </div>
          </div>
          {category === 'worker' && (
            <div>
              <SectionTitle>Employment Timeline</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard label="Employment Date" value={fmtDate(record.employmentDate)} />
                <InfoCard label="Base Salary Grade" value={record.salaryGrade} mono />
              </div>
            </div>
          )}
          <div>
            <SectionTitle>Contact & Emergency</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Primary Contact / Email" value={<span className="font-mono">{emailOrPhone}</span>} />
              <InfoCard label="Guardian / Supervisor" value={<span className="text-emerald-600 dark:text-emerald-300">{guardianOrSupervisor}</span>} />
            </div>
          </div>
        </div>
      );
      case 'notes': return <NotesTab storageKey={String(record.documentId || record.id)} />;
      case 'academic': return (
        <div className="space-y-4 animate-in fade-in">
          <SectionTitle>Academic Profile Summary</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Class / Section" value={record.sections?.[0]?.sectionName || record.grade} />
            <InfoCard label="Enrollment Date" value={fmtDate(record.admissionDate)} />
          </div>
          <div className="pt-4 text-center">
            <Link href={`/students/${record.documentId || record.id}?tab=academic`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Full Academic Dossier
            </Link>
          </div>
        </div>
      );
      case 'finance': return (
        <div className="space-y-4 animate-in fade-in">
          <SectionTitle>Finance ERP Summary</SectionTitle>
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <InfoCard label="Wallet Balance" value={<span className="text-emerald-500 font-black">{fmtMoney(record.advanceBalance)}</span>} />
            <InfoCard label="Outstanding Balance" value={<span className="text-rose-500 font-black">{fmtMoney(record.outstandingBalance || record.remainingBalance)}</span>} />
          </div>
          <div className="pt-4 text-center">
            <Link href={`/students/${record.documentId || record.id}?tab=finance`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Billing & Wallet Ledger
            </Link>
          </div>
        </div>
      );
      case 'attendance': return (
        <div className="space-y-4 animate-in fade-in">
          <SectionTitle>Attendance Log Summary</SectionTitle>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <InfoCard label="Average Attendance" value={<span className="text-emerald-500 font-black">{record.attendanceRate || '—'}</span>} />
            <InfoCard label="Gate Log Today" value={record.todayCheckIn || 'No record'} />
          </div>
          <div className="pt-4 text-center">
            <Link href={`/students/${record.documentId || record.id}?tab=attendance`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Full Attendance Tracker
            </Link>
          </div>
        </div>
      );
      case 'quran': return (
        <div className="space-y-4 animate-in fade-in">
          <SectionTitle>Quran Tahfidz Progress</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Juz'" value={record.currentJuz} />
            <InfoCard label="Current Surah" value={record.currentSurah} />
            <InfoCard label="Muraja'ah" value={record.murajaahSurah} />
          </div>
          <div className="pt-4 text-center">
            <Link href={`/students/${record.documentId || record.id}?tab=quran`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Quran Console
            </Link>
          </div>
        </div>
      );
      case 'hostel': return (
        <div className="space-y-4 animate-in fade-in">
          <SectionTitle>Hostel Allocation</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Building" value={record.hostelBuilding} />
            <InfoCard label="Room" value={record.hostelRoom} />
          </div>
          <div className="pt-4 text-center">
            <Link href={`/students/${record.documentId || record.id}?tab=hostel`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Hostel Assignments
            </Link>
          </div>
        </div>
      );
      default: return (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 animate-in fade-in">
          <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase font-mono capitalize">{activeTab} Summary</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">Open the full 360° profile dossier to view comprehensive logs and records.</p>
          <div className="pt-2">
            <Link href={`/students/${record.documentId || record.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />Open Full Dossier
            </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 animate-in fade-in duration-200 flex justify-end">
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-auto animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={`Profile inspection for ${name}`}
      >
        <div className="w-full h-full max-h-[90vh] overflow-auto p-1 border border-yellow-600/80 rounded-lg shadow-lg">
          {/* ── Header ── */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar
                  src={record.photo?.url || record.photoUrl || record.avatarUrl}
                  name={name}
                  size="xl"
                  className="border border-slate-200 dark:border-slate-700 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    {idStr}
                  </span>
                  <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border capitalize', statusColor)}>
                    {(statusStr || '').replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => toast.success(`Viewing QR Code & Barcode for ${idStr}`)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    QR Code
                  </button>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{name}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3 font-medium">
                  {category === 'teacher' ? (
                    <>
                      <span>Dept: <strong className="text-amber-600 dark:text-amber-400">{(teacherData.departments as any[])?.[0]?.title || (teacherData.departments as any[])?.[0]?.name || record.department || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Specialization: <strong className="text-sky-600 dark:text-sky-400">{teacherData.specializations || teacherData.qualifications || 'N/A'}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>Role: <strong className="text-emerald-700 dark:text-emerald-400">{roleOrGrade}</strong></span>
                      <span>•</span>
                      <span>Contact: <strong className="font-mono text-slate-800 dark:text-slate-200">{emailOrPhone}</strong></span>
                    </>
                  )}
                </p>
                {/* Stats bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  {statsBarOverride ? statsBarOverride : (
                    category === 'teacher' ? (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                          Grade: <strong className="text-amber-600 dark:text-amber-400">{record.salaryGrade || 'N/A'}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs capitalize">
                          Type: <strong className="text-sky-600 dark:text-sky-400">{(record.employmentStatus || 'active').replace(/_/g, ' ')}</strong>
                        </span>
                        {record.experienceYears != null && (
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                            Exp: <strong className="text-emerald-600 dark:text-emerald-400">{record.experienceYears}yr{record.experienceYears !== 1 ? 's' : ''}</strong>
                          </span>
                        )}
                      </>
                    ) : category === 'worker' ? (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                          Salary: <strong className="text-emerald-600 dark:text-emerald-400">{record.salaryGrade || 'SG-1'}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs capitalize">
                          Employment: <strong className="text-sky-600 dark:text-sky-400">{(record.employmentStatus || 'Active').replace(/_/g, ' ')}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                          Shift: <strong className="text-amber-600 dark:text-amber-400">{record.shift || 'Day Shift'}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                          Balance: <strong className={isRed ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{record.balance || fmtMoney(record.advanceBalance)}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                          Attendance: <strong className="text-sky-600 dark:text-sky-400">{record.attendanceRate || '—'}</strong>
                        </span>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close drawer"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Quick Actions ── */}
          <div className="px-4 sm:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 font-mono">Quick Actions:</span>
            {defaultActions.map((act) => (
              <button key={act.id} onClick={() => act.onClick(record)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs',
                  act.variant === 'primary' ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : act.variant === 'danger' ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                )}>
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab Navigation ── */}
          <div className="px-4 sm:px-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {tabsList.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                  )}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Left/Center panel */}
            <div className="lg:col-span-2 p-5 sm:p-6 space-y-6">
              {renderTabContent()}
            </div>

            {/* Sidebar Intelligence */}
            {!hideIntelligence && (
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/30 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Sidebar Intelligence
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Live Sync</span>
                  </div>

                  {sidebarStats ? (
                    <div className="space-y-3">
                      {sidebarStats.map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            <span>{s.label}</span>
                            <span className={cn('font-bold', s.statusCls)}>{s.statusLabel}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium">
                            {s.value !== '—' && <span className="font-black text-slate-900 dark:text-white text-sm mr-1">{s.value}</span>}
                            {s.detail}
                          </p>
                        </div>
                      ))}
                      {loadingTeacher && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          Enriching profile data…
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>Recent Attendance</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium">Logged in at campus entrance this morning.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>Audit Log Entry</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Updated</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium">Permissions inspected by Super Admin.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <button
                    onClick={() => toast.info(`Full comprehensive dossier exported for ${idStr}`)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Export Full Dossier Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
