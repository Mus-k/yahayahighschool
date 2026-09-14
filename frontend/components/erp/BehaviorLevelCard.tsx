'use client';

import React from 'react';
import type { BehaviorRecord } from '@/types/erp.types';
import { CheckCircle2, AlertTriangle, XCircle, User, Calendar } from 'lucide-react';

interface BehaviorLevelCardProps {
  record: BehaviorRecord;
}

export function BehaviorLevelCard({ record }: BehaviorLevelCardProps) {
  const getLevelStyles = (lvl: string) => {
    switch (lvl) {
      case 'green':
        return {
          border: 'border-emerald-500/30 dark:border-emerald-500/40',
          bg: 'bg-emerald-950/20 dark:bg-emerald-950/30',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          title: 'Excellence & Commendation',
        };
      case 'yellow':
        return {
          border: 'border-amber-500/30 dark:border-amber-500/40',
          bg: 'bg-amber-950/20 dark:bg-amber-950/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Advisory & Observation',
        };
      case 'red':
        return {
          border: 'border-rose-500/30 dark:border-rose-500/40',
          bg: 'bg-rose-950/20 dark:bg-rose-950/30',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          title: 'Disciplinary Notice',
        };
      default:
        return {
          border: 'border-slate-700',
          bg: 'bg-slate-900/60',
          icon: <CheckCircle2 className="w-5 h-5 text-slate-400" />,
          badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          title: 'General Note',
        };
    }
  };

  const style = getLevelStyles(record.level);

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-black">{record.category}</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${style.badge} bg-slate-200`}>
                {record.level}
              </span>
            </div>
            <p className="text-xs text-black mt-0.5">{style.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-mono text-black">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(record.date).toLocaleDateString()}</span>
        </div>
      </div>

      <div
        className="text-xs text-black leading-relaxed mb-3 prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: record.description || '' }}
      />

      {record.recommendation && (
        <div className="rounded-lg bg-black/5 p-2.5 mb-3">
          <span className="font-semibold text-md text-black block mb-0.5">Recommendation / Action Taken:</span>
          <p className="text-black text-xs">{record.recommendation}</p>
        </div>
      )}

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-black" />
          <span className="text-black text-md font-medium">Reported by:  <strong className="text-primary text-md">{record.teacherName}</strong></span>
        </div>
      </div>
    </div>
  );
}
