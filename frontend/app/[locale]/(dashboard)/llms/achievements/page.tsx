/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Calendar, Clock, Search, BookOpen, Users,
  Trash2, Pencil, X, AlertTriangle, Filter, Download,
  CheckCircle2, User, Eye, Trophy, Award, Sparkles, RefreshCw, Medal, Star
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import qs from 'qs';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AchievementRecord {
  id: number | string;
  documentId: string;
  title: string;
  description?: string;
  dateEarned: string;
  student?: any;
  // mapped
  studentName: string;
  studentSchoolId: string;
  studentPhoto?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr || '';
  }
}

function mapAchievementRecord(item: any): AchievementRecord {
  const s = item.student;
  
  const studentName = s
    ? (s.name || s.fullName || [s.firstName, s.lastName].filter(Boolean).join(' ') || `Student #${s.id}`)
    : 'Unknown Student';
  
  const studentSchoolId = s?.schoolId || s?.studentId || '—';
  
  const rawPhoto = s?.photoUrl || s?.photo?.url || s?.avatarUrl;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
  const studentPhoto = rawPhoto 
    ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`)
    : undefined;

  return {
    ...item,
    studentName,
    studentSchoolId,
    studentPhoto
  };
}

// Keyword-based badge icon helper
function getBadgeInfo(title: string) {
  const t = title.toLowerCase();
  if (t.includes('outstanding') || t.includes('excellence') || t.includes('first') || t.includes('1st')) {
    return {
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      colorClass: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-850'
    };
  }
  if (t.includes('champion') || t.includes('winner') || t.includes('medal') || t.includes('competition')) {
    return {
      icon: <Medal className="w-4 h-4 text-purple-500" />,
      colorClass: 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-850'
    };
  }
  if (t.includes('memorization') || t.includes('memoriz') || t.includes('quran') || t.includes('hifz')) {
    return {
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      colorClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-850'
    };
  }
  if (t.includes('complete') || t.includes('pass') || t.includes('level') || t.includes('graduat')) {
    return {
      icon: <Award className="w-4 h-4 text-indigo-500" />,
      colorClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-850'
    };
  }
  return {
    icon: <Star className="w-4 h-4 text-sky-500" />,
    colorClass: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-850'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Component (Add/Edit)
// ─────────────────────────────────────────────────────────────────────────────

function AchievementModal({
  editItem,
  onClose,
  onSaved
}: {
  editItem: AchievementRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editItem;
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [form, setForm] = useState({
    student: editItem?.student?.documentId || String(editItem?.student?.id || ''),
    title: editItem?.title || '',
    dateEarned: editItem?.dateEarned || new Date().toISOString().split('T')[0],
    description: editItem?.description || ''
  });

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const res = await apiClient.get('/students?pagination[limit]=250&sort=firstName:asc');
        setStudents(res.data?.data || []);
      } catch (err) {
        console.warn('Failed to load student options:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student) {
      toast.error(t('Please select a student'));
      return;
    }
    if (!form.title) {
      toast.error(t('Title is required'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        dateEarned: form.dateEarned,
        description: form.description,
        student: form.student
      };

      if (isEdit) {
        await apiClient.put(`/language-achievements/${editItem!.documentId || editItem!.id}`, { data: payload });
        toast.success(t('Achievement updated successfully'));
      } else {
        await apiClient.post('/language-achievements', { data: payload });
        toast.success(t('Achievement recorded successfully'));
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Failed to save achievement'));
    } finally {
      setSaving(false);
    }
  };

  const inpClass = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';
  const labelClass = 'text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {isEdit ? t('Edit Achievement Record') : t('Record New Achievement')}
              </h2>
              <p className="text-[11px] text-slate-400">{t('Award honors, milestone badges, or certificate awards')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass}>{t('Scholar / Student *')}</label>
            <select
              required
              disabled={isEdit}
              value={form.student}
              onChange={e => setForm(f => ({ ...f, student: e.target.value }))}
              className={inpClass}
            >
              <option value="">{loadingStudents ? t('Loading scholars...') : t('— Select Student —')}</option>
              {students.map(s => (
                <option key={s.id} value={s.documentId || s.id}>
                  {s.name || [s.firstName, s.lastName].filter(Boolean).join(' ')} ({s.schoolId || s.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{t('Achievement Title *')}</label>
            <input
              required
              type="text"
              placeholder={t('e.g. Arabic Declamation Cup — 1st Place')}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inpClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{t('Date Earned *')}</label>
            <input
              required
              type="date"
              value={form.dateEarned}
              onChange={e => setForm(f => ({ ...f, dateEarned: e.target.value }))}
              className={inpClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{t('Achievement Description / Notes')}</label>
            <textarea
              placeholder={t('Record details about the milestone, scores, performance reasons...')}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className={inpClass}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl cursor-pointer border-none transition-colors"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-none transition-colors disabled:opacity-60"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? t('Saving...') : (isEdit ? t('Update Record') : t('Record Achievement'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer: Inspect Achievement Details
// ─────────────────────────────────────────────────────────────────────────────

function InspectDrawer({
  record,
  onClose
}: {
  record: AchievementRecord;
  onClose: () => void;
}) {
  const badge = getBadgeInfo(record.title);
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{t('Achievement Details')}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Student Profile Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          {record.studentPhoto ? (
            <img src={record.studentPhoto} alt={record.studentName} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
              {record.studentName.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 dark:text-white text-xs truncate">{record.studentName}</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t('School ID')}: {record.studentSchoolId}</p>
          </div>
        </div>

        {/* Milestone Banner */}
        <div className={`p-4 rounded-2xl ${badge.colorClass} flex items-center gap-3`}>
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">
            {badge.icon}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t('Milestone Honor')}</p>
            <p className="text-xs font-black mt-0.5">{record.title}</p>
          </div>
        </div>

        {/* Date completed details */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">{t('Date Earned')}</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{formatDate(record.dateEarned)}</span>
          </div>
        </div>

        {/* Description Notes */}
        {record.description && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1.5">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('Achievement Citation')}</h4>
            <p className="text-xs text-slate-655 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl italic border border-slate-100 dark:border-slate-800">
              "{record.description}"
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none shadow-md transition-colors"
        >
          {t('Done')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LanguageAchievementsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [records, setRecords] = useState<AchievementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AchievementRecord | null>(null);
  const [inspectItem, setInspectItem] = useState<AchievementRecord | null>(null);

  const [query, setQuery] = useState('');
  const [filterDate, setFilterDate] = useState(''); // all | month | year
  const [showFilters, setShowFilters] = useState(false);

  // User permission settings
  const { userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher';

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs.stringify({
        populate: ['student', 'student.photo'],
        pagination: { limit: 500 },
        sort: ['dateEarned:desc', 'createdAt:desc']
      }, { encodeValuesOnly: true });

      const res = await apiClient.get(`/language-achievements?${q}`);
      setRecords((res.data?.data || []).map(mapAchievementRecord));
    } catch {
      toast.error(t('Failed to load language achievements'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (record: AchievementRecord) => {
    if (!confirm(t('Are you sure you want to delete the achievement for') + ` ${record.studentName}?`)) return;
    try {
      await apiClient.delete(`/language-achievements/${record.documentId || record.id}`);
      toast.success(t('Achievement record deleted'));
      loadRecords();
    } catch {
      toast.error(t('Failed to delete achievement record'));
    }
  };

  const filtered = useMemo(() => {
    let list = records;
    const now = new Date();
    
    if (filterDate === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      list = list.filter(r => r.dateEarned >= startOfMonth);
    } else if (filterDate === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      list = list.filter(r => r.dateEarned >= startOfYear);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentSchoolId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterDate, query]);

  // Aggregated Stats
  const stats = useMemo(() => {
    const total = records.length;
    const now = new Date();
    
    // achievements this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthCount = records.filter(r => r.dateEarned >= startOfMonth).length;

    // unique scholars recognized
    const studentSet = new Set<string>();
    records.forEach(r => studentSet.add(r.studentSchoolId));
    const uniqueScholars = studentSet.size;

    // Top recognition count (e.g. excellence)
    const excellenceCount = records.filter(r => {
      const t = r.title.toLowerCase();
      return t.includes('outstanding') || t.includes('excellence') || t.includes('champion') || t.includes('winner');
    }).length;

    return { total, monthCount, uniqueScholars, excellenceCount };
  }, [records]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Scholar ID', 'Scholar Name', 'Achievement Title', 'Description', 'Date Earned'];
    const rows = filtered.map(r => [
      r.studentSchoolId,
      r.studentName,
      r.title,
      r.description || '',
      r.dateEarned
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language_achievements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selClass = 'px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200 dark:shadow-indigo-950">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{t('Language Achievements')}</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
            {t('Track honors, curriculum level completion tokens, speaking awards, and memorization honors.')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t('Export CSV')}
          </button>
          {canModify && (
            <button
              onClick={() => { setEditItem(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-950 cursor-pointer border-none transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('Award Achievement')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('Total Honors Awarded'), value: stats.total, icon: <Award className="w-4 h-4 text-indigo-605" />, bg: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/20' },
          { label: t('Unique Scholars'), value: stats.uniqueScholars, icon: <Users className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/20' },
          { label: t('Earned This Month'), value: stats.monthCount, icon: <Calendar className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20' },
          { label: t('Excellence Badges'), value: stats.excellenceCount, icon: <Trophy className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20' }
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.bg} flex items-center gap-3.5`}>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search by student name, ID, achievement honor or keywords...')}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('Filters')}
          {filterDate && (
            <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </div>

      {/* Filters Expansion Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className={selClass}>
            <option value="">{t('All Time')}</option>
            <option value="month">{t('This Month')}</option>
            <option value="year">{t('This Year')}</option>
          </select>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              <X className="w-3 h-3" /> {t('Clear Filter')}
            </button>
          )}
          <span className="text-[11px] text-slate-400 ml-auto font-semibold">
            {filtered.length} {filtered.length === 1 ? t('achievement listed') : t('achievements listed')}
          </span>
        </div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3 animate-pulse" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Achievements Data Table */}
      {!loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-slate-350 dark:text-slate-655" />
              </div>
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">{t('No Achievements Recorded')}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1 max-w-sm">
                {t('No achievement logs exist matching search criteria. Award an achievement badge above.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">{t('Scholar')}</th>
                    <th className="px-5 py-3">{t('Date Earned')}</th>
                    <th className="px-5 py-3">{t('Achievement Milestone')}</th>
                    <th className="px-5 py-3">{t('Citation / Description')}</th>
                    <th className="px-5 py-3 text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filtered.map(record => {
                    const badge = getBadgeInfo(record.title);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          {record.studentPhoto ? (
                            <img src={record.studentPhoto} alt={record.studentName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                              {record.studentName.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 dark:text-white block truncate">{record.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{record.studentSchoolId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-semibold whitespace-nowrap">
                          {formatDate(record.dateEarned)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${badge.colorClass}`}>
                            {badge.icon}
                            <span>{record.title}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-[280px] truncate">
                          {record.description || <span className="text-slate-400 italic">{t('No citation details')}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setInspectItem(record)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                              title={t('Inspect Details')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canModify && (
                              <>
                                <button
                                  onClick={() => { setEditItem(record); setShowModal(true); }}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                  title={t('Edit Record')}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(record)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                  title={t('Delete Record')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Award Modal */}
      {showModal && (
        <AchievementModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={loadRecords}
        />
      )}

      {/* Inspect Drawer */}
      {inspectItem && (
        <InspectDrawer
          record={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}
    </div>
  );
}
