/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PenTool, Plus, Search, Filter, CheckCircle2, XCircle, Clock, 
  Trash2, Edit, Eye, FileText, Download, AlertCircle, Calendar, 
  ChevronRight, BookOpen, Layers, User, HelpCircle, RefreshCw, X,
  Paperclip, ShieldAlert
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LessonPlan {
  id: number;
  documentId?: string;
  title: string;
  lessonNumber?: string;
  objectives?: string;
  teachingMethod?: string;
  homework?: string;
  assessmentMethod?: string;
  recordStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  teacher?: {
    id: number;
    name: string;
    schoolId?: string;
  };
  subject?: {
    id: number;
    name: string;
    code?: string;
  };
  section?: {
    id: number;
    name: string;
    code?: string;
  };
  curriculum?: {
    id: number;
    name: string;
  };
  academicYear?: {
    id: number;
    name: string;
  };
  academicTerm?: {
    id: number;
    name: string;
  };
  attachments?: any[];
  createdAt?: string;
}

export default function LessonPlansPage() {
  const { user } = useAuth();
  const { userRole } = usePermissions();

  const isTeacher = userRole === 'teacher';
  const isDirector = userRole === 'director' || userRole === 'super-administrator';
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';

  // Data states
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Filtering / loading states
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Form / Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formLessonNumber, setFormLessonNumber] = useState('');
  const [formSectionId, setFormSectionId] = useState<string | number>('');
  const [formSubjectId, setFormSubjectId] = useState<string | number>('');
  const [formCurriculumId, setFormCurriculumId] = useState<string | number>('');
  const [formAcademicYearId, setFormAcademicYearId] = useState<string | number>('');
  const [formAcademicTermId, setFormAcademicTermId] = useState<string | number>('');
  const [formTeacherId, setFormTeacherId] = useState<string | number>('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formTeachingMethod, setFormTeachingMethod] = useState('');
  const [formHomework, setFormHomework] = useState('');
  const [formAssessmentMethod, setFormAssessmentMethod] = useState('');
  
  // Attachments State
  const [attachmentsList, setAttachmentsList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [planToReject, setPlanToReject] = useState<LessonPlan | null>(null);

  // Parent child selector
  const [selectedChildId, setSelectedChildId] = useState<string | number>('');
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    loadMetadata();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadLessonPlans();
    }
  }, [user, selectedChildId]);

  const getStrapiMediaUrl = (media: any) => {
    if (!media) return '#';
    const rawUrl = typeof media === 'string' ? media : (media.url || media.photoUrl);
    if (!rawUrl || typeof rawUrl !== 'string') return '#';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
    return `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  const loadMetadata = async () => {
    try {
      const [sectionsRes, subjectsRes, currsRes, yearsRes, termsRes] = await Promise.all([
        apiClient.get('/sections?pagination[limit]=100'),
        apiClient.get('/subjects?pagination[limit]=100'),
        apiClient.get('/curriculums?pagination[limit]=100'),
        apiClient.get('/academic-years?pagination[limit]=100'),
        apiClient.get('/academic-terms?pagination[limit]=100'),
      ]);

      setSections(sectionsRes.data?.data || []);
      setSubjects(subjectsRes.data?.data || []);
      setCurriculums(currsRes.data?.data || []);
      setAcademicYears(yearsRes.data?.data || []);
      setAcademicTerms(termsRes.data?.data || []);

      if (isDirector) {
        const teachersRes = await apiClient.get('/teachers?pagination[limit]=300');
        setTeachers(teachersRes.data?.data || []);
      }

      // If Parent, load children
      if (isParent && user?.profile?.children) {
        const kids = user.profile.children || [];
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChildId(kids[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to load metadata options');
    }
  };

  const loadLessonPlans = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        populate: ['teacher', 'subject', 'section', 'curriculum', 'academicYear', 'academicTerm', 'attachments'],
        sort: 'createdAt:desc',
        'pagination[limit]': 200,
      };

      // Role-specific query filters
      if (isTeacher) {
        params['filters[teacher][id][$eq]'] = user?.profile?.id;
      } else if (isStudent) {
        params['filters[recordStatus][$eq]'] = 'Approved';
        const secIds = user?.profile?.sections?.map((s: any) => s.id) || [];
        if (secIds.length > 0) {
          params['filters[section][id][$in]'] = secIds;
        } else {
          setPlans([]);
          setIsLoading(false);
          return;
        }
      } else if (isParent) {
        params['filters[recordStatus][$eq]'] = 'Approved';
        const currentChild = children.find(c => c.id === Number(selectedChildId));
        if (currentChild) {
          const studentProfileRes = await apiClient.get(`/students/${currentChild.id}`, {
            params: { populate: 'sections' }
          });
          const secIds = studentProfileRes.data?.data?.sections?.map((s: any) => s.id) || [];
          if (secIds.length > 0) {
            params['filters[section][id][$in]'] = secIds;
          } else {
            setPlans([]);
            setIsLoading(false);
            return;
          }
        } else {
          setPlans([]);
          setIsLoading(false);
          return;
        }
      }

      const res = await apiClient.get('/lesson-plans', { params });
      setPlans(res.data?.data || []);
    } catch (e) {
      toast.error('Failed to load lesson planning records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedPlan(null);
    setFormTitle('');
    setFormLessonNumber('');
    setFormObjectives('');
    setFormTeachingMethod('');
    setFormHomework('');
    setFormAssessmentMethod('');
    setAttachmentsList([]);
    
    // Auto-select active metadata
    if (sections.length > 0) setFormSectionId(sections[0].id);
    if (subjects.length > 0) setFormSubjectId(subjects[0].id);
    if (curriculums.length > 0) setFormCurriculumId(curriculums[0].id);
    
    const activeYear = academicYears.find(y => y.isCurrent || y.recordStatus === 'active') || academicYears[0];
    const activeTerm = academicTerms.find(t => t.active) || academicTerms[0];
    if (activeYear) setFormAcademicYearId(activeYear.id);
    if (activeTerm) setFormAcademicTermId(activeTerm.id);
    
    setFormTeacherId(user?.profile?.id || '');

    setShowDrawer(true);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setIsEditing(true);
    setSelectedPlan(plan);
    setFormTitle(plan.title);
    setFormLessonNumber(plan.lessonNumber || '');
    setFormSectionId(plan.section?.id || '');
    setFormSubjectId(plan.subject?.id || '');
    setFormCurriculumId(plan.curriculum?.id || '');
    setFormAcademicYearId(plan.academicYear?.id || '');
    setFormAcademicTermId(plan.academicTerm?.id || '');
    setFormTeacherId(plan.teacher?.id || user?.profile?.id || '');
    setFormObjectives(plan.objectives || '');
    setFormTeachingMethod(plan.teachingMethod || '');
    setFormHomework(plan.homework || '');
    setFormAssessmentMethod(plan.assessmentMethod || '');
    setAttachmentsList(plan.attachments || []);
    setShowDrawer(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedFiles = Array.isArray(res.data) ? res.data : [res.data];
      setAttachmentsList(prev => [...prev, ...uploadedFiles]);
      toast.success('Files uploaded successfully.');
    } catch (err) {
      toast.error('Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (id: number) => {
    setAttachmentsList(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSectionId || !formSubjectId) {
      toast.error('Please fill in title, subject, and class section.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        data: {
          title: formTitle,
          lessonNumber: formLessonNumber,
          objectives: formObjectives,
          teachingMethod: formTeachingMethod,
          homework: formHomework,
          assessmentMethod: formAssessmentMethod,
          section: formSectionId,
          subject: formSubjectId,
          curriculum: formCurriculumId || null,
          academicYear: formAcademicYearId || null,
          academicTerm: formAcademicTermId || null,
          teacher: formTeacherId || user?.profile?.id || null,
          attachments: attachmentsList.map(a => a.id),
          recordStatus: selectedPlan ? selectedPlan.recordStatus : 'Draft',
          // Clear rejection text if resubmitting/saving draft
          rejectionReason: selectedPlan?.recordStatus === 'Rejected' ? '' : selectedPlan?.rejectionReason
        }
      };

      if (isEditing && selectedPlan) {
        await apiClient.put(`/lesson-plans/${selectedPlan.documentId || selectedPlan.id}`, payload);
        toast.success('Lesson plan updated successfully.');
      } else {
        await apiClient.post('/lesson-plans', payload);
        toast.success('New lesson plan saved.');
      }

      setShowDrawer(false);
      loadLessonPlans();
    } catch (err) {
      toast.error('Failed to save lesson plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (plan: LessonPlan, newStatus: 'Pending Approval' | 'Approved' | 'Rejected', reason: string = '') => {
    try {
      toast.loading(`Updating plan status to ${newStatus}...`);
      
      const payload: any = {
        data: { recordStatus: newStatus }
      };
      if (newStatus === 'Rejected') {
        payload.data.rejectionReason = reason;
      } else {
        payload.data.rejectionReason = ''; // Clear reason on approval
      }

      await apiClient.put(`/lesson-plans/${plan.documentId || plan.id}`, payload);
      
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Lesson Plan Status Updated',
          description: `Lesson plan "${plan.title}" marked as ${newStatus} by ${user?.displayName}. ${reason ? 'Reason: ' + reason : ''}`,
          performedBy: user?.id,
          severity: newStatus === 'Rejected' ? 'warning' : 'info'
        }
      });

      toast.dismiss();
      toast.success(`Lesson plan status updated to ${newStatus}.`);
      loadLessonPlans();
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (plan: LessonPlan) => {
    if (!confirm(`Are you sure you want to delete lesson plan "${plan.title}"?`)) return;
    try {
      await apiClient.delete(`/lesson-plans/${plan.documentId || plan.id}`);
      toast.success('Lesson plan deleted successfully.');
      loadLessonPlans();
    } catch (err) {
      toast.error('Failed to delete lesson plan.');
    }
  };

  const handleRejectClick = (plan: LessonPlan) => {
    setPlanToReject(plan);
    setRejectReasonText('');
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (!rejectReasonText.trim()) {
      toast.error('Please specify a reason for rejecting this lesson plan.');
      return;
    }
    if (planToReject) {
      handleStatusChange(planToReject, 'Rejected', rejectReasonText);
      setShowRejectModal(false);
      setPlanToReject(null);
    }
  };

  // Filter computations
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.lessonNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || p.recordStatus === statusFilter;
      const matchSection = sectionFilter === 'all' || String(p.section?.id) === sectionFilter;
      const matchSubject = subjectFilter === 'all' || String(p.subject?.id) === subjectFilter;

      return matchSearch && matchStatus && matchSection && matchSubject;
    });
  }, [plans, searchQuery, statusFilter, sectionFilter, subjectFilter]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      draft: plans.filter(p => p.recordStatus === 'Draft').length,
      pending: plans.filter(p => p.recordStatus === 'Pending Approval').length,
      approved: plans.filter(p => p.recordStatus === 'Approved').length,
      rejected: plans.filter(p => p.recordStatus === 'Rejected').length,
    };
  }, [plans]);

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader 
            title="Lesson Planning & Curriculums" 
            description="Coordinate academic syllabi, teaching methods, learning objectives, and check homework across class sections."
          />
          {isTeacher && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer border-none shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lesson Plan</span>
            </button>
          )}
        </div>

        {/* Parent Child Selector */}
        {isParent && children.length > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Child profile:</span>
            <div className="flex gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    selectedChildId === child.id
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  )}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboards Stats Row (For Staff / Directors) */}
        {!isStudent && !(isParent && children.length === 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-550 font-bold block uppercase">Draft plans</span>
                <strong className="text-slate-800 dark:text-slate-200 text-2xl font-mono">{stats.draft}</strong>
              </div>
              <PenTool className="w-8 h-8 text-slate-400 opacity-40" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Pending Approval</span>
                <strong className="text-amber-600 dark:text-amber-400 text-2xl font-mono">{stats.pending}</strong>
              </div>
              <Clock className="w-8 h-8 text-amber-500 opacity-40" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Approved plans</span>
                <strong className="text-emerald-600 dark:text-emerald-450 text-2xl font-mono">{stats.approved}</strong>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-40" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">Rejected / Revisions</span>
                <strong className="text-rose-600 dark:text-rose-400 text-2xl font-mono">{stats.rejected}</strong>
              </div>
              <XCircle className="w-8 h-8 text-rose-500 opacity-40" />
            </div>
          </div>
        )}

        {/* Filters Deck */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by topic, lesson number, teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
              
              {!isStudent && !isParent && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Data Catalog Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold">Querying syllabus lesson plans database...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <PenTool className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Lesson Plans Found</h3>
            <p className="text-xs text-slate-550 max-w-sm mx-auto mt-1">
              Adjust your filters or query search parameters. Teachers can create a new syllabus plan to begin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const statusColors = {
                'Draft': 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800',
                'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30',
                'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
                'Rejected': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30'
              };

              return (
                <div 
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        statusColors[plan.recordStatus]
                      )}>
                        {plan.recordStatus}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plan.lessonNumber || 'Unscheduled'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {plan.title}
                      </h4>
                      <p className="text-[11px] text-slate-550 flex items-center gap-1 mt-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{plan.subject?.name || 'Subject'}</span>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{plan.section?.code || 'Section'}</span>
                      </p>
                    </div>

                    {/* Rejection Alert Box */}
                    {plan.recordStatus === 'Rejected' && plan.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-550 mt-0.5" />
                        <div>
                          <strong className="block">Revision Required:</strong>
                          <span className="italic">"{plan.rejectionReason}"</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-550 block text-[10px] uppercase">Learning Objectives:</span>
                        <p className="text-slate-650 dark:text-slate-350 text-[11px] line-clamp-2 leading-relaxed">
                          {plan.objectives || 'No learning objectives specified.'}
                        </p>
                      </div>
                      {plan.homework && (
                        <div>
                          <span className="font-semibold text-slate-550 block text-[10px] uppercase">Homework Assignment:</span>
                          <p className="text-slate-650 dark:text-slate-350 text-[11px] line-clamp-1 leading-relaxed">
                            {plan.homework}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
                    
                    {/* Faculty Profile Tag */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                        {plan.teacher?.name?.[0] || 'T'}
                      </div>
                      <span className="text-[10px] text-slate-550 font-semibold">{plan.teacher?.name || 'Faculty Member'}</span>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center gap-1">
                      
                      {/* Read details modal button */}
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditing(false);
                          setShowDrawer(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-205 rounded-lg cursor-pointer border-none transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Teacher workflow action buttons */}
                      {isTeacher && (plan.recordStatus === 'Draft' || plan.recordStatus === 'Rejected') && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-205 rounded-lg cursor-pointer border-none transition-colors"
                            title="Edit Plan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {plan.recordStatus === 'Draft' && (
                            <button
                              onClick={() => handleStatusChange(plan, 'Pending Approval')}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 hover:text-amber-700 rounded-lg cursor-pointer border-none transition-colors"
                              title="Submit for Approval"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {plan.recordStatus === 'Rejected' && (
                            <button
                              onClick={() => handleStatusChange(plan, 'Pending Approval')}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 hover:text-emerald-700 rounded-lg cursor-pointer border-none transition-colors"
                              title="Resubmit for Approval"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 hover:text-rose-700 rounded-lg cursor-pointer border-none transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Director workflow approval buttons */}
                      {isDirector && plan.recordStatus === 'Pending Approval' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(plan, 'Approved')}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-colors border-none shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(plan)}
                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition-colors border-none shadow-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drawer Component */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-end animate-fade-in">
            
            <div className="absolute inset-0" onClick={() => setShowDrawer(false)} />

            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between gap-6 overflow-y-auto animate-slide-in-right text-xs text-slate-850 dark:text-slate-200">
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedPlan && !isEditing ? 'Lesson Plan Details' : isEditing ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowDrawer(false)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-400 hover:text-slate-605 border-none bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* READ ONLY DETAILS VIEW */}
                {selectedPlan && !isEditing ? (
                  <div className="space-y-5">
                    
                    {/* Rejection alert banner inside read-only details */}
                    {selectedPlan.recordStatus === 'Rejected' && selectedPlan.rejectionReason && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-350 text-xs">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-rose-550" />
                        <div>
                          <strong className="block font-bold">Revision Required</strong>
                          <p className="mt-0.5 leading-relaxed">{selectedPlan.rejectionReason}</p>
                          {isTeacher && (
                            <button
                              onClick={() => handleOpenEdit(selectedPlan)}
                              className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-[10px] uppercase cursor-pointer border-none shadow-sm"
                            >
                              Edit & Fix Plan
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedPlan.title}</h4>
                      <p className="text-slate-550 text-[10px] mt-0.5">Lesson #{selectedPlan.lessonNumber || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Subject</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedPlan.subject?.name || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Class Section</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedPlan.section?.code || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Syllabus Curriculum</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedPlan.curriculum?.name || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Academic Cycle</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">
                          {selectedPlan.academicYear?.name || '—'} ({selectedPlan.academicTerm?.name || '—'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Faculty</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{selectedPlan.teacher?.name || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Verification Status</span>
                        <strong className={cn(
                          "font-bold uppercase",
                          selectedPlan.recordStatus === 'Approved' ? 'text-emerald-600' :
                          selectedPlan.recordStatus === 'Rejected' ? 'text-rose-600' : 'text-amber-600'
                        )}>{selectedPlan.recordStatus}</strong>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Learning Objectives:</span>
                        <p className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350">
                          {selectedPlan.objectives || 'No objectives specified.'}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Teaching Methods / Syllabi:</span>
                        <p className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350">
                          {selectedPlan.teachingMethod || 'No teaching methodologies documented.'}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Homework & Classwork Assignments:</span>
                        <p className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350">
                          {selectedPlan.homework || 'No homework assigned.'}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Assessment Criteria:</span>
                        <p className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350">
                          {selectedPlan.assessmentMethod || 'No assessment method defined.'}
                        </p>
                      </div>

                      {/* Display Attachments List */}
                      {selectedPlan.attachments && selectedPlan.attachments.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block mb-2">Uploaded Attachments:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedPlan.attachments.map((file: any) => (
                              <a
                                key={file.id}
                                href={getStrapiMediaUrl(file)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-emerald-500/50 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{file.name}</span>
                                </div>
                                <Download className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  
                  /* WRITE / EDIT CREATOR WIZARD FORM */
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Topic Title</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        placeholder="e.g. Introduction to Quranic Tafsir"
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Reference Number</label>
                        <input
                          type="text"
                          value={formLessonNumber}
                          placeholder="e.g. Lesson 4"
                          onChange={(e) => setFormLessonNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                        <select
                          value={formSubjectId}
                          onChange={(e) => setFormSubjectId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Class Section</label>
                        <select
                          value={formSectionId}
                          onChange={(e) => setFormSectionId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          {sections.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Syllabus Curriculum</label>
                        <select
                          value={formCurriculumId}
                          onChange={(e) => setFormCurriculumId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="">No Curriculum</option>
                          {curriculums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                        <select
                          value={formAcademicYearId}
                          onChange={(e) => setFormAcademicYearId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Term</label>
                        <select
                          value={formAcademicTermId}
                          onChange={(e) => setFormAcademicTermId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Teacher Selector: Only visible for Directors/Admins */}
                    {isDirector ? (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher</label>
                        <select
                          value={formTeacherId}
                          onChange={(e) => setFormTeacherId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Select Teacher</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    ) : null}

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Objectives & Learning Targets</label>
                      <textarea
                        rows={3}
                        value={formObjectives}
                        placeholder="Define learning outcomes..."
                        onChange={(e) => setFormObjectives(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teaching Methodologies / Procedures</label>
                      <textarea
                        rows={3}
                        value={formTeachingMethod}
                        placeholder="Detail the classroom activities..."
                        onChange={(e) => setFormTeachingMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Homework & Prep assignments</label>
                      <textarea
                        rows={2}
                        value={formHomework}
                        placeholder="Add tasks assigned for home study..."
                        onChange={(e) => setFormHomework(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assessment Criteria</label>
                      <textarea
                        rows={2}
                        value={formAssessmentMethod}
                        placeholder="Explain how progress will be measured..."
                        onChange={(e) => setFormAssessmentMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* Attachments Section */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4" />
                        <span>Attachments & Lesson Slides</span>
                      </label>
                      
                      {/* Upload Trigger Button */}
                      <div className="flex items-center gap-4">
                        <label className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold cursor-pointer text-slate-700 dark:text-slate-300 text-[11px] inline-block">
                          {isUploading ? 'Uploading Files...' : 'Choose Files'}
                          <input
                            type="file"
                            multiple
                            disabled={isUploading}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-400">PDF, PPTX, DOCX, or images</span>
                      </div>

                      {/* Display Uploaded Files with delete trigger */}
                      {attachmentsList.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {attachmentsList.map((file) => (
                            <div
                              key={file.id}
                              className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(file.id)}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600 cursor-pointer border-none bg-transparent"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowDrawer(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer border-none"
                      >
                        {isSaving ? 'Saving Plan...' : 'Save Lesson Plan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Rejection Modal Dialog Sheet */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Reject Lesson Plan</h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Specify why this lesson plan requires revision.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason / Revision Notes</label>
                <textarea
                  rows={4}
                  required
                  value={rejectReasonText}
                  placeholder="e.g. Please update objectives to match curriculum level 2. Homework task needs to be clarified."
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setPlanToReject(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-705 dark:text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRejection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md cursor-pointer border-none text-xs"
                >
                  Reject & Notify Teacher
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
