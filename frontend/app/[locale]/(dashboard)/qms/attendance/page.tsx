'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check, Clock, Save, UserCheck, UserMinus, UserX } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CourseOffering {
  id: string | number;
  documentId: string;
  name: string;
  academicYear: any;
  academicTerm: any;
}

interface Student {
  id: string | number;
  documentId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

interface AttendanceRecord {
  id?: string | number;
  documentId?: string;
  date: string;
  recordStatus: 'Present' | 'Absent' | 'Late' | 'Excused';
  comments?: string;
  arrivalTime?: string;
  student: Student;
  courseOffering?: any;
  isDirty?: boolean;
}

export default function AttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    loadInitialData();
  }, [authLoading, teacher?.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Load teacher's Quran offerings
      const offeringsRes = await apiClient.get('/course-offerings', {
        params: {
          filters: { 
            teacher: { id: { $eq: teacher.id } }, 
            offeringStatus: { $eq: 'ACTIVE' } 
          },
          populate: ['academicYear', 'academicTerm', 'subject'],
          pagination: { limit: 100 }
        }
      });
      const fetchedOfferings = offeringsRes.data?.data || [];
      setOfferings(fetchedOfferings);
      if (fetchedOfferings.length > 0) {
        setSelectedOfferingId(fetchedOfferings[0].documentId);
      }
    } catch (error) {
      toast.error('Failed to load course offerings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedOfferingId || !selectedDate) return;
    
    try {
      setIsLoading(true);
      
      // 1. Get enrolled students
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
      
      const enrolledStudents = (enrollmentsRes.data?.data || [])
        .map((e: any) => e.student)
        .filter(Boolean);
        
      setStudents(enrolledStudents);

      // 2. Get existing attendance records
      const attendanceRes = await apiClient.get('/attendance-records', {
        params: {
          filters: { 
            courseOffering: { documentId: { $eq: selectedOfferingId } },
            date: { $eq: selectedDate }
          },
          populate: ['student'],
          pagination: { limit: 200 }
        }
      });

      // 3. Merge into state
      const recordsMap: Record<string, AttendanceRecord> = {};
      
      // Pre-fill default "Present" for students with no record
      enrolledStudents.forEach((student: Student) => {
        recordsMap[student.documentId] = {
          date: selectedDate,
          recordStatus: 'Present',
          student: student,
          isDirty: false
        };
      });

      // Override with existing records
      (attendanceRes.data?.data || []).forEach((record: any) => {
        if (record.student?.documentId) {
          recordsMap[record.student.documentId] = {
            id: record.id,
            documentId: record.documentId,
            date: record.date,
            recordStatus: record.recordStatus,
            comments: record.comments || '',
            arrivalTime: record.arrivalTime || '',
            student: record.student,
            isDirty: false
          };
        }
      });

      setAttendanceRecords(recordsMap);

    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && teacher?.id && selectedOfferingId) {
      loadAttendanceData();
    }
  }, [selectedOfferingId, selectedDate]);

  const updateRecord = (studentId: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        ...updates,
        isDirty: true
      }
    }));
  };

  const handleBulkAction = (status: 'Present' | 'Absent') => {
    const newRecords = { ...attendanceRecords };
    Object.keys(newRecords).forEach(studentId => {
      if (newRecords[studentId].recordStatus !== status) {
        newRecords[studentId] = {
          ...newRecords[studentId],
          recordStatus: status,
          isDirty: true
        };
      }
    });
    setAttendanceRecords(newRecords);
  };

  const saveAllAttendance = async () => {
    const selectedOffering = offerings.find(o => o.documentId === selectedOfferingId);
    if (!selectedOffering) return;

    const dirtyRecords = Object.values(attendanceRecords).filter(r => r.isDirty);
    
    if (dirtyRecords.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setIsSaving(true);
      
      const promises = dirtyRecords.map(record => {
        const payload = {
          data: {
            date: selectedDate,
            recordStatus: record.recordStatus,
            comments: record.comments,
            arrivalTime: record.arrivalTime,
            student: record.student.documentId,
            teacher: teacher.documentId,
            courseOffering: selectedOfferingId,
            academicYear: selectedOffering.academicYear?.documentId,
            academicTerm: selectedOffering.academicTerm?.documentId
          }
        };

        if (record.documentId) {
          return apiClient.put(`/attendance-records/${record.documentId}`, payload);
        } else {
          return apiClient.post('/attendance-records', payload);
        }
      });

      await Promise.all(promises);
      toast.success('Attendance saved successfully');
      
      // Reload to get fresh IDs
      await loadAttendanceData();
      
    } catch (error) {
      toast.error('Failed to save attendance');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (isLoading && !offerings.length)) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!teacher?.id || offerings.length === 0) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
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

  const recordsArray = Object.values(attendanceRecords);
  const presentCount = recordsArray.filter(r => r.recordStatus === 'Present').length;
  const absentCount = recordsArray.filter(r => r.recordStatus === 'Absent').length;
  const lateCount = recordsArray.filter(r => r.recordStatus === 'Late').length;
  const excusedCount = recordsArray.filter(r => r.recordStatus === 'Excused').length;
  const totalStudents = students.length;
  const attendanceRate = totalStudents ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;
  
  const hasUnsavedChanges = recordsArray.some(r => r.isDirty);

  return (
    <PageContainer>
      <PageHeader 
        title="Quran Attendance Workspace" 
        description="Record and manage daily attendance for your Quran sessions"
      />

      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex-1 sm:w-64">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Course Offering</label>
            <select 
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
            >
              {offerings.map(o => (
                <option key={o.documentId} value={o.documentId}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 sm:w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <input 
              type="date"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={saveAllAttendance}
            disabled={!hasUnsavedChanges || isSaving}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${hasUnsavedChanges 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
              }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{attendanceRate}%</span>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Present</span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{presentCount}</span>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">Absent</span>
          <span className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">{absentCount}</span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">Late</span>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{lateCount}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Excused</span>
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{excusedCount}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Bulk actions strip */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400" />
            Class Roster ({totalStudents})
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkAction('Present')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-colors"
            >
              Mark All Present
            </button>
            <button 
              onClick={() => handleBulkAction('Absent')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Sheet */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading attendance sheet...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active students enrolled in this offering.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Details / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map(student => {
                  const record = attendanceRecords[student.documentId];
                  if (!record) return null;
                  
                  return (
                    <tr key={student.documentId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${record.isDirty ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {student.firstName} {student.lastName}
                              {record.isDirty && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes"></span>}
                            </p>
                            <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-max">
                          <button
                            onClick={() => updateRecord(student.documentId, { recordStatus: 'Present' })}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              record.recordStatus === 'Present' 
                                ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => updateRecord(student.documentId, { recordStatus: 'Absent' })}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              record.recordStatus === 'Absent' 
                                ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => updateRecord(student.documentId, { recordStatus: 'Late' })}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              record.recordStatus === 'Late' 
                                ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => updateRecord(student.documentId, { recordStatus: 'Excused' })}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              record.recordStatus === 'Excused' 
                                ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          {record.recordStatus === 'Late' && (
                            <input 
                              type="time" 
                              className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-900"
                              value={record.arrivalTime || ''}
                              onChange={(e) => updateRecord(student.documentId, { arrivalTime: e.target.value })}
                              placeholder="Arrival"
                            />
                          )}
                          {(record.recordStatus !== 'Present') && (
                            <input 
                              type="text" 
                              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-900"
                              value={record.comments || ''}
                              onChange={(e) => updateRecord(student.documentId, { comments: e.target.value })}
                              placeholder="Add remarks..."
                            />
                          )}
                          {record.recordStatus === 'Present' && record.comments && (
                            <span className="text-xs text-slate-500 truncate max-w-[200px]" title={record.comments}>
                              {record.comments}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
