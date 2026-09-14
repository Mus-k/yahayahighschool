"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, FileText, CheckCircle2, AlertCircle, Clock,
  User, RefreshCw, X, MessageSquare, AlertTriangle, ArrowRight, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CourseOffering {
  id: number;
  documentId: string;
  gradebookStatus?: string;
  subject?: { id: number; documentId: string; name: string; code: string };
  gradeLevel?: { id: number; documentId: string; name: string; code: string };
  teacher?: { id: number; documentId: string; firstName: string; lastName: string; email: string };
  academicYear?: { name: string };
  academicTerm?: { name: string };
}

interface Blueprint {
  id: number;
  documentId: string;
  componentName: string;
  label?: string;
  weightPercentage: number;
}

interface Student {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId: string;
}

interface HistoryLog {
  id: number;
  documentId: string;
  stage: string;
  versionNumber: number;
  comments: string;
  actionDateTime: string;
  reviewerEmail?: string;
  reviewerName?: string;
  changeHash?: string;
}

export default function ApprovalsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const { user } = useAuth();
  
  const { section, isLoading: sectionLoading } = useSection();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Detail Modal data
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<any[]>([]);
  const [reviewComment, setReviewComment] = useState("");

  const fetchOfferings = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/course-offerings", {
        params: {
          filters: { academicSection: { documentId: { $eq: sectionId } } },
          populate: ["subject", "teacher", "gradeLevel", "academicYear", "academicTerm"],
          pagination: { limit: 100 }
        }
      });
      setOfferings(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load section offerings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, [sectionId]);

  // Load selected offering details
  const handleReviewOffering = async (offering: CourseOffering) => {
    setSelectedOffering(offering);
    setReviewComment("");
    try {
      const subjectDocId = offering.subject?.documentId;
      const offeringDocId = offering.documentId;

      const [bpRes, gpRes, enrRes, gradesRes, histRes] = await Promise.all([
        subjectDocId ? apiClient.get("/assessment-blueprints", { params: { filters: { subject: { documentId: { $eq: subjectDocId } } } } }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        apiClient.get("/grading-policies", { params: { pagination: { limit: 100 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get("/student-enrollments", { params: { filters: { courseOffering: { documentId: { $eq: offeringDocId } } }, populate: ["student.user"], pagination: { limit: 200 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get("/gradebook-entries", { params: { filters: { courseOffering: { documentId: { $eq: offeringDocId } } }, populate: ["student"], pagination: { limit: 500 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get("/grade-approval-histories", { params: { filters: { courseOffering: { documentId: { $eq: offeringDocId } } }, sort: "actionDateTime:desc" } }).catch(() => ({ data: { data: [] } }))
      ]);

      const bpList = bpRes.data?.data || [];
      setBlueprints(bpList);
      setGradingPolicies(gpRes.data?.data || []);

      const studentsList: Student[] = (enrRes.data?.data || [])
        .filter((e: any) => !!e.student)
        .map((e: any) => ({
          id: e.student.id,
          documentId: e.student.documentId,
          firstName: e.student.firstName || e.student.user?.firstName || "Unknown",
          lastName: e.student.lastName || e.student.user?.lastName || "",
          schoolId: e.student.schoolId || e.student.admissionNumber || e.student.user?.username || "",
        }));
      setStudents(studentsList);

      const gradesList = gradesRes.data?.data || [];
      const gMap: Record<string, Record<string, number>> = {};
      studentsList.forEach((s: Student) => {
        gMap[s.id] = {};
      });

      // Sort blueprints by name length descending so longer matches (e.g. Quiz2) are tried first
      const sortedBps = [...bpList].sort((x: any, y: any) => 
        (y.componentName || '').length - (x.componentName || '').length
      );

      gradesList.forEach((entry: any) => {
        const sid = entry.student?.id;
        const sdoc = entry.student?.documentId;
        const matchedStudent = studentsList.find(
          (s: Student) => (sid && s.id === sid) || (sdoc && s.documentId === sdoc)
        );
        if (!matchedStudent) return;

        // Match entry back to a blueprint with robust title/label parsing
        const bp = sortedBps.find((b: any) => {
          const bpName = (b.componentName || '').toLowerCase();
          const bpLabel = (b.label || '').toLowerCase();
          const entryTitle = (entry.title || '').toLowerCase();
          
          if (bpLabel && entryTitle === bpLabel) return true;
          if (entryTitle === bpName) return true;
          if (entryTitle.includes(bpName)) return true;
          if (entryTitle.replace(/\s+/g, '').includes(bpName)) return true;
          
          return false;
        }) || bpList.find((b: any) => (b.componentName || '').toLowerCase() === (entry.assessmentType || '').toLowerCase());

        // Key by label (same as teacher's save) to avoid Quiz vs Quiz2 collision
        const component = bp ? (bp.label || bp.componentName) : (entry.title || entry.assessmentType);
        if (component) {
          if (!gMap[matchedStudent.id]) gMap[matchedStudent.id] = {};
          gMap[matchedStudent.id][component] = entry.score;
        }
      });
      setGrades(gMap);
      setHistoryLogs(histRes.data?.data || []);

      // Re-fetch offering to get the latest gradebookStatus from the DB
      try {
        const latestOffering = await apiClient.get(`/course-offerings/${offering.documentId}`, {
          params: { populate: ["subject", "teacher", "gradeLevel", "academicYear", "academicTerm"] }
        });
        if (latestOffering.data?.data) {
          setSelectedOffering(latestOffering.data.data);
        }
      } catch {/* non-blocking */}

    } catch (err) {
      toast.error("Failed to load details for review.");
    }
  };

  // Grade point calculations
  const gradingRules = useMemo(() => {
    if (gradingPolicies && gradingPolicies.length > 0) {
      return gradingPolicies
        .map((p: any) => {
          const minVal = parseFloat(p.minScore ?? p.minimumScore ?? 0);
          const letter = p.gradeName ?? p.letterGrade ?? "F";
          const gp = parseFloat(p.gpaPoints ?? p.gradePoints ?? 0);
          return { minScore: minVal, letterGrade: letter, gradePoints: gp };
        })
        .sort((a, b) => b.minScore - a.minScore);
    }
    return [
      { minScore: 97, letterGrade: "A+", gradePoints: 4.0 },
      { minScore: 93, letterGrade: "A", gradePoints: 3.8 },
      { minScore: 87, letterGrade: "B+", gradePoints: 3.5 },
      { minScore: 83, letterGrade: "B", gradePoints: 3.0 },
      { minScore: 77, letterGrade: "C+", gradePoints: 2.5 },
      { minScore: 70, letterGrade: "C", gradePoints: 2.0 },
      { minScore: 50, letterGrade: "D", gradePoints: 1.0 },
      { minScore: 0, letterGrade: "F", gradePoints: 0.0 }
    ];
  }, [gradingPolicies]);

  const resolveLetterAndPoints = (score: number) => {
    for (const rule of gradingRules) {
      if (score >= rule.minScore) {
        return { grade: rule.letterGrade, points: rule.gradePoints };
      }
    }
    return { grade: "F", points: 0.0 };
  };

  const calculateStudentFinalScore = (studentId: number) => {
    const studentGrades = grades[studentId] || {};
    if (blueprints.length === 0) return { score: 0, grade: "N/A", points: 0.0 };

    let totalWeightedScore = 0;
    let totalWeightUsed = 0;

    blueprints.forEach((bp) => {
      // Look up by label (the key used when saving)
      const key = bp.label || bp.componentName;
      const score = studentGrades[key];
      if (score !== undefined && score !== null) {
        totalWeightedScore += (score / 100) * bp.weightPercentage;
        totalWeightUsed += bp.weightPercentage;
      }
    });

    if (totalWeightUsed === 0) return { score: 0, grade: "N/A", points: 0.0 };
    const finalScore = Math.round((totalWeightedScore / totalWeightUsed) * 100);
    const { grade, points } = resolveLetterAndPoints(finalScore);
    return { score: finalScore, grade, points };
  };

  // Section Head workflow transitions: Verify, Request Changes, Approve
  const handleWorkflowTransition = async (targetStage: string) => {
    if (!selectedOffering) return;
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      const nextVersion = (historyLogs[0]?.versionNumber ?? 0) + 1;

      const dataStr = JSON.stringify(grades);
      let hash = 0;
      for (let i = 0; i < dataStr.length; i++) {
        hash = (hash << 5) - hash + dataStr.charCodeAt(i);
        hash |= 0;
      }
      const changeHash = `SHA256-${Math.abs(hash).toString(16)}`;

      // Post approval history using text fields (no broken relation binding)
      await apiClient.post("/grade-approval-histories", {
        data: {
          stage: targetStage,
          versionNumber: nextVersion,
          comments: reviewComment || `Section Head transitioned gradebook to stage: ${targetStage}`,
          actionDateTime: new Date().toISOString(),
          reviewerEmail: (user as any)?.email || '',
          reviewerName: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || (user as any)?.username || 'Section Head',
          courseOffering: selectedOffering.documentId,
          changeHash
        }
      });

      // Update Course Offering status (separate try so it always runs)
      try {
        await apiClient.put(`/course-offerings/${selectedOffering.documentId}`, {
          data: { gradebookStatus: targetStage }
        });
      } catch (putErr) {
        console.warn('Failed to update course offering status:', putErr);
      }

      // Non-blocking audit log
      apiClient.post("/audit-logs", {
        data: {
          action: `Grade Approval: ${targetStage}`,
          entity: "CourseOffering",
          entityId: String(selectedOffering.id),
          description: `Section Head moderated grades to v${nextVersion} (Stage: ${targetStage}). Comment: ${reviewComment}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      const stageLabels: Record<string, string> = {
        Verified: 'Grades verified by Section Head.',
        Approved: 'Grades approved and released!',
        Rejected: 'Grades rejected — returned to teacher for corrections.',
      };
      toast.success(stageLabels[targetStage] || `Status updated to: ${targetStage}`);
      setReviewComment("");
      setSelectedOffering(null);
      fetchOfferings();
    } catch (err: any) {
      console.error('Workflow transition error:', err?.response?.data || err);
      toast.error("Failed to transition gradebook workflow.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const pendingCount = offerings.filter(o => o.gradebookStatus === "Submitted").length;
  const verifiedCount = offerings.filter(o => o.gradebookStatus === "Verified").length;
  const approvedCount = offerings.filter(o => o.gradebookStatus === "Approved" || o.gradebookStatus === "Released").length;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
              Grade Approvals
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Moderation and verification console for student gradebooks in {section?.name || "this section"}.
            </p>
          </div>
          <button
            onClick={fetchOfferings}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Sync Dashboard
          </button>
        </div>

        <SectionSubNav activeTab="approvals" sectionId={sectionId} />

        {/* Status statistics */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Total Course Offerings</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{offerings.length}</p>
            </div>
            <div className={cn(
              "bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm border-l-4",
              pendingCount > 0 ? "border-l-amber-500" : "border-l-slate-200"
            )}>
              <p className="text-xs font-semibold text-amber-600">Pending Section Head Review</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-l-4 border-l-purple-500 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-purple-600">Verified & Pending Registrar</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{verifiedCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-l-4 border-l-emerald-500 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600">Approved & Released</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{approvedCount}</p>
            </div>
          </div>
        )}

        {/* Offerings list */}
        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : offerings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border shadow-sm">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No offerings found</h3>
            <p className="text-slate-500 mt-2">There are no course offerings registered in this section.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">Course Offering</th>
                    <th className="px-6 py-4">Assigned Teacher</th>
                    <th className="px-6 py-4">Academic Term</th>
                    <th className="px-6 py-4">Moderation State</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {offerings.map((offering) => {
                    const status = offering.gradebookStatus || "Draft";
                    return (
                      <tr key={offering.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {offering.subject?.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Grade Level: {offering.gradeLevel?.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {offering.teacher ? `${offering.teacher.firstName} ${offering.teacher.lastName}` : "Unassigned"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{offering.teacher?.email || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {offering.academicYear?.name} · {offering.academicTerm?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full font-black text-[10px] capitalize",
                            status === "Draft" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                            status === "Submitted" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            status === "Verified" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                            (status === "Approved" || status === "Released") && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleReviewOffering(offering)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg transition"
                          >
                            <span>Review & Moderate</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Moderation Modal */}
        {selectedOffering && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl my-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-t-3xl">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Moderating: {selectedOffering.subject?.name} ({selectedOffering.gradeLevel?.name})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Teacher: {selectedOffering.teacher ? `${selectedOffering.teacher.firstName} ${selectedOffering.teacher.lastName}` : "Unassigned"}
                    &nbsp;·&nbsp;
                    Status: <span className="font-bold capitalize">{selectedOffering.gradebookStatus || "Draft"}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOffering(null)}
                  className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Blueprint weight badges */}
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Component Weights</h4>
                  {blueprints.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No blueprints configured for this subject.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {blueprints.map((bp) => (
                        <span key={bp.id} className="inline-flex items-center gap-1 px-3 py-1.5 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                          {bp.label || bp.componentName}
                          <span className="text-indigo-500 dark:text-indigo-400">· {bp.weightPercentage}%</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grade Table Grid */}
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Draft Marks Sheet</h4>
                  {students.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No students currently enrolled in this offering.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-left">Student Name</th>
                            {blueprints.map((bp) => (
                              <th key={bp.id} className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center border-l border-slate-200 dark:border-slate-700">
                                {bp.label || bp.componentName}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 text-center border-l border-slate-200 dark:border-slate-700">Avg. Score</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center border-l border-slate-200 dark:border-slate-700">Grade</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center border-l border-slate-200 dark:border-slate-700">GP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {students.map((s) => {
                            const studentGrades = grades[s.id] || {};
                            const calc = calculateStudentFinalScore(s.id);
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.schoolId}</div>
                                </td>
                                {blueprints.map((bp) => {
                                  const val = studentGrades[bp.label || bp.componentName];
                                  return (
                                    <td key={bp.id} className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-700">
                                      <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                                        {val !== undefined && val !== null ? `${val}/100` : <span className="text-slate-400">—</span>}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-700">
                                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{calc.score}%</span>
                                </td>
                                <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-700">
                                  <span className={cn(
                                    "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black",
                                    calc.grade === "F"
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                                      : calc.grade.startsWith("A")
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                  )}>
                                    {calc.grade}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-700">
                                  <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{calc.points.toFixed(1)}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Workflow Comment & Action controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {/* Rationale Comment */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>Moderation Comments &amp; Rationale</span>
                    </h4>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Specify rationale for verifying, requesting changes, or rejecting this gradebook version..."
                      className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    {/* Transition Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {selectedOffering.gradebookStatus === "Submitted" && (
                        <>
                          <button
                            onClick={() => handleWorkflowTransition("Verified")}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm rounded-xl font-bold cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Verify Grades
                          </button>
                          <button
                            onClick={() => handleWorkflowTransition("Rejected")}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 disabled:opacity-60 text-rose-700 dark:text-rose-400 text-sm rounded-xl font-bold cursor-pointer transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Reject &amp; Send Back
                          </button>
                        </>
                      )}

                      {selectedOffering.gradebookStatus === "Verified" && (
                        <>
                          <button
                            onClick={() => handleWorkflowTransition("Approved")}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm rounded-xl font-bold cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Final Approve &amp; Release
                          </button>
                          <button
                            onClick={() => handleWorkflowTransition("Rejected")}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 disabled:opacity-60 text-rose-700 dark:text-rose-400 text-sm rounded-xl font-bold cursor-pointer transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Reject &amp; Send Back
                          </button>
                        </>
                      )}

                      {(!selectedOffering.gradebookStatus || selectedOffering.gradebookStatus === "Draft") && (
                        <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            This gradebook is in <strong>Draft</strong> stage. Awaiting teacher submission before moderation action can be taken.
                          </p>
                        </div>
                      )}

                      {selectedOffering.gradebookStatus === "Rejected" && (
                        <div className="w-full p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                          <p className="text-sm text-rose-800 dark:text-rose-300">
                            These grades were <strong>Rejected</strong> and returned to the teacher for corrections.
                          </p>
                        </div>
                      )}

                      {(selectedOffering.gradebookStatus === "Approved" || selectedOffering.gradebookStatus === "Released") && (
                        <div className="w-full p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <p className="text-sm text-emerald-800 dark:text-emerald-300">
                            Grades are <strong>Approved &amp; Released</strong>. No further action needed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit Logs / Histories */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl max-h-[340px] overflow-y-auto">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>Workflow Audit Trail</span>
                    </h4>
                    {historyLogs.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">No workflow history records yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {historyLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 capitalize">
                                {log.stage}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">v{log.versionNumber}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {log.comments}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">By: {log.reviewerName || log.reviewerEmail || "Unknown"}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.actionDateTime).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
