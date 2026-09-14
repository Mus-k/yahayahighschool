'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  RefreshCw, Activity,
  UserCheck, ShieldCheck, CheckSquare, Square,
  Sparkles, Upload, X, PenTool, ClipboardList, Lock, Unlock,
  AlertCircle, AlertTriangle, ShieldAlert,
  Plus, Trash2, Eye, Send
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// ─── TS Interfaces ────────────────────────────────────────────────────────────
interface Student {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId?: string;
  admissionNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  enrollmentStatus?: string;
  email?: string;
  phone?: string;
}

interface Enrollment {
  id: number;
  documentId: string;
  enrollmentStatus: string;
  student?: Student;
}

interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { id: number; documentId: string; name: string; code: string };
  academicSection?: { id: number; documentId: string; name: string; code: string; color?: string };
  gradeLevel?: { id: number; documentId: string; name: string; code: string };
  academicYear?: { id: number; documentId: string; name: string };
  academicTerm?: { id: number; documentId: string; name: string };
  room?: { id: number; roomNumber: string; buildingName?: string };
  studentEnrollments?: Enrollment[];
  gradebookStatus?: string;
  // computed from real attendance records
  attendanceRate?: string;
  attendancePct?: number;
}

interface AssessmentBlueprint {
  id: number;
  documentId?: string;
  componentName: string;
  weightPercentage: number;
  label?: string;
}

interface GradingPolicy {
  id: number;
  minimumScore?: number;
  minScore?: number;
  letterGrade?: string;
  gradeName?: string;
  gradePoints?: number;
  gpaPoints?: number;
}

interface LessonPlan {
  id: number;
  documentId: string;
  title: string;
  lessonNumber?: string;
  objectives?: string;
  teachingMethod?: string;
  homework?: string;
  assessmentMethod?: string;
  recordStatus?: string;
  rejectionReason?: string;
}

interface CurriculumTopic {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  completionStatus?: 'Pending' | 'In Progress' | 'Completed';
  orderNumber?: number;
}

interface TeachingProgress {
  id: number;
  documentId: string;
  weekNumber: number;
  lessonDelivered?: boolean;
  attendanceSubmitted?: boolean;
  homeworkGiven?: boolean;
  outcomeCompleted?: boolean;
  notes?: string;
}

// ─── BP key helper (single source of truth) ──────────────────────────────────
const bpKey = (bp: AssessmentBlueprint) => bp.label || bp.componentName;

// ─── Sort blueprints so longer names match first (Quiz2 before Quiz) ──────────
const sortBps = (bps: AssessmentBlueprint[]) =>
  [...bps].sort((a, b) => bpKey(b).length - bpKey(a).length);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const { user, isLoading: authLoading } = useAuth();
  const teacher = user?.profile as any;

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'overview' | 'roster' | 'attendance' | 'assessments' | 'gradebook' | 'approval' | 'lessonplan' | 'audit'
  >('overview');

  // Attendance
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [attendanceRegister, setAttendanceRegister] = useState<Record<string, string>>({});
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Assessments & Gradebook
  const [blueprints, setBlueprints] = useState<AssessmentBlueprint[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<GradingPolicy[]>([]);
  const [gradebookData, setGradebookData] = useState<Record<string, Record<string, number>>>({});
  const [gradebookComments, setGradebookComments] = useState<Record<string, string>>({});
  const [gradebookEntryIds, setGradebookEntryIds] = useState<Record<string, string>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  // Assessment builder
  const [newAssessName, setNewAssessName] = useState('');
  const [newAssessCategory, setNewAssessCategory] = useState('');
  const [newAssessMaxScore, setNewAssessMaxScore] = useState('100');
  const [newAssessWeight, setNewAssessWeight] = useState('10');
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  // Approval
  const [approvalStatus, setApprovalStatus] = useState<string>('Draft');
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Lesson Planner — live data
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [curriculumTopics, setCurriculumTopics] = useState<CurriculumTopic[]>([]);
  const [teachingProgress, setTeachingProgress] = useState<TeachingProgress[]>([]);
  const [isCreatingLessonPlan, setIsCreatingLessonPlan] = useState(false);
  const [newLpTitle, setNewLpTitle] = useState('');
  const [newLpObjectives, setNewLpObjectives] = useState('');
  const [newLpMethod, setNewLpMethod] = useState('');
  const [showLpForm, setShowLpForm] = useState(false);
  const [selectedPlanForDrawer, setSelectedPlanForDrawer] = useState<any | null>(null);
  const [showPlanDrawer, setShowPlanDrawer] = useState(false);

  // Audit logs
  const [sectionAuditLogs, setSectionAuditLogs] = useState<any[]>([]);

  // Timetable
  const [timetable, setTimetable] = useState<any[]>([]);

  // ── 1. Load offerings + compute real attendance rates ──────────────────────
  const loadOfferings = useCallback(async () => {
    // Wait for auth to fully settle before checking teacher profile
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [offeringsRes, ttRes] = await Promise.all([
        apiClient.get('/course-offerings', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['subject', 'academicSection', 'gradeLevel', 'academicYear', 'academicTerm', 'room', 'studentEnrollments.student'],
            pagination: { limit: 100 }
          }
        }),
        apiClient.get('/timetable-slots', {
          params: {
            filters: { courseOffering: { teacher: { id: { $eq: teacher.id } } } },
            populate: ['courseOffering.subject', 'courseOffering.room', 'courseOffering.academicSection']
          }
        })
      ]);

      const rawOfferings: any[] = offeringsRes.data?.data || [];

      // Fetch attendance counts for each offering to compute real rates
      const enriched: CourseOffering[] = await Promise.all(
        rawOfferings.map(async (o: any) => {
          try {
            const attRes = await apiClient.get('/attendance-records', {
              params: {
                filters: { courseOffering: { id: { $eq: o.id } } },
                pagination: { limit: 1000 },
                fields: ['recordStatus']
              }
            });
            const records: any[] = attRes.data?.data || [];
            const total = records.length;
            const present = records.filter((r: any) => r.recordStatus === 'Present').length;
            const pct = total > 0 ? Math.round((present / total) * 100) : null;
            return {
              ...o,
              attendanceRate: pct !== null ? `${pct}%` : '—',
              attendancePct: pct
            };
          } catch {
            return { ...o, attendanceRate: '—', attendancePct: null };
          }
        })
      );

      setOfferings(enriched);
      setTimetable(ttRes.data?.data || []);
    } catch (err) {
      toast.error(t('Failed to load Course Offerings.'));
    } finally {
      setIsLoading(false);
    }
  }, [teacher?.id, authLoading]);

  useEffect(() => { loadOfferings(); }, [loadOfferings]);

  // ── 2. Load workspace data when an offering is selected ────────────────────
  const loadOfferingWorkspace = async (offering: CourseOffering) => {
    setIsLoading(true);
    setSelectedOffering(offering);
    try {
      const subjectId = offering.subject?.id;
      const offeringId = offering.id;

      const [bpRes, gpRes, attendRes, gradesRes, appHistRes, auditsRes, lpsRes] = await Promise.all([
        subjectId
          ? apiClient.get('/assessment-blueprints', { params: { filters: { subject: { id: { $eq: subjectId } } }, pagination: { limit: 100 } } }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/grading-policies', { params: { pagination: { limit: 100 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/attendance-records', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, populate: ['student'], sort: 'date:desc', pagination: { limit: 300 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/gradebook-entries', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, populate: ['student'], pagination: { limit: 1000 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/grade-approval-histories', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, sort: 'actionDateTime:desc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/audit-logs', { params: { filters: { entity: { $eq: 'CourseOffering' }, entityId: { $eq: String(offeringId) } }, sort: 'createdAt:desc', pagination: { limit: 50 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/lesson-plans', { params: { filters: { teacher: { id: { $eq: teacher?.id } }, subject: { id: { $eq: subjectId } } }, pagination: { limit: 100 }, sort: 'createdAt:desc' } }).catch(() => ({ data: { data: [] } }))
      ]);

      const bpList: AssessmentBlueprint[] = bpRes.data?.data || [];
      setBlueprints(bpList);
      setGradingPolicies(gpRes.data?.data || []);
      setAttendanceHistory(attendRes.data?.data || []);
      setSectionAuditLogs(auditsRes.data?.data || []);
      setLessonPlans(lpsRes.data?.data || []);

      // Fetch curriculum topics if subject has curriculum
      if (subjectId) {
        try {
          const currRes = await apiClient.get('/curriculums', {
            params: { filters: { subject: { id: { $eq: subjectId } } }, populate: ['topics'], pagination: { limit: 10 } }
          });
          const curriculums = currRes.data?.data || [];
          const allTopics: CurriculumTopic[] = [];
          curriculums.forEach((c: any) => {
            (c.topics || []).forEach((t: any) => allTopics.push(t));
          });
          setCurriculumTopics(allTopics.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0)));
        } catch { setCurriculumTopics([]); }

        // Fetch teaching progress
        try {
          const tpRes = await apiClient.get('/teaching-progresses', {
            params: { filters: { courseOffering: { id: { $eq: offeringId } } }, sort: 'weekNumber:asc', pagination: { limit: 100 } }
          });
          setTeachingProgress(tpRes.data?.data || []);
        } catch { setTeachingProgress([]); }
      }

      // Approval status
      const approvals = appHistRes.data?.data || [];
      setApprovalHistory(approvals);
      setApprovalStatus(
        approvals.length > 0
          ? approvals[0].stage
          : (offering.gradebookStatus || 'Draft')
      );

      // Init attendance register (default all Present)
      const roster = offering.studentEnrollments || [];
      const attMap: Record<string, string> = {};
      roster.forEach((enr) => {
        if (enr.student?.id) attMap[String(enr.student.id)] = 'Present';
      });
      setAttendanceRegister(attMap);

      // Build gradebook grid — key every cell by bpKey(bp)
      const gradesList: any[] = gradesRes.data?.data || [];
      const gMap: Record<string, Record<string, number>> = {};
      const cMap: Record<string, string> = {};
      const entryIdMap: Record<string, string> = {};

      roster.forEach((enr) => {
        if (enr.student?.id) gMap[String(enr.student.id)] = {};
      });

      const sorted = sortBps(bpList);

      gradesList.forEach((entry: any) => {
        const studentId = String(entry.student?.id);
        if (!studentId || studentId === 'undefined') return;

        // Match entry → blueprint with robust fuzzy matching
        const matchedBp =
          sorted.find((b) => {
            const bLabel = (bpKey(b)).toLowerCase();
            const bName = (b.componentName || '').toLowerCase();
            const eTitle = (entry.title || '').toLowerCase();
            if (bLabel && eTitle === bLabel) return true;
            if (eTitle === bName) return true;
            if (bLabel && eTitle.includes(bLabel)) return true;
            return false;
          }) ||
          bpList.find((b) =>
            (b.componentName || '').toLowerCase() === (entry.assessmentType || '').toLowerCase()
          );

        const component = matchedBp ? bpKey(matchedBp) : (entry.title || entry.assessmentType || 'Other');
        if (component) {
          if (!gMap[studentId]) gMap[studentId] = {};
          gMap[studentId][component] = entry.score;
          if (entry.teacherComment) cMap[`${studentId}-${component}`] = entry.teacherComment;
          entryIdMap[`${studentId}-${component}`] = entry.documentId || String(entry.id);
        }
      });

      setGradebookData(gMap);
      setGradebookComments(cMap);
      setGradebookEntryIds(entryIdMap);
    } catch (err) {
      toast.error(t('Failed to load workspace data.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Grading Rules ─────────────────────────────────────────────────────────
  const gradingRules = useMemo(() => {
    if (gradingPolicies.length > 0) {
      return gradingPolicies
        .map((p) => ({
          minScore: parseFloat(String(p.minScore ?? p.minimumScore ?? 0)),
          letterGrade: p.gradeName ?? p.letterGrade ?? 'F',
          gradePoints: parseFloat(String(p.gpaPoints ?? p.gradePoints ?? 0))
        }))
        .sort((a, b) => b.minScore - a.minScore);
    }
    return [
      { minScore: 97, letterGrade: 'A+', gradePoints: 4.0 },
      { minScore: 93, letterGrade: 'A', gradePoints: 3.8 },
      { minScore: 87, letterGrade: 'B+', gradePoints: 3.5 },
      { minScore: 83, letterGrade: 'B', gradePoints: 3.0 },
      { minScore: 77, letterGrade: 'C+', gradePoints: 2.5 },
      { minScore: 70, letterGrade: 'C', gradePoints: 2.0 },
      { minScore: 50, letterGrade: 'D', gradePoints: 1.0 },
      { minScore: 0,  letterGrade: 'F', gradePoints: 0.0 }
    ];
  }, [gradingPolicies]);

  const resolveLetterAndPoints = (score: number) => {
    for (const rule of gradingRules) {
      if (score >= rule.minScore) return { grade: rule.letterGrade, points: rule.gradePoints };
    }
    return { grade: 'F', points: 0.0 };
  };

  const calculateStudentFinalScore = (studentId: string | number) => {
    const studentGrades = gradebookData[String(studentId)] || {};
    let totalWeight = 0;
    let weightedSum = 0;
    blueprints.forEach((bp) => {
      const key = bpKey(bp);
      const score = studentGrades[key] ?? null;
      if (score !== null) {
        weightedSum += score * (bp.weightPercentage / 100);
        totalWeight += bp.weightPercentage;
      }
    });
    if (totalWeight === 0) return { score: 0, grade: 'F', points: 0.0 };
    const finalScore = Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100));
    return { score: finalScore, ...resolveLetterAndPoints(finalScore) };
  };

  // ── At-risk students (real calculation) ───────────────────────────────────
  const atRiskStudents = useMemo(() => {
    if (!selectedOffering) return [];
    return (selectedOffering.studentEnrollments || [])
      .map((enr) => {
        if (!enr.student) return null;
        const calc = calculateStudentFinalScore(enr.student.id);
        const grades = gradebookData[String(enr.student.id)] || {};
        const hasAnyGrade = Object.keys(grades).length > 0;
        return { student: enr.student, score: calc.score, grade: calc.grade, hasAnyGrade };
      })
      .filter((s): s is NonNullable<typeof s> => !!s && s.hasAnyGrade && s.score < 60);
  }, [selectedOffering, gradebookData, blueprints]);

  // ── Stats derived from real data ──────────────────────────────────────────
  const avgAttendancePct = useMemo(() => {
    const rates = offerings.map((o) => o.attendancePct).filter((p): p is number => p !== null);
    if (rates.length === 0) return '—';
    return `${Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)}%`;
  }, [offerings]);

  // Lesson planner: compute coverage from curriculum topics
  const coveredTopics = curriculumTopics.filter((t) => t.completionStatus === 'Completed').length;
  const totalTopics = curriculumTopics.length;
  const syllabusComputed = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : null;

  // ── Grade cell change ─────────────────────────────────────────────────────
  const handleGradeCellChange = (studentId: number, component: string, value: string) => {
    if (approvalStatus !== 'Draft') {
      toast.warning(t('Gradebook is locked while under review.'));
      return;
    }
    const scoreVal = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setGradebookData((prev) => ({
      ...prev,
      [String(studentId)]: { ...(prev[String(studentId)] || {}), [component]: scoreVal }
    }));
  };

  // ── Save Attendance ────────────────────────────────────────────────────────
  const handleSaveAttendance = async () => {
    if (!selectedOffering) return;
    setIsSavingAttendance(true);
    try {
      await Promise.all(
        Object.entries(attendanceRegister).map(([studentId, status]) =>
          apiClient.post('/attendance-records', {
            data: {
              date: attendanceDate,
              recordStatus: status,
              student: parseInt(studentId),
              teacher: teacher.id,
              courseOffering: selectedOffering.id,
              section: selectedOffering.academicSection?.id,
              subject: selectedOffering.subject?.id,
              academicYear: selectedOffering.academicYear?.id,
              academicTerm: selectedOffering.academicTerm?.id
            }
          })
        )
      );

      await apiClient.post('/audit-logs', {
        data: {
          action: 'Attendance Register Saved',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Teacher saved attendance for ${Object.keys(attendanceRegister).length} students on ${attendanceDate}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(t('Attendance posted successfully.'));
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error(t('Failed to post attendance.'));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // ── Save Grades ────────────────────────────────────────────────────────────
  const handleSaveGrades = async () => {
    if (!selectedOffering) return;
    setIsSavingGrades(true);
    try {
      const roster = selectedOffering.studentEnrollments || [];
      const validEnum = ['Homework', 'Quiz', 'Project', 'Participation', 'Attendance', 'Exam', 'Other'];

      const saves = roster.flatMap((enr) => {
        const studentId = String(enr.student?.id);
        if (!studentId || studentId === 'undefined') return [];
        const studentGrades = gradebookData[studentId] || {};

        return Object.entries(studentGrades).map(([component, score]) => {
          const bp = blueprints.find((b) => bpKey(b) === component);
          const resolvedComponentName = bp?.componentName || component;
          const rootType = resolvedComponentName.replace(/[0-9]/g, '');
          const resolvedType = validEnum.includes(rootType)
            ? rootType
            : validEnum.includes(resolvedComponentName)
            ? resolvedComponentName
            : 'Other';

          const payload = {
            data: {
              title: component,           // use the display key
              assessmentType: resolvedType,
              score,
              maxScore: 100,
              percentage: score,
              weight: bp?.weightPercentage ?? 0,
              student: enr.student?.documentId || enr.student?.id,
              teacher: teacher.documentId || teacher.id,
              courseOffering: selectedOffering.documentId || selectedOffering.id,
              subject: selectedOffering.subject?.documentId || selectedOffering.subject?.id,
              section: selectedOffering.academicSection?.documentId || selectedOffering.academicSection?.id,
              academicYear: selectedOffering.academicYear?.documentId || selectedOffering.academicYear?.id,
              academicTerm: selectedOffering.academicTerm?.documentId || selectedOffering.academicTerm?.id,
              recordStatus: 'Draft'
            }
          };

          const existingId = gradebookEntryIds[`${studentId}-${component}`];
          return existingId
            ? apiClient.put(`/gradebook-entries/${existingId}`, payload)
            : apiClient.post('/gradebook-entries', payload);
        });
      });

      await Promise.all(saves);

      await apiClient.post('/audit-logs', {
        data: {
          action: 'Gradebook Saved',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Teacher saved draft gradebook scores for ${roster.length} students.`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(t('Gradebook drafts saved successfully.'));
      loadOfferingWorkspace(selectedOffering);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to save gradebook.'));
    } finally {
      setIsSavingGrades(false);
    }
  };

  // ── Create Assessment Blueprint ────────────────────────────────────────────
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !newAssessName || !newAssessCategory) return;
    setIsCreatingAssessment(true);
    try {
      await apiClient.post('/assessment-blueprints', {
        data: {
          componentName: newAssessCategory,
          label: newAssessName,
          weightPercentage: parseFloat(newAssessWeight),
          subject: selectedOffering.subject?.documentId || selectedOffering.subject?.id
        }
      });

      await apiClient.post('/audit-logs', {
        data: {
          action: 'Assessment Category Added',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Added blueprint: ${newAssessName} (${newAssessCategory}, Weight: ${newAssessWeight}%)`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(t(`Assessment '${newAssessName}' registered.`));
      setNewAssessName('');
      setNewAssessCategory('');
      setNewAssessWeight('10');
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error(t('Failed to register assessment blueprint.'));
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  // ── Grade Approval Workflow ────────────────────────────────────────────────
  const handleWorkflowTransition = async (targetStage: string) => {
    if (!selectedOffering || isSubmittingApproval) return;
    setIsSubmittingApproval(true);
    try {
      const nextVersion = (approvalHistory?.[0]?.versionNumber ?? 0) + 1;
      const dataStr = JSON.stringify(gradebookData);
      let hash = 0;
      for (let i = 0; i < dataStr.length; i++) { hash = (hash << 5) - hash + dataStr.charCodeAt(i); hash |= 0; }
      const changeHash = `SHA256-${Math.abs(hash).toString(16)}`;

      await apiClient.post('/grade-approval-histories', {
        data: {
          stage: targetStage,
          versionNumber: nextVersion,
          comments: approvalComment || `Gradebook transitioned to: ${targetStage}`,
          actionDateTime: new Date().toISOString(),
          reviewerEmail: (user as any)?.email || '',
          reviewerName: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || (user as any)?.username || '',
          courseOffering: selectedOffering.documentId,
          changeHash
        }
      });

      try {
        await apiClient.put(`/course-offerings/${selectedOffering.documentId}`, {
          data: { gradebookStatus: targetStage }
        });
      } catch (e) { console.warn('Could not update gradebook status:', e); }

      apiClient.post('/audit-logs', {
        data: {
          action: `Grade Approval: ${targetStage}`,
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Grades v${nextVersion} (Hash: ${changeHash}). Comment: ${approvalComment}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(t('Gradebook submitted for Section Head review!'));
      setApprovalComment('');
      loadOfferingWorkspace(selectedOffering);
    } catch (err: any) {
      console.error('Workflow error:', err?.response?.data || err);
      toast.error(t('Failed to submit approval workflow.'));
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // ── Create Lesson Plan ─────────────────────────────────────────────────────
  const handleCreateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !newLpTitle) return;
    setIsCreatingLessonPlan(true);
    try {
      await apiClient.post('/lesson-plans', {
        data: {
          title: newLpTitle,
          objectives: newLpObjectives,
          teachingMethod: newLpMethod,
          teacher: teacher?.documentId || teacher?.id,
          subject: selectedOffering.subject?.documentId || selectedOffering.subject?.id,
          section: selectedOffering.academicSection?.documentId || selectedOffering.academicSection?.id,
          academicYear: selectedOffering.academicYear?.documentId || selectedOffering.academicYear?.id,
          academicTerm: selectedOffering.academicTerm?.documentId || selectedOffering.academicTerm?.id,
          recordStatus: 'Draft'
        }
      });
      toast.success(t('Lesson plan saved.'));
      setNewLpTitle('');
      setNewLpObjectives('');
      setNewLpMethod('');
      setShowLpForm(false);
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error(t('Failed to save lesson plan.'));
    } finally {
      setIsCreatingLessonPlan(false);
    }
  };

  // ── Submit Lesson Plan for Approval ────────────────────────────────────────
  const handleSubmitLessonPlan = async (lpId: string | number) => {
    try {
      await apiClient.put(`/lesson-plans/${lpId}`, { data: { recordStatus: 'Pending Approval' } });
      toast.success(t('Lesson plan submitted for Section Head approval.'));
      if (selectedOffering) loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error(t('Failed to submit lesson plan.'));
    }
  };

  // ── Delete Lesson Plan ──────────────────────────────────────────────────────
  const handleDeleteLessonPlan = async (lpId: string | number) => {
    if (!confirm(t('Delete this lesson plan?'))) return;
    try {
      await apiClient.delete(`/lesson-plans/${lpId}`);
      toast.success(t('Lesson plan deleted.'));
      if (selectedOffering) loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error(t('Failed to delete lesson plan.'));
    }
  };

  // ── Update topic completion status ─────────────────────────────────────────
  const handleTopicStatusChange = async (topic: CurriculumTopic) => {
    const nextStatus: Record<string, 'Pending' | 'In Progress' | 'Completed'> = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending'
    };
    const newStatus = nextStatus[topic.completionStatus || 'Pending'];
    try {
      await apiClient.put(`/topics/${topic.documentId}`, { data: { completionStatus: newStatus } });
      setCurriculumTopics((prev) =>
        prev.map((t) => t.id === topic.id ? { ...t, completionStatus: newStatus } : t)
      );
      toast.success(t(`Topic marked as "${newStatus}".`));
    } catch {
      toast.error(t('Failed to update topic status.'));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <PageHeader
        title={selectedOffering
          ? `${t('Workspace')}: ${selectedOffering.subject?.name} (${selectedOffering.gradeLevel?.name})`
          : `${t('Teaching Portal')}${teacher?.displayName ? ` — ${teacher.displayName}` : ''}`}
        description={selectedOffering
          ? `${selectedOffering.academicSection?.name} · ${selectedOffering.academicYear?.name} · ${t('Term')}: ${selectedOffering.academicTerm?.name}`
          : t('Manage your assigned Course Offerings, attendance, assessments and curriculum delivery.')}
      >
        <div className="flex gap-2">
          {selectedOffering && (
            <button
              onClick={() => { setSelectedOffering(null); setActiveWorkspaceTab('overview'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 cursor-pointer dark:hover:bg-emerald-900/40 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('Exit Workspace')}</span>
            </button>
          )}
          <button
            onClick={loadOfferings}
            disabled={isLoading || authLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', (isLoading || authLoading) && 'animate-spin')} />
            <span>{t('Sync')}</span>
          </button>
        </div>
      </PageHeader>

      {/* ── Auth / Profile loading ─────────────────────────────────────── */}
      {(isLoading || authLoading) && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-slate-400 text-xs font-semibold">{t('Syncing academic data...')}</p>
        </div>
      )}

      {/* ── No teacher profile linked ─────────────────────────────────── */}
      {!authLoading && !isLoading && !teacher?.id && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t('Teacher Profile Not Linked')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-6">
            {t('Your user account has not been linked to a Teacher profile in the system. Please contact the Administrator or Registrar to complete your profile setup.')}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono">{t('User ID')}: {user?.id}</span>
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono">{user?.email}</span>
          </div>
        </div>
      )}

      {/* ── OFFERINGS LIST VIEW ────────────────────────────────────────────── */}
      {!isLoading && !authLoading && !!teacher?.id && !selectedOffering && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('Course Offerings')}
              value={offerings.length}
              subtitle={t('Assigned scheduled segments')}
              icon={BookOpen}
              color="text-indigo-500"
              bgColor="bg-indigo-500/10"
            />
            <StatCard
              title={t('Timetable Slots')}
              value={timetable.length}
              subtitle={t('Assigned classroom slots')}
              icon={Calendar}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              title={t('Total Enrolled Students')}
              value={offerings.reduce((sum, o) => sum + (o.studentEnrollments?.length ?? 0), 0)}
              subtitle={t('Active academic learners')}
              icon={Users}
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StatCard
              title={t('Avg Attendance Rate')}
              value={avgAttendancePct}
              subtitle={t('Across all assigned offerings')}
              icon={CheckCircle2}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
          </div>

          {/* Offerings Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              <span>{t('My Course Offerings')}</span>
            </h2>

            {offerings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 text-center text-slate-400 text-sm">
                {t('No course offerings assigned to your profile in this term.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offerings.map((o) => {
                  const sectionColor = o.academicSection?.color ?? '#6366f1';
                  return (
                    <div
                      key={o.id}
                      onClick={() => loadOfferingWorkspace(o)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[200px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: sectionColor }}
                          >
                            {o.academicSection?.name}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                            {o.gradeLevel?.name}
                          </span>
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {o.subject?.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{o.subject?.code}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{o.studentEnrollments?.length ?? 0} {t('Students')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('Attendance')}: {o.attendanceRate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('Room')} {o.room?.roomNumber ?? t('N/A')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className={cn(
                            'capitalize',
                            o.gradebookStatus === 'Approved' ? 'text-emerald-600' :
                            o.gradebookStatus === 'Submitted' ? 'text-amber-600' : 'text-slate-500'
                          )}>
                            {o.gradebookStatus ?? 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WORKSPACE DETAIL VIEW ─────────────────────────────────────────── */}
      {!isLoading && !authLoading && selectedOffering && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border rounded-2xl overflow-x-auto no-scrollbar max-w-6xl">
            {[
              { id: 'overview',    label: 'Overview',        icon: BookOpen },
              { id: 'roster',      label: 'Roster',          icon: Users },
              { id: 'attendance',  label: 'Attendance',      icon: UserCheck },
              { id: 'assessments', label: 'Assessments',     icon: PenTool },
              { id: 'gradebook',   label: 'Gradebook',       icon: ClipboardList },
              { id: 'approval',    label: 'Grade Approval',  icon: ShieldCheck },
              { id: 'lessonplan',  label: 'Lesson Planner',  icon: CheckSquare },
              { id: 'audit',       label: 'Audit Trail',     icon: FileText }
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeWorkspaceTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveWorkspaceTab(id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t(label)}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

            {/* ── TAB: OVERVIEW ─────────────────────────────────────────────── */}
            {activeWorkspaceTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">{t('Class Roster Size')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedOffering.studentEnrollments?.length ?? 0} {t('Students')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{t('From enrollment records')}</p>
                  </div>
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">{t('Attendance Rate')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedOffering.attendanceRate ?? '—'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{t('Calculated from attendance records')}</p>
                  </div>
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">{t('Curriculum Coverage')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {syllabusComputed !== null ? `${syllabusComputed}%` : '—'}
                    </p>
                    {totalTopics > 0 && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${syllabusComputed}%` }} />
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {totalTopics > 0 ? `${coveredTopics} / ${totalTopics} ${t('topics completed')}` : t('No curriculum topics linked')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timetable slots */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{t('Course Timetable')}</h3>
                    {timetable.filter((s) => s.courseOffering?.id === selectedOffering.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('No scheduled slots for this offering.')}</p>
                    ) : (
                      <div className="space-y-2">
                        {timetable
                          .filter((s) => s.courseOffering?.id === selectedOffering.id)
                          .map((slot: any) => (
                            <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold">{slot.dayOfWeek}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {selectedOffering.room?.buildingName
                                    ? `${t('Building')}: ${selectedOffering.room.buildingName} · `
                                    : ''}
                                  {t('Room')} {selectedOffering.room?.roomNumber ?? t('N/A')}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* AI interventions — real at-risk students */}
                  <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/30 p-5 rounded-3xl text-xs text-slate-300 space-y-3">
                    <h4 className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>{t('At-Risk Interventions')}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">{t('Students with calculated grade below 60%:')}</p>
                    {atRiskStudents.length === 0 ? (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
                        <p className="font-bold text-emerald-400">{t('No at-risk students')} 🎉</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t('All graded students are performing above threshold.')}</p>
                      </div>
                    ) : (
                      atRiskStudents.map((s) => (
                        <div key={s.student.id} className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl">
                          <p className="font-bold text-rose-400">{s.student.firstName} {s.student.lastName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {t('Calculated grade')}: {s.score.toFixed(1)}% ({s.grade}) — {t('requires monitoring.')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ROSTER ───────────────────────────────────────────────── */}
            {activeWorkspaceTab === 'roster' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Active Student Roster')}</h3>
                  <p className="text-xs text-slate-500">{t('Synced from approved enrollment records.')}</p>
                </div>

                <div className="overflow-x-auto border rounded-2xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">{t('Admission No.')}</th>
                        <th className="p-3">{t('Student Name')}</th>
                        <th className="p-3">{t('School ID')}</th>
                        <th className="p-3">{t('Gender')}</th>
                        <th className="p-3 text-center">{t('Calculated Grade')}</th>
                        <th className="p-3 text-center">{t('Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedOffering.studentEnrollments || []).map((enr, idx) => {
                        const s = enr.student;
                        if (!s) return null;
                        const calc = calculateStudentFinalScore(s.id);
                        return (
                          <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono text-slate-800 dark:text-slate-200">
                              {s.admissionNumber || <span className="text-slate-400 italic">{t('N/A')}</span>}
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {s.firstName} {s.lastName}
                            </td>
                            <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{s.schoolId || '—'}</td>
                            <td className="p-3 capitalize text-slate-600 dark:text-slate-400">{s.gender || '—'}</td>
                            <td className="p-3 text-center">
                              {Object.keys(gradebookData[String(s.id)] || {}).length > 0 ? (
                                <span className={cn(
                                  'px-2 py-0.5 rounded font-bold text-[10px]',
                                  calc.grade === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                )}>
                                  {calc.score.toFixed(1)}% ({calc.grade})
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">{t('No grades')}</span>
                              )}
                            </td>
                            <td className="p-3 text-center capitalize">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full font-bold text-[10px]',
                                enr.enrollmentStatus === 'Active' || enr.enrollmentStatus === 'active'
                                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              )}>
                                {enr.enrollmentStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB: ATTENDANCE ───────────────────────────────────────────── */}
            {activeWorkspaceTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Daily Attendance Register')}</h3>
                    <p className="text-xs text-slate-500">{t('Post daily attendance against this course offering.')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveAttendance}
                      disabled={isSavingAttendance}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                    >
                      {isSavingAttendance ? t('Saving...') : t('Post Attendance')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mark Attendance */}
                  <div className="lg:col-span-2 overflow-x-auto border rounded-2xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3">{t('Student Name')}</th>
                          <th className="p-3 text-center">{t('Present')}</th>
                          <th className="p-3 text-center">{t('Absent')}</th>
                          <th className="p-3 text-center">{t('Late')}</th>
                          <th className="p-3 text-center">{t('Excused')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedOffering.studentEnrollments || []).map((enr) => {
                          const s = enr.student;
                          if (!s) return null;
                          const sid = String(s.id);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.schoolId}</div>
                              </td>
                              {(['Present', 'Absent', 'Late', 'Excused'] as const).map((status) => (
                                <td key={status} className="p-3 text-center">
                                  <input
                                    type="radio"
                                    name={`att-${s.id}`}
                                    checked={attendanceRegister[sid] === status}
                                    onChange={() => setAttendanceRegister((prev) => ({ ...prev, [sid]: status }))}
                                    className="w-4 h-4"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* History */}
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white mb-3">{t('Attendance History')}</h4>
                    {attendanceHistory.length === 0 ? (
                      <p className="text-slate-400 italic">{t('No attendance records yet.')}</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {attendanceHistory.map((h: any) => (
                          <div key={h.id} className="p-2 border rounded-xl bg-white dark:bg-slate-900 flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {h.student?.firstName} {h.student?.lastName}
                              </p>
                              <p className="text-slate-400 mt-0.5">{h.date}</p>
                            </div>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full font-bold',
                              h.recordStatus === 'Present' ? 'bg-green-50 text-green-700' :
                              h.recordStatus === 'Absent'  ? 'bg-rose-50 text-rose-700' :
                              h.recordStatus === 'Late'    ? 'bg-amber-50 text-amber-700' :
                              'bg-sky-50 text-sky-700'
                            )}>
                              {h.recordStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ASSESSMENTS ──────────────────────────────────────────── */}
            {activeWorkspaceTab === 'assessments' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Assessment Blueprints')}</h3>
                    <p className="text-xs text-slate-500">{t('Assessment components and weights for this subject.')}</p>
                  </div>

                  {blueprints.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">{t('No blueprints configured. Use the builder to add components.')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {blueprints.map((bp) => (
                        <div key={bp.id} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">{bpKey(bp)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t('Type')}: {bp.componentName}</p>
                          </div>
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">{bp.weightPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total weight warning */}
                  {blueprints.length > 0 && (() => {
                    const total = blueprints.reduce((s, b) => s + b.weightPercentage, 0);
                    return total !== 100 ? (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{t('Total weight is')} <strong>{total}%</strong> — {t('should sum to 100%.')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{t('Assessment weights correctly sum to 100%.')}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Builder */}
                <div className="p-5 border rounded-3xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-500" />
                    <span>{t('Add Component')}</span>
                  </h4>
                  <form onSubmit={handleCreateAssessment} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Display Label')}</label>
                      <input
                        type="text" required value={newAssessName}
                        placeholder={t('e.g. Homework 1, Midterm Exam')}
                        onChange={(e) => setNewAssessName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Category Type')}</label>
                      <select
                        required value={newAssessCategory}
                        onChange={(e) => setNewAssessCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{t('-- Choose Category --')}</option>
                        {['Homework', 'Quiz', 'Project', 'Practical', 'Participation', 'Oral', 'Midterm', 'Exam', 'Other'].map((c) => (
                          <option key={c} value={c}>{t(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Weight (%)')}</label>
                      <input
                        type="number" required min="1" max="100" value={newAssessWeight}
                        onChange={(e) => setNewAssessWeight(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit" disabled={isCreatingAssessment}
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingAssessment ? t('Saving...') : t('Register Component')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── TAB: GRADEBOOK ────────────────────────────────────────────── */}
            {activeWorkspaceTab === 'gradebook' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Gradebook Spreadsheet')}</h3>
                    <p className="text-xs text-slate-500">{t('Dynamic columns from configured blueprints.')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {approvalStatus !== 'Draft' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-xs font-bold border border-amber-200">
                        <Lock className="w-3.5 h-3.5" />
                        {t('Locked')} ({approvalStatus})
                      </span>
                    )}
                    <button
                      onClick={handleSaveGrades}
                      disabled={isSavingGrades || approvalStatus !== 'Draft'}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingGrades ? t('Saving...') : t('Save Draft Marks')}
                    </button>
                  </div>
                </div>

                {blueprints.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {t('Configure at least one Assessment Blueprint to build the gradebook matrix.')}
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-2xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3 text-left">{t('Student Name')}</th>
                          {blueprints.map((bp) => (
                            <th key={bp.id} className="p-3 text-center border-l">
                              {bpKey(bp)} ({bp.weightPercentage}%)
                            </th>
                          ))}
                          <th className="p-3 text-right">{t('Score')}</th>
                          <th className="p-3 text-center">{t('Grade')}</th>
                          <th className="p-3 text-center">{t('GP')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedOffering.studentEnrollments || []).map((enr) => {
                          const s = enr.student;
                          if (!s) return null;
                          const grades = gradebookData[String(s.id)] || {};
                          const calc = calculateStudentFinalScore(s.id);

                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div>{s.firstName} {s.lastName}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.schoolId}</div>
                              </td>
                              {blueprints.map((bp) => {
                                const key = bpKey(bp);
                                const val = grades[key] ?? '';
                                return (
                                  <td key={bp.id} className="p-3 text-center border-l">
                                    <input
                                      type="number"
                                      value={val}
                                      placeholder="—"
                                      disabled={approvalStatus !== 'Draft'}
                                      onChange={(e) => handleGradeCellChange(s.id, key, e.target.value)}
                                      className="w-16 px-2 py-1 text-center bg-transparent border-b font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    />
                                  </td>
                                );
                              })}
                              <td className="p-3 text-right font-black font-mono text-indigo-600 dark:text-indigo-400">
                                {calc.score.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={cn(
                                  'inline-flex px-2 py-0.5 rounded font-bold border text-[10px]',
                                  calc.grade === 'F'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                )}>
                                  {calc.grade}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                {calc.points.toFixed(1)}
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

            {/* ── TAB: GRADE APPROVAL ────────────────────────────────────────── */}
            {activeWorkspaceTab === 'approval' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Grade Approval Workflow')}</h3>
                  <p className="text-xs text-slate-500">{t('Submit completed gradebook for Section Head verification.')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{t('Current Status')}:</span>
                      <span className={cn(
                        'px-3 py-1 rounded-full font-black capitalize',
                        approvalStatus === 'Draft'     ? 'bg-slate-100 text-slate-700' :
                        approvalStatus === 'Submitted' ? 'bg-amber-100 text-amber-700' :
                        approvalStatus === 'Verified'  ? 'bg-purple-100 text-purple-700' :
                        approvalStatus === 'Approved'  ? 'bg-emerald-100 text-emerald-700' :
                        'bg-indigo-100 text-indigo-700'
                      )}>
                        {approvalStatus}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">{t('Submission Comments')}</label>
                      <textarea
                        rows={3}
                        value={approvalComment}
                        placeholder={t('Add review notes, audit reason, or feedback...')}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      {approvalStatus === 'Draft' && (
                        <>
                          <p className="text-xs text-slate-500">{t('Submit your completed gradebook to the Section Head for review.')}</p>
                          <button
                            onClick={() => handleWorkflowTransition('Submitted')}
                            disabled={isSubmittingApproval}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer transition-colors text-xs w-fit"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {t('Submit for Section Head Review')}
                          </button>
                        </>
                      )}
                      {approvalStatus === 'Submitted' && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl flex items-start gap-3">
                          <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                          <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300">{t('Pending Section Head Review')}</p>
                            <p className="text-xs text-amber-700 mt-1">{t('Awaiting verification. Grades are locked from editing.')}</p>
                          </div>
                        </div>
                      )}
                      {approvalStatus === 'Rejected' && (
                        <div className="flex flex-col gap-3">
                          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                            <div>
                              <p className="font-bold text-rose-800 dark:text-rose-300">{t('Rejected — Please Revise')}</p>
                              <p className="text-xs text-rose-700 mt-1">{t('The Section Head has returned grades for corrections. Reset to Draft, make corrections in the Gradebook tab, then re-submit.')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleWorkflowTransition('Draft')}
                            disabled={isSubmittingApproval}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer transition-colors text-xs w-fit"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            {t('Reset to Draft & Revise')}
                          </button>
                        </div>
                      )}
                      {approvalStatus === 'Verified' && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 rounded-xl flex items-start gap-3">
                          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-purple-600" />
                          <div>
                            <p className="font-bold text-purple-800 dark:text-purple-300">{t('Verified by Section Head')}</p>
                            <p className="text-xs text-purple-700 mt-1">{t('Pending final Registrar approval before student release.')}</p>
                          </div>
                        </div>
                      )}
                      {(approvalStatus === 'Approved' || approvalStatus === 'Released') && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                          <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">{t('Grades Approved & Released')}</p>
                            <p className="text-xs text-emerald-700 mt-1">{t('Grades are finalized and visible to students.')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval History */}
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white mb-3">{t('Workflow History')}</h4>
                    {approvalHistory.length === 0 ? (
                      <p className="text-slate-500 italic">{t('No history yet.')}</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {approvalHistory.map((log) => (
                          <div key={log.id} className="p-3 border rounded-xl bg-white dark:bg-slate-900 text-[10px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                                {log.stage}
                              </span>
                              <span className="text-slate-400 font-mono">v{log.versionNumber}</span>
                            </div>
                            {log.comments && (
                              <p className="text-slate-600 dark:text-slate-300 italic">"{log.comments}"</p>
                            )}
                            {log.reviewerName && (
                              <p className="text-[9px] text-slate-400 mt-1">{t('By')}: {log.reviewerName}</p>
                            )}
                            <p className="text-[9px] text-slate-400">
                              {new Date(log.actionDateTime).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: LESSON PLANNER ───────────────────────────────────────── */}
            {activeWorkspaceTab === 'lessonplan' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Lesson Planner & Curriculum')}</h3>
                    <p className="text-xs text-slate-500">{t('Track curriculum topics and create lesson plans linked to this subject.')}</p>
                  </div>
                  <button
                    onClick={() => setShowLpForm((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('New Lesson Plan')}
                  </button>
                </div>

                {/* New LP Form */}
                {showLpForm && (
                  <form onSubmit={handleCreateLessonPlan} className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{t('Create Lesson Plan')}</h4>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Title *')}</label>
                      <input
                        required value={newLpTitle} placeholder={t('e.g. Chapter 3 – Tajweed Rules')}
                        onChange={(e) => setNewLpTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Learning Objectives')}</label>
                      <textarea
                        rows={2} value={newLpObjectives} placeholder={t('What students will learn...')}
                        onChange={(e) => setNewLpObjectives(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Teaching Method')}</label>
                      <input
                        value={newLpMethod} placeholder={t('e.g. Lecture, Group Work, Recitation')}
                        onChange={(e) => setNewLpMethod(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit" disabled={isCreatingLessonPlan}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingLessonPlan ? t('Saving...') : t('Save Plan')}
                      </button>
                      <button type="button" onClick={() => setShowLpForm(false)} className="px-4 py-2 border rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                        {t('Cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Curriculum Topics */}
                {curriculumTopics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{t('Curriculum Topics')}</h4>
                    <div className="space-y-2 text-xs">
                      {curriculumTopics.map((topic) => {
                        const icon = topic.completionStatus === 'Completed' ? CheckSquare :
                                     topic.completionStatus === 'In Progress' ? Activity : Square;
                        const IconComp = icon;
                        return (
                          <div
                            key={topic.id}
                            onClick={() => handleTopicStatusChange(topic)}
                            className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition"
                          >
                            <IconComp className={cn(
                              'w-4 h-4 shrink-0',
                              topic.completionStatus === 'Completed' ? 'text-emerald-600' :
                              topic.completionStatus === 'In Progress' ? 'text-amber-500' : 'text-slate-400'
                            )} />
                            <div className="flex-1">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{topic.title}</span>
                              {topic.description && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{topic.description}</p>
                              )}
                            </div>
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full',
                              topic.completionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              topic.completionStatus === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-650'
                            )}>
                              {topic.completionStatus || 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {totalTopics > 0 && (
                      <p className="text-xs text-slate-500">
                        {coveredTopics}/{totalTopics} {t('topics completed')} ({syllabusComputed}% {t('coverage')})
                      </p>
                    )}
                  </div>
                )}

                {curriculumTopics.length === 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl text-xs text-slate-400 italic">
                    {t('No curriculum topics linked to this subject. Ask administration to configure curriculum topics.')}
                  </div>
                )}

                {/* Lesson Plans Card Grid */}
                {lessonPlans.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{t('Saved Lesson Plans')}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {lessonPlans.map((lp) => {
                        const status = lp.recordStatus || 'Draft';
                        const statusColors: Record<string, string> = {
                          'Draft': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
                          'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
                          'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
                          'Rejected': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                        };

                        return (
                          <div
                            key={lp.id}
                            onClick={() => {
                              setSelectedPlanForDrawer(lp);
                              setShowPlanDrawer(true);
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-3 group cursor-pointer"
                          >
                            <div className="space-y-2.5">
                              {/* Top Row: Status Badge & Lesson Number */}
                              <div className="flex justify-between items-start gap-2">
                                <span className={cn(
                                  "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider",
                                  statusColors[status] || statusColors['Draft']
                                )}>
                                  {status}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono font-medium">
                                  {lp.lessonNumber ? `${t('Lesson')} ${lp.lessonNumber}` : t('Unscheduled')}
                                </span>
                              </div>

                              {/* Title & Subject/Section */}
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                  {lp.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{selectedOffering?.subject?.name || t('Subject')}</span>
                                  <span>&gt;</span>
                                  <span>{selectedOffering?.academicSection?.code || t('Section')}</span>
                                </p>
                              </div>

                              {/* Rejection Alert Box */}
                              {status === 'Rejected' && lp.rejectionReason && (
                                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-[10px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                                  <div>
                                    <strong className="block font-bold">{t('Revision Required')}:</strong>
                                    <span className="italic">"{lp.rejectionReason}"</span>
                                  </div>
                                </div>
                              )}

                              {/* Objectives & Homework Summaries */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                {lp.objectives && (
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase tracking-wider">{t('LEARNING OBJECTIVES')}:</span>
                                    <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                                      {lp.objectives}
                                    </p>
                                  </div>
                                )}
                                {lp.homework && (
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase tracking-wider">{t('HOMEWORK ASSIGNMENT')}:</span>
                                    <p className="text-slate-650 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                                      {lp.homework}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Teacher Profile & Actions */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black">
                                  {teacher?.displayName?.[0] || 'T'}
                                </div>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{teacher?.displayName || t('Faculty')}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                {(!lp.recordStatus || lp.recordStatus === 'Draft') && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLessonPlan(lp.documentId || lp.id);
                                      }}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                      title={t('Delete Plan')}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubmitLessonPlan(lp.documentId || lp.id);
                                      }}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1"
                                      title={t('Submit for Approval')}
                                    >
                                      <Send className="w-3 h-3" />
                                      {t('Submit')}
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPlanForDrawer(lp);
                                    setShowPlanDrawer(true);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded"
                                  title={t('View Details')}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slide-over Detail Drawer Panel for Teacher */}
                {showPlanDrawer && selectedPlanForDrawer && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-end animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setShowPlanDrawer(false)} />

                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between gap-6 overflow-y-auto animate-slide-in-right text-xs text-slate-800 dark:text-slate-200">

                      <div className="space-y-5">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {t('Lesson Plan Details')}
                            </h3>
                          </div>
                          <button
                            onClick={() => setShowPlanDrawer(false)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-400 hover:text-slate-600 border-none bg-transparent"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Title & Lesson Number */}
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedPlanForDrawer.title}</h4>
                          <p className="text-slate-500 font-mono text-xs mt-1">{t('Lesson')} #{selectedPlanForDrawer.lessonNumber || '1'}</p>
                        </div>

                        {/* 2-Column Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('SUBJECT')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedOffering?.subject?.name || t('N/A')}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('CLASS SECTION')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedOffering?.academicSection?.code || t('N/A')}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('SYLLABUS CURRICULUM')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{t('N/A')}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('ACADEMIC CYCLE')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-extrabold">
                              {selectedOffering?.academicYear?.name || t('2026-2027 Academic Year')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('ASSIGNED FACULTY')}</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{teacher?.displayName || t('Faculty')}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('VERIFICATION STATUS')}</span>
                            <strong className={cn(
                              "font-black uppercase text-xs",
                              selectedPlanForDrawer.recordStatus === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' :
                              selectedPlanForDrawer.recordStatus === 'Rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                            )}>{selectedPlanForDrawer.recordStatus || 'Draft'}</strong>
                          </div>
                        </div>

                        {/* Content Blocks */}
                        <div className="space-y-4">
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Learning Objectives')}:</span>
                            <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                              {selectedPlanForDrawer.objectives || t('No learning objectives specified.')}
                            </p>
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Teaching Methods / Syllabi')}:</span>
                            <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                              {selectedPlanForDrawer.teachingMethod || t('No teaching methodology documented.')}
                            </p>
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Homework & Classwork Assignments')}:</span>
                            <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                              {selectedPlanForDrawer.homework || t('No homework assigned.')}
                            </p>
                          </div>

                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block mb-1.5 text-xs">{t('Assessment Criteria')}:</span>
                            <p className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                              {selectedPlanForDrawer.assessmentMethod || t('No assessment method defined.')}
                            </p>
                          </div>

                          {/* Rejection Alert Box inside drawer */}
                          {selectedPlanForDrawer.recordStatus === 'Rejected' && selectedPlanForDrawer.rejectionReason && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-200 space-y-1">
                              <span className="font-black block">{t('Section Head Rejection Notes')}:</span>
                              <p className="italic">"{selectedPlanForDrawer.rejectionReason}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                        {(!selectedPlanForDrawer.recordStatus || selectedPlanForDrawer.recordStatus === 'Draft' || selectedPlanForDrawer.recordStatus === 'Rejected') && (
                          <button
                            onClick={() => {
                              handleSubmitLessonPlan(selectedPlanForDrawer.documentId || selectedPlanForDrawer.id);
                              setShowPlanDrawer(false);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{t('Submit for Section Head Approval')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowPlanDrawer(false)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer border-none"
                        >
                          {t('Close Details')}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {lessonPlans.length === 0 && !showLpForm && (
                  <div className="p-6 border border-dashed rounded-2xl text-center text-slate-400 text-xs">
                    {t('No lesson plans created yet. Click "New Lesson Plan" to get started.')}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: AUDIT TRAIL ──────────────────────────────────────────── */}
            {activeWorkspaceTab === 'audit' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Compliance Audit Trail')}</h3>
                  <p className="text-xs text-slate-500">{t('All recorded changes made inside this workspace.')}</p>
                </div>

                {sectionAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    {t('No modifications logged for this offering yet.')}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {sectionAuditLogs.map((log: any) => (
                      <div key={log.id} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{t(log.action)}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{log.description || log.details}</p>
                        {log.performedBy && (
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            {t('User')}: {typeof log.performedBy === 'object'
                              ? (log.performedBy?.username || log.performedBy?.email || log.performedBy?.id)
                              : log.performedBy}
                          </p>
                        )}
                      </div>
                    ))}
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
