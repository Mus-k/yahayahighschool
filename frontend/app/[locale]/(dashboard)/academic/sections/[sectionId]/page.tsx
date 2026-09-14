/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import Link from 'next/link';
import {
  BookOpen, Users, UserCheck, GraduationCap, BarChart3,
  CalendarCheck, TrendingUp, ClipboardList, AlertCircle,
  ChevronRight, Plus, RefreshCw, Settings, Building2,
  Star, BookMarked, Clock, Award, Layers, ArrowRight,
  UserCog, BookOpenCheck, FileText
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { useSection } from '@/providers/SectionContext';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Section Workspace — Sub Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

const WORKSPACE_TABS = [
  { key: '', label: 'Overview', icon: BarChart3 },
  { key: 'grade-levels', label: 'Grade Levels', icon: Layers },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'offerings', label: 'Course Offerings', icon: BookMarked },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'teachers', label: 'Teachers', icon: UserCheck },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'gradebook', label: 'Gradebook', icon: ClipboardList },
  { key: 'assessments', label: 'Assessments', icon: FileText },
  { key: 'timetable', label: 'Timetable', icon: Clock },
  { key: 'transcripts', label: 'Transcripts', icon: Award },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
];

function SectionSubNav({ sectionId, activeTab }: { sectionId: string; activeTab: string }) {
  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="flex items-center gap-0.5 px-4 overflow-x-auto scrollbar-hide">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const href = `/academic/sections/${sectionId}${tab.key ? `/${tab.key}` : ''}`;
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, href
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; href?: string;
}) {
  const content = (
    <div className={`rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade Level Explorer Card
// ─────────────────────────────────────────────────────────────────────────────

function GradeLevelCard({
  grade, sectionId, offeringsCount
}: {
  grade: { id: number; documentId: string; name: string; code: string; order: number };
  sectionId: string;
  offeringsCount: number;
}) {
  return (
    <Link
      href={`/academic/sections/${sectionId}/grade-levels?gradeLevel=${grade.documentId}`}
      className="flex-shrink-0 w-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-400 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <p className="font-black text-slate-900 dark:text-white text-sm">{grade.name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{grade.code}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
          {offeringsCount} offerings
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section icon map
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, string> = {
  quran: '📖', language: '🌐', stem: '🔬', islamic: '🕌',
  sports: '⚽', arts: '🎨', vocational: '🔧', other: '📋',
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Workspace Dashboard — Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SectionDashboardPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const { section, isLoading: sectionLoading } = useSection();

  const [stats, setStats] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) return;
    loadDashboardData();
  }, [sectionId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [offeringsRes, teachersRes, enrollmentsRes, attendanceRes, gradeRes] = await Promise.all([
        apiClient.get('/course-offerings', {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ['gradeLevel', 'subject', 'teacher', 'studentEnrollments'],
            pagination: { limit: 100 },
          },
        }),
        apiClient.get('/teachers', {
          params: {
            filters: { sections: { documentId: { $eq: sectionId } } },
            populate: ['user'],
            pagination: { limit: 50 },
          },
        }),
        apiClient.get('/student-enrollments', {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            populate: ['student', 'courseOffering.subject'],
            sort: 'createdAt:desc',
            pagination: { limit: 10 },
          },
        }),
        apiClient.get('/attendance-records', {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            pagination: { limit: 500 },
            fields: ['status'],
          },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/gradebook-entries', {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            pagination: { limit: 1000 },
            fields: ['score', 'maxScore'],
          },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const offeringsData = offeringsRes.data?.data ?? [];
      const teachersData = teachersRes.data?.data ?? [];
      const enrollmentsData = enrollmentsRes.data?.data ?? [];
      const attendanceData = attendanceRes.data?.data ?? [];
      const gradeData = gradeRes.data?.data ?? [];

      setOfferings(offeringsData);
      setTeachers(teachersData);
      setRecentEnrollments(enrollmentsData);

      // Fix: deduplicate students across offerings
      const uniqueStudentIds = new Set<number>();
      offeringsData.forEach((o: any) => {
        (o.studentEnrollments || []).forEach((se: any) => {
          if (se.id) uniqueStudentIds.add(se.id);
        });
      });
      const totalEnrolled = uniqueStudentIds.size;

      const activeOfferings = offeringsData.filter((o: any) => o.offeringStatus === 'ACTIVE').length;

      // Compute attendance rate
      const presentCount = attendanceData.filter(
        (r: any) => r.status?.toLowerCase() === 'present'
      ).length;
      const attendanceRate =
        attendanceData.length > 0
          ? `${Math.round((presentCount / attendanceData.length) * 100)}%`
          : '—';

      // Compute pass rate
      const passedCount = gradeData.filter((g: any) => {
        const max = g.maxScore || 100;
        return (g.score / max) >= 0.5;
      }).length;
      const passRate =
        gradeData.length > 0
          ? `${Math.round((passedCount / gradeData.length) * 100)}%`
          : '—';

      // Compute avg score percentage
      const avgPct =
        gradeData.length > 0
          ? Math.round(
              gradeData.reduce((sum: number, g: any) => {
                const max = g.maxScore || 100;
                return sum + Math.min((g.score / max) * 100, 100);
              }, 0) / gradeData.length
            )
          : null;
      const avgGpa = avgPct !== null ? `${avgPct}%` : '—';

      setStats({
        totalStudents: totalEnrolled,
        totalTeachers: teachersData.length,
        totalOfferings: offeringsData.length,
        activeOfferings,
        avgGpa,
        attendanceRate,
        passRate,
        assessmentCompletion: gradeData.length > 0 ? gradeData.length : '—',
      });
    } catch (err) {
      toast.error('Failed to load section data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Group offerings by grade level for the explorer
  const offeringsByGrade = useMemo(() => {
    const map: Record<string, number> = {};
    offerings.forEach((o) => {
      const glId = o.gradeLevel?.documentId;
      if (glId) map[glId] = (map[glId] ?? 0) + 1;
    });
    return map;
  }, [offerings]);

  const sectionColor = section?.color ?? '#6366f1';
  const sectionIcon = SECTION_ICONS[section?.sectionType ?? ''] ?? '📚';

  if (sectionLoading || isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <SectionSubNav sectionId={sectionId} activeTab="" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-0 w-full text-slate-800 dark:text-slate-100 animate-fade-in">
        {/* ── Section Header ─────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-0">
          <div
            className="rounded-2xl p-5 mb-4 flex items-center justify-between gap-4 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${sectionColor}18 0%, ${sectionColor}08 100%)`, borderLeft: `4px solid ${sectionColor}` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                style={{ background: `${sectionColor}20` }}
              >
                {sectionIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    {section?.name ?? 'Academic Section'}
                  </h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: sectionColor }}>
                    {section?.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {section?.academicYear ? `${section.academicYear.name}` : 'Academic Workspace'} 
                  {section?.academicHead ? ` · Head: ${section.academicHead.name ?? section.academicHead.displayName ?? section.academicHead.schoolId}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadDashboardData}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all bg-white dark:bg-slate-900"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                href={`/academic/sections/${sectionId}/analytics`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation ─────────────────────────────────────── */}
        <SectionSubNav sectionId={sectionId} activeTab="" />

        <div className="px-4 py-4 space-y-6">
          {/* ── KPI Grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Enrolled Students" value={stats?.totalStudents ?? 0}
              icon={Users} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              href={`/academic/sections/${sectionId}/students`}
            />
            <KpiCard
              label="Active Teachers" value={stats?.totalTeachers ?? 0}
              icon={UserCheck} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              href={`/academic/sections/${sectionId}/teachers`}
            />
            <KpiCard
              label="Course Offerings" value={stats?.totalOfferings ?? 0}
              sub={`${stats?.activeOfferings ?? 0} active`}
              icon={BookMarked} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
              href={`/academic/sections/${sectionId}/offerings`}
            />
            <KpiCard
              label="Grade Levels" value={section?.gradeLevels?.length ?? '—'}
              icon={Layers} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              href={`/academic/sections/${sectionId}/grade-levels`}
            />
            <KpiCard
              label="Avg GPA" value={stats?.avgGpa ?? '—'}
              icon={Star} color="bg-rose-100 dark:bg-rose-900/30 text-rose-600"
              href={`/academic/sections/${sectionId}/gradebook`}
            />
            <KpiCard
              label="Attendance Rate" value={stats?.attendanceRate ?? '—'}
              icon={CalendarCheck} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600"
              href={`/academic/sections/${sectionId}/attendance`}
            />
            <KpiCard
              label="Pass Rate" value={stats?.passRate ?? '—'}
              icon={TrendingUp} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
              href={`/academic/sections/${sectionId}/analytics`}
            />
            <KpiCard
              label="Assessments" value={stats?.assessmentCompletion ?? '—'}
              icon={ClipboardList} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600"
              href={`/academic/sections/${sectionId}/assessments`}
            />
          </div>

          {/* ── Grade Level Explorer ────────────────────────────────── */}
          {section?.gradeLevels && section.gradeLevels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Grade Levels in this Section
                </h2>
                <Link
                  href={`/academic/sections/${sectionId}/grade-levels`}
                  className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[...section.gradeLevels]
                  .sort((a, b) => a.order - b.order)
                  .map((grade) => (
                    <GradeLevelCard
                      key={grade.id}
                      grade={grade}
                      sectionId={sectionId}
                      offeringsCount={offeringsByGrade[grade.documentId] ?? 0}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* ── Two Column: Teachers + Recent Enrollments ───────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teacher Workload */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  Teacher Workload
                </h2>
                <Link href={`/academic/sections/${sectionId}/teachers`} className="text-xs text-indigo-600 hover:underline font-semibold">
                  View All
                </Link>
              </div>
              {teachers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No teachers assigned to this section yet.</p>
              ) : (
                <div className="space-y-2">
                  {teachers.slice(0, 6).map((t: any) => {
                    // Fix: match by documentId first, fall back to id
                    const teacherOfferings = offerings.filter(
                      (o) => o.teacher?.documentId === t.documentId || (t.id && o.teacher?.id === t.id)
                    );
                    return (
                      <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {t.displayName ?? t.name ?? t.schoolId}
                            </p>
                            <p className="text-[10px] text-slate-400">{t.schoolId}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                          {teacherOfferings.length} class{teacherOfferings.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Enrollments */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Recent Enrollments
                </h2>
                <Link href={`/academic/sections/${sectionId}/students`} className="text-xs text-indigo-600 hover:underline font-semibold">
                  View All
                </Link>
              </div>
              {recentEnrollments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No enrollments in this section yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentEnrollments.map((enr: any) => (
                    <div key={enr.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {enr.student?.firstName} {enr.student?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{enr.courseOffering?.subject?.name ?? '—'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        enr.enrollmentStatus === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {enr.enrollmentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Add Course Offering', icon: Plus, href: `/lms/offerings`, color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' },
                { label: 'Record Attendance', icon: CalendarCheck, href: `/academic/sections/${sectionId}/attendance`, color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' },
                { label: 'Gradebook', icon: ClipboardList, href: `/academic/sections/${sectionId}/gradebook`, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
                { label: 'Generate Transcripts', icon: Award, href: `/academic/sections/${sectionId}/transcripts`, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center text-xs font-semibold transition-all hover:shadow-sm ${action.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
