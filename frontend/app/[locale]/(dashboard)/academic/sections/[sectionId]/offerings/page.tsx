"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Layers, Search, ExternalLink, Calendar, Users, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface CourseOffering {
  documentId: string;
  subject?: { name: string; documentId: string };
  gradeLevel?: { name: string; documentId: string };
  teacher?: { name: string; displayName?: string };
  room?: { name: string; code?: string };
  studentEnrollments?: any[];
  academicTerm?: { name: string };
  /** Legacy lowercase status field */
  status?: string;
  /** Strapi all-caps status field (e.g. 'ACTIVE', 'CANCELLED', 'OPEN') */
  offeringStatus?: string;
  capacity?: number;
}

export default function OfferingsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchOfferings() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/course-offerings", {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ["gradeLevel", "subject", "teacher", "room", "studentEnrollments", "academicYear", "academicTerm"],
            pagination: { limit: 100 },
          },
        });
        setOfferings(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch offerings", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOfferings();
  }, [sectionId]);

  const uniqueSubjects = Array.from(new Set(offerings.map(o => o.subject?.name).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(offerings.map(o => o.gradeLevel?.name).filter(Boolean)));

  const filteredOfferings = offerings.filter((o) => {
    if (filterSubject && o.subject?.name !== filterSubject) return false;
    if (filterGrade && o.gradeLevel?.name !== filterGrade) return false;
    const matchesSearch =
      !searchQuery ||
      (o.subject?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.teacher?.displayName || o.teacher?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    return true;
  });

  const totalEnrolled = offerings.reduce((acc, curr) => acc + (curr.studentEnrollments?.length || 0), 0);
  const activeOfferings = offerings.filter(
    o => o.offeringStatus !== "CANCELLED" && o.status !== "cancelled"
  ).length;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-indigo-500" />
              Course Offerings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {section?.name ? `Offerings in ${section.name}` : "Manage section course offerings."}
            </p>
          </div>
          <Link
            href="/lms/offerings"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Offerings Console
          </Link>
        </div>

        <SectionSubNav activeTab="offerings" sectionId={sectionId} />

        {/* Stats Row */}
        {!isLoading && !sectionLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Offerings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{offerings.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeOfferings}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Enrollments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEnrolled}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search Row */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by subject or teacher…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          {/* Grade level filter */}
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white min-w-[200px]"
          >
            <option value="">All Grade Levels</option>
            {uniqueGrades.map((g: any) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white min-w-[200px]"
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map((s: any) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        ) : filteredOfferings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Offerings Found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or create new offerings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOfferings.map((offering) => {
              const enrolled = offering.studentEnrollments?.length || 0;
              const capacity = offering.capacity || section?.capacity || 30;
              const percentFull = Math.min(Math.round((enrolled / capacity) * 100), 100);

              const isActive =
                offering.offeringStatus === "ACTIVE" ||
                offering.offeringStatus === "OPEN" ||
                offering.status === "active" ||
                (!offering.offeringStatus && !offering.status);

              return (
                <div key={offering.documentId} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-2">
                        {offering.gradeLevel?.name || "N/A"}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{offering.subject?.name || "Unknown Subject"}</h3>
                    </div>
                    {isActive ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4 mr-2.5 text-slate-400" />
                      {offering.teacher?.displayName || offering.teacher?.name || "Teacher TBA"}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 mr-2.5 text-slate-400" />
                      {offering.room?.name || "Room TBA"}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4 mr-2.5 text-slate-400" />
                      {offering.academicTerm?.name || "All Year"}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Enrollment</span>
                      <span className="text-slate-500">{enrolled} / {capacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${percentFull > 90 ? 'bg-rose-500' : percentFull > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percentFull}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
