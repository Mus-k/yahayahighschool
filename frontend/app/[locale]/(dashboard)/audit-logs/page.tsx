'use client';

import React, { useState } from 'react';
import { FileSearch, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t } from '@/lib/i18n-dict';

export default function AuditLogsPage() {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const logs = [
    { id: 'LOG-88910', timestamp: '2026-07-16 19:30:12', user: 'Super Administrator (super_admin)', action: 'UPDATE_ROLE_PERMISSIONS', target: 'Role: Director', severity: 'HIGH', ip: '192.168.1.101', details: 'Modified LMS Gradebook write permissions' },
    { id: 'LOG-88909', timestamp: '2026-07-16 18:45:00', user: 'Sheikh Yahaya Camara (director)', action: 'APPROVE_REPORT_CARD', target: 'Student: Zaid bin Harith', severity: 'NORMAL', ip: '192.168.1.140', details: 'Digitally signed Term 2 Report Card' },
    { id: 'LOG-88908', timestamp: '2026-07-16 17:22:33', user: 'System Cron Service', action: 'ROLLOVER_ATTENDANCE_BATCH', target: 'LMS Attendance', severity: 'INFO', ip: '127.0.0.1', details: 'Synchronized 420 daily attendance check-ins with Strapi' },
    { id: 'LOG-88907', timestamp: '2026-07-16 16:15:10', user: 'Fatima Diop (teacher)', action: 'MARKS_ENTRY_PUBLISH', target: 'Exam: Nahw Final', severity: 'NORMAL', ip: '192.168.1.155', details: 'Submitted 34 student examination scores' },
    { id: 'LOG-88906', timestamp: '2026-07-16 15:00:02', user: 'Unknown IP Attempt', action: 'FAILED_LOGIN_ATTEMPT', target: 'Auth / Super Admin', severity: 'CRITICAL', ip: '45.133.1.88', details: '3 failed login attempts recorded. Rate limit triggered.' },
  ];

  const filtered = logs.filter(l =>
    (severityFilter === 'all' || l.severity === severityFilter) &&
    (l.user.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase()) || l.target.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileSearch className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Enterprise Security & Audit Logs', locale)}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Immutable system audit trail tracking administrative actions, data mutations, and access anomalies.', locale)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Exported audit log CSV archive successfully')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Export Audit CSV', locale)}</span>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('Search logs by user, action code (UPDATE_ROLE), or target...', locale)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-300"
        >
          <option value="all">{t('Severity: All', locale)}</option>
          <option value="CRITICAL">{t('Critical Alerts', locale)}</option>
          <option value="HIGH">{t('High Severity', locale)}</option>
          <option value="NORMAL">{t('Normal Operations', locale)}</option>
          <option value="INFO">{t('System Info', locale)}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">{t('Log ID', locale)}</th>
                <th className="py-3.5 px-4">{t('Timestamp', locale)}</th>
                <th className="py-3.5 px-4">{t('User / Actor', locale)}</th>
                <th className="py-3.5 px-4">{t('Action Code', locale)}</th>
                <th className="py-3.5 px-4">{t('Target Resource', locale)}</th>
                <th className="py-3.5 px-4">{t('Severity', locale)}</th>
                <th className="py-3.5 px-4">{t('IP Address', locale)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">{log.id}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{log.action}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-300">{log.target}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${log.severity === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40' : log.severity === 'HIGH' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40' : log.severity === 'INFO' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400 border border-sky-300 dark:border-sky-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
