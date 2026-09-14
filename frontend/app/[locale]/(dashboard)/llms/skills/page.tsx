'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { 
  BookOpen, 
  Users, 
  Award, 
  Plus, 
  X,
  Target,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';

const SKILL_TYPES = [
  'Reading', 'Writing', 'Listening', 'Speaking', 
  'Grammar', 'Vocabulary', 'Comprehension', 
  'Pronunciation', 'Conversation'
];

export default function LanguageSkillsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;
  const router = useRouter();
  const searchParams = useSearchParams();
  const offeringParam = searchParams.get('offering');
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Form
  const [formData, setFormData] = useState({
    studentId: '',
    skillType: SKILL_TYPES[0],
    title: '',
    score: '',
    maxScore: '100',
    teacherFeedback: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    loadOfferings();
  }, [authLoading, teacher?.id]);

  useEffect(() => {
    if (selectedOfferingId) {
      loadOfferingData(selectedOfferingId);
    } else {
      setStudents([]);
      setAssessments([]);
    }
  }, [selectedOfferingId]);

  const loadOfferings = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/course-offerings', {
        params: {
          filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
          populate: ['subject', 'academicSection', 'gradeLevel', 'academicTerm'],
          pagination: { limit: 100 }
        }
      });
      
      const allOfferings = res.data?.data || [];
      const langOfferings = allOfferings.filter((offering: any) => {
        const subjectName = offering.subject?.name?.toLowerCase() || '';
        return subjectName.includes('english') || subjectName.includes('arabic') || subjectName.includes('french') || subjectName.includes('language');
      });

      setOfferings(langOfferings);

      if (offeringParam && langOfferings.some((o: any) => o.documentId === offeringParam)) {
        setSelectedOfferingId(offeringParam);
      } else if (langOfferings.length > 0) {
        setSelectedOfferingId(langOfferings[0].documentId);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load course offerings'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferingData = async (offeringId: string) => {
    try {
      setIsDataLoading(true);
      const [studentsRes, assessmentsRes] = await Promise.all([
        apiClient.get('/student-enrollments', {
          params: {
            filters: { courseOffering: { documentId: { $eq: offeringId } }, enrollmentStatus: { $eq: 'active' } },
            populate: ['student'],
            pagination: { limit: 200 }
          }
        }),
        // skill-assessments: courseOffering column newly added — Strapi needs restart.
        // Filter by teacher.id and cross-reference enrolled students client-side.
        apiClient.get('/skill-assessments', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['student'],
            sort: 'date:desc',
            pagination: { limit: 1000 }
          }
        })
      ]);

      const enrolledStudents = studentsRes.data?.data?.map((e: any) => e.student).filter(Boolean) || [];
      const enrolledIds = new Set(enrolledStudents.map((s: any) => s.id));
      const allAssessments = assessmentsRes.data?.data || [];
      const filteredAssessments = allAssessments.filter(
        (a: any) => a.student && enrolledIds.has(a.student.id)
      );

      setStudents(enrolledStudents);
      setAssessments(filteredAssessments);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load skills data'));
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleRecordAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/skill-assessments', {
        data: {
          skillType: formData.skillType,
          title: formData.title,
          score: parseFloat(formData.score),
          maxScore: parseFloat(formData.maxScore),
          teacherFeedback: formData.teacherFeedback,
          date: formData.date,
          student: formData.studentId,
          teacher: teacher.id,
          courseOffering: selectedOfferingId
        }
      });
      toast.success(t('Skill assessment recorded successfully'));
      setIsRecordModalOpen(false);
      setFormData({
        ...formData,
        title: '',
        score: '',
        teacherFeedback: ''
      });
      loadOfferingData(selectedOfferingId);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to record assessment'));
    }
  };

  const exportCSV = () => {
    // Generate simple CSV
    let csv = 'Student,' + SKILL_TYPES.join(',') + '\n';
    students.forEach((student: any) => {
      let row = `${student?.firstName} ${student?.lastName}`;
      SKILL_TYPES.forEach(skill => {
        const studentAssessments = assessments.filter((a: any) => a.student?.documentId === student.documentId && a.skillType === skill);
        if (studentAssessments.length > 0) {
          const latest = studentAssessments[0];
          row += `,${latest.score}/${latest.maxScore}`;
        } else {
          row += `,-`;
        }
      });
      csv += row + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill-matrix.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
          <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Profile Found')}</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            {t('Your user profile does not have an associated teacher record.')}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (offerings.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={t('Language Skills Assessments')} description={t('Track and evaluate student language proficiency.')} />
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-6 shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Language Offerings Found')}</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            {t('You need an active language course offering to record skill assessments.')}
          </p>
          <button onClick={() => router.push('/llms/programs')} className="mt-4 px-4 py-2 bg-indigo-650 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            {t('View Language Programs')}
          </button>
        </div>
      </PageContainer>
    );
  }

  // Calculate KPIs
  const studentsAssessed = new Set(assessments.map(a => a.student?.documentId)).size;
  const avgScore = assessments.length > 0 
    ? (assessments.reduce((acc, curr) => acc + ((curr.score / curr.maxScore) * 100), 0) / assessments.length).toFixed(1)
    : 0;
  
  const skillAverages = SKILL_TYPES.map(skill => {
    const skillAssessments = assessments.filter(a => a.skillType === skill);
    const avg = skillAssessments.length > 0
      ? skillAssessments.reduce((acc, curr) => acc + ((curr.score / curr.maxScore) * 100), 0) / skillAssessments.length
      : null;
    return { skill, avg };
  }).filter(s => s.avg !== null);

  const lowestSkill = skillAverages.length > 0 
    ? skillAverages.reduce((min, curr) => (curr.avg! < min.avg! ? curr : min), skillAverages[0])
    : null;

  return (
    <PageContainer>
      <PageHeader title={t('Language Skills Assessment')} description={t('Matrix view of student skills and proficiency.')} />
      
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <select 
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none min-w-[250px] font-medium"
            >
              {offerings.map(o => (
                <option key={o.documentId} value={o.documentId}>
                  {o.subject?.name} - {o.academicSection?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-sm transition-colors"
            >
              <Download className="h-4 w-4" /> {t('Export CSV')}
            </button>
            <button 
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" /> {t('Record Assessment')}
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-650 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Students Enrolled')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-650 dark:text-emerald-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Assessed Students')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{studentsAssessed}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Average Score')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{avgScore}%</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Needs Attention')}</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{lowestSkill?.skill ? t(lowestSkill.skill) : t('None')}</h4>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
              {t('Skill Matrix')}
            </h3>
            <span className="text-xs text-slate-500">{t('Shows latest assessment score per skill')}</span>
          </div>
          
          <div className="overflow-x-auto">
            {isDataLoading ? (
              <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">{t('No students enrolled in this offering.')}</div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10">{t('Student')}</th>
                    {SKILL_TYPES.map(skill => (
                      <th key={skill} className="px-4 py-4 text-center">{t(skill)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student: any) => (
                    <tr key={student.documentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800/90 z-10 border-r border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => setSelectedStudentDetail(student)}
                          className="font-medium text-indigo-650 dark:text-indigo-400 hover:underline text-left"
                        >
                          {student?.firstName} {student?.lastName}
                        </button>
                      </td>
                      {SKILL_TYPES.map(skill => {
                        const studentAssessments = assessments.filter((a: any) => a.student?.documentId === student.documentId && a.skillType === skill);
                        const latest = studentAssessments.length > 0 ? studentAssessments[0] : null;
                        
                        let cellContent = <span className="text-slate-300 dark:text-slate-600">—</span>;
                        if (latest) {
                          const percentage = (latest.score / latest.maxScore) * 100;
                          let colorClass = "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
                          if (percentage < 50) colorClass = "text-red-650 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
                          else if (percentage < 75) colorClass = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";

                          cellContent = (
                            <span 
                              className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${colorClass}`}
                              title={`${latest.title}: ${latest.score}/${latest.maxScore} (${new Date(latest.date).toLocaleDateString()})`}
                            >
                              {percentage.toFixed(0)}%
                            </span>
                          );
                        }

                        return (
                          <td key={skill} className="px-4 py-3 text-center">
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Record Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('Record Assessment')}</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRecordAssessment} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Student *')}</label>
                <select 
                  required
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>{t('Select Student')}</option>
                  {students.map(s => (
                    <option key={s.documentId} value={s.documentId}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Skill Type *')}</label>
                  <select 
                    required
                    value={formData.skillType}
                    onChange={e => setFormData({...formData, skillType: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SKILL_TYPES.map(skill => (
                      <option key={skill} value={skill}>{t(skill)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Date *')}</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Assessment Title *')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('e.g. Unit 3 Reading Comprehension')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Score *')}</label>
                  <input 
                    required
                    type="number" step="0.1"
                    value={formData.score}
                    onChange={e => setFormData({...formData, score: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Max Score')}</label>
                  <input 
                    required
                    type="number" step="0.1"
                    value={formData.maxScore}
                    onChange={e => setFormData({...formData, maxScore: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Feedback')}</label>
                <textarea 
                  rows={3}
                  value={formData.teacherFeedback}
                  onChange={e => setFormData({...formData, teacherFeedback: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('Notes on performance...')}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  {t('Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Drawer (Simplified as Modal for now) */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 shadow-xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                  {selectedStudentDetail.firstName} {selectedStudentDetail.lastName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('Skill History')}</p>
              </div>
              <button onClick={() => setSelectedStudentDetail(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {assessments.filter((a: any) => a.student?.documentId === selectedStudentDetail.documentId).length === 0 ? (
                <div className="text-center text-slate-500 mt-10">{t('No assessments recorded yet.')}</div>
              ) : (
                <div className="space-y-4">
                  {assessments
                    .filter((a: any) => a.student?.documentId === selectedStudentDetail.documentId)
                    .map((assessment: any) => (
                      <div key={assessment.documentId} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 mb-1">
                              {t(assessment.skillType)}
                            </span>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{assessment.title}</h4>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-slate-900 dark:text-white leading-none">
                              {assessment.score}/{assessment.maxScore}
                            </div>
                            <span className="text-xs text-slate-500">{new Date(assessment.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {assessment.teacherFeedback && (
                          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            {assessment.teacherFeedback}
                          </div>
                        )}
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
