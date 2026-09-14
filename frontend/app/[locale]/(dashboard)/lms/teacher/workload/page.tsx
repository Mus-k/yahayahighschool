/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Clock, Calendar, RefreshCw, Save, CheckCircle2, 
  XCircle, Award, ShieldAlert, Award as BadgeCheck, ClipboardList, Briefcase, Plus, BookOpen as BookIcon
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TeacherWorkloadPage() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | number>('');
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Workload summaries
  const [workloadHours, setWorkloadHours] = useState(18);
  const [officeHours, setOfficeHours] = useState(4);
  const [invigilationCount, setInvigilationCount] = useState(2);
  const [extraDuties, setExtraDuties] = useState('Quranic Hifz Coordinator, Lunch Duty Hall B');

  // Form states for progress checklist
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [delivered, setDelivered] = useState(true);
  const [attendance, setAttendance] = useState(true);
  const [homework, setHomework] = useState(true);
  const [outcome, setOutcome] = useState(true);
  const [materials, setMaterials] = useState(false);
  const [notes, setNotes] = useState('');

  const { user } = useAuth();
  const { userRole } = usePermissions();
  const isTeacher = userRole === 'teacher';
  const canModify = userRole === 'super-administrator' || userRole === 'director' || isTeacher;

  const loadWorkload = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (isTeacher && user?.profile?.id) {
        params['filters[teacher][id][$eq]'] = user.profile.id;
      }
      
      const res = await apiClient.get('/course-offerings', {
        params: {
          populate: ['subject', 'gradeLevel', 'academicSection'],
          'pagination[limit]': 100
        }
      });
      const data = res.data?.data || [];
      setOfferings(data);
      if (data.length > 0) {
        setSelectedOfferingId(data[0].id);
      }
      
      // Calculate dynamic workload hours based on number of offerings
      setWorkloadHours(data.length * 4); // assume 4 hours per offering
    } catch (e) {
      toast.error('Failed to load teacher workload details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!selectedOfferingId) return;
    try {
      const res = await apiClient.get('/teaching-progresses', {
        params: {
          'filters[courseOffering][id][$eq]': selectedOfferingId,
          'sort': 'weekNumber:asc',
          'pagination[limit]': 100
        }
      });
      setWeeklyProgress(res.data?.data || []);
    } catch (e) {
      toast.error('Failed to load syllabus delivery logs');
    }
  };

  useEffect(() => {
    loadWorkload();
  }, [user]);

  useEffect(() => {
    if (selectedOfferingId) {
      loadProgress();
    }
  }, [selectedOfferingId]);

  const handleSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferingId) return;
    setIsSaving(true);

    // Calculate progress percentage for the week
    let checks = 0;
    if (delivered) checks++;
    if (attendance) checks++;
    if (homework) checks++;
    if (outcome) checks++;
    if (materials) checks++;
    const pct = (checks / 5) * 100;

    try {
      const existing = weeklyProgress.find(p => p.weekNumber === selectedWeek);
      const payload = {
        data: {
          weekNumber: selectedWeek,
          lessonDelivered: delivered,
          attendanceSubmitted: attendance,
          homeworkGiven: homework,
          outcomeCompleted: outcome,
          materialsUploaded: materials,
          notes,
          progressPercentage: pct,
          courseOffering: Number(selectedOfferingId)
        }
      };

      if (existing) {
        await apiClient.put(`/teaching-progresses/${existing.id}`, payload);
      } else {
        await apiClient.post('/teaching-progresses', payload);
      }

      toast.success(`Week ${selectedWeek} delivery checklist updated!`);
      setIsModalOpen(false);
      // Reset notes
      setNotes('');
      loadProgress();
    } catch (err) {
      toast.error('Failed to log weekly delivery checks');
    } finally {
      setIsSaving(false);
    }
  };

  // Cumulative progress calculate
  const overallProgress = React.useMemo(() => {
    if (weeklyProgress.length === 0) return 0;
    const total = weeklyProgress.reduce((sum, item) => sum + (item.progressPercentage || 0), 0);
    // Average across 16 weeks
    return Math.min(Math.round(total / 16), 100);
  }, [weeklyProgress]);

  return (
    <PageContainer>
      <PageHeader
        title="Teaching Progress & Workload Engine"
        description="Verify teaching loads, track weekly lesson plan delivery, and manage curriculum compliance."
      >
        <button
          onClick={loadWorkload}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Workspace</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800 dark:text-slate-100">
        
        {/* Workload summaries deck */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Workload hours card */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-5 font-bold">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-505" />
              <span>Teaching Workload Load</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-805 border border-border text-center">
                <span className="text-muted-foreground block text-[10px] uppercase">Instructional Hours</span>
                <span className="text-2xl font-black text-indigo-650 font-mono mt-1 block">{workloadHours} hrs</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-805 border border-border text-center">
                <span className="text-muted-foreground block text-[10px] uppercase">Required Office Hours</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{officeHours} hrs</span>
              </div>
            </div>

            <div className="space-y-3 font-semibold border-t border-border pt-4">
              <div>
                <span className="text-muted-foreground block text-[10px]">INVIGILATION DUTIES</span>
                <span className="text-foreground">{invigilationCount} midterm sessions allocated</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">EXTRA-CURRICULAR MANDATES</span>
                <span className="text-foreground">{extraDuties}</span>
              </div>
            </div>
          </div>

          {/* Target course offering picker */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4 font-bold">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <BookIcon className="w-5 h-5 text-indigo-505" />
              <span>Scoped Course Offering</span>
            </h3>

            <select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
            >
              {offerings.map(o => (
                <option key={o.id} value={o.id}>
                  {o.subject?.name} - {o.gradeLevel?.name || 'General'}
                </option>
              ))}
            </select>

            <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase">Curriculum Coverage Rate</span>
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono block">{overallProgress}%</span>
              <span className="text-[10px] text-indigo-500/80 block font-bold">Target Syllabus Completion (16 Weeks)</span>
            </div>
          </div>
        </div>

        {/* Weekly Checklist logs timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-505" />
              <span>Weekly Delivery Logs</span>
            </h3>

            {canModify && selectedOfferingId && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition shadow-sm cursor-pointer border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Weekly Progress</span>
              </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
            {weeklyProgress.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-medium">
                No teaching logs registered for this course offering. Click "Log Weekly Progress" to submit Week 1 checks.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {weeklyProgress.map((wp) => (
                  <div key={wp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-black text-indigo-650 font-mono">
                        W{wp.weekNumber}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs">Syllabus Delivery Checklist</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-muted-foreground font-mono">
                            {wp.progressPercentage}%
                          </span>
                        </div>
                        {wp.notes && <p className="text-muted-foreground font-normal">{wp.notes}</p>}
                      </div>
                    </div>

                    {/* Progress Checklist Indicators */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                        wp.lessonDelivered ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-slate-50 text-slate-400 border-border"
                      )}>
                        Lesson
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                        wp.attendanceSubmitted ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-slate-50 text-slate-400 border-border"
                      )}>
                        Attendance
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                        wp.homeworkGiven ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-slate-50 text-slate-400 border-border"
                      )}>
                        Homework
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                        wp.outcomeCompleted ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-slate-50 text-slate-400 border-border"
                      )}>
                        Outcome
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold border",
                        wp.materialsUploaded ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-slate-50 text-slate-400 border-border"
                      )}>
                        Resources
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Progress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-slide-up text-xs font-bold">
            <h3 className="text-lg font-black text-foreground mb-1">Submit Weekly Progress Checks</h3>
            <p className="text-xs text-muted-foreground mb-5 font-medium">Verify lesson deliverables for the target academic week.</p>
            
            <form onSubmit={handleSaveWeek} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-slate-500">Academic Week Number *</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-mono"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>

              {/* Checkbox fields */}
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-805 border border-border">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={delivered}
                    onChange={(e) => setDelivered(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Lesson Syllabus Material Delivered</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendance}
                    onChange={(e) => setAttendance(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Attendance Register Marked & Locked</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homework}
                    onChange={(e) => setHomework(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Weekly Assessment/Homework Issued</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outcome}
                    onChange={(e) => setOutcome(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Target Learning Outcome Covered</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={materials}
                    onChange={(e) => setMaterials(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Reference Resources Uploaded to LMS</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Reflection Notes</label>
                <textarea
                  rows={2}
                  placeholder="Type any weekly highlights or topics delayed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold cursor-pointer transition shadow-md border-none"
              >
                {isSaving ? 'Submitting Checks...' : 'Submit weekly logs'}
              </button>
            </form>

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
