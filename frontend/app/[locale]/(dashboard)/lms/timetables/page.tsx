/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Calendar, Clock, MapPin, RefreshCw, Search, BookOpen, Users,
  Grid3X3, List, Trash2, Pencil, X, Building2, AlertTriangle,
  Filter, Download, CheckCircle2, User
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import qs from 'qs';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type ViewMode = 'week' | 'list';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

const SUBJECT_COLORS = [
  'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
  'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
  'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
  'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
  'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700',
];

interface TimetableSlot {
  id: number | string;
  documentId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  recordStatus: 'Active' | 'Cancelled' | 'Rescheduled';
  teacher: any;
  subject: any;
  section: any;
  classroom: any;
  campus: any;
  academicYear: any;
  academicTerm: any;
  courseOffering: any;
  subjectName: string;
  teacherName: string;
  sectionName: string;
  roomName: string;
  startMinutes: number;
  endMinutes: number;
  colorClass: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatTime(t: string): string {
  if (!t) return '';
  const parts = t.split(':');
  const h = parseInt(parts[0]);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const subjectColorMap = new Map<string, string>();
let colorIdx = 0;
function getSubjectColor(subjectId: string | number): string {
  const key = String(subjectId);
  if (!subjectColorMap.has(key)) {
    subjectColorMap.set(key, SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]);
    colorIdx++;
  }
  return subjectColorMap.get(key)!;
}

function mapSlot(item: any): TimetableSlot {
  const co = item.courseOffering;
  const subjectName = item.subject?.name || co?.subject?.name || 'No Subject';
  const subjectId = item.subject?.id || co?.subject?.id || item.id;
  const teacherRaw = item.teacher || co?.teacher;
  const teacherName = teacherRaw
    ? (teacherRaw.name || teacherRaw.displayName || `${teacherRaw.firstName || ''} ${teacherRaw.lastName || ''}`.trim())
    : 'Unassigned';
  const sectionName = item.section?.name || co?.academicSection?.name || 'All Sections';
  const roomName = item.classroom?.name || item.classroom?.code || '—';
  const startTime = item.startTime?.substring(0, 5) || '08:00';
  const endTime = item.endTime?.substring(0, 5) || '09:00';
  return {
    ...item,
    subjectName,
    teacherName,
    sectionName,
    roomName,
    startTime,
    endTime,
    startMinutes: timeToMinutes(startTime),
    endMinutes: timeToMinutes(endTime),
    colorClass: getSubjectColor(subjectId),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Slot Card
// ─────────────────────────────────────────────────────────────────────────────

function SlotCard({ slot, onEdit, onDelete, canModify }: {
  slot: TimetableSlot;
  onEdit: (s: TimetableSlot) => void;
  onDelete: (s: TimetableSlot) => void;
  canModify: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isCancelled = slot.recordStatus === 'Cancelled';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-xl border px-2.5 py-2 text-xs transition-all ${slot.colorClass} ${isCancelled ? 'opacity-50' : ''}`}
    >
      <div className={`font-extrabold truncate ${isCancelled ? 'line-through' : ''}`}>{slot.subjectName}</div>
      <div className="flex items-center gap-1 text-[10px] opacity-70 mt-0.5">
        <Clock className="w-2.5 h-2.5 shrink-0" />
        <span>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] opacity-70 mt-0.5">
        <User className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{slot.teacherName}</span>
      </div>
      {slot.roomName !== '—' && (
        <div className="flex items-center gap-1 text-[10px] opacity-60 mt-0.5">
          <Building2 className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{slot.roomName}</span>
        </div>
      )}
      {slot.sectionName && slot.sectionName !== 'All Sections' && (
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide opacity-50 truncate">
          {slot.sectionName}
        </span>
      )}
      {canModify && hovered && (
        <div className="absolute top-1 right-1 flex gap-1">
          <button onClick={() => onEdit(slot)} className="p-1 rounded-md bg-white/80 dark:bg-slate-900/80 text-indigo-600 cursor-pointer border-none shadow-xs">
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => onDelete(slot)} className="p-1 rounded-md bg-white/80 dark:bg-slate-900/80 text-rose-600 cursor-pointer border-none shadow-xs">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
      {slot.recordStatus !== 'Active' && (
        <span className="absolute bottom-1 right-1 text-[8px] font-extrabold uppercase opacity-70">{slot.recordStatus}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Modal
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleModal({ editItem, onClose, onSaved, sections, subjects, teachers, classrooms, campuses, academicYears, academicTerms, existingSlots }: {
  editItem: TimetableSlot | null;
  onClose: () => void;
  onSaved: () => void;
  sections: any[];
  subjects: any[];
  teachers: any[];
  classrooms: any[];
  campuses: any[];
  academicYears: any[];
  academicTerms: any[];
  existingSlots: TimetableSlot[];
}) {
  const isEdit = !!editItem;
  const [form, setForm] = useState({
    dayOfWeek: editItem?.dayOfWeek || 'Monday',
    startTime: editItem?.startTime || '08:00',
    endTime: editItem?.endTime || '08:45',
    durationMinutes: editItem?.durationMinutes || 45,
    recordStatus: (editItem?.recordStatus || 'Active') as string,
    section: editItem?.section?.documentId || String(editItem?.section?.id || ''),
    subject: editItem?.subject?.documentId || String(editItem?.subject?.id || ''),
    teacher: editItem?.teacher?.documentId || String(editItem?.teacher?.id || ''),
    classroom: editItem?.classroom?.documentId || String(editItem?.classroom?.id || ''),
    campus: editItem?.campus?.documentId || String(editItem?.campus?.id || ''),
    academicYear: editItem?.academicYear?.documentId || String(editItem?.academicYear?.id || ''),
    academicTerm: editItem?.academicTerm?.documentId || String(editItem?.academicTerm?.id || ''),
  });
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<TimetableSlot[]>([]);

  // Auto-calc duration
  useEffect(() => {
    if (form.startTime && form.endTime) {
      const diff = timeToMinutes(form.endTime) - timeToMinutes(form.startTime);
      if (diff > 0) setForm(f => ({ ...f, durationMinutes: diff }));
    }
  }, [form.startTime, form.endTime]);

  // Conflict detection
  useEffect(() => {
    const sMin = timeToMinutes(form.startTime);
    const eMin = timeToMinutes(form.endTime);
    const day = form.dayOfWeek;
    const conflicted = existingSlots.filter(s => {
      if (s.dayOfWeek !== day) return false;
      if (isEdit && (s.documentId === editItem?.documentId || s.id === editItem?.id)) return false;
      const sameTeacher = form.teacher && (s.teacher?.documentId === form.teacher || String(s.teacher?.id) === form.teacher);
      const sameRoom = form.classroom && (s.classroom?.documentId === form.classroom || String(s.classroom?.id) === form.classroom);
      if (!sameTeacher && !sameRoom) return false;
      return sMin < s.endMinutes && eMin > s.startMinutes;
    });
    setConflicts(conflicted);
  }, [form.dayOfWeek, form.startTime, form.endTime, form.teacher, form.classroom, existingSlots, editItem, isEdit]);

  const inp = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        dayOfWeek: form.dayOfWeek,
        startTime: `${form.startTime}:00.000`,
        endTime: `${form.endTime}:00.000`,
        durationMinutes: form.durationMinutes,
        recordStatus: form.recordStatus,
      };
      if (form.section) payload.section = form.section;
      if (form.subject) payload.subject = form.subject;
      if (form.teacher) payload.teacher = form.teacher;
      if (form.classroom) payload.classroom = form.classroom;
      if (form.campus) payload.campus = form.campus;
      if (form.academicYear) payload.academicYear = form.academicYear;
      if (form.academicTerm) payload.academicTerm = form.academicTerm;

      if (isEdit) {
        await apiClient.put(`/timetable-slots/${editItem!.documentId || editItem!.id}`, { data: payload });
        toast.success('Session updated successfully');
      } else {
        await apiClient.post('/timetable-slots', { data: payload });
        toast.success('Session scheduled successfully');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {isEdit ? 'Edit Class Session' : 'Schedule New Session'}
              </h2>
              <p className="text-[11px] text-slate-400">Assign subject, faculty, room, and time slot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict warning */}
        {conflicts.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Scheduling Conflict Detected</p>
              {conflicts.map(c => (
                <p key={c.id} className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  {c.subjectName} ({c.teacherName}) — {formatTime(c.startTime)} to {formatTime(c.endTime)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Section</label>
              <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className={inp}>
                <option value="">— All Sections —</option>
                {sections.map(s => <option key={s.id} value={s.documentId || s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subject *</label>
              <select required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className={inp}>
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.documentId || s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty / Teacher</label>
              <select value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} className={inp}>
                <option value="">— Select Teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.documentId || t.id}>{t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim()}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Classroom</label>
              <select value={form.classroom} onChange={e => setForm(f => ({ ...f, classroom: e.target.value }))} className={inp}>
                <option value="">— No Room —</option>
                {classrooms.map(c => <option key={c.id} value={c.documentId || c.id}>{c.name} ({c.code}) — Cap: {c.capacity}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Day *</label>
              <select required value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value as DayOfWeek }))} className={inp}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Start Time *</label>
              <input required type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">End Time *</label>
              <input required type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={inp} />
            </div>
          </div>
          {form.durationMinutes > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-semibold">
                Duration: <strong className="text-indigo-600">{form.durationMinutes} minutes</strong>
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Academic Year</label>
              <select value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} className={inp}>
                <option value="">— Select Year —</option>
                {academicYears.map(y => <option key={y.id} value={y.documentId || y.id}>{y.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Academic Term</label>
              <select value={form.academicTerm} onChange={e => setForm(f => ({ ...f, academicTerm: e.target.value }))} className={inp}>
                <option value="">— Select Term —</option>
                {academicTerms.map(t => <option key={t.id} value={t.documentId || t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Campus</label>
              <select value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))} className={inp}>
                <option value="">— Select Campus —</option>
                {campuses.map(c => <option key={c.id} value={c.documentId || c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</label>
              <select value={form.recordStatus} onChange={e => setForm(f => ({ ...f, recordStatus: e.target.value }))} className={inp}>
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>

          {/* Footer buttons inside form so native submit works */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl cursor-pointer border-none transition-colors">
              Cancel
            </button>
            {conflicts.length > 0 && (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {conflicts.length} conflict(s)
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-none transition-colors disabled:opacity-60"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : (isEdit ? 'Update Session' : 'Schedule Session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function TimetablesPage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null);
  const [query, setQuery] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs.stringify({
        populate: ['teacher', 'subject', 'classroom', 'section', 'academicYear', 'academicTerm', 'campus',
          'courseOffering.subject', 'courseOffering.teacher', 'courseOffering.academicSection', 'courseOffering.gradeLevel'],
        pagination: { limit: 500 },
        sort: ['dayOfWeek:asc', 'startTime:asc'],
      }, { encodeValuesOnly: true });
      const res = await apiClient.get(`/timetable-slots?${q}`);
      setSlots((res.data?.data || []).map(mapSlot));
    } catch {
      toast.error('Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [secRes, subRes, tchRes, clsRes, camRes, yrRes, tmRes] = await Promise.all([
        apiClient.get('/sections?pagination[limit]=200&sort=name:asc'),
        apiClient.get('/subjects?pagination[limit]=200&sort=name:asc'),
        apiClient.get('/teachers?pagination[limit]=200&sort=name:asc'),
        apiClient.get('/classrooms?pagination[limit]=100&sort=name:asc'),
        apiClient.get('/campuses?pagination[limit]=50'),
        apiClient.get('/academic-years?pagination[limit]=20&sort=createdAt:desc'),
        apiClient.get('/academic-terms?pagination[limit]=50&sort=startDate:desc'),
      ]);
      setSections(secRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
      setTeachers(tchRes.data?.data || []);
      setClassrooms(clsRes.data?.data || []);
      setCampuses(camRes.data?.data || []);
      setAcademicYears(yrRes.data?.data || []);
      setAcademicTerms(tmRes.data?.data || []);
    } catch (e) {
      console.warn('Could not load options', e);
    }
  }, []);

  useEffect(() => {
    loadSlots();
    loadOptions();
  }, [loadSlots, loadOptions]);

  const filtered = useMemo(() => {
    let s = slots;
    if (filterSection) s = s.filter(x => String(x.section?.id) === filterSection || x.section?.documentId === filterSection);
    if (filterTeacher) s = s.filter(x => String(x.teacher?.id) === filterTeacher || x.teacher?.documentId === filterTeacher);
    if (filterTerm) s = s.filter(x => String(x.academicTerm?.id) === filterTerm || x.academicTerm?.documentId === filterTerm);
    if (filterDay) s = s.filter(x => x.dayOfWeek === filterDay);
    if (query) {
      const q = query.toLowerCase();
      s = s.filter(x =>
        x.subjectName.toLowerCase().includes(q) ||
        x.teacherName.toLowerCase().includes(q) ||
        x.sectionName.toLowerCase().includes(q) ||
        x.roomName.toLowerCase().includes(q) ||
        x.dayOfWeek.toLowerCase().includes(q)
      );
    }
    return s;
  }, [slots, filterSection, filterTeacher, filterTerm, filterDay, query]);

  const slotsByDay = useMemo(() => {
    const m: Record<DayOfWeek, TimetableSlot[]> = {} as any;
    DAYS.forEach(d => { m[d] = []; });
    filtered.forEach(s => { if (m[s.dayOfWeek]) m[s.dayOfWeek].push(s); });
    DAYS.forEach(d => m[d].sort((a, b) => a.startMinutes - b.startMinutes));
    return m;
  }, [filtered]);

  const handleDelete = async (slot: TimetableSlot) => {
    if (!confirm(`Delete "${slot.subjectName}" on ${slot.dayOfWeek} at ${formatTime(slot.startTime)}?`)) return;
    try {
      await apiClient.delete(`/timetable-slots/${slot.documentId || slot.id}`);
      toast.success('Session removed from schedule');
      loadSlots();
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const openEdit = (slot: TimetableSlot) => {
    setEditSlot(slot);
    setShowModal(true);
  };

  const stats = useMemo(() => ({
    total: slots.length,
    active: slots.filter(s => s.recordStatus === 'Active').length,
    cancelled: slots.filter(s => s.recordStatus === 'Cancelled').length,
    uniqueSubjects: new Set(slots.map(s => s.subjectName)).size,
    uniqueTeachers: new Set(slots.map(s => s.teacherName)).size,
  }), [slots]);

  const exportCSV = () => {
    const rows = [
      ['Day', 'Start', 'End', 'Duration (min)', 'Subject', 'Teacher', 'Section', 'Room', 'Status'],
      ...filtered.map(s => [s.dayOfWeek, s.startTime, s.endTime, s.durationMinutes, s.subjectName, s.teacherName, s.sectionName, s.roomName, s.recordStatus])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canModify = true;
  const sel = 'px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 space-y-5">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200 dark:shadow-indigo-950">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Class Timetable</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
            Schedule and manage academic sessions across all sections and faculty members.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadSlots} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {canModify && (
            <button onClick={() => { setEditSlot(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-950 cursor-pointer border-none transition-colors">
              <Plus className="w-4 h-4" />
              Schedule Session
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Sessions', value: stats.total, icon: <Calendar className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
          { label: 'Active', value: stats.active, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Cancelled', value: stats.cancelled, icon: <X className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Subjects', value: stats.uniqueSubjects, icon: <BookOpen className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Faculty', value: stats.uniqueTeachers, icon: <Users className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50 dark:bg-sky-950/30' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800 ${s.bg} flex items-center gap-3`}>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by subject, teacher, section, or room..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {[filterSection, filterTeacher, filterTerm, filterDay].filter(Boolean).length > 0 && (
            <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {[filterSection, filterTeacher, filterTerm, filterDay].filter(Boolean).length}
            </span>
          )}
        </button>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
          {([['week', <Grid3X3 key="w" className="w-3.5 h-3.5" />, 'Week'], ['list', <List key="l" className="w-3.5 h-3.5" />, 'List']] as [ViewMode, React.ReactNode, string][]).map(([mode, icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={sel}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.documentId || s.id}>{s.name}</option>)}
          </select>
          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className={sel}>
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t.id} value={t.documentId || t.id}>{t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim()}</option>)}
          </select>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className={sel}>
            <option value="">All Terms</option>
            {academicTerms.map(t => <option key={t.id} value={t.documentId || t.id}>{t.name}</option>)}
          </select>
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className={sel}>
            <option value="">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {[filterSection, filterTeacher, filterTerm, filterDay].some(Boolean) && (
            <button onClick={() => { setFilterSection(''); setFilterTeacher(''); setFilterTerm(''); setFilterDay(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <span className="text-[11px] text-slate-400 ml-auto font-semibold">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map(d => (
            <div key={d} className="space-y-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Week Grid */}
      {!loading && viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {DAYS.map(day => {
              const count = slotsByDay[day].length;
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
              return (
                <div key={day} className={`px-3 py-3 border-r last:border-r-0 border-slate-100 dark:border-slate-800 text-center ${isToday ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}`}>
                  <p className={`text-[11px] font-extrabold uppercase tracking-wider ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {DAY_SHORT[day]}
                  </p>
                  {count > 0 && (
                    <span className={`mt-1 inline-block text-[9px] font-bold rounded-full px-1.5 py-0.5 ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Day Columns */}
          <div className="grid grid-cols-7 min-h-[520px]">
            {DAYS.map(day => (
              <div key={day} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800 p-2 space-y-2">
                {slotsByDay[day].length === 0 ? (
                  <div className="h-full min-h-[120px] flex items-center justify-center py-8">
                    <p className="text-[10px] text-slate-200 dark:text-slate-700 font-semibold text-center">No sessions</p>
                  </div>
                ) : (
                  slotsByDay[day].map(slot => (
                    <SlotCard key={slot.id} slot={slot} onEdit={openEdit} onDelete={handleDelete} canModify={canModify} />
                  ))
                )}
                {canModify && (
                  <button
                    onClick={() => { setEditSlot(null); setShowModal(true); }}
                    className="w-full py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-700 text-[10px] font-bold hover:border-indigo-300 hover:text-indigo-400 cursor-pointer bg-transparent transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-400 dark:text-slate-600">No sessions match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="grid grid-cols-8 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span className="col-span-2">Subject / Section</span>
                <span>Day</span>
                <span>Time Slot</span>
                <span>Teacher</span>
                <span>Room</span>
                <span>Term</span>
                <span>Status</span>
              </div>
              {filtered.map(slot => (
                <div key={slot.id} className="grid grid-cols-8 px-5 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group text-xs">
                  <div className="col-span-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${slot.colorClass} mb-1`}>
                      {slot.subjectName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{slot.sectionName}</p>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{slot.dayOfWeek}</span>
                  <div>
                    <div className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-3 h-3" />
                      {formatTime(slot.startTime)}
                    </div>
                    <div className="text-[10px] text-slate-400">→ {formatTime(slot.endTime)} ({slot.durationMinutes}m)</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{slot.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{slot.roomName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <div>{slot.academicTerm?.name || '—'}</div>
                    <div className="text-[9px] opacity-70">{slot.academicYear?.name || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      slot.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      slot.recordStatus === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>{slot.recordStatus}</span>
                    {canModify && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(slot)} className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 cursor-pointer border-none bg-transparent">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(slot)} className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 cursor-pointer border-none bg-transparent">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && slots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">No Timetable Sessions Yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-600 mt-1 max-w-sm">
            Start by clicking <strong>Schedule Session</strong> to add class sessions to the timetable.
          </p>
          {canModify && (
            <button onClick={() => setShowModal(true)} className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl cursor-pointer border-none shadow-md">
              <Plus className="w-4 h-4" /> Schedule First Session
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          editItem={editSlot}
          onClose={() => { setShowModal(false); setEditSlot(null); }}
          onSaved={loadSlots}
          sections={sections}
          subjects={subjects}
          teachers={teachers}
          classrooms={classrooms}
          campuses={campuses}
          academicYears={academicYears}
          academicTerms={academicTerms}
          existingSlots={slots}
        />
      )}
    </div>
  );
}
