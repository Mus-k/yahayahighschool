"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Award, ExternalLink, ChevronDown, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GradingPolicy {
  id: number;
  minimumScore: number;
  letterGrade: string;
  gradePoints: number;
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

interface OfferingGroup {
  offeringId: number;
  offeringDocId: string;
  subjectName: string;
  teacherName: string;
  gradebookStatus: string;
  blueprints: Blueprint[];
  students: Student[];
  grades: Record<string, Record<string, number>>; // studentId → label → score
}

export default function GradebookPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [offeringGroups, setOfferingGroups] = useState<OfferingGroup[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<GradingPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOfferings, setExpandedOfferings] = useState<Set<number>>(new Set());

  const toggleOffering = (id: number) => {
    setExpandedOfferings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        setIsLoading(true);

        // 1. Fetch grading policies for letter grade calculation
        const gpRes = await apiClient.get("/grading-policies", {
          params: { pagination: { limit: 100 } },
        }).catch(() => ({ data: { data: [] } }));
        const gps: GradingPolicy[] = gpRes.data?.data || [];
        setGradingPolicies(gps);

        // 2. Fetch all course offerings for this section
        const offeringsRes = await apiClient.get("/course-offerings", {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ["subject", "teacher", "gradeLevel", "studentEnrollments.student.user"],
            pagination: { limit: 100 },
          },
        });
        const offerings: any[] = offeringsRes.data?.data || [];
        if (offerings.length === 0) { setIsLoading(false); return; }

        // 3. Collect subject documentIds to fetch blueprints
        const subjectDocIds = [...new Set(
          offerings.map((o: any) => o.subject?.documentId).filter(Boolean)
        )];

        // 4. Fetch blueprints for these subjects
        const bpRes = await apiClient.get("/assessment-blueprints", {
          params: {
            filters: { subject: { documentId: { $in: subjectDocIds } } },
            populate: ["subject"],
            pagination: { limit: 500 },
          },
        }).catch(() => ({ data: { data: [] } }));
        const allBlueprints: any[] = bpRes.data?.data || [];

        const entriesRes = await apiClient.get("/gradebook-entries", {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            populate: ["student", "courseOffering"],
            pagination: { limit: 500 },
          },
        }).catch(() => ({ data: { data: [] } }));
        const allEntries: any[] = entriesRes.data?.data || [];

        // 6. Build offering groups
        const groups: OfferingGroup[] = offerings.map((o: any) => {
          // Blueprints for this offering's subject
          const bps: Blueprint[] = allBlueprints.filter(
            (bp: any) => bp.subject?.documentId === o.subject?.documentId
          );

          // Students enrolled
          const students: Student[] = (o.studentEnrollments || [])
            .filter((e: any) => !!e.student)
            .map((e: any) => ({
              id: e.student.id,
              documentId: e.student.documentId,
              firstName: e.student.firstName || e.student.user?.firstName || "Unknown",
              lastName: e.student.lastName || e.student.user?.lastName || "",
              schoolId: e.student.schoolId || e.student.admissionNumber || "",
            }));

          // Entries for this offering — match by documentId (Strapi v5 uses string documentIds)
          const offeringEntries = allEntries.filter(
            (entry: any) =>
              entry.courseOffering?.documentId === o.documentId ||
              (o.id && entry.courseOffering?.id === o.id)
          );

          // Map: studentId → (label → score)
          const grades: Record<string, Record<string, number>> = {};
          students.forEach(s => { grades[s.id] = {}; });

          // Sort blueprints by name length descending so longer matches (e.g. Quiz2) are tried first
          const sortedBps = [...bps].sort((x: any, y: any) => 
            (y.componentName || '').length - (x.componentName || '').length
          );

          offeringEntries.forEach((entry: any) => {
            const sid = entry.student?.id;
            if (!sid) return;

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
            }) || bps.find((b: any) => (b.componentName || '').toLowerCase() === (entry.assessmentType || '').toLowerCase());

            const colKey = bp ? (bp.label || bp.componentName) : (entry.title || entry.assessmentType);
            if (colKey && sid) {
              if (!grades[sid]) grades[sid] = {};
              grades[sid][colKey] = entry.score;
            }
          });

          const teacher = o.teacher;
          const teacherName = teacher
            ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
            : "Unassigned";

          return {
            offeringId: o.id,
            offeringDocId: o.documentId,
            subjectName: o.subject?.name || "Unknown Subject",
            teacherName,
            gradebookStatus: o.gradebookStatus || "Draft",
            blueprints: bps,
            students,
            grades,
          };
        });

        setOfferingGroups(groups);
        // Auto-expand all offerings
        setExpandedOfferings(new Set(groups.map(g => g.offeringId)));
      } catch (error) {
        console.error("Failed to fetch section gradebook", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, [sectionId]);

  const calcGrade = (studentId: number, group: OfferingGroup) => {
    const studentGrades = group.grades[studentId] || {};
    if (group.blueprints.length === 0) return { score: 0, grade: "N/A", points: 0 };

    let weighted = 0;
    let totalWeight = 0;
    group.blueprints.forEach(bp => {
      const key = bp.label || bp.componentName;
      const val = studentGrades[key];
      if (val !== undefined && val !== null) {
        weighted += (val / 100) * bp.weightPercentage;
        totalWeight += bp.weightPercentage;
      }
    });

    const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;

    const rules = (gradingPolicies && gradingPolicies.length > 0)
      ? gradingPolicies.map((p: any) => ({
          minScore: parseFloat(p.minScore ?? p.minimumScore ?? 0),
          letterGrade: p.gradeName ?? p.letterGrade ?? "F",
          gradePoints: parseFloat(p.gpaPoints ?? p.gradePoints ?? 0),
        })).sort((a, b) => b.minScore - a.minScore)
      : [
          { minScore: 97, letterGrade: "A+", gradePoints: 4.0 },
          { minScore: 93, letterGrade: "A", gradePoints: 3.8 },
          { minScore: 87, letterGrade: "B+", gradePoints: 3.5 },
          { minScore: 83, letterGrade: "B", gradePoints: 3.0 },
          { minScore: 77, letterGrade: "C+", gradePoints: 2.5 },
          { minScore: 70, letterGrade: "C", gradePoints: 2.0 },
          { minScore: 50, letterGrade: "D", gradePoints: 1.0 },
          { minScore: 0, letterGrade: "F", gradePoints: 0.0 }
        ];

    const matched = rules.find(r => score >= r.minScore);
    const grade = matched?.letterGrade || "F";
    const points = matched?.gradePoints ?? 0;

    return { score, grade, points };
  };

  const totalEntries = useMemo(() =>
    offeringGroups.reduce((acc, g) =>
      acc + Object.values(g.grades).reduce((a, v) => a + Object.keys(v).length, 0), 0),
    [offeringGroups]
  );

  const statusColor = (status: string) => {
    if (status === "Approved" || status === "Released") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (status === "Verified") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    if (status === "Submitted") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* Page header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-indigo-500" />
              Gradebook
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View student grades and assessments for <strong>{section?.name || "this section"}</strong>.
            </p>
          </div>
          <Link
            href="/lms/gradebook"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Full Gradebook Console
          </Link>
        </div>

        <SectionSubNav activeTab="gradebook" sectionId={sectionId} />

        {/* Summary stats */}
        {!isLoading && offeringGroups.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Course Offerings", value: offeringGroups.length, color: "indigo" },
              { label: "Total Entries", value: totalEntries, color: "slate" },
              { label: "Submitted", value: offeringGroups.filter(g => g.gradebookStatus === "Submitted").length, color: "amber" },
              { label: "Verified / Approved", value: offeringGroups.filter(g => ["Verified","Approved","Released"].includes(g.gradebookStatus)).length, color: "emerald" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <p className={`text-sm font-medium text-${s.color}-600 dark:text-${s.color}-400`}>{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {(isLoading || sectionLoading) && (
          <div className="animate-pulse space-y-4">
            <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !sectionLoading && offeringGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Grades Recorded</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
              There are no gradebook entries for this section yet. Teachers must save and submit grades.
            </p>
          </div>
        )}

        {/* Gradebook Spreadsheet per offering */}
        {!isLoading && offeringGroups.map(group => (
          <div key={group.offeringId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Offering Header */}
            <button
              onClick={() => toggleOffering(group.offeringId)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 hover:from-indigo-100 dark:hover:from-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedOfferings.has(group.offeringId) ? (
                  <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                )}
                <div className="text-left">
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">{group.subjectName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Teacher: {group.teacherName} &nbsp;·&nbsp; {group.students.length} students &nbsp;·&nbsp; {group.blueprints.length} assessments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold capitalize", statusColor(group.gradebookStatus))}>
                  {group.gradebookStatus}
                </span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </button>

            {/* Spreadsheet Table */}
            {expandedOfferings.has(group.offeringId) && (
              <div className="overflow-x-auto">
                {group.students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-slate-400 dark:text-slate-600">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">No students enrolled in this offering.</p>
                  </div>
                ) : group.blueprints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-slate-400 dark:text-slate-600">
                    <Award className="h-8 w-8 mb-2" />
                    <p className="text-sm">No assessment blueprints configured. Teacher needs to set up assessments first.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-left whitespace-nowrap sticky left-0 bg-slate-50 dark:bg-slate-800">
                          Student Name
                        </th>
                        {group.blueprints.map(bp => (
                          <th
                            key={bp.id}
                            className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-l border-slate-100 dark:border-slate-700 whitespace-nowrap"
                          >
                            <div>{bp.label || bp.componentName}</div>
                            <div className="text-[10px] font-normal text-slate-400">{bp.weightPercentage}%</div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 text-center border-l border-slate-100 dark:border-slate-700 whitespace-nowrap">
                          Avg. Score
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center border-l border-slate-100 dark:border-slate-700">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 text-center border-l border-slate-100 dark:border-slate-700">
                          GP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.students.map(s => {
                        const calc = calcGrade(s.id, group);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-5 py-3 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                              <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.schoolId}</p>
                            </td>
                            {group.blueprints.map(bp => {
                              const key = bp.label || bp.componentName;
                              const val = group.grades[s.id]?.[key];
                              return (
                                <td key={bp.id} className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                                  {val !== undefined && val !== null ? (
                                    <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                                      {val}<span className="text-slate-400 text-xs">/100</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{calc.score}%</span>
                            </td>
                            <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800">
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
                            <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                              <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{calc.points.toFixed(1)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
