'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSection } from '@/providers/SectionContext';
import { SectionSubNav } from '@/components/shared/layout/SectionSubNav';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import {
  useTranscriptEngine,
  TranscriptMode,
  type CourseRecord,
} from '@/hooks/useTranscriptEngine';
import {
  FileBadge, Search, Printer, RefreshCw, Download,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  BookOpen, Award, ShieldCheck, ShieldAlert, QrCode,
  Clock, TrendingUp, Users, Layers, GraduationCap, ScrollText,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Section type icon/color map
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  general: 'text-indigo-600 dark:text-indigo-400',
  quran:   'text-emerald-600 dark:text-emerald-400',
  islamic: 'text-amber-600 dark:text-amber-400',
  language:'text-blue-600 dark:text-blue-400',
  stem:    'text-violet-600 dark:text-violet-400',
  arts:    'text-rose-600 dark:text-rose-400',
  sports:  'text-orange-600 dark:text-orange-400',
  other:   'text-slate-600 dark:text-slate-400',
};
const SECTION_BG: Record<string, string> = {
  general: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  quran:   'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  islamic: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  language:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  stem:    'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  arts:    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
  sports:  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  other:   'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800',
};

// ─────────────────────────────────────────────────────────────────────────────
// Grade badge color
// ─────────────────────────────────────────────────────────────────────────────
function gradeColor(letter: string, isPassing: boolean) {
  if (!isPassing) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
  if (letter.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (letter.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  if (letter.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
}

function statusBadge(gradebookStatus: string) {
  if (gradebookStatus === 'Approved' || gradebookStatus === 'Released') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (gradebookStatus === 'Submitted' || gradebookStatus === 'Verified') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// Clearance Row
// ─────────────────────────────────────────────────────────────────────────────
function ClearanceRow({ dept }: { dept: { pass: boolean; label: string; detail: string } }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border text-xs',
      dept.pass
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 text-rose-800 dark:text-rose-300'
    )}>
      {dept.pass
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <XCircle className="w-4 h-4 shrink-0" />}
      <div className="min-w-0">
        <p className="font-bold truncate">{dept.label}</p>
        <p className="text-[10px] opacity-80 truncate mt-0.5">{dept.detail}</p>
      </div>
      <span className={cn(
        'ml-auto shrink-0 px-2 py-0.5 rounded-full font-black text-[9px] uppercase',
        dept.pass
          ? 'bg-emerald-600 text-white'
          : 'bg-rose-600 text-white'
      )}>
        {dept.pass ? 'PASS' : 'BLOCKED'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Course table row — with expandable blueprint breakdown
// ─────────────────────────────────────────────────────────────────────────────
function CourseRow({ course, idx }: { course: CourseRecord; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={cn(
        'transition-colors',
        idx % 2 === 0
          ? 'bg-white dark:bg-slate-950'
          : 'bg-slate-50/60 dark:bg-slate-900/40',
        !course.isPassing && 'bg-rose-50/40 dark:bg-rose-950/20'
      )}>
        <td className="px-4 py-2.5 text-left">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white text-xs">{course.subjectName}</span>
            {course.subjectCode && (
              <span className="text-[10px] font-mono text-slate-400">{course.subjectCode}</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {course.gradeLevel}
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          {course.creditHours}
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
          {course.finalScore > 0 ? `${course.finalScore}%` : <span className="text-slate-300 dark:text-slate-600">—</span>}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black min-w-[28px]',
            gradeColor(course.letterGrade, course.isPassing)
          )}>
            {course.finalScore > 0 ? course.letterGrade : '—'}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
          {course.finalScore > 0 ? course.gpaPoints.toFixed(1) : '—'}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={cn(
            'inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase',
            statusBadge(course.gradebookStatus)
          )}>
            {course.gradebookStatus}
          </span>
        </td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden print:hidden xl:table-cell">
          {course.teacherName}
        </td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden print:hidden lg:table-cell">
          {course.academicTerm} {course.academicYear}
        </td>
        {course.componentBreakdown.length > 0 && (
          <td className="px-2 py-2.5 text-center print:hidden">
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              title="View assessment breakdown"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </td>
        )}
        {course.componentBreakdown.length === 0 && <td />}
      </tr>
      {expanded && course.componentBreakdown.length > 0 && (
        <tr className="print:hidden">
          <td colSpan={10} className="px-4 pb-3 pt-0">
            <div className="flex flex-wrap gap-2 ml-4">
              {course.componentBreakdown.map((comp: { label: string; score: number | null; weight: number }) => (
                <div key={comp.label} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-[10px]">
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
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TranscriptsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const { user } = useAuth();
  const { transcriptData, isLoading: engineLoading, error, buildTranscript } = useTranscriptEngine();

  // Student list state
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Transcript mode & filters
  const [mode, setMode] = useState<TranscriptMode>('combined');
  const [filterYearDoc, setFilterYearDoc] = useState('');
  const [filterTermDoc, setFilterTermDoc] = useState('');

  // Available years & terms from student enrollments
  const [availableYears, setAvailableYears] = useState<{ documentId: string; name: string }[]>([]);
  const [availableTerms, setAvailableTerms] = useState<{ documentId: string; name: string }[]>([]);

  // Archive modal
  const [isArchiving, setIsArchiving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (docId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  // School profile
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  // ── Fetch school profile once ──
  useEffect(() => {
    apiClient.get('/school-profile', { params: { populate: ['logo'] } })
      .then(r => setSchoolProfile(r.data?.data ?? null))
      .catch(() => {});
  }, []);

  // ── Fetch student list: current section + all other sections this head manages ─────
  useEffect(() => {
    if (!sectionId) return;
    setStudentsLoading(true);

    // We load students from the current section first, then also check if the
    // authenticated user manages other sections (as academicHead) and merge those students in.
    const fetchCurrentSection = apiClient.get('/student-enrollments', {
      params: {
        filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
        populate: ['student.user', 'student.photo', 'courseOffering.academicYear', 'courseOffering.academicTerm'],
        pagination: { limit: 500 },
      },
    });

    // Also fetch students from other sections managed by the same academic head,
    // so the combined transcript shows a student even if they're listed under a sibling section.
    // We identify sibling sections by looking at the section's academicHead teacher.
    const fetchSiblingStudents = user?.profile?.documentId
      ? apiClient.get('/student-enrollments', {
          params: {
            filters: {
              courseOffering: {
                academicSection: {
                  academicHead: { documentId: { $eq: user.profile.documentId } },
                },
              },
            },
            populate: ['student.user', 'student.photo', 'courseOffering.academicYear', 'courseOffering.academicTerm', 'courseOffering.academicSection'],
            pagination: { limit: 1000 },
          },
        }).catch(() => ({ data: { data: [] } }))
      : Promise.resolve({ data: { data: [] } });

    Promise.all([fetchCurrentSection, fetchSiblingStudents])
      .then(([res, sibRes]) => {
        const seenDocIds = new Set<string>();
        const studentList: any[] = [];
        const yearMap = new Map<string, { documentId: string; name: string }>();
        const termMap = new Map<string, { documentId: string; name: string }>();

        const allEnrollments = [
          ...(res.data?.data || []),
          ...(sibRes.data?.data || []),
        ];

        allEnrollments.forEach((enr: any) => {
          const s = enr.student;
          if (s?.documentId && !seenDocIds.has(s.documentId)) {
            seenDocIds.add(s.documentId);
            studentList.push({
              id: s.id,
              documentId: s.documentId,
              firstName: s.firstName || s.user?.firstName || 'Unknown',
              lastName: s.lastName || s.user?.lastName || '',
              schoolId: s.schoolId || s.admissionNumber || '',
              admissionNumber: s.admissionNumber || '',
              enrollmentStatus: s.enrollmentStatus,
              gender: s.gender,
              dateOfBirth: s.dateOfBirth,
              nationality: s.nationality,
              photo: s.photo,
            });
          }
          const yr = enr.courseOffering?.academicYear;
          const tm = enr.courseOffering?.academicTerm;
          if (yr?.documentId) yearMap.set(yr.documentId, { documentId: yr.documentId, name: yr.name });
          if (tm?.documentId) termMap.set(tm.documentId, { documentId: tm.documentId, name: tm.name });
        });

        setStudents(studentList);
        setAvailableYears(Array.from(yearMap.values()));
        setAvailableTerms(Array.from(termMap.values()));
      }).catch(() => {
        toast.error('Failed to load student list.');
      }).finally(() => setStudentsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, user?.profile?.documentId]);


  // ── Build transcript when student or mode changes ─────────────────────────
  useEffect(() => {
    if (!selectedStudent) return;
    buildTranscript(
      selectedStudent.documentId,
      mode,
      filterYearDoc || undefined,
      filterTermDoc || undefined,
      sectionId,
    );
  }, [selectedStudent, mode, filterYearDoc, filterTermDoc, sectionId, buildTranscript]);

  // ── Filtered student list ─────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.schoolId && s.schoolId.toLowerCase().includes(q)) ||
      (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // ── Generate & Archive transcript ─────────────────────────────────────────
  const handleGenerateAndArchive = useCallback(async () => {
    if (!selectedStudent || !transcriptData) return;
    if (transcriptData.clearance.overallBlocked) {
      toast.error('Cannot generate official transcript. Active clearance holds must be resolved first.');
      return;
    }
    setIsArchiving(true);
    try {
      // Determine next version number
      const nextVersion = (transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1;
      const dataSnapshot = {
        mode,
        studentDocId: selectedStudent.documentId,
        generatedAt: new Date().toISOString(),
        summary: transcriptData.summary,
        sectionBlocks: transcriptData.sectionBlocks,
      };

      // Archive to academic-transcripts
      const transcriptNumber = `TRX-${selectedStudent.schoolId || selectedStudent.admissionNumber}-${nextVersion.toString().padStart(3, '0')}`;
      await apiClient.post('/academic-transcripts', {
        data: {
          transcriptNumber,
          verificationID: transcriptData.summary.verificationHash,
          dataSnapshot,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Published',
          version: nextVersion,
          hash: transcriptData.summary.verificationHash,
          registrar: (user as any)?.username || 'Registrar',
          student: selectedStudent.documentId,
        },
      });

      // Save to transcript-versions
      await apiClient.post('/transcript-versions', {
        data: {
          versionNumber: nextVersion,
          sha256Hash: transcriptData.summary.verificationHash,
          issuedDate: new Date().toISOString().split('T')[0],
          reason: `Official ${mode} transcript generated`,
          recordStatus: 'Active',
          student: selectedStudent.documentId,
          issuedBy: user?.id,
        },
      });

      // Audit log
      apiClient.post('/audit-logs', {
        data: {
          action: 'Transcript Generated',
          entity: 'AcademicTranscript',
          entityId: selectedStudent.documentId,
          description: `Official ${mode} transcript generated for ${selectedStudent.firstName} ${selectedStudent.lastName} (v${nextVersion}). Hash: ${transcriptData.summary.verificationHash}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString(),
        },
      }).catch(console.warn);

      toast.success(`Official transcript v${nextVersion} archived successfully!`);
      // Refresh transcript data to show new version
      await buildTranscript(selectedStudent.documentId, mode, filterYearDoc || undefined, filterTermDoc || undefined, sectionId);
    } catch (err: any) {
      console.error('Archive error:', err?.response?.data || err);
      toast.error('Failed to archive transcript. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  }, [selectedStudent, transcriptData, mode, filterYearDoc, filterTermDoc, sectionId, user, buildTranscript]);

  // ── Print handler — generates clean data-driven HTML in isolated popup ─────────
  // We build the entire transcript HTML from transcriptData state with 100% inline
  // styles — NOT from innerHTML — so Tailwind classes / dark mode never interfere.
  const handlePrint = useCallback(() => {
    if (transcriptData?.clearance.overallBlocked) {
      toast.error('Cannot print transcript. Active holds must be resolved first.');
      return;
    }
    if (!transcriptData || !selectedStudent) {
      toast.error('Transcript data not ready yet.');
      return;
    }

    const schoolName   = schoolProfile?.name ?? 'Yahaya International Islamic and English High School';
    const schoolAddr   = schoolProfile?.address      ?? '';
    const schoolAccred = schoolProfile?.accreditation ?? '';
    // Use the static school logo from /public (same origin → loads correctly in popup)
    const logoUrl = `${window.location.origin}/yahaya-logo.jpeg`;
    const studentName  = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    const today        = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Helper: grade badge colour ────────────────────────────────────────────
    const gradeColour = (letter: string, pass: boolean) => {
      if (!pass)               return 'background:#fee2e2;color:#991b1b';
      if (letter.startsWith('A')) return 'background:#d1fae5;color:#065f46';
      if (letter.startsWith('B')) return 'background:#dbeafe;color:#1e40af';
      if (letter.startsWith('C')) return 'background:#fef3c7;color:#92400e';
      return 'background:#ffedd5;color:#9a3412';
    };

    const statusColour = (gs: string) => {
      if (gs === 'Approved' || gs === 'Released') return 'background:#d1fae5;color:#065f46';
      if (gs === 'Submitted' || gs === 'Verified') return 'background:#fef3c7;color:#92400e';
      return 'background:#f1f5f9;color:#475569';
    };

    // ── Section blocks HTML ───────────────────────────────────────────────────
    const blocksHtml = transcriptData.sectionBlocks.map(block => {
      const rowsHtml = block.courses.map((course: CourseRecord) => `
        <tr>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0">
            <div style="font-weight:700;font-size:8.5pt">${course.subjectName}</div>
            <div style="font-size:7pt;color:#64748b;font-family:monospace">${course.subjectCode}</div>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:8pt;color:#475569">${course.gradeLevel ?? ''}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.creditHours}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:#4338ca">${course.finalScore !== null ? `${course.finalScore}%` : '—'}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7.5pt;font-weight:700;${gradeColour(course.letterGrade, course.isPassing)}">${course.letterGrade}</span>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.gpaPoints.toFixed(1)}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7pt;font-weight:700;${statusColour(course.gradebookStatus)}">${course.gradebookStatus.toUpperCase()}</span>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:7.5pt;color:#64748b">${[course.academicTerm, course.academicYear].filter(Boolean).join(' · ')}</td>
        </tr>
      `).join('');

      return `
      <div class="section-block" style="margin-top:14px;page-break-inside:avoid">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:7px 12px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1e293b">${block.sectionName}</span>
          <span style="font-size:7.5pt;color:#64748b">
            ${block.courses.length} course${block.courses.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
            Credits: <strong>${block.creditsAttempted}</strong> &nbsp;|&nbsp;
            GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong>
          </span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:2px;border:1px solid #e2e8f0;border-top:none">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Subject</th>
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Level</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Cr</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#4338ca">Score</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Grade</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">GP</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Status</th>
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Period</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:5px 12px;font-size:7.5pt;color:#475569;display:flex;gap:16px">
          <span>Section GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong></span>
          <span>Credits Earned: <strong>${block.creditsEarned}/${block.creditsAttempted}</strong></span>
          <span style="color:#059669">Passed: ${block.passCount}</span>
          ${block.failCount > 0 ? `<span style="color:#e11d48">Failed: ${block.failCount}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    // ── Student info rows ─────────────────────────────────────────────────────
    const infoFields = [
      ['Full Name',         studentName],
      ['Admission No.',     selectedStudent.admissionNumber || selectedStudent.schoolId || 'N/A'],
      ['Student ID',        selectedStudent.schoolId || 'N/A'],
      ['Gender',            selectedStudent.gender ?? ''],
      ['Date of Birth',     selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB') : ''],
      ['Nationality',       selectedStudent.nationality ?? ''],
      ['Enrollment Status', selectedStudent.enrollmentStatus ?? ''],
      ['Transcript Type',   mode.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())],
    ].filter(([, v]) => v).map(([label, value]) => `
      <td style="padding:6px 10px;vertical-align:top;border-right:1px solid #e2e8f0;width:25%">
        <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:2px">${label}</div>
        <div style="font-size:9pt;font-weight:700;color:#0f172a">${value}</div>
      </td>
    `);
    // Group into rows of 4 cells
    const infoRows: string[] = [];
    for (let i = 0; i < infoFields.length; i += 4) {
      const cells = infoFields.slice(i, i + 4);
      while (cells.length < 4) cells.push('<td style="padding:6px 10px;width:25%"></td>');
      infoRows.push(`<tr>${cells.join('')}</tr>`);
    }

    // ── KPI summary ───────────────────────────────────────────────────────────
    const kpis = [
      { label: 'Cumulative GPA',  value: transcriptData.summary.cgpa.toFixed(2),      color: '#4338ca', big: true },
      { label: 'Credits Earned',  value: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, color: '#059669', big: false },
      { label: 'Courses Passed',  value: `${transcriptData.summary.passedCourses}`,   color: '#059669', big: false },
      { label: 'Courses Failed',  value: `${transcriptData.summary.failedCourses}`,   color: transcriptData.summary.failedCourses > 0 ? '#e11d48' : '#64748b', big: false },
    ];
    const kpiHtml = kpis.map(k => `
      <td style="padding:0;vertical-align:top;width:25%">
        <div style="border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px;margin:0 4px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8">${k.label}</div>
          <div style="font-size:${k.big ? '20pt' : '14pt'};font-weight:900;color:${k.color};margin-top:4px">${k.value}</div>
        </div>
      </td>
    `).join('');

    // ── Full HTML ─────────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Official Transcript — ${studentName}</title>
<style>
  @page { size:A4 portrait; margin:14mm 12mm; }
  *     { box-sizing:border-box; margin:0; padding:0; }
  body  { font-family:'Outfit',system-ui,sans-serif; font-size:9.5pt; color:#0f172a; background:#fff;
          -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  table { width:100%; border-collapse:collapse; }
  button, .no-print { display:none!important; }
  .page-break { page-break-before:always; }
</style>
</head>
<body style="padding:0">
<div style="max-width:100%;padding:4px 0">

  <!-- ═══ HEADER ═════════════════════════════════════════════════════ -->
  <div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:2.5px solid #0f172a;margin-bottom:14px">
    <!-- Logo -->
    <div style="width:72px;height:72px;flex-shrink:0;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f8fafc">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="School Logo" style="width:100%;height:100%;object-fit:contain"/>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
      }
    </div>

    <!-- School details -->
    <div style="flex:1">
      <div style="font-size:16pt;font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;color:#0f172a">${schoolName}</div>
      ${schoolAddr   ? `<div style="font-size:8pt;color:#64748b;margin-top:2px">${schoolAddr}</div>` : ''}
      ${schoolAccred ? `<div style="font-size:7.5pt;color:#94a3b8;font-style:italic;margin-top:1px">${schoolAccred}</div>` : ''}
      <div style="margin-top:6px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4338ca">
        Official Academic Transcript of Record
      </div>
    </div>

    <!-- Ref / Date -->
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:7.5pt;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Transcript Ref.</div>
      <div style="font-family:monospace;font-size:8pt;font-weight:700;color:#4338ca;margin-top:2px">${transcriptData.summary.verificationHash.slice(0,12).toUpperCase()}</div>
      <div style="font-size:7.5pt;color:#64748b;margin-top:4px">${today}</div>
    </div>
  </div>

  <!-- ═══ STUDENT INFO ════════════════════════════════════════════════ -->
  <table style="width:100%;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:14px">
    <tbody style="background:#fafafa">
      ${infoRows.join('')}
    </tbody>
  </table>

  <!-- ═══ SECTION BLOCKS ══════════════════════════════════════════════ -->
  ${blocksHtml}

  <!-- ═══ OVERALL SUMMARY ═════════════════════════════════════════════ -->
  <div style="margin-top:18px;padding-top:12px;border-top:2.5px solid #0f172a">
    <div style="font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;margin-bottom:10px">
      &#9654; Overall Academic Summary
    </div>

    <!-- KPI row -->
    <table style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:10px">
      <tbody><tr style="vertical-align:top">${kpiHtml}</tr></tbody>
    </table>

    <!-- Standing + Verification (with QR Code) -->
    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-bottom:12px">
      <tbody><tr style="vertical-align:top">

        <!-- Academic Standing -->
        <td style="width:38%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:3px">Academic Standing</div>
          <div style="font-size:11pt;font-weight:800;color:#0f172a">${transcriptData.summary.academicStanding}</div>
          <div style="font-size:8.5pt;font-weight:700;margin-top:4px;color:${transcriptData.summary.isEligibleForGraduation ? '#059669' : '#d97706'}">
            ${transcriptData.summary.isEligibleForGraduation ? '&#10003; Eligible for Graduation' : '&#9888; Graduation Eligibility Pending'}
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">
            <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:2px">Verification Hash</div>
            <div style="font-family:monospace;font-size:7pt;color:#334155;word-break:break-all;line-height:1.5">${transcriptData.summary.verificationHash}</div>
            <div style="font-size:7pt;color:#94a3b8;margin-top:4px">
              Version ${(transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1} &nbsp;&middot;&nbsp; ${today}
            </div>
          </div>
        </td>

        <!-- QR Code Verification Panel -->
        <td style="width:62%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:8px">
            Digital Verification &nbsp;&mdash;&nbsp; Scan QR to Verify Authenticity
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">

            <!-- QR Code Image -->
            <div style="flex-shrink:0;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:4px">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                  `YAHAYASCOOL TRANSCRIPT VERIFICATION\nStudent: ${studentName}\nID: ${selectedStudent.schoolId || selectedStudent.admissionNumber || 'N/A'}\nCGPA: ${transcriptData.summary.cgpa.toFixed(2)}\nHash: ${transcriptData.summary.verificationHash}\nDate: ${today}\nVerify: ${window.location.origin}/verify/transcript/${transcriptData.summary.verificationHash.slice(0,12)}`
                )}"
                alt="Transcript Verification QR Code"
                width="110"
                height="110"
                style="display:block;border-radius:4px"
              />
            </div>

            <!-- Verification Details -->
            <div style="flex:1;min-width:0">
              <table style="width:100%;border-collapse:collapse;font-size:8pt">
                <tr>
                  <td style="padding:3px 0;vertical-align:top;width:40%">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student Name</div>
                    <div style="font-weight:800;color:#0f172a;font-size:9pt">${studentName}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student ID</div>
                    <div style="font-weight:700;color:#4338ca;font-family:monospace;font-size:9pt">${selectedStudent.schoolId || selectedStudent.admissionNumber || 'N/A'}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Admission No.</div>
                    <div style="font-weight:700;color:#0f172a;font-family:monospace">${selectedStudent.admissionNumber || 'N/A'}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Cumulative GPA</div>
                    <div style="font-weight:900;color:#4338ca;font-size:11pt">${transcriptData.summary.cgpa.toFixed(2)}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Transcript Reference</div>
                    <div style="font-weight:700;color:#0f172a;font-family:monospace;font-size:8pt">${transcriptData.summary.verificationHash.slice(0,12).toUpperCase()}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:6px;padding:5px 7px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:7pt;color:#166534">
                &#10003;&nbsp; This transcript is cryptographically sealed. Scan the QR code to verify on YAHAYASCOOL Portal.
              </div>
            </div>
          </div>
        </td>

      </tr></tbody>
    </table>

    <!-- Signatures -->
    <table style="width:100%;border-collapse:separate;border-spacing:16px 0;margin-top:8px">
      <tbody><tr>
        <td style="width:33%;text-align:center;padding-top:28px;border-top:1.5px solid #94a3b8">
          <div style="font-size:8pt;font-weight:700;color:#475569">Registrar Signature</div>
          <div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div>
        </td>
        <td style="width:34%"></td>
        <td style="width:33%;text-align:center;padding-top:28px;border-top:1.5px solid #94a3b8">
          <div style="font-size:8pt;font-weight:700;color:#475569">Principal Signature</div>
          <div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div>
        </td>
      </tr></tbody>
    </table>

    <!-- Footer note -->
    <div style="text-align:center;font-size:7pt;color:#94a3b8;font-style:italic;margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0">
      This is an official academic transcript generated by the Enterprise Academic ERP.
      Any alteration renders this document void. Verify authenticity using the hash code above.
    </div>
  </div>

</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
      setTimeout(function() { window.close(); }, 1200);
    }, 600);
  };
<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (!win) {
      toast.error('Popup blocked. Please allow popups for this site and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }, [transcriptData, selectedStudent, schoolProfile, section, mode]);

  const isLoading = studentsLoading || sectionLoading;

  return (
    <PageContainer>
      <div className="space-y-5 pb-16 print:p-0 print:m-0 print:border-none print:space-y-0">

        {/* ── Page Header ── */}
        <div className="print:hidden flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-indigo-500" />
              Enterprise Transcript Engine
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Multi-section academic records system for <strong>{section?.name ?? 'this section'}</strong>
            </p>
          </div>
        </div>

        <div className="print:hidden">
          <SectionSubNav activeTab="transcripts" sectionId={sectionId} />
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading ? (
          <div className="print:hidden animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ════════════════════════════════════════════════
                LEFT SIDEBAR — Student List
            ════════════════════════════════════════════════ */}
            <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4 print:hidden shrink-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 sticky top-4 flex flex-col gap-3">

                {/* Search */}
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </div>

                {/* Student list */}
                <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No students found.</p>
                  ) : filteredStudents.map(student => (
                    <button
                      key={student.documentId}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl transition-all border text-xs',
                        selectedStudent?.documentId === student.documentId
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                            {(student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {student.schoolId || student.admissionNumber || 'No ID'}
                          </p>
                        </div>
                        {selectedStudent?.documentId === student.documentId && (
                          <Eye className="w-3.5 h-3.5 text-indigo-500 ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                RIGHT PANEL — Transcript
            ════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 print:w-full">
              {!selectedStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-[500px] text-center p-8 print:hidden">
                  <FileBadge className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select a Student</h3>
                  <p className="text-slate-500 mt-2 max-w-sm text-sm">
                    Choose a student from the list to view their enterprise academic transcript — grouped by academic section with blueprint-weighted GPA.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* ── Controls Bar ── */}
                  <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Type:</label>
                      <select
                        value={mode}
                        onChange={e => setMode(e.target.value as TranscriptMode)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="combined">Official Combined</option>
                        <option value="section">Section-Specific</option>
                        <option value="year">Academic Year</option>
                        <option value="term">Semester/Term</option>
                        <option value="progress">Progress Report</option>
                        <option value="graduation">Graduation Transcript</option>
                      </select>
                    </div>

                    {mode === 'year' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Year:</label>
                        <select
                          value={filterYearDoc}
                          onChange={e => setFilterYearDoc(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">All Years</option>
                          {availableYears.map(y => (
                            <option key={y.documentId} value={y.documentId}>{y.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {mode === 'term' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Term:</label>
                        <select
                          value={filterTermDoc}
                          onChange={e => setFilterTermDoc(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">All Terms</option>
                          {availableTerms.map(t => (
                            <option key={t.documentId} value={t.documentId}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                      {transcriptData && (
                        <button
                          onClick={() => setShowVersions(v => !v)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-bold transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Versions ({transcriptData.transcriptVersions.length})
                        </button>
                      )}
                      <button
                        onClick={handleGenerateAndArchive}
                        disabled={isArchiving || engineLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs rounded-xl font-bold transition-colors"
                      >
                        {isArchiving
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Download className="w-3.5 h-3.5" />}
                        {isArchiving ? 'Archiving...' : 'Generate & Archive'}
                      </button>
                      <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-bold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Official
                      </button>
                    </div>
                  </div>

                  {/* ── Version History Dropdown ── */}
                  {showVersions && transcriptData && transcriptData.transcriptVersions.length > 0 && (
                    <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        Transcript Version History
                      </h4>
                      <div className="space-y-2">
                        {transcriptData.transcriptVersions.map((v: any) => (
                          <div key={v.documentId} className="flex items-center gap-3 text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full font-black text-[9px]',
                              v.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            )}>
                              v{v.versionNumber}
                            </span>
                            <span className="font-mono text-slate-500 flex-1 truncate">{v.sha256Hash}</span>
                            <span className="text-slate-400">{v.issuedDate}</span>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-bold',
                              v.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            )}>
                              {v.recordStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Engine loading ── */}
                  {engineLoading && (
                    <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-12 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <p className="text-sm text-slate-500">Building enterprise transcript from course offerings…</p>
                    </div>
                  )}

                  {error && (
                    <div className="print:hidden bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-400 flex gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {!engineLoading && transcriptData && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">

                      {/* ════════════════════════════════════════
                          CLEARANCE PANEL (screen only)
                      ════════════════════════════════════════ */}
                      <div className="print:hidden p-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                        <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          ERP Clearance Verification
                        </h3>
                        {transcriptData.clearance.overallBlocked && (
                          <div className="flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-black">Transcript Issuance Blocked</p>
                              <p className="mt-0.5 opacity-80">One or more clearance holds are active. Resolve all holds before generating an official transcript.</p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.values(transcriptData.clearance)
                            .filter(v => typeof v === 'object' && v !== null && 'pass' in v)
                            .map((dept: any) => (
                              <ClearanceRow key={dept.label} dept={dept} />
                            ))}
                        </div>
                      </div>

                      {/* ════════════════════════════════════════
                          OFFICIAL TRANSCRIPT DOCUMENT
                      ════════════════════════════════════════ */}
                      <div className="p-8 print:p-6 space-y-8 print:space-y-6">

                        {/* ── Document Header ── */}
                        <div className="border-b-2 border-slate-800 dark:border-slate-200 pb-6 print:pb-4">
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {/* School logo / initial */}
                            <div className="w-20 h-20 shrink-0 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden print:border print:rounded">
                              {schoolProfile?.logo?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={schoolProfile.logo.url} alt="School Logo" className="w-full h-full object-contain" />
                              ) : (
                                <GraduationCap className="w-10 h-10 text-indigo-500" />
                              )}
                            </div>

                            {/* School details */}
                            <div className="flex-1 text-center sm:text-left">
                              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                {schoolProfile?.name ?? section?.name ?? 'School Name'}
                              </h1>
                              {schoolProfile?.address && (
                                <p className="text-xs text-slate-500 mt-1">{schoolProfile.address}</p>
                              )}
                              {schoolProfile?.accreditation && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">{schoolProfile.accreditation}</p>
                              )}
                              <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">
                                Official Academic Transcript of Record
                              </p>
                            </div>

                            {/* QR / Transcript Ref */}
                            <div className="shrink-0 text-right space-y-1 text-xs">
                              <div className="w-16 h-16 ml-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center print:border">
                                <QrCode className="w-10 h-10 text-slate-700 dark:text-slate-300" />
                              </div>
                              <p className="font-mono text-[9px] text-slate-400 break-all">
                                {transcriptData.summary.verificationHash}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500">
                                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ── Student Information ── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/30 print:p-3 print:rounded">
                          <div>
                            <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Full Name</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                              {selectedStudent.firstName} {selectedStudent.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Admission No.</p>
                            <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                              {selectedStudent.admissionNumber || selectedStudent.schoolId || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Student ID</p>
                            <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                              {selectedStudent.schoolId || 'N/A'}
                            </p>
                          </div>
                          {selectedStudent.gender && (
                            <div>
                              <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Gender</p>
                              <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">{selectedStudent.gender}</p>
                            </div>
                          )}
                          {selectedStudent.dateOfBirth && (
                            <div>
                              <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Date of Birth</p>
                              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                                {new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          )}
                          {selectedStudent.nationality && (
                            <div>
                              <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Nationality</p>
                              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedStudent.nationality}</p>
                            </div>
                          )}
                          {selectedStudent.enrollmentStatus && (
                            <div>
                              <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Enrollment Status</p>
                              <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">{selectedStudent.enrollmentStatus}</p>
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Transcript Type</p>
                            <p className="font-bold text-indigo-600 dark:text-indigo-400 capitalize mt-0.5">{mode.replace('-', ' ')}</p>
                          </div>
                          {transcriptData.gpaConfig && (
                            <div>
                              <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">GPA Method</p>
                              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{transcriptData.gpaConfig.creditCalcMethod}</p>
                            </div>
                          )}
                        </div>

                        {/* ── Academic Section Blocks ── */}
                        {transcriptData.sectionBlocks.length === 0 ? (
                          <div className="text-center py-16">
                            <FileBadge className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold">
                              No{mode !== 'progress' ? ' approved' : ''} academic records found for this student
                              {mode === 'year' && filterYearDoc ? ' in this academic year' : ''}
                              {mode === 'term' && filterTermDoc ? ' in this term' : ''}.
                            </p>
                            {mode !== 'progress' && (
                              <p className="text-xs text-slate-400 mt-1">Switch to "Progress Report" mode to view all records including pending grades.</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-8 print:space-y-6">
                            {transcriptData.sectionBlocks.map(block => {
                              const collapsed = collapsedSections.has(block.sectionDocId);
                              const secType = block.sectionType ?? 'general';
                              return (
                                <div key={block.sectionDocId} className="space-y-2">
                                  {/* Section Header */}
                                  <div className={cn(
                                    'flex items-center justify-between px-4 py-3 rounded-xl border print:rounded print:bg-transparent print:border-slate-300',
                                    SECTION_BG[secType] ?? SECTION_BG.other
                                  )}>
                                    <div className="flex items-center gap-2">
                                      <BookOpen className={cn('w-4 h-4', SECTION_COLORS[secType] ?? SECTION_COLORS.other)} />
                                      <h3 className={cn('text-sm font-extrabold uppercase tracking-wider', SECTION_COLORS[secType] ?? SECTION_COLORS.other)}>
                                        {block.sectionName}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      <span>{block.courses.length} course{block.courses.length !== 1 ? 's' : ''}</span>
                                      <span className="hidden sm:inline">·</span>
                                      <span className="hidden sm:inline">Credits: {block.creditsAttempted}</span>
                                      <span className="hidden sm:inline">·</span>
                                      <span className="hidden sm:inline">GPA: {block.sectionGPA.toFixed(2)}</span>
                                      <button
                                        onClick={() => toggleSection(block.sectionDocId)}
                                        className="print:hidden p-1 rounded-lg hover:bg-white/60 transition"
                                      >
                                        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Course Table */}
                                  {!collapsed && (
                                    <>
                                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl print:rounded print:border-slate-300">
                                        <table className="w-full text-left">
                                          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                              <th className="px-4 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center whitespace-nowrap">Level</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">Cr</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-center whitespace-nowrap">Score</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">Grade</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">GP</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center whitespace-nowrap">Status</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap hidden xl:table-cell print:hidden">Teacher</th>
                                              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap hidden lg:table-cell print:hidden">Period</th>
                                              <th className="print:hidden" />
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {block.courses.map((course, idx) => (
                                              <CourseRow key={course.offeringDocId} course={course} idx={idx} />
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Section Summary Bar */}
                                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs print:border-slate-300 print:rounded">
                                        <div className="flex gap-4 font-bold text-slate-600 dark:text-slate-300">
                                          <span className="flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                            Section GPA: <span className="text-indigo-600 dark:text-indigo-400 ml-1">{block.sectionGPA.toFixed(2)}</span>
                                          </span>
                                          <span>Credits Earned: <strong>{block.creditsEarned}/{block.creditsAttempted}</strong></span>
                                          <span className="text-emerald-600 dark:text-emerald-400">Passed: {block.passCount}</span>
                                          {block.failCount > 0 && (
                                            <span className="text-rose-600 dark:text-rose-400">Failed: {block.failCount}</span>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* ════════════════════════════════════════
                                OVERALL SUMMARY
                            ════════════════════════════════════════ */}
                            <div className="pt-6 print:pt-4 border-t-2 border-slate-800 dark:border-slate-200 print:border-slate-800 space-y-6 print:space-y-4">
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-500" />
                                Overall Academic Summary
                              </h3>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
                                {[
                                  { label: 'Cumulative GPA', value: transcriptData.summary.cgpa.toFixed(2), color: 'text-indigo-600 dark:text-indigo-400', big: true },
                                  { label: 'Credits Earned', value: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, color: 'text-emerald-600 dark:text-emerald-400', big: false },
                                  { label: 'Courses Passed', value: `${transcriptData.summary.passedCourses}`, color: 'text-emerald-600 dark:text-emerald-400', big: false },
                                  { label: 'Courses Failed', value: `${transcriptData.summary.failedCourses}`, color: transcriptData.summary.failedCourses > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500', big: false },
                                ].map(kpi => (
                                  <div key={kpi.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 print:p-2 print:rounded print:border-slate-300">
                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                                    <p className={cn('font-black mt-1', kpi.big ? 'text-3xl' : 'text-xl', kpi.color)}>
                                      {kpi.value}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-1.5 print:p-3 print:rounded print:border-slate-300">
                                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Academic Standing</p>
                                  <p className="text-sm font-black text-slate-900 dark:text-white">{transcriptData.summary.academicStanding}</p>
                                  <p className={cn(
                                    'text-xs font-bold mt-1',
                                    transcriptData.summary.isEligibleForGraduation ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                  )}>
                                    {transcriptData.summary.isEligibleForGraduation
                                      ? '✓ Eligible for Graduation'
                                      : '⚠ Graduation Eligibility Pending'}
                                  </p>
                                  {transcriptData.graduationRecord && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      Graduation Record:{' '}
                                      {transcriptData.graduationRecord.graduationDate
                                        ? new Date(transcriptData.graduationRecord.graduationDate).toLocaleDateString('en-GB')
                                        : 'Date not set'}
                                    </p>
                                  )}
                                </div>

                                {/* Digital Verification */}
                                <div className="space-y-3">
                                  <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 print:p-3 print:rounded print:border-slate-300">
                                    <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center print:border-slate-300">
                                      <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Verification Hash</p>
                                      <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all mt-0.5 leading-snug">
                                        {transcriptData.summary.verificationHash}
                                      </p>
                                      <p className="text-[9px] text-slate-400 mt-1">
                                        Version {(transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1} · {new Date().toLocaleDateString('en-GB')}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Signatures */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center text-[10px] pt-6 border-t-2 border-slate-400 dark:border-slate-600 print:border-slate-400">
                                      <p className="font-extrabold text-slate-700 dark:text-slate-300">Registrar Signature</p>
                                      <p className="text-slate-400 mt-0.5">Date: ___________</p>
                                    </div>
                                    <div className="text-center text-[10px] pt-6 border-t-2 border-slate-400 dark:border-slate-600 print:border-slate-400">
                                      <p className="font-extrabold text-slate-700 dark:text-slate-300">Principal Signature</p>
                                      <p className="text-slate-400 mt-0.5">Date: ___________</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Transcript footer */}
                              <p className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-300 italic">
                                This is an official academic transcript generated by the Enterprise Academic ERP.
                                Any alteration renders this document void. Verify authenticity using the hash code above.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
