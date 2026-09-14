'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Award, CheckCircle2, RefreshCw, History, Users, Search, AlertCircle, Calendar } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { FormBuilder, type FormFieldDef } from '@/components/ui/FormBuilder';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  code?: string;
  subject?: { name: string };
  academicSection?: { name: string };
  gradeLevel?: { name: string };
}

interface Student {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  photoUrl?: string;
}

interface Enrollment {
  id: number;
  documentId: string;
  student: Student;
  enrollmentStatus: string;
}

interface Memorization {
  id: number;
  documentId: string;
  juzNumber: number;
  surah: string;
  startingAyah: number;
  endingAyah: number;
  pagesCovered: number;
  recordType: 'New' | 'Revision' | 'Correction' | 'Assessment';
  recordStatus: 'Completed' | 'Needs Revision' | 'Partially Memorized';
  teacherNotes: string;
  date: string;
  student?: Student;
}

export default function HifzTrackingWorkspace() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;

  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [memorizations, setMemorizations] = useState<Memorization[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<Student | null>(null);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoadingOfferings(false);
      return;
    }

    const loadOfferings = async () => {
      try {
        const res = await apiClient.get('/course-offerings', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
            populate: ['subject', 'academicSection', 'gradeLevel'],
            pagination: { limit: 100 }
          }
        });
        const items = res.data?.data || [];
        setOfferings(items);

        // Store NUMERIC id — relation filters require integer, not documentId string.
        if (items.length > 0) {
          setSelectedOfferingId(items[0].documentId || String(items[0].id));
        }
      } catch (error) {
        toast.error('Failed to load course offerings');
      } finally {
        setIsLoadingOfferings(false);
      }
    };

    loadOfferings();
  }, [authLoading, teacher?.id]);

  useEffect(() => {
    if (!selectedOfferingId || !teacher?.id) {
        setEnrollments([]);
        setMemorizations([]);
        return;
    }

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [enrollRes, memRes] = await Promise.all([
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
            // memorizations: courseOffering column newly added, needs Strapi restart.
            // Filter by teacher.id and cross-reference enrolled students client-side.
            apiClient.get('/memorizations', {
                params: {
                    filters: { teacher: { id: { $eq: teacher.id } } },
                    populate: ['student'],
                    sort: ['date:desc'],
                    pagination: { limit: 500 }
                }
            })
        ]);

        const allEnrollments: Enrollment[] = enrollRes.data?.data || [];
        const enrolledStudentIds = new Set(allEnrollments.map((e) => e.student?.id).filter(Boolean));
        const allMems = memRes.data?.data || [];
        // Only show memorization records for students enrolled in this offering.
        const filteredMems = allMems.filter(
          (m: any) => m.student && enrolledStudentIds.has(m.student.id)
        );

        setEnrollments(allEnrollments);
        setMemorizations(filteredMems);
      } catch (error) {
        toast.error('Failed to load student data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [selectedOfferingId, teacher?.id]);

  const handleSaveLog = async (formData: any) => {
      if (!teacher?.id || !selectedOfferingId || !selectedStudentForLog) return;

      try {
          const payload = {
              ...formData,
              juzNumber: Number(formData.juzNumber),
              startingAyah: Number(formData.startingAyah),
              endingAyah: Number(formData.endingAyah),
              pagesCovered: Number(formData.pagesCovered),
              student: selectedStudentForLog.id,
              teacher: teacher.id,
              courseOffering: selectedOfferingId
          };

          const res = await apiClient.post('/memorizations', { data: payload });
          toast.success('Hifz progress logged successfully');
          
          // Prepend to list
          const newRecord = {
              ...res.data.data,
              student: selectedStudentForLog
          };
          setMemorizations(prev => [newRecord, ...prev]);
          setIsLogModalOpen(false);
          setSelectedStudentForLog(null);
      } catch (e) {
          toast.error('Failed to log Hifz progress');
      }
  };

  const filteredEnrollments = useMemo(() => {
      if (!searchQuery) return enrollments;
      const lower = searchQuery.toLowerCase();
      return enrollments.filter(e => {
          const name = `${e.student?.firstName} ${e.student?.lastName}`.toLowerCase();
          const adm = (e.student?.admissionNumber || '').toLowerCase();
          return name.includes(lower) || adm.includes(lower);
      });
  }, [enrollments, searchQuery]);

  const studentsWithRecords = useMemo(() => {
      const uniqueStudentIds = new Set(memorizations.map(m => m.student?.id));
      return uniqueStudentIds.size;
  }, [memorizations]);

  const avgPages = useMemo(() => {
      if (memorizations.length === 0) return 0;
      const total = memorizations.reduce((sum, m) => sum + (m.pagesCovered || 0), 0);
      return (total / memorizations.length).toFixed(1);
  }, [memorizations]);

  const studentsNeedingRevision = useMemo(() => {
      const latestMap = new Map<number, Memorization>();
      memorizations.forEach(m => {
          if (m.student?.id) {
              if (!latestMap.has(m.student.id)) {
                  latestMap.set(m.student.id, m);
              }
          }
      });
      return Array.from(latestMap.values()).filter(m => m.recordStatus === 'Needs Revision').length;
  }, [memorizations]);

  if (authLoading || isLoadingOfferings) {
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
        </div>
      </PageContainer>
    );
  }

  const selectedOffering = offerings.find(o => o.id.toString() === selectedOfferingId);

  const formFields: FormFieldDef[] = [
    { name: 'juzNumber', label: 'Juz Number (1-30)', type: 'number', required: true, defaultValue: 1 },
    { name: 'surah', label: 'Surah Name', type: 'text', required: true, placeholder: 'e.g. Al-Baqarah' },
    { name: 'startingAyah', label: 'Starting Ayah', type: 'number', required: true, defaultValue: 1 },
    { name: 'endingAyah', label: 'Ending Ayah', type: 'number', required: true, defaultValue: 10 },
    { name: 'pagesCovered', label: 'Pages Covered', type: 'number', required: true, defaultValue: 1 },
    { 
        name: 'recordType', 
        label: 'Record Type', 
        type: 'select', 
        required: true,
        options: [
            { label: 'New', value: 'New' },
            { label: 'Revision', value: 'Revision' },
            { label: 'Correction', value: 'Correction' },
            { label: 'Assessment', value: 'Assessment' }
        ]
    },
    { 
        name: 'recordStatus', 
        label: 'Record Status', 
        type: 'select', 
        required: true,
        options: [
            { label: 'Completed', value: 'Completed' },
            { label: 'Needs Revision', value: 'Needs Revision' },
            { label: 'Partially Memorized', value: 'Partially Memorized' }
        ]
    },
    { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
    { name: 'teacherNotes', label: 'Teacher Notes', type: 'textarea' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Hifz Tracking Workspace"
        description="Log student memorization progress, track Juz completion, and evaluate recitation."
      >
        <div className="flex items-center gap-2">
            <select
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 min-w-[200px]"
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
            >
                {offerings.map(offering => (
                    <option key={offering.id} value={offering.id.toString()}>
                        {offering.name || offering.subject?.name || offering.code} - {offering.academicSection?.name} ({offering.gradeLevel?.name})
                    </option>
                ))}
            </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Enrolled Students</p>
                <p className="text-xl font-bold">{enrollments.length}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Students w/ Records</p>
                <p className="text-xl font-bold">{studentsWithRecords}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400">
                <BookOpen className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Avg Pages</p>
                <p className="text-xl font-bold">{avgPages}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Needs Revision</p>
                <p className="text-xl font-bold">{studentsNeedingRevision}</p>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {isLoadingData ? (
        <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      ) : filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Students Enrolled</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            No active students found for this course offering.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Current Juz</th>
                            <th className="px-4 py-3">Surah / Ayah</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredEnrollments.map(enrollment => {
                            const student = enrollment.student;
                            const studentRecords = memorizations.filter(m => m.student?.id === student.id);
                            const latestRecord = studentRecords[0];

                            // Calculate max juz for progress bar
                            const maxJuz = studentRecords.reduce((max, m) => Math.max(max, m.juzNumber || 0), 0);

                            return (
                                <tr key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {student.firstName[0]}{student.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {latestRecord ? (
                                            <div>
                                                <span className="font-bold">Juz {latestRecord.juzNumber}</span>
                                                <div className="w-full max-w-[100px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(maxJuz / 30) * 100}%` }} />
                                                </div>
                                            </div>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {latestRecord ? (
                                            <div>
                                                <p className="font-medium">{latestRecord.surah}</p>
                                                <p className="text-xs text-slate-500">Ayah {latestRecord.startingAyah} - {latestRecord.endingAyah}</p>
                                            </div>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {latestRecord ? (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {latestRecord.recordType}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {latestRecord ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                                latestRecord.recordStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                latestRecord.recordStatus === 'Needs Revision' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {latestRecord.recordStatus}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {latestRecord?.date ? new Date(latestRecord.date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedStudentForLog(student); setIsLogModalOpen(true); }}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5 inline mr-1" /> Log
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedStudentForHistory(student); setIsHistoryDrawerOpen(true); }}
                                                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                                            >
                                                <History className="w-3.5 h-3.5 inline" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Log Modal */}
      {isLogModalOpen && selectedStudentForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Log Hifz Progress
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Recording progress for <span className="font-semibold text-foreground">{selectedStudentForLog.firstName} {selectedStudentForLog.lastName}</span>
            </p>
            <FormBuilder
              fields={formFields}
              initialValues={{ 
                  recordType: 'New', 
                  recordStatus: 'Completed',
                  date: new Date().toISOString().split('T')[0]
              }}
              onSubmit={handleSaveLog}
              submitLabel="Save Hifz Record"
            />
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {isHistoryDrawerOpen && selectedStudentForHistory && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Hifz History</h3>
                    <p className="text-xs text-muted-foreground">{selectedStudentForHistory.firstName} {selectedStudentForHistory.lastName}</p>
                </div>
                <button
                    onClick={() => setIsHistoryDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                    ✕
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {memorizations.filter(m => m.student?.id === selectedStudentForHistory.id).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <History className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No records found for this student.</p>
                    </div>
                ) : (
                    memorizations.filter(m => m.student?.id === selectedStudentForHistory.id).map((record, index) => (
                        <div key={record.id} className="relative pl-6 pb-6 border-l-2 border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-100 border-2 border-white dark:border-slate-900 dark:bg-indigo-900 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold text-sm">Juz {record.juzNumber} - {record.surah}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                        Ayah {record.startingAyah}-{record.endingAyah} ({record.pagesCovered} pages)
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                        record.recordStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        record.recordStatus === 'Needs Revision' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {record.recordStatus}
                                    </span>
                                </div>
                                {record.teacherNotes && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                        {record.teacherNotes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </PageContainer>
  );
}
