/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Users, Plus, X, Edit2, Trash2,
  RefreshCw, Search, Filter, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Download, Printer, Eye,
  BookOpen, GraduationCap, Building, Bell, Send,
  BarChart2, AlarmCheck, ListChecks, Layers
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { assessmentService } from '@/services/assessment.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed';
type ViewMode = 'calendar' | 'list' | 'timeline';

interface ExamRoom {
  id: number | string;
  name: string;
  capacity: number;
  building: string;
  floor: string;
}

interface ScheduledExam {
  id: number | string;
  title: string;
  subject: string;
  section: string;
  level: string;         // e.g. SS1, JSS3
  date: string;          // ISO YYYY-MM-DD
  startTime: string;     // HH:MM 24h
  endTime: string;
  durationMinutes: number;
  room: string;
  roomId?: number | string;
  invigilators: string[];
  maxCandidates: number;
  enrolledCount: number;
  status: ScheduleStatus;
  examSession: string;
  term: string;
  notes?: string;
  color?: string;
}

interface ExamConflict {
  type: 'room' | 'section' | 'invigilator';
  message: string;
  exams: (number | string)[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_ROOMS: ExamRoom[] = [
  { id: 1, name: 'Main Hall A',        capacity: 120, building: 'Academic Block', floor: 'Ground' },
  { id: 2, name: 'Main Hall B',        capacity: 80,  building: 'Academic Block', floor: 'Ground' },
  { id: 3, name: 'Lecture Room 101',   capacity: 40,  building: 'Science Wing',   floor: '1st'    },
  { id: 4, name: 'Lecture Room 102',   capacity: 40,  building: 'Science Wing',   floor: '1st'    },
  { id: 5, name: 'Computer Lab',       capacity: 30,  building: 'ICT Block',      floor: 'Ground' },
  { id: 6, name: 'Multipurpose Hall',  capacity: 200, building: 'Admin Block',    floor: 'Ground' },
];

const MOCK_INVIGILATORS = [
  'Ustaz Ibrahim Al-Amin', 'Dr. Fatima Kamara', 'Mr. Emmanuel Kofi',
  'Mrs. Amina Jalloh', 'Prof. Yusuf Bah', 'Ms. Hawa Conteh',
  'Mr. Samuel Doe', 'Dr. Musa Sesay',
];

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':    'bg-sky-500/20 border-sky-600 text-sky-300',
  'Physics':        'bg-violet-500/20 border-violet-600 text-violet-300',
  'Chemistry':      'bg-emerald-500/20 border-emerald-600 text-emerald-300',
  'Biology':        'bg-teal-500/20 border-teal-600 text-teal-300',
  'English':        'bg-amber-500/20 border-amber-600 text-amber-300',
  'Islamic Studies': 'bg-rose-500/20 border-rose-600 text-rose-300',
  "Qur'an":         'bg-orange-500/20 border-orange-600 text-orange-300',
  'Social Studies': 'bg-indigo-500/20 border-indigo-600 text-indigo-300',
};

const getSubjectColor = (subject: string) =>
  SUBJECT_COLORS[subject] ?? 'bg-slate-700/40 border-slate-600 text-slate-300';

const STATUS_CONFIG: Record<ScheduleStatus, { color: string; dot: string }> = {
  Scheduled:  { color: 'bg-sky-950/60 text-sky-400 border-sky-800',       dot: 'bg-sky-400'     },
  InProgress: { color: 'bg-amber-950/60 text-amber-400 border-amber-800', dot: 'bg-amber-400 animate-pulse' },
  Completed:  { color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800', dot: 'bg-emerald-400' },
  Cancelled:  { color: 'bg-slate-800 text-slate-500 border-slate-700',    dot: 'bg-slate-500'   },
  Postponed:  { color: 'bg-rose-950/60 text-rose-400 border-rose-800',    dot: 'bg-rose-400'    },
};

const MOCK_SCHEDULES: ScheduledExam[] = [
  {
    id: 1, title: 'Mathematics — First Term Final',
    subject: 'Mathematics', section: 'SS3-A', level: 'SS3',
    date: '2026-08-25', startTime: '08:00', endTime: '10:00', durationMinutes: 120,
    room: 'Main Hall A', roomId: 1, invigilators: ['Ustaz Ibrahim Al-Amin', 'Mrs. Amina Jalloh'],
    maxCandidates: 120, enrolledCount: 87, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Mathematics'),
  },
  {
    id: 2, title: "English Language — First Term Final",
    subject: 'English', section: 'SS2-B', level: 'SS2',
    date: '2026-08-25', startTime: '11:00', endTime: '13:00', durationMinutes: 120,
    room: 'Main Hall B', roomId: 2, invigilators: ['Dr. Fatima Kamara'],
    maxCandidates: 80, enrolledCount: 62, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('English'),
  },
  {
    id: 3, title: 'Physics — First Term Final',
    subject: 'Physics', section: 'SS3-B', level: 'SS3',
    date: '2026-08-26', startTime: '08:00', endTime: '10:30', durationMinutes: 150,
    room: 'Lecture Room 101', roomId: 3, invigilators: ['Prof. Yusuf Bah'],
    maxCandidates: 40, enrolledCount: 34, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Physics'),
  },
  {
    id: 4, title: 'Chemistry — First Term Final',
    subject: 'Chemistry', section: 'SS3-A', level: 'SS3',
    date: '2026-08-26', startTime: '11:30', endTime: '14:00', durationMinutes: 150,
    room: 'Lecture Room 102', roomId: 4, invigilators: ['Mr. Emmanuel Kofi', 'Ms. Hawa Conteh'],
    maxCandidates: 40, enrolledCount: 38, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Chemistry'),
  },
  {
    id: 5, title: "Islamic Studies — First Term Final",
    subject: 'Islamic Studies', section: 'JSS3-A', level: 'JSS3',
    date: '2026-08-27', startTime: '08:00', endTime: '09:30', durationMinutes: 90,
    room: 'Multipurpose Hall', roomId: 6, invigilators: ['Ustaz Ibrahim Al-Amin'],
    maxCandidates: 200, enrolledCount: 142, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Islamic Studies'),
  },
  {
    id: 6, title: "Qur'an Memorisation Assessment",
    subject: "Qur'an", section: 'Hifz-Circle-1', level: 'Hifz',
    date: '2026-08-28', startTime: '07:30', endTime: '12:00', durationMinutes: 270,
    room: 'Main Hall A', roomId: 1, invigilators: ['Ustaz Ibrahim Al-Amin', 'Prof. Yusuf Bah'],
    maxCandidates: 120, enrolledCount: 55, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor("Qur'an"),
    notes: 'Oral memorisation assessment — seating must allow private recitation booths.',
  },
  {
    id: 7, title: 'Biology — Mid-Term CA',
    subject: 'Biology', section: 'SS2-A', level: 'SS2',
    date: '2026-08-20', startTime: '09:00', endTime: '10:00', durationMinutes: 60,
    room: 'Lecture Room 101', roomId: 3, invigilators: ['Dr. Musa Sesay'],
    maxCandidates: 40, enrolledCount: 39, status: 'Completed',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Biology'),
  },
  {
    id: 8, title: 'Social Studies — First Term Final',
    subject: 'Social Studies', section: 'JSS1-A', level: 'JSS1',
    date: '2026-08-29', startTime: '08:00', endTime: '09:30', durationMinutes: 90,
    room: 'Main Hall B', roomId: 2, invigilators: ['Mrs. Amina Jalloh'],
    maxCandidates: 80, enrolledCount: 71, status: 'Scheduled',
    examSession: 'First Term 2026', term: 'First Term', color: getSubjectColor('Social Studies'),
  },
];

const LEVELS = ['All Levels', 'SS3', 'SS2', 'SS1', 'JSS3', 'JSS2', 'JSS1', 'Hifz', 'Primary'];
const TERMS  = ['First Term', 'Second Term', 'Third Term'];
const SESSIONS = ['First Term 2026', 'Second Term 2026', 'Third Term 2026'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function isoWeekDates(year: number, month: number) {
  const days: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function detectConflicts(schedules: ScheduledExam[]): ExamConflict[] {
  const conflicts: ExamConflict[] = [];
  const byDate = schedules.reduce<Record<string, ScheduledExam[]>>((acc, s) => {
    acc[s.date] = [...(acc[s.date] || []), s];
    return acc;
  }, {});

  for (const [, dayExams] of Object.entries(byDate)) {
    for (let i = 0; i < dayExams.length; i++) {
      for (let j = i + 1; j < dayExams.length; j++) {
        const a = dayExams[i], b = dayExams[j];
        const aStart = a.startTime, aEnd = a.endTime;
        const bStart = b.startTime, bEnd = b.endTime;
        const overlap = aStart < bEnd && bStart < aEnd;
        if (!overlap) continue;

        // Room conflict
        if (a.room === b.room) {
          conflicts.push({ type: 'room', message: `Room "${a.room}" double-booked on ${formatDate(a.date)}`, exams: [a.id, b.id] });
        }
        // Section conflict
        if (a.section === b.section) {
          conflicts.push({ type: 'section', message: `Section "${a.section}" scheduled for two overlapping exams on ${formatDate(a.date)}`, exams: [a.id, b.id] });
        }
        // Invigilator conflict
        const sharedInvigs = a.invigilators.filter(inv => b.invigilators.includes(inv));
        if (sharedInvigs.length > 0) {
          conflicts.push({ type: 'invigilator', message: `${sharedInvigs[0]} assigned to two overlapping exams on ${formatDate(a.date)}`, exams: [a.id, b.id] });
        }
      }
    }
  }
  return conflicts;
}

// ─── Schedule Form Modal ─────────────────────────────────────────────────────

function ScheduleFormModal({
  initial, rooms, onSave, onClose,
}: {
  initial?: Partial<ScheduledExam>;
  rooms: ExamRoom[];
  onSave: (data: Partial<ScheduledExam>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ScheduledExam>>({
    title: '', subject: 'Mathematics', section: '', level: 'SS3',
    date: '', startTime: '08:00', endTime: '10:00', durationMinutes: 120,
    room: rooms[0]?.name || '', roomId: rooms[0]?.id,
    invigilators: [], maxCandidates: 80, enrolledCount: 0,
    status: 'Scheduled', examSession: 'First Term 2026',
    term: 'First Term', notes: '',
    ...initial,
  });
  const [invigilatorInput, setInvigilatorInput] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ScheduledExam, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addInvigilator = (name: string) => {
    const n = name.trim();
    if (n && !form.invigilators?.includes(n)) {
      setForm(p => ({ ...p, invigilators: [...(p.invigilators || []), n] }));
    }
    setInvigilatorInput('');
  };

  const calcEndTime = (start: string, mins: number) => {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  const handleStartChange = (v: string) => {
    set('startTime', v);
    set('endTime', calcEndTime(v, form.durationMinutes || 120));
  };

  const handleDurationChange = (mins: number) => {
    set('durationMinutes', mins);
    set('endTime', calcEndTime(form.startTime || '08:00', mins));
  };

  const handleRoomChange = (roomName: string) => {
    const r = rooms.find(r => r.name === roomName);
    set('room', roomName);
    if (r) { set('roomId', r.id); set('maxCandidates', r.capacity); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Exam title is required'); return; }
    if (!form.date) { toast.error('Exam date is required'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-black text-white text-base">{initial?.id ? 'Edit Exam Schedule' : 'Schedule New Exam'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Assign date, time, room, and invigilators</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Exam Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              placeholder="e.g. Mathematics — First Term Final Examination"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
          </div>

          {/* Subject / Section / Level */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subject</label>
              <input value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Mathematics"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Section / Class</label>
              <input value={form.section} onChange={e => set('section', e.target.value)}
                placeholder="SS3-A"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {LEVELS.filter(l => l !== 'All Levels').map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Date / Start / Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Exam Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => handleStartChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Duration (mins)</label>
              <input type="number" min={15} max={480} step={15} value={form.durationMinutes}
                onChange={e => handleDurationChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Computed end time display */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <AlarmCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400">
              End time calculated: <strong className="text-emerald-400">{formatTime(form.endTime || '')}</strong>
              {' '}({form.durationMinutes} minutes)
            </span>
          </div>

          {/* Room / Max Candidates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Exam Room / Venue</label>
              <select value={form.room} onChange={e => handleRoomChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {rooms.map(r => <option key={r.id} value={r.name}>{r.name} (Cap: {r.capacity})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Enrolled Candidates</label>
              <input type="number" min={0} value={form.enrolledCount} onChange={e => set('enrolledCount', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Invigilators */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Invigilators</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <select value={invigilatorInput} onChange={e => setInvigilatorInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                  <option value="">Select invigilator...</option>
                  {MOCK_INVIGILATORS.filter(i => !form.invigilators?.includes(i)).map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => addInvigilator(invigilatorInput)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer">
                Add
              </button>
            </div>
            {(form.invigilators?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.invigilators?.map(inv => (
                  <span key={inv} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-semibold">
                    <Users className="w-3 h-3" /> {inv}
                    <button type="button" onClick={() => setForm(p => ({ ...p, invigilators: p.invigilators?.filter(i => i !== inv) }))}
                      className="hover:text-rose-400 cursor-pointer ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Session / Term / Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Exam Session</label>
              <select value={form.examSession} onChange={e => set('examSession', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Term</label>
              <select value={form.term} onChange={e => set('term', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as ScheduleStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {(Object.keys(STATUS_CONFIG) as ScheduleStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Special Instructions / Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Any special seating, accessibility, or protocol notes..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none" />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit as any} disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50">
            {saving ? 'Saving...' : initial?.id ? 'Update Schedule' : 'Schedule Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exam Detail Drawer ───────────────────────────────────────────────────────

function ExamDetailDrawer({ exam, onClose, onEdit, onStatusChange }: {
  exam: ScheduledExam;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (id: number | string, status: ScheduleStatus) => void;
}) {
  const cfg = STATUS_CONFIG[exam.status];
  const occupancyPct = exam.maxCandidates ? Math.round(exam.enrolledCount / exam.maxCandidates * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${cfg.color}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {exam.status}
              </div>
              <h2 className="font-black text-white text-sm leading-snug">{exam.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</p>
              <p className="text-xs font-black text-white">{formatDate(exam.date)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
              <p className="text-xs font-black text-white">{formatTime(exam.startTime)} – {formatTime(exam.endTime)}</p>
              <p className="text-[10px] text-slate-500">{exam.durationMinutes} minutes</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Venue</p>
              <p className="text-xs font-black text-white">{exam.room}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><BookOpen className="w-3 h-3" /> Subject / Level</p>
              <p className="text-xs font-black text-white">{exam.subject}</p>
              <p className="text-[10px] text-slate-400">{exam.level} — {exam.section}</p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" /> Candidate Occupancy</span>
              <span className="text-white">{exam.enrolledCount} / {exam.maxCandidates} seats</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(occupancyPct, 100)}%` }}
              />
            </div>
            <p className={`text-xs font-black ${occupancyPct > 90 ? 'text-rose-400' : occupancyPct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {occupancyPct}% capacity utilised
            </p>
          </div>

          {/* Invigilators */}
          {exam.invigilators.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Invigilators Assigned</p>
              <div className="flex flex-col gap-2">
                {exam.invigilators.map(inv => (
                  <div key={inv} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-indigo-900/60 border border-indigo-800 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">{inv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {exam.notes && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40">
              <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">Special Instructions</p>
              <p className="text-xs text-amber-200 leading-relaxed">{exam.notes}</p>
            </div>
          )}

          {/* Quick Status Change */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as ScheduleStatus[]).filter(s => s !== exam.status).map(s => (
                <button key={s} onClick={() => { onStatusChange(exam.id, s); onClose(); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${STATUS_CONFIG[s].color}`}>
                  → {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-auto">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  year, month, schedules,
  onDayClick, onExamClick,
}: {
  year: number; month: number;
  schedules: ScheduledExam[];
  onDayClick: (date: string) => void;
  onExamClick: (e: ScheduledExam) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate = useMemo(() => schedules.reduce<Record<string, ScheduledExam[]>>((acc, s) => {
    acc[s.date] = [...(acc[s.date] || []), s];
    return acc;
  }, {}), [schedules]);

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="grid grid-cols-7 border-b border-slate-800">
        {DOW.map(d => (
          <div key={d} className="py-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const iso = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
          const dayExams = iso ? (byDate[iso] || []) : [];
          const isToday = iso === today;
          const isPast = iso && iso < today;

          return (
            <div
              key={i}
              onClick={() => day && onDayClick(iso)}
              className={`min-h-[100px] p-2 border-b border-r border-slate-800 transition-colors ${
                day ? 'cursor-pointer hover:bg-slate-800/40' : ''
              } ${isToday ? 'bg-emerald-950/20' : ''} ${!day ? 'bg-slate-900/50' : ''}`}
            >
              {day && (
                <>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mb-1 ${
                    isToday ? 'bg-emerald-500 text-slate-950' : isPast ? 'text-slate-600' : 'text-slate-300 hover:text-white'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayExams.slice(0, 3).map(ex => (
                      <div
                        key={ex.id}
                        onClick={e => { e.stopPropagation(); onExamClick(ex); }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${ex.color || getSubjectColor(ex.subject)}`}
                      >
                        {formatTime(ex.startTime)} {ex.subject}
                      </div>
                    ))}
                    {dayExams.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-bold px-1">+{dayExams.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ schedules, onExamClick }: {
  schedules: ScheduledExam[];
  onExamClick: (e: ScheduledExam) => void;
}) {
  const grouped = useMemo(() => {
    const map: Record<string, ScheduledExam[]> = {};
    schedules.forEach(s => { map[s.date] = [...(map[s.date] || []), s]; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [schedules]);

  if (grouped.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 bg-slate-900 border border-slate-800 border-dashed rounded-3xl">
      <Calendar className="w-12 h-12 text-slate-600 mb-3" />
      <p className="text-sm font-bold text-slate-400">No exams scheduled</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {grouped.map(([date, exams]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              {formatDate(date)}
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <div className="space-y-2">
            {exams.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(ex => {
              const cfg = STATUS_CONFIG[ex.status];
              return (
                <div
                  key={ex.id}
                  onClick={() => onExamClick(ex)}
                  className="group flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer"
                >
                  {/* Time Column */}
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xs font-black text-white">{formatTime(ex.startTime)}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(ex.endTime)}</p>
                  </div>

                  {/* Color stripe */}
                  <div className={`w-1 h-10 rounded-full shrink-0 ${ex.status === 'Completed' ? 'bg-emerald-500' : ex.status === 'Cancelled' ? 'bg-slate-600' : ex.status === 'InProgress' ? 'bg-amber-500' : 'bg-sky-500'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{ex.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ex.room}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {ex.section}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> {ex.enrolledCount} candidates</span>
                      <span className="text-[10px] text-slate-500">{ex.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {ex.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamSchedulingPage() {
  const [schedules, setSchedules] = useState<ScheduledExam[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  // Calendar nav
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Filters
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('All Levels');
  const [filterSession, setFilterSession] = useState('First Term 2026');
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'All'>('All');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<ScheduledExam | undefined>(undefined);
  const [viewingExam, setViewingExam] = useState<ScheduledExam | undefined>(undefined);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // ─── Load Data ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, roomsRes] = await Promise.allSettled([
        apiClient.get('/exam-schedules?populate=*&sort=startTime:asc&pagination[limit]=200'),
        apiClient.get('/exam-rooms?sort=name:asc'),
      ]);

      const apiSchedules = schedulesRes.status === 'fulfilled' ? schedulesRes.value.data?.data || [] : [];
      if (apiSchedules.length > 0) {
        setSchedules(apiSchedules.map((s: any) => ({
          id: s.id,
          title: s.examination?.data?.title || s.title || 'Exam',
          subject: s.examination?.data?.subject?.data?.name || s.subject || 'General',
          section: s.examination?.data?.section?.data?.name || s.section || '—',
          level: s.level || 'General',
          date: (s.startTime || '').split('T')[0],
          startTime: (s.startTime || '').split('T')[1]?.slice(0, 5) || '08:00',
          endTime: (s.endTime || '').split('T')[1]?.slice(0, 5) || '10:00',
          durationMinutes: s.durationMinutes || 120,
          room: s.exam_room?.data?.name || 'TBD',
          roomId: s.exam_room?.data?.id,
          invigilators: (s.invigilators?.data || []).map((i: any) => `${i.firstName || ''} ${i.lastName || ''}`.trim()),
          maxCandidates: s.exam_room?.data?.capacity || 80,
          enrolledCount: s.enrolledCount || 0,
          status: s.status || 'Scheduled',
          examSession: s.examination?.data?.exam_session?.data?.name || 'First Term 2026',
          term: s.term || 'First Term',
          notes: s.notes || '',
          color: getSubjectColor(s.subject || ''),
        })));
      } else {
        setSchedules(MOCK_SCHEDULES);
      }

      const apiRooms = roomsRes.status === 'fulfilled' ? roomsRes.value.data?.data || [] : [];
      if (apiRooms.length > 0) {
        setRooms(apiRooms.map((r: any) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity || 40,
          building: r.building || 'Main Building',
          floor: r.floor || 'Ground',
        })));
      } else {
        setRooms(MOCK_ROOMS);
      }
    } catch {
      setSchedules(MOCK_SCHEDULES);
      setRooms(MOCK_ROOMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered schedules ───────────────────────────────────────────────────

  const filtered = useMemo(() => schedules.filter(s => {
    if (filterLevel !== 'All Levels' && s.level !== filterLevel) return false;
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    if (filterSession && s.examSession !== filterSession) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q);
    }
    return true;
  }), [schedules, filterLevel, filterStatus, filterSession, search]);

  // ─── Conflict Detection ───────────────────────────────────────────────────

  const conflicts = useMemo(() => detectConflicts(filtered), [filtered]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === 'Scheduled').length,
    completed: schedules.filter(s => s.status === 'Completed').length,
    inProgress: schedules.filter(s => s.status === 'InProgress').length,
    totalCandidates: schedules.reduce((sum, s) => sum + s.enrolledCount, 0),
    rooms: [...new Set(schedules.map(s => s.room))].length,
  }), [schedules]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const handleSave = async (data: Partial<ScheduledExam>) => {
    try {
      const payload = {
        title: data.title,
        subject: data.subject,
        section: data.section,
        level: data.level,
        startTime: `${data.date}T${data.startTime}:00.000Z`,
        endTime: `${data.date}T${data.endTime}:00.000Z`,
        durationMinutes: data.durationMinutes,
        room: data.room,
        enrolledCount: data.enrolledCount,
        status: data.status,
        notes: data.notes,
        term: data.term,
      };

      if (editingExam) {
        try { await apiClient.put(`/exam-schedules/${editingExam.id}`, { data: payload }); } catch { /* offline */ }
        setSchedules(prev => prev.map(s => s.id === editingExam.id
          ? { ...s, ...data, color: getSubjectColor(data.subject || '') } : s));
        toast.success('Exam schedule updated');
      } else {
        let newId: string | number = `local_${Date.now()}`;
        try {
          const res = await apiClient.post('/exam-schedules', { data: payload });
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch { /* offline */ }
        setSchedules(prev => [...prev, {
          id: newId,
          title: data.title || '',
          subject: data.subject || '',
          section: data.section || '',
          level: data.level || '',
          date: data.date || '',
          startTime: data.startTime || '08:00',
          endTime: data.endTime || '10:00',
          durationMinutes: data.durationMinutes || 120,
          room: data.room || '',
          invigilators: data.invigilators || [],
          maxCandidates: data.maxCandidates || 80,
          enrolledCount: data.enrolledCount || 0,
          status: data.status || 'Scheduled',
          examSession: data.examSession || 'First Term 2026',
          term: data.term || 'First Term',
          notes: data.notes,
          color: getSubjectColor(data.subject || ''),
        }]);
        toast.success('Exam scheduled successfully');
      }
      setShowForm(false);
      setEditingExam(undefined);
    } catch {
      toast.error('Failed to save exam schedule');
    }
  };

  const handleDelete = async (id: number | string) => {
    try { await apiClient.delete(`/exam-schedules/${id}`); } catch { /* offline */ }
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('Exam removed from schedule');
  };

  const handleStatusChange = async (id: number | string, status: ScheduleStatus) => {
    try { await apiClient.put(`/exam-schedules/${id}`, { data: { status } }); } catch { /* offline */ }
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success(`Exam status updated to ${status}`);
  };

  const handleExport = () => {
    const lines = [
      'Title,Subject,Section,Level,Date,Start,End,Duration(min),Room,Candidates,Status,Session,Invigilators',
      ...filtered.map(s =>
        `"${s.title}","${s.subject}","${s.section}","${s.level}","${s.date}","${s.startTime}","${s.endTime}","${s.durationMinutes}","${s.room}","${s.enrolledCount}","${s.status}","${s.examSession}","${s.invigilators.join('; ')}"`
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `exam_schedule_${filterSession.replace(/ /g, '_')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Exam timetable exported');
  };

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <EnterpriseModuleShell
      title="Exam Scheduling & Timetabling"
      description="Plan, schedule, and manage examination timetables — assign rooms, invigilators, detect conflicts, and publish to students."
      icon={<Calendar className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Assessment ERP', href: '/assessment/exams' },
        { label: 'Scheduling' },
      ]}
    >
      <div className="space-y-6">

        {/* ── KPI Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Exams',     value: stats.total,          color: 'text-white',         icon: <ListChecks className="w-4 h-4 text-slate-400" /> },
            { label: 'Scheduled',       value: stats.scheduled,      color: 'text-sky-400',       icon: <Calendar className="w-4 h-4 text-sky-400" /> },
            { label: 'In Progress',     value: stats.inProgress,     color: 'text-amber-400',     icon: <AlarmCheck className="w-4 h-4 text-amber-400" /> },
            { label: 'Completed',       value: stats.completed,      color: 'text-emerald-400',   icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
            { label: 'Total Candidates',value: stats.totalCandidates, color: 'text-indigo-400',   icon: <Users className="w-4 h-4 text-indigo-400" /> },
            { label: 'Rooms Used',      value: stats.rooms,          color: 'text-violet-400',    icon: <Building className="w-4 h-4 text-violet-400" /> },
          ].map(kpi => (
            <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                {kpi.icon}
              </div>
              <p className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Conflict Alert ── */}
        {conflicts.length > 0 && (
          <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                {conflicts.length} Scheduling Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </h3>
            </div>
            <div className="space-y-1">
              {conflicts.slice(0, 3).map((c, i) => (
                <p key={i} className="text-xs text-rose-300 flex items-start gap-2">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black border uppercase shrink-0 ${
                    c.type === 'room' ? 'bg-rose-950/60 text-rose-300 border-rose-800' :
                    c.type === 'section' ? 'bg-amber-950/60 text-amber-300 border-amber-800' :
                    'bg-violet-950/60 text-violet-300 border-violet-800'
                  }`}>{c.type}</span>
                  {c.message}
                </p>
              ))}
              {conflicts.length > 3 && <p className="text-xs text-rose-500 font-bold">+{conflicts.length - 3} more conflicts...</p>}
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search exams, subjects, rooms, sections..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* View toggles */}
              <div className="flex rounded-xl overflow-hidden border border-slate-700">
                {([
                  { mode: 'timeline' as ViewMode, icon: <Layers className="w-3.5 h-3.5" />, label: 'Timeline' },
                  { mode: 'calendar' as ViewMode, icon: <Calendar className="w-3.5 h-3.5" />, label: 'Calendar' },
                  { mode: 'list' as ViewMode, icon: <ListChecks className="w-3.5 h-3.5" />, label: 'List' },
                ]).map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)}
                    className={`flex items-center gap-1 px-3 py-2 text-[10px] font-bold transition-all cursor-pointer ${
                      viewMode === v.mode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>

              <button onClick={loadData} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Export
              </button>

              <button onClick={() => { setEditingExam(undefined); setShowForm(true); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Schedule Exam
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Session</label>
              <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Level</label>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                <option value="All">All Statuses</option>
                {(Object.keys(STATUS_CONFIG) as ScheduleStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterLevel('All Levels'); setFilterStatus('All'); setSearch(''); }}
              className="mt-4 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
              Clear
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="space-y-4">
            {/* Calendar nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-white">{MONTH_NAMES[calMonth]} {calYear}</h3>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <CalendarView
              year={calYear} month={calMonth} schedules={filtered}
              onDayClick={date => { setSelectedDayDate(date); setEditingExam({ date } as any); setShowForm(true); }}
              onExamClick={ex => setViewingExam(ex)}
            />
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-xs font-extrabold text-white">{filtered.length} Scheduled Exams</p>
              <p className="text-[10px] text-slate-500 font-bold">{filterSession}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <tr>
                    <th className="p-4">Exam</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Room</th>
                    <th className="p-4 text-center">Candidates</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-bold">No exams match the current filters</td></tr>
                  ) : filtered.map(ex => {
                    const cfg = STATUS_CONFIG[ex.status];
                    return (
                      <tr key={ex.id} className="hover:bg-slate-800/60 transition-colors group">
                        <td className="p-4">
                          <p className="font-bold text-white text-xs">{ex.title}</p>
                          <p className="text-[10px] text-slate-400">{ex.section} • {ex.level}</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-300">{formatDate(ex.date)}</td>
                        <td className="p-4">
                          <p className="font-mono text-white">{formatTime(ex.startTime)}</p>
                          <p className="text-[10px] text-slate-500">{ex.durationMinutes} min</p>
                        </td>
                        <td className="p-4 text-slate-300">{ex.room}</td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {ex.enrolledCount}
                          <span className="text-slate-500">/{ex.maxCandidates}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {ex.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setViewingExam(ex)}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditingExam(ex); setShowForm(true); }}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(ex.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Timeline View */
          <TimelineView schedules={filtered} onExamClick={ex => setViewingExam(ex)} />
        )}

        {/* ── Room Utilisation Panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" /> Room Utilisation — {filterSession}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map(room => {
              const examsInRoom = filtered.filter(s => s.room === room.name);
              const totalCandidates = examsInRoom.reduce((sum, s) => sum + s.enrolledCount, 0);
              const avgOccupancy = examsInRoom.length > 0
                ? Math.round(examsInRoom.reduce((sum, s) => sum + (s.enrolledCount / room.capacity * 100), 0) / examsInRoom.length)
                : 0;

              return (
                <div key={room.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{room.name}</p>
                      <p className="text-[10px] text-slate-400">{room.building} · {room.floor} Floor</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black border border-slate-700 bg-slate-800 text-slate-300">
                      Cap: {room.capacity}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">{examsInRoom.length} exam{examsInRoom.length !== 1 ? 's' : ''}</span>
                      <span className={avgOccupancy > 80 ? 'text-rose-400' : 'text-emerald-400'}>{avgOccupancy}% avg occupancy</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full transition-all ${avgOccupancy > 80 ? 'bg-rose-500' : avgOccupancy > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(avgOccupancy, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">{totalCandidates} total candidates</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <ScheduleFormModal
          initial={editingExam}
          rooms={rooms}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingExam(undefined); setSelectedDayDate(null); }}
        />
      )}

      {viewingExam && (
        <ExamDetailDrawer
          exam={viewingExam}
          onClose={() => setViewingExam(undefined)}
          onEdit={() => { setEditingExam(viewingExam); setViewingExam(undefined); setShowForm(true); }}
          onStatusChange={handleStatusChange}
        />
      )}
    </EnterpriseModuleShell>
  );
}
