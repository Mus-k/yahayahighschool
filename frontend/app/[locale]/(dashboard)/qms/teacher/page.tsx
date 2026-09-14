'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import {
  BookOpen, Users, CheckCircle2, Clock, TrendingUp,
  ChevronRight, AlertTriangle, BarChart2, Layers
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// QMS Teacher Dashboard
// Shows the Quran teacher's course offering portfolio with quick stats.
// ─────────────────────────────────────────────────────────────────────────────

interface QuranOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { name: string };
  gradeLevel?: { name: string };
  academicSection?: { name: string; color?: string };
  academicTerm?: { name: string };
  gradebookStatus?: string;
  enrollmentCount?: number;
  memorizedCount?: number;   // students with memorization records
  groupCount?: number;       // quran groups linked
}

export default function QmsTeacherDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const teacher = (user as any)?.profile;

  const [offerings, setOfferings] = useState<QuranOffering[]>([]);
  const [groupsByOffering, setGroupsByOffering] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!teacher?.id) { setIsLoading(false); return; }

    setIsLoading(true);
    try {
      // Load all active offerings for this teacher
      const [offeringsRes, groupsRes] = await Promise.all([
        apiClient.get('/course-offerings', {
          params: {
            filters: {
              teacher: { id: { $eq: teacher.id } },
              offeringStatus: { $eq: 'ACTIVE' },
            },
            populate: ['subject', 'gradeLevel', 'academicSection', 'academicTerm', 'studentEnrollments'],
            pagination: { limit: 100 },
          },
        }),
        apiClient.get('/quran-groups', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['courseOffering'],
            pagination: { limit: 200 },
          },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const rawOfferings: any[] = offeringsRes.data?.data ?? [];
      const rawGroups: any[] = groupsRes.data?.data ?? [];

      // Map groups by course offering id
      const gMap: Record<number, number> = {};
      rawGroups.forEach((g: any) => {
        const coId = g.courseOffering?.id;
        if (coId) gMap[coId] = (gMap[coId] ?? 0) + 1;
      });
      setGroupsByOffering(gMap);

      setOfferings(
        rawOfferings.map((o: any) => ({
          id: o.id,
          documentId: o.documentId,
          name: o.name,
          subject: o.subject,
          gradeLevel: o.gradeLevel,
          academicSection: o.academicSection,
          academicTerm: o.academicTerm,
          gradebookStatus: o.gradebookStatus,
          enrollmentCount: (o.studentEnrollments ?? []).length,
          groupCount: gMap[o.id] ?? 0,
        }))
      );
    } catch (err) {
      toast.error('Failed to load Quran dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, teacher?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  // ─── No profile ───────────────────────────────────────────────────────────
  if (!teacher?.id) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Teacher Profile Not Linked</h3>
          <p className="text-slate-500 mt-2 text-sm max-w-sm">
            Your account has no linked Teacher profile. Contact an administrator.
          </p>
        </div>
      </PageContainer>
    );
  }

  const totalStudents = offerings.reduce((s, o) => s + (o.enrollmentCount ?? 0), 0);
  const totalGroups   = offerings.reduce((s, o) => s + (o.groupCount ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-500" />
            Qur'an Teaching Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Your Qur'an Course Offerings, groups, and student progress.
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Course Offerings', value: offerings.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Quran Groups', value: totalGroups, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'Active Terms', value: new Set(offerings.map(o => o.academicTerm?.name).filter(Boolean)).size, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {offerings.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Qur'an Course Offerings</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-sm">
              You have no active course offerings. Ask an administrator to assign you a Qur'an course offering.
            </p>
            <button
              onClick={() => router.push('/lms/offerings')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
            >
              View All Offerings
            </button>
          </div>
        )}

        {/* Offering Cards */}
        {offerings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map(offering => (
              <div
                key={offering.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all duration-200 group"
              >
                {/* Section badge */}
                {offering.academicSection && (
                  <div
                    className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold text-white mb-3"
                    style={{ backgroundColor: offering.academicSection.color || '#059669' }}
                  >
                    {offering.academicSection.name}
                  </div>
                )}

                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {offering.subject?.name ?? offering.name ?? 'Course Offering'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {offering.gradeLevel?.name} · {offering.academicTerm?.name}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span><strong>{offering.enrollmentCount}</strong> students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span><strong>{offering.groupCount}</strong> groups</span>
                  </div>
                </div>

                {/* Gradebook status */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    offering.gradebookStatus === 'Draft' ? 'bg-slate-100 text-slate-600' :
                    offering.gradebookStatus === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                    offering.gradebookStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    Gradebook: {offering.gradebookStatus ?? 'Draft'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/qms/memorization?offering=${offering.documentId}`)}
                    className="flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Hifz
                  </button>
                  <button
                    onClick={() => router.push(`/qms/programs?offering=${offering.documentId}`)}
                    className="flex items-center justify-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    <Users className="w-3.5 h-3.5" /> Groups
                  </button>
                  <button
                    onClick={() => router.push(`/qms/revision?offering=${offering.documentId}`)}
                    className="flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    <Clock className="w-3.5 h-3.5" /> Murajaah
                  </button>
                  <button
                    onClick={() => router.push(`/qms/attendance?offering=${offering.documentId}`)}
                    className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
