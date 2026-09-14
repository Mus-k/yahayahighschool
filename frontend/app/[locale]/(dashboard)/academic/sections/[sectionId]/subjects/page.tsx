"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Search, Book, ExternalLink, ChevronDown, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

interface Subject {
  documentId: string;
  name: string;
  code: string;
  type: string;
  creditValue: number;
  isActive: boolean;
  gradeLevels?: { name: string }[];
  courseOfferings?: any[];
  department?: { name: string };
}

export default function SubjectsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setIsLoading(true);
        const res = await apiClient.get('/course-offerings', {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ['subject.gradeLevels', 'subject.department', 'teacher', 'room', 'studentEnrollments'],
            pagination: { limit: 100 },
          },
        });
        const offerings: any[] = res.data?.data || [];

        // Deduplicate by subject, merging offerings
        const subjectMap = new Map<string, Subject & { courseOfferings: any[] }>();
        offerings.forEach((o: any) => {
          const s = o.subject;
          if (!s?.documentId) return;
          if (!subjectMap.has(s.documentId)) {
            subjectMap.set(s.documentId, { ...s, courseOfferings: [o] });
          } else {
            subjectMap.get(s.documentId)!.courseOfferings.push(o);
          }
        });
        setSubjects(Array.from(subjectMap.values()));
      } catch (error) {
        console.error('Failed to fetch subjects', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubjects();
  }, [sectionId]);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Book className="h-6 w-6 text-indigo-500" />
              Subjects in {section?.name || "Section"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View and manage subjects offered in this section.
            </p>
          </div>
          <Link
            href="/lms/subjects"
            className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Global Subject Management
          </Link>
        </div>

        <SectionSubNav activeTab="subjects" sectionId={sectionId} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
          <div className="flex items-center gap-4 relative">
            <Search className="h-5 w-5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Book className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Subjects Found</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              {searchQuery
                ? "No subjects match your search."
                : "There are no subjects associated with this section yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Code</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Grade Levels</th>
                    <th className="px-6 py-4 font-medium">Offerings</th>
                    <th className="px-6 py-4 font-medium">Students</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSubjects.map((subject) => {
                    const isExpanded = expandedSubject === subject.documentId;
                    const offerings = subject.courseOfferings || [];
                    const totalStudents = offerings.reduce(
                      (sum: number, o: any) => sum + (o.studentEnrollments?.length || 0),
                      0
                    );

                    return (
                      <Fragment key={subject.documentId}>
                        <tr
                          onClick={() => setExpandedSubject(isExpanded ? null : subject.documentId)}
                          className={`cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                            isExpanded ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{subject.name}</p>
                                <p className="text-xs text-slate-500">{subject.department?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                            {subject.code}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {subject.type || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {subject.gradeLevels?.map((g) => g.name).join(", ") || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                              {offerings.length}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-900/30 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
                              <Users className="h-3 w-3" />
                              {totalStudents}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {subject.isActive !== false ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Inactive
                              </span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <td colSpan={7} className="px-14 py-6 border-l-2 border-indigo-500">
                              <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                                Course Offerings
                              </h4>
                              {offerings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {offerings.map((offering: any) => (
                                    <div
                                      key={offering.id || offering.documentId}
                                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                      <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        Teacher:{" "}
                                        {offering.teacher?.displayName ||
                                          offering.teacher?.name ||
                                          "TBA"}
                                      </p>
                                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                        <p>Room: {offering.room?.name || "TBA"}</p>
                                        <p>Enrolled: {offering.studentEnrollments?.length || 0} students</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No active offerings for this subject.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
