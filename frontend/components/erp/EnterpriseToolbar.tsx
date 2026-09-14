'use client';

import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, BookmarkCheck, RefreshCw, Printer,
  Download, Upload, Plus, Trash2, Copy, CheckCircle2,
  RotateCcw, LayoutGrid, Rows3, StretchHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { getTranslation } from './EnterpriseModuleShell';

export type TableDensity = 'compact' | 'cozy' | 'comfortable';

export interface SavedView {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface EnterpriseToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  selectedIds?: (string | number)[];
  onClearSelection?: () => void;
  onBulkDelete?: (ids: (string | number)[]) => void;
  onBulkExport?: (ids: (string | number)[]) => void;
  onCopyIds?: (ids: (string | number)[]) => void;
  onRefresh?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onResetFilters?: () => void;
  onAdvancedSearch?: () => void;
  savedViews?: SavedView[];
  activeViewId?: string;
  onSelectView?: (viewId: string) => void;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  createButtonLabel?: string;
  onCreate?: () => void;
  customFilterNodes?: React.ReactNode;
  activeFilterCount?: number;
  className?: string;
}

export function EnterpriseToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records by name, ID, or attributes...',
  selectedIds = [],
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onCopyIds,
  onRefresh,
  onPrint,
  onImport,
  onExport,
  onResetFilters,
  onAdvancedSearch,
  savedViews = [
    { id: 'all', name: 'All Records (Default)', isDefault: true },
    { id: 'active', name: 'Active & Verified Only' },
    { id: 'pending', name: 'Pending Review / Action Required' },
    { id: 'recent', name: 'Recently Added / Updated' }
  ],
  activeViewId = 'all',
  onSelectView,
  density = 'cozy',
  onDensityChange,
  createButtonLabel = 'Create Record',
  onCreate,
  customFilterNodes,
  activeFilterCount = 0,
  className,
}: EnterpriseToolbarProps) {
  const [isViewsOpen, setIsViewsOpen] = useState(false);
  const selectedCount = selectedIds.length;
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const handleCopyIds = () => {
    if (onCopyIds) {
      onCopyIds(selectedIds);
    } else {
      navigator.clipboard.writeText(selectedIds.join(', '));
      toast.success(
        locale === 'ar'
          ? `تم نسخ ${selectedIds.length} معرف(معارف) إلى الحافظة!`
          : `Copied ${selectedIds.length} ID(s) to clipboard!`
      );
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Top Bar: Command Toolbar */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Search & Advanced Filter */}
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none", isRtl ? "right-3" : "left-3")} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={getTranslation(searchPlaceholder, locale)}
              aria-label="Search records"
              className={cn(
                "w-full py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all",
                isRtl ? "pr-9 pl-8" : "pl-9 pr-8"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-xs font-bold", isRtl ? "left-2.5" : "right-2.5")}
                title={getTranslation('Clear search text', locale)}
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={onAdvancedSearch || (() => toast.info('Advanced Search & Query Builder opened'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-205 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
            title={getTranslation('Open Advanced Search & Filter Drawer', locale)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{getTranslation('Advanced', locale)}</span>
          </button>
        </div>

        {/* Right Side: Saved Views, Actions & Create Button */}
        <div className={cn("flex flex-wrap items-center gap-1.5", isRtl ? "justify-start" : "justify-end")}>
          {/* Saved Views Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsViewsOpen(!isViewsOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
              title={getTranslation('Select Saved Filter View', locale)}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="truncate max-w-[130px]">
                {getTranslation(savedViews.find(v => v.id === activeViewId)?.name, locale) || getTranslation('Saved Views', locale)}
              </span>
            </button>

            {isViewsOpen && (
              <div className={cn("absolute mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50", isRtl ? "left-0" : "right-0")}>
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {getTranslation('Saved Filter Views', locale)}
                </div>
                {savedViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      if (onSelectView) onSelectView(view.id);
                      setIsViewsOpen(false);
                      toast.success(
                        locale === 'ar'
                          ? `تم التبديل إلى العرض: ${getTranslation(view.name, locale)}`
                          : `Switched to view: ${view.name}`
                      );
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between",
                      isRtl ? "text-right" : "text-left",
                      activeViewId === view.id
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{getTranslation(view.name, locale)}</span>
                    {activeViewId === view.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              title={getTranslation('Refresh Live Strapi Data', locale)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
            title={getTranslation('Print Current Grid View', locale)}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Density Selector */}
          {onDensityChange && (
            <div className="hidden sm:flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
              <button
                onClick={() => onDensityChange('compact')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'compact' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title={getTranslation('Compact Row Density', locale)}
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDensityChange('cozy')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'cozy' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title={getTranslation('Cozy Row Density', locale)}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDensityChange('comfortable')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'comfortable' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title={getTranslation('Comfortable Row Density', locale)}
              >
                <StretchHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Import / Export Buttons */}
          <button
            onClick={onImport || (() => toast.info('Bulk CSV Import dialog opened'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title={getTranslation('Import Records from CSV/Excel', locale)}
          >
            <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">{getTranslation('Import', locale)}</span>
          </button>

          <button
            onClick={onExport || (() => toast.info('Exporting visible grid records to CSV'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title={getTranslation('Export Records to CSV/Excel', locale)}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{getTranslation('Export', locale)}</span>
          </button>

          {/* Primary Create Button */}
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{getTranslation(createButtonLabel, locale)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Row: Custom Filter Nodes & Bulk Selection Bar */}
      {(customFilterNodes || activeFilterCount > 0 || selectedCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          {/* Left: Custom Filters or Active Filter Tags */}
          <div className={cn("flex flex-wrap items-center gap-2 flex-1", isRtl ? "justify-start" : "justify-end")}>
            {customFilterNodes}
            {activeFilterCount > 0 && onResetFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{getTranslation('Reset Filters', locale)} ({activeFilterCount})</span>
              </button>
            )}
          </div>

          {/* Right: Bulk Selection Command Bar */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 shadow-sm text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <span className="font-bold font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mr-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedCount} {getTranslation('Selected', locale)}</span>
              </span>

              <button
                onClick={handleCopyIds}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-205 font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                title={getTranslation('Copy selected record IDs to clipboard', locale)}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{getTranslation('Copy IDs', locale)}</span>
              </button>

              <button
                onClick={() => onBulkExport ? onBulkExport(selectedIds) : toast.info(`Exporting ${selectedCount} selected items...`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-205 font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                title={getTranslation('Export selected rows', locale)}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{getTranslation('Export', locale)} ({selectedCount})</span>
              </button>

              {onBulkDelete && (
                <button
                  onClick={() => onBulkDelete(selectedIds)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-2xs"
                  title={getTranslation('Delete selected rows', locale)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{getTranslation('Delete', locale)}</span>
                </button>
              )}

              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className={cn(
                    "text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white transition-colors font-bold pl-1",
                    isRtl ? "pr-1 border-r border-emerald-300 dark:border-emerald-700" : "pl-1 border-l border-emerald-300 dark:border-emerald-700"
                  )}
                  title={getTranslation('Deselect all rows', locale)}
                >
                  {getTranslation('Deselect', locale)}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
