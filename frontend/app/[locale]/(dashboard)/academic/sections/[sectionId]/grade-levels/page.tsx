"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { BookOpen, Users, Plus, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";

interface GradeLevel {
  documentId: string;
  name: string;
  code: string;
  order: number;
}

interface CourseOffering {
  documentId: string;
  subject?: { name: string; documentId: string };
  teacher?: { name: string; displayName?: string };
  studentEnrollments?: any[];
  gradeLevel?: { documentId: string };
}

export default function GradeLevelsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;
  const selectedGradeId = searchParams.get("gradeLevel");

  const { section, isLoading: sectionLoading } = useSection();
  
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [gradesRes, offeringsRes] = await Promise.all([
          apiClient.get("/grade-levels", {
            params: {
              filters: { sections: { documentId: { $eq: sectionId } } },
            },
          }),
          apiClient.get("/course-offerings", {
            params: {
              filters: { academicSection: { documentId: { $eq: sectionId } } },
              populate: ["gradeLevel", "subject", "teacher", "studentEnrollments"],
            },
          }),
        ]);
        
        setGradeLevels(gradesRes.data?.data || []);
        setOfferings(offeringsRes.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch grade levels data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [sectionId]);

  const selectedGrade = gradeLevels.find((g) => g.documentId === selectedGradeId);
  const selectedOfferings = offerings.filter((o) => o.gradeLevel?.documentId === selectedGradeId);

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-500" />
              {section?.name ? `${section.name} - Grade Levels` : "Grade Levels"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and view grades associated with this section.
            </p>
          </div>
          <Link
            href="/academic-structure"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Grade Level
          </Link>
        </div>

        <SectionSubNav activeTab="grade-levels" sectionId={sectionId} />

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {gradeLevels.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Grade Levels</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  There are no grade levels associated with this section yet. Add some from the global academic structure.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gradeLevels.map((grade) => {
                  const gradeOfferings = offerings.filter((o) => o.gradeLevel?.documentId === grade.documentId);
                  const uniqueSubjects = new Set(gradeOfferings.map((o) => o.subject?.name).filter(Boolean));
                  
                  return (
                    <div
                      key={grade.documentId}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border p-6 transition-all hover:shadow-md ${
                        selectedGradeId === grade.documentId 
                          ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md" 
                          : "border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{grade.name}</h3>
                            <p className="text-sm text-slate-500">Code: {grade.code} • Order: {grade.order}</p>
                          </div>
                          <div className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        </div>
                        
                        <div className="mt-6 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>{gradeOfferings.length} Offerings</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{uniqueSubjects.size} Subjects</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => router.push(`/academic/sections/${sectionId}/grade-levels?gradeLevel=${grade.documentId}`)}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedGrade && (
              <div className="mt-8 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {selectedGrade.name} Details
                  </h3>
                </div>
                <div className="p-6">
                  {selectedOfferings.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No course offerings in this grade level for this section.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-medium rounded-l-lg">Subject</th>
                            <th className="px-4 py-3 font-medium">Teacher</th>
                            <th className="px-4 py-3 font-medium rounded-r-lg">Students Enrolled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedOfferings.map((offering) => (
                            <tr key={offering.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {offering.subject?.name || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                {offering.teacher?.displayName || offering.teacher?.name || "Unassigned"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                  {offering.studentEnrollments?.length || 0} enrolled
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
