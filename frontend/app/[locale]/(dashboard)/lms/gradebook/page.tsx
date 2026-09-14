/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Search, Plus, Users, School, Trash2, Edit2, Eye, X, 
  Check, BookOpen, Calendar, Save, Percent, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface GradeRow {
  studentId: number;
  studentName: string;
  schoolId: string;
  admissionNumber: string;
  entryId: number | string | null; // null if no grade logged yet
  score: string; // string for input binding
  maxScore: string;
  comments: string;
  status: 'Draft' | 'Published';
}

export default function GradebookPage() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | number>('');
  
  // Assessment fields
  const [assessmentType, setAssessmentType] = useState<'Homework' | 'Quiz' | 'Project' | 'Participation' | 'Attendance' | 'Exam' | 'Other'>('Homework');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [weight, setWeight] = useState('10');
  
  // Grid data state
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useAuth();
  const { userRole } = usePermissions();
  const isTeacher = userRole === 'teacher';
  const canModify = userRole === 'super-administrator' || userRole === 'director' || isTeacher;

  useEffect(() => {
    loadCourseOfferings();
  }, [user]);

  const loadCourseOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const params: any = {};
      if (isTeacher && user?.profile?.id) {
        params['filters[teacher][id][$eq]'] = user.profile.id;
      }
      const res = await apiClient.get('/course-offerings', {
        params: {
          populate: ['subject', 'teacher', 'gradeLevel', 'academicSection'],
          'pagination[limit]': 200
        }
      });
      const data = res.data?.data || [];
      setOfferings(data);
      if (data.length > 0) {
        setSelectedOfferingId(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load Course Offerings.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const loadGrades = async () => {
    if (!selectedOfferingId || !assessmentTitle.trim()) {
      setGradeRows([]);
      return;
    }

    setLoadingGrades(true);
    try {
      // 1. Fetch all students enrolled in the Course Offering
      const enrollRes = await apiClient.get('/student-enrollments', {
        params: {
          'filters[courseOffering][id][$eq]': selectedOfferingId,
          'filters[enrollmentStatus][$eq]': 'active',
          'populate': ['student', 'student.user'],
          'pagination[limit]': 100
        }
      });
      const enrollments = enrollRes.data?.data || [];

      // 2. Fetch existing gradebook entries for this offering, type, and title
      const gradesRes = await apiClient.get('/gradebook-entries', {
        params: {
          'filters[courseOffering][id][$eq]': selectedOfferingId,
          'filters[assessmentType][$eq]': assessmentType,
          'filters[title][$eq]': assessmentTitle.trim(),
          'populate': ['student'],
          'pagination[limit]': 200
        }
      });
      const existingEntries = gradesRes.data?.data || [];

      // 3. Map into editable grid rows
      const rows = enrollments.map((enr: any) => {
        const student = enr.student;
        if (!student) return null;
        
        const matchGrade = existingEntries.find((g: any) => g.student?.id === student.id);
        
        return {
          studentId: student.id,
          studentName: [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student Scholar',
          schoolId: student.schoolId || 'N/A',
          admissionNumber: student.admissionNumber || 'N/A',
          entryId: matchGrade ? matchGrade.id : null,
          score: matchGrade ? String(matchGrade.score) : '',
          maxScore: matchGrade ? String(matchGrade.maxScore) : maxScore,
          comments: matchGrade ? matchGrade.teacherComment || '' : '',
          status: matchGrade ? matchGrade.recordStatus || 'Draft' : 'Draft'
        } as GradeRow;
      }).filter(Boolean) as GradeRow[];

      setGradeRows(rows);
    } catch (err) {
      toast.error('Failed to load grade records.');
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (selectedOfferingId && assessmentTitle.trim()) {
      loadGrades();
    } else {
      setGradeRows([]);
    }
  }, [selectedOfferingId, assessmentType, assessmentTitle]);

  const handleScoreChange = (studentId: number, val: string) => {
    if (!canModify) return;
    setGradeRows(prev => prev.map(r => {
      if (r.studentId === studentId) {
        // Bound checks
        const num = parseFloat(val);
        const max = parseFloat(r.maxScore) || 100;
        let corrected = val;
        if (!isNaN(num)) {
          if (num < 0) corrected = '0';
          if (num > max) corrected = String(max);
        }
        return { ...r, score: corrected };
      }
      return r;
    }));
  };

  const handleCommentsChange = (studentId: number, val: string) => {
    if (!canModify) return;
    setGradeRows(prev => prev.map(r => r.studentId === studentId ? { ...r, comments: val } : r));
  };

  const handleSaveGrades = async (status: 'Draft' | 'Published') => {
    if (gradeRows.length === 0) return;
    setIsSaving(true);
    try {
      const selectedOffering = offerings.find(o => o.id === Number(selectedOfferingId));
      const subjectId = selectedOffering?.subject?.id || null;
      const sectionId = selectedOffering?.academicSection?.id || null;
      const teacherId = user?.profile?.id || null;

      toast.info(`Saving ${gradeRows.length} grade sheets...`);

      for (const row of gradeRows) {
        const scoreNum = parseFloat(row.score) || 0;
        const maxNum = parseFloat(row.maxScore) || 100;
        const percentage = maxNum > 0 ? (scoreNum / maxNum) * 100 : 0;

        const payload = {
          data: {
            assessmentType,
            title: assessmentTitle.trim(),
            score: scoreNum,
            maxScore: maxNum,
            percentage,
            weight: parseFloat(weight) || 10,
            teacherComment: row.comments,
            recordStatus: status,
            student: row.studentId,
            courseOffering: Number(selectedOfferingId),
            subject: subjectId,
            section: sectionId,
            teacher: teacherId,
            publishedAt: new Date()
          }
        };

        if (row.entryId) {
          // Update existing
          await apiClient.put(`/gradebook-entries/${row.entryId}`, payload);
        } else {
          // Create new
          await apiClient.post('/gradebook-entries', payload);
        }
      }

      toast.success(`Grades saved successfully as ${status}!`);
      loadGrades();
    } catch (err) {
      toast.error('Failed to save gradebook entries.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in text-xs">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Award className="w-8 h-8 text-indigo-650" />
              <span>Continuous Assessment (Gradebook)</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter and publish homework results, quiz performance, midterm marks, and final evaluation grades.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canModify && gradeRows.length > 0 && (
              <>
                <button
                  onClick={() => handleSaveGrades('Draft')}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer bg-white dark:bg-slate-900"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveGrades('Published')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-605 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 border-none cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Grades</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters and Config Panel */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500">Course Offering *</label>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                {loadingOfferings ? (
                  <option>Loading Offerings...</option>
                ) : offerings.length === 0 ? (
                  <option>No assigned offerings found</option>
                ) : (
                  offerings.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.subject?.name} ({o.gradeLevel?.name || 'General'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">Assessment Category</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Homework">Homework</option>
                <option value="Quiz">Quiz</option>
                <option value="Project">Project</option>
                <option value="Participation">Participation</option>
                <option value="Attendance">Attendance</option>
                <option value="Exam">Exam</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500">Assessment Title *</label>
              <input
                type="text"
                placeholder="e.g. Midterm Oral Quiz"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-755 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-500">Max Score</label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500">Weight (%)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spreadsheet Grade Grid */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs flex items-center justify-between">
            <span>Assessment Scoring Roster Sheet</span>
            {gradeRows.length > 0 && (
              <span className="text-muted-foreground font-mono">{gradeRows.length} Enrolled Scholars</span>
            )}
          </div>

          {loadingGrades ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              Loading Grade Roster Sheet...
            </div>
          ) : !selectedOfferingId || !assessmentTitle.trim() ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Please enter an Assessment Title to populate the scoring spreadsheet sheet.
            </div>
          ) : gradeRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No students are currently enrolled in the selected Course Offering.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-extrabold text-foreground w-48">Scholar Name & ID</th>
                    <th className="px-6 py-4 font-extrabold text-foreground w-40">Score</th>
                    <th className="px-6 py-4 font-extrabold text-foreground text-center w-28">Grade Percentage</th>
                    <th className="px-6 py-4 font-extrabold text-foreground text-center w-28">Status</th>
                    <th className="px-6 py-4 font-extrabold text-foreground">Teacher Comment / Evaluation Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gradeRows.map((row) => {
                    const scoreVal = parseFloat(row.score) || 0;
                    const maxVal = parseFloat(row.maxScore) || 100;
                    const pct = maxVal > 0 ? ((scoreVal / maxVal) * 100).toFixed(0) : '0';
                    const isPassed = parseFloat(pct) >= 70;

                    return (
                      <tr key={row.studentId} className="hover:bg-muted/20 transition">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <strong className="text-foreground font-bold">{row.studentName}</strong>
                            <span className="text-[9px] text-muted-foreground font-mono">{row.schoolId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="0"
                              value={row.score}
                              disabled={!canModify}
                              onChange={(e) => handleScoreChange(row.studentId, e.target.value)}
                              className="w-20 bg-slate-50 dark:bg-slate-805 border border-slate-205 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                            />
                            <span className="text-muted-foreground font-mono">/ {row.maxScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 font-mono font-black text-xs px-2 py-0.5 rounded-full",
                            isPassed 
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" 
                              : "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                          )}>
                            <Percent className="w-3.5 h-3.5" />
                            {pct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            row.entryId 
                              ? row.status === 'Published' 
                                ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 border-emerald-250/50" 
                                : "bg-amber-50 dark:bg-amber-955/20 text-amber-700 border-amber-250/50" 
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200/50"
                          )}>
                            {row.entryId ? row.status : 'Not Logged'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Add evaluation comment..."
                            value={row.comments}
                            disabled={!canModify}
                            onChange={(e) => handleCommentsChange(row.studentId, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-805 border border-slate-205 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
