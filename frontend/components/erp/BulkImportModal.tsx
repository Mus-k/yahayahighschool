'use client';

import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'student' | 'teacher' | 'parent' | 'worker';
  onSuccess?: () => void;
}

export function BulkImportModal({ isOpen, onClose, entityType, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message?: string }>({ type: 'idle' });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsv(text);
    };
    reader.readAsText(uploaded);
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setStatus({ type: 'error', message: 'CSV must contain at least a header row and one data row.' });
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const rowObj: any = {};
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] || '';
      });
      rows.push(rowObj);
    }
    setParsedRows(rows);
    setStatus({ type: 'idle' });
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      setStatus({ type: 'error', message: 'No rows to import.' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'idle' });
    try {
      let successCount = 0;
      const endpoint = entityType === 'worker' ? '/workers' : 
                       entityType === 'student' ? '/students' : 
                       entityType === 'teacher' ? '/teachers' : '/parents';

      for (const row of parsedRows) {
        const payload: any = {};
        Object.keys(row).forEach((key) => {
          if (row[key] !== '') {
            payload[key] = row[key];
          }
        });
        
        // Ensure required fields mapping:
        if (entityType === 'worker') {
          if (!payload.name) payload.name = 'Unnamed Worker';
          if (!payload.role) payload.role = 'Worker';
          if (!payload.phone) payload.phone = '+231 000 000';
          if (!payload.employmentStatus) payload.employmentStatus = 'active';
        } else if (entityType === 'student') {
          if (!payload.firstName) payload.firstName = 'Student';
          if (!payload.lastName) payload.lastName = 'LastName';
          if (!payload.gender) payload.gender = 'male';
        } else if (entityType === 'teacher') {
          if (!payload.firstName) payload.firstName = 'Teacher';
          if (!payload.lastName) payload.lastName = 'LastName';
          if (!payload.gender) payload.gender = 'male';
          if (!payload.phone) payload.phone = '+231 000 000';
        } else if (entityType === 'parent') {
          if (!payload.name) payload.name = 'Parent Name';
          if (!payload.phone) payload.phone = '+231 000 000';
        }

        await apiClient.post(endpoint, { data: payload });
        successCount++;
      }
      
      setStatus({ type: 'success', message: `Successfully imported ${successCount} ${entityType} records!` });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setParsedRows([]);
        setFile(null);
        setStatus({ type: 'idle' });
      }, 1500);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error occurred during bulk import.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
            Batch Import Utility
          </span>
          <h3 className="text-xl font-bold text-slate-100 capitalize">
            Bulk Import {entityType}s
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload a CSV file with headers matching exact entity fields (e.g., <code>firstName, lastName, gender, phone</code>).
          </p>
        </div>

        {/* Upload Area */}
        {!file ? (
          <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 hover:bg-slate-950 hover:border-emerald-500/50 cursor-pointer transition-all p-6 text-center">
            <Upload className="h-10 w-10 text-emerald-400 mb-3" />
            <span className="text-sm font-semibold text-slate-200">Click to upload CSV file</span>
            <span className="text-xs text-slate-500 mt-1">Maximum 500 records per upload batch</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{file.name}</h4>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows parsed</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setParsedRows([]); }}
                className="text-xs text-rose-400 hover:underline"
              >
                Remove
              </button>
            </div>

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0">
                    <tr>
                      {Object.keys(parsedRows[0]).slice(0, 4).map((key) => (
                        <th key={key} className="p-2 border-b border-slate-800">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).slice(0, 4).map((val: any, i) => (
                          <td key={i} className="p-2 truncate max-w-[120px]">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Status Alerts */}
        {status.type !== 'idle' && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 text-xs ${
            status.type === 'error' ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
          }`}>
            {status.type === 'error' ? <AlertCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={!file || parsedRows.length === 0 || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Processing Batch...' : `Confirm Import (${parsedRows.length} rows)`}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
