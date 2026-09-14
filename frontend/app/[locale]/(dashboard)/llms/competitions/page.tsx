/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Calendar, Clock, Search, BookOpen, Users,
  Trash2, Pencil, X, AlertTriangle, Filter, Download,
  CheckCircle2, User, Eye, Trophy, Award, Sparkles, RefreshCw
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

interface CompetitionRecord {
  id: number | string;
  documentId: string;
  title: string;
  category?: 'Debate' | 'Speech Contest' | 'Essay Competition' | 'Reading Competition' | 'Spelling Bee' | 'Poetry Recitation' | 'Translation' | 'Storytelling';
  date?: string;
  judges?: string;
  ranking?: number;
  awards?: string;
  students?: any[];
  // mapped
  participantsCount: number;
}

const CATEGORIES = [
  'Debate',
  'Speech Contest',
  'Essay Competition',
  'Reading Competition',
  'Spelling Bee',
  'Poetry Recitation',
  'Translation',
  'Storytelling'
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not Scheduled';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getCategoryColor(cat?: string): string {
  switch (cat) {
    case 'Debate': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800';
    case 'Speech Contest': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    case 'Essay Competition': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800';
    case 'Reading Competition': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    case 'Spelling Bee': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
    case 'Poetry Recitation': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    case 'Translation': return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800';
    case 'Storytelling': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700';
  }
}

function mapCompetitionRecord(item: any): CompetitionRecord {
  const studentsList = item.students?.data || item.students || [];
  return {
    ...item,
    students: studentsList,
    participantsCount: studentsList.length
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Competition Modal (Add/Edit)
// ─────────────────────────────────────────────────────────────────────────────

function CompetitionModal({
  editItem,
  onClose,
  onSaved
}: {
  editItem: CompetitionRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editItem;
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [form, setForm] = useState({
    title: editItem?.title || '',
    category: editItem?.category || 'Debate',
    date: editItem?.date || new Date().toISOString().split('T')[0],
    judges: editItem?.judges || '',
    ranking: editItem?.ranking !== undefined ? String(editItem.ranking) : '',
    awards: editItem?.awards || '',
    selectedStudents: (editItem?.students || []).map((s: any) => s.documentId || String(s.id)) as string[]
  });

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Load students list
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

  const toggleStudent = (docId: string) => {
    setForm(f => {
      const exists = f.selectedStudents.includes(docId);
      const next = exists
        ? f.selectedStudents.filter(id => id !== docId)
        : [...f.selectedStudents, docId];
      return { ...f, selectedStudents: next };
    });
  };

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return students.filter(s => {
      const name = (s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || '').toLowerCase();
      const sId = (s.schoolId || '').toLowerCase();
      return name.includes(q) || sId.includes(q);
    });
  }, [students, studentSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error(t('Title is required'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        category: form.category,
        date: form.date,
        judges: form.judges,
        ranking: form.ranking ? parseInt(form.ranking) : null,
        awards: form.awards,
        students: form.selectedStudents
      };

      if (isEdit) {
        await apiClient.put(`/language-competitions/${editItem!.documentId || editItem!.id}`, { data: payload });
        toast.success(t('Competition details updated successfully'));
      } else {
        await apiClient.post('/language-competitions', { data: payload });
        toast.success(t('New competition recorded successfully'));
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Failed to save competition'));
    } finally {
      setSaving(false);
    }
  };

  const inpClass = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';
  const labelClass = 'text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {isEdit ? t('Edit Language Competition') : t('Record New Competition')}
              </h2>
              <p className="text-[11px] text-slate-400">{t('Manage category, date, judges, awards, and participants')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className={labelClass}>{t('Competition Title *')}</label>
            <input
              required
              type="text"
              placeholder={t('e.g. Arabic Poetry Recitation Championship 2026')}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inpClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Category *')}</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                className={inpClass}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Event Date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inpClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Judges / Assessors')}</label>
              <input
                type="text"
                placeholder={t('e.g. Sheikh Yahaya, Ustadh Ibrahim')}
                value={form.judges}
                onChange={e => setForm(f => ({ ...f, judges: e.target.value }))}
                className={inpClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Awards / Prizes')}</label>
              <input
                type="text"
                placeholder={t('e.g. Gold Medal & Scholar Certificate')}
                value={form.awards}
                onChange={e => setForm(f => ({ ...f, awards: e.target.value }))}
                className={inpClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Ranking / Performance Tier')}</label>
              <input
                type="number"
                placeholder={t('e.g. 1 for First Place, or leave blank')}
                value={form.ranking}
                onChange={e => setForm(f => ({ ...f, ranking: e.target.value }))}
                className={inpClass}
              />
            </div>
          </div>

          {/* Student Selector Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-300">{t('Assign Student Participants')}</h3>
              <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                {form.selectedStudents.length} {t('Assigned')}
              </span>
            </div>

            {/* Student search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={t('Search scholars by name or school ID...')}
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Selection list */}
            <div className="h-36 overflow-y-auto border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/40">
              {loadingStudents && (
                <p className="text-[11px] text-slate-400 p-3 italic text-center">{t('Loading student records...')}</p>
              )}
              {!loadingStudents && filteredStudents.length === 0 && (
                <p className="text-[11px] text-slate-400 p-3 italic text-center">{t('No students found')}</p>
              )}
              {filteredStudents.map(student => {
                const docId = student.documentId || String(student.id);
                const isSelected = form.selectedStudents.includes(docId);
                const sName = student.name || [student.firstName, student.lastName].filter(Boolean).join(' ');

                return (
                  <div
                    key={docId}
                    onClick={() => toggleStudent(docId)}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer select-none"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{student.schoolId || student.id}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 dark:border-slate-655'
                    }`}>
                      {isSelected && <span className="text-[9px]">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 gap-3 shrink-0">
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
              {saving ? t('Saving...') : (isEdit ? t('Update Details') : t('Record Competition'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer: Inspect Competition Details
// ─────────────────────────────────────────────────────────────────────────────

function InspectDrawer({
  record,
  onClose
}: {
  record: CompetitionRecord;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{t('Competition Insights')}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Title Block */}
        <div className="space-y-1.5">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(record.category)}`}>
            {t(record.category || '')}
          </span>
          <h4 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{record.title}</h4>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {t('Date Scheduled')}: {formatDate(record.date)}
          </p>
        </div>

        {/* Award Details if exists */}
        {record.awards && (
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t('Awards & Prizes')}</p>
              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 mt-1">{record.awards}</p>
              {record.ranking && (
                <p className="text-[10px] font-bold text-amber-700 mt-0.5">{t('Performance Rank: Tier')} #{record.ranking}</p>
              )}
            </div>
          </div>
        )}

        {/* General metadata block */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">{t('Judges / Evaluators')}</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{record.judges || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">{t('Total Scholars competing')}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {record.participantsCount} {record.participantsCount === 1 ? t('Scholar') : t('Scholars')}
            </span>
          </div>
        </div>

        {/* Participating Students Cards List */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t('Participating Scholars')}
          </h4>
          
          {record.students && record.students.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{t('No scholars are currently registered in this competition.')}</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {record.students?.map((student: any) => {
                const sName = student.name || student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ') || `Student #${student.id}`;
                const rawPhoto = student.photoUrl || student.photo?.url || student.avatarUrl;
                const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
                const sPhoto = rawPhoto 
                  ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`)
                  : undefined;

                return (
                  <div key={student.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    {sPhoto ? (
                      <img src={sPhoto} alt={sName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {sName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs truncate">{sName}</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{student.schoolId || `AC${student.id}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

export default function LanguageCompetitionsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CompetitionRecord | null>(null);
  const [inspectItem, setInspectItem] = useState<CompetitionRecord | null>(null);

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTiming, setFilterTiming] = useState(''); // all | upcoming | past
  const [showFilters, setShowFilters] = useState(false);

  // User permission settings
  const { userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher';

  const loadCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs.stringify({
        populate: ['students', 'students.photo'],
        pagination: { limit: 500 },
        sort: ['date:desc', 'createdAt:desc']
      }, { encodeValuesOnly: true });

      const res = await apiClient.get(`/language-competitions?${q}`);
      setCompetitions((res.data?.data || []).map(mapCompetitionRecord));
    } catch {
      toast.error(t('Failed to load language competition records'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  const handleDelete = async (record: CompetitionRecord) => {
    if (!confirm(t('Are you sure you want to delete') + ` "${record.title}"?`)) return;
    try {
      await apiClient.delete(`/language-competitions/${record.documentId || record.id}`);
      toast.success(t('Competition record deleted'));
      loadCompetitions();
    } catch {
      toast.error(t('Failed to delete competition record'));
    }
  };

  const filtered = useMemo(() => {
    let list = competitions;
    const today = new Date().toISOString().split('T')[0];

    if (filterCategory) {
      list = list.filter(r => r.category === filterCategory);
    }
    if (filterTiming === 'upcoming') {
      list = list.filter(r => r.date ? r.date >= today : true);
    } else if (filterTiming === 'past') {
      list = list.filter(r => r.date ? r.date < today : false);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.judges || '').toLowerCase().includes(q) ||
        (r.awards || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [competitions, filterCategory, filterTiming, query]);

  // General Statistics
  const stats = useMemo(() => {
    const total = competitions.length;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = competitions.filter(c => c.date ? c.date >= today : true).length;
    const completed = total - upcoming;

    // Collect all unique participant student IDs
    const studentSet = new Set<string>();
    competitions.forEach(c => {
      c.students?.forEach(s => {
        studentSet.add(s.documentId || String(s.id));
      });
    });
    const uniqueParticipants = studentSet.size;

    return { total, upcoming, completed, uniqueParticipants };
  }, [competitions]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Title', 'Category', 'Date Scheduled', 'Judges', 'Awards / Prizes', 'Ranking Place', 'Participants Count'];
    const rows = filtered.map(r => [
      r.title,
      r.category || '',
      r.date || '',
      r.judges || '',
      r.awards || '',
      r.ranking || '',
      r.participantsCount
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language_competitions_${new Date().toISOString().split('T')[0]}.csv`;
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
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{t('Language Competitions')}</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
            {t('Track inter-class debate cups, speech tournaments, storytelling leagues, and poetry recitations.')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadCompetitions}
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
              {t('Add Competition')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('Total Competitions'), value: stats.total, icon: <Trophy className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/20' },
          { label: t('Unique Participants'), value: stats.uniqueParticipants, icon: <Users className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/20' },
          { label: t('Upcoming Events'), value: stats.upcoming, icon: <Calendar className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20' },
          { label: t('Completed Cups'), value: stats.completed, icon: <Award className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20' }
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

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search by tournament name, category, judges, or prizes...')}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('Filters')}
          {[filterCategory, filterTiming].filter(Boolean).length > 0 && (
            <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {[filterCategory, filterTiming].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Expansion Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selClass}>
            <option value="">{t('All Categories')}</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
          </select>
          <select value={filterTiming} onChange={e => setFilterTiming(e.target.value)} className={selClass}>
            <option value="">{t('All Statuses')}</option>
            <option value="upcoming">{t('Upcoming Events')}</option>
            <option value="past">{t('Completed Cups')}</option>
          </select>
          {[filterCategory, filterTiming].some(Boolean) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterTiming(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              <X className="w-3 h-3" /> {t('Clear Filters')}
            </button>
          )}
          <span className="text-[11px] text-slate-400 ml-auto font-semibold">
            {filtered.length} {filtered.length === 1 ? t('record listed') : t('records listed')}
          </span>
        </div>
      )}

      {/* Skeleton Loader */}
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

      {/* Competitions Data Table */}
      {!loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-slate-350 dark:text-slate-655" />
              </div>
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">{t('No Competitions Tracked')}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1 max-w-sm">
                {t('No language competitions exist matching the query. Add a new competition cup above.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">{t('Tournament / Competition')}</th>
                    <th className="px-5 py-3">{t('Category')}</th>
                    <th className="px-5 py-3">{t('Date')}</th>
                    <th className="px-5 py-3">{t('Judges')}</th>
                    <th className="px-5 py-3 text-center">{t('Participants')}</th>
                    <th className="px-5 py-3">{t('Awards / Outcomes')}</th>
                    <th className="px-5 py-3 text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filtered.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-extrabold text-slate-900 dark:text-white block text-sm">{record.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(record.category)}`}>
                          {t(record.category || '')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-semibold whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {record.judges || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold rounded-lg font-mono">
                          {record.participantsCount} {record.participantsCount === 1 ? t('Scholar') : t('Scholars')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {record.awards ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{record.awards}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('No award outcome')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setInspectItem(record)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                            title={t('Inspect Competition')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canModify && (
                            <>
                              <button
                                onClick={() => { setEditItem(record); setShowModal(true); }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                title={t('Edit Details')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                title={t('Delete Competition')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Competition Modal (Add/Edit) */}
      {showModal && (
        <CompetitionModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={loadCompetitions}
        />
      )}

      {/* Inspect Competition Drawer */}
      {inspectItem && (
        <InspectDrawer
          record={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}
    </div>
  );
}
