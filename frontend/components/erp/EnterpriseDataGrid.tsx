'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, getExpandedRowModel,
  flexRender, type ColumnDef, type SortingState, type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';
export type { ColumnDef } from '@tanstack/react-table';
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, Edit, Calendar, DollarSign, Home, Printer, PauseCircle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EnterpriseEmptyState, type EnterpriseEmptyStateProps } from './EnterpriseEmptyState';
import type { TableDensity } from './EnterpriseToolbar';
import { useLocale } from 'next-intl';
import { getTranslation } from './EnterpriseModuleShell';

export interface EnterpriseDataGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[] | any[];
  isLoading?: boolean;
  density?: TableDensity;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  onRowInspect?: (row: TData) => void;
  onRowEdit?: (row: TData) => void;
  onRowDelete?: (row: TData) => void;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  renderSubComponent?: (props: { row: TData }) => React.ReactNode;
  getRowId?: (row: TData, index: number) => string;
  getRowColor?: (row: TData) => string;
  emptyStateProps?: EnterpriseEmptyStateProps;
  className?: string;
}

export function EnterpriseDataGrid<TData>({
  data,
  columns,
  isLoading = false,
  density = 'cozy',
  onRowClick,
  onRowDoubleClick,
  onRowInspect,
  onRowEdit,
  onRowDelete,
  onSelectionChange,
  renderSubComponent,
  getRowId = (row: any, i) => String(row.id ?? row.code ?? row.applicationId ?? i),
  getRowColor,
  emptyStateProps,
  className,
}: EnterpriseDataGridProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: TData;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const safeColumns = (columns as any[]).map((col, idx) => {
    const id = col.id ?? col.accessorKey ?? col.key ?? (typeof col.header === 'string' ? col.header : `col_${idx}`);
    const accessorKey = col.accessorKey ?? col.key;
    const header = col.header ?? col.label ?? id;
    const cell = col.cell ?? (col.render ? ({ row }: any) => col.render(row.original) : undefined);

    if (accessorKey) {
      return { ...col, id, accessorKey, header, cell };
    }
    return { ...col, id, header, cell };
  });

  const table = useReactTable({
    data,
    columns: safeColumns,
    state: { sorting, rowSelection, expanded },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (originalRow, index) => getRowId(originalRow, index),
    enableRowSelection: true,
    enableMultiSort: true,
    initialState: { pagination: { pageSize: 15 } },
  });

  useEffect(() => {
    setSorting([]);
    setRowSelection({});
    setExpanded({});
  }, [columns]);

  useEffect(() => {
    if (onSelectionChange) {
      const selectedKeys = Object.keys(rowSelection).filter((k) => rowSelection[k]);
      onSelectionChange(selectedKeys);
    }
  }, [rowSelection, onSelectionChange]);

  const densityClasses = {
    compact: 'py-1.5 px-3 text-[11px]',
    cozy: 'py-2.5 px-4 text-xs',
    comfortable: 'py-3.5 px-5 text-sm',
  };

  const currentDensityClass = densityClasses[density] || densityClasses.cozy;

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs min-h-[500px] flex items-center justify-center", className)}>
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{getTranslation('Loading Enterprise Grid Data...', locale)}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return <EnterpriseEmptyState {...emptyStateProps} />;
  }

  // Format footer strings
  const fromIndex = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
  const toIndex = Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length);
  const totalCount = data.length;

  let showingLabel = (
    <span>
      Showing <strong className="text-slate-900 dark:text-white">{fromIndex}</strong> to <strong className="text-slate-900 dark:text-white">{toIndex}</strong> of <strong className="text-emerald-600 dark:text-emerald-400">{totalCount}</strong> entries
    </span>
  );
  if (locale === 'ar') {
    showingLabel = (
      <span>
        عرض <strong className="text-slate-900 dark:text-white">{fromIndex}</strong> إلى <strong className="text-slate-900 dark:text-white">{toIndex}</strong> من أصل <strong className="text-emerald-600 dark:text-emerald-400">{totalCount}</strong> مدخلات
      </span>
    );
  } else if (locale === 'fr') {
    showingLabel = (
      <span>
        Affichage de <strong className="text-slate-900 dark:text-white">{fromIndex}</strong> à <strong className="text-slate-900 dark:text-white">{toIndex}</strong> sur <strong className="text-emerald-600 dark:text-emerald-400">{totalCount}</strong> entrées
      </span>
    );
  } else if (locale === 'tr') {
    showingLabel = (
      <span>
        <strong className="text-emerald-600 dark:text-emerald-400">{totalCount}</strong> kayıttan <strong className="text-slate-900 dark:text-white">{fromIndex}</strong> - <strong className="text-slate-900 dark:text-white">{toIndex}</strong> arası gösteriliyor
      </span>
    );
  }

  const pageIndex = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount() || 1;
  let pageOfLabel = `Page ${pageIndex} of ${pageCount}`;
  if (locale === 'ar') {
    pageOfLabel = `الصفحة ${pageIndex} من ${pageCount}`;
  } else if (locale === 'fr') {
    pageOfLabel = `Page ${pageIndex} sur ${pageCount}`;
  } else if (locale === 'tr') {
    pageOfLabel = `Sayfa ${pageIndex} / ${pageCount}`;
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs relative flex flex-col min-h-[550px]", className)}>
      <div className="overflow-x-auto flex-1">
        <table className={cn("w-full border-collapse font-sans", isRtl ? "text-right" : "text-left")} role="grid">
          {/* Sticky Table Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800/90 select-none sticky top-0 z-20 shadow-2xs"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn(
                        currentDensityClass,
                        "font-bold text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap",
                        canSort && "cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="shrink-0">
                            {isSorted === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                            ) : isSorted === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Table Body with Hover, Right-Click, and Keyboard Navigation */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-205">
            {table.getRowModel().rows.map((row) => {
              const rowOriginal = row.original;
              const isSelected = row.getIsSelected();
              const customColor = getRowColor ? getRowColor(rowOriginal) : undefined;

              return (
                <React.Fragment key={row.id}>
                  <tr
                    tabIndex={0}
                    onClick={() => onRowClick && onRowClick(rowOriginal)}
                    onDoubleClick={() => {
                      if (onRowDoubleClick) onRowDoubleClick(rowOriginal);
                      else if (onRowInspect) onRowInspect(rowOriginal);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        row: rowOriginal,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onRowInspect) onRowInspect(rowOriginal);
                        else if (onRowClick) onRowClick(rowOriginal);
                      }
                    }}
                    className={cn(
                      "group transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-600/50 cursor-pointer select-none",
                      isSelected ? "bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      customColor
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cn(currentDensityClass, "whitespace-nowrap font-medium")}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {/* Render SubComponent / Expanded Row */}
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                      <td colSpan={row.getVisibleCells().length} className="p-4 sm:p-5">
                        {renderSubComponent({ row: rowOriginal })}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {showingLabel}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title={getTranslation('Previous Page', locale)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
            {pageOfLabel}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title={getTranslation('Next Page', locale)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right-Click Context Menu Popup */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className={cn(
            "fixed z-50 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150",
            isRtl ? "text-right" : "text-left"
          )}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{getTranslation('Enterprise Actions', locale)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">S/4</span>
          </div>

          <button
            onClick={() => {
              const row = contextMenu.row;
              setContextMenu(null);
              if (onRowInspect) onRowInspect(row);
              else toast.info('Profile inspection triggered');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-900 dark:text-white font-semibold transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{getTranslation('Inspect Record Drawer', locale)}</span>
          </button>

          <button
            onClick={() => {
              const row = contextMenu.row;
              setContextMenu(null);
              if (onRowEdit) onRowEdit(row);
              else toast.info('Edit mode triggered');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Edit className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{getTranslation('Edit Record', locale)}</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={() => {
              setContextMenu(null);
              toast.success('Viewing Attendance Report');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{getTranslation('Attendance Logs', locale)}</span>
          </button>

          <button
            onClick={() => {
              setContextMenu(null);
              toast.info('Viewing Finance Invoices');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{getTranslation('Finance & Billing', locale)}</span>
          </button>

          <button
            onClick={() => {
              setContextMenu(null);
              toast.info('Viewing Hostel & Accommodation Status');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{getTranslation('Hostel Details', locale)}</span>
          </button>

          <button
            onClick={() => {
              setContextMenu(null);
              toast.success('Printing ID Card & Barcode...');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>{getTranslation('Print ID Card', locale)}</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={() => {
              setContextMenu(null);
              toast.warning('Record suspension requested');
            }}
            className={cn("w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-amber-700 dark:text-amber-400 transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>{getTranslation('Suspend Record', locale)}</span>
          </button>

          <button
            onClick={() => {
              const row = contextMenu.row;
              setContextMenu(null);
              if (onRowDelete) onRowDelete(row);
              else toast.error('Record deletion initiated');
            }}
            className={cn("w-full px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-450 font-bold transition-colors", isRtl ? "flex-row-reverse text-right" : "text-left")}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{getTranslation('Delete Permanently', locale)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
