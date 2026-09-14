'use client';

import Link from 'next/link';
import {
  BarChart3, Layers, BookOpen, BookMarked, Users, UserCheck,
  CalendarCheck, ClipboardList, FileText, Clock, Award, TrendingUp,
  CheckSquare
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Section Workspace Sub-Navigation Bar
// Shared across all workspace pages inside /academic/sections/[sectionId]/
// ─────────────────────────────────────────────────────────────────────────────

export const WORKSPACE_TABS = [
  { key: '', label: 'Overview', icon: BarChart3 },
  { key: 'grade-levels', label: 'Grade Levels', icon: Layers },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'offerings', label: 'Course Offerings', icon: BookMarked },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'teachers', label: 'Teachers', icon: UserCheck },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'gradebook', label: 'Gradebook', icon: ClipboardList },
  { key: 'assessments', label: 'Assessments', icon: FileText },
  { key: 'timetable', label: 'Timetable', icon: Clock },
  { key: 'transcripts', label: 'Transcripts', icon: Award },
  { key: 'approvals', label: 'Grade Approvals', icon: CheckSquare },
  { key: 'lesson-plans', label: 'Lesson Plans', icon: BookOpen },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
];

interface SectionSubNavProps {
  sectionId: string;
  activeTab: string;
}

export function SectionSubNav({ sectionId, activeTab }: SectionSubNavProps) {
  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="flex items-center gap-0.5 px-4 overflow-x-auto scrollbar-hide">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const href = `/academic/sections/${sectionId}${tab.key ? `/${tab.key}` : ''}`;
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key || '__overview'}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
