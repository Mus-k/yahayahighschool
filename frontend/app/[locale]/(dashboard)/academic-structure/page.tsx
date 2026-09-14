'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Layers, Building2, Calendar, BookOpen, CheckCircle2,
  Users, RefreshCw, Plus, ArrowRight, ExternalLink, GraduationCap
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import type { AcademicYear, Campus, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';

export default function AcademicStructurePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'grade-levels' | 'years' | 'campuses'>('sections');

  useEffect(() => {
    async function loadStructure() {
      setLoading(true);
      try {
        const [yrRes, campRes, secRes, glRes] = await Promise.all([
          erpService.getAcademicYears(locale),
          erpService.getCampuses(locale),
          erpService.getSections(locale),
          apiClient.get('/grade-levels', { params: { populate: ['sections', 'curriculum'], sort: 'order:asc', pagination: { limit: 50 } } }),
        ]);
        setAcademicYears(yrRes);
        setCampuses(campRes);
        setSections(secRes);
        setGradeLevels(glRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed loading academic structure:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStructure();
  }, [locale]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-sky-500 dark:text-sky-400" />
            <span>Unified Academic Structure Console</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure school campuses, active academic calendars, terms, and multi-track academic sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Refresh Structure"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'sections', label: `Academic Sections (${sections.length})`, icon: Layers },
          { id: 'grade-levels', label: `Grade Levels (${gradeLevels.length})`, icon: GraduationCap },
          { id: 'years', label: `Calendar & Terms (${academicYears.length})`, icon: Calendar },
          { id: 'campuses', label: `Campuses & Facilities (${campuses.length})`, icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                active
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading school infrastructure...</div>
      ) : activeTab === 'sections' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Multi-Track Academic Section Architecture</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Students and teachers can be linked to multiple academic sections across grade levels and Tahfidz groups simultaneously.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec) => (
              <div key={sec.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-sky-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800">
                      {sec.code}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Capacity: {sec.capacity || 30}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{sec.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{sec.description || 'Academic division section'}</p>

                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs">
                    {sec.department && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{sec.department.name || 'Core'}</span>
                      </div>
                    )}
                    {sec.program && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Program:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-300">{sec.program.name || 'High School'}</span>
                      </div>
                    )}
                    {sec.academicYear && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Academic Year:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{sec.academicYear.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Linked Teachers: <strong className="text-slate-900 dark:text-slate-200">{sec.teachers?.length || 0}</strong>
                  </span>
                  <Link
                    href={`/academic/sections/${(sec as any).documentId ?? sec.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Workspace
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'grade-levels' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Global Grade Levels</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grade levels are shared across all Academic Sections. Each section defines its own curriculum per grade.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gradeLevels.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-full text-center py-8">No grade levels found. Add grade levels in Strapi admin.</p>
            ) : gradeLevels.map((gl: any) => (
              <div key={gl.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-400 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    {gl.code}
                  </span>
                  <span className="text-[10px] text-slate-400">Order: {gl.order}</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">{gl.name}</h3>
                {gl.ageRange && <p className="text-[10px] text-slate-400 mb-2">Age: {gl.ageRange}</p>}
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Sections: <strong className="text-indigo-600 dark:text-indigo-400">{gl.sections?.length ?? 0}</strong></p>
                  {gl.curriculum?.name && <p>Curriculum: <strong>{gl.curriculum.name}</strong></p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'years' ? (
        <div className="space-y-6">
          {academicYears.map((yr) => (
            <div key={yr.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{yr.name}</span>
                    {yr.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                        Current Active Year
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Duration: {yr.startDate} to {yr.endDate}
                  </p>
                </div>
                <StatusBadge status={(yr as any).status || ((yr as any).active ? 'Active' : 'Inactive')} size="lg" />
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Academic Terms Schedule</h4>
                {yr.terms && yr.terms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {yr.terms.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</h5>
                            {t.active && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                                Active Term
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Start: {t.startDate}</p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">End: {t.endDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No terms configured under this academic year.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campuses.map((camp) => (
            <div key={camp.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                    Code: {camp.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{camp.name}</h3>
                </div>
                <StatusBadge status={(camp as any).status || 'Active'} size="md" />
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <p>Address: <span className="font-medium text-slate-900 dark:text-slate-100">{camp.address || 'Main Campus Ground'}</span></p>
                {camp.phone && <p>Phone: <span className="font-mono text-slate-800 dark:text-slate-200">{camp.phone}</span></p>}
                {camp.email && <p>Email: <span className="font-mono text-slate-800 dark:text-slate-200">{camp.email}</span></p>}
                {camp.principalName && <p>Head / Principal: <span className="font-bold text-emerald-600 dark:text-emerald-300">{camp.principalName}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
