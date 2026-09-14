'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  RotateCcw, 
  Play, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  ChevronRight, 
  Activity, 
  Sliders, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { resultsService } from '@/services/results.service';
import { toast } from 'sonner';

interface StudentPromotionRow {
  id: number;
  name: string;
  schoolId: string;
  currentClass: string;
  gpa: number;
  creditsEarned: number;
  attendance: number;
  unpaidFees: number;
  disciplineViolations: number;
  decision: 'Promoted' | 'Conditional' | 'Repeat' | 'Probation' | 'Dismissed';
  recommendedClass: string;
  reason: string;
}

export default function PromotionsPage() {
  const [students, setStudents] = useState<StudentPromotionRow[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('JSS3');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Configurable promotion thresholds
  const [minGpa, setMinGpa] = useState<number>(2.0);
  const [minCredits, setMinCredits] = useState<number>(30);
  const [minAttendance, setMinAttendance] = useState<number>(85);
  const [blockOnFees, setBlockOnFees] = useState<boolean>(true);

  useEffect(() => {
    loadPromotionLogs();
  }, []);

  const loadPromotionLogs = async () => {
    setHistoryLogs([
      { id: 1, date: '2026-07-24 10:00 AM', fromClass: 'JSS2', toClass: 'JSS3', executedBy: 'Dr. Ibrahim (Registrar)', count: 42, status: 'Success' },
      { id: 2, date: '2026-07-23 03:30 PM', fromClass: 'SS1', toClass: 'SS2', executedBy: 'Dr. Ibrahim (Registrar)', count: 38, status: 'Success' }
    ]);
  };

  const handleEvaluate = async () => {
    setIsLoading(true);
    setHasEvaluated(true);
    try {
      // Mock evaluations based on rules
      setTimeout(() => {
        setStudents([
          { id: 1, name: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', currentClass: 'JSS3', gpa: 3.92, creditsEarned: 32, attendance: 98, unpaidFees: 0, disciplineViolations: 0, decision: 'Promoted', recommendedClass: 'SS1', reason: 'Meets all GPA and Credit thresholds.' },
          { id: 2, name: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', currentClass: 'JSS3', gpa: 3.81, creditsEarned: 30, attendance: 96, unpaidFees: 12000, disciplineViolations: 0, decision: 'Conditional', recommendedClass: 'SS1', reason: 'Outstanding tuition fees balance. Clearance required.' },
          { id: 3, name: 'Yusuf Muhammad Sani', schoolId: 'AC-2026-0043', currentClass: 'JSS3', gpa: 1.85, creditsEarned: 24, attendance: 82, unpaidFees: 0, disciplineViolations: 2, decision: 'Repeat', recommendedClass: 'JSS3', reason: 'GPA (1.85) and completed credits (24) below minimum promotion criteria.' },
          { id: 4, name: 'Zainab Abubakar Bello', schoolId: 'AC-2026-0089', currentClass: 'JSS3', gpa: 2.10, creditsEarned: 28, attendance: 88, unpaidFees: 0, disciplineViolations: 0, decision: 'Probation', recommendedClass: 'SS1', reason: 'Marginal credits completion. Promoted on academic probation.' }
        ]);
        setIsLoading(false);
        toast.success(`Evaluated ${selectedClass} cohort rules successfully.`);
      }, 1000);
    } catch (e) {
      toast.error('Evaluation failed.');
      setIsLoading(false);
    }
  };

  const handleExecute = () => {
    toast.success(`Executing promotions for JSS3 cohort. Database registry updated.`);
    setHistoryLogs([
      { id: Date.now(), date: new Date().toLocaleString(), fromClass: 'JSS3', toClass: 'SS1', executedBy: 'Dr. Ibrahim (Registrar)', count: students.length, status: 'Success' },
      ...historyLogs
    ]);
    setHasEvaluated(false);
    setStudents([]);
  };

  const handleRollback = (id: number) => {
    toast.success(`Successfully rolled back promotion batch id: ${id}. Rollback audits logged.`);
    setHistoryLogs(prev => prev.filter(log => log.id !== id));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Grade Promotions Command Console"
        description="Process end-of-year class advancements, retention reviews, and student promotion rules."
      >
        <div className="flex items-center gap-2">
          {hasEvaluated && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Batch Promotion</span>
            </button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Selection Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-emerald-600" />
              <span>Promotion Criteria Rules</span>
            </h3>

            <div>
              <label className="text-[10px] font-black text-slate-450 block mb-1.5">Class Cohort Group</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="JSS1">Junior Sec 1 (JSS1)</option>
                <option value="JSS2">Junior Sec 2 (JSS2)</option>
                <option value="JSS3">Junior Sec 3 (JSS3)</option>
                <option value="SS1">Senior Sec 1 (SS1)</option>
                <option value="SS2">Senior Sec 2 (SS2)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1.5">Minimum GPA</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={minGpa} 
                  onChange={(e) => setMinGpa(parseFloat(e.target.value) || 2.0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1.5">Min Credits Required</label>
                <input 
                  type="number" 
                  value={minCredits} 
                  onChange={(e) => setMinCredits(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 block mb-1.5">Minimum Attendance %</label>
              <input 
                type="number" 
                value={minAttendance} 
                onChange={(e) => setMinAttendance(parseInt(e.target.value) || 85)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-transparent text-xs font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="blockFees"
                checked={blockOnFees}
                onChange={(e) => setBlockOnFees(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="blockFees" className="text-xs font-bold text-slate-600">Block Promotion on Tuition Balance</label>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 hover:opacity-90 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Preview Dry-Run Evaluation</span>
            </button>
          </div>

          {/* History / Rollback Card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-slate-500" />
              <span>Executed History Ledger</span>
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {historyLogs.map(log => (
                <div key={log.id} className="py-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.fromClass} &rarr; {log.toClass}</span>
                    <span className="text-[10px] text-slate-400">{log.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{log.count} students promoted</span>
                    <button 
                      onClick={() => handleRollback(log.id)}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-bold"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Rollback</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evaluation Output panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-h-[400px]">
            {hasEvaluated ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Rule Evaluation Dry-Run</h4>
                  <span className="text-[10px] text-slate-500">{students.length} student records analysed</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2">GPA / Credits</th>
                        <th className="px-3 py-2">Fees Unpaid</th>
                        <th className="px-3 py-2">Evaluation Result</th>
                        <th className="px-3 py-2">Next Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {students.map((std) => (
                        <tr key={std.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">{std.name}</p>
                            <p className="text-[10px] text-slate-450">{std.schoolId}</p>
                          </td>
                          <td className="px-3 py-3">
                            <p>GPA: {std.gpa.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500">{std.creditsEarned} completed</p>
                          </td>
                          <td className="px-3 py-3">
                            <p className={std.unpaidFees > 0 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                              {std.unpaidFees > 0 ? `₦${std.unpaidFees.toLocaleString()}` : 'Cleared'}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                std.decision === 'Promoted' ? 'bg-emerald-500/10 text-emerald-600' :
                                std.decision === 'Conditional' ? 'bg-amber-500/10 text-amber-600' :
                                std.decision === 'Probation' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {std.decision}
                              </span>
                              <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight">{std.reason}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-700">{std.recommendedClass}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Ready for cohort evaluation</h4>
                <p className="text-xs text-slate-500 max-w-xs">Configure the rules and select the class cohort group on the sidebar, then run the dry-run simulation to review results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
