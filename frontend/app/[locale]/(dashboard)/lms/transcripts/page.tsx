'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { ScrollText, GraduationCap, Loader2, ArrowRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// /lms/transcripts — Section Head Global Transcript Entry Point
//
// Detects which academic sections this section head manages, then either:
//  • Auto-redirects immediately if they manage exactly ONE section
//  • Shows a clean section-picker UI if they manage MULTIPLE sections
//  • Shows an empty state if no sections are assigned
// ─────────────────────────────────────────────────────────────────────────────

interface ManagedSection {
  id: number;
  documentId: string;
  name: string;
  code: string;
  sectionType?: string;
  color?: string;
}

const SECTION_TYPE_COLORS: Record<string, string> = {
  quran:    'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300',
  islamic:  'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300',
  language: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
  stem:     'bg-violet-50 border-violet-300 text-violet-800 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-300',
  arts:     'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-300',
  sports:   'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300',
  general:  'bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300',
  other:    'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900/20 dark:border-slate-700 dark:text-slate-300',
};

const SECTION_TYPE_EMOJI: Record<string, string> = {
  quran: '📖', islamic: '🕌', language: '🌐', stem: '🔬',
  arts: '🎨', sports: '⚽', general: '📚', other: '📚',
};

export default function LmsTranscriptsRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sections, setSections] = useState<ManagedSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profile?.documentId) return;

    apiClient.get('/sections', {
      params: {
        filters: { academicHead: { documentId: { $eq: user.profile.documentId } } },
        fields: ['id', 'documentId', 'name', 'code', 'sectionType', 'color'],
        pagination: { limit: 20 },
        sort: 'name:asc',
      },
    }).then(res => {
      const items: ManagedSection[] = res.data?.data ?? [];
      setSections(items);
      // Auto-redirect when only one section managed
      if (items.length === 1) {
        router.push(`/academic/sections/${items[0].documentId}/transcripts`);
      }
    }).catch(() => {
      setLoading(false);
    }).finally(() => {
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile?.documentId]);

  // ── Loading / auto-redirect spinner ──────────────────────────────────────────
  if (loading || sections.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading your transcript workspace…</p>
      </div>
    );
  }

  // ── No sections assigned ─────────────────────────────────────────────────────
  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ScrollText className="w-8 h-8 text-slate-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Sections Assigned</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            You are not currently assigned as the academic head of any section.
            Contact your administrator to be assigned.
          </p>
        </div>
      </div>
    );
  }

  // ── Multiple sections — show picker ───────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Transcript Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select a section workspace to view or generate transcripts
          </p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="space-y-3">
        {sections.map(sec => {
          const typeKey = (sec.sectionType ?? 'general') as string;
          const colorClass = SECTION_TYPE_COLORS[typeKey] ?? SECTION_TYPE_COLORS.general;
          const emoji = SECTION_TYPE_EMOJI[typeKey] ?? '📚';

          return (
            <button
              key={sec.documentId}
              onClick={() => router.push(`/academic/sections/${sec.documentId}/transcripts`)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-150 hover:shadow-md hover:scale-[1.01] active:scale-100 text-left ${colorClass}`}
            >
              {/* Emoji icon */}
              <div className="w-12 h-12 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center text-2xl flex-shrink-0">
                {emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {sec.code}
                  </span>
                </div>
                <p className="font-bold text-base leading-tight">{sec.name}</p>
                <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Open Transcript Workspace
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 opacity-50 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}