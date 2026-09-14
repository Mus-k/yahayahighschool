'use client';

import React from 'react';
import { SearchX, Plus, RotateCcw, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { getTranslation } from './EnterpriseModuleShell';

export interface EnterpriseEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  isFilterActive?: boolean;
  onResetFilters?: () => void;
  createLabel?: string;
  onCreate?: () => void;
  className?: string;
}

export function EnterpriseEmptyState({
  title = 'No Records Found',
  description = 'There are currently no records matching your criteria or query.',
  icon,
  isFilterActive = false,
  onResetFilters,
  createLabel = 'Create New Record',
  onCreate,
  className,
}: EnterpriseEmptyStateProps) {
  const locale = useLocale();

  return (
    <div className={cn("py-16 px-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-6 shadow-inner", className)}>
      <div className="p-4 rounded-3xl bg-slate-800/60 border border-slate-700/60 text-slate-400 mb-4 shadow-md">
        {icon || (isFilterActive ? <SearchX className="w-10 h-10 text-amber-400 animate-bounce" /> : <FolderOpen className="w-10 h-10 text-emerald-400" />)}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
        {isFilterActive ? getTranslation('No Matching Filter Results', locale) : getTranslation(title, locale)}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed font-light">
        {isFilterActive 
          ? getTranslation('Try modifying your search query, resetting active filters, or switching your saved view.', locale)
          : getTranslation(description, locale)}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFilterActive && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{getTranslation('Reset Active Filters', locale)}</span>
          </button>
        )}

        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{getTranslation(createLabel, locale)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
