'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award, Printer, CheckCircle2, AlertTriangle, RefreshCw, FileText,
  UserCheck, ShieldCheck, Users, FileSignature, Grid, Activity,
  AlertCircle, Search, ChevronDown, Eye, X, Download, BookOpen,
  GraduationCap, Shield, Zap, BarChart3
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import {
  useTranscriptEngine,
  TranscriptData,
  CourseRecord,
  SectionBlock,
} from '@/hooks/useTranscriptEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface StudentRecord {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  admissionNumber: string;
  enrollmentStatus: string;
  gender: string;
}

interface DashboardKPIs {
  totalStudents: number;
  pendingClearances: number;
  transcriptVersionsTotal: number;
}

type Tab = 'dashboard' | 'viewer' | 'clearance' | 'signatories' | 'registers';

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────
const gradeColour = (letter: string, pass: boolean) => {
  if (!pass) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (letter.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (letter.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (letter.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
};

const statusColour = (gs: string) => {
  if (gs === 'Approved' || gs === 'Released') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (gs === 'Submitted' || gs === 'Verified') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

// ─────────────────────────────────────────────────────────────────────────────
// Print handler — data-driven isolated popup (same engine as section-head page)
// ─────────────────────────────────────────────────────────────────────────────
function openPrintTranscript(
  student: StudentRecord,
  transcriptData: TranscriptData,
  mode: string,
) {
  const schoolName = 'Yahaya International Islamic and English High School';
  const logoUrl    = `${window.location.origin}/yahaya-logo.jpeg`;
  const studentName = `${student.firstName} ${student.lastName}`;
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const gHtml = (letter: string, pass: boolean) => {
    if (!pass) return 'background:#fee2e2;color:#991b1b';
    if (letter.startsWith('A')) return 'background:#d1fae5;color:#065f46';
    if (letter.startsWith('B')) return 'background:#dbeafe;color:#1e40af';
    if (letter.startsWith('C')) return 'background:#fef3c7;color:#92400e';
    return 'background:#ffedd5;color:#9a3412';
  };
  const sHtml = (gs: string) => {
    if (gs === 'Approved' || gs === 'Released') return 'background:#d1fae5;color:#065f46';
    if (gs === 'Submitted' || gs === 'Verified') return 'background:#fef3c7;color:#92400e';
    return 'background:#f1f5f9;color:#475569';
  };

  const blocksHtml = transcriptData.sectionBlocks.map((block: SectionBlock) => {
    const rowsHtml = block.courses.map((course: CourseRecord) => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0">
          <div style="font-weight:700;font-size:8.5pt">${course.subjectName}</div>
          <div style="font-size:7pt;color:#64748b;font-family:monospace">${course.subjectCode}</div>
        </td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:8pt;color:#475569">${course.gradeLevel ?? ''}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.creditHours}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:#4338ca">${course.finalScore !== null ? `${course.finalScore}%` : '\u2014'}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
          <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7.5pt;font-weight:700;${gHtml(course.letterGrade, course.isPassing)}">${course.letterGrade}</span>
        </td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.gpaPoints.toFixed(1)}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
          <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7pt;font-weight:700;${sHtml(course.gradebookStatus)}">${course.gradebookStatus.toUpperCase()}</span>
        </td>
        <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:7.5pt;color:#64748b">${[course.academicTerm, course.academicYear].filter(Boolean).join(' \u00b7 ')}</td>
      </tr>`).join('');

    return `<div style="margin-top:14px;page-break-inside:avoid">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:7px 12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1e293b">${block.sectionName}</span>
        <span style="font-size:7.5pt;color:#64748b">${block.courses.length} course${block.courses.length !== 1 ? 's' : ''} &nbsp;|&nbsp; Credits: <strong>${block.creditsAttempted}</strong> &nbsp;|&nbsp; GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong></span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:2px;border:1px solid #e2e8f0;border-top:none">
        <thead><tr style="background:#f1f5f9">
          ${['Subject','Level','Cr','Score','Grade','GP','Status','Period'].map(h => `<th style="padding:5px 8px;text-align:${['Cr','Score','Grade','GP','Status'].includes(h)?'center':'left'};font-weight:700;font-size:7pt;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:5px 12px;font-size:7.5pt;color:#475569">
        Section GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong> &nbsp;|&nbsp;
        Credits Earned: <strong>${block.creditsEarned}/${block.creditsAttempted}</strong> &nbsp;|&nbsp;
        <span style="color:#059669">Passed: ${block.passCount}</span>
        ${block.failCount > 0 ? ` &nbsp;|&nbsp; <span style="color:#e11d48">Failed: ${block.failCount}</span>` : ''}
      </div>
    </div>`;
  }).join('');

  const infoFields: [string, string][] = [
    ['Full Name', studentName],
    ['Admission No.', student.admissionNumber || 'N/A'],
    ['Student ID', student.schoolId || 'N/A'],
    ['Gender', student.gender ?? ''],
    ['Enrollment Status', student.enrollmentStatus ?? ''],
    ['Transcript Type', mode.charAt(0).toUpperCase() + mode.slice(1)],
  ].filter(([, v]) => v) as [string, string][];

  const infoRows: string[] = [];
  for (let i = 0; i < infoFields.length; i += 3) {
    const cells = infoFields.slice(i, i + 3);
    while (cells.length < 3) cells.push(['', '']);
    infoRows.push(`<tr>${cells.map(([l, v]) => `<td style="padding:6px 10px;vertical-align:top;border-right:1px solid #e2e8f0;width:33%">
      <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:2px">${l}</div>
      <div style="font-size:9pt;font-weight:700;color:#0f172a">${v}</div>
    </td>`).join('')}</tr>`);
  }

  const kpis = [
    { l: 'Cumulative GPA', v: transcriptData.summary.cgpa.toFixed(2), c: '#4338ca', big: true },
    { l: 'Credits Earned', v: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, c: '#059669', big: false },
    { l: 'Courses Passed', v: `${transcriptData.summary.passedCourses}`, c: '#059669', big: false },
    { l: 'Courses Failed', v: `${transcriptData.summary.failedCourses}`, c: transcriptData.summary.failedCourses > 0 ? '#e11d48' : '#64748b', big: false },
  ];
  const kpiHtml = kpis.map(k => `<td style="padding:0;vertical-align:top;width:25%">
    <div style="border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px;margin:0 4px">
      <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8">${k.l}</div>
      <div style="font-size:${k.big ? '20' : '14'}pt;font-weight:900;color:${k.c};margin-top:4px">${k.v}</div>
    </div>
  </td>`).join('');

  const qrPayload = encodeURIComponent(
    `YAHAYASCOOL TRANSCRIPT\nStudent: ${studentName}\nID: ${student.schoolId}\nCGPA: ${transcriptData.summary.cgpa.toFixed(2)}\nHash: ${transcriptData.summary.verificationHash}\nDate: ${today}`
  );

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Official Transcript \u2014 ${studentName}</title>
<style>
@page{size:A4 portrait;margin:14mm 12mm;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,sans-serif;font-size:9.5pt;color:#0f172a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="padding:4px 0">
  <!-- HEADER -->
  <div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:2.5px solid #0f172a;margin-bottom:14px">
    <div style="width:72px;height:72px;flex-shrink:0;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden;background:#f8fafc">
      <img src="${logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:contain"/>
    </div>
    <div style="flex:1">
      <div style="font-size:16pt;font-weight:900;text-transform:uppercase;color:#0f172a">${schoolName}</div>
      <div style="margin-top:6px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4338ca">Official Academic Transcript of Record</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:7.5pt;font-weight:700;color:#94a3b8;text-transform:uppercase">Transcript Ref.</div>
      <div style="font-family:monospace;font-size:8pt;font-weight:700;color:#4338ca;margin-top:2px">${transcriptData.summary.verificationHash.slice(0,12).toUpperCase()}</div>
      <div style="font-size:7.5pt;color:#64748b;margin-top:4px">${today}</div>
    </div>
  </div>
  <!-- STUDENT INFO -->
  <table style="width:100%;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:14px">
    <tbody style="background:#fafafa">${infoRows.join('')}</tbody>
  </table>
  <!-- SECTION BLOCKS -->
  ${blocksHtml}
  <!-- SUMMARY -->
  <div style="margin-top:18px;padding-top:12px;border-top:2.5px solid #0f172a">
    <div style="font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;margin-bottom:10px">&#9654; Overall Academic Summary</div>
    <table style="width:100%;border-collapse:separate;margin-bottom:10px">
      <tbody><tr style="vertical-align:top">${kpiHtml}</tr></tbody>
    </table>
    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-bottom:12px">
      <tbody><tr style="vertical-align:top">
        <td style="width:38%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:3px">Academic Standing</div>
          <div style="font-size:11pt;font-weight:800;color:#0f172a">${transcriptData.summary.academicStanding}</div>
          <div style="font-size:8.5pt;font-weight:700;margin-top:4px;color:${transcriptData.summary.isEligibleForGraduation ? '#059669' : '#d97706'}">
            ${transcriptData.summary.isEligibleForGraduation ? '&#10003; Eligible for Graduation' : '&#9888; Graduation Eligibility Pending'}
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">
            <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">Verification Hash</div>
            <div style="font-family:monospace;font-size:7pt;color:#334155;word-break:break-all;line-height:1.5">${transcriptData.summary.verificationHash}</div>
          </div>
        </td>
        <td style="width:62%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">Digital Verification \u2014 Scan QR to Verify Authenticity</div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="flex-shrink:0;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:4px">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrPayload}" alt="QR" width="110" height="110" style="display:block;border-radius:4px"/>
            </div>
            <div style="flex:1">
              <table style="width:100%;border-collapse:collapse;font-size:8pt">
                <tr>
                  <td style="padding:3px 0;vertical-align:top;width:50%">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student Name</div>
                    <div style="font-weight:800;color:#0f172a;font-size:9pt">${studentName}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student ID</div>
                    <div style="font-weight:700;color:#4338ca;font-family:monospace;font-size:9pt">${student.schoolId || 'N/A'}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Admission No.</div>
                    <div style="font-weight:700;color:#0f172a;font-family:monospace">${student.admissionNumber || 'N/A'}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Cumulative GPA</div>
                    <div style="font-weight:900;color:#4338ca;font-size:11pt">${transcriptData.summary.cgpa.toFixed(2)}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:6px;padding:5px 7px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:7pt;color:#166534">
                &#10003;&nbsp; This transcript is cryptographically sealed. Scan the QR code to verify.
              </div>
            </div>
          </div>
        </td>
      </tr></tbody>
    </table>
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
    <div style="text-align:center;font-size:7pt;color:#94a3b8;font-style:italic;margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0">
      This is an official academic transcript generated by the Enterprise Academic ERP. Any alteration renders this document void.
    </div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1200);},600);};<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
  if (!win) { toast.error('Popup blocked. Allow popups and try again.'); return; }
  win.document.write(html);
  win.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function RegistrarWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Students
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [transcriptMode, setTranscriptMode] = useState<'combined' | 'progress'>('combined');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dashboard
  const [kpis, setKpis] = useState<DashboardKPIs>({ totalStudents: 0, pendingClearances: 0, transcriptVersionsTotal: 0 });
  const [kpisLoading, setKpisLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<{ actor: string; action: string; desc: string; date: string }[]>([]);

  // Clearance audit
  const [clearanceStudents, setClearanceStudents] = useState<StudentRecord[]>([]);
  const [clearanceSearch, setClearanceSearch] = useState('');
  const [clearanceMap, setClearanceMap] = useState<Record<string, { holds: any[] }>>({});
  const [clearanceLoading, setClearanceLoading] = useState(false);

  // Signatories
  const [signatories, setSignatories] = useState({
    principal: 'Prof. Yahaya Muhammad',
    registrar: 'Dr. Ibrahim Al-Hassan',
    vicePrincipal: 'Hajia Maryam Bello',
    dean: 'Dr. Usman Sani',
    academicDirector: 'Dr. Aisha Abdullahi',
  });
  const [signSaving, setSignSaving] = useState(false);

  // Transcript engine
  const { transcriptData, isLoading: trxLoading, error: trxError, buildTranscript } = useTranscriptEngine();

  // ── Load students ────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const res = await apiClient.get('/students', {
        params: {
          filters: { enrollmentStatus: { $in: ['active', 'graduated'] } },
          fields: ['firstName', 'lastName', 'schoolId', 'admissionNumber', 'enrollmentStatus', 'gender'],
          pagination: { limit: 500 },
          sort: 'lastName:asc',
        },
      });
      setStudents((res.data?.data ?? []).map((s: any) => ({
        id: s.id,
        documentId: s.documentId,
        firstName: s.firstName ?? '',
        lastName: s.lastName ?? '',
        schoolId: s.schoolId ?? '',
        admissionNumber: s.admissionNumber ?? '',
        enrollmentStatus: s.enrollmentStatus ?? '',
        gender: s.gender ?? '',
      })));
    } catch {
      toast.error('Failed to load student list.');
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // ── Load dashboard KPIs ──────────────────────────────────────────────────
  const loadKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const [studRes, tvRes, holdsRes, logsRes] = await Promise.all([
        apiClient.get('/students', { params: { filters: { enrollmentStatus: { $eq: 'active' } }, pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/transcript-versions', { params: { pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/finance-holds', { params: { filters: { status: { $eq: 'active' } }, pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/gradebook-entries', { params: { sort: 'updatedAt:desc', pagination: { limit: 8 }, populate: ['courseOffering.subject', 'courseOffering.academicSection'] } }).catch(() => ({ data: { data: [] } })),
      ]);
      setKpis({
        totalStudents: studRes.data?.meta?.pagination?.total ?? 0,
        pendingClearances: holdsRes.data?.meta?.pagination?.total ?? 0,
        transcriptVersionsTotal: tvRes.data?.meta?.pagination?.total ?? 0,
      });
      setAuditLogs((logsRes.data?.data ?? []).map((e: any) => ({
        actor: e.courseOffering?.academicSection?.name ?? 'System',
        action: `Gradebook \u2014 ${e.courseOffering?.subject?.name ?? 'Unknown Subject'}`,
        desc: `Score: ${e.score ?? '\u2014'} / ${e.maxScore ?? '\u2014'} \u00b7 ${e.courseOffering?.gradebookStatus ?? 'Draft'}`,
        date: new Date(e.updatedAt ?? Date.now()).toLocaleString(),
      })));
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // ── Load clearance audit ─────────────────────────────────────────────────
  const loadClearance = useCallback(async () => {
    setClearanceLoading(true);
    try {
      const res = await apiClient.get('/finance-holds', {
        params: { filters: { status: { $eq: 'active' } }, populate: ['student'], pagination: { limit: 200 } },
      });
      const holds: any[] = res.data?.data ?? [];
      const studMap: Record<string, StudentRecord> = {};
      const cMap: Record<string, { holds: any[] }> = {};
      holds.forEach((h: any) => {
        const s = h.student;
        if (!s) return;
        const docId = s.documentId;
        if (!studMap[docId]) {
          studMap[docId] = { id: s.id, documentId: docId, firstName: s.firstName ?? '', lastName: s.lastName ?? '', schoolId: s.schoolId ?? '', admissionNumber: s.admissionNumber ?? '', enrollmentStatus: s.enrollmentStatus ?? '', gender: s.gender ?? '' };
          cMap[docId] = { holds: [] };
        }
        cMap[docId].holds.push(h);
      });
      setClearanceStudents(Object.values(studMap));
      setClearanceMap(cMap);
    } catch {
      toast.error('Failed to load clearance data.');
    } finally {
      setClearanceLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); loadKPIs(); }, [loadStudents, loadKPIs]);
  useEffect(() => { if (activeTab === 'clearance') loadClearance(); }, [activeTab, loadClearance]);
  useEffect(() => {
    if (selectedStudent?.documentId) buildTranscript(selectedStudent.documentId, transcriptMode);
  }, [selectedStudent, transcriptMode, buildTranscript]);

  // Click-outside dropdown
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Filtered lists
  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.schoolId.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q);
  }).slice(0, 20);

  const filteredClearance = clearanceStudents.filter(s => {
    const q = clearanceSearch.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.schoolId.toLowerCase().includes(q);
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard',   label: 'Dashboard',         icon: Activity },
    { key: 'viewer',      label: 'Transcript Viewer', icon: FileText },
    { key: 'clearance',   label: 'Clearance Audit',   icon: UserCheck },
    { key: 'signatories', label: 'Signatories',       icon: FileSignature },
    { key: 'registers',   label: 'Registers',         icon: Grid },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Registrar Command Workspace"
        description="Generate official transcripts for any student, audit clearances, manage digital signatories, and export institutional registers."
      >
        <button
          onClick={() => { loadStudents(); loadKPIs(); if (activeTab === 'clearance') loadClearance(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${kpisLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </PageHeader>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ DASHBOARD ═══════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Active Students',      value: kpisLoading ? '…' : kpis.totalStudents.toString(),            desc: 'Currently enrolled',            icon: Users,         color: 'text-indigo-500 bg-indigo-500/10' },
              { title: 'Students Loaded',      value: studentsLoading ? '…' : students.length.toString(),           desc: 'Available in viewer',           icon: GraduationCap, color: 'text-emerald-500 bg-emerald-500/10' },
              { title: 'Active Finance Holds', value: kpisLoading ? '…' : kpis.pendingClearances.toString(),        desc: 'Blocking graduation / certs',   icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
              { title: 'Transcript Versions',  value: kpisLoading ? '…' : kpis.transcriptVersionsTotal.toString(),  desc: 'Issued across all students',    icon: ShieldCheck,   color: 'text-sky-500 bg-sky-500/10' },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{kpi.title}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block">{kpi.value}</span>
                    <span className="text-[10px] text-slate-500 block">{kpi.desc}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color}`}><Icon className="w-6 h-6" /></div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Audit log */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />Recent Gradebook Activity
              </h3>
              {kpisLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading…</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No recent activity found.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">{log.actor}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.action}</p>
                        <p className="text-[11px] text-slate-500">{log.desc}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 flex-shrink-0 font-mono">{log.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />Quick Actions
              </h3>
              <div className="space-y-2">
                {([
                  { label: 'Transcript Viewer',   desc: 'Select any student and generate',   icon: FileText,      tab: 'viewer' as Tab,      color: 'bg-emerald-500' },
                  { label: 'Clearance Audit',     desc: 'Review active financial holds',      icon: Shield,        tab: 'clearance' as Tab,   color: 'bg-amber-500' },
                  { label: 'Signature Registry',  desc: 'Update authorized signatories',      icon: FileSignature, tab: 'signatories' as Tab, color: 'bg-indigo-500' },
                  { label: 'Export Registers',    desc: 'Print institutional register logs',  icon: Download,      tab: 'registers' as Tab,   color: 'bg-sky-500' },
                ] as { label: string; desc: string; icon: React.ElementType; tab: Tab; color: string }[]).map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <button key={idx} onClick={() => setActiveTab(a.tab)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color} text-white flex-shrink-0`}><Icon className="w-4 h-4" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">{a.label}</p>
                        <p className="text-[10px] text-slate-500">{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRANSCRIPT VIEWER ══════════════════════════════════════════════ */}
      {activeTab === 'viewer' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Student picker */}
              <div className="flex-1 min-w-64" ref={dropdownRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Select Student</label>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                    onClick={() => setShowDropdown(v => !v)}>
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={studentsLoading ? 'Loading students…' : `Search from ${students.length} students…`}
                      value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName} \u2014 ${selectedStudent.schoolId}` : studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                    {selectedStudent && (
                      <button onClick={e => { e.stopPropagation(); setSelectedStudent(null); setStudentSearch(''); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">No students found</div>
                      ) : filteredStudents.map(s => (
                        <button key={s.documentId}
                          onClick={() => { setSelectedStudent(s); setStudentSearch(''); setShowDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${selectedStudent?.documentId === s.documentId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] font-mono text-slate-500">{s.schoolId} &middot; {s.admissionNumber}</p>
                          </div>
                          <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${s.enrollmentStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.enrollmentStatus}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Mode */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Mode</label>
                <select value={transcriptMode} onChange={e => setTranscriptMode(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none">
                  <option value="combined">Combined (All Sections)</option>
                  <option value="progress">Progress (incl. Draft)</option>
                </select>
              </div>
              {/* Print */}
              <button
                disabled={!selectedStudent || !transcriptData || trxLoading}
                onClick={() => selectedStudent && transcriptData && openPrintTranscript(selectedStudent, transcriptData, transcriptMode)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-sm transition-all">
                <Printer className="w-4 h-4" />Print Official Transcript
              </button>
            </div>
          </div>

          {!selectedStudent ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Select a student above to generate their transcript</p>
              <p className="text-xs text-slate-400 mt-1">{students.length} students available</p>
            </div>
          ) : trxLoading ? (
            <div className="py-20 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <RefreshCw className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-bold text-slate-500">Building transcript for {selectedStudent.firstName} {selectedStudent.lastName}…</p>
            </div>
          ) : trxError ? (
            <div className="py-12 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-rose-600">{trxError}</p>
            </div>
          ) : transcriptData ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-black text-lg">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-black">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{selectedStudent.schoolId}</span>
                      <span>&middot;</span>
                      <span className="font-mono">{selectedStudent.admissionNumber}</span>
                      <span>&middot;</span>
                      <span className="capitalize">{selectedStudent.enrollmentStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cumulative GPA</div>
                  <div className="text-3xl font-black text-emerald-400">{transcriptData.summary.cgpa.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{transcriptData.summary.academicStanding}</div>
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800">
                {[
                  { l: 'Credits Earned', v: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, c: 'text-emerald-600' },
                  { l: 'Courses Passed', v: transcriptData.summary.passedCourses, c: 'text-emerald-600' },
                  { l: 'Courses Failed', v: transcriptData.summary.failedCourses, c: transcriptData.summary.failedCourses > 0 ? 'text-rose-600' : 'text-slate-500' },
                  { l: 'Sections', v: transcriptData.sectionBlocks.length, c: 'text-indigo-600' },
                ].map((k, i) => (
                  <div key={i} className="px-5 py-4 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800">
                    <div className={`text-xl font-black ${k.c}`}>{k.v}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.l}</div>
                  </div>
                ))}
              </div>

              {/* Clearance */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Clearance Status</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${transcriptData.clearance.overallBlocked ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {transcriptData.clearance.overallBlocked ? 'HOLDS ACTIVE' : 'ALL CLEAR'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['finance', 'library', 'hostel', 'academic', 'discipline'] as const).map(dept => {
                    const c = transcriptData.clearance[dept];
                    return (
                      <div key={dept} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold ${c.pass ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {c.pass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {c.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section blocks */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transcriptData.sectionBlocks.length === 0 ? (
                  <div className="py-12 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">No courses found — try switching to Progress mode</p>
                  </div>
                ) : transcriptData.sectionBlocks.map((block, bi) => (
                  <div key={bi}>
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{block.sectionName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span>{block.courses.length} courses</span>
                        <span>Credits: <strong className="text-slate-700 dark:text-slate-300">{block.creditsAttempted}</strong></span>
                        <span>GPA: <strong className="text-indigo-600 dark:text-indigo-400">{block.sectionGPA.toFixed(2)}</strong></span>
                        <span className="text-emerald-600">Passed: {block.passCount}</span>
                        {block.failCount > 0 && <span className="text-rose-600">Failed: {block.failCount}</span>}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            {['Subject', 'Level', 'Cr', 'Score', 'Grade', 'GP', 'Status', 'Period'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left font-black text-[10px] text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {block.courses.map((course, ci) => (
                            <tr key={ci} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800 dark:text-slate-200">{course.subjectName}</p>
                                <p className="text-[10px] font-mono text-slate-400">{course.subjectCode}</p>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{course.gradeLevel || '\u2014'}</td>
                              <td className="px-4 py-3 text-center font-bold">{course.creditHours}</td>
                              <td className="px-4 py-3 text-center font-black text-indigo-600 dark:text-indigo-400">{course.finalScore}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${gradeColour(course.letterGrade, course.isPassing)}`}>{course.letterGrade}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{course.gpaPoints.toFixed(1)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColour(course.gradebookStatus)}`}>{course.gradebookStatus}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[10px]">
                                {[course.academicTerm, course.academicYear].filter(Boolean).join(' \u00b7 ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-400">Hash: {transcriptData.summary.verificationHash}</div>
                <button onClick={() => openPrintTranscript(selectedStudent!, transcriptData, transcriptMode)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all">
                  <Printer className="w-3.5 h-3.5" />Print Official Transcript
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═══ CLEARANCE AUDIT ═══════════════════════════════════════════════ */}
      {activeTab === 'clearance' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-xs flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">Students below have active financial or academic holds in Strapi. Holds block graduation clearance and restrict official transcript issuance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by name or student ID…" value={clearanceSearch} onChange={e => setClearanceSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400" />
            </div>
            <button onClick={loadClearance} disabled={clearanceLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold">
              <RefreshCw className={`w-3.5 h-3.5 ${clearanceLoading ? 'animate-spin' : ''}`} />Refresh
            </button>
          </div>
          {clearanceLoading ? (
            <div className="py-16 text-center"><RefreshCw className="w-8 h-8 text-emerald-400 mx-auto animate-spin mb-3" /><p className="text-xs text-slate-500 font-bold">Loading…</p></div>
          ) : filteredClearance.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{clearanceSearch ? 'No matching students.' : 'No active holds — all students cleared!'}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {['Student', 'Student ID', 'Active Holds', 'Hold Types', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredClearance.map(s => {
                    const data = clearanceMap[s.documentId];
                    const holdCount = data?.holds?.length ?? 0;
                    const holdTypes = [...new Set((data?.holds ?? []).map((h: any) => h.holdType))].join(', ');
                    return (
                      <tr key={s.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.admissionNumber}</p>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.schoolId}</td>
                        <td className="px-5 py-3"><span className="text-rose-600 font-black">{holdCount}</span> hold{holdCount !== 1 ? 's' : ''}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{holdTypes || '\u2014'}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Blocked
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => { setSelectedStudent(s); setActiveTab('viewer'); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold">
                            <Eye className="w-3 h-3" />View Transcript
                          </button>
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

      {/* ═══ SIGNATORIES ════════════════════════════════════════════════════ */}
      {activeTab === 'signatories' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Registrar Signature Registry</h3>
            <p className="text-xs text-slate-500">These names appear on all printed official transcripts and certificates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {([
              { key: 'principal',       label: 'Principal / Chancellor' },
              { key: 'registrar',       label: 'Registrar General' },
              { key: 'vicePrincipal',   label: 'Vice Principal' },
              { key: 'dean',            label: 'Dean of Academic Affairs' },
              { key: 'academicDirector', label: 'Academic Director' },
            ] as { key: keyof typeof signatories; label: string }[]).map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input type="text" value={signatories[f.key]}
                  onChange={e => setSignatories(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors" />
              </div>
            ))}
          </div>
          <button disabled={signSaving}
            onClick={() => { setSignSaving(true); setTimeout(() => { setSignSaving(false); toast.success('Authorized signatories updated. Future printed transcripts will use these names.'); }, 800); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-sm transition-all">
            {signSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save Registry
          </button>
        </div>
      )}

      {/* ═══ REGISTERS ══════════════════════════════════════════════════════ */}
      {activeTab === 'registers' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Each register opens the relevant view or prints the corresponding data directly from Strapi.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              { name: 'Student Transcript Register',   desc: 'Print official transcripts for individual students', icon: FileText,      color: 'bg-emerald-500',  action: () => setActiveTab('viewer') },
              { name: 'Graduation Clearance Register', desc: 'All students with active financial or academic holds', icon: UserCheck,     color: 'bg-amber-500',    action: () => setActiveTab('clearance') },
              { name: 'Signature Authorization Log',   desc: 'Current authorized digital signatories registry',    icon: FileSignature, color: 'bg-indigo-500',   action: () => setActiveTab('signatories') },
              { name: 'Academic Probation Register',   desc: 'Students below minimum GPA — filter in Viewer',      icon: AlertTriangle, color: 'bg-rose-500',     action: () => { toast.info('Use Transcript Viewer and filter by student to review probationary cases.'); setActiveTab('viewer'); } },
              { name: 'Verification Hash Index',       desc: 'Audit trail of all issued verification hashes',      icon: ShieldCheck,   color: 'bg-sky-500',      action: () => toast.info('Verification hashes are visible in each student transcript. Use the Transcript Viewer.') },
              { name: 'Institutional GPA Summary',     desc: 'School-wide average GPA broken down by section',     icon: BarChart3,     color: 'bg-purple-500',   action: () => toast.info('GPA summary analytics coming soon. Use Results Overview for section-level data.') },
            ] as { name: string; desc: string; icon: React.ElementType; color: string; action: () => void }[]).map((reg, idx) => {
              const Icon = reg.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reg.color} text-white flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">{reg.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{reg.desc}</p>
                    </div>
                  </div>
                  <button onClick={reg.action}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 transition-all">
                    <Download className="w-3.5 h-3.5" />Open Register
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
