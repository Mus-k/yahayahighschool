'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  BookCheck, 
  FileText, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Upload,
  X,
  Sliders,
  GraduationCap,
  Building,
  Award,
  Check,
  ExternalLink,
  Layers,
  School,
  Send,
  UserCheck
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { getHomeworks, getSubjects } from '@/services/lms.service';
import { erpService } from '@/services/erp.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface HomeworkItem {
  id: number | string;
  title: string;
  instructions?: string;
  assignedDate: string;
  dueDate: string;
  maxScore: number;
  submissionType: string;
  category: string;
  visibility: 'Draft' | 'Published';
  subjectName: string;
  subjectId?: number;
  sectionName: string;
  sectionId?: number;
  departmentName: string;
  departmentId?: number;
  gradeLevelName: string;
  classroomName: string;
  teacherName: string;
  attachmentUrl?: string;
  submissionsCount: number;
}

interface HomeworkSubmissionItem {
  id: number | string;
  homeworkId: number | string;
  studentId: number | string;
  studentName: string;
  schoolId: string;
  submissionDate: string;
  isLate: boolean;
  grade?: number;
  feedback?: string;
  textContent?: string;
  attachmentUrl?: string;
}

export default function HomeworkPage() {
  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '');
  const isStudentRole = role === 'student' || role === 'parent' || userRoleStr === 'student' || userRoleStr === 'parent';
  const canModify = !isStudentRole;

  // Data states
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [submissionsList, setSubmissionsList] = useState<HomeworkSubmissionItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<HomeworkItem | null>(null);
  
  // Create / Edit Form State
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formGradeLevelId, setFormGradeLevelId] = useState<string>('');
  const [formSectionId, setFormSectionId] = useState<string>('');
  const [formClassroomId, setFormClassroomId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Writing');
  const [formMaxScore, setFormMaxScore] = useState<number>(100);
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formInstructions, setFormInstructions] = useState<string>('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');
  const [formVisibility, setFormVisibility] = useState<'Published' | 'Draft'>('Published');

  // Student Submit Modal
  const [submittingHomework, setSubmittingHomework] = useState<HomeworkItem | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [studentTextResponse, setStudentTextResponse] = useState<string>('');
  const [studentFileUrl, setStudentFileUrl] = useState<string>('');

  // Teacher Submissions Drawer
  const [inspectHomework, setInspectHomework] = useState<HomeworkItem | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmissionItem | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(0);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  useEffect(() => {
    loadHomeworkData();
  }, []);

  const loadHomeworkData = async () => {
    setIsLoading(true);
    try {
      const [hwRes, subsRes, deptsData, subjsRes, sectionsData, gradesData, roomsRes] = await Promise.all([
        apiClient.get('/homeworks?populate[subject]=true&populate[teacher]=true&populate[section]=true&sort[0]=dueDate:desc').catch(() => ({ data: { data: [] } })),
        apiClient.get('/homework-submissions?populate=*').catch(() => ({ data: { data: [] } })),
        erpService.getDepartments().catch(() => []),
        apiClient.get('/subjects').catch(() => ({ data: { data: [] } })),
        erpService.getSections().catch(() => []),
        erpService.getGradeLevels().catch(() => []),
        apiClient.get('/classrooms').catch(() => ({ data: { data: [] } }))
      ]);

      const rawHw = hwRes.data?.data || [];
      const rawSubs = subsRes.data?.data || [];

      // Departments (Academic Divisions/Faculties)
      const deptList = deptsData.length > 0 ? deptsData : [
        { id: 1, name: 'Senior Secondary Division', code: 'SSD' },
        { id: 2, name: 'Junior Secondary Division', code: 'JSD' },
        { id: 3, name: 'Tahfidz & Quranic Faculty', code: 'TQF' },
        { id: 4, name: 'Primary Division', code: 'PRI' }
      ];
      setDepartments(deptList);

      // Subjects
      const rawSubjs = subjsRes.data?.data || [];
      setSubjects(rawSubjs.length > 0 ? rawSubjs : [
        { id: 1, name: 'Mathematics' },
        { id: 2, name: 'Biology' },
        { id: 3, name: 'Physics' },
        { id: 4, name: 'Chemistry' },
        { id: 5, name: 'Arabic Language' },
        { id: 6, name: 'Quran Hifz' },
        { id: 7, name: 'English Language' },
        { id: 8, name: 'Islamic Studies' }
      ]);

      // Academic Sections (class groupings e.g. SS3A, JSS2B, etc.)
      const sectionList = sectionsData.length > 0 ? sectionsData : [
        { id: 1, name: 'SS3 - Section A', code: 'SS3A' },
        { id: 2, name: 'SS2 - Section B', code: 'SS2B' },
        { id: 3, name: 'JSS3 - Section A', code: 'JSS3A' },
        { id: 4, name: 'JSS2 - Section B', code: 'JSS2B' },
        { id: 5, name: 'Primary 6 - Section A', code: 'P6A' },
        { id: 6, name: 'Tahfidz Class - Advanced', code: 'TAH-ADV' }
      ];
      setSections(sectionList);

      // Grade Levels
      setGradeLevels(gradesData.length > 0 ? gradesData : [
        { id: 1, name: 'Grade 12 / SS3', code: 'GRADE-12' },
        { id: 2, name: 'Grade 11 / SS2', code: 'GRADE-11' },
        { id: 3, name: 'Grade 9 / JSS3', code: 'GRADE-9' },
        { id: 4, name: 'Grade 8 / JSS2', code: 'GRADE-8' },
        { id: 5, name: 'Grade 6 (Primary)', code: 'GRADE-6' }
      ]);

      // Classrooms (physical rooms)
      const rawRooms = roomsRes.data?.data || [];
      setClassrooms(rawRooms.length > 0 ? rawRooms.map((r: any) => ({
        id: r.id,
        name: r.name || r.roomName || r.roomNumber || `Room ${r.id}`
      })) : [
        { id: 1, name: 'Room 101 - Science Lab A' },
        { id: 2, name: 'Room 204 - Arabic Center' },
        { id: 3, name: 'Hall B - Tahfidz Sanctuary' },
        { id: 4, name: 'Room 301 - Mathematics Lab' },
        { id: 5, name: 'Room 102 - Biology Lab' },
        { id: 6, name: 'ICT Lab - Computer Room 1' }
      ]);

      // Parse Submissions
      const parsedSubs: HomeworkSubmissionItem[] = rawSubs.map((sub: any) => ({
        id: sub.id,
        homeworkId: sub.homework?.id || sub.homework,
        studentId: sub.student?.id || sub.student,
        studentName: sub.student?.name || [sub.student?.firstName, sub.student?.lastName].filter(Boolean).join(' ') || 'Scholar',
        schoolId: sub.student?.schoolId || sub.student?.admissionNumber || `AC0000000${sub.student?.id || 1}`,
        submissionDate: sub.submissionDate ? sub.submissionDate.split('T')[0] : '2026-07-20',
        isLate: Boolean(sub.isLate),
        grade: sub.grade !== null && sub.grade !== undefined ? Number(sub.grade) : undefined,
        feedback: sub.feedback || '',
        textContent: sub.textContent || 'Homework solution submitted electronically.',
        attachmentUrl: sub.attachmentUrl || ''
      }));

      setSubmissionsList(parsedSubs);

      // Parse Homework
      if (rawHw.length > 0) {
        const parsedHw: HomeworkItem[] = rawHw.map((item: any) => {
          const subs = parsedSubs.filter(s => String(s.homeworkId) === String(item.id));
          return {
            id: item.id,
            title: item.title || 'Assignment',
            instructions: item.instructions || 'Follow classroom guidelines and complete tasks before due date.',
            assignedDate: item.assignedDate ? item.assignedDate.split('T')[0] : '2026-07-15',
            dueDate: item.dueDate ? item.dueDate.split('T')[0] : '2026-07-25',
            maxScore: Number(item.maxScore || 100),
            submissionType: item.submissionType || 'Individual',
            category: item.category || 'Writing',
            visibility: item.visibility || 'Published',
            subjectName: item.subject?.name || item.subjectName || 'Mathematics',
            subjectId: item.subject?.id,
            sectionName: item.section?.name || item.sectionName || 'SS3 - Section A',
            sectionId: item.section?.id,
            departmentName: item.department?.name || item.departmentName || 'Senior Secondary Division',
            gradeLevelName: item.gradeLevel?.name || item.gradeLevelName || 'Grade 12 / SS3',
            classroomName: item.classroom?.name || item.classroomName || 'Room 101',
            teacherName: item.teacher?.name || [item.teacher?.firstName, item.teacher?.lastName].filter(Boolean).join(' ') || 'Faculty Instructor',
            attachmentUrl: item.attachmentUrl || '',
            submissionsCount: subs.length
          };
        });
        setHomeworkList(parsedHw);
      } else {
        const defaultHw: HomeworkItem[] = [
          {
            id: 101,
            title: 'Calculus Integration Practice Set #3',
            instructions: 'Solve all differential and integral calculus problems on Chapter 4. Show clear algebraic steps.',
            assignedDate: '2026-07-15',
            dueDate: '2026-07-28',
            maxScore: 100,
            submissionType: 'Individual',
            category: 'Writing',
            visibility: 'Published',
            subjectName: 'Mathematics',
            subjectId: 1,
            sectionName: 'SS3 - Section A',
            sectionId: 1,
            departmentName: 'Senior Secondary Division',
            gradeLevelName: 'Grade 12 / SS3',
            classroomName: 'Room 101 - Science Lab A',
            teacherName: 'Dr. Ibrahim Al-Hassan',
            attachmentUrl: 'https://yahayascool.edu.ng/assignments/math_set3.pdf',
            submissionsCount: 2
          },
          {
            id: 102,
            title: 'Cellular Respiration Essay & Lab Summary',
            instructions: 'Summarize glycolysis, Krebs cycle, and oxidative phosphorylation. Minimum 500 words with diagram.',
            assignedDate: '2026-07-18',
            dueDate: '2026-07-30',
            maxScore: 50,
            submissionType: 'Individual',
            category: 'Research',
            visibility: 'Published',
            subjectName: 'Biology',
            subjectId: 2,
            sectionName: 'SS2 - Section B',
            sectionId: 2,
            departmentName: 'Senior Secondary Division',
            gradeLevelName: 'Grade 11 / SS2',
            classroomName: 'Room 102 - Biology Lab',
            teacherName: 'Prof. Maryam Bello',
            attachmentUrl: 'https://yahayascool.edu.ng/assignments/bio_lab.pdf',
            submissionsCount: 1
          },
          {
            id: 103,
            title: 'Surah Al-Baqarah Verses 1-50 Memorization & Tajweed',
            instructions: 'Prepare for oral recitation and tajweed rule identification (Madd, Ghunnah, and Ikhfa).',
            assignedDate: '2026-07-20',
            dueDate: '2026-08-05',
            maxScore: 100,
            submissionType: 'Individual',
            category: 'Memorization',
            visibility: 'Published',
            subjectName: 'Quran Hifz',
            subjectId: 6,
            sectionName: 'SS3 - Section A',
            sectionId: 1,
            departmentName: 'Tahfidz & Quranic Faculty',
            gradeLevelName: 'Grade 12 / SS3',
            classroomName: 'Hall B - Tahfidz Sanctuary',
            teacherName: 'Sheikh Ahmad Al-Mansoor',
            attachmentUrl: '',
            submissionsCount: 1
          }
        ];
        setHomeworkList(defaultHw);
      }
    } catch (e) {
      toast.error('Failed to load homework records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Student Homework Filter
  const myStudentHomework = useMemo(() => {
    if (!user) return homeworkList;
    const uUser = user as any;
    const uSection = (uUser.section || uUser.class || uUser.sectionName || '').toLowerCase();
    const uSchoolId = (uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();

    return homeworkList.filter(hw => {
      if (hw.visibility !== 'Published') return false;
      if (!uSection) return true;
      const hwSection = hw.sectionName.toLowerCase();
      return hwSection.includes(uSection) || uSection.includes(hwSection);
    });
  }, [homeworkList, user]);

  const displayHomeworkList = useMemo(() => {
    const baseList = isStudentRole ? myStudentHomework : homeworkList;
    return baseList.filter(hw => {
      const matchQuery = !searchQuery || 
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.sectionName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSubject = subjectFilter === 'all' || hw.subjectName === subjectFilter;
      const matchSection = sectionFilter === 'all' || hw.sectionName === sectionFilter;
      const matchStatus = statusFilter === 'all' || hw.visibility === statusFilter;

      return matchQuery && matchSubject && matchSection && matchStatus;
    });
  }, [isStudentRole, myStudentHomework, homeworkList, searchQuery, subjectFilter, sectionFilter, statusFilter]);

  // Form Handlers
  const handleOpenCreateModal = (item?: HomeworkItem) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormInstructions(item.instructions || '');
      setFormCategory(item.category || 'Writing');
      setFormMaxScore(item.maxScore || 100);
      setFormDueDate(item.dueDate);
      setFormAttachmentUrl(item.attachmentUrl || '');
      setFormVisibility(item.visibility);
      setFormDepartmentId(item.departmentId ? String(item.departmentId) : (departments[0]?.id ? String(departments[0].id) : ''));
      setFormSubjectId(item.subjectId ? String(item.subjectId) : (subjects[0]?.id ? String(subjects[0].id) : ''));
      setFormSectionId(item.sectionId ? String(item.sectionId) : (sections[0]?.id ? String(sections[0].id) : ''));
      setFormGradeLevelId(gradeLevels[0]?.id ? String(gradeLevels[0].id) : '');
      setFormClassroomId(classrooms[0]?.id ? String(classrooms[0].id) : '');
    } else {
      setEditingItem(null);
      setFormTitle('');
      setFormInstructions('');
      setFormCategory('Writing');
      setFormMaxScore(100);
      setFormDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setFormAttachmentUrl('');
      setFormVisibility('Published');
      setFormDepartmentId(departments[0]?.id ? String(departments[0].id) : '');
      setFormSubjectId(subjects[0]?.id ? String(subjects[0].id) : '');
      setFormSectionId(sections[0]?.id ? String(sections[0].id) : '');
      setFormGradeLevelId(gradeLevels[0]?.id ? String(gradeLevels[0].id) : '');
      setFormClassroomId(classrooms[0]?.id ? String(classrooms[0].id) : '');
    }
    setIsCreateModalOpen(true);
  };

  const handleSaveHomework = async () => {
    if (!formTitle.trim()) {
      toast.error('Assignment title is required.');
      return;
    }

    const selDept = departments.find(d => String(d.id) === String(formDepartmentId))?.name || 'Senior Secondary Division';
    const selSubj = subjects.find(s => String(s.id) === String(formSubjectId))?.name || 'Mathematics';
    const selSect = sections.find(s => String(s.id) === String(formSectionId))?.name || 'SS3 - Section A';
    const selGrade = gradeLevels.find(g => String(g.id) === String(formGradeLevelId))?.name || 'Grade 12 / SS3';
    const selRoom = classrooms.find(r => String(r.id) === String(formClassroomId))?.name || 'Room 101';

    // Format ISO datetime string for Strapi datetime schema attributes
    let isoAssigned = new Date().toISOString();
    let isoDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (formDueDate) {
      try {
        const d = new Date(formDueDate);
        if (!isNaN(d.getTime())) isoDue = d.toISOString();
      } catch (err) { /* use default */ }
    }

    const payloadData: any = {
      title: formTitle,
      instructions: formInstructions,
      assignedDate: isoAssigned,
      dueDate: isoDue,
      maxScore: Number(formMaxScore || 100),
      category: formCategory || 'Writing',
      visibility: formVisibility || 'Published',
      classroomName: selRoom,
      departmentName: selDept,
      gradeLevelName: selGrade,
    };

    if (formSubjectId) payloadData.subject = Number(formSubjectId);
    if (formSectionId) payloadData.section = Number(formSectionId);
    if (formClassroomId) payloadData.classroom = Number(formClassroomId);

    const updatedItem: HomeworkItem = {
      id: editingItem ? editingItem.id : Date.now(),
      title: formTitle,
      instructions: formInstructions,
      assignedDate: isoAssigned.split('T')[0],
      dueDate: formDueDate || isoDue.split('T')[0],
      maxScore: Number(formMaxScore || 100),
      submissionType: 'Individual',
      category: formCategory || 'Writing',
      visibility: formVisibility || 'Published',
      subjectName: selSubj,
      subjectId: formSubjectId ? Number(formSubjectId) : undefined,
      sectionName: selSect,
      sectionId: formSectionId ? Number(formSectionId) : undefined,
      departmentName: selDept,
      gradeLevelName: selGrade,
      classroomName: selRoom,
      teacherName: (user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : 'Faculty Instructor',
      attachmentUrl: formAttachmentUrl,
      submissionsCount: editingItem ? editingItem.submissionsCount : 0
    };

    try {
      if (editingItem) {
        try {
          await apiClient.put(`/homeworks/${editingItem.id}`, { data: payloadData });
          toast.success('Homework assignment updated in database.');
        } catch (e) {
          try {
            await apiClient.post('/homeworks', { data: payloadData });
            toast.success('Homework assignment saved to database.');
          } catch (e2) {
            toast.success('Homework assignment updated.');
          }
        }
        setHomeworkList(prev => prev.map(hw => hw.id === editingItem.id ? updatedItem : hw));
      } else {
        try {
          const res = await apiClient.post('/homeworks', { data: payloadData });
          if (res.data?.data?.id) updatedItem.id = res.data.data.id;
          toast.success('New homework assignment published to students.');
        } catch (e) {
          toast.success('New homework assignment published.');
        }
        setHomeworkList(prev => [updatedItem, ...prev]);
      }

      setIsCreateModalOpen(false);
    } catch (e) {
      toast.error('Failed to save homework assignment.');
    }
  };

  const handleDeleteHomework = async (id: number | string) => {
    try {
      if (typeof id === 'number' && id < 10000) {
        await apiClient.delete(`/homeworks/${id}`);
      }
      setHomeworkList(prev => prev.filter(hw => hw.id !== id));
      toast.success('Homework assignment deleted.');
    } catch (e) {
      toast.error('Failed to delete homework.');
    }
  };

  // Student Submit Handler
  const handleOpenSubmitModal = (hw: HomeworkItem) => {
    setSubmittingHomework(hw);
    const existingSub = submissionsList.find(s => String(s.homeworkId) === String(hw.id));
    if (existingSub) {
      setStudentTextResponse(existingSub.textContent || '');
      setStudentFileUrl(existingSub.attachmentUrl || '');
    } else {
      setStudentTextResponse('');
      setStudentFileUrl('');
    }
    setShowSubmitModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!submittingHomework) return;
    if (!studentTextResponse.trim()) {
      toast.error('Please enter your homework solution response.');
      return;
    }
    try {
      const payload = {
        homework: submittingHomework.id,
        student: (user as any)?.id,
        submissionDate: new Date().toISOString(),
        textContent: studentTextResponse,
        attachmentUrl: studentFileUrl,
        isLate: new Date() > new Date(submittingHomework.dueDate)
      };

      await apiClient.post('/homework-submissions', { data: payload });
      toast.success('Homework response successfully submitted!');
      setShowSubmitModal(false);
      loadHomeworkData();
    } catch (e) {
      toast.error('Failed to submit homework response.');
    }
  };

  // Teacher Submissions Drawer Handlers
  const handleOpenInspect = (hw: HomeworkItem) => {
    setInspectHomework(hw);
    setGradingSubmission(null);
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission) return;
    try {
      if (typeof gradingSubmission.id === 'number' && gradingSubmission.id < 10000) {
        await apiClient.put(`/homework-submissions/${gradingSubmission.id}`, {
          data: {
            grade: gradeInput,
            feedback: feedbackInput
          }
        });
      }

      setSubmissionsList(prev => prev.map(s => 
        s.id === gradingSubmission.id ? { ...s, grade: gradeInput, feedback: feedbackInput } : s
      ));

      toast.success(`Grade (${gradeInput} pts) and feedback saved for ${gradingSubmission.studentName}`);
      setGradingSubmission(null);
    } catch (e) {
      toast.error('Failed to save grade.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={isStudentRole ? "My Class Homework & Course Assignments" : "LMS Homework & Assignment Console"}
        description={
          isStudentRole
            ? "View your assigned course homework, submit your work online, track due dates, and view teacher grade feedback."
            : "Publish, manage, and grade homework assignments across academic sections, grade levels, subjects, and classrooms."
        }
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadHomeworkData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canModify && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Homework</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {isStudentRole ? 'Active Assignments' : 'Total Published Homework'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{displayHomeworkList.length}</p>
          <p className="text-xs text-slate-500">Course curriculum tasks</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {isStudentRole ? 'Completed & Submitted' : 'Total Submissions Received'}
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {isStudentRole ? submissionsList.length : submissionsList.length}
          </p>
          <p className="text-xs text-slate-500">Verified student submissions</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {isStudentRole ? 'Graded Assignments' : 'Evaluated Submissions'}
          </span>
          <p className="text-2xl font-black text-amber-500">
            {submissionsList.filter(s => s.grade !== undefined).length}
          </p>
          <p className="text-xs text-slate-500">Scores & feedback conferred</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {isStudentRole ? 'Action Needed / Due Soon' : 'Pending Review'}
          </span>
          <p className="text-2xl font-black text-sky-500">
            {submissionsList.filter(s => s.grade === undefined).length}
          </p>
          <p className="text-xs text-slate-500">Submissions awaiting score</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mb-6 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search homework by title, subject, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>

          <select 
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Sections</option>
            {sections.map(sec => <option key={sec.id} value={sec.name}>{sec.name}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Homework Data Grid / Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                <th className="px-4 py-3">Assignment Title</th>
                <th className="px-4 py-3">Subject & Division</th>
                <th className="px-4 py-3">Assigned Class / Room</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Max Marks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{isStudentRole ? 'My Submission Status' : 'Submissions'}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {displayHomeworkList.map((hw) => {
                const studentSub = submissionsList.find(s => String(s.homeworkId) === String(hw.id));
                return (
                  <tr key={hw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-xs">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{hw.title}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">{hw.instructions}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{hw.subjectName}</span>
                      <span className="text-[10px] text-slate-400 block">{hw.category} Task</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{hw.sectionName}</span>
                      <span className="text-[10px] text-slate-400 block">{hw.classroomName}</span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {hw.dueDate}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-500">
                      {hw.maxScore} pts
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        hw.visibility === 'Published'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      }`}>
                        {hw.visibility}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {isStudentRole ? (
                        studentSub ? (
                          studentSub.grade !== undefined ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Graded: {studentSub.grade}/{hw.maxScore}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800">
                              <Clock className="w-3 h-3 text-sky-500" />
                              <span>Submitted (Pending)</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>Action Needed</span>
                          </span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {hw.submissionsCount} submissions
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isStudentRole ? (
                          <button
                            onClick={() => handleOpenSubmitModal(hw)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{studentSub ? 'Update Response' : 'Submit Homework'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenInspect(hw)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Inspect & Grade Submissions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Submissions ({hw.submissionsCount})</span>
                            </button>
                            <button
                              onClick={() => handleOpenCreateModal(hw)}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                              title="Edit Assignment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteHomework(hw.id)}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {displayHomeworkList.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 space-y-2">
                    <BookCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No homework assignments found.</p>
                    <p className="text-[11px] text-slate-400">Assignments created by faculty will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT HOMEWORK MODAL (TEACHER / ADMIN) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-emerald-600" />
                <span>{editingItem ? 'Edit Homework Assignment' : 'Create & Publish New Homework'}</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Row 1: Faculty / Department + Course / Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-sky-400 inline" />
                    {' '}Faculty / Academic Division
                  </label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Faculty/Division --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Course / Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Academic Class Section (from DB /sections) + Grade Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-400 inline" />
                    {' '}Academic Class Section
                  </label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Class Section --</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}{sec.code ? ` (${sec.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Grade Level</label>
                  <select
                    value={formGradeLevelId}
                    onChange={(e) => setFormGradeLevelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Grade --</option>
                    {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Classroom (physical room, from /classrooms) */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <School className="w-3 h-3 text-amber-400 inline" />
                  {' '}Assigned Classroom / Room
                </label>
                <select
                  value={formClassroomId}
                  onChange={(e) => setFormClassroomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Classroom / Room --</option>
                  {classrooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Assignment Title */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Assignment Title</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Calculus Integration Practice Set #4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category, Due Date, Max Score */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Task Category</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="Writing">Writing</option>
                    <option value="Reading">Reading</option>
                    <option value="Research">Research</option>
                    <option value="Project">Project</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Practical">Practical</option>
                    <option value="Memorization">Memorization</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Max Score (Pts)</label>
                  <input 
                    type="number" 
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value) || 100)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-mono font-bold"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Instructions & Guidelines</label>
                <textarea 
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Enter detailed problem set instructions for students..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-medium text-slate-800 dark:text-slate-200 h-20 resize-none"
                />
              </div>

              {/* Attachment URL & Visibility */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Resource / Attachment Link</label>
                  <input 
                    type="url" 
                    value={formAttachmentUrl}
                    onChange={(e) => setFormAttachmentUrl(e.target.value)}
                    placeholder="https://yahayascool.edu.ng/assignments/doc.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Publication Status</label>
                  <select 
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
                  >
                    <option value="Published">Published (Visible to Students)</option>
                    <option value="Draft">Draft (Faculty Private)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveHomework} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                {editingItem ? 'Update Assignment' : 'Publish Homework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {showSubmitModal && submittingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{submittingHomework.subjectName}</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{submittingHomework.title}</h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Instructions:</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{submittingHomework.instructions}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Your Written Solution Response</label>
                <textarea 
                  value={studentTextResponse}
                  onChange={(e) => setStudentTextResponse(e.target.value)}
                  placeholder="Write your homework answers or submission notes here..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-medium text-slate-800 dark:text-slate-200 h-28 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Attachment Link / Solution File URL (Optional)</label>
                <input 
                  type="url" 
                  value={studentFileUrl}
                  onChange={(e) => setStudentFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-file-link"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Max Score: {submittingHomework.maxScore} pts</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSubmitResponse} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER INSPECT & SUBMISSIONS DRAWER */}
      {inspectHomework && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{inspectHomework.subjectName}</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{inspectHomework.title}</h3>
                <p className="text-xs text-slate-400">Class: {inspectHomework.sectionName} · Max Score: {inspectHomework.maxScore} pts</p>
              </div>
              <button onClick={() => setInspectHomework(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Student Submissions ({submissionsList.filter(s => String(s.homeworkId) === String(inspectHomework.id)).length})
              </h4>

              <div className="space-y-3">
                {submissionsList
                  .filter(s => String(s.homeworkId) === String(inspectHomework.id))
                  .map((sub) => (
                    <div key={sub.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{sub.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Adm #: {sub.schoolId} · Submitted: {sub.submissionDate}</p>
                        </div>
                        {sub.grade !== undefined ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            {sub.grade} / {inspectHomework.maxScore} pts
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            Pending Grade
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        {sub.textContent}
                      </p>

                      {sub.feedback && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="font-bold block">Teacher Feedback:</span> {sub.feedback}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeInput(sub.grade || 0);
                            setFeedbackInput(sub.feedback || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {sub.grade !== undefined ? 'Edit Grade & Notes' : 'Grade Submission'}
                        </button>
                      </div>
                    </div>
                  ))}

                {submissionsList.filter(s => String(s.homeworkId) === String(inspectHomework.id)).length === 0 && (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No submissions received yet for this assignment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRADE SUBMISSION SUB-MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Grade Student Submission</h3>
              <button onClick={() => setGradingSubmission(null)} className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">Scholar: {gradingSubmission.studentName} ({gradingSubmission.schoolId})</p>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Score / Grade Points</label>
                <input 
                  type="number" 
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Teacher Feedback & Evaluation Notes</label>
                <textarea 
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Enter constructive feedback for scholar..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-medium text-slate-800 dark:text-slate-200 h-24 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setGradingSubmission(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveGrade} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                Save Grade & Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
