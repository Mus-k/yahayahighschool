/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap, DollarSign, Calendar, Bell, CheckCircle2, Award,
  RefreshCw, ArrowRight, AlertTriangle, FileText, Wallet,
  ChevronDown, ChevronUp, CreditCard, Clock, User, PiggyBank,
  TrendingUp, AlertCircle, BookOpen, Shield, ShieldAlert,
  KeyRound, Bus, Sparkles, MessageSquare, Plus, CheckSquare,
  Square, X, Upload, CheckSquare2, FileCheck, Check
} from 'lucide-react';

import { dashboardService, type ParentDashboardData } from '@/services/dashboard.service';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import { resultsService } from '@/services/results.service';
import { hostelService } from '@/services/hostel.service';
import { getTimetables } from '@/services/lms.service';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'academics' | 'attendance' | 'finance' | 'hostel-transport' | 'approvals' | 'chat'>('dashboard');

  // Timetables and grades for selected child
  const [timetable, setTimetable] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isPaying, setIsPaying] = useState(false);

  // Leave excuse form
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Gate pass approval simulator
  const [gatePasses, setGatePasses] = useState<any[]>([
    { id: 1, purpose: 'Weekend Home Visit', status: 'Pending Parent Approval', date: '2026-07-25' }
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, studentsRes, allInvoices] = await Promise.all([
        dashboardService.getParentDashboard().catch(() => null),
        erpService.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
        financeService.getInvoices().catch(() => [])
      ]);

      setData(dashRes);
      
      // Let's filter students that are linked to this parent (for simulation, slice(0, 2) students)
      const wards = studentsRes.data.slice(0, 2);
      setChildren(wards);

      if (wards.length > 0) {
        const currentChild = wards[selectedChildIndex];
        // Load student specific invoice records
        const studentInvs = allInvoices.filter((i: any) => 
          i.student?.id === currentChild.id || 
          i.student?.schoolId === currentChild.schoolId
        );
        setInvoices(studentInvs);

        // Load student specific timetable
        const sectionId = currentChild.sections?.[0]?.id || currentChild.sections?.[0]?.documentId || null;
        if (sectionId) {
          const ttRes = await getTimetables({ 'filters[section][id][$eq]': sectionId });
          setTimetable(ttRes.data || []);
        } else {
          setTimetable([]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync family dashboard records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChildIndex]);

  const currentChild = children[selectedChildIndex];

  // Calculations for billing details
  const outstandingFees = useMemo(() => {
    return invoices
      .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum: number, i: any) => sum + (i.remainingBalance ?? i.totalAmount ?? 0), 0);
  }, [invoices]);

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      const amount = selectedInvoice.remainingBalance ?? selectedInvoice.totalAmount ?? 0;
      await financeService.postCombinedPayment({
        invoiceId: selectedInvoice.id,
        paymentMethod,
        amountPaid: amount,
        currency: 'USD',
        transactionDate: new Date().toISOString()
      });

      await apiClient.post('/audit-logs', {
        data: {
          action: 'Parent Fee Payment Completed',
          module: 'Finance',
          details: `Parent paid invoice ${selectedInvoice.invoiceNumber} amount $${amount.toFixed(2)} for child ${currentChild.firstName}`,
          performedBy: 'Parent / Guardian',
          timestamp: new Date().toISOString()
        }
      });

      toast.success(`Payment of $${amount.toFixed(2)} completed! General Ledger updated.`);
      setSelectedInvoice(null);
      await loadData();
    } catch {
      toast.error('Payment transaction failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleApproveGatePass = async (id: number) => {
    setGatePasses(prev => prev.map(gp => gp.id === id ? { ...gp, status: 'Approved by Parent' } : gp));
    toast.success('Gate pass request signed and approved.');
    
    await apiClient.post('/audit-logs', {
      data: {
        action: 'Gate Pass Signed by Parent',
        module: 'Hostel Operations',
        details: `Parent approved weekend home visit for ${currentChild.firstName}`,
        performedBy: 'Parent / Guardian',
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !leaveDate) {
      toast.error('Please complete date and justification notes.');
      return;
    }
    setIsSubmittingLeave(true);
    try {
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Parent Leave Request Submitted',
          module: 'Academic Operations',
          details: `Leave requested for ${currentChild.firstName} on ${leaveDate}: ${leaveReason}`,
          performedBy: 'Parent / Guardian',
          timestamp: new Date().toISOString()
        }
      });
      toast.success('Leave permission request sent to class advisor.');
      setLeaveReason('');
      setLeaveDate('');
    } catch {
      toast.error('Failed to submit leave request.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  if (children.length === 0 && !isLoading) {
    return (
      <PageContainer>
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-10 text-center text-slate-500 font-medium">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold">No linked children profiles found.</p>
          <p className="text-xs text-slate-500 mt-1">Please contact school administration to link student ID registers with your parent account.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {currentChild && (
        <PageHeader
          title={`Family Portal: Monitor & Manage Wards`}
          description={`Guardian Account • Selected Child: ${currentChild.firstName} ${currentChild.lastName} (ID: ${currentChild.schoolId})`}
        >
          {/* Child Switcher dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Switch Ward:</span>
            <select
              value={selectedChildIndex}
              onChange={(e) => setSelectedChildIndex(parseInt(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {children.map((st, idx) => (
                <option key={st.id} value={idx}>
                  {st.firstName} {st.lastName} ({st.schoolId})
                </option>
              ))}
            </select>
          </div>
        </PageHeader>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 px-1 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-5xl overflow-x-auto no-scrollbar mb-6">
        {[
          { id: 'dashboard', label: 'Summary Card', icon: GraduationCap },
          { id: 'academics', label: 'Academics & Timetable', icon: BookOpen },
          { id: 'attendance', label: 'Attendance & Excuses', icon: CheckCircle2 },
          { id: 'finance', label: 'Billing Invoices', icon: DollarSign },
          { id: 'hostel-transport', label: 'Hostel & Route Bus', icon: KeyRound },
          { id: 'approvals', label: 'Leave & Consent slips', icon: ShieldAlert },
          { id: 'chat', label: 'Teacher Messaging', icon: MessageSquare }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              activeTab === t.id
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-slate-400 text-xs">Reloading child databases...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: SUMMARY DASHBOARD */}
          {activeTab === 'dashboard' && currentChild && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Wards GPA"
                  value="3.85"
                  subtitle="CA Weighted Average"
                  icon={Award}
                  color="text-indigo-500"
                  bgColor="bg-indigo-500/10"
                />
                <StatCard
                  title="Monthly Attendance"
                  value="96.5%"
                  subtitle="Class participation logs"
                  icon={CheckCircle2}
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                />
                <StatCard
                  title="Due Fees Balance"
                  value={outstandingFees > 0 ? `$${outstandingFees.toFixed(2)}` : 'Cleared'}
                  subtitle="Outstanding invoices"
                  icon={CreditCard}
                  color={outstandingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}
                  bgColor={outstandingFees > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
                />
                <StatCard
                  title="Conduct Score"
                  value="A+"
                  subtitle="Zero behavioral incidents"
                  icon={Shield}
                  color="text-sky-500"
                  bgColor="bg-sky-500/10"
                />
              </div>

              {/* Quran Hifz Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Qur'an Halaqah Progress (Hifz)</h3>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs space-y-2">
                    <p className="font-bold">Halaqah Memorization Track: Ustadh Ibrahim Al-Maliki</p>
                    <p className="text-slate-500">Current Juzu: Juzu 30 & Surah Al-Baqarah (35 Pages Memorized)</p>
                    <p className="font-semibold">Tajweed Assessment: Excellent Muraja'ah accuracy.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/30 rounded-3xl p-5 text-xs text-slate-300 space-y-3">
                  <h3 className="text-sm font-extrabold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Academic Prediction</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Based on weekly quiz entries, the model projects final grade estimates:</p>
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                    <p className="font-bold text-emerald-300">Chemistry: Projected A</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">High probability of Distinction status.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMICS & TIMETABLE */}
          {activeTab === 'academics' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Class Timetable Slot Details</h3>
              {timetable.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No timetables found in current active terms.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Teacher</th>
                        <th className="p-3">Room/Building</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {timetable.map((slot: any) => (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {slot.startTime} - {slot.endTime}
                          </td>
                          <td className="p-3 font-semibold">{slot.subject?.title}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{slot.teacher?.name}</td>
                          <td className="p-3 font-mono text-slate-500">Room {slot.classroom?.roomNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Absence Request & Excuse Logs</h3>
                <p className="text-xs text-slate-500">File leave of absence requests directly to class teacher registers</p>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs max-w-xl">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Absence Date</label>
                  <input
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Justification Reason</label>
                  <textarea
                    required
                    rows={4}
                    value={leaveReason}
                    placeholder="We request excused absence for Mohamed due to emergency family travel..."
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmittingLeave ? 'Submitting...' : 'File Excuse Slip'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: FINANCE */}
          {activeTab === 'finance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Outstanding Family Invoices</h3>
                <p className="text-xs text-slate-500">View billings and post payments online securely</p>
              </div>

              {invoices.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No active invoices linked with this child.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Billing Cycle</th>
                        <th className="p-3 text-right">Invoice Total</th>
                        <th className="p-3 text-right">Outstanding Balance</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {invoices.map((inv) => {
                        const amt = inv.totalAmount || 0;
                        const bal = inv.remainingBalance ?? amt;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-500">{inv.billingCycle || 'Semester 1'}</td>
                            <td className="p-3 text-right font-mono">${amt.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-rose-500">${bal.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                                inv.status === 'paid' ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-800 border-rose-300"
                              )}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {bal > 0 ? (
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-sm"
                                >
                                  Pay Bill
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold">✓ Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Checkout modal */}
              {selectedInvoice && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-4">
                    <button 
                      onClick={() => setSelectedInvoice(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Online Fee Settlement Portal</span>
                    </h3>

                    <div className="p-4 bg-slate-50 dark:bg-slate-805/50 border rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-mono">Invoice Number: {selectedInvoice.invoiceNumber}</p>
                      <p className="font-bold">Total Bill: ${(selectedInvoice.remainingBalance ?? selectedInvoice.totalAmount ?? 0).toFixed(2)} USD</p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Ledger Account Payment</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Cash">Cash Account Settlement</option>
                          <option value="Bank">Bank Wire / Transfer</option>
                        </select>
                      </div>

                      <button
                        onClick={handleProcessPayment}
                        disabled={isPaying}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                      >
                        {isPaying ? 'Processing Ledger Posting...' : 'Submit Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HOSTEL & TRANSPORT */}
          {activeTab === 'hostel-transport' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Boarding & Lodging Details</span>
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Building: Aisha Al-Zahra Boarding Hall</p>
                  <p className="text-slate-500">Room 102 | Bed B (Available Status)</p>
                  <p className="text-emerald-600 font-bold">Warden: Ustadh Ali Camara (+23188654859)</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-indigo-600" />
                  <span>Bus Route & Driver Details</span>
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Assigned Bus Stop: Sinkor Fish Market Stop</p>
                  <p className="text-slate-500">Route B-12 Monrovia Express</p>
                  <p className="text-slate-500">Driver: Ustadh Ousman Camara (+23155685965)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Emergency / Gate Pass Approvals</h3>
              <p className="text-xs text-slate-500">Review and authorize your child's weekend gate exit permits or school activity slips</p>

              <div className="space-y-3">
                {gatePasses.map((gp) => (
                  <div key={gp.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{gp.purpose}</p>
                      <p className="text-slate-500 text-[10px]">Requested Date: {gp.date}</p>
                      <p className="text-rose-500 font-bold text-[10px] mt-0.5">Status: {gp.status}</p>
                    </div>

                    {gp.status === 'Pending Parent Approval' && (
                      <button
                        onClick={() => handleApproveGatePass(gp.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px]"
                      >
                        Sign & Approve Exit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Direct Message History with Class Advisor</h3>
              <div className="space-y-4 h-[250px] overflow-y-auto border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/20 text-xs">
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Ustadh Ibrahim: </span>
                  <span className="text-slate-700 dark:text-slate-300">Mohamed is making excellent progress in Surah Al-Kahf recitation class.</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Parent: </span>
                  <span className="text-slate-700 dark:text-slate-300">Thank you Ustadh. We will continue practice at home.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
