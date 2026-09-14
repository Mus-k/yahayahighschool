'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import {
  Languages, Users, BarChart2, AlertTriangle,
  BookOpen, Layers, TrendingUp, FolderOpen, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// LLMS Teacher Dashboard
// Shows the Language teacher's course offering portfolio.
// ─────────────────────────────────────────────────────────────────────────────

interface LangOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { name: string };
  gradeLevel?: { name: string };
  academicSection?: { name: string; color?: string };
  academicTerm?: { name: string };
  gradebookStatus?: string;
  enrollmentCount?: number;
}

export default function LlmsTeacherDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const teacher = (user as any)?.profile;
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [offerings, setOfferings] = useState<LangOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!teacher?.id) { setIsLoading(false); return; }

    setIsLoading(true);
    try {
      const res = await apiClient.get('/course-offerings', {
        params: {
          filters: {
            teacher: { id: { $eq: teacher.id } },
            offeringStatus: { $eq: 'ACTIVE' },
          },
          populate: ['subject', 'gradeLevel', 'academicSection', 'academicTerm', 'studentEnrollments'],
          pagination: { limit: 100 },
        },
      });

      const raw: any[] = res.data?.data ?? [];
      setOfferings(
        raw.map((o: any) => ({
          id: o.id,
          documentId: o.documentId,
          name: o.name,
          subject: o.subject,
          gradeLevel: o.gradeLevel,
          academicSection: o.academicSection,
          academicTerm: o.academicTerm,
          gradebookStatus: o.gradebookStatus,
          enrollmentCount: (o.studentEnrollments ?? []).length,
        }))
      );
    } catch {
      toast.error(t('Failed to load Language dashboard'));
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

  if (!teacher?.id) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Teacher Profile Not Linked')}</h3>
          <p className="text-slate-500 mt-2 text-sm max-w-sm">{t('Contact an administrator to link your teacher profile.')}</p>
        </div>
      </PageContainer>
    );
  }

  const totalStudents = offerings.reduce((s, o) => s + (o.enrollmentCount ?? 0), 0);
  const uniqueSubjects = new Set(offerings.map(o => o.subject?.name).filter(Boolean)).size;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Languages className="h-6 w-6 text-blue-500" />
            {t('Language Teaching Portal')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t('Your Language Course Offerings, Skills Assessments, and Student Portfolios.')}
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('Course Offerings'), value: offerings.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: t('Total Students'), value: totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
            { label: t('Languages / Subjects'), value: uniqueSubjects, icon: Languages, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: t('Active Terms'), value: new Set(offerings.map(o => o.academicTerm?.name).filter(Boolean)).size, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
            <Languages className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Language Course Offerings')}</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-sm">
              {t('You have no active language course offerings. Ask an administrator to assign you a course offering.')}
            </p>
            <button
              onClick={() => router.push('/lms/offerings')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              {t('View All Offerings')}
            </button>
          </div>
        )}

        {/* Offering Cards */}
        {offerings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map(offering => (
              <div
                key={offering.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600/50 transition-all duration-200 group"
              >
                {offering.academicSection && (
                  <div
                    className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold text-white mb-3"
                    style={{ backgroundColor: offering.academicSection.color || '#2563eb' }}
                  >
                    {offering.academicSection.name}
                  </div>
                )}

                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {offering.subject?.name ?? offering.name ?? t('Language Course')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {offering.gradeLevel?.name} · {offering.academicTerm?.name}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span><strong>{offering.enrollmentCount}</strong> {t('enrolled students')}</span>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push(`/llms/skills?offering=${offering.documentId}`)}
                    className="flex flex-col items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    <BarChart2 className="w-4 h-4" />
                    {t('Skills')}
                  </button>
                  <button
                    onClick={() => router.push(`/llms/portfolio?offering=${offering.documentId}`)}
                    className="flex flex-col items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {t('Portfolio')}
                  </button>
                  <button
                    onClick={() => router.push(`/llms/programs`)}
                    className="flex flex-col items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    <BookOpen className="w-4 h-4" />
                    {t('Programs')}
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
