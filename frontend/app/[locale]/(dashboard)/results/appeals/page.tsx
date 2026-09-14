/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Award, ShieldAlert, Plus, HelpCircle, Save, CheckCircle2,
  XCircle, ArrowRight, Eye, RefreshCw, FileText, ClipboardList
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New appeal form states
  const [students, setStudents] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [originalGrade, setOriginalGrade] = useState('65');
  const [requestedGrade, setRequestedGrade] = useState('75');
  const [reason, setReason] = useState('');

  const { user } = useAuth();
  const { userRole } = usePermissions();
  const canModerate = userRole === 'super-administrator' || userRole === 'director';

  const loadAppeals = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/academic-appeals', {
        params: {
          populate: ['student', 'courseOffering', 'courseOffering.subject'],
          'pagination[limit]': 100
        }
      });
      setAppeals(res.data?.data || []);
    } catch (e) {
      toast.error('Failed to load Grade Appeals list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [studRes, offeringsRes] = await Promise.all([
        apiClient.get('/students?pagination[limit]=100'),
        apiClient.get('/course-offerings?populate=subject&pagination[limit]=100')
      ]);
      setStudents(studRes.data?.data || []);
      setOfferings(offeringsRes.data?.data || []);
      if (studRes.data?.data?.length > 0) setSelectedStudentId(studRes.data.data[0].id);
      if (offeringsRes.data?.data?.length > 0) setSelectedOfferingId(offeringsRes.data.data[0].id);
    } catch (e) {
      console.warn('Could not load drop options');
    }
  };

  useEffect(() => {
    loadAppeals();
    loadOptions();
  }, [user]);

  const handleSaveAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedOfferingId || !reason.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.post('/academic-appeals', {
        data: {
          originalGrade: parseFloat(originalGrade) || 0,
          requestedGrade: parseFloat(requestedGrade) || 0,
          reason: reason.trim(),
          status: 'Pending',
          student: Number(selectedStudentId),
          courseOffering: Number(selectedOfferingId),
          publishedAt: new Date()
        }
      });
      toast.success('Grade recheck appeal filed successfully!');
      setIsModalOpen(false);
      setReason('');
      loadAppeals();
    } catch (err) {
      toast.error('Failed to file academic appeal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModerateAppeal = async (appealId: number, nextStatus: 'Approved' | 'Rejected', originalRow: any) => {
    try {
      toast.info(`Moderating appeal status to ${nextStatus}...`);
      await apiClient.put(`/academic-appeals/${appealId}`, {
        data: {
          status: nextStatus,
          resolutionNotes: `Resolution locked as ${nextStatus} by Registrar.`
        }
      });

      // If approved, update student's score in gradebook-entry automatically
      if (nextStatus === 'Approved') {
        const studentId = originalRow.student?.id;
        const offeringId = originalRow.courseOffering?.id;
        const scoreNum = originalRow.requestedGrade;

        // Query gradebook entries
        const gradeRes = await apiClient.get('/gradebook-entries', {
          params: {
            'filters[student][id][$eq]': studentId,
            'filters[courseOffering][id][$eq]': offeringId,
            'pagination[limit]': 1
          }
        });
        const list = gradeRes.data?.data || [];
        if (list.length > 0) {
          const entryId = list[0].id;
          const maxNum = list[0].maxScore || 100;
          await apiClient.put(`/gradebook-entries/${entryId}`, {
            data: {
              score: scoreNum,
              percentage: (scoreNum / maxNum) * 100
            }
          });
          toast.success(`Score updated in gradebook for scholar to ${scoreNum}!`);
        }
      }

      toast.success(`Appeal has been marked as ${nextStatus}`);
      loadAppeals();
    } catch (e) {
      toast.error('Failed to moderate appeal decision');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Appeals & Retakes Management"
        description="Moderate academic appeals, schedule supplementary exams, and log grades correction timeline."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadAppeals}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh list</span>
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition shadow-sm cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>File Appeal Case</span>
          </button>
        </div>
      </PageHeader>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs text-xs text-slate-805 dark:text-slate-100 font-bold">
        <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs flex items-center justify-between">
          <span>Appeals Registry Log</span>
          <span className="text-muted-foreground font-mono">{appeals.length} active appeals filed</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading appeals queue...</div>
        ) : appeals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-medium">
            No academic appeals currently filed in the register queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 font-extrabold text-foreground">Scholar Name</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground">Subject / Course</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Score Delta</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground">Appeal Reason</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Status</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appeals.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-foreground font-bold">
                          {[row.student?.firstName, row.student?.lastName].filter(Boolean).join(' ') || 'Scholar'}
                        </strong>
                        <span className="text-[9px] text-muted-foreground font-mono">{row.student?.schoolId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {row.courseOffering?.subject?.name || 'Class Course'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      <span className="text-rose-500">{row.originalGrade}</span>
                      <ArrowRight className="w-3 h-3 inline mx-1.5 text-muted-foreground" />
                      <span className="text-emerald-500">{row.requestedGrade}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-normal leading-relaxed w-72">
                      {row.reason}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-[10px] font-bold border",
                        row.status === 'Approved' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" :
                        row.status === 'Rejected' ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-250/50" :
                        "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-250/50"
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.status === 'Pending' && canModerate ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleModerateAppeal(row.id, 'Approved', row)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-550 text-white font-bold cursor-pointer border-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerateAppeal(row.id, 'Rejected', row)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-550 text-white font-bold cursor-pointer border-none"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-normal italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Appeal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-slide-up text-xs font-bold">
            <h3 className="text-lg font-black text-foreground mb-1">File Grade Appeal Case</h3>
            <p className="text-xs text-muted-foreground mb-5 font-medium">Log discrepancy checks or request grade moderation.</p>
            
            <form onSubmit={handleSaveAppeal} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-slate-500">Student Scholar *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Subject / Course Offering *</label>
                <select
                  value={selectedOfferingId}
                  onChange={(e) => setSelectedOfferingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none"
                >
                  {offerings.map(o => (
                    <option key={o.id} value={o.id}>{o.subject?.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500">Original Score</label>
                  <input
                    type="number"
                    value={originalGrade}
                    onChange={(e) => setOriginalGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">Claimed Score</label>
                  <input
                    type="number"
                    value={requestedGrade}
                    onChange={(e) => setRequestedGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">Filing Justification *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the reason for grade appeal recheck..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold cursor-pointer transition shadow-md border-none"
              >
                {isSaving ? 'Filing Appeal...' : 'Submit Appeal Case'}
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
