'use client';

import React, { useState } from 'react';
import { HardDrive, Upload, Search, File, Image, Film, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaLibraryPage() {
  const [query, setQuery] = useState('');

  const files = [
    { id: 1, name: 'school_logo_master_vector.svg', type: 'Image', size: '240 KB', date: '2026-07-10', icon: Image, url: '#' },
    { id: 2, name: 'term1_final_exam_guidelines_2026.pdf', type: 'Document', size: '1.4 MB', date: '2026-07-14', icon: FileText, url: '#' },
    { id: 3, name: 'sheikh_yahaya_speech_graduation.mp4', type: 'Video', size: '48.5 MB', date: '2026-06-25', icon: Film, url: '#' },
    { id: 4, name: 'student_handbook_en_ar.pdf', type: 'Document', size: '3.2 MB', date: '2026-07-01', icon: FileText, url: '#' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <HardDrive className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise Media & Document Library</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized file storage for school assets, curriculum PDFs, student photos, and video recordings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Upload file modal triggered')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search media files by filename or extension..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {files.map((file) => {
          const Icon = file.icon;
          return (
            <div key={file.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{file.type} • {file.size}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[10px]">{file.date}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toast.info(`Downloading ${file.name}`)} className="p-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"><Download className="w-4 h-4" /></button>
                  <button onClick={() => toast.success(`Deleted ${file.name}`)} className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
