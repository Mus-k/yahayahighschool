"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import {
  FileText, ExternalLink, Activity, BookOpen,
  Hash, ChevronRight, Users, Search, X,
  GraduationCap, BarChart3, CheckCircle2, Award,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Teacher {
  documentId: string;
  name?: string;          // Strapi teacher model primary name field
  displayName?: string;  // alternate
  firstName?: string;
  lastName?: string;
  user?: { email?: string; firstName?: string; lastName?: string };
  offerings: OfferingSlim[];
}

interface OfferingSlim {
  documentId: string;
  subject?: { documentId: string; name: string; code?: string };
}

interface Blueprint {
  documentId: string;
  componentName: string;
  label?: string;
  weightPercentage: number;
  subject?: { documentId: string; name: string; code?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve the best display name from all possible Strapi teacher fields */
function teacherName(t: Teacher): string {
  // 1. Direct name field (Strapi teacher model)
  if (t.name?.trim()) return t.name.trim();
  // 2. displayName field
  if (t.displayName?.trim()) return t.displayName.trim();
  // 3. firstName + lastName directly on teacher
  const direct = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
  if (direct) return direct;
  // 4. From linked user record
  const fromUser = `${t.user?.firstName ?? ""} ${t.user?.lastName ?? ""}`.trim();
  if (fromUser) return fromUser;
  // 5. Email username as last resort
  if (t.user?.email) return t.user.email.split("@")[0];
  return "Unknown Teacher";
}

function teacherInitials(t: Teacher): string {
  const full = teacherName(t);
  if (full === "Unknown Teacher") return "?";
  const parts = full.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function componentColor(name: string): { badge: string; bar: string; bg: string; text: string } {
  const n = name.toLowerCase();
  if (n.includes("exam"))          return { badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",  bar: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20",  text: "text-indigo-600 dark:text-indigo-400" };
  if (n.includes("quiz"))          return { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" };
  if (n.includes("homework") || n.includes("assignment")) return { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",  bar: "bg-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-600 dark:text-amber-400" };
  if (n.includes("participation")) return { badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",       bar: "bg-sky-500",    bg: "bg-sky-50 dark:bg-sky-900/20",    text: "text-sky-600 dark:text-sky-400" };
  if (n.includes("project"))       return { badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", bar: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" };
  return { badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", bar: "bg-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-400" };
}

// Avatar gradient colors by index
const AVATAR_GRADIENTS = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Selector Card
// ─────────────────────────────────────────────────────────────────────────────
function TeacherCard({
  teacher,
  index,
  isSelected,
  blueprintCount,
  subjectCount,
  onClick,
}: {
  teacher: Teacher;
  index: number;
  isSelected: boolean;
  blueprintCount: number;
  subjectCount: number;
  onClick: () => void;
}) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border-2 p-5 transition-all duration-200",
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 bg-gradient-to-br shadow-sm",
          gradient
        )}>
          {teacherInitials(teacher)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("font-black text-sm truncate", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-white")}>
              {teacherName(teacher)}
            </p>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            )}
          </div>
          {teacher.user?.email && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{teacher.user.email}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
              isSelected ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}>
              <BookOpen className="w-3 h-3" />
              {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
              isSelected ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}>
              <BarChart3 className="w-3 h-3" />
              {blueprintCount} blueprint{blueprintCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <ChevronRight className={cn(
          "w-4 h-4 flex-shrink-0 transition-transform self-center",
          isSelected ? "text-indigo-500 rotate-90" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400"
        )} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Card
// ─────────────────────────────────────────────────────────────────────────────
function BlueprintCard({ blueprint, index }: { blueprint: Blueprint; index: number }) {
  const colors = componentColor(blueprint.componentName);
  return (
    <div className={cn(
      "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-all duration-200 group",
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide", colors.badge)}>
          {blueprint.componentName}
        </span>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black", colors.badge)}>
          <Hash className="w-3 h-3" />
          {blueprint.weightPercentage}%
        </div>
      </div>

      {/* Title */}
      <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight mb-1">
        {blueprint.label || blueprint.componentName}
      </h3>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mb-4">
        {blueprint.subject?.code}
      </p>

      {/* Subject */}
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", colors.bg)}>
          <BookOpen className={cn("w-3.5 h-3.5", colors.text)} />
        </div>
        <span className="font-semibold truncate">{blueprint.subject?.name || "General"}</span>
      </div>

      {/* Weight bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="uppercase tracking-wider">Weight</span>
          <span className={colors.text}>{blueprint.weightPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", colors.bar)}
            style={{ width: `${blueprint.weightPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();

  const [teachers, setTeachers]         = useState<Teacher[]>([]);
  const [allBlueprints, setAllBlueprints] = useState<Blueprint[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [selectedTeacherDocId, setSelectedTeacherDocId] = useState<string | null>(null);
  const [search, setSearch]             = useState("");

  // ── Fetch teachers + their course offerings + blueprints ──────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Step 1: All course offerings for this section (with teacher + subject)
        const offeringsRes = await apiClient.get("/course-offerings", {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ["teacher", "teacher.user", "subject"],
            pagination: { limit: 200 },
          },
        });
        const offerings: any[] = offeringsRes.data?.data || [];

        // Build teacher map with their subjects
        const teacherMap = new Map<string, Teacher>();
        const subjectDocIds: string[] = [];

        offerings.forEach((o: any) => {
          const t = o.teacher;
          const s = o.subject;
          if (!t?.documentId) return;

          if (!teacherMap.has(t.documentId)) {
            teacherMap.set(t.documentId, {
              documentId: t.documentId,
              name: t.name,
              displayName: t.displayName,
              firstName: t.firstName,
              lastName: t.lastName,
              user: t.user,
              offerings: [],
            });
          }
          teacherMap.get(t.documentId)!.offerings.push({ documentId: o.documentId, subject: s });

          if (s?.documentId && !subjectDocIds.includes(s.documentId)) {
            subjectDocIds.push(s.documentId);
          }
        });

        // Also fetch teachers via sections relation (may not have offerings listed)
        const teachersRes = await apiClient.get("/teachers", {
          params: {
            filters: { sections: { documentId: { $eq: sectionId } } },
            populate: ["user"],
            pagination: { limit: 100 },
          },
        });
        (teachersRes.data?.data || []).forEach((t: any) => {
          if (!teacherMap.has(t.documentId)) {
            teacherMap.set(t.documentId, {
              documentId: t.documentId,
              name: t.name,
              displayName: t.displayName,
              firstName: t.firstName,
              lastName: t.lastName,
              user: t.user,
              offerings: [],
            });
          } else {
            // Enrich existing entry with name fields from /teachers response
            const existing = teacherMap.get(t.documentId)!;
            if (!existing.name && t.name) existing.name = t.name;
            if (!existing.displayName && t.displayName) existing.displayName = t.displayName;
            if (!existing.firstName && t.firstName) existing.firstName = t.firstName;
            if (!existing.lastName && t.lastName) existing.lastName = t.lastName;
            if (!existing.user && t.user) existing.user = t.user;
          }
        });

        const teacherList = Array.from(teacherMap.values());
        setTeachers(teacherList);

        // Step 2: Fetch all blueprints for subjects in this section
        if (subjectDocIds.length > 0) {
          const bpRes = await apiClient.get("/assessment-blueprints", {
            params: {
              filters: { subject: { documentId: { $in: subjectDocIds } } },
              populate: ["subject"],
              pagination: { limit: 500 },
            },
          });
          setAllBlueprints(bpRes.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch assessments data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [sectionId]);

  // ── Selected teacher object ───────────────────────────────────────────────
  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.documentId === selectedTeacherDocId) ?? null,
    [teachers, selectedTeacherDocId]
  );

  // ── Blueprints for selected teacher ──────────────────────────────────────
  const teacherBlueprints = useMemo<Blueprint[]>(() => {
    if (!selectedTeacher) return [];
    const subjectDocIds = selectedTeacher.offerings
      .map((o) => o.subject?.documentId)
      .filter(Boolean) as string[];
    return allBlueprints.filter((bp) =>
      bp.subject?.documentId && subjectDocIds.includes(bp.subject.documentId)
    );
  }, [selectedTeacher, allBlueprints]);

  // ── Subject groups for selected teacher ──────────────────────────────────
  const subjectGroups = useMemo(() => {
    const map = new Map<string, { subject: { name: string; code?: string }; blueprints: Blueprint[] }>();
    teacherBlueprints.forEach((bp) => {
      const key = bp.subject?.documentId ?? "unknown";
      if (!map.has(key)) {
        map.set(key, { subject: bp.subject ?? { name: "General" }, blueprints: [] });
      }
      map.get(key)!.blueprints.push(bp);
    });
    return Array.from(map.values());
  }, [teacherBlueprints]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const bps = selectedTeacher ? teacherBlueprints : allBlueprints;
    const examCount  = bps.filter((a) => a.componentName?.toLowerCase().includes("exam")).length;
    const quizCount  = bps.filter((a) => a.componentName?.toLowerCase().includes("quiz")).length;
    const otherCount = bps.length - examCount - quizCount;
    return { total: bps.length, exams: examCount, quizzes: quizCount, other: otherCount };
  }, [selectedTeacher, teacherBlueprints, allBlueprints]);

  // ── Filtered teacher list by search ──────────────────────────────────────
  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter((t) => teacherName(t).toLowerCase().includes(q));
  }, [teachers, search]);

  // ── Teacher blueprint count map ───────────────────────────────────────────
  const teacherBlueprintCount = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach((t) => {
      const subIds = t.offerings.map((o) => o.subject?.documentId).filter(Boolean) as string[];
      const count = allBlueprints.filter(
        (bp) => bp.subject?.documentId && subIds.includes(bp.subject.documentId)
      ).length;
      map.set(t.documentId, count);
    });
    return map;
  }, [teachers, allBlueprints]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="space-y-6 pb-12">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Assessments
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a teacher to view their assessment blueprints and component weights.
            </p>
          </div>
          <Link
            href="/lms/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-black transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage Assessments
          </Link>
        </div>

        <SectionSubNav activeTab="assessments" sectionId={sectionId} />

        {/* ── KPI strip ── */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Blueprints", value: kpis.total,   icon: BarChart3,    color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-50 dark:bg-slate-800/40",    border: "border-slate-200 dark:border-slate-800" },
              { label: "Exams",            value: kpis.exams,   icon: Award,        color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20",  border: "border-indigo-200 dark:border-indigo-800/40" },
              { label: "Quizzes",          value: kpis.quizzes, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40" },
              { label: "Other",            value: kpis.other,   icon: Activity,     color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20",    border: "border-amber-200 dark:border-amber-800/40" },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl border", bg, border)}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm flex-shrink-0")}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className={cn("text-2xl font-black mt-0.5", color)}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {(isLoading || sectionLoading) && (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        )}

        {/* ── Main layout: teacher selector + blueprints ── */}
        {!isLoading && !sectionLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── LEFT: Teacher selector ── */}
            <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Teachers
                </h2>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Search — always visible if ≥1 teacher */}
              {teachers.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search teachers…"
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </button>
                  )}
                </div>
              )}

              {/* Teacher cards — scrollable list */}
              {teachers.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No teachers assigned yet</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[70vh] space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {filteredTeachers.map((teacher, idx) => {
                    const bpCount = teacherBlueprintCount.get(teacher.documentId) ?? 0;
                    const uniqueSubjects = new Set(teacher.offerings.map((o) => o.subject?.documentId).filter(Boolean)).size;
                    return (
                      <TeacherCard
                        key={teacher.documentId}
                        teacher={teacher}
                        index={idx}
                        isSelected={selectedTeacherDocId === teacher.documentId}
                        blueprintCount={bpCount}
                        subjectCount={uniqueSubjects}
                        onClick={() =>
                          setSelectedTeacherDocId(
                            selectedTeacherDocId === teacher.documentId ? null : teacher.documentId
                          )
                        }
                      />
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 italic">No teachers match your search.</p>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: Blueprint panel — scrollable ── */}
            <div className="lg:col-span-2 overflow-y-auto max-h-[80vh] pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {/* No teacher selected */}
              {!selectedTeacher && (
                <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center p-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                  </div>
                  <h3 className="text-base font-black text-slate-700 dark:text-slate-300">Select a Teacher</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                    Choose a teacher from the list on the left to view their assessment blueprints and component weights.
                  </p>
                  {teachers.length > 0 && (
                    <div className="mt-6 flex -space-x-2">
                      {teachers.slice(0, 5).map((t, i) => (
                        <div
                          key={t.documentId}
                          className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-white dark:border-slate-900 bg-gradient-to-br", AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length])}
                        >
                          {teacherInitials(t)}
                        </div>
                      ))}
                      {teachers.length > 5 && (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black border-2 border-white dark:border-slate-900">
                          +{teachers.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Teacher selected — show their blueprints */}
              {selectedTeacher && (
                <div className="space-y-6">
                  {/* Teacher header */}
                  <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 bg-gradient-to-br shadow-sm",
                      AVATAR_GRADIENTS[teachers.findIndex((t) => t.documentId === selectedTeacher.documentId) % AVATAR_GRADIENTS.length]
                    )}>
                      {teacherInitials(selectedTeacher)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-black text-slate-900 dark:text-white">{teacherName(selectedTeacher)}</h2>
                      {selectedTeacher.user?.email && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{selectedTeacher.user.email}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                          <BookOpen className="w-3 h-3" />
                          {subjectGroups.length} subject{subjectGroups.length !== 1 ? "s" : ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          <BarChart3 className="w-3 h-3" />
                          {teacherBlueprints.length} blueprint{teacherBlueprints.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* No blueprints */}
                  {teacherBlueprints.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
                      <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-sm font-black text-slate-600 dark:text-slate-400">No Blueprints Found</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                        No assessment blueprints have been configured for this teacher's subjects yet.
                      </p>
                      <Link href="/lms/assessment"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Set Up Blueprints
                      </Link>
                    </div>
                  )}

                  {/* Blueprints grouped by subject */}
                  {subjectGroups.map((group, gi) => (
                    <div key={gi} className="space-y-3">
                      {/* Subject header */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{group.subject.name}</h3>
                          {group.subject.code && (
                            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{group.subject.code}</p>
                          )}
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {group.blueprints.length} component{group.blueprints.length !== 1 ? "s" : ""}
                          <span className="text-slate-400">
                            · Total {group.blueprints.reduce((s, b) => s + b.weightPercentage, 0)}%
                          </span>
                        </div>
                      </div>

                      {/* Weight breakdown bar */}
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Weight Distribution</p>
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                          {group.blueprints.map((bp, bi) => {
                            const colors = componentColor(bp.componentName);
                            return (
                              <div
                                key={bi}
                                className={cn("h-full rounded-sm transition-all", colors.bar)}
                                style={{ width: `${bp.weightPercentage}%` }}
                                title={`${bp.label || bp.componentName}: ${bp.weightPercentage}%`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {group.blueprints.map((bp, bi) => {
                            const colors = componentColor(bp.componentName);
                            return (
                              <div key={bi} className="flex items-center gap-1 text-[10px]">
                                <div className={cn("w-2 h-2 rounded-sm", colors.bar)} />
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">{bp.label || bp.componentName}</span>
                                <span className={cn("font-black", colors.text)}>{bp.weightPercentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Blueprint cards grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.blueprints.map((bp, bi) => (
                          <BlueprintCard key={bp.documentId || bi} blueprint={bp} index={bi} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
