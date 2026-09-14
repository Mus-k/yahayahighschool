'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GradingRule {
  gradeName: string;
  minScore: number;
  maxScore: number;
  gpaPoints: number;
  isPassing: boolean;
  isDistinction: boolean;
}

export interface BlueprintEntry {
  documentId: string;
  componentName: string;
  label: string;
  weightPercentage: number;
}

export interface CourseRecord {
  offeringDocId: string;
  subjectName: string;
  subjectCode: string;
  creditHours: number;
  gradeLevel: string;
  academicYear: string;
  academicTerm: string;
  teacherName: string;
  gradebookStatus: string;
  // Computed
  finalScore: number;          // 0–100 weighted percentage
  letterGrade: string;
  gpaPoints: number;
  isPassing: boolean;
  isDistinction: boolean;
  componentBreakdown: { label: string; score: number | null; weight: number }[];
}

export interface SectionBlock {
  sectionDocId: string;
  sectionName: string;
  sectionType: string;
  courses: CourseRecord[];
  // Computed
  sectionGPA: number;
  creditsEarned: number;
  creditsAttempted: number;
  passCount: number;
  failCount: number;
}

export interface ClearanceStatus {
  finance: { pass: boolean; label: string; detail: string };
  library: { pass: boolean; label: string; detail: string };
  hostel: { pass: boolean; label: string; detail: string };
  academic: { pass: boolean; label: string; detail: string };
  discipline: { pass: boolean; label: string; detail: string };
  graduation: { pass: boolean; label: string; detail: string };
  overallBlocked: boolean;
}

export interface TranscriptSummary {
  cgpa: number;
  creditsAttempted: number;
  creditsEarned: number;
  creditsFailed: number;
  passedCourses: number;
  failedCourses: number;
  academicStanding: string;
  isEligibleForGraduation: boolean;
  verificationHash: string;
}

export interface TranscriptData {
  sectionBlocks: SectionBlock[];
  summary: TranscriptSummary;
  clearance: ClearanceStatus;
  graduationRecord: any | null;
  transcriptVersions: any[];
  gradingRules: GradingRule[];
  gpaConfig: any | null;
}

export type TranscriptMode = 'combined' | 'section' | 'year' | 'term' | 'progress' | 'graduation';

// ─────────────────────────────────────────────────────────────────────────────
// GPA helpers
// ─────────────────────────────────────────────────────────────────────────────

export function resolveGrade(
  score: number,
  rules: GradingRule[]
): { letterGrade: string; gpaPoints: number; isPassing: boolean; isDistinction: boolean } {
  if (!rules || rules.length === 0) {
    // Fallback scale if DB has no grading policies
    const fallback = [
      { minScore: 97, gradeName: 'A+', gpaPoints: 4.0, isPassing: true, isDistinction: true },
      { minScore: 93, gradeName: 'A',  gpaPoints: 3.8, isPassing: true, isDistinction: true },
      { minScore: 87, gradeName: 'B+', gpaPoints: 3.5, isPassing: true, isDistinction: false },
      { minScore: 83, gradeName: 'B',  gpaPoints: 3.0, isPassing: true, isDistinction: false },
      { minScore: 77, gradeName: 'C+', gpaPoints: 2.5, isPassing: true, isDistinction: false },
      { minScore: 70, gradeName: 'C',  gpaPoints: 2.0, isPassing: true, isDistinction: false },
      { minScore: 50, gradeName: 'D',  gpaPoints: 1.0, isPassing: true, isDistinction: false },
      { minScore: 0,  gradeName: 'F',  gpaPoints: 0.0, isPassing: false, isDistinction: false },
    ];
    const matched = fallback.find(r => score >= r.minScore) ?? fallback[fallback.length - 1];
    return { letterGrade: matched.gradeName, gpaPoints: matched.gpaPoints, isPassing: matched.isPassing, isDistinction: matched.isDistinction };
  }
  const sorted = [...rules].sort((a, b) => b.minScore - a.minScore);
  const matched = sorted.find(r => score >= r.minScore);
  return {
    letterGrade: matched?.gradeName ?? 'F',
    gpaPoints: matched?.gpaPoints ?? 0,
    isPassing: matched?.isPassing ?? false,
    isDistinction: matched?.isDistinction ?? false,
  };
}

export function computeWeightedScore(
  entries: any[],
  blueprints: BlueprintEntry[]
): { finalScore: number; breakdown: { label: string; score: number | null; weight: number }[] } {
  const breakdown: { label: string; score: number | null; weight: number }[] = [];

  // Build lookup: blueprint label → entry score (0–100 normalised)
  const sortedBps = [...blueprints].sort(
    (a, b) => (b.componentName || '').length - (a.componentName || '').length
  );

  const bpScores: Record<string, number | null> = {};
  blueprints.forEach(bp => { bpScores[bp.label || bp.componentName] = null; });

  entries.forEach((entry: any) => {
    const entryTitle = (entry.title || '').toLowerCase();
    const bp = sortedBps.find(b => {
      const bpName = (b.componentName || '').toLowerCase();
      const bpLabel = (b.label || '').toLowerCase();
      if (bpLabel && entryTitle === bpLabel) return true;
      if (entryTitle === bpName) return true;
      if (entryTitle.includes(bpName)) return true;
      if (entryTitle.replace(/\s+/g, '').includes(bpName)) return true;
      return false;
    }) ?? blueprints.find(b =>
      (b.componentName || '').toLowerCase() === (entry.assessmentType || '').toLowerCase()
    );
    if (bp) {
      const colKey = bp.label || bp.componentName;
      const normalised = entry.maxScore > 0
        ? Math.round((entry.score / entry.maxScore) * 100)
        : entry.score;
      bpScores[colKey] = normalised;
    }
  });

  let weightedSum = 0;
  let weightUsed = 0;

  blueprints.forEach(bp => {
    const key = bp.label || bp.componentName;
    const score = bpScores[key] ?? null;
    breakdown.push({ label: key, score, weight: bp.weightPercentage });
    if (score !== null) {
      weightedSum += (score / 100) * bp.weightPercentage;
      weightUsed += bp.weightPercentage;
    }
  });

  const finalScore = weightUsed > 0 ? Math.round((weightedSum / weightUsed) * 100) : 0;
  return { finalScore, breakdown };
}

export function computeSectionGPA(courses: CourseRecord[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  courses.forEach(c => {
    if (c.creditHours > 0) {
      totalPoints += c.gpaPoints * c.creditHours;
      totalCredits += c.creditHours;
    }
  });
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

export function computeCGPA(blocks: SectionBlock[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  blocks.forEach(block => {
    block.courses.forEach(c => {
      if (c.creditHours > 0) {
        totalPoints += c.gpaPoints * c.creditHours;
        totalCredits += c.creditHours;
      }
    });
  });
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

export function deriveAcademicStanding(cgpa: number, rules: GradingRule[]): string {
  if (cgpa >= 3.7) return "First Class Honours / Distinction";
  if (cgpa >= 3.3) return "Second Class Upper / Merit";
  if (cgpa >= 2.7) return "Second Class Lower / Credit";
  if (cgpa >= 2.0) return "Pass";
  if (cgpa >= 1.0) return "Conditional Pass / Probation";
  return "Academic Probation / Fail";
}

export function buildVerificationHash(studentDocId: string, sectionBlocks: SectionBlock[]): string {
  const dataStr = sectionBlocks
    .flatMap(b => b.courses)
    .map(c => `${c.offeringDocId}:${c.finalScore}:${c.letterGrade}`)
    .sort()
    .join('|');
  const seed = `TRANSCRIPT_V2|${studentDocId}|${dataStr}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `TRX-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTranscriptEngine() {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and build full transcript for a student.
   * @param studentDocId  Strapi documentId of the student
   * @param mode          Transcript type
   * @param filterYearDoc Optional academic year documentId filter
   * @param filterTermDoc Optional academic term documentId filter
   * @param sectionDocId  Optional: only this section (mode='section')
   */
  const buildTranscript = useCallback(async (
    studentDocId: string,
    mode: TranscriptMode,
    filterYearDoc?: string,
    filterTermDoc?: string,
    sectionDocId?: string,
  ) => {
    setIsLoading(true);
    setError(null);
    setTranscriptData(null);

    try {
      // ── 1. Grading policies & GPA config ─────────────────────────────────
      const [gpRes, gpaConfRes] = await Promise.all([
        apiClient.get('/grading-policies', { params: { pagination: { limit: 200 } } })
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/gpa-configurations', { params: { filters: { isActive: { $eq: true } }, pagination: { limit: 1 } } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const gradingRules: GradingRule[] = (gpRes.data?.data || []).map((p: any) => ({
        gradeName: p.gradeName ?? p.letterGrade ?? 'F',
        minScore: parseFloat(p.minScore ?? p.minimumScore ?? 0),
        maxScore: parseFloat(p.maxScore ?? 100),
        gpaPoints: parseFloat(p.gpaPoints ?? p.gradePoints ?? 0),
        isPassing: p.isPassing ?? true,
        isDistinction: p.isDistinction ?? false,
      }));

      const gpaConfig = gpaConfRes.data?.data?.[0] ?? null;

      // ── 2. All student enrollments (globally, not section-scoped) ─────────
      const enrollFilters: any = {
        student: { documentId: { $eq: studentDocId } },
      };

      const enrollRes = await apiClient.get('/student-enrollments', {
        params: {
          filters: enrollFilters,
          populate: [
            'courseOffering.subject',
            'courseOffering.academicSection',
            'courseOffering.gradeLevel',
            'courseOffering.academicYear',
            'courseOffering.academicTerm',
            'courseOffering.teacher',
          ],
          pagination: { limit: 500 },
        },
      }).catch(() => ({ data: { data: [] } }));

      let enrollments: any[] = enrollRes.data?.data || [];

      // ── 3. Apply filters based on mode ───────────────────────────────────
      if (mode === 'section' && sectionDocId) {
        enrollments = enrollments.filter(
          (e: any) => e.courseOffering?.academicSection?.documentId === sectionDocId
        );
      }
      if (mode === 'year' && filterYearDoc) {
        enrollments = enrollments.filter(
          (e: any) => e.courseOffering?.academicYear?.documentId === filterYearDoc
        );
      }
      if (mode === 'term' && filterTermDoc) {
        enrollments = enrollments.filter(
          (e: any) => e.courseOffering?.academicTerm?.documentId === filterTermDoc
        );
      }
      // Filter enrollments by gradebook status based on transcript mode:
      // - 'progress'    → show ALL statuses (even Draft) — for internal progress review
      // - 'graduation'  → strict: only Approved / Released / Archived
      // - 'combined'    → show Submitted and above (exclude Draft) so cross-section courses appear
      // - 'section' / 'year' / 'term' → same as combined: Submitted and above
      if (mode === 'graduation') {
        enrollments = enrollments.filter(
          (e: any) => {
            const gs = e.courseOffering?.gradebookStatus;
            return gs === 'Approved' || gs === 'Released' || gs === 'Archived';
          }
        );
      } else if (mode !== 'progress') {
        // combined, section, year, term — include Submitted + Verified + Approved + Released
        enrollments = enrollments.filter(
          (e: any) => {
            const gs = e.courseOffering?.gradebookStatus;
            return gs === 'Submitted' || gs === 'Verified' || gs === 'Approved' || gs === 'Released' || gs === 'Archived';
          }
        );
      }
      // 'progress' mode: no filter — show everything including Draft

      if (enrollments.length === 0) {
        // No matching enrollments — still return empty but valid structure
        setTranscriptData({
          sectionBlocks: [],
          summary: {
            cgpa: 0, creditsAttempted: 0, creditsEarned: 0, creditsFailed: 0,
            passedCourses: 0, failedCourses: 0, academicStanding: 'No Records',
            isEligibleForGraduation: false, verificationHash: '',
          },
          clearance: await fetchClearance(studentDocId),
          graduationRecord: null,
          transcriptVersions: [],
          gradingRules,
          gpaConfig,
        });
        setIsLoading(false);
        return;
      }

      // ── 4. Collect unique subject documentIds for blueprint fetch ─────────
      const subjectDocIds = [...new Set(
        enrollments
          .map((e: any) => e.courseOffering?.subject?.documentId)
          .filter(Boolean)
      )];

      const allOfferingDocIds = [...new Set(
        enrollments.map((e: any) => e.courseOffering?.documentId).filter(Boolean)
      )] as string[];

      // ── 5. Blueprints for all subjects ────────────────────────────────────
      const bpRes = await apiClient.get('/assessment-blueprints', {
        params: {
          filters: { subject: { documentId: { $in: subjectDocIds } } },
          populate: ['subject'],
          pagination: { limit: 1000 },
        },
      }).catch(() => ({ data: { data: [] } }));
      const allBlueprints: any[] = bpRes.data?.data || [];

      // ── 6. All gradebook entries for this student across these offerings ──
      const entriesRes = await apiClient.get('/gradebook-entries', {
        params: {
          filters: {
            student: { documentId: { $eq: studentDocId } },
            courseOffering: { documentId: { $in: allOfferingDocIds } },
          },
          populate: ['courseOffering', 'subject'],
          pagination: { limit: 2000 },
        },
      }).catch(() => ({ data: { data: [] } }));
      const allEntries: any[] = entriesRes.data?.data || [];

      // ── 7. Group enrollments by Academic Section ──────────────────────────
      const sectionMap = new Map<string, { meta: any; enrollments: any[] }>();

      enrollments.forEach((enr: any) => {
        const sec = enr.courseOffering?.academicSection;
        const secKey = sec?.documentId ?? '__no_section__';
        if (!sectionMap.has(secKey)) {
          sectionMap.set(secKey, {
            meta: sec ?? { documentId: '__no_section__', name: 'General Education', sectionType: 'general' },
            enrollments: [],
          });
        }
        sectionMap.get(secKey)!.enrollments.push(enr);
      });

      // ── 8. Build SectionBlocks with CourseRecords ─────────────────────────
      const sectionBlocks: SectionBlock[] = [];

      for (const [, secData] of sectionMap) {
        const courses: CourseRecord[] = [];

        for (const enr of secData.enrollments) {
          const offering = enr.courseOffering;
          if (!offering) continue;

          const subjectDocId = offering.subject?.documentId;
          const blueprints: BlueprintEntry[] = allBlueprints
            .filter((bp: any) => bp.subject?.documentId === subjectDocId)
            .map((bp: any) => ({
              documentId: bp.documentId,
              componentName: bp.componentName,
              label: bp.label || bp.componentName,
              weightPercentage: bp.weightPercentage,
            }));

          const offeringEntries = allEntries.filter(
            (e: any) =>
              e.courseOffering?.documentId === offering.documentId ||
              e.courseOffering?.id === offering.id
          );

          const { finalScore, breakdown } = blueprints.length > 0
            ? computeWeightedScore(offeringEntries, blueprints)
            : (() => {
                // No blueprints — fall back to simple average of entry percentages
                if (offeringEntries.length === 0) return { finalScore: 0, breakdown: [] };
                const avg = Math.round(
                  offeringEntries.reduce((sum: number, e: any) =>
                    sum + (e.maxScore > 0 ? (e.score / e.maxScore) * 100 : e.score), 0
                  ) / offeringEntries.length
                );
                return { finalScore: avg, breakdown: [] };
              })();

          const { letterGrade, gpaPoints, isPassing, isDistinction } = resolveGrade(finalScore, gradingRules);

          const subject = offering.subject ?? {};
          const creditHours = subject.creditValue ?? subject.creditHours ?? subject.credits ?? 3;

          const teacher = offering.teacher;
          const teacherName = teacher
            ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
            : 'N/A';

          courses.push({
            offeringDocId: offering.documentId,
            subjectName: subject.name ?? 'Unknown Subject',
            subjectCode: subject.code ?? '',
            creditHours,
            gradeLevel: offering.gradeLevel?.name ?? '',
            academicYear: offering.academicYear?.name ?? '',
            academicTerm: offering.academicTerm?.name ?? '',
            teacherName,
            gradebookStatus: offering.gradebookStatus ?? 'Draft',
            finalScore,
            letterGrade,
            gpaPoints,
            isPassing,
            isDistinction,
            componentBreakdown: breakdown,
          });
        }

        const sectionGPA = computeSectionGPA(courses);
        const creditsAttempted = courses.reduce((s, c) => s + c.creditHours, 0);
        const creditsEarned = courses.filter(c => c.isPassing).reduce((s, c) => s + c.creditHours, 0);
        const passCount = courses.filter(c => c.isPassing).length;
        const failCount = courses.filter(c => !c.isPassing).length;

        sectionBlocks.push({
          sectionDocId: secData.meta.documentId,
          sectionName: secData.meta.name ?? 'General Education',
          sectionType: secData.meta.sectionType ?? 'general',
          courses,
          sectionGPA,
          creditsEarned,
          creditsAttempted,
          passCount,
          failCount,
        });
      }

      // ── 9. Overall summary ────────────────────────────────────────────────
      const cgpa = computeCGPA(sectionBlocks);
      const totalCreditsAttempted = sectionBlocks.reduce((s, b) => s + b.creditsAttempted, 0);
      const totalCreditsEarned = sectionBlocks.reduce((s, b) => s + b.creditsEarned, 0);
      const totalPassed = sectionBlocks.reduce((s, b) => s + b.passCount, 0);
      const totalFailed = sectionBlocks.reduce((s, b) => s + b.failCount, 0);
      const academicStanding = deriveAcademicStanding(cgpa, gradingRules);
      const verificationHash = buildVerificationHash(studentDocId, sectionBlocks);

      // ── 10. Graduation record lookup ──────────────────────────────────────
      const gradRecRes = await apiClient.get('/graduation-records', {
        params: {
          filters: { student: { documentId: { $eq: studentDocId } } },
          populate: ['finalTranscript'],
          pagination: { limit: 1 },
        },
      }).catch(() => ({ data: { data: [] } }));
      const graduationRecord = gradRecRes.data?.data?.[0] ?? null;

      // ── 11. Transcript versions ────────────────────────────────────────────
      const tvRes = await apiClient.get('/transcript-versions', {
        params: {
          filters: { student: { documentId: { $eq: studentDocId } } },
          sort: 'versionNumber:desc',
          pagination: { limit: 20 },
        },
      }).catch(() => ({ data: { data: [] } }));
      const transcriptVersions = tvRes.data?.data || [];

      // ── 12. Clearance engine ──────────────────────────────────────────────
      const clearance = await fetchClearance(studentDocId);

      setTranscriptData({
        sectionBlocks,
        summary: {
          cgpa,
          creditsAttempted: totalCreditsAttempted,
          creditsEarned: totalCreditsEarned,
          creditsFailed: totalCreditsAttempted - totalCreditsEarned,
          passedCourses: totalPassed,
          failedCourses: totalFailed,
          academicStanding,
          isEligibleForGraduation: cgpa >= 2.0 && !clearance.overallBlocked,
          verificationHash,
        },
        clearance,
        graduationRecord,
        transcriptVersions,
        gradingRules,
        gpaConfig,
      });
    } catch (err: any) {
      console.error('Transcript engine error:', err);
      setError('Failed to build transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { transcriptData, isLoading, error, buildTranscript };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clearance Engine — real API calls per department
// ─────────────────────────────────────────────────────────────────────────────

async function fetchClearance(studentDocId: string): Promise<ClearanceStatus> {
  const [financeHoldsRes, invoicesRes, libraryRes, academicRes, graduationRes] = await Promise.all([
    // Finance holds — covers Hostel, Library, Transport, etc.
    apiClient.get('/finance-holds', {
      params: {
        filters: {
          student: { documentId: { $eq: studentDocId } },
          status: { $eq: 'active' },
        },
        pagination: { limit: 50 },
      },
    }).catch(() => ({ data: { data: [] } })),

    // Finance invoices — unpaid balance
    apiClient.get('/finance-invoices', {
      params: {
        filters: { student: { documentId: { $eq: studentDocId } } },
        pagination: { limit: 200 },
      },
    }).catch(() => ({ data: { data: [] } })),

    // Library overdue loans
    apiClient.get('/library-loans', {
      params: {
        filters: {
          student: { documentId: { $eq: studentDocId } },
          status: { $eq: 'overdue' },
        },
        pagination: { limit: 50 },
      },
    }).catch(() => ({ data: { data: [] } })),

    // Academic clearance record
    apiClient.get('/academic-clearances', {
      params: {
        filters: { student: { documentId: { $eq: studentDocId } } },
        sort: 'createdAt:desc',
        pagination: { limit: 1 },
      },
    }).catch(() => ({ data: { data: [] } })),

    // Graduation clearance
    apiClient.get('/graduation-clearances', {
      params: {
        filters: { student: { documentId: { $eq: studentDocId } } },
        sort: 'createdAt:desc',
        pagination: { limit: 1 },
      },
    }).catch(() => ({ data: { data: [] } })),
  ]);

  const activeHolds: any[] = financeHoldsRes.data?.data || [];
  const invoices: any[] = invoicesRes.data?.data || [];
  const libraryLoans: any[] = libraryRes.data?.data || [];
  const academicRecord: any = academicRes.data?.data?.[0] ?? null;
  const gradClearance: any = graduationRes.data?.data?.[0] ?? null;

  // Finance: unpaid invoices
  const unpaidBalance = invoices
    .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum: number, inv: any) => sum + (inv.remainingBalance ?? 0), 0);
  const financeHold = activeHolds.find(h =>
    ['Admission', 'Registration', 'Examination', 'Report Card', 'Certificate', 'Graduation'].includes(h.holdType)
  );
  const financePass = !financeHold && unpaidBalance <= 0;

  // Library: overdue
  const libraryHold = activeHolds.find(h => h.holdType === 'Library');
  const libraryPass = !libraryHold && libraryLoans.length === 0;
  const libraryDetail = libraryPass
    ? 'No overdue items'
    : `${libraryLoans.length} overdue item(s)`;

  // Hostel
  const hostelHold = activeHolds.find(h => h.holdType === 'Hostel');
  const hostelGrad = gradClearance ? gradClearance.hostelStatus : null;
  const hostelPass = !hostelHold && (hostelGrad !== 'Rejected');

  // Academic clearance
  const academicPass = !academicRecord || academicRecord.status === 'Eligible';
  const academicDetail = academicRecord?.status === 'Blocked'
    ? (Array.isArray(academicRecord.reasons) ? academicRecord.reasons.join(', ') : 'Academic hold')
    : 'Cleared';

  // Discipline
  const disciplineGrad = gradClearance ? gradClearance.disciplineStatus : null;
  const disciplinePass = disciplineGrad !== 'Rejected';

  // Graduation clearance overall
  const gradPass = !gradClearance || gradClearance.status === 'Cleared';

  const overallBlocked = !financePass || !libraryPass || !academicPass;

  return {
    finance: {
      pass: financePass,
      label: 'Finance Ledger',
      detail: financePass
        ? 'All fees cleared'
        : unpaidBalance > 0
          ? `Unpaid balance: ${unpaidBalance.toFixed(2)}`
          : (financeHold?.reason ?? 'Active financial hold'),
    },
    library: {
      pass: libraryPass,
      label: 'Library System',
      detail: libraryDetail,
    },
    hostel: {
      pass: hostelPass,
      label: 'Hostel & Accommodation',
      detail: hostelPass ? 'Cleared' : (hostelHold?.reason ?? 'Hostel hold active'),
    },
    academic: {
      pass: academicPass,
      label: 'Academic Records',
      detail: academicDetail,
    },
    discipline: {
      pass: disciplinePass,
      label: 'Discipline Office',
      detail: disciplinePass ? 'No active sanctions' : 'Disciplinary hold active',
    },
    graduation: {
      pass: gradPass,
      label: 'Graduation Clearance',
      detail: gradClearance ? gradClearance.status : 'Not Requested',
    },
    overallBlocked,
  };
}
