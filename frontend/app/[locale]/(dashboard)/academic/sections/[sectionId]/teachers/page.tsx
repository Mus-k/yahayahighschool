"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import {
  UserCheck, ChevronDown, ChevronRight, BookOpen, Users, Search, ExternalLink
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { cn } from "@/lib/utils";
import React from "react";

function resolveTeacherName(teacher: any): string {
  if (teacher.name?.trim()) return teacher.name.trim();
  if (teacher.displayName?.trim()) return teacher.displayName.trim();
  const direct = `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim();
  if (direct) return direct;
  const fromUser = `${teacher.user?.firstName ?? ""} ${teacher.user?.lastName ?? ""}`.trim();
  if (fromUser) return fromUser;
  if (teacher.user?.email) return teacher.user.email.split("@")[0];
  return "Unknown Teacher";
}

function resolveInitials(name: string): string {
  if (!name || name === "Unknown Teacher") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────────────────────
interface Teacher {
  documentId: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photo?: any;
  avatar?: any;
  user?: { email?: string; firstName?: string; lastName?: string; avatar?: any; photoUrl?: string };
  offerings?: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TeachersPage() {
  const params    = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [teachers, setTeachers]         = useState<Teacher[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [search, setSearch]             = useState("");

  useEffect(() => {
    async function fetchTeachers() {
      try {
        setIsLoading(true);
        const [teachersRes, offeringsRes] = await Promise.all([
          apiClient.get("/teachers", {
            params: {
              filters: { sections: { documentId: { $eq: sectionId } } },
              // Include photo + user.avatar so profile images resolve
              populate: ["user", "user.avatar", "photo"],
              pagination: { limit: 100 },
            },
          }),
          apiClient.get("/course-offerings", {
            params: {
              filters: { academicSection: { documentId: { $eq: sectionId } } },
              // Include teacher photo for offerings-based teacher merging
              populate: ["teacher", "teacher.user", "teacher.user.avatar", "teacher.photo", "subject", "gradeLevel", "studentEnrollments"],
              pagination: { limit: 100 },
            },
          }),
        ]);

        const teacherList: any[] = teachersRes.data?.data || [];
        const offerings: any[]   = offeringsRes.data?.data || [];

        // Build teacher-to-offerings map from course-offerings
        const offeringTeachersMap = new Map<string, any>();
        offerings.forEach((o: any) => {
          if (o.teacher?.documentId) {
            const key = o.teacher.documentId;
            if (!offeringTeachersMap.has(key)) {
              offeringTeachersMap.set(key, { ...o.teacher, offerings: [o] });
            } else {
              offeringTeachersMap.get(key).offerings.push(o);
            }
          }
        });

        // Merge the direct /teachers response (has photo/user populated) with offerings data
        const finalTeachers = teacherList.map((t: any) => {
          const mapT = offeringTeachersMap.get(t.documentId);
          return { ...t, offerings: mapT ? mapT.offerings : [] };
        });

        // Add teachers from offerings not in the direct list
        offeringTeachersMap.forEach((val, key) => {
          if (!finalTeachers.find((ft: any) => ft.documentId === key)) {
            finalTeachers.push(val);
          }
        });

        setTeachers(finalTeachers);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeachers();
  }, [sectionId]);

  const filteredTeachers = search.trim()
    ? teachers.filter((t) =>
        resolveTeacherName(t).toLowerCase().includes(search.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : teachers;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Teachers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Instructors assigned to {section?.name || "this section"}.
            </p>
          </div>
          <span className="inline-flex items-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-black text-indigo-700 dark:text-indigo-400">
            {teachers.length} Teacher{teachers.length !== 1 ? "s" : ""}
          </span>
        </div>

        <SectionSubNav activeTab="teachers" sectionId={sectionId} />

        {/* ── Search ── */}
        {!isLoading && teachers.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teachers by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow border-none"
              />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <UserCheck className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-black text-slate-700 dark:text-slate-300">No Teachers Assigned</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5">Assign teachers to course offerings in this section.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Scrollable table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Teacher</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Subjects Taught</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Classes</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Students</th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTeachers.map((teacher, idx) => {
                    const isExpanded   = expandedTeacher === teacher.documentId;
                    const offerings    = teacher.offerings || [];
                    const name         = resolveTeacherName(teacher);
                    const uniqueSubjects = Array.from(new Set(offerings.map((o: any) => o.subject?.name).filter(Boolean))) as string[];
                    const totalStudents  = offerings.reduce((acc: number, curr: any) => acc + (curr.studentEnrollments?.length || 0), 0);

                    return (
                      <React.Fragment key={teacher.documentId}>
                        <tr
                          onClick={() => setExpandedTeacher(isExpanded ? null : teacher.documentId)}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isExpanded
                              ? "bg-indigo-50/60 dark:bg-indigo-900/10"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          )}
                        >
                          {/* Teacher name + avatar */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                                : <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              }
                              <Avatar
                                src={teacher.photo || teacher.user?.avatar}
                                name={name}
                                size="md"
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{name}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">{teacher.user?.email || "—"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Subjects */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {uniqueSubjects.slice(0, 2).map((s, i) => (
                                <span key={i} className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                                  {s}
                                </span>
                              ))}
                              {uniqueSubjects.length > 2 && (
                                <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                  +{uniqueSubjects.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Classes count */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              {offerings.length}
                            </span>
                          </td>

                          {/* Students count */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              <Users className="h-3.5 w-3.5" />
                              {totalStudents}
                            </span>
                          </td>

                          {/* Profile link — i18n-aware */}
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/teachers/${teacher.documentId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 text-xs font-black transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Profile
                            </Link>
                          </td>
                        </tr>

                        {/* Expandable offerings row */}
                        {isExpanded && (
                          <tr className="bg-indigo-50/30 dark:bg-indigo-900/5">
                            <td colSpan={5} className="px-14 py-5 border-l-4 border-indigo-500">
                              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                Assigned Classes in Section
                              </h4>
                              {offerings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {offerings.map((offering: any) => (
                                    <div
                                      key={offering.id || offering.documentId}
                                      className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{offering.subject?.name || "—"}</p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{offering.gradeLevel?.name || "—"}</p>
                                      </div>
                                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                                        <Users className="h-3 w-3" />
                                        {offering.studentEnrollments?.length || 0}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic">No active classes in this section.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-sm text-slate-400 dark:text-slate-500 italic">
                        No teachers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                Showing {filteredTeachers.length} of {teachers.length} teachers
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Click a row to see assigned classes
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
