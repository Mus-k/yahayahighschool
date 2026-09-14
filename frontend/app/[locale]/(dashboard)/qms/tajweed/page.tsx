'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { 
  BookOpen, Calendar, CheckCircle, Search, Award, BarChart2, TrendingUp, X
} from 'lucide-react';

export default function TajweedEvaluationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student: '',
    academicTerm: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    makharij: '', sifaat: '', ghunnah: '', madd: '', qalqalah: '',
    waqf: '', noonSaakin: '', meemSaakin: '', fluency: '',
    teacherComments: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) { 
      setIsLoading(false); 
      return; 
    }
    
    fetchInitialData();
  }, [authLoading, teacher?.id]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [offeringsRes, termsRes] = await Promise.all([
        apiClient.get('/course-offerings', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
            populate: ['subject', 'academicSection', 'gradeLevel', 'academicTerm', 'academicYear'],
            pagination: { limit: 100 }
          }
        }),
        apiClient.get('/academic-terms', {
          params: {
            pagination: { limit: 20 },
            sort: 'startDate:desc'
          }
        })
      ]);

      const fetchedOfferings = offeringsRes.data?.data || [];
      const fetchedTerms = termsRes.data?.data || [];
      
      setOfferings(fetchedOfferings);
      setTerms(fetchedTerms);
      
      if (fetchedOfferings.length > 0) setSelectedOfferingId(fetchedOfferings[0].documentId || String(fetchedOfferings[0].id));
      if (fetchedTerms.length > 0) setSelectedTermId(String(fetchedTerms[0].id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedOfferingId) return;
    fetchCourseData();
  }, [selectedOfferingId]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const [enrollmentsRes, evaluationsRes] = await Promise.all([
        apiClient.get('/student-enrollments', {
          params: {
            filters: {
              courseOffering: { documentId: { $eq: selectedOfferingId } },
              enrollmentStatus: { $eq: 'active' }
            },
            populate: ['student'],
            pagination: { limit: 200 }
          }
        }),
        // tajweed-evaluations: courseOffering column newly added, needs Strapi restart.
        // Filter by teacher.id and cross-reference enrolled students client-side.
        apiClient.get('/tajweed-evaluations', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['student'],
            sort: 'evaluationDate:desc',
            pagination: { limit: 500 }
          }
        })
      ]);

      const enrolledStudents = enrollmentsRes.data?.data?.map((e: any) => e.student).filter(Boolean) || [];
      const enrolledStudentIds = new Set(enrolledStudents.map((s: any) => s.id));
      const allEvals = evaluationsRes.data?.data || [];
      const filteredEvals = allEvals.filter(
        (ev: any) => ev.student && enrolledStudentIds.has(ev.student.id)
      );

      setStudents(enrolledStudents);
      setEvaluations(filteredEvals);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (field: string, val: string) => {
    const num = parseInt(val);
    if (!val || (num >= 0 && num <= 10)) {
      setFormData({ ...formData, [field]: val });
    }
  };

  const calculateOverallScore = () => {
    const fields = ['makharij', 'sifaat', 'ghunnah', 'madd', 'qalqalah', 'waqf', 'noonSaakin', 'meemSaakin', 'fluency'];
    let total = 0;
    let count = 0;
    fields.forEach(f => {
      if ((formData as any)[f]) {
        total += parseInt((formData as any)[f]);
        count++;
      }
    });
    return count === 9 ? (total / 9) * 10 : 0; // average of 9 fields * 10 = score out of 100
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = ['makharij', 'sifaat', 'ghunnah', 'madd', 'qalqalah', 'waqf', 'noonSaakin', 'meemSaakin', 'fluency'];
    const hasAll = fields.every(f => (formData as any)[f] !== '');
    if (!hasAll) {
      toast.error('Please enter all 9 competency scores (0-10).');
      return;
    }

    const overallScore = calculateOverallScore();

    try {
      await apiClient.post('/tajweed-evaluations', {
        data: {
          makharij: parseInt(formData.makharij),
          sifaat: parseInt(formData.sifaat),
          ghunnah: parseInt(formData.ghunnah),
          madd: parseInt(formData.madd),
          qalqalah: parseInt(formData.qalqalah),
          waqf: parseInt(formData.waqf),
          noonSaakin: parseInt(formData.noonSaakin),
          meemSaakin: parseInt(formData.meemSaakin),
          fluency: parseInt(formData.fluency),
          overallScore,
          teacherComments: formData.teacherComments,
          evaluationDate: formData.evaluationDate,
          student: formData.student,
          teacher: teacher.id,
          courseOffering: selectedOfferingId,
          academicTerm: formData.academicTerm || selectedTermId
        }
      });
      toast.success('Evaluation saved successfully');
      setIsModalOpen(false);
      fetchCourseData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save evaluation');
    }
  };

  if (isLoading || authLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!offerings.length) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Quran Course Offerings Assigned</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            You have no active Quran course offerings. Ask an administrator to assign you a Course Offering.
          </p>
          <button onClick={() => router.push('/lms/offerings')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            View Course Offerings
          </button>
        </div>
      </PageContainer>
    );
  }

  const latestEvalsMap = new Map();
  evaluations.forEach(ev => {
    const studentId = ev.student?.documentId || ev.student?.id;
    if (!latestEvalsMap.has(studentId)) {
      latestEvalsMap.set(studentId, ev);
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const filteredStudents = students.filter(s => 
    s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEvaluated = latestEvalsMap.size;
  const avgOverall = totalEvaluated ? Array.from(latestEvalsMap.values()).reduce((sum, ev) => sum + ev.overallScore, 0) / totalEvaluated : 0;
  const needsAttention = Array.from(latestEvalsMap.values()).filter(ev => ev.overallScore < 60).length;
  const excellentCount = Array.from(latestEvalsMap.values()).filter(ev => ev.overallScore >= 90).length;

  return (
    <PageContainer>
      <PageHeader title="Tajweed Competency Tracker" description="Evaluate and track student tajweed proficiency" />
      
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
        {[
          { e: 'Makharij', a: 'مخارج الحروف' },
          { e: 'Sifaat', a: 'صفات الحروف' },
          { e: 'Ghunnah', a: 'الغنة' },
          { e: 'Madd', a: 'المد' },
          { e: 'Qalqalah', a: 'القلقلة' },
          { e: 'Waqf', a: 'الوقف والابتداء' },
          { e: 'Noon Saakin', a: 'النون الساكنة' },
          { e: 'Meem Saakin', a: 'الميم الساكنة' },
          { e: 'Fluency', a: 'الطلاقة' },
        ].map((comp, i) => (
          <div key={i} className="flex flex-col items-center px-3 py-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comp.e}</span>
            <span className="text-[10px] text-slate-500 font-arabic" dir="rtl">{comp.a}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 min-w-[200px]"
          value={selectedOfferingId} 
          onChange={e => setSelectedOfferingId(e.target.value)}
        >
          {offerings.map(o => (
            <option key={o.documentId || o.id} value={o.documentId || o.id}>
              {o.academicSection?.name} - {o.subject?.name}
            </option>
          ))}
        </select>

        <select 
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 min-w-[150px]"
          value={selectedTermId} 
          onChange={e => setSelectedTermId(e.target.value)}
        >
          {terms.map(t => (
            <option key={t.documentId || t.id} value={t.documentId || t.id}>{t.name}</option>
          ))}
        </select>

        <div className="relative ml-auto flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Evaluated</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEvaluated} <span className="text-sm font-normal text-slate-500">/ {students.length}</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Avg Overall Score</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(avgOverall)}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
            <TrendingUp className="h-6 w-6 rotate-180" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Needs Attention</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{needsAttention}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Excellent (≥90)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{excellentCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800">Student</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Makharij</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Sifaat</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Ghunnah</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Madd</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Qalqalah</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Waqf</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Noon</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Meem</th>
                <th className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400">Fluency</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">Overall</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(student => {
                const sId = student.documentId || student.id;
                const ev = latestEvalsMap.get(sId);
                const hasData = !!ev;
                
                return (
                  <tr key={sId} className={!hasData ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}>
                    <td className="px-4 py-3 text-left sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                      <div className="font-medium text-slate-900 dark:text-white">{student.firstName} {student.lastName}</div>
                      <div className="text-xs text-slate-500">{student.studentId}</div>
                    </td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.makharij : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.sifaat : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.ghunnah : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.madd : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.qalqalah : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.waqf : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.noonSaakin : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.meemSaakin : '—'}</td>
                    <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{hasData ? ev.fluency : '—'}</td>
                    <td className="px-4 py-3 border-l border-slate-100 dark:border-slate-800 font-bold">
                      {hasData ? (
                        <span className={`inline-flex px-2 py-1 rounded-md ${getScoreColor(ev.overallScore)}`}>
                          {Math.round(ev.overallScore)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {hasData ? new Date(ev.evaluationDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          setFormData({
                            student: sId,
                            academicTerm: selectedTermId,
                            evaluationDate: new Date().toISOString().split('T')[0],
                            makharij: '', sifaat: '', ghunnah: '', madd: '', qalqalah: '',
                            waqf: '', noonSaakin: '', meemSaakin: '', fluency: '',
                            teacherComments: ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-medium"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Evaluate Student Tajweed</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="evaluation-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
                    <select 
                      required disabled
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-500"
                      value={formData.student}
                    >
                      {students.map(s => <option key={s.documentId || s.id} value={s.documentId || s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Evaluation Date</label>
                    <input 
                      required type="date"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.evaluationDate}
                      onChange={e => setFormData({ ...formData, evaluationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">Competency Scores</h3>
                    <span className="text-xs text-slate-500">Rate from 0 to 10</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: 'makharij', label: 'Makharij', ar: 'مخارج الحروف' },
                      { key: 'sifaat', label: 'Sifaat', ar: 'صفات الحروف' },
                      { key: 'ghunnah', label: 'Ghunnah', ar: 'الغنة' },
                      { key: 'madd', label: 'Madd', ar: 'المد' },
                      { key: 'qalqalah', label: 'Qalqalah', ar: 'القلقلة' },
                      { key: 'waqf', label: 'Waqf', ar: 'الوقف والابتداء' },
                      { key: 'noonSaakin', label: 'Noon Saakin', ar: 'النون الساكنة' },
                      { key: 'meemSaakin', label: 'Meem Saakin', ar: 'الميم الساكنة' },
                      { key: 'fluency', label: 'Fluency', ar: 'الطلاقة' },
                    ].map(comp => (
                      <div key={comp.key}>
                        <label className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          <span>{comp.label}</span>
                          <span className="text-slate-400 font-arabic text-xs" dir="rtl">{comp.ar}</span>
                        </label>
                        <input 
                          type="number" min="0" max="10" required
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                          value={(formData as any)[comp.key]}
                          onChange={e => handleScoreChange(comp.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Calculated Overall Score:</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(calculateOverallScore())}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Comments</label>
                  <textarea 
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    rows={3} placeholder="Add feedback or notes on specific areas for improvement..."
                    value={formData.teacherComments}
                    onChange={e => setFormData({ ...formData, teacherComments: e.target.value })}
                  />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" form="evaluation-form" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium">
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
