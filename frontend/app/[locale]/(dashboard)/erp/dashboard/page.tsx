'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Users, GraduationCap, UserCheck, Layers, Building2, BookOpen,
  ArrowRight, Plus, Upload, Download, Activity, CheckCircle2,
  Calendar, ShieldCheck, HeartPulse
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Student, Teacher, Parent, Section, Campus, AcademicYear } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';

export default function ERPDashboardPage() {
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [teachersCount, setTeachersCount] = useState<number>(0);
  const [parentsCount, setParentsCount] = useState<number>(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<'student' | 'teacher' | 'parent' | 'worker'>('student');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [stRes, tchRes, prRes, secList, campList, yrList] = await Promise.all([
          erpService.getStudents({ pageSize: 5 }),
          erpService.getTeachers({ pageSize: 1 }),
          erpService.getParents({ pageSize: 1 }),
          erpService.getSections(),
          erpService.getCampuses(),
          erpService.getAcademicYears(),
        ]);

        setStudentsCount(stRes.meta.pagination.total);
        setTeachersCount(tchRes.meta.pagination.total);
        setParentsCount(prRes.meta.pagination.total);
        setSections(secList);
        setCampuses(campList);
        setRecentStudents(stRes.data);

        const activeYr = yrList.find((y) => y.isCurrent || (y as any).status === 'active');
        setCurrentYear(activeYr || yrList[0] || null);
      } catch (err) {
        console.error('Failed loading ERP Dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const openImport = (type: 'student' | 'teacher' | 'parent' | 'worker') => {
    setImportEntityType(type);
    setImportModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 border border-emerald-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                Phase 2 Core School ERP
              </span>
              {currentYear && (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                  Calendar: {currentYear.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Central SIS & Academic Console
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Unified database architecture managing students, faculty, sections, attendance tracks, and cross-departmental relationships across Yahaya International High School.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>People Directory</span>
            </Link>
            <button
              onClick={() => openImport('student')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Bulk Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/students" className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-emerald-500/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : studentsCount}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              Active SIS <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link href="/teachers" className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-amber-500/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Faculty & Sheikhs</span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : teachersCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              Teaching Staff <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link href="/parents" className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-500/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered Parents</span>
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : parentsCount}</span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
              Guardians <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        <Link href="/academic-structure" className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-sky-500/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Sections</span>
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : sections.length}</span>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
              Sections & Levels <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Recent Students & Academic Structure Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Student Profiles Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Recently Enrolled Student Profiles</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click on any student row to view their full 360° SIS dossier</p>
            </div>
            <Link
              href="/students"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({studentsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading recent student profiles...</div>
          ) : recentStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">No students found. Use Bulk Import to seed records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">School ID</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Gender</th>
                    <th className="py-3 px-4 font-semibold">Assigned Section</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {recentStudents.map((st) => (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/students/${st.documentId || st.id}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {st.schoolId || st.admissionNumber || `#${st.id}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {st.firstName} {st.middleName ? `${st.middleName} ` : ''}{st.lastName}
                      </td>
                      <td className="py-3 px-4 capitalize">{st.gender}</td>
                      <td className="py-3 px-4">
                        {st.sections && st.sections.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 font-mono text-xs">
                            {st.sections[0].code}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={(st as any).status || st.enrollmentStatus} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions & System Modules */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Management Actions</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => openImport('student')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">Batch Import Students</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Upload CSV with SIS attributes</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => openImport('teacher')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">Batch Import Faculty</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Upload teacher rosters</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                href="/academic-structure"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">Configure Academic Tracks</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Manage Sections & Levels</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Campus Facility & Academic Year Brief */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Infrastructure</span>
            </h3>

            {campuses.length > 0 ? (
              <div className="space-y-3">
                {campuses.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{c.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Code: {c.code}</p>
                      {c.principalName && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Head: {c.principalName}</p>
                      )}
                    </div>
                    <StatusBadge status={(c as any).status} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No campuses registered.</p>
            )}
          </div>
        </div>
      </div>

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType={importEntityType}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
