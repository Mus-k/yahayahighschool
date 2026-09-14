'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { BarChart3, FileText, ScrollText, BadgeCheck, ArrowRight, Trophy, CheckCircle2, Award } from 'lucide-react';

export default function ResultsOverviewPage() {
  const modules = [
    { title: 'Report Cards', desc: 'Generate, certify, and print term-end report cards with grading analytics.', href: '/results/report-cards', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'Academic Transcripts', desc: 'Full multi-year academic transcripts with cumulative GPAs and credits.', href: '/results/transcripts', icon: ScrollText, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { title: 'Certificates of Achievement', desc: 'Issue verifiable digital certificates for Hifz completion and honors.', href: '/results/certificates', icon: BadgeCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { title: 'Grade Promotions', desc: 'Process end-of-year grade level advancements and retention decisions.', href: '/results/promotions', icon: ArrowRight, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { title: 'Student Honor Rankings', desc: 'Top performing scholars by class section, grade, and Qur\'an track.', href: '/results/rankings', icon: Trophy, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Results & Certification Hub</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise command console for student grading certification, official transcripts, and grade promotions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link key={i} href={m.href} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between shadow-sm">
              <div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${m.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{m.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{m.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Open Module</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
