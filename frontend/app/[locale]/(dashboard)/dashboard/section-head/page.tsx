'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import {
  LayoutDashboard, BookOpen, Clock,
  ChevronRight, AlertCircle, GraduationCap,
  CheckCircle2, ShieldCheck, ClipboardList
} from 'lucide-react';
import { apiClient } from '@/services/api.service';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Section Head Dashboard
// Lists all Academic Sections where the logged-in teacher is the academicHead,
// along with per-section stats (offerings, students, pending reviews).
// ─────────────────────────────────────────────────────────────────────────────

interface SectionStats {
  offeringsCount: number;
  enrolledStudents: number;
  pendingGrades: number;
  pendingLessonPlans: number;
}

export default function SectionHeadDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<any[]>([]);
  const [sectionStats, setSectionStats] = useState<Record<string, SectionStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to fully settle
    if (authLoading) return;

    // The academicHead is the linked teacher profile (user.profile)
    const profileDocId = (user as any)?.profile?.documentId;
    if (!profileDocId) {
      // Auth settled but no profile — show empty
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch sections where this teacher is the academic head
    apiClient
      .get('/sections', {
        params: {
          filters: { academicHead: { documentId: { $eq: profileDocId } } },
          populate: ['academicYear'],
          pagination: { limit: 50 },
          sort: 'name:asc',
        },
      })
      .then(async (res) => {
        const secs: any[] = res.data?.data ?? [];
        setSections(secs);

        // Fetch per-section stats in parallel
        const statsMap: Record<string, SectionStats> = {};
        await Promise.all(
          secs.map(async (sec: any) => {
            const secDocId = sec.documentId;
            try {
              const [offeringsRes, pendingGradesRes, pendingPlansRes] = await Promise.all([
                // Course offerings for this section (with enrollment count)
                apiClient
                  .get('/course-offerings', {
                    params: {
                      filters: { academicSection: { documentId: { $eq: secDocId } } },
                      populate: ['studentEnrollments'],
                      pagination: { limit: 200 },
                    },
                  })
                  .catch(() => ({ data: { data: [] } })),

                // Pending grade reviews (gradebook entries waiting for approval)
                apiClient
                  .get('/gradebook-entries', {
                    params: {
                      filters: {
                        courseOffering: { academicSection: { documentId: { $eq: secDocId } } },
                        recordStatus: { $eq: 'Submitted' },
                      },
                      pagination: { limit: 1, pageSize: 1 },
                    },
                  })
                  .catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),

                // Pending lesson plan approvals
                apiClient
                  .get('/lesson-plans', {
                    params: {
                      filters: {
                        section: { documentId: { $eq: secDocId } },
                        recordStatus: { $eq: 'Pending Approval' },
                      },
                      pagination: { limit: 1, pageSize: 1 },
                    },
                  })
                  .catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
              ]);

              const offerings: any[] = offeringsRes.data?.data ?? [];
              // Count unique enrolled students across all offerings in this section
              const uniqueStudentIds = new Set<number>();
              offerings.forEach((o: any) => {
                (o.studentEnrollments ?? []).forEach((se: any) => {
                  if (se.id) uniqueStudentIds.add(se.id);
                });
              });

              statsMap[secDocId] = {
                offeringsCount: offerings.length,
                enrolledStudents: uniqueStudentIds.size,
                pendingGrades: pendingGradesRes.data?.meta?.pagination?.total ?? 0,
                pendingLessonPlans: pendingPlansRes.data?.meta?.pagination?.total ?? 0,
              };
            } catch {
              statsMap[secDocId] = {
                offeringsCount: 0,
                enrolledStudents: 0,
                pendingGrades: 0,
                pendingLessonPlans: 0,
              };
            }
          })
        );

        setSectionStats(statsMap);
      })
      .catch((err) => {
        console.error('Failed to load head sections:', err);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, (user as any)?.profile?.documentId]);

  // ─── Loading Skeleton ─────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-56" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // ─── Totals for summary strip ─────────────────────────────────────────────
  const totalOfferings = Object.values(sectionStats).reduce((s, x) => s + x.offeringsCount, 0);
  const totalStudents  = Object.values(sectionStats).reduce((s, x) => s + x.enrolledStudents, 0);
  const totalPending   = Object.values(sectionStats).reduce(
    (s, x) => s + x.pendingGrades + x.pendingLessonPlans, 0
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-indigo-500" />
            Section Head Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Welcome back
            {(user as any)?.firstName ? `, ${(user as any).firstName}` : ''}.
            Select an Academic Section to open its workspace.
          </p>
        </div>

        {/* Empty state: profile not linked */}
        {!(user as any)?.profile?.documentId && (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <AlertCircle className="h-12 w-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Teacher Profile Not Linked
            </h3>
            <p className="text-slate-500 mt-2 max-w-sm text-sm">
              Your account has no linked Teacher profile. Please ask an Administrator
              to create and link your Teacher record.
            </p>
          </div>
        )}

        {/* Empty state: no sections assigned */}
        {(user as any)?.profile?.documentId && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No Assigned Sections
            </h3>
            <p className="text-slate-500 mt-2 max-w-md text-sm">
              You are registered as a Section Head but have not been assigned to lead any
              Academic Sections. Contact the Administrator to complete your assignment.
            </p>
          </div>
        )}

        {/* Section Cards Grid */}
        {sections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec) => {
              const stats = sectionStats[sec.documentId];
              const pendingTotal = (stats?.pendingGrades ?? 0) + (stats?.pendingLessonPlans ?? 0);
              return (
                <button
                  key={sec.documentId}
                  onClick={() => router.push(`/academic/sections/${sec.documentId}`)}
                  className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="font-mono text-xs font-bold text-white px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: sec.color || '#6366f1' }}
                      >
                        {sec.code}
                      </span>
                      {pendingTotal > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          {pendingTotal} pending
                        </span>
                      ) : (
                        stats && <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sec.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sec.academicYear?.name ?? 'Current Academic Year'}
                    </p>
                  </div>

                  {/* Per-section stat strip */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {stats?.offeringsCount ?? '—'}
                        </span>{' '}
                        Offerings
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {stats?.enrolledStudents ?? '—'}
                        </span>{' '}
                        Students
                      </span>
                    </div>
                    {(stats?.pendingGrades ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">{stats?.pendingGrades} Grade Reviews</span>
                      </div>
                    )}
                    {(stats?.pendingLessonPlans ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">
                          {stats?.pendingLessonPlans} Plan Approvals
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <div className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 font-bold group-hover:gap-2 transition-all duration-200">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Summary stat strip */}
        {sections.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sections Led',      value: sections.length,  icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
              { label: 'Total Offerings',   value: totalOfferings,   icon: BookOpen,         color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
              { label: 'Total Students',    value: totalStudents,    icon: GraduationCap,    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { label: 'Pending Reviews',   value: totalPending,     icon: Clock,            color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/30' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
