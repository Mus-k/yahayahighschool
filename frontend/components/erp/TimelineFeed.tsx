'use client';

import React from 'react';
import type { TimelineItem } from '@/types/erp.types';
import { Calendar, Award, AlertCircle, HeartPulse, BookOpen, UserCheck, Clock } from 'lucide-react';

interface TimelineFeedProps {
  items?: TimelineItem[];
  emptyMessage?: string;
}

export function TimelineFeed({ items = [], emptyMessage = 'No timeline records available.' }: TimelineFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <Clock className="mx-auto h-8 w-8 mb-3 text-slate-500 opacity-60" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Sort chronological descending
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'Admission':
        return { icon: <UserCheck className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' };
      case 'Achievement':
        return { icon: <Award className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
      case 'Behavioral':
        return { icon: <AlertCircle className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300' };
      case 'Medical':
        return { icon: <HeartPulse className="w-4 h-4 text-purple-400" />, bg: 'bg-purple-500/10 border-purple-500/30 text-purple-300' };
      case 'Section Change':
      case 'Academic':
        return { icon: <BookOpen className="w-4 h-4 text-sky-400" />, bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300' };
      default:
        return { icon: <Calendar className="w-4 h-4 text-slate-400" />, bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300' };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-slate-800 before:to-transparent">
      {sorted.map((item, idx) => {
        const meta = getCategoryMeta(item.category);
        return (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[27px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow-sm transition-transform group-hover:scale-110">
              {meta.icon}
            </div>

            {/* Event Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-md transition-all hover:border-slate-700 hover:bg-slate-900/90">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.bg}`}>
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                </div>
                <time className="text-xs font-mono text-slate-400">
                  {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </time>
              </div>

              {/* Description (rich text or string) */}
              <div
                className="text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: item.description || '' }}
              />

              {item.loggedBy && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Logged by: <strong className="text-slate-300">{item.loggedBy}</strong></span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
