/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Calendar, Clock, Search, BookOpen, Users,
  Trash2, Pencil, X, Building2, AlertTriangle,
  Filter, Download, CheckCircle2, User, Eye, BarChart3, TrendingUp, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import qs from 'qs';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface PlacementRecord {
  id: number | string;
  documentId: string;
  language: 'Arabic' | 'English';
  readingScore?: number;
  writingScore?: number;
  listeningScore?: number;
  speakingScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  overallScore?: number;
  recommendedLevel?: string;
  teacherNotes?: string;
  dateTaken: string;
  student?: any;
  teacher?: any;
  // mapped properties
  studentName: string;
  studentSchoolId: string;
  studentPhoto?: string;
  teacherName: string;
}

const PRESET_LEVELS = {
  Arabic: [
    'Arabic A1 (Beginner)',
    'Arabic A2 (Elementary)',
    'Arabic B1 (Intermediate)',
    'Arabic B2 (Upper Intermediate)',
    'Arabic C1 (Advanced)',
    'Arabic C2 (Mastery)'
  ],
  English: [
    'English A1 (Beginner)',
    'English A2 (Elementary)',
    'English B1 (Intermediate)',
    'English B2 (Upper Intermediate)',
    'English C1 (Advanced)',
    'English C2 (Mastery)'
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
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

function mapPlacementRecord(item: any): PlacementRecord {
  const s = item.student;
  const t = item.teacher;
  
  const studentName = s
    ? (s.name || s.fullName || [s.firstName, s.lastName].filter(Boolean).join(' ') || `Student #${s.id}`)
    : 'Unknown Student';
  
  const studentSchoolId = s?.schoolId || s?.studentId || '—';
  
  const rawPhoto = s?.photoUrl || s?.photo?.url || s?.avatarUrl;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
  const studentPhoto = rawPhoto 
    ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`)
    : undefined;

  const teacherName = t
    ? (t.name || t.displayName || [t.firstName, t.lastName].filter(Boolean).join(' ') || `Teacher #${t.id}`)
    : 'Unassigned Assessor';

  return {
    ...item,
    studentName,
    studentSchoolId,
    studentPhoto,
    teacherName
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Color Pill Helper
// ─────────────────────────────────────────────────────────────────────────────

function getScorePill(score?: number): string {
  if (score === undefined || score === null) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
  if (score >= 60) return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800';
  if (score >= 40) return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
  return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800';
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills List config
// ─────────────────────────────────────────────────────────────────────────────

const SKILLS_CONFIG = [
  { key: 'grammarScore', label: 'Grammar' },
  { key: 'vocabularyScore', label: 'Vocabulary' },
  { key: 'readingScore', label: 'Reading' },
  { key: 'writingScore', label: 'Writing' },
  { key: 'listeningScore', label: 'Listening' },
  { key: 'speakingScore', label: 'Speaking' }
];

// ─────────────────────────────────────────────────────────────────────────────
// Modal Dialog: Add/Edit Placement
// ─────────────────────────────────────────────────────────────────────────────

function PlacementModal({
  editItem,
  onClose,
  onSaved,
  teachers,
  existingSlots
}: {
  editItem: PlacementRecord | null;
  onClose: () => void;
  onSaved: () => void;
  teachers: any[];
  existingSlots: PlacementRecord[];
}) {
  const isEdit = !!editItem;
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [form, setForm] = useState({
    student: editItem?.student?.documentId || String(editItem?.student?.id || ''),
    teacher: editItem?.teacher?.documentId || String(editItem?.teacher?.id || ''),
    language: editItem?.language || 'English',
    dateTaken: editItem?.dateTaken || new Date().toISOString().split('T')[0],
    grammarScore: editItem?.grammarScore !== undefined ? String(editItem.grammarScore) : '',
    vocabularyScore: editItem?.vocabularyScore !== undefined ? String(editItem.vocabularyScore) : '',
    readingScore: editItem?.readingScore !== undefined ? String(editItem.readingScore) : '',
    writingScore: editItem?.writingScore !== undefined ? String(editItem.writingScore) : '',
    listeningScore: editItem?.listeningScore !== undefined ? String(editItem.listeningScore) : '',
    speakingScore: editItem?.speakingScore !== undefined ? String(editItem.speakingScore) : '',
    recommendedLevel: editItem?.recommendedLevel || '',
    teacherNotes: editItem?.teacherNotes || ''
  });

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch active students for dropdown
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

  // Compute overall score dynamically based on sub-scores
  const computedOverall = useMemo(() => {
    const scores = [
      form.grammarScore,
      form.vocabularyScore,
      form.readingScore,
      form.writingScore,
      form.listeningScore,
      form.speakingScore
    ].map(s => parseFloat(s)).filter(s => !isNaN(s));
    
    if (scores.length === 0) return 0;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(avg * 10) / 10;
  }, [
    form.grammarScore,
    form.vocabularyScore,
    form.readingScore,
    form.writingScore,
    form.listeningScore,
    form.speakingScore
  ]);

  const levelsList = form.language === 'Arabic' ? PRESET_LEVELS.Arabic : PRESET_LEVELS.English;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student) {
      toast.error(t('Please select a student'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        language: form.language,
        dateTaken: form.dateTaken,
        grammarScore: form.grammarScore ? parseFloat(form.grammarScore) : null,
        vocabularyScore: form.vocabularyScore ? parseFloat(form.vocabularyScore) : null,
        readingScore: form.readingScore ? parseFloat(form.readingScore) : null,
        writingScore: form.writingScore ? parseFloat(form.writingScore) : null,
        listeningScore: form.listeningScore ? parseFloat(form.listeningScore) : null,
        speakingScore: form.speakingScore ? parseFloat(form.speakingScore) : null,
        overallScore: computedOverall,
        recommendedLevel: form.recommendedLevel,
        teacherNotes: form.teacherNotes,
        student: form.student,
        teacher: form.teacher || null
      };

      if (isEdit) {
        await apiClient.put(`/placement-tests/${editItem!.documentId || editItem!.id}`, { data: payload });
        toast.success(t('Placement test updated successfully'));
      } else {
        await apiClient.post('/placement-tests', { data: payload });
        toast.success(t('Placement test recorded successfully'));
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || t('Failed to save placement test'));
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
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {isEdit ? t('Edit Placement Test Record') : t('Record New Placement Test')}
              </h2>
              <p className="text-[11px] text-slate-400">{t('Save test sub-scores and recommended placement level')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Student *')}</label>
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
              <label className={labelClass}>{t('Language Track *')}</label>
              <select
                required
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value as 'Arabic' | 'English' }))}
                className={inpClass}
              >
                <option value="English">{t('English')}</option>
                <option value="Arabic">{t('Arabic')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Teacher / Assessor')}</label>
              <select
                value={form.teacher}
                onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                className={inpClass}
              >
                <option value="">{t('— Select Assessor —')}</option>
                {teachers.map(tOption => (
                  <option key={tOption.id} value={tOption.documentId || tOption.id}>
                    {tOption.name || tOption.displayName || [tOption.firstName, tOption.lastName].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Date Taken *')}</label>
              <input
                required
                type="date"
                value={form.dateTaken}
                onChange={e => setForm(f => ({ ...f, dateTaken: e.target.value }))}
                className={inpClass}
              />
            </div>
          </div>

          {/* Scores Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 space-y-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-300">{t('Skill Sub-Scores (0 to 100)')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'grammarScore', label: 'Grammar' },
                { key: 'vocabularyScore', label: 'Vocabulary' },
                { key: 'readingScore', label: 'Reading' },
                { key: 'writingScore', label: 'Writing' },
                { key: 'listeningScore', label: 'Listening' },
                { key: 'speakingScore', label: 'Speaking' }
              ].map(s => (
                <div key={s.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">{t(s.label)}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="—"
                    value={(form as any)[s.key]}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, [s.key]: val }));
                    }}
                    className={inpClass}
                  />
                </div>
              ))}
            </div>

            {/* Calculated Overall Score */}
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500">{t('Auto-Calculated Overall Score:')}</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${getScorePill(computedOverall)}`}>
                {computedOverall} / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{t('Recommended Language Level')}</label>
            <div className="relative">
              <input
                type="text"
                list="levels-presets"
                placeholder={t('Choose standard level or type custom program track...')}
                value={form.recommendedLevel}
                onChange={e => setForm(f => ({ ...f, recommendedLevel: e.target.value }))}
                className={inpClass}
              />
              <datalist id="levels-presets">
                {levelsList.map(lvl => <option key={lvl} value={lvl} />)}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{t('Teacher Notes / Assessment Details')}</label>
            <textarea
              placeholder={t('Record observations, specific weaknesses, oral fluency notes, etc...')}
              value={form.teacherNotes}
              onChange={e => setForm(f => ({ ...f, teacherNotes: e.target.value }))}
              rows={3}
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
              {saving ? t('Saving...') : (isEdit ? t('Update Placement') : t('Record Placement'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer: Inspect Placement Test Details
// ─────────────────────────────────────────────────────────────────────────────

function InspectDrawer({
  record,
  onClose
}: {
  record: PlacementRecord;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{t('Placement Test Details')}</h3>
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
            <span className="mt-1 inline-block text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400">
              {t(record.language)} {t('Program')}
            </span>
          </div>
        </div>

        {/* Global Level Recommendation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t('Recommended Level')}</p>
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate px-1">
              {record.recommendedLevel || t('Not Set')}
            </p>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t('Overall Test Score')}</p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {record.overallScore || '—'} / 100
            </p>
          </div>
        </div>

        {/* Skill Breakdown Chart */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('Language Dimension Scores')}</h4>
          <div className="space-y-3.5">
            {SKILLS_CONFIG.map(skill => {
              const score = (record as any)[skill.key] || 0;
              let barColor = 'bg-rose-500';
              if (score >= 80) barColor = 'bg-emerald-500';
              else if (score >= 60) barColor = 'bg-indigo-500';
              else if (score >= 40) barColor = 'bg-amber-500';

              return (
                <div key={skill.key} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{t(skill.label)}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{score} / 100</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all duration-300`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test details list */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">{t('Assessor')}</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{record.teacherName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">{t('Date Completed')}</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{formatDate(record.dateTaken)}</span>
          </div>
        </div>

        {/* Teacher Notes */}
        {record.teacherNotes && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1.5">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('Teacher Observation Notes')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl italic border border-slate-100 dark:border-slate-800">
              "{record.teacherNotes}"
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

export default function PlacementTestingPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PlacementRecord | null>(null);
  const [inspectItem, setInspectItem] = useState<PlacementRecord | null>(null);

  const [query, setQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);

  // Get current user role permissions
  const { userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher';

  // Load records
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs.stringify({
        populate: ['student', 'student.photo', 'teacher'],
        pagination: { limit: 500 },
        sort: ['dateTaken:desc', 'createdAt:desc']
      }, { encodeValuesOnly: true });

      const res = await apiClient.get(`/placement-tests?${q}`);
      setRecords((res.data?.data || []).map(mapPlacementRecord));
    } catch (err) {
      toast.error(t('Failed to load placement test logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load assessors/teachers list
  const loadAssessors = useCallback(async () => {
    try {
      const res = await apiClient.get('/teachers?pagination[limit]=200&sort=name:asc');
      setTeachers(res.data?.data || []);
    } catch (e) {
      console.warn('Failed to load assessors:', e);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadAssessors();
  }, [loadRecords, loadAssessors]);

  // Handle delete record
  const handleDelete = async (record: PlacementRecord) => {
    if (!confirm(t('Are you sure you want to delete the placement test for') + ` ${record.studentName}?`)) return;
    try {
      await apiClient.delete(`/placement-tests/${record.documentId || record.id}`);
      toast.success(t('Placement test log removed'));
      loadRecords();
    } catch {
      toast.error(t('Failed to delete placement test'));
    }
  };

  // Filtered records
  const filtered = useMemo(() => {
    let list = records;
    if (filterLanguage) {
      list = list.filter(r => r.language === filterLanguage);
    }
    if (filterLevel) {
      list = list.filter(r => r.recommendedLevel?.toLowerCase().includes(filterLevel.toLowerCase()));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(r => 
        r.studentName.toLowerCase().includes(q) ||
        r.studentSchoolId.toLowerCase().includes(q) ||
        r.teacherName.toLowerCase().includes(q) ||
        (r.recommendedLevel || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterLanguage, filterLevel, query]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = records.length;
    const arabic = records.filter(r => r.language === 'Arabic').length;
    const english = records.filter(r => r.language === 'English').length;
    
    // Average overall score
    const scored = records.filter(r => r.overallScore !== undefined && r.overallScore !== null);
    const avgScore = scored.length > 0 
      ? Math.round(scored.reduce((sum, r) => sum + (r.overallScore || 0), 0) / scored.length * 10) / 10
      : 0;

    // Advanced Level placements count (CEFR B2, C1, C2)
    const advanced = records.filter(r => {
      const lvl = (r.recommendedLevel || '').toUpperCase();
      return lvl.includes('B2') || lvl.includes('C1') || lvl.includes('C2');
    }).length;

    return { total, arabic, english, avgScore, advanced };
  }, [records]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Language Track', 'Grammar', 'Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking', 'Overall Score', 'Recommended Level', 'Assessor', 'Date Taken'];
    const rows = filtered.map(r => [
      r.studentSchoolId,
      r.studentName,
      r.language,
      r.grammarScore || '',
      r.vocabularyScore || '',
      r.readingScore || '',
      r.writingScore || '',
      r.listeningScore || '',
      r.speakingScore || '',
      r.overallScore || '',
      r.recommendedLevel || '',
      r.teacherName,
      r.dateTaken
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placement_tests_${new Date().toISOString().split('T')[0]}.csv`;
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
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{t('Placement Testing')}</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
            {t('Evaluate new students, record sub-scores, and assign appropriate Arabic/English program tracks.')}
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
              {t('Record Test Result')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: t('Total Placements'), value: stats.total, icon: <Users className="w-4 h-4 text-indigo-655" />, bg: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/20' },
          { label: t('Avg Overall Score'), value: `${stats.avgScore}%`, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20' },
          { label: t('English Track'), value: stats.english, icon: <BookOpen className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/20' },
          { label: t('Arabic Track'), value: stats.arabic, icon: <BookOpen className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20' },
          { label: t('Advanced Levels'), value: stats.advanced, icon: <CheckCircle2 className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/20' }
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
            placeholder={t('Search by student name, ID, level, or teacher assessor...')}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('Filters')}
          {[filterLanguage, filterLevel].filter(Boolean).length > 0 && (
            <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {[filterLanguage, filterLevel].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} className={selClass}>
            <option value="">{t('All Language Tracks')}</option>
            <option value="English">{t('English')}</option>
            <option value="Arabic">{t('Arabic')}</option>
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={selClass}>
            <option value="">{t('All Levels')}</option>
            <option value="A1">{t('A1 (Beginner)')}</option>
            <option value="A2">{t('A2 (Elementary)')}</option>
            <option value="B1">{t('B1 (Intermediate)')}</option>
            <option value="B2">{t('B2 (Upper Intermediate)')}</option>
            <option value="C1">{t('C1 (Advanced)')}</option>
            <option value="C2">{t('C2 (Mastery)')}</option>
          </select>
          {[filterLanguage, filterLevel].some(Boolean) && (
            <button
              onClick={() => { setFilterLanguage(''); setFilterLevel(''); }}
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

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Placements Log Data Table */}
      {!loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-500" />
              </div>
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">{t('No Placement Records')}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1 max-w-sm">
                {t('No testing records matching filter criteria. Record a new placement test above.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">{t('Scholar')}</th>
                    <th className="px-5 py-3">{t('Date Taken')}</th>
                    <th className="px-5 py-3">{t('Track')}</th>
                    <th className="px-5 py-3">{t('Skills Sub-Scores')}</th>
                    <th className="px-5 py-3 text-center">{t('Overall')}</th>
                    <th className="px-5 py-3">{t('Placement level')}</th>
                    <th className="px-5 py-3">{t('Assessor')}</th>
                    <th className="px-5 py-3 text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filtered.map(record => (
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
                        {formatDate(record.dateTaken)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          record.language === 'Arabic' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                            : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900'
                        }`}>
                          {t(record.language)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-slate-500 whitespace-nowrap">
                        <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 max-w-[200px] font-mono">
                          <span>{t('Gr:')} <strong>{record.grammarScore ?? '—'}</strong></span>
                          <span>{t('Vc:')} <strong>{record.vocabularyScore ?? '—'}</strong></span>
                          <span>{t('Rd:')} <strong>{record.readingScore ?? '—'}</strong></span>
                          <span>{t('Wr:')} <strong>{record.writingScore ?? '—'}</strong></span>
                          <span>{t('Ls:')} <strong>{record.listeningScore ?? '—'}</strong></span>
                          <span>{t('Sp:')} <strong>{record.speakingScore ?? '—'}</strong></span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono ${getScorePill(record.overallScore)}`}>
                          {record.overallScore}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                        {record.recommendedLevel || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 truncate max-w-[140px]">
                        {record.teacherName}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setInspectItem(record)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                            title={t('Inspect Test Scores')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canModify && (
                            <>
                              <button
                                onClick={() => { setEditItem(record); setShowModal(true); }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                title={t('Edit Result')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-transparent"
                                title={t('Delete Result')}
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

      {/* Record Placement Modal */}
      {showModal && (
        <PlacementModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={loadRecords}
          teachers={teachers}
          existingSlots={records}
        />
      )}

      {/* Inspect Test Details Drawer */}
      {inspectItem && (
        <InspectDrawer
          record={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}
    </div>
  );
}
