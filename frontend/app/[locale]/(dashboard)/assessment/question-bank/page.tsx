/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen, Plus, Search, Filter, RefreshCw, Trash2, Edit2, X,
  ChevronDown, ChevronUp, Tag, BarChart2, FileText, Copy,
  CheckCircle2, AlertCircle, HelpCircle, Layers, Upload, Download,
  Target, Clock, Star, Eye, MoreVertical
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { assessmentService } from '@/services/assessment.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { toast } from 'sonner';
import type { Question, QuestionPool } from '@/types/assessment.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ' | 'True/False' | 'Short Answer' | 'Essay' | 'Practical' | 'Oral' | 'Other';
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
type ViewMode = 'grid' | 'list';

interface QuestionRecord {
  id: number | string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  subject: string;
  subjectId?: number;
  pool: string;
  poolId?: number;
  correctAnswer?: string;
  explanation?: string;
  tags?: string[];
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  createdAt?: string;
}

interface PoolRecord {
  id: number | string;
  name: string;
  description?: string;
  questionCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { color: string; icon: React.ReactNode }> = {
  Easy:   { color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  Medium: { color: 'bg-amber-950/60 text-amber-400 border-amber-800',       icon: <AlertCircle className="w-3 h-3" /> },
  Hard:   { color: 'bg-rose-950/60 text-rose-400 border-rose-800',           icon: <Target className="w-3 h-3" /> },
};

const TYPE_CONFIG: Record<QuestionType, { color: string; short: string }> = {
  'MCQ':          { color: 'bg-sky-950/60 text-sky-400 border-sky-800',         short: 'MCQ' },
  'True/False':   { color: 'bg-violet-950/60 text-violet-400 border-violet-800', short: 'T/F' },
  'Short Answer': { color: 'bg-teal-950/60 text-teal-400 border-teal-800',       short: 'SA' },
  'Essay':        { color: 'bg-indigo-950/60 text-indigo-400 border-indigo-800', short: 'ESS' },
  'Practical':    { color: 'bg-orange-950/60 text-orange-400 border-orange-800', short: 'PRC' },
  'Oral':         { color: 'bg-pink-950/60 text-pink-400 border-pink-800',       short: 'ORL' },
  'Other':        { color: 'bg-slate-800 text-slate-400 border-slate-700',       short: 'OTH' },
};

const MOCK_POOLS: PoolRecord[] = [
  { id: 1, name: 'Mathematics & Algebra Pool',       description: 'Algebraic equations, functions, and mathematical reasoning', questionCount: 0 },
  { id: 2, name: "Qur'an & Islamic Studies",         description: 'Tajweed, Tafsir, Fiqh, Aqeedah, and Seerah questions', questionCount: 0 },
  { id: 3, name: 'English Language & Literature',    description: 'Grammar, comprehension, essay prompts, and vocabulary', questionCount: 0 },
  { id: 4, name: 'General Science Pool',             description: 'Physics, Chemistry, Biology combined item bank', questionCount: 0 },
  { id: 5, name: 'Social Studies & Civic Education', description: 'History, geography, and civic knowledge questions', questionCount: 0 },
];

const MOCK_QUESTIONS: QuestionRecord[] = [
  {
    id: 1001, text: 'What is the quadratic formula for solving ax² + bx + c = 0?',
    type: 'MCQ', difficulty: 'Medium', marks: 2, subject: 'Mathematics', pool: "Mathematics & Algebra Pool",
    optionA: 'x = (-b ± √(b²−4ac)) / 2a', optionB: 'x = (b ± √(b²+4ac)) / 2a',
    optionC: 'x = -b / 2a', optionD: 'x = (-b ± b²) / 2a',
    correctAnswer: 'A', explanation: 'The quadratic formula is derived by completing the square.',
    tags: ['algebra', 'quadratic'], createdAt: '2026-07-01'
  },
  {
    id: 1002, text: 'The Qur\'an was revealed over a period of approximately 23 years.',
    type: 'True/False', difficulty: 'Easy', marks: 1, subject: "Qur'an Studies", pool: "Qur'an & Islamic Studies",
    correctAnswer: 'True', explanation: 'Revelation began in 610 CE and completed before the Prophet\'s death in 632 CE.',
    tags: ['quran', 'history'], createdAt: '2026-07-02'
  },
  {
    id: 1003, text: 'Describe the process of photosynthesis and state the reactants and products.',
    type: 'Short Answer', difficulty: 'Medium', marks: 5, subject: 'Biology', pool: 'General Science Pool',
    correctAnswer: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
    tags: ['biology', 'photosynthesis', 'cells'], createdAt: '2026-07-03'
  },
  {
    id: 1004, text: 'Write an argumentative essay on the importance of Islamic ethics in modern governance.',
    type: 'Essay', difficulty: 'Hard', marks: 20, subject: 'Islamic Studies', pool: "Qur'an & Islamic Studies",
    explanation: 'Students should reference Quranic verses and Hadith supporting justice and accountability.',
    tags: ['essay', 'ethics', 'governance'], createdAt: '2026-07-04'
  },
  {
    id: 1005, text: 'Using a ruler and compass, construct a triangle with sides 5cm, 4cm, and 3cm.',
    type: 'Practical', difficulty: 'Easy', marks: 3, subject: 'Mathematics', pool: "Mathematics & Algebra Pool",
    tags: ['geometry', 'construction'], createdAt: '2026-07-05'
  },
  {
    id: 1006, text: 'Newton\'s First Law of Motion states that an object at rest stays at rest unless acted upon by a force.',
    type: 'True/False', difficulty: 'Easy', marks: 1, subject: 'Physics', pool: 'General Science Pool',
    correctAnswer: 'True', explanation: 'This is Newton\'s First Law (Inertia).',
    tags: ['physics', 'newton', 'laws'], createdAt: '2026-07-06'
  },
  {
    id: 1007, text: 'Identify the parts of speech in the following sentence: "The brilliant scholar read the ancient manuscript carefully."',
    type: 'Short Answer', difficulty: 'Medium', marks: 4, subject: 'English', pool: 'English Language & Literature',
    tags: ['grammar', 'parts-of-speech'], createdAt: '2026-07-07'
  },
  {
    id: 1008, text: 'Which of the following is NOT a pillar of Islam?',
    type: 'MCQ', difficulty: 'Easy', marks: 1, subject: 'Islamic Studies', pool: "Qur'an & Islamic Studies",
    optionA: 'Salah', optionB: 'Zakah', optionC: 'Hajj', optionD: 'Seerah',
    correctAnswer: 'D', explanation: 'Seerah (biography of the Prophet) is not one of the Five Pillars.',
    tags: ['pillars', 'islam', 'fiqh'], createdAt: '2026-07-08'
  },
];

const SUBJECTS = ['All Subjects', 'Mathematics', "Qur'an Studies", 'Islamic Studies', 'Biology', 'Physics', 'Chemistry', 'English', 'Social Studies'];
const QUESTION_TYPES: QuestionType[] = ['MCQ', 'True/False', 'Short Answer', 'Essay', 'Practical', 'Oral', 'Other'];
const DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const cfg = DIFFICULTY_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color}`}>
      {cfg.icon} {level}
    </span>
  );
}

function TypeBadge({ type }: { type: QuestionType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${cfg.color}`}>
      {cfg.short}
    </span>
  );
}

// ─── Question Form Modal ─────────────────────────────────────────────────────

function QuestionFormModal({
  initial,
  pools,
  onSave,
  onClose,
}: {
  initial?: Partial<QuestionRecord>;
  pools: PoolRecord[];
  onSave: (data: Partial<QuestionRecord>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<QuestionRecord>>({
    text: '', type: 'MCQ', difficulty: 'Medium', marks: 2,
    subject: 'Mathematics', pool: pools[0]?.name || '', tags: [],
    optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: '', explanation: '',
    ...initial,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleField = (k: keyof QuestionRecord, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) {
      setForm(p => ({ ...p, tags: [...(p.tags || []), tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm(p => ({ ...p, tags: p.tags?.filter(t => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text?.trim()) { toast.error('Question text is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const isMCQ = form.type === 'MCQ';
  const isTF = form.type === 'True/False';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-black text-white text-base">{initial?.id ? 'Edit Question' : 'New Question'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add to the institutional Question Bank & Pool</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Question Text *</label>
            <textarea
              value={form.text}
              onChange={e => handleField('text', e.target.value)}
              rows={3}
              placeholder="Enter the question stem clearly and precisely..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
              required
            />
          </div>

          {/* Row: Type / Difficulty / Marks */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Question Type</label>
              <select value={form.type} onChange={e => handleField('type', e.target.value as QuestionType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Difficulty</label>
              <select value={form.difficulty} onChange={e => handleField('difficulty', e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Max Marks</label>
              <input type="number" min={1} max={100} value={form.marks} onChange={e => handleField('marks', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Row: Subject / Pool */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subject</label>
              <select value={form.subject} onChange={e => handleField('subject', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {SUBJECTS.filter(s => s !== 'All Subjects').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Question Pool</label>
              <select value={form.pool} onChange={e => handleField('pool', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                {pools.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* MCQ Options */}
          {isMCQ && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider block">Answer Options (MCQ)</label>
              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                <div key={opt} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-black flex items-center justify-center shrink-0">{opt}</span>
                  <input
                    type="text"
                    value={(form as any)[`option${opt}`] || ''}
                    onChange={e => handleField(`option${opt}` as any, e.target.value)}
                    placeholder={`Option ${opt}...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Correct Answer</label>
                <select value={form.correctAnswer || ''} onChange={e => handleField('correctAnswer', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                  <option value="">Select correct option...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          )}

          {/* True/False */}
          {isTF && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Correct Answer</label>
              <div className="flex gap-3">
                {['True', 'False'].map(v => (
                  <button type="button" key={v}
                    onClick={() => handleField('correctAnswer', v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      form.correctAnswer === v
                        ? v === 'True' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Answer Explanation / Model Answer</label>
            <textarea
              value={form.explanation || ''}
              onChange={e => handleField('explanation', e.target.value)}
              rows={2}
              placeholder="Provide explanation or model answer for marking purposes..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tags (for Curriculum Mapping)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button type="button" onClick={addTag}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer">
                Add
              </button>
            </div>
            {(form.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-[10px] font-bold">
                    <Tag className="w-3 h-3" /> {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-400 cursor-pointer ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50">
            {saving ? 'Saving...' : initial?.id ? 'Update Question' : 'Add to Bank'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question Detail Viewer ───────────────────────────────────────────────────

function QuestionDetailModal({ question, onClose, onEdit }: {
  question: QuestionRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <TypeBadge type={question.type} />
            <DifficultyBadge level={question.difficulty} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
              <Star className="w-3 h-3 text-amber-400" /> {question.marks} marks
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Question Text */}
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Question</p>
            <p className="text-sm text-white font-semibold leading-relaxed">{question.text}</p>
          </div>

          {/* MCQ Options */}
          {question.type === 'MCQ' && (question.optionA || question.optionB) && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Answer Options</p>
              {(['A', 'B', 'C', 'D'] as const).map(opt => {
                const val = (question as any)[`option${opt}`];
                const isCorrect = question.correctAnswer === opt;
                if (!val) return null;
                return (
                  <div key={opt} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                    isCorrect ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}>
                    <span className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 ${
                      isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>{opt}</span>
                    <span>{val} {isCorrect && <span className="text-emerald-400 font-black ml-1">✓ Correct</span>}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* True/False answer */}
          {question.type === 'True/False' && question.correctAnswer && (
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Correct Answer</p>
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${
                question.correctAnswer === 'True' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-rose-950/40 border-rose-800 text-rose-400'
              }`}>{question.correctAnswer}</span>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50">
              <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider mb-1.5">Model Answer / Explanation</p>
              <p className="text-xs text-indigo-200 leading-relaxed">{question.explanation}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Subject</p>
              <p className="text-xs font-bold text-white">{question.subject}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pool</p>
              <p className="text-xs font-bold text-white">{question.pool}</p>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-[10px] font-bold">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" /> Edit Question
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pool Manager Panel ───────────────────────────────────────────────────────

function PoolManagerPanel({
  pools,
  questions,
  selectedPoolId,
  onSelect,
  onCreatePool,
  onDeletePool,
}: {
  pools: PoolRecord[];
  questions: QuestionRecord[];
  selectedPoolId: string | number | null;
  onSelect: (id: string | number | null) => void;
  onCreatePool: (name: string, desc: string) => void;
  onDeletePool: (id: string | number) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const countForPool = (poolName: string) => questions.filter(q => q.pool === poolName).length;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreatePool(name.trim(), desc.trim());
    setName(''); setDesc(''); setCreating(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 h-fit">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" /> Question Pools
        </h3>
        <button onClick={() => setCreating(p => !p)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* All Questions option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          selectedPoolId === null
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> All Questions</span>
        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-md">{questions.length}</span>
      </button>

      <div className="space-y-1">
        {pools.map(pool => {
          const count = countForPool(pool.name);
          const isSelected = selectedPoolId === pool.id;
          return (
            <div key={pool.id} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isSelected
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }`} onClick={() => onSelect(pool.id)}>
              <div className="flex-1 min-w-0">
                <p className="truncate">{pool.name}</p>
                {pool.description && <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{pool.description}</p>}
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-md">{count}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDeletePool(pool.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-400 text-slate-500 transition-all cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3">
          <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">New Pool</p>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pool name..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            placeholder="Brief description..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate}
              className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 transition-colors cursor-pointer">
              Create Pool
            </button>
            <button onClick={() => setCreating(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pool Stats */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Bank Statistics</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <p className="text-lg font-black text-white font-mono">{questions.length}</p>
            <p className="text-[10px] text-slate-400 font-bold">Total Items</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <p className="text-lg font-black text-emerald-400 font-mono">{pools.length}</p>
            <p className="text-[10px] text-slate-400 font-bold">Pools</p>
          </div>
        </div>
        {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => {
          const count = questions.filter(q => q.difficulty === d).length;
          const pct = questions.length ? Math.round(count / questions.length * 100) : 0;
          return (
            <div key={d} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className={DIFFICULTY_CONFIG[d].color.split(' ')[1]}>{d}</span>
                <span className="text-slate-400">{count} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800">
                <div className={`h-full rounded-full transition-all ${
                  d === 'Easy' ? 'bg-emerald-500' : d === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                }`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [pools, setPools] = useState<PoolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All Subjects');
  const [filterType, setFilterType] = useState<QuestionType | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [selectedPoolId, setSelectedPoolId] = useState<string | number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionRecord | undefined>(undefined);
  const [viewingQuestion, setViewingQuestion] = useState<QuestionRecord | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [poolsRes, questionsRes] = await Promise.allSettled([
        assessmentService.getQuestionPools(),
        assessmentService.getQuestions(),
      ]);

      // Pools
      const apiPools = poolsRes.status === 'fulfilled' ? (poolsRes.value as any[]) : [];
      if (apiPools.length > 0) {
        setPools(apiPools.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          questionCount: 0,
        })));
      } else {
        setPools(MOCK_POOLS);
      }

      // Questions
      const apiQuestions = questionsRes.status === 'fulfilled' ? (questionsRes.value as any[]) : [];
      if (apiQuestions.length > 0) {
        setQuestions(apiQuestions.map((q: any) => ({
          id: q.id,
          text: q.text || q.questionText || '',
          type: q.type || 'MCQ',
          difficulty: q.difficulty || 'Medium',
          marks: q.marks || 1,
          subject: q.subject?.data?.name || q.subject?.name || q.subjectName || 'General',
          subjectId: q.subject?.data?.id || q.subject?.id,
          pool: q.question_pool?.data?.name || q.question_pool?.name || q.poolName || 'General Pool',
          poolId: q.question_pool?.data?.id || q.question_pool?.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          tags: Array.isArray(q.tags) ? q.tags : [],
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          createdAt: q.createdAt,
        })));
      } else {
        setQuestions(MOCK_QUESTIONS);
      }
    } catch {
      setPools(MOCK_POOLS);
      setQuestions(MOCK_QUESTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered Questions ───────────────────────────────────────────────────

  const selectedPool = useMemo(() => pools.find(p => p.id === selectedPoolId), [pools, selectedPoolId]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedPoolId !== null && q.pool !== selectedPool?.name) return false;
      if (filterSubject !== 'All Subjects' && q.subject !== filterSubject) return false;
      if (filterType !== 'All' && q.type !== filterType) return false;
      if (filterDifficulty !== 'All' && q.difficulty !== filterDifficulty) return false;
      if (search) {
        const s = search.toLowerCase();
        return q.text.toLowerCase().includes(s) ||
          q.subject.toLowerCase().includes(s) ||
          q.pool.toLowerCase().includes(s) ||
          (q.tags || []).some(t => t.includes(s));
      }
      return true;
    });
  }, [questions, selectedPoolId, selectedPool, filterSubject, filterType, filterDifficulty, search]);

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  const handleSaveQuestion = async (data: Partial<QuestionRecord>) => {
    try {
      if (editingQuestion) {
        // Update
        try {
          await apiClient.put(`/questions/${editingQuestion.id}`, {
            data: {
              text: data.text, type: data.type, difficulty: data.difficulty, marks: data.marks,
              correctAnswer: data.correctAnswer, explanation: data.explanation, tags: data.tags,
              optionA: data.optionA, optionB: data.optionB, optionC: data.optionC, optionD: data.optionD,
            }
          });
        } catch { /* offline */ }
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...data } : q));
        toast.success('Question updated successfully');
      } else {
        // Create
        let newId: string | number = `local_${Date.now()}`;
        try {
          const res = await apiClient.post('/questions', {
            data: {
              text: data.text, type: data.type, difficulty: data.difficulty, marks: data.marks,
              correctAnswer: data.correctAnswer, explanation: data.explanation, tags: data.tags,
              optionA: data.optionA, optionB: data.optionB, optionC: data.optionC, optionD: data.optionD,
            }
          });
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch { /* offline */ }
        setQuestions(prev => [...prev, {
          id: newId,
          text: data.text || '',
          type: data.type || 'MCQ',
          difficulty: data.difficulty || 'Medium',
          marks: data.marks || 1,
          subject: data.subject || 'General',
          pool: data.pool || pools[0]?.name || 'General Pool',
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          tags: data.tags || [],
          optionA: data.optionA,
          optionB: data.optionB,
          optionC: data.optionC,
          optionD: data.optionD,
          createdAt: new Date().toISOString().split('T')[0],
        }]);
        toast.success('Question added to bank');
      }
      setShowForm(false);
      setEditingQuestion(undefined);
    } catch {
      toast.error('Failed to save question');
    }
  };

  const handleDelete = async (ids: Set<string | number>) => {
    const idArr = Array.from(ids);
    for (const id of idArr) {
      try { await apiClient.delete(`/questions/${id}`); } catch { /* offline */ }
    }
    setQuestions(prev => prev.filter(q => !ids.has(q.id)));
    setSelectedIds(new Set());
    toast.success(`${idArr.length} question(s) deleted from bank`);
  };

  const handleDuplicate = (q: QuestionRecord) => {
    const newQ: QuestionRecord = {
      ...q,
      id: `local_${Date.now()}`,
      text: `[COPY] ${q.text}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuestions(prev => [...prev, newQ]);
    toast.success('Question duplicated');
  };

  const handleCreatePool = (name: string, desc: string) => {
    const newPool: PoolRecord = { id: `local_${Date.now()}`, name, description: desc, questionCount: 0 };
    setPools(prev => [...prev, newPool]);
    toast.success(`Pool "${name}" created`);
  };

  const handleDeletePool = (id: string | number) => {
    setPools(prev => prev.filter(p => p.id !== id));
    if (selectedPoolId === id) setSelectedPoolId(null);
    toast.success('Pool removed');
  };

  const handleExport = () => {
    const lines = [
      'ID,Question,Type,Difficulty,Marks,Subject,Pool,Correct Answer,Tags',
      ...filteredQuestions.map(q =>
        `"${q.id}","${q.text.replace(/"/g, '""')}","${q.type}","${q.difficulty}","${q.marks}","${q.subject}","${q.pool}","${q.correctAnswer || ''}","${(q.tags || []).join('; ')}"`
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'question_bank_export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Question bank exported as CSV');
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <EnterpriseModuleShell
      title="Question Bank & Pools"
      description="Institutional item bank for building assessments — organise, manage, and reuse questions across subjects, terms, and examinations."
      icon={<BookOpen className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Assessment ERP', href: '/assessment/exams' },
        { label: 'Question Bank' },
      ]}
    >
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left: Pool Sidebar ── */}
        <div className="lg:w-64 shrink-0">
          <PoolManagerPanel
            pools={pools}
            questions={questions}
            selectedPoolId={selectedPoolId}
            onSelect={setSelectedPoolId}
            onCreatePool={handleCreatePool}
            onDeletePool={handleDeletePool}
          />
        </div>

        {/* ── Right: Main Content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions, tags, or subjects..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Filters toggle */}
                <button onClick={() => setShowFilters(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    showFilters ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}>
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>

                {/* Refresh */}
                <button onClick={loadData} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* Export */}
                <button onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>

                {/* New Question */}
                <button
                  onClick={() => { setEditingQuestion(undefined); setShowForm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer">
                  <Plus className="w-4 h-4" /> New Question
                </button>
              </div>
            </div>

            {/* Filter Row */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Subject</label>
                  <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Type</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                    <option value="All">All Types</option>
                    {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Difficulty</label>
                  <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                    <option value="All">All Levels</option>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { setFilterSubject('All Subjects'); setFilterType('All'); setFilterDifficulty('All'); setSearch(''); }}
                  className="mt-4 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer">
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-black text-amber-400">{selectedIds.size} question(s) selected</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white cursor-pointer">
                  Deselect All
                </button>
                <button onClick={() => handleDelete(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-700 text-rose-400 text-xs font-black hover:bg-rose-500/30 transition-all cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              {loading ? 'Loading...' : `${filteredQuestions.length} question(s) found`}
              {selectedPool && <span className="text-emerald-400 ml-2">in {selectedPool.name}</span>}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={toggleSelectAll}
                className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Question List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 border-dashed rounded-3xl">
              <HelpCircle className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-400">No questions found</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Try adjusting your filters or adding new questions</p>
              <button
                onClick={() => { setEditingQuestion(undefined); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer">
                <Plus className="w-4 h-4" /> Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`group bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer ${
                      isSelected ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => setViewingQuestion(q)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="mt-0.5" onClick={e => { e.stopPropagation(); toggleSelect(q.id); }}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-emerald-500'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                        </div>
                      </div>

                      {/* Index */}
                      <span className="text-[11px] text-slate-500 font-mono w-5 shrink-0 mt-1">{idx + 1}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm text-white font-semibold leading-snug line-clamp-2">{q.text}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          <TypeBadge type={q.type} />
                          <DifficultyBadge level={q.difficulty} />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
                            <Star className="w-3 h-3 text-amber-400" /> {q.marks} mk
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{q.subject}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{q.pool}</span>
                        </div>

                        {/* Tags */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {q.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/50 border border-indigo-900 text-indigo-400">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                              </span>
                            ))}
                            {q.tags.length > 4 && (
                              <span className="text-[9px] text-slate-500 font-bold px-1">+{q.tags.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setViewingQuestion(q)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingQuestion(q); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(q)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                          title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(new Set([q.id]))}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <QuestionFormModal
          initial={editingQuestion}
          pools={pools}
          onSave={handleSaveQuestion}
          onClose={() => { setShowForm(false); setEditingQuestion(undefined); }}
        />
      )}

      {viewingQuestion && (
        <QuestionDetailModal
          question={viewingQuestion}
          onClose={() => setViewingQuestion(undefined)}
          onEdit={() => {
            setEditingQuestion(viewingQuestion);
            setViewingQuestion(undefined);
            setShowForm(true);
          }}
        />
      )}
    </EnterpriseModuleShell>
  );
}
