'use client';

import React, { useState } from 'react';
import { Download, X, Check, FileSpreadsheet, FileCode } from 'lucide-react';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'student' | 'teacher' | 'parent' | 'worker';
  data: any[];
}

export function BulkExportModal({ isOpen, onClose, entityType, data = [] }: BulkExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'schoolId',
    'firstName',
    'lastName',
    'name',
    'gender',
    'phone',
    'email',
    'status',
    'employmentStatus',
  ]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (!data || data.length === 0) return;

    if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yahayaschool_${entityType}s_export_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    } else {
      // CSV Export
      const headers = selectedFields.filter((field) => data.some((item) => field in item));
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yahayaschool_${entityType}s_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
    onClose();
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <span className="inline-block px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
            Data Export Tool
          </span>
          <h3 className="text-xl font-bold text-slate-100 capitalize">
            Export {entityType}s Directory
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Download current filtered table ({data.length} records) to local spreadsheet or developer JSON.
          </p>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setFormat('csv')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              format === 'csv'
                ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            <div>
              <span className="text-sm font-bold block">CSV Spreadsheet</span>
              <span className="text-[11px] opacity-75">Excel & Google Sheets</span>
            </div>
          </button>

          <button
            onClick={() => setFormat('json')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              format === 'json'
                ? 'border-sky-500 bg-sky-950/30 text-sky-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FileCode className="h-6 w-6 text-sky-400" />
            <div>
              <span className="text-sm font-bold block">JSON Archive</span>
              <span className="text-[11px] opacity-75">Full nested relations</span>
            </div>
          </button>
        </div>

        {/* Field Selection */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Include Export Fields ({selectedFields.length} selected):
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
            {['schoolId', 'firstName', 'lastName', 'name', 'gender', 'phone', 'email', 'status', 'employmentStatus', 'admissionNumber', 'salaryGrade', 'religion'].map((f) => {
              const active = selectedFields.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleField(f)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-emerald-400" />}
                  <span>{f}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all"
          >
            <Download className="h-4 w-4" />
            Download {format.toUpperCase()} ({data.length} rows)
          </button>
        </div>
      </div>
    </div>
  );
}
