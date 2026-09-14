'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { 
  BookOpen, Calendar, CheckCircle, Clock, AlertCircle, 
  Plus, Edit, Trash2, X, ChevronDown, Check, AlertTriangle, ArrowRight
} from 'lucide-react';

export default function MurajaahEnginePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [murajaahs, setMurajaahs] = useState<any[]>([]);
  
  const [view, setView] = useState<'student' | 'records'>('student');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student: '',
    assignedPortions: '',
    completedPortions: '',
    revisionScore: '',
    mistakesCount: 0,
    recordStatus: 'Pending',
    dueDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    teacherNotes: ''
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
      
      // Use documentId for Strapi v5 relation filters (documentId is the canonical v5 identifier).
      if (fetchedOfferings.length > 0) {
        setSelectedOfferingId(fetchedOfferings[0].documentId || String(fetchedOfferings[0].id));
      }
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
    setIsLoading(true);
    try {
      // ── Step 1: enrolled students ─────────────────────────────────────────
      // Use documentId (Strapi v5 canonical relation identifier).
      let enrolledStudents: any[] = [];
      try {
        const enrollmentsRes = await apiClient.get('/student-enrollments', {
          params: {
            filters: {
              courseOffering: { documentId: { $eq: selectedOfferingId } },
              enrollmentStatus: { $eq: 'active' }
            },
            populate: ['student'],
            pagination: { limit: 200 }
          }
        });
        enrolledStudents = (enrollmentsRes.data?.data || [])
          .map((e: any) => e.student)
          .filter(Boolean);
      } catch (err: any) {
        console.error('[revision] student-enrollments →', err?.response?.status, err?.response?.data);
        toast.error('Could not load student roster');
      }

      // ── Step 2: murajaah records ──────────────────────────────────────────
      // courseOffering relation on murajaah was just added to schema — Strapi
      // needs a restart to migrate the DB column. Until then scope by teacher
      // and cross-reference against enrolled students client-side.
      let filteredMurajaahs: any[] = [];
      try {
        const murajaahsRes = await apiClient.get('/murajaahs', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['student'],
            sort: 'dueDate:asc',
            pagination: { limit: 500 }
          }
        });
        const enrolledIds = new Set(enrolledStudents.map((s: any) => s.id));
        filteredMurajaahs = (murajaahsRes.data?.data || []).filter(
          (m: any) => m.student && enrolledIds.has(m.student.id)
        );
      } catch (err: any) {
        console.error('[revision] murajaahs →', err?.response?.status, err?.response?.data);
        // Non-fatal: page still renders with student roster, zero revision records.
      }

      setStudents(enrolledStudents);
      setMurajaahs(filteredMurajaahs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/murajaahs', {
        data: {
          ...formData,
          revisionScore: parseFloat(formData.revisionScore),
          student: formData.student,
          teacher: teacher.id,
          courseOffering: selectedOfferingId
        }
      });
      toast.success('Revision record saved successfully');
      setIsModalOpen(false);
      fetchCourseData();
      setFormData({
        student: '',
        assignedPortions: '',
        completedPortions: '',
        revisionScore: '',
        mistakesCount: 0,
        recordStatus: 'Pending',
        dueDate: new Date().toISOString().split('T')[0],
        completionDate: '',
        teacherNotes: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save revision record');
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
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
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

  const filteredMurajaahs = murajaahs.filter(m => {
    if (statusFilter !== 'all' && m.recordStatus !== statusFilter) return false;
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(m.dueDate) < weekAgo) return false;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (new Date(m.dueDate) < monthAgo) return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueRecords = murajaahs.filter(m => m.dueDate < todayStr && m.recordStatus !== 'Completed');

  const getStudentStats = (studentId: string) => {
    const studentRecords = murajaahs.filter(m => (m.student?.documentId || m.student?.id) === studentId);
    const latestScore = studentRecords.length ? studentRecords[studentRecords.length - 1].revisionScore : null;
    const totalMistakes = studentRecords.reduce((sum, m) => sum + (m.mistakesCount || 0), 0);
    const pendingCount = studentRecords.filter(m => m.recordStatus === 'Pending').length;
    const overdueCount = studentRecords.filter(m => m.dueDate < todayStr && m.recordStatus !== 'Completed').length;
    return { total: studentRecords.length, latestScore, totalMistakes, pendingCount, overdueCount };
  };

  const totalCompleted = murajaahs.filter(m => m.recordStatus === 'Completed').length;
  const avgScore = murajaahs.length ? murajaahs.reduce((sum, m) => sum + (m.revisionScore || 0), 0) / murajaahs.length : 0;
  const studentsWithOverdue = new Set(overdueRecords.map(m => m.student?.documentId || m.student?.id)).size;

  return (
    <PageContainer>
      <PageHeader title="Muraja'ah Workspace" description="Manage revision sessions and student progress" />
      
      {overdueRecords.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Attention: {overdueRecords.length} revision {overdueRecords.length === 1 ? 'record is' : 'records are'} overdue.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
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
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
          value={selectedTermId} 
          onChange={e => setSelectedTermId(e.target.value)}
        >
          <option value="">All Terms</option>
          {terms.map(t => (
            <option key={t.documentId || t.id} value={t.documentId || t.id}>{t.name}</option>
          ))}
        </select>

        <select 
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
          value={dateFilter} 
          onChange={e => setDateFilter(e.target.value as any)}
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>

        <select 
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Needs Retest">Needs Retest</option>
        </select>

        <div className="ml-auto flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setView('student')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-lg ${view === 'student' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
          >
            Student View
          </button>
          <button 
            onClick={() => setView('records')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-lg ${view === 'records' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
          >
            Records View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {murajaahs.length ? Math.round((totalCompleted / murajaahs.length) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(avgScore)}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Students w/ Overdue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentsWithOverdue}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Sessions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{murajaahs.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {view === 'student' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Sessions</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Latest Score</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Mistakes</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Pending</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map(student => {
                  const stats = getStudentStats(student.documentId || student.id);
                  return (
                    <tr key={student.documentId || student.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-slate-500">{student.studentId}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{stats.total}</td>
                      <td className="px-4 py-3">
                        {stats.latestScore !== null ? (
                          <span className={`font-medium ${stats.latestScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : stats.latestScore >= 75 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {stats.latestScore}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{stats.totalMistakes}</td>
                      <td className="px-4 py-3">
                        {stats.pendingCount > 0 && <span className="text-amber-600 dark:text-amber-400">{stats.pendingCount} pending</span>}
                        {stats.pendingCount === 0 && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {stats.overdueCount > 0 ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {stats.overdueCount} Overdue
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            On Track
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, student: student.documentId || student.id }));
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-medium"
                        >
                          Record Revision
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Assigned</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMurajaahs.map(m => (
                  <tr key={m.documentId || m.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{m.student?.firstName} {m.student?.lastName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{m.assignedPortions}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.revisionScore}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        m.recordStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        m.recordStatus === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        m.recordStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {m.recordStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.dueDate < todayStr && m.recordStatus !== 'Completed' ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                        {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                      <button className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Record Revision</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
                  <select 
                    required
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    value={formData.student}
                    onChange={e => setFormData({ ...formData, student: e.target.value })}
                  >
                    <option value="">Select Student...</option>
                    {students.map(s => (
                      <option key={s.documentId || s.id} value={s.documentId || s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Portions</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      placeholder="e.g. Juz 1: Al-Baqarah 1-100"
                      value={formData.assignedPortions}
                      onChange={e => setFormData({ ...formData, assignedPortions: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Completed Portions</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.completedPortions}
                      onChange={e => setFormData({ ...formData, completedPortions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Score (%)</label>
                    <input 
                      required
                      type="number" 
                      min="0" max="100" step="0.1"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.revisionScore}
                      onChange={e => setFormData({ ...formData, revisionScore: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mistakes</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.mistakesCount}
                      onChange={e => setFormData({ ...formData, mistakesCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select 
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.recordStatus}
                      onChange={e => setFormData({ ...formData, recordStatus: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Needs Retest">Needs Retest</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Notes</label>
                  <textarea 
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    rows={3}
                    value={formData.teacherNotes}
                    onChange={e => setFormData({ ...formData, teacherNotes: e.target.value })}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium">
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
