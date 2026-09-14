'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { erpService } from '@/services/erp.service';
import type { AcademicYear } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AcademicYearsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      try {
        const yrRes = await erpService.getAcademicYears(locale);
        setYears(yrRes);
      } catch (err) {
        console.error('Error fetching academic years:', err);
      } finally {
        setLoading(false);
      }
    }
    loadYears();
  }, [locale]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Years & Term Cycles</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise setup of multi-year academic calendars, start/end boundaries, and rollover policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('New Academic Year dialog opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#048ED6] hover:bg-[#037ab8] text-white font-bold text-xs shadow-md shadow-[#048ED6]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Academic Year</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading academic years...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {years.map((yr) => (
            <div key={yr.id} className={`p-6 rounded-2xl border transition-all ${yr.isCurrent ? 'bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-500/50 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{yr.name}</h3>
                    {yr.isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {yr.startDate} to {yr.endDate}
                  </p>
                </div>
                <StatusBadge status={(yr as any).status || (yr.isCurrent ? 'Active' : 'Inactive')} size="lg" />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Associated Academic Terms</h4>
                {yr.terms && yr.terms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {yr.terms.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</span>
                          {t.active && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        </div>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Start: {t.startDate}</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">End: {t.endDate}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No terms configured under this academic year.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex justify-end gap-2">
                <button
                  onClick={() => toast.success(`Managing session settings for ${yr.name}`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  Configure Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
