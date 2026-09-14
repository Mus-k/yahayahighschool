'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, CheckCircle2, Clock, Award,
  RefreshCw, Activity, CreditCard, BookCheck,
  X, Upload, Mail, MessageSquare, FileText,
  Sparkles, BookOpenCheck, Star, Target,
  ChevronRight, ChevronDown, ChevronUp,
  ScrollText, Filter, GraduationCap, Printer,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useTranscriptEngine,
  resolveGrade,
  computeWeightedScore,
  type TranscriptMode,
  type CourseRecord,
  type SectionBlock,
} from '@/hooks/useTranscriptEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { id: number; documentId: string; name: string; code: string; creditValue?: number };
  academicSection?: { id: number; name: string; code: string; color?: string };
  gradeLevel?: { id: number; name: string; code: string };
  academicYear?: { id: number; documentId: string; name: string };
  academicTerm?: { id: number; documentId: string; name: string };
  teacher?: { id: number; displayName?: string; firstName?: string; lastName?: string };
  room?: { id: number; roomNumber: string };
}

interface Enrollment {
  id: number;
  documentId: string;
  enrollmentStatus: string;
  courseOffering?: CourseOffering;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function gradeColor(letter: string, isPassing: boolean) {
  if (!isPassing) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  if (letter.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (letter.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (letter.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
}

function statusBadgeClass(status: string) {
  if (status === 'Approved' || status === 'Released') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'Submitted' || status === 'Verified') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

const attendanceBadgeClass = (status: string) => {
  if (status === 'Present') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'Absent')  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
  if (status === 'Late')    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
};

const scoreBarColor = (pct: number) => {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-blue-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

// ─────────────────────────────────────────────────────────────────────────────
// Expandable CourseRow (matches Section Head design)
// ─────────────────────────────────────────────────────────────────────────────
function StudentCourseRow({ course, idx }: { course: CourseRecord; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={cn(
        'transition-colors',
        idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/60 dark:bg-slate-900/40',
        !course.isPassing && 'bg-rose-50/40 dark:bg-rose-950/20'
      )}>
        <td className="px-4 py-3 text-left">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white text-xs">{course.subjectName}</span>
            {course.subjectCode && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{course.subjectCode}</span>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-center text-[10px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{course.gradeLevel}</td>
        <td className="px-3 py-3 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{course.creditHours}</td>
        <td className="px-3 py-3 text-center font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
          {course.finalScore > 0 ? `${course.finalScore}%` : <span className="text-slate-400 dark:text-slate-600">—</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black min-w-[28px]',
            gradeColor(course.letterGrade, course.isPassing)
          )}>
            {course.finalScore > 0 ? course.letterGrade : '—'}
          </span>
        </td>
        <td className="px-3 py-3 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
          {course.finalScore > 0 ? course.gpaPoints.toFixed(1) : '—'}
        </td>
        <td className="px-3 py-3 text-center">
          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase', statusBadgeClass(course.gradebookStatus))}>
            {course.gradebookStatus}
          </span>
        </td>
        <td className="px-3 py-3 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden lg:table-cell">
          {[course.academicTerm, course.academicYear].filter(Boolean).join(' · ')}
        </td>
        <td className="px-2 py-3 text-center">
          {course.componentBreakdown.length > 0 ? (
            <button onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
              title="View assessment breakdown">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : <td />}
        </td>
      </tr>
      {expanded && course.componentBreakdown.length > 0 && (
        <tr>
          <td colSpan={9} className="px-4 pb-3 pt-0">
            <div className="flex flex-wrap gap-2 ml-4">
              {course.componentBreakdown.map((comp) => (
                <div key={comp.label} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{comp.label}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {comp.score !== null ? `${comp.score}%` : <span className="text-slate-400">—</span>}
                  </span>
                  <span className="text-slate-400 text-[9px]">({comp.weight}% wt)</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transcript Mode Cards
// ─────────────────────────────────────────────────────────────────────────────
const TRANSCRIPT_MODES: { id: TranscriptMode; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { id: 'combined',  label: 'Complete Transcript',  desc: 'All sections & all terms combined', icon: ScrollText,     color: 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:border-indigo-500' },
  { id: 'progress',  label: 'Progress Report',      desc: 'Current academic standing only',    icon: Target,          color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-500' },
  { id: 'year',      label: 'Academic Year Report', desc: 'Filter by a specific academic year', icon: GraduationCap,  color: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500' },
  { id: 'term',      label: 'Term Report',           desc: 'Filter by a specific term',         icon: Filter,          color: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-500' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
type WorkspaceTab = 'overview' | 'grades' | 'assignments' | 'attendance' | 'resources' | 'announcements' | 'messages' | 'analytics';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const student = user?.profile as any;
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading]     = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
  const [activeTab, setActiveTab]     = useState<WorkspaceTab>('overview');

  // Dashboard KPIs
  const [outstandingFees, setOutstandingFees] = useState(0);
  const [attendanceRate, setAttendanceRate]   = useState<string>('—');
  const [creditsEarned, setCreditsEarned]     = useState(0);
  const [currentGPA, setCurrentGPA]           = useState<number | null>(null);
  const [timetable, setTimetable]             = useState<any[]>([]);

  // Per-course data
  const [offeringGrades, setOfferingGrades]     = useState<any[]>([]);
  const [blueprints, setBlueprints]             = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [homeworks, setHomeworks]               = useState<any[]>([]);
  const [announcements, setAnnouncements]       = useState<any[]>([]);
  const [lessonPlans, setLessonPlans]           = useState<any[]>([]);
  const [gradingRules, setGradingRules]         = useState<any[]>([]);

  // Assignment submit
  const [submittingHwId, setSubmittingHwId] = useState<number | null>(null);
  const [submitFile, setSubmitFile]         = useState<File | null>(null);
  const [isUploading, setIsUploading]       = useState(false);

  // ── Transcript state ──────────────────────────────────────────────────────
  const { transcriptData, isLoading: trxLoading, buildTranscript } = useTranscriptEngine();
  const [showTranscript, setShowTranscript] = useState(false);
  // Step 1: mode select   Step 2: view transcript
  const [trxStep, setTrxStep]                     = useState<'select' | 'view'>('select');
  const [trxMode, setTrxMode]                     = useState<TranscriptMode>('combined');
  const [filterYearDoc, setFilterYearDoc]         = useState('');
  const [filterTermDoc, setFilterTermDoc]         = useState('');
  const [availableYears, setAvailableYears]       = useState<{ documentId: string; name: string }[]>([]);
  const [availableTerms, setAvailableTerms]       = useState<{ documentId: string; name: string }[]>([]);

  // ── Auto-open transcript from ?view=transcript ─────────────────────────
  useEffect(() => {
    if (searchParams?.get('view') === 'transcript') {
      setShowTranscript(true);
      setTrxStep('select');
    }
  }, [searchParams]);

  // ── Load dashboard ────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    if (!student?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [enrollRes, invoicesRes, rulesRes] = await Promise.all([
        apiClient.get('/student-enrollments', {
          params: {
            filters: { student: { id: { $eq: student.id } }, enrollmentStatus: { $eq: 'active' } },
            populate: [
              'courseOffering.subject', 'courseOffering.academicSection',
              'courseOffering.gradeLevel', 'courseOffering.academicYear',
              'courseOffering.academicTerm', 'courseOffering.teacher', 'courseOffering.room',
            ],
          },
        }),
        apiClient.get('/finance-invoices', { params: { filters: { student: { id: { $eq: student.id } } } } })
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/grading-policies', { params: { pagination: { limit: 200 } } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const enrollData: Enrollment[] = enrollRes.data?.data || [];
      setEnrollments(enrollData);

      // Extract unique years/terms for filter dropdowns
      const yearMap = new Map<string, { documentId: string; name: string }>();
      const termMap = new Map<string, { documentId: string; name: string }>();
      enrollData.forEach((e: any) => {
        const yr = e.courseOffering?.academicYear;
        const tm = e.courseOffering?.academicTerm;
        if (yr?.documentId) yearMap.set(yr.documentId, { documentId: yr.documentId, name: yr.name });
        if (tm?.documentId) termMap.set(tm.documentId, { documentId: tm.documentId, name: tm.name });
      });
      setAvailableYears(Array.from(yearMap.values()));
      setAvailableTerms(Array.from(termMap.values()));

      // Grading rules
      const rawRules = (rulesRes.data?.data || []).map((p: any) => ({
        gradeName: p.gradeName ?? p.letterGrade ?? 'F',
        minScore: parseFloat(p.minScore ?? p.minimumScore ?? 0),
        maxScore: parseFloat(p.maxScore ?? 100),
        gpaPoints: parseFloat(p.gpaPoints ?? p.gradePoints ?? 0),
        isPassing: p.isPassing ?? true,
        isDistinction: p.isDistinction ?? false,
      }));
      setGradingRules(rawRules);

      // Finance
      const invoices: any[] = invoicesRes.data?.data || [];
      const totalDue = invoices
        .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((s: number, inv: any) => s + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0);
      setOutstandingFees(totalDue);

      // Credits
      let earned = 0;
      enrollData.forEach((e: any) => { earned += e.courseOffering?.subject?.creditValue ?? 0; });
      setCreditsEarned(earned);

      // Timetable
      const offeringIds = enrollData.map((e: any) => e.courseOffering?.id).filter(Boolean);
      if (offeringIds.length > 0) {
        const ttRes = await apiClient.get('/timetable-slots', {
          params: {
            filters: { courseOffering: { id: { $in: offeringIds } } },
            populate: ['courseOffering.subject', 'courseOffering.room', 'courseOffering.teacher'],
          },
        }).catch(() => ({ data: { data: [] } }));
        setTimetable(ttRes.data?.data || []);
      }

      // Attendance rate
      try {
        const attRes = await apiClient.get('/attendance-records', {
          params: { filters: { student: { id: { $eq: student.id } } }, fields: ['recordStatus'], pagination: { limit: 1000 } },
        });
        const all: any[] = attRes.data?.data || [];
        if (all.length > 0) {
          const present = all.filter((r: any) => r.recordStatus === 'Present').length;
          setAttendanceRate(`${Math.round((present / all.length) * 100)}%`);
        }
      } catch { /* non-blocking */ }

      // GPA
      try {
        const gRes = await apiClient.get('/gradebook-entries', {
          params: { filters: { student: { id: { $eq: student.id } } }, fields: ['score', 'maxScore', 'percentage'], pagination: { limit: 500 } },
        });
        const grades: any[] = gRes.data?.data || [];
        if (grades.length > 0) {
          const avg = grades.reduce((s: number, g: any) =>
            s + (g.percentage ?? (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : g.score) ?? 0), 0) / grades.length;
          const gpa = avg >= 97 ? 4.0 : avg >= 93 ? 3.8 : avg >= 87 ? 3.5 : avg >= 83 ? 3.0 : avg >= 77 ? 2.5 : avg >= 70 ? 2.0 : avg >= 50 ? 1.0 : 0.0;
          setCurrentGPA(gpa);
        }
      } catch { /* non-blocking */ }

    } catch { toast.error('Failed to load dashboard.'); }
    finally { setIsLoading(false); }
  }, [student?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Load course workspace ─────────────────────────────────────────────────
  const loadWorkspace = useCallback(async (offering: CourseOffering) => {
    setSelectedOffering(offering);
    setActiveTab('overview');
    setIsLoading(true);
    try {
      const [bpRes, grRes, attRes, hwRes, annRes, lpRes] = await Promise.all([
        offering.subject?.id
          ? apiClient.get('/assessment-blueprints', { params: { filters: { subject: { id: { $eq: offering.subject.id } } } } }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/gradebook-entries', { params: { filters: { courseOffering: { id: { $eq: offering.id } }, student: { id: { $eq: student.id } } } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/attendance-records', { params: { filters: { courseOffering: { id: { $eq: offering.id } }, student: { id: { $eq: student.id } } }, sort: 'date:desc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/homeworks', { params: { filters: { section: { id: { $eq: offering.academicSection?.id } } }, populate: ['subject', 'teacher'], sort: 'dueDate:asc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/announcements', { params: { filters: { targetAudience: { $in: ['all', 'students'] } }, sort: 'createdAt:desc', pagination: { limit: 10 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/lesson-plans', { params: { filters: { subject: { id: { $eq: offering.subject?.id } }, recordStatus: { $eq: 'Approved' } }, sort: 'createdAt:desc', pagination: { limit: 50 } } }).catch(() => ({ data: { data: [] } })),
      ]);
      setBlueprints(bpRes.data?.data || []);
      setOfferingGrades(grRes.data?.data || []);
      setAttendanceRecords(attRes.data?.data || []);
      setHomeworks(hwRes.data?.data || []);
      setAnnouncements(annRes.data?.data || []);
      setLessonPlans(lpRes.data?.data || []);
    } catch { toast.error('Failed to load course workspace.'); }
    finally { setIsLoading(false); }
  }, [student?.id]);

  // ── Computed values ───────────────────────────────────────────────────────
  const computedGrades = useMemo(() => {
    if (blueprints.length === 0 || offeringGrades.length === 0) return null;
    const bps = blueprints.map((bp: any) => ({
      documentId: bp.documentId,
      componentName: bp.componentName,
      label: bp.label || bp.componentName,
      weightPercentage: bp.weightPercentage,
    }));
    const { finalScore, breakdown } = computeWeightedScore(offeringGrades, bps);
    const { letterGrade, gpaPoints, isPassing } = resolveGrade(finalScore, gradingRules);
    return { finalScore, breakdown, letterGrade, gpaPoints, isPassing };
  }, [blueprints, offeringGrades, gradingRules]);

  const attendanceSummary = useMemo(() => {
    const total = attendanceRecords.length;
    if (total === 0) return null;
    const present = attendanceRecords.filter((r: any) => r.recordStatus === 'Present').length;
    const absent  = attendanceRecords.filter((r: any) => r.recordStatus === 'Absent').length;
    const late    = attendanceRecords.filter((r: any) => r.recordStatus === 'Late').length;
    return { total, present, absent, late, rate: Math.round((present / total) * 100) };
  }, [attendanceRecords]);

  // ── Assignment submit ─────────────────────────────────────────────────────
  const handleUpload = async (hwId: number) => {
    if (!submitFile) { toast.warning('Please select a file.'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', submitFile);
      await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment uploaded!');
      setSubmitFile(null);
      setSubmittingHwId(null);
    } catch { toast.error('Upload failed.'); }
    finally { setIsUploading(false); }
  };

  // ── Transcript build ──────────────────────────────────────────────────────
  const handleBuildTranscript = () => {
    if (!student?.documentId) { toast.error('Student profile not loaded.'); return; }
    setTrxStep('view');
    buildTranscript(
      student.documentId,
      trxMode,
      trxMode === 'year' ? filterYearDoc || undefined : undefined,
      trxMode === 'term' ? filterTermDoc || undefined : undefined,
    );
  };

  // ── Print transcript ──────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!transcriptData || !student) return;
    const sName   = `${student.firstName} ${student.lastName}`;
    const today   = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const logoUrl = `${window.location.origin}/yahaya-logo.jpeg`;
    const qrData  = encodeURIComponent(`TRANSCRIPT\nStudent: ${sName}\nID: ${student.schoolId}\nCGPA: ${transcriptData.summary.cgpa.toFixed(2)}\nHash: ${transcriptData.summary.verificationHash}\nDate: ${today}`);

    const gh = (l: string, p: boolean) => p
      ? (l.startsWith('A') ? 'background:#d1fae5;color:#065f46' : l.startsWith('B') ? 'background:#dbeafe;color:#1e40af' : 'background:#fef3c7;color:#92400e')
      : 'background:#fee2e2;color:#991b1b';

    const blocksHtml = transcriptData.sectionBlocks.map((b: SectionBlock) =>
      `<div style="margin-top:14px;page-break-inside:avoid">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:7px 12px;display:flex;justify-content:space-between">
          <span style="font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em">${b.sectionName}</span>
          <span style="font-size:7.5pt;color:#64748b">${b.courses.length} courses | Credits: ${b.creditsAttempted} | GPA: <strong>${b.sectionGPA.toFixed(2)}</strong></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5pt;border:1px solid #e2e8f0;border-top:none">
          <thead><tr style="background:#f1f5f9">${['Subject','Cr','Score','Grade','GP','Period'].map(h=>`<th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1">${h}</th>`).join('')}</tr></thead>
          <tbody>${b.courses.map((c: CourseRecord) =>
            `<tr>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0"><div style="font-weight:700">${c.subjectName}</div><div style="font-size:7pt;color:#64748b;font-family:monospace">${c.subjectCode}</div></td>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${c.creditHours}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:#4338ca">${c.finalScore}%</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center"><span style="padding:1px 6px;border-radius:99px;font-size:7.5pt;font-weight:700;${gh(c.letterGrade,c.isPassing)}">${c.letterGrade}</span></td>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${c.gpaPoints.toFixed(1)}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:7.5pt;color:#64748b">${[c.academicTerm,c.academicYear].filter(Boolean).join(' · ')}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Transcript — ${sName}</title>
<style>@page{size:A4 portrait;margin:14mm 12mm;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;font-size:9.5pt;color:#0f172a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head>
<body><div style="padding:4px 0">
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:2.5px solid #0f172a;margin-bottom:14px">
  <div style="width:72px;height:72px;flex-shrink:0;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden"><img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain"/></div>
  <div style="flex:1"><div style="font-size:15pt;font-weight:900;text-transform:uppercase">Yahaya International Islamic and English High School</div><div style="margin-top:6px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4338ca">Official Academic Transcript · ${TRANSCRIPT_MODES.find(m=>m.id===trxMode)?.label ?? trxMode}</div></div>
  <div style="text-align:right;flex-shrink:0"><div style="font-size:7.5pt;font-weight:700;color:#94a3b8;text-transform:uppercase">Ref.</div><div style="font-family:monospace;font-size:8pt;font-weight:700;color:#4338ca;margin-top:2px">${transcriptData.summary.verificationHash.slice(0,12).toUpperCase()}</div><div style="font-size:7.5pt;color:#64748b;margin-top:4px">${today}</div></div>
</div>
<table style="width:100%;border:1px solid #e2e8f0;margin-bottom:14px"><tbody style="background:#fafafa">
  <tr>
    <td style="padding:6px 10px;width:33%;border-right:1px solid #e2e8f0"><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">Full Name</div><div style="font-size:9pt;font-weight:700">${sName}</div></td>
    <td style="padding:6px 10px;width:33%;border-right:1px solid #e2e8f0"><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">Student ID</div><div style="font-size:9pt;font-weight:700;font-family:monospace;color:#4338ca">${student.schoolId}</div></td>
    <td style="padding:6px 10px;width:33%"><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">Admission No.</div><div style="font-size:9pt;font-weight:700;font-family:monospace">${student.admissionNumber ?? 'N/A'}</div></td>
  </tr>
</tbody></table>
${blocksHtml}
<div style="margin-top:18px;padding-top:12px;border-top:2.5px solid #0f172a">
  <div style="font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">&#9654; Overall Academic Summary</div>
  <table style="width:100%;border-collapse:separate;margin-bottom:10px"><tbody><tr style="vertical-align:top">
    ${[['Cumulative GPA',transcriptData.summary.cgpa.toFixed(2),'#4338ca'],['Credits Earned',`${transcriptData.summary.creditsEarned}/${transcriptData.summary.creditsAttempted}`,'#059669'],['Courses Passed',`${transcriptData.summary.passedCourses}`,'#059669'],['Courses Failed',`${transcriptData.summary.failedCourses}`,transcriptData.summary.failedCourses>0?'#e11d48':'#64748b']].map(([l,v,c])=>`<td style="padding:0;width:25%"><div style="border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px;margin:0 4px"><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">${l}</div><div style="font-size:14pt;font-weight:900;color:${c};margin-top:4px">${v}</div></div></td>`).join('')}
  </tr></tbody></table>
  <div style="display:flex;gap:12px;margin-bottom:12px">
    <div style="flex:2;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
      <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:3px">Academic Standing</div>
      <div style="font-size:11pt;font-weight:800">${transcriptData.summary.academicStanding}</div>
      <div style="font-size:8.5pt;font-weight:700;margin-top:4px;color:${transcriptData.summary.isEligibleForGraduation?'#059669':'#d97706'}">${transcriptData.summary.isEligibleForGraduation?'✓ Eligible for Graduation':'⚠ Graduation Eligibility Pending'}</div>
    </div>
    <div style="flex:3;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
      <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">Digital Verification — Scan QR</div>
      <div style="display:flex;align-items:center;gap:12px">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}" width="90" height="90" style="border:1px solid #e2e8f0;border-radius:6px;padding:4px"/>
        <div><div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student</div><div style="font-weight:800;font-size:9pt">${sName}</div><div style="font-family:monospace;color:#4338ca;font-weight:700">${student.schoolId}</div><div style="margin-top:6px;padding:3px 6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:7pt;color:#166534">✓ Cryptographically sealed</div></div>
      </div>
    </div>
  </div>
  <table style="width:100%;margin-top:8px"><tbody><tr>
    <td style="width:33%;text-align:center;padding-top:24px;border-top:1.5px solid #94a3b8"><div style="font-size:8pt;font-weight:700;color:#475569">Registrar Signature</div><div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div></td>
    <td style="width:34%"></td>
    <td style="width:33%;text-align:center;padding-top:24px;border-top:1.5px solid #94a3b8"><div style="font-size:8pt;font-weight:700;color:#475569">Principal Signature</div><div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div></td>
  </tr></tbody></table>
  <div style="text-align:center;font-size:7pt;color:#94a3b8;font-style:italic;margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0">
    Official transcript generated by Yahaya Enterprise Academic ERP. Any alteration renders this document void.
  </div>
</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1200);},600);};<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (!win) { toast.error('Popup blocked — please allow popups.'); return; }
    win.document.write(html);
    win.document.close();
  };

  // ── Tab items ─────────────────────────────────────────────────────────────
  const tabItems = [
    { id: 'overview' as WorkspaceTab,      label: 'Overview',      icon: BookOpen },
    { id: 'grades' as WorkspaceTab,        label: 'My Grades',     icon: Award },
    { id: 'assignments' as WorkspaceTab,   label: 'Assignments',   icon: BookCheck },
    { id: 'attendance' as WorkspaceTab,    label: 'Attendance',    icon: CheckCircle2 },
    { id: 'resources' as WorkspaceTab,     label: 'Materials',     icon: FileText },
    { id: 'announcements' as WorkspaceTab, label: 'Announcements', icon: Mail },
    { id: 'messages' as WorkspaceTab,      label: 'Discussion',    icon: MessageSquare },
    { id: 'analytics' as WorkspaceTab,     label: 'Analytics',     icon: Activity },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <PageHeader
        title={
          showTranscript ? 'My Academic Transcript'
          : selectedOffering ? (selectedOffering.subject?.name ?? 'Course Workspace')
          : 'Learning Workspace'
        }
        description={
          showTranscript ? `${student?.firstName || ''} ${student?.lastName || ''} · ${student?.schoolId || ''}`
          : selectedOffering
            ? `${selectedOffering.academicSection?.name ?? ''} · ${selectedOffering.teacher?.displayName || selectedOffering.teacher?.firstName || 'Faculty'}`
            : `Assalamu Alaikum, ${student?.firstName || 'Student'}`
        }
      >
        <div className="flex gap-2 flex-wrap">
          {/* Exit course */}
          {selectedOffering && (
            <button onClick={() => { setSelectedOffering(null); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <X className="w-3.5 h-3.5" />Exit Course
            </button>
          )}
          {/* Back from transcript */}
          {showTranscript && !selectedOffering && (
            <button onClick={() => { setShowTranscript(false); setTrxStep('select'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <X className="w-3.5 h-3.5" />Close
            </button>
          )}
          {/* Open transcript */}
          {!selectedOffering && !showTranscript && (
            <button onClick={() => { setShowTranscript(true); setTrxStep('select'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm">
              <ScrollText className="w-3.5 h-3.5" />My Transcript
            </button>
          )}
          {/* Print (only in view step) */}
          {showTranscript && trxStep === 'view' && transcriptData && !trxLoading && (
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm">
              <Printer className="w-3.5 h-3.5" />Print Official
            </button>
          )}
          <button onClick={loadDashboard} disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />Refresh
          </button>
        </div>
      </PageHeader>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading academic data…</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TRANSCRIPT MODULE                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && showTranscript && (
        <div className="space-y-6 animate-fade-in">

          {/* ── STEP 1: Select Transcript Type ── */}
          {trxStep === 'select' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Hero header */}
                <div className="px-6 py-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <ScrollText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black">Academic Transcript</h2>
                      <p className="text-indigo-200 text-xs">{student?.firstName} {student?.lastName} · {student?.schoolId}</p>
                    </div>
                  </div>
                  <p className="text-indigo-100 text-xs mt-3 leading-relaxed">
                    Select the type of transcript you want to view. Your transcript is built in real-time from verified gradebook entries.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Mode cards */}
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Choose Transcript Type</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TRANSCRIPT_MODES.map((m) => {
                        const Icon = m.icon;
                        const isSelected = trxMode === m.id;
                        return (
                          <button key={m.id} onClick={() => { setTrxMode(m.id); setFilterYearDoc(''); setFilterTermDoc(''); }}
                            className={cn(
                              'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : m.color,
                              isSelected && 'ring-2 ring-indigo-500/30'
                            )}>
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400')}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={cn('font-black text-sm', isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200')}>{m.label}</p>
                              <p className={cn('text-[11px] mt-0.5', isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400')}>{m.desc}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto flex-shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Year filter */}
                  {trxMode === 'year' && (
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-2">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Select Academic Year</p>
                      <select value={filterYearDoc} onChange={e => setFilterYearDoc(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— All Years —</option>
                        {availableYears.map(y => (
                          <option key={y.documentId} value={y.documentId}>{y.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Term filter */}
                  {trxMode === 'term' && (
                    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 space-y-2">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Select Academic Term</p>
                      <select value={filterTermDoc} onChange={e => setFilterTermDoc(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">— All Terms —</option>
                        {availableTerms.map(t => (
                          <option key={t.documentId} value={t.documentId}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button onClick={handleBuildTranscript}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-sm">
                    <ScrollText className="w-4 h-4" />
                    Generate {TRANSCRIPT_MODES.find(m => m.id === trxMode)?.label}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: View Transcript ── */}
          {trxStep === 'view' && (
            <div className="space-y-4">
              {/* Back to type selector */}
              <button onClick={() => setTrxStep('select')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />Change transcript type
              </button>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Header bar */}
                <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-white">{student?.firstName} {student?.lastName}</h2>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{student?.schoolId}</span>
                      <span>·</span>
                      <span className="font-mono">{student?.admissionNumber}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600/60 text-indigo-200 font-bold uppercase text-[9px]">
                        {TRANSCRIPT_MODES.find(m => m.id === trxMode)?.label ?? trxMode}
                      </span>
                    </div>
                  </div>
                  {transcriptData && !trxLoading && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cumulative GPA</div>
                      <div className="text-3xl font-black text-emerald-400">{transcriptData.summary.cgpa.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{transcriptData.summary.academicStanding}</div>
                    </div>
                  )}
                </div>

                {trxLoading ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-600 dark:text-slate-400">Building your transcript…</p>
                    <p className="text-xs text-slate-400 mt-1">Fetching gradebook entries from all sections…</p>
                  </div>
                ) : !transcriptData ? (
                  <div className="py-16 text-center">
                    <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No transcript data available.</p>
                    <p className="text-xs text-slate-400 mt-1">No approved grades found for the selected filter.</p>
                  </div>
                ) : (
                  <>
                    {/* KPI strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 dark:border-slate-800">
                      {[
                        { l: 'Credits Earned',  v: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, c: 'text-emerald-600 dark:text-emerald-400' },
                        { l: 'Courses Passed',  v: transcriptData.summary.passedCourses,  c: 'text-emerald-600 dark:text-emerald-400' },
                        { l: 'Courses Failed',  v: transcriptData.summary.failedCourses,  c: transcriptData.summary.failedCourses > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400' },
                        { l: 'Sections',        v: transcriptData.sectionBlocks.length,   c: 'text-indigo-600 dark:text-indigo-400' },
                      ].map((k, i) => (
                        <div key={i} className="px-5 py-4 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800">
                          <div className={`text-xl font-black ${k.c}`}>{k.v}</div>
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{k.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Clearance banner */}
                    {transcriptData.clearance.overallBlocked && (
                      <div className="mx-6 mt-4 flex items-center gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
                        <CheckCircle2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-400">You have active clearance holds. Official transcript printing may be restricted.</p>
                      </div>
                    )}

                    {/* Section blocks */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transcriptData.sectionBlocks.length === 0 ? (
                        <div className="py-14 text-center">
                          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No approved grades found.</p>
                          <p className="text-xs text-slate-400 mt-1">Grades appear once your teachers have approved and released them.</p>
                        </div>
                      ) : transcriptData.sectionBlocks.map((block: SectionBlock, bi: number) => (
                        <div key={bi}>
                          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">{block.sectionName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                              <span>GPA: <strong className="text-indigo-600 dark:text-indigo-400">{block.sectionGPA.toFixed(2)}</strong></span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passed: {block.passCount}</span>
                              {block.failCount > 0 && <span className="text-rose-600 dark:text-rose-400 font-bold">Failed: {block.failCount}</span>}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                  {['Subject', 'Level', 'Cr', 'Score', 'Grade', 'GP', 'Status', 'Period', ''].map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {block.courses.map((c: CourseRecord, ci: number) => (
                                  <StudentCourseRow key={ci} course={c} idx={ci} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Print footer */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        Hash: {transcriptData.summary.verificationHash}
                      </div>
                      <button onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition flex-shrink-0">
                        <Printer className="w-3.5 h-3.5" />Print Official Transcript
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MAIN DASHBOARD (no course selected, no transcript)                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && !selectedOffering && !showTranscript && (
        <div className="space-y-6 animate-fade-in">

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Current GPA" value={currentGPA !== null ? currentGPA.toFixed(2) : '—'} subtitle="From gradebook entries" icon={Award} color="text-indigo-500" bgColor="bg-indigo-500/10" />
            <StatCard title="Attendance Rate" value={attendanceRate} subtitle="All recorded sessions" icon={CheckCircle2} color="text-emerald-500" bgColor="bg-emerald-500/10" />
            <StatCard title="Credits Enrolled" value={creditsEarned} subtitle="Active course credits" icon={BookOpenCheck} color="text-blue-500" bgColor="bg-blue-500/10" />
            <StatCard
              title="Outstanding Dues"
              value={outstandingFees > 0 ? `$${outstandingFees.toFixed(2)}` : 'No Dues'}
              subtitle={outstandingFees > 0 ? 'Active financial hold' : 'All cleared'}
              icon={CreditCard}
              color={outstandingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}
              bgColor={outstandingFees > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
            />
          </div>

          {/* Course enrollment cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">My Course Enrollments</h2>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{enrollments.length} active course{enrollments.length !== 1 ? 's' : ''}</span>
            </div>
            {enrollments.length === 0 ? (
              <div className="py-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-white dark:bg-slate-900">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No active enrollments for the current term.</p>
                <p className="text-xs text-slate-400 mt-1">Contact your registrar to enroll in courses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enr) => {
                  const o = enr.courseOffering;
                  if (!o) return null;
                  const sectionColor = o.academicSection?.color ?? '#6366f1';
                  const teacherName = o.teacher?.displayName || (o.teacher?.firstName ?? 'Faculty');
                  return (
                    <div key={enr.id} onClick={() => loadWorkspace(o)}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between min-h-[180px]">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white truncate max-w-[130px]" style={{ backgroundColor: sectionColor }}>
                            {o.academicSection?.name}
                          </span>
                          {o.gradeLevel?.name && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">{o.gradeLevel.name}</span>
                          )}
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{o.subject?.name}</h3>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{o.subject?.code}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{teacherName}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {o.room?.roomNumber && <p>Room {o.room.roomNumber}</p>}
                          {o.academicTerm?.name && <p>{o.academicTerm.name}</p>}
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                          Enter <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timetable + Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />Today's Class Schedule
              </h3>
              {timetable.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No timetable slots found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timetable.map((slot: any) => (
                    <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{slot.courseOffering?.subject?.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Room {slot.courseOffering?.room?.roomNumber} · {slot.courseOffering?.teacher?.displayName}</p>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic overview panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-500" />Academic Overview
              </h4>
              {[
                { label: 'Attendance',       value: attendanceRate,                              icon: CheckCircle2, c: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Current GPA',      value: currentGPA !== null ? currentGPA.toFixed(2) : '—', icon: Award, c: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Credits Enrolled', value: creditsEarned.toString(),                   icon: Star,         c: 'text-blue-600 dark:text-blue-400' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">{item.label}</p>
                      <p className={`text-lg font-black ${item.c}`}>{item.value}</p>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => { setShowTranscript(true); setTrxStep('select'); }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm">
                <ScrollText className="w-3.5 h-3.5" />View Full Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* COURSE WORKSPACE                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && selectedOffering && (
        <div className="space-y-5 animate-fade-in">

          {/* Course info banner */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="h-1.5" style={{ backgroundColor: selectedOffering.academicSection?.color ?? '#6366f1' }} />
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                style={{ backgroundColor: selectedOffering.academicSection?.color ?? '#6366f1' }}>
                {selectedOffering.subject?.code?.slice(0, 2) ?? 'CO'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">{selectedOffering.subject?.name}</h2>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono">{selectedOffering.subject?.code}</span>
                  {selectedOffering.academicSection?.name && <><span>·</span><span>{selectedOffering.academicSection.name}</span></>}
                  {selectedOffering.academicTerm?.name && <><span>·</span><span>{selectedOffering.academicTerm.name} {selectedOffering.academicYear?.name}</span></>}
                </div>
              </div>
              {computedGrades && (
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Weighted Score</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{computedGrades.finalScore}%</div>
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5', gradeColor(computedGrades.letterGrade, computedGrades.isPassing))}>
                    {computedGrades.letterGrade} · {computedGrades.gpaPoints.toFixed(1)} GP
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/60'
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

            {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course details */}
                  <div className="space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Course Details</h3>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {[
                        ['Subject', selectedOffering.subject?.name],
                        ['Code', selectedOffering.subject?.code],
                        ['Credits', selectedOffering.subject?.creditValue ? `${selectedOffering.subject.creditValue} credit hours` : null],
                        ['Teacher', selectedOffering.teacher?.displayName || selectedOffering.teacher?.firstName],
                        ['Section', selectedOffering.academicSection?.name],
                        ['Level', selectedOffering.gradeLevel?.name],
                        ['Room', selectedOffering.room?.roomNumber ? `Room ${selectedOffering.room.roomNumber}` : null],
                        ['Academic Year', selectedOffering.academicYear?.name],
                        ['Term', selectedOffering.academicTerm?.name],
                      ].filter(([, v]) => v).map(([l, v], i, arr) => (
                        <div key={String(l)} className={cn(
                          'grid grid-cols-2 text-xs px-4 py-2.5',
                          i < arr.length - 1 && 'border-b border-slate-100 dark:border-slate-800',
                          i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900'
                        )}>
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">{l}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Your Progress</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: 'Grade Entries',  v: offeringGrades.length,     icon: Award,        c: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        { l: 'Attendance',     v: attendanceRecords.length,  icon: CheckCircle2, c: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { l: 'Assignments',    v: homeworks.length,          icon: BookCheck,    c: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { l: 'Materials',      v: lessonPlans.length,        icon: FileText,     c: 'text-sky-600 dark:text-sky-400',       bg: 'bg-sky-50 dark:bg-sky-900/20' },
                      ].map((k, idx) => {
                        const Icon = k.icon;
                        return (
                          <div key={idx} className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 ${k.bg} flex items-center gap-3`}>
                            <Icon className={`w-5 h-5 ${k.c} flex-shrink-0`} />
                            <div>
                              <div className={`text-xl font-black ${k.c}`}>{k.v}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{k.l}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Weighted grade */}
                    {computedGrades ? (
                      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-900/20">
                        <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">Current Weighted Grade</div>
                        <div className="flex items-end gap-3">
                          <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{computedGrades.finalScore}%</span>
                          <div>
                            <span className={cn('inline-block px-2 py-1 rounded-lg text-sm font-black', gradeColor(computedGrades.letterGrade, computedGrades.isPassing))}>{computedGrades.letterGrade}</span>
                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">{computedGrades.gpaPoints.toFixed(1)} grade points</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-indigo-200 dark:bg-indigo-900/40 overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBarColor(computedGrades.finalScore)}`} style={{ width: `${computedGrades.finalScore}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Weighted Grade</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No grades released yet.</p>
                      </div>
                    )}

                    {/* Attendance summary */}
                    {attendanceSummary && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Attendance</div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{attendanceSummary.rate}%</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{attendanceSummary.present}/{attendanceSummary.total} sessions</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${attendanceSummary.rate}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── MY GRADES ────────────────────────────────────────────────── */}
            {activeTab === 'grades' && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Grades & Continuous Assessments</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Read-only · Sourced from verified registers</p>
                  </div>
                  {computedGrades && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Overall Weighted</div>
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{computedGrades.finalScore}%</div>
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold', gradeColor(computedGrades.letterGrade, computedGrades.isPassing))}>
                        {computedGrades.letterGrade} · {computedGrades.gpaPoints.toFixed(1)} GP
                      </span>
                    </div>
                  )}
                </div>

                {/* Blueprint weighted breakdown */}
                {computedGrades && computedGrades.breakdown.length > 0 && (
                  <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-900/10 space-y-3">
                    <h4 className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Blueprint-Weighted Breakdown</h4>
                    <div className="space-y-2.5">
                      {computedGrades.breakdown.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 dark:text-slate-400">{item.weight}% weight</span>
                              <span className="font-black text-indigo-600 dark:text-indigo-400 w-12 text-right">
                                {item.score !== null ? `${item.score}%` : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${item.score !== null ? scoreBarColor(item.score) : 'bg-slate-300 dark:bg-slate-600'}`}
                              style={{ width: item.score !== null ? `${item.score}%` : '0%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                  {/* Grades table */}
                  <div className="lg:col-span-3">
                    {offeringGrades.length === 0 ? (
                      <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                        <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No grades released yet</p>
                        <p className="text-xs text-slate-400 mt-1">Your teacher has not yet published grades for this course.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                              {['Assessment', 'Score', 'Max', '%', 'Grade', 'Comments'].map(h => (
                                <th key={h} className="px-4 py-3 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {offeringGrades.map((g: any, idx: number) => {
                              const pct = g.percentage ?? (g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : g.score ?? 0);
                              const { letterGrade, isPassing } = resolveGrade(pct, gradingRules);
                              return (
                                <tr key={g.id} className={cn('hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors', idx % 2 !== 0 && 'bg-slate-50/40 dark:bg-slate-900/20')}>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-slate-900 dark:text-white">{g.title || g.assessmentType || 'Assessment'}</p>
                                    {g.assessmentType && g.title && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{g.assessmentType}</p>}
                                  </td>
                                  <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-200">{g.score ?? '—'}</td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{g.maxScore ?? '—'}</td>
                                  <td className="px-4 py-3">
                                    <div className="space-y-1">
                                      <span className="font-black text-indigo-600 dark:text-indigo-400">{pct}%</span>
                                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreBarColor(pct)}`} style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold', gradeColor(letterGrade, isPassing))}>{letterGrade}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 italic max-w-[140px] truncate">{g.teacherComment || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Blueprint weights */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Blueprint Weights</h4>
                    {blueprints.length === 0 ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No blueprint configured.</p>
                    ) : (
                      <div className="space-y-2">
                        {blueprints.map((bp: any) => (
                          <div key={bp.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">{bp.componentName}</span>
                              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">{bp.weightPercentage}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${bp.weightPercentage}%` }} />
                            </div>
                          </div>
                        ))}
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 text-[10px] text-indigo-700 dark:text-indigo-400 font-bold text-center">
                          Total: {blueprints.reduce((s: number, bp: any) => s + bp.weightPercentage, 0)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ASSIGNMENTS ──────────────────────────────────────────────── */}
            {activeTab === 'assignments' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Assignments & Homework</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">View tasks and submit completed work.</p>
                </div>
                {homeworks.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <BookCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No assignments posted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {homeworks.map((hw: any) => {
                      const isDue = hw.dueDate && new Date(hw.dueDate) < new Date();
                      return (
                        <div key={hw.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:shadow-sm transition-all">
                          <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-2">
                                <h4 className="font-black text-slate-900 dark:text-white text-sm">{hw.title}</h4>
                                {isDue && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 flex-shrink-0 mt-0.5">PAST DUE</span>}
                              </div>
                              {hw.instructions && <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{hw.instructions}</p>}
                              {hw.dueDate && (
                                <p className={cn('text-[10px] font-mono font-bold pt-1', isDue ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400')}>
                                  Due: {new Date(hw.dueDate).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {submittingHwId === hw.id ? (
                                <div className="flex items-center gap-2">
                                  <input type="file" onChange={(e) => e.target.files?.[0] && setSubmitFile(e.target.files[0])}
                                    className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
                                  <button onClick={() => handleUpload(hw.id)} disabled={isUploading}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs disabled:opacity-60 transition">
                                    {isUploading ? 'Uploading…' : 'Submit'}
                                  </button>
                                  <button onClick={() => setSubmittingHwId(null)}
                                    className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => { setSubmittingHwId(hw.id); setSubmitFile(null); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg font-bold text-xs border border-indigo-200 dark:border-indigo-800/40 transition-all">
                                  <Upload className="w-3.5 h-3.5" />Submit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ATTENDANCE ───────────────────────────────────────────────── */}
            {activeTab === 'attendance' && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Attendance Logs</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your attendance history for this course.</p>
                  </div>
                  {attendanceSummary && (
                    <div className="flex items-center gap-2">
                      {[
                        { l: 'Present', v: attendanceSummary.present, c: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
                        { l: 'Absent',  v: attendanceSummary.absent,  c: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
                        { l: 'Late',    v: attendanceSummary.late,    c: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                        { l: 'Rate',    v: `${attendanceSummary.rate}%`, c: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
                      ].map((s, i) => (
                        <div key={i} className={`px-3 py-1.5 rounded-xl text-center ${s.c}`}>
                          <div className="text-base font-black">{s.v}</div>
                          <div className="text-[9px] font-bold uppercase">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {attendanceRecords.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No attendance records yet</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          {['Date', 'Status', 'Comments'].map(h => (
                            <th key={h} className="px-4 py-3 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {attendanceRecords.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{r.date}</td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px]', attendanceBadgeClass(r.recordStatus))}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {r.recordStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 italic">{r.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── MATERIALS ────────────────────────────────────────────────── */}
            {activeTab === 'resources' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Lesson Plans & Materials</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approved lesson plans from your teacher.</p>
                </div>
                {lessonPlans.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No materials uploaded yet</p>
                    <p className="text-xs text-slate-400 mt-1">Contact your teacher for additional course materials.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessonPlans.map((lp: any) => (
                      <div key={lp.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-sky-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{lp.title}</h4>
                            {lp.objectives && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">{lp.objectives}</p>}
                            {lp.teachingMethod && <p className="text-[10px] text-slate-400 mt-1"><span className="font-bold">Method:</span> {lp.teachingMethod}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANNOUNCEMENTS ─────────────────────────────────────────────── */}
            {activeTab === 'announcements' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Course Announcements</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Updates and notices from your school and faculty.</p>
                </div>
                {announcements.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a: any) => (
                      <div key={a.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{a.title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DISCUSSION ───────────────────────────────────────────────── */}
            {activeTab === 'messages' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Discussion & Notifications</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Messages and updates from faculty.</p>
                </div>
                {announcements.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a: any) => (
                      <div key={a.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{a.title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS ────────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Study Analytics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your performance summary for {selectedOffering.subject?.name}.</p>
                </div>
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l: 'Attendance Rate', v: attendanceSummary ? `${attendanceSummary.rate}%` : '—', icon: CheckCircle2, c: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40' },
                    { l: 'Weighted Score',  v: computedGrades ? `${computedGrades.finalScore}%` : '—', icon: Target,       c: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/40' },
                    { l: 'Grade Entries',   v: offeringGrades.length,                                  icon: Award,        c: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40' },
                    { l: 'Letter Grade',    v: computedGrades?.letterGrade ?? '—',                     icon: Star,         c: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' },
                  ].map((k, i) => {
                    const Icon = k.icon;
                    return (
                      <div key={i} className={`p-5 rounded-xl border ${k.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${k.c}`} />
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{k.l}</span>
                        </div>
                        <div className={`text-2xl font-black ${k.c}`}>{k.v}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Grade bars */}
                {offeringGrades.length > 0 && (
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">Grade Breakdown</h4>
                    <div className="space-y-2.5">
                      {offeringGrades.map((g: any) => {
                        const pct = g.percentage ?? (g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : g.score ?? 0);
                        return (
                          <div key={g.id} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-40 truncate flex-shrink-0">{g.title || g.assessmentType || 'Assessment'}</span>
                            <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBarColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 w-10 text-right text-xs">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Attendance breakdown */}
                {attendanceSummary && (
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3">Attendance Breakdown</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { l: 'Present', v: attendanceSummary.present, c: 'bg-emerald-500' },
                        { l: 'Absent',  v: attendanceSummary.absent,  c: 'bg-rose-500' },
                        { l: 'Late',    v: attendanceSummary.late,    c: 'bg-amber-500' },
                      ].map((s, i) => {
                        const pct = attendanceSummary.total > 0 ? Math.round((s.v / attendanceSummary.total) * 100) : 0;
                        return (
                          <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                            <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{s.l}</div>
                            <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${s.c}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
