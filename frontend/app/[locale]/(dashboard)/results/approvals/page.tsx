/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle2, ShieldAlert, Lock, Eye, BookOpen, RefreshCw, 
  ChevronRight, CircleDot, UserCheck, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function GradeApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffering, setSelectedOffering] = useState<any | null>(null);
  const [gradesDetail, setGradesDetail] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const { user } = useAuth();
  const { userRole } = usePermissions();

  const isPrincipal = userRole === 'super-administrator' || userRole === 'director';
  const isRegistrar = userRole === 'accountant' || userRole === 'account-lead' || isPrincipal; // Accountant plays registrar role here
  const isDeptHead = userRole === 'teacher' || isPrincipal; // Section head can be senior teacher

  const loadWorkflowData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch scheduled course offerings
      const offeringsRes = await apiClient.get('/course-offerings', {
        params: {
          populate: ['subject', 'teacher', 'gradeLevel', 'academicSection'],
          'pagination[limit]': 100
        }
      });
      const allOfferings = offeringsRes.data?.data || [];
      setOfferings(allOfferings);

      // 2. Fetch existing grade approval records
      const approvalsRes = await apiClient.get('/grade-approvals', {
        params: {
          populate: ['courseOffering'],
          'pagination[limit]': 200
        }
      });
      const allApprovals = approvalsRes.data?.data || [];
      setApprovals(allApprovals);
    } catch (e) {
      toast.error('Failed to load grade moderation workflow status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflowData();
  }, [user]);

  const loadGradesDetail = async (offeringId: number) => {
    setLoadingGrades(true);
    try {
      const res = await apiClient.get('/gradebook-entries', {
        params: {
          'filters[courseOffering][id][$eq]': offeringId,
          'populate': ['student'],
          'pagination[limit]': 100
        }
      });
      setGradesDetail(res.data?.data || []);
    } catch (e) {
      toast.error('Failed to load grade register details');
    } finally {
      setLoadingGrades(false);
    }
  };

  const getStatus = (offeringId: number) => {
    const app = approvals.find(a => a.courseOffering?.id === offeringId);
    return app ? app.status : 'Draft';
  };

  const handleTransition = async (offeringId: number, nextStatus: string) => {
    try {
      toast.info(`Transitioning status to ${nextStatus}...`);
      const existing = approvals.find(a => a.courseOffering?.id === offeringId);
      
      const payload = {
        data: {
          status: nextStatus,
          courseOffering: offeringId,
          approvedBy: user?.id || null,
          releasedAt: nextStatus === 'Released' ? new Date() : null,
          submittedAt: nextStatus === 'Submitted' ? new Date() : null,
          publishedAt: new Date()
        }
      };

      if (existing) {
        await apiClient.put(`/grade-approvals/${existing.id}`, payload);
      } else {
        await apiClient.post('/grade-approvals', payload);
      }

      // Write log to audit timeline
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Grade Moderation Transition',
          description: `Grade register for course offering #${offeringId} marked as ${nextStatus} by ${user?.email}`,
          performedBy: user?.profile?.id || null,
          publishedAt: new Date()
        }
      });

      toast.success(`Moderation status updated to ${nextStatus}`);
      loadWorkflowData();
      if (selectedOffering?.id === offeringId) {
        setSelectedOffering(null);
      }
    } catch (e) {
      toast.error('Failed to moderate grades register');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Grade Approval & Moderation Console"
        description="Verify assessment results, audit class averages, and release academic records for student portal publication."
      >
        <button
          onClick={loadWorkflowData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Workflow</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800 dark:text-slate-100 font-bold">
        
        {/* Scoped offerings grid list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <CircleDot className="w-5 h-5 text-indigo-505" />
            <span>Moderation Queue</span>
          </h3>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs divide-y divide-border">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading workflow status...</div>
            ) : offerings.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No course offerings registered for moderation.</div>
            ) : (
              offerings.map(o => {
                const status = getStatus(o.id);
                return (
                  <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground text-xs">{o.subject?.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-muted-foreground font-mono">
                          {o.gradeLevel?.name || 'General'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium font-normal">
                        <span>Instructor: {o.teacher ? `${o.teacher.firstName} ${o.teacher.lastName}` : 'Unassigned'}</span>
                        <span>Section: {o.academicSection?.name || 'General'}</span>
                      </div>
                    </div>

                    {/* Moderation Controls based on user role */}
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold border",
                        status === 'Released' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" :
                        status === 'Locked' ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-250/50" :
                        status === 'Approved' ? "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 border-cyan-250/50" :
                        status === 'Submitted' ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-250/50" :
                        "bg-slate-50 dark:bg-slate-800 text-slate-400 border-border"
                      )}>
                        {status}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedOffering(o);
                          loadGradesDetail(o.id);
                        }}
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {status === 'Draft' && isDeptHead && (
                          <button
                            onClick={() => handleTransition(o.id, 'Submitted')}
                            className="px-2.5 py-1 rounded bg-indigo-605 hover:bg-indigo-600 text-white cursor-pointer border-none"
                          >
                            Submit
                          </button>
                        )}
                        {status === 'Submitted' && isDeptHead && (
                          <button
                            onClick={() => handleTransition(o.id, 'Approved')}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-550 text-white cursor-pointer border-none"
                          >
                            Approve
                          </button>
                        )}
                        {status === 'Approved' && isRegistrar && (
                          <button
                            onClick={() => handleTransition(o.id, 'Locked')}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer border-none flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" /> Lock
                          </button>
                        )}
                        {status === 'Locked' && isPrincipal && (
                          <button
                            onClick={() => handleTransition(o.id, 'Released')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-550 text-white cursor-pointer border-none flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Release
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: Selected offering grade list inspector */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-indigo-505" />
            <span>Gradebook Inspector</span>
          </h3>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            {selectedOffering ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3">
                  <h4 className="font-extrabold text-xs text-foreground">{selectedOffering.subject?.name}</h4>
                  <span className="text-muted-foreground block text-[10px] uppercase mt-1 font-medium font-normal">
                    Assigned Teacher: {selectedOffering.teacher ? `${selectedOffering.teacher.firstName} ${selectedOffering.teacher.lastName}` : 'Unassigned'}
                  </span>
                </div>

                {loadingGrades ? (
                  <div className="p-6 text-center text-muted-foreground">Loading student grades...</div>
                ) : gradesDetail.length === 0 ? (
                  <p className="text-muted-foreground italic font-normal">No grades logged for this course offering yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {gradesDetail.map(g => (
                      <div key={g.id} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-805 border border-border">
                        <span className="font-bold text-foreground truncate w-32">
                          {[g.student?.firstName, g.student?.lastName].filter(Boolean).join(' ') || 'Scholar'}
                        </span>
                        <span className="font-mono text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-bold">
                          {g.score} / {g.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12 text-muted-foreground font-medium">
                Click the eye icon next to a course offering to inspect student grades before moderating.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
