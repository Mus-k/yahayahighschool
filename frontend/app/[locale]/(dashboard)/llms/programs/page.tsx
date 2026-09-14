'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Award, 
  ChevronRight, 
  Plus, 
  X,
  Languages,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function LanguageProgramsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;
  const router = useRouter();
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    language: 'English',
    description: '',
    targetLevel: '',
    ageGroup: '',
    durationMonths: ''
  });

  const isAdmin = (user as any)?.role?.type === 'super-administrator' || (user as any)?.role?.name === 'Super Administrator' || (user as any)?.role?.name === 'Administrator';

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [authLoading, teacher?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [offeringsRes, programsRes] = await Promise.all([
        apiClient.get('/course-offerings', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
            populate: ['subject', 'academicSection', 'gradeLevel', 'academicTerm', 'academicYear', 'studentEnrollments'],
            pagination: { limit: 100 }
          }
        }),
        apiClient.get('/language-programs', {
          params: {
            filters: { teachers: { id: { $eq: teacher.id } } },
            populate: ['students', 'sections'],
            pagination: { limit: 100 }
          }
        })
      ]);

      // Filter for language offerings based on subject
      const allOfferings = offeringsRes.data?.data || [];
      const langOfferings = allOfferings.filter((offering: any) => {
        const subjectName = offering.subject?.name?.toLowerCase() || '';
        return subjectName.includes('english') || subjectName.includes('arabic') || subjectName.includes('french') || subjectName.includes('language');
      });

      setOfferings(langOfferings);
      setPrograms(programsRes.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load language programs and offerings'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/language-programs', {
        data: {
          ...formData,
          durationMonths: parseInt(formData.durationMonths, 10),
          teachers: [teacher.id]
        }
      });
      toast.success(t('Language program created successfully'));
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', language: 'English', description: '', targetLevel: '', ageGroup: '', durationMonths: '' });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to create program'));
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!teacher?.id) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-6">
          <Languages className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Profile Found')}</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            {t('Your user profile does not have an associated teacher record.')}
          </p>
        </div>
      </PageContainer>
    );
  }

  // Stats calculation
  const totalOfferings = offerings.length;
  const totalStudents = offerings.reduce((acc, curr) => acc + (curr.studentEnrollments?.length || 0), 0);
  const uniqueLanguages = new Set(offerings.map(o => o.subject?.name)).size;
  const activePrograms = programs.length;

  return (
    <PageContainer>
      <PageHeader title={t('Language Programs Workspace')} description={t('Manage your language courses, programs, and assessments.')} />
      
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Language Offerings')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{totalOfferings}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Enrolled Students')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Languages className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Languages Taught')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueLanguages}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Active Programs')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{activePrograms}</h4>
            </div>
          </div>
        </div>

        {/* Section A: My Language Course Offerings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-500" />
            {t('My Language Course Offerings')}
          </h2>
          {offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Language Course Offerings')}</h3>
              <p className="text-slate-500 mt-2 max-w-sm text-sm">
                {t('You have no active language course offerings. Ask an administrator to assign you one.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerings.map(offering => (
                <div key={offering.documentId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                        {offering.subject?.name} - {offering.academicSection?.name}
                      </h3>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {offering.offeringStatus || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1 mt-3">
                      <p>{t('Grade Level:')} <span className="font-medium text-slate-700 dark:text-slate-300">{offering.gradeLevel?.name || 'N/A'}</span></p>
                      <p>{t('Academic Term:')} <span className="font-medium text-slate-700 dark:text-slate-300">{offering.academicTerm?.name || 'N/A'}</span></p>
                      <p className="flex items-center gap-1 mt-2 text-indigo-600 dark:text-indigo-400 font-medium">
                        <Users className="h-4 w-4" /> {offering.studentEnrollments?.length || 0} {t('Students')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => router.push(`/llms/skills?offering=${offering.documentId}`)}
                      className="flex items-center justify-center gap-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-2 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t('Skills')}
                    </button>
                    <button 
                      onClick={() => router.push(`/llms/portfolio?offering=${offering.documentId}`)}
                      className="flex items-center justify-center gap-1 w-full bg-indigo-600 text-white py-2 px-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" /> {t('Portfolio')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section B: My Language Programs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Languages className="h-6 w-6 text-emerald-500" />
              {t('My Language Programs')}
            </h2>
            {isAdmin && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" /> {t('Create Program')}
              </button>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {programs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                {t('No language programs assigned to you.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4">{t('Program Name')}</th>
                      <th className="px-6 py-4">{t('Code')}</th>
                      <th className="px-6 py-4">{t('Language')}</th>
                      <th className="px-6 py-4">{t('Target Level')}</th>
                      <th className="px-6 py-4 text-center">{t('Students')}</th>
                      <th className="px-6 py-4 text-center">{t('Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {programs.map(program => (
                      <tr key={program.documentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{program.name}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{program.code}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1">
                            <Languages className="h-4 w-4 text-slate-400" />
                            {program.language ? t(program.language) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{program.targetLevel || 'N/A'}</td>
                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{program.students?.length || 0}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {t('Active')}
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
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('Create Language Program')}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Program Name *')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('e.g. Intensive English')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Code *')}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="ENG-101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Language')}</label>
                  <select 
                    value={formData.language}
                    onChange={e => setFormData({...formData, language: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="English">{t('English')}</option>
                    <option value="Arabic">{t('Arabic')}</option>
                    <option value="French">{t('French')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Target Level')}</label>
                  <input 
                    type="text" 
                    value={formData.targetLevel}
                    onChange={e => setFormData({...formData, targetLevel: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder={t('B1, Advanced, etc.')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Age Group')}</label>
                  <input 
                    type="text" 
                    value={formData.ageGroup}
                    onChange={e => setFormData({...formData, ageGroup: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="12-15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Duration (Months)')}</label>
                <input 
                  type="number" 
                  value={formData.durationMonths}
                  onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. 6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Description')}</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('Program overview...')}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  {t('Create Program')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
