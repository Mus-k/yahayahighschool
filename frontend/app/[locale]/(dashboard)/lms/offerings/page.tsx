/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, Search, Plus, Users, School, Trash2, Edit2, Eye, X, 
  Check, BookOpen, Calendar, ArrowRight, UserPlus, UserMinus, ToggleLeft
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OfferingData {
  id: number;
  documentId?: string;
  capacity: number;
  deliveryMode: 'in-person' | 'online' | 'hybrid';
  offeringStatus: 'ACTIVE' | 'DRAFT' | 'CANCELLED';
  academicSection?: { id: number; documentId?: string; name: string; code: string; color?: string };
  gradeLevel?: { id: number; documentId?: string; name: string; code: string };
  subject?: { id: number; documentId?: string; name: string; code: string };
  teacher?: { id: number; documentId?: string; firstName: string; lastName: string; displayName?: string; name?: string; schoolId?: string };
  studentEnrollments?: Array<{
    id: number;
    documentId?: string;
    enrollmentStatus: string;
    student?: { id: number; firstName: string; lastName: string; schoolId?: string; admissionNumber?: string };
  }>;
  room?: { id: number; documentId?: string; name: string; code: string };
  academicYear?: { id: number; documentId?: string; name: string; code: string };
  academicTerm?: { id: number; documentId?: string; name: string; code: string };
  schedule?: any;
}

export default function CourseOfferingsPage() {
  const [offerings, setOfferings] = useState<OfferingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('All');

  // Metadata dropdowns
  const [sections, setSections] = useState<any[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);

  // Modals & Panels state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<OfferingData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formSectionId, setFormSectionId] = useState<string | number>('');
  const [formGradeLevelId, setFormGradeLevelId] = useState<string | number>('');
  const [formSubjectId, setFormSubjectId] = useState<string | number>('');
  const [formTeacherId, setFormTeacherId] = useState<string | number>('');
  const [formCapacity, setFormCapacity] = useState('35');
  const [formDeliveryMode, setFormDeliveryMode] = useState<'in-person' | 'online' | 'hybrid'>('in-person');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'DRAFT' | 'CANCELLED'>('ACTIVE');
  const [formRoomId, setFormRoomId] = useState<string | number>('');
  const [formAcademicYearId, setFormAcademicYearId] = useState<string | number>('');
  const [formAcademicTermId, setFormAcademicTermId] = useState<string | number>('');
  const [formSchedule, setFormSchedule] = useState<any>(null);

  // Enrollment panel fields
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [enrollingStudentId, setEnrollingStudentId] = useState<string | number>('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    loadOfferings();
    loadMetadata();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/course-offerings', {
        params: {
          populate: ['academicSection', 'gradeLevel', 'subject', 'teacher', 'studentEnrollments.student', 'room', 'academicYear', 'academicTerm'],
          'pagination[limit]': 200
        }
      });
      setOfferings(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load Course Offerings.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [secRes, gradeRes, subjRes, teachRes, studRes, roomRes, yearRes, termRes] = await Promise.all([
        apiClient.get('/sections?pagination[limit]=100'),
        apiClient.get('/grade-levels?pagination[limit]=100'),
        apiClient.get('/subjects?pagination[limit]=200'),
        apiClient.get('/teachers?pagination[limit]=300'),
        apiClient.get('/students?pagination[limit]=500'),
        apiClient.get('/classrooms?pagination[limit]=100'),
        apiClient.get('/academic-years?pagination[limit]=100'),
        apiClient.get('/academic-terms?pagination[limit]=100')
      ]);

      setSections(secRes.data?.data || []);
      setGradeLevels(gradeRes.data?.data || []);
      setSubjects(subjRes.data?.data || []);
      setTeachers(teachRes.data?.data || []);
      setStudents(studRes.data?.data || []);
      setRooms(roomRes.data?.data || []);
      setAcademicYears(yearRes.data?.data || []);
      setAcademicTerms(termRes.data?.data || []);
    } catch (err) {
      console.warn('Failed to load metadata options');
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedOffering(null);
    setFormSectionId('');
    setFormGradeLevelId('');
    setFormSubjectId('');
    setFormTeacherId('');
    setFormCapacity('35');
    setFormDeliveryMode('in-person');
    setFormStatus('ACTIVE');
    setFormRoomId('');
    setFormAcademicYearId('');
    setFormAcademicTermId('');
    setFormSchedule(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (off: OfferingData & { room?: any; academicYear?: any; academicTerm?: any; schedule?: any }) => {
    setIsEditing(true);
    setSelectedOffering(off);
    setFormSectionId(off.academicSection?.documentId || off.academicSection?.id || '');
    setFormGradeLevelId(off.gradeLevel?.documentId || off.gradeLevel?.id || '');
    setFormSubjectId(off.subject?.documentId || off.subject?.id || '');
    setFormTeacherId(off.teacher?.documentId || off.teacher?.id || '');
    setFormCapacity(String(off.capacity || 35));
    setFormDeliveryMode(off.deliveryMode || 'in-person');
    setFormStatus(off.offeringStatus || 'ACTIVE');
    setFormRoomId(off.room?.documentId || off.room?.id || '');
    setFormAcademicYearId(off.academicYear?.documentId || off.academicYear?.id || '');
    setFormAcademicTermId(off.academicTerm?.documentId || off.academicTerm?.id || '');
    setFormSchedule(off.schedule || null);
    setShowFormModal(true);
  };

  const handleOpenConsole = (off: OfferingData) => {
    setSelectedOffering(off);
    setSearchStudentQuery('');
    setEnrollingStudentId('');
    setShowConsoleModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSectionId || !formGradeLevelId || !formSubjectId) {
      toast.error('Academic Section, Grade Level, and Subject are required.');
      return;
    }

    setIsSaving(true);
    try {
      const subjectName = subjects.find(s => s.documentId === formSubjectId || s.id === Number(formSubjectId))?.name || '';
      const sectionName = sections.find(s => s.documentId === formSectionId || s.id === Number(formSectionId))?.name || '';
      const yearName = academicYears.find(y => y.documentId === formAcademicYearId || y.id === Number(formAcademicYearId))?.name || '';
      const offeringName = `${subjectName} - ${sectionName} (${yearName})`.trim();

      const payload = {
        data: {
          name: offeringName,
          academicSection: formSectionId || null,
          gradeLevel: formGradeLevelId || null,
          subject: formSubjectId || null,
          teacher: formTeacherId || null,
          room: formRoomId || null,
          academicYear: formAcademicYearId || null,
          academicTerm: formAcademicTermId || null,
          capacity: parseInt(formCapacity) || 35,
          deliveryMode: formDeliveryMode,
          offeringStatus: formStatus,
          schedule: formSchedule || null,
          publishedAt: new Date()
        }
      };

      if (isEditing && selectedOffering) {
        await apiClient.put(`/course-offerings/${selectedOffering.documentId || selectedOffering.id}`, payload);
        toast.success('Course Offering updated.');
      } else {
        await apiClient.post('/course-offerings', payload);
        toast.success('New Course Offering scheduled.');
      }

      setShowFormModal(false);
      loadOfferings();
    } catch (err) {
      toast.error('Failed to save Course Offering.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (off: OfferingData) => {
    if (!confirm('Are you sure you want to delete this Course Offering? All enrollments will be deleted.')) return;
    try {
      await apiClient.delete(`/course-offerings/${off.documentId || off.id}`);
      toast.success('Course Offering deleted.');
      loadOfferings();
    } catch (err) {
      toast.error('Failed to delete Course Offering.');
    }
  };

  // Student Enrollment management
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !enrollingStudentId) return;

    setIsEnrolling(true);
    try {
      await apiClient.post('/student-enrollments', {
        data: {
          student: enrollingStudentId,
          courseOffering: selectedOffering.documentId || selectedOffering.id,
          enrollmentDate: new Date(),
          enrollmentStatus: 'active',
          gradeStatus: 'pending',
          publishedAt: new Date()
        }
      });
      toast.success('Student enrolled successfully.');
      setEnrollingStudentId('');
      
      // Reload this offering's detail
      const res = await apiClient.get(`/course-offerings/${selectedOffering.documentId || selectedOffering.id}`, {
        params: { populate: ['academicSection', 'gradeLevel', 'subject', 'teacher', 'studentEnrollments.student', 'room', 'academicYear', 'academicTerm'] }
      });
      const updated = res.data?.data;
      if (updated) {
        setSelectedOffering(updated);
        setOfferings(prev => prev.map(o => o.id === updated.id ? updated : o));
      }
    } catch (err) {
      toast.error('Student is already enrolled or failed to enroll.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDropStudent = async (enrollmentId: number) => {
    if (!confirm('Are you sure you want to drop this student from the course offering?')) return;
    try {
      await apiClient.delete(`/student-enrollments/${enrollmentId}`);
      toast.success('Student dropped successfully.');
      
      // Reload this offering's detail
      if (selectedOffering) {
        const res = await apiClient.get(`/course-offerings/${selectedOffering.documentId || selectedOffering.id}`, {
          params: { populate: ['academicSection', 'gradeLevel', 'subject', 'teacher', 'studentEnrollments.student', 'room', 'academicYear', 'academicTerm'] }
        });
        const updated = res.data?.data;
        if (updated) {
          setSelectedOffering(updated);
          setOfferings(prev => prev.map(o => o.id === updated.id ? updated : o));
        }
      }
    } catch (err) {
      toast.error('Failed to drop student.');
    }
  };

  // Filter calculations
  const filteredOfferings = useMemo(() => {
    return offerings.filter(o => {
      const matchQuery = 
        o.subject?.name?.toLowerCase().includes(query.toLowerCase()) ||
        o.subject?.code?.toLowerCase().includes(query.toLowerCase()) ||
        o.teacher?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        o.teacher?.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        o.gradeLevel?.name?.toLowerCase().includes(query.toLowerCase());

      const matchSection = 
        selectedSectionFilter === 'All' || 
        o.academicSection?.name === selectedSectionFilter;

      return matchQuery && matchSection;
    });
  }, [offerings, query, selectedSectionFilter]);

  const stats = useMemo(() => {
    const total = offerings.length;
    const active = offerings.filter(o => o.offeringStatus === 'ACTIVE').length;
    const totalEnrolled = offerings.reduce((sum, o) => sum + (o.studentEnrollments?.length || 0), 0);
    const avgClassSize = total > 0 ? (totalEnrolled / total).toFixed(1) : '0';

    return { total, active, avgClassSize };
  }, [offerings]);

  // List of active students not yet enrolled in the selected offering
  const availableStudentsToEnroll = useMemo(() => {
    if (!selectedOffering) return [];
    const enrolledIds = (selectedOffering.studentEnrollments || []).map(e => e.student?.id);
    return students.filter(s => {
      const isNotEnrolled = !enrolledIds.includes(s.id);
      const matchSearch = 
        s.firstName?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        s.schoolId?.toLowerCase().includes(searchStudentQuery.toLowerCase());
      return isNotEnrolled && matchSearch;
    });
  }, [students, selectedOffering, searchStudentQuery]);

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in text-xs">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              <span>Course Offerings & Enrollment Console</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Schedule curriculum course units, assign teachers to cohorts, and manage student enrollments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Offering</span>
            </button>
          </div>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled Offerings</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total} units</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><GraduationCap className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Offerings</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.active} live</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><School className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Class Size</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.avgClassSize} students</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Users className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search offerings by subject, teacher, grade..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Filter Section:</span>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="All">All Academic Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Offerings Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            Loading Offerings...
          </div>
        ) : filteredOfferings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
            No Course Offerings scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfferings.map(off => {
              const enrolledCount = off.studentEnrollments?.length || 0;
              const isFull = enrolledCount >= off.capacity;
              const teacherName = off.teacher 
                ? off.teacher.displayName || off.teacher.name || `${off.teacher.firstName || ''} ${off.teacher.lastName || ''}`.trim() || 'Teacher'
                : 'Unassigned';

              return (
                <div 
                  key={off.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header tags */}
                    <div className="flex items-center justify-between">
                      <span 
                        className="px-2 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow-xs"
                        style={{ backgroundColor: off.academicSection?.color || '#4f46e5' }}
                      >
                        {off.academicSection?.code || 'GEN'}
                      </span>
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {off.gradeLevel?.name || 'All grades'}
                      </span>
                    </div>

                    {/* Subject title */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-905 dark:text-white line-clamp-1">{off.subject?.name || 'General studies'}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{off.subject?.code}</p>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Meta info */}
                    <div className="space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-350">
                      <div className="flex justify-between">
                        <span>Teacher:</span>
                        <strong className="text-slate-900 dark:text-white">{teacherName}</strong>
                      </div>
                      {off.room && (
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <strong className="text-slate-900 dark:text-white">{off.room.name} ({off.room.code})</strong>
                        </div>
                      )}
                      {off.academicYear && (
                        <div className="flex justify-between">
                          <span>Academic Cycle:</span>
                          <strong className="text-slate-900 dark:text-white">{off.academicTerm?.name || 'Full Term'} ({off.academicYear.name})</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <strong className="text-slate-900 dark:text-white capitalize">{off.deliveryMode}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Enrollment:</span>
                        <strong className={cn(
                          "font-mono text-xs font-black",
                          isFull ? "text-amber-600 dark:text-amber-450" : "text-emerald-600 dark:text-emerald-450"
                        )}>
                          {enrolledCount} / {off.capacity} seats
                        </strong>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isFull ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min((enrolledCount / off.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenConsole(off)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold border-none cursor-pointer flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Console</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(off)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-505/10 transition-colors border-none bg-transparent cursor-pointer"
                        title="Edit Offering"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(off)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-505/10 transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete Offering"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CREATE / EDIT OFFERING MODAL ──────────────────────────────── */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white animate-slide-up">
              <button
                onClick={() => setShowFormModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <span>{isEditing ? 'Modify Scheduled Course Offering' : 'Schedule Course Offering'}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Section *</label>
                    <select
                      value={formSectionId}
                      required
                      onChange={(e) => setFormSectionId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select division...</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.documentId}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Grade Level *</label>
                    <select
                      value={formGradeLevelId}
                      required
                      onChange={(e) => setFormGradeLevelId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Grade...</option>
                      {gradeLevels.map(g => (
                        <option key={g.id} value={g.documentId}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Subject *</label>
                    <select
                      value={formSubjectId}
                      required
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.documentId}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Assigned Teacher</label>
                    <select
                      value={formTeacherId}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Instructor...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.documentId}>{t.displayName || t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Teacher #${t.id}`}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Year *</label>
                    <select
                      value={formAcademicYearId}
                      required
                      onChange={(e) => setFormAcademicYearId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Year...</option>
                      {academicYears.map(y => (
                        <option key={y.id} value={y.documentId}>{y.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Term *</label>
                    <select
                      value={formAcademicTermId}
                      required
                      onChange={(e) => setFormAcademicTermId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Term...</option>
                      {academicTerms.map(t => (
                        <option key={t.id} value={t.documentId}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Room / Classroom</label>
                    <select
                      value={formRoomId}
                      onChange={(e) => setFormRoomId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Room...</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.documentId}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Class Seat Capacity</label>
                    <input
                      type="number"
                      required
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Delivery Mode</label>
                    <select
                      value={formDeliveryMode}
                      onChange={(e) => setFormDeliveryMode(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="in-person">In-person</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Offering Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-905 dark:text-white focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                  >
                    {isSaving && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Scheduling...' : 'Schedule Course'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── STUDENT ENROLLMENT CONSOLE Drawer/Modal ────────────────────── */}
        {showConsoleModal && selectedOffering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white animate-slide-up flex flex-col max-h-[85vh]">
              <button
                onClick={() => setShowConsoleModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[9px] font-black text-white px-2 py-0.5 rounded" style={{ backgroundColor: selectedOffering.academicSection?.color || '#4f46e5' }}>
                    {selectedOffering.academicSection?.code}
                  </span>
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50">
                    {selectedOffering.gradeLevel?.name}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{selectedOffering.subject?.name}</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Instructor: {selectedOffering.teacher ? (selectedOffering.teacher.displayName || selectedOffering.teacher.name || `${selectedOffering.teacher.firstName || ''} ${selectedOffering.teacher.lastName || ''}`.trim() || 'Teacher') : 'Unassigned'} | Class Seat Limit: {selectedOffering.capacity}
                </p>
              </div>

              {/* Console Body */}
              <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                {/* Enrolled Students Roster */}
                <div className="flex flex-col h-full min-h-0 border-r border-slate-150 dark:border-slate-800/80 pr-4">
                  <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-3 font-mono flex items-center justify-between">
                    <span>Enrolled Roster</span>
                    <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full font-bold">
                      {selectedOffering.studentEnrollments?.length || 0} Students
                    </span>
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-2">
                    {(!selectedOffering.studentEnrollments || selectedOffering.studentEnrollments.length === 0) ? (
                      <p className="text-slate-400 italic py-6 text-center">No students currently enrolled in this offering.</p>
                    ) : (
                      selectedOffering.studentEnrollments.map(enr => {
                        const s = enr.student;
                        if (!s) return null;
                        return (
                          <div 
                            key={enr.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800/70"
                          >
                            <div>
                              <strong className="text-slate-900 dark:text-white block font-bold">{s.firstName} {s.lastName}</strong>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">SIS Code: {s.schoolId || 'N/A'}</span>
                            </div>
                            <button
                              onClick={() => handleDropStudent(enr.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border-none bg-transparent"
                              title="Drop student"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Add Student Console */}
                <div className="flex flex-col h-full min-h-0">
                  <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-3 font-mono">Quick Enroll Student</h3>
                  
                  <form onSubmit={handleEnrollStudent} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search directory to enroll..."
                          value={searchStudentQuery}
                          onChange={(e) => setSearchStudentQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-905 dark:text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block">Select Student</label>
                        <select
                          required
                          value={enrollingStudentId}
                          onChange={(e) => setEnrollingStudentId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px] font-medium"
                        >
                          <option value="">Choose student...</option>
                           {availableStudentsToEnroll.map(s => (
                             <option key={s.id} value={s.documentId}>
                               {s.firstName} {s.lastName} ({s.schoolId || `ID: ${s.id}`})
                             </option>
                           ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Listing up to 50 active unenrolled matching students.</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isEnrolling || !enrollingStudentId}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center justify-center gap-1.5 mt-4"
                    >
                      {isEnrolling ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>Enroll selected student</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-end mt-4">
                <button
                  onClick={() => setShowConsoleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs cursor-pointer border-none"
                >
                  Close Console
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
