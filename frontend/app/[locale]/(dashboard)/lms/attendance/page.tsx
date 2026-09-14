/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Calendar, RefreshCw, Save, HelpCircle, Users, Award, ShieldAlert } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: number | string;
  studentId: string | number;
  studentName: string;
  admissionNumber: string;
  section: string;
  date: string;
  status: 'Present' | 'Absent' | 'Excused' | 'Late';
  remarks?: string;
  hasExcuse?: boolean;
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Teacher/Admin States (Using Course Offerings)
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | number>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPublished, setIsPublished] = useState(false);
  const [activeYearId, setActiveYearId] = useState<number | string>('');
  const [activeTermId, setActiveTermId] = useState<number | string>('');

  // Parent States
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | number>('');

  const { user } = useAuth();
  const { userRole } = usePermissions();

  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';
  const isStaff = userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher';
  const canModify = isStaff;

  const loadInitialOptions = async () => {
    setIsLoading(true);
    try {
      if (isStudent) {
        const studentProfileId = user?.profile?.id;
        if (studentProfileId) {
          await loadStudentAttendance(studentProfileId);
        }
      } else if (isParent) {
        const parentProfileId = user?.profile?.id;
        if (parentProfileId) {
          const res = await apiClient.get('/students', {
            params: {
              'filters[parents][id][$eq]': parentProfileId,
              'pagination[limit]': 20
            }
          });
          const kids = res.data?.data || [];
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0].id);
            await loadStudentAttendance(kids[0].id);
          }
        }
      } else {
        // Teacher/Admin load
        const [yearsRes, termsRes, offeringsRes] = await Promise.all([
          apiClient.get('/academic-years', { params: { 'pagination[limit]': 100 } }),
          apiClient.get('/academic-terms', { params: { 'pagination[limit]': 100 } }),
          apiClient.get('/course-offerings', {
            params: {
              'populate': ['subject', 'teacher', 'gradeLevel', 'academicSection'],
              'pagination[limit]': 250
            }
          })
        ]);

        const allYears = yearsRes.data?.data || [];
        const allTerms = termsRes.data?.data || [];
        const allOfferings = offeringsRes.data?.data || [];

        setOfferings(allOfferings);

        if (allYears.length > 0) setActiveYearId(allYears[0].id);
        if (allTerms.length > 0) setActiveTermId(allTerms[0].id);

        const teacherProfileId = user?.profile?.id;
        if (userRole === 'teacher' && teacherProfileId) {
          const teacherOfferings = allOfferings.filter((o: any) => 
            o.teacher?.id === teacherProfileId
          );
          if (teacherOfferings.length > 0) {
            setSelectedOfferingId(teacherOfferings[0].id);
          } else if (allOfferings.length > 0) {
            setSelectedOfferingId(allOfferings[0].id);
          }
        } else {
          if (allOfferings.length > 0) setSelectedOfferingId(allOfferings[0].id);
        }
      }
    } catch (e) {
      toast.error('Failed to load portal configuration.');
    } finally {
      if (isStudent || (isParent && children.length === 0)) {
        setIsLoading(false);
      }
    }
  };

  const loadStudentAttendance = async (studentId: string | number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/attendance-records', {
        params: {
          'filters[student][id][$eq]': studentId,
          'populate': ['courseOffering', 'courseOffering.subject'],
          'pagination[limit]': 100,
          'sort': 'date:desc'
        }
      });
      const items = res.data?.data || [];
      setData(
        items.map((item: any) => ({
          id: item.id,
          studentId: studentId,
          studentName: '',
          admissionNumber: '',
          section: item.courseOffering?.subject?.name || 'Class',
          date: item.date,
          status: item.recordStatus || 'Present',
          remarks: item.comments || ''
        }))
      );
    } catch (e) {
      toast.error('Failed to load attendance logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedOfferingId || isStudent || isParent) return;
    setIsLoading(true);
    setIsPublished(false);
    try {
      // 1. Fetch submitted excuse logs for the selected date
      const excuseLogsRes = await apiClient.get('/audit-logs', {
        params: {
          'filters[action][$eq]': 'Attendance Excuse Filed',
          'filters[description][$contains]': selectedDate,
          'populate': 'performedBy',
          'pagination[limit]': 100
        }
      });
      const excuses = excuseLogsRes.data?.data || [];

      // 2. Fetch existing daily records
      const res = await apiClient.get('/attendance-records', {
        params: {
          'filters[date][$eq]': selectedDate,
          'filters[courseOffering][id][$eq]': selectedOfferingId,
          'populate': ['student', 'student.user', 'courseOffering', 'courseOffering.subject'],
          'pagination[limit]': 100
        }
      });
      
      const items = res.data?.data || [];
      if (items.length > 0) {
        setData(
          items.map((item: any) => {
            const studentUserId = item.student?.user?.id;
            const matchExcuse = excuses.find((exc: any) => exc.performedBy?.id === studentUserId);
            return {
              id: item.id,
              studentId: item.student?.id || 0,
              studentName: [item.student?.firstName, item.student?.lastName].filter(Boolean).join(' ') || item.studentName || 'Student Profile',
              admissionNumber: item.student?.admissionNumber || 'N/A',
              section: item.courseOffering?.subject?.name || 'Class Offering',
              date: item.date || selectedDate,
              status: item.recordStatus || 'Present',
              remarks: item.comments || '',
              hasExcuse: !!matchExcuse
            };
          })
        );
        setIsPublished(true);
      } else {
        // 3. Query students enrolled in the Course Offering
        const enrollmentsRes = await apiClient.get('/student-enrollments', {
          params: {
            'filters[courseOffering][id][$eq]': selectedOfferingId,
            'filters[enrollmentStatus][$eq]': 'active',
            'populate': ['student', 'student.user'],
            'pagination[limit]': 100
          }
        });
        const enrollments = enrollmentsRes.data?.data || [];
        const currentOfferingName = offerings.find(o => o.id === selectedOfferingId)?.subject?.name || 'Class Offering';
 
        if (enrollments.length > 0) {
          setData(
            enrollments.map((enr: any) => {
              const st = enr.student;
              const studentUserId = st?.user?.id;
              const matchExcuse = excuses.find((exc: any) => exc.performedBy?.id === studentUserId);
              
              let excuseRemarks = '';
              if (matchExcuse) {
                const descStr = matchExcuse.description || '';
                const parts = descStr.split(': ');
                excuseRemarks = parts[1] ? `Excuse Filed: ${parts[1]}` : 'Excuse Slip Filed';
              }

              return {
                id: `TEMP-${st.id}`,
                studentId: st.id,
                studentName: [st.firstName, st.lastName].filter(Boolean).join(' ') || 'Student Scholar',
                admissionNumber: st.admissionNumber || 'N/A',
                section: currentOfferingName,
                date: selectedDate,
                status: matchExcuse ? 'Excused' : 'Present',
                remarks: excuseRemarks || '',
                hasExcuse: !!matchExcuse
              };
            })
          );
        } else {
          setData([]);
        }
      }
    } catch (e) {
      toast.error('Failed to query daily attendance registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialOptions();
  }, [user]);

  useEffect(() => {
    if (selectedOfferingId) {
      loadAttendance();
    }
  }, [selectedOfferingId, selectedDate]);

  useEffect(() => {
    if (selectedChildId && isParent) {
      loadStudentAttendance(selectedChildId);
    }
  }, [selectedChildId]);

  const toggleStatus = (id: number | string, newStatus: AttendanceRecord['status']) => {
    if (!canModify) return;
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleRemarksChange = (id: string | number, text: string) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks: text } : item))
    );
  };

  const handleMarkAll = (status: AttendanceRecord['status']) => {
    if (!canModify) return;
    setData((prev) => prev.map((item) => ({ ...item, status })));
    toast.success(`Marked all scholars as ${status}`);
  };

  const handlePublishAttendance = async () => {
    if (data.length === 0) return;
    setIsSaving(true);
    try {
      toast.info(`Publishing & locking daily attendance records...`);
      const teacherProfileId = user?.profile?.id || null;

      for (const record of data) {
        const payload = {
          data: {
            date: selectedDate,
            recordStatus: record.status,
            comments: record.remarks,
            student: record.studentId,
            courseOffering: selectedOfferingId,
            teacher: teacherProfileId,
            academicYear: activeYearId || null,
            academicTerm: activeTermId || null
          }
        };

        if (typeof record.id === 'string' && record.id.startsWith('TEMP-')) {
          await apiClient.post('/attendance-records', payload);
        } else {
          await apiClient.put(`/attendance-records/${record.id}`, payload);
        }
      }

      toast.success('Attendance records saved successfully');
      loadAttendance();
    } catch (e) {
      toast.error('Failed to save attendance records');
    } finally {
      setIsSaving(false);
    }
  };

  // Grid columns
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: 'studentName',
      header: 'Scholar Name & ID',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <strong className="text-foreground font-bold">{row.original.studentName}</strong>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.admissionNumber}</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Attendance Status',
      cell: ({ row }) => {
        const current = row.original.status;
        return (
          <div className="flex items-center gap-1">
            {(['Present', 'Absent', 'Late', 'Excused'] as const).map(st => (
              <button
                key={st}
                onClick={() => toggleStatus(row.original.id, st)}
                disabled={!canModify}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer",
                  current === st
                    ? st === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : st === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : st === 'Late' ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        );
      }
    },
    {
      id: 'remarks',
      header: 'Log Remarks & Excuses',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 w-full max-w-xs">
          {row.original.hasExcuse && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
              <ShieldAlert className="w-3 h-3" /> Excuse
            </span>
          )}
          <input
            type="text"
            placeholder="No comments..."
            value={row.original.remarks || ''}
            disabled={!canModify}
            onChange={(e) => handleRemarksChange(row.original.id, e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Scholars Attendance Session Tracker"
        description="Monitor student logs, verify excused absences, and log daily class participation records."
      >
        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={loadAttendance}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {canModify && data.length > 0 && (
              <button
                onClick={handlePublishAttendance}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20 cursor-pointer border-none"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Publish Logs'}</span>
              </button>
            )}
          </div>
        )}
      </PageHeader>

      {/* Staff View Control Header */}
      {isStaff && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-2xs text-xs font-bold">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Class Offering *</span>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none w-64"
              >
                <option value="">Select Offering...</option>
                {offerings.map(o => {
                  const subjName = o.subject?.name || 'Class';
                  const grdeName = o.gradeLevel?.name || 'All Grades';
                  const tchrName = o.teacher ? ` (${o.teacher.lastName})` : '';
                  return (
                    <option key={o.id} value={o.id}>{subjName} - {grdeName}{tchrName}</option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Session Date *</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
              />
            </div>
          </div>

          {canModify && data.length > 0 && (
            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-lg border border-emerald-250 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 hover:bg-emerald-100 transition cursor-pointer"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-lg border border-rose-250 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 hover:bg-rose-100 transition cursor-pointer"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Parent Child Picker */}
      {isParent && children.length > 0 && (
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs mb-4 flex items-center gap-3 text-xs font-bold">
          <span className="text-muted-foreground">Select Scholar:</span>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Roster / Logs Table */}
      {isStaff ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-medium">Loading session scholars...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-medium">
              No scholars are currently enrolled in the selected Course Offering.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              isLoading={isLoading}
              searchPlaceholder="Filter daily roster by name..."
            />
          )}
        </div>
      ) : (
        /* Student/Parent Table View (ReadOnly Log Feed) */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs flex items-center justify-between">
            <span>Historical Attendance Logs Feed</span>
            <span className="text-muted-foreground">{data.length} records logged</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading historical records...</div>
          ) : data.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground italic text-xs">No attendance logs registered for this scholar profile.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 font-extrabold text-foreground">Date</th>
                    <th className="px-6 py-3.5 font-extrabold text-foreground">Subject / Course</th>
                    <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Status</th>
                    <th className="px-6 py-3.5 font-extrabold text-foreground">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary">
                        {log.section}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          log.status === 'Present' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-250/50" :
                          log.status === 'Absent' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-250/50" :
                          log.status === 'Late' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-250/50" :
                          "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border-indigo-250/50"
                        )}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-normal">
                        {log.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
