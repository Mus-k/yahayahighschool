"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Users, Search, ChevronRight, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { cn } from "@/lib/utils";

interface StudentEnrollment {
  documentId: string;
  student?: {
    documentId: string;
    schoolId?: string;
    studentId?: string;
    photo?: any;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: any;
      photoUrl?: string;
      avatarUrl?: string;
    };
  };
  courseOffering?: {
    subject?: { name: string };
    gradeLevel?: { name: string };
  };
  enrollmentStatus?: string;
}

export default function StudentsPage() {
  const params    = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterGrade, setFilterGrade]   = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/student-enrollments", {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            // Include photo and user.avatar so profile images resolve correctly
            populate: [
              "student.user",
              "student.user.avatar",
              "student.photo",
              "courseOffering.subject",
              "courseOffering.gradeLevel",
            ],
            pagination: { limit: 500 },
          },
        });

        const enrollments: StudentEnrollment[] = res.data?.data || [];
        const studentMap = new Map<string, any>();

        enrollments.forEach((enc) => {
          const s = enc.student;
          if (s && s.documentId) {
            if (!studentMap.has(s.documentId)) {
              studentMap.set(s.documentId, { ...s, enrollments: [enc] });
            } else {
              studentMap.get(s.documentId).enrollments.push(enc);
            }
          }
        });

        setStudentsData(Array.from(studentMap.values()));
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, [sectionId]);

  // Derive unique grades
  const uniqueGrades = Array.from(
    new Set(
      studentsData.flatMap((s) =>
        s.enrollments.map((e: any) => e.courseOffering?.gradeLevel?.name).filter(Boolean)
      )
    )
  ) as string[];

  const filteredStudents = studentsData.filter((s) => {
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (s.schoolId && s.schoolId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGrade = filterGrade
      ? s.enrollments.some((e: any) => e.courseOffering?.gradeLevel?.name === filterGrade)
      : true;

    return matchesSearch && matchesGrade;
  });

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Students in Section
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Students enrolled in {section?.name || "this section"}.
            </p>
          </div>
          <span className="inline-flex items-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-black text-indigo-700 dark:text-indigo-400">
            {studentsData.length} Student{studentsData.length !== 1 ? "s" : ""}
          </span>
        </div>

        <SectionSubNav activeTab="students" sectionId={sectionId} />

        {/* ── Search + Filter ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow border-none"
            />
          </div>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white min-w-[180px] border-none"
          >
            <option value="">All Grade Levels</option>
            {uniqueGrades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* ── Content ── */}
        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <User className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-black text-slate-700 dark:text-slate-300">No Students Found</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5">Try adjusting your search or grade filter.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Scrollable container — both X and Y */}
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">School ID</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Grade Level(s)</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Enrolled Subjects</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((student, idx) => {
                    const firstName = student.user?.firstName || "";
                    const lastName  = student.user?.lastName  || "";
                    const fullName  = `${firstName} ${lastName}`.trim() || "—";
                    const grades    = Array.from(new Set(
                      student.enrollments.map((e: any) => e.courseOffering?.gradeLevel?.name).filter(Boolean)
                    )) as string[];
                    const subjects  = Array.from(new Set(
                      student.enrollments.map((e: any) => e.courseOffering?.subject?.name).filter(Boolean)
                    )) as string[];
                    const schoolId  = student.schoolId || student.studentId || "—";

                    return (
                      <tr
                        key={student.documentId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Name + Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={student.photo}
                              name={`${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Student'}
                              size="md"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{fullName}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{student.user?.email || "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* School ID */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {schoolId}
                          </span>
                        </td>

                        {/* Grades */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {grades.map((g, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Subjects */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {subjects.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
                              >
                                {s}
                              </span>
                            ))}
                            {subjects.length > 3 && (
                              <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                +{subjects.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action — uses i18n-aware Link */}
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/students/${student.documentId}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 text-xs font-black transition-colors"
                          >
                            View Profile
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Row count footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                Showing {filteredStudents.length} of {studentsData.length} students
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
