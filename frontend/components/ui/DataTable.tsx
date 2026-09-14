'use client';

import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
  type ColumnDef, type SortingState, type RowSelectionState,
} from '@tanstack/react-table';
export type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[] | any[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  exportFilename?: string;
  exportFileName?: string;
  className?: string;
  pageSize?: number;
  onEdit?: (item: TData) => void;
  onDelete?: (item: TData) => Promise<void> | void;
  onBulkDelete?: (items: TData[]) => Promise<void> | void;
}

export function DataTable<TData>({
  data, columns, searchPlaceholder = 'Search...',
  isLoading = false, onRefresh, exportFilename = 'export', exportFileName, className, pageSize: defaultPageSize = 15,
  onEdit, onDelete, onBulkDelete,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const normalizedColumns = useState(() => {
    return (columns as any[]).map((col, idx) => {
      const id = col.id ?? col.accessorKey ?? col.key ?? (typeof col.header === 'string' ? col.header : `col_${idx}`);
      const accessorKey = col.accessorKey ?? col.key;
      const header = col.header ?? col.label ?? id;
      const cell = col.cell ?? (col.render ? ({ row }: any) => col.render(row.original) : undefined);

      if (accessorKey) {
        return {
          ...col,
          id,
          accessorKey,
          header,
          cell,
        };
      }
      return {
        ...col,
        id,
        header,
        cell,
      };
    });
  })[0];

  // Also re-normalize if columns change via useMemo or during render
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
    data, columns: safeColumns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    initialState: { pagination: { pageSize: defaultPageSize } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  function exportCSV() {
    const headers = table.getVisibleLeafColumns().filter(c => c.id !== 'select').map(c => String(c.columnDef.header ?? c.id));
    const rows = table.getFilteredRowModel().rows.map(row =>
      row.getVisibleCells().filter(c => c.column.id !== 'select').map(cell => String(cell.getValue() ?? ''))
    );
    const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${exportFilename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-lg">{selectedCount} selected</span>
          )}
          {onRefresh && (
            <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                      className={cn('px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap', header.column.getCanSort() && 'cursor-pointer hover:text-foreground select-none')}>
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground/50">
                            {header.column.getIsSorted() === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> :
                             header.column.getIsSorted() === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> :
                             <ChevronsUpDown className="w-3.5 h-3.5" />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, j) => <td key={j} className="px-4 py-3.5"><div className="h-4 bg-muted rounded-lg w-3/4" /></td>)}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No results found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={cn('transition-colors hover:bg-muted/30', row.getIsSelected() && 'bg-primary/5')}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{from}</span>–<span className="font-medium text-foreground">{to}</span> of <span className="font-medium text-foreground">{filteredCount}</span> results
          </p>
          <div className="flex items-center gap-2">
            <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {[10, 15, 25, 50, 100].map(size => <option key={size} value={size}>{size} / page</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-foreground px-2">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
