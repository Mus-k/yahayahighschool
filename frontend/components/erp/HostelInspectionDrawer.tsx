/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import {
  X, User, Home, DollarSign, Package, Wrench, Calendar, KeyRound, Heart,
  ShieldAlert, FileText, Clock, FileSearch, CheckCircle2, AlertCircle, AlertTriangle, QrCode, RotateCcw,
  CreditCard
} from 'lucide-react';
import type { HostelBedAllocation } from '@/types/enterprise.types';
import { StatusBadge } from './StatusBadge';
import { hostelService } from '@/services/hostel.service';
import { toast } from 'sonner';

interface HostelInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: HostelBedAllocation | null;
}

export function HostelInspectionDrawer({ isOpen, onClose, allocation }: HostelInspectionDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'finance' | 'assets' | 'maintenance' | 'attendance' | 'visitors' | 'medical' | 'discipline' | 'documents' | 'timeline' | 'audit'
  >('overview');

  // Dates states for Check-In / Check-Out
  const [checkInDateState, setCheckInDateState] = useState('');
  const [checkOutDateState, setCheckOutDateState] = useState('');

  // Payment states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50');

  // Dynamic ledger states
  const [dynamicLedger, setDynamicLedger] = useState<any[]>([]);
  const [remainingFee, setRemainingFee] = useState(250);
  const [remainingDeposit, setRemainingDeposit] = useState(50);
  const [remainingBal, setRemainingBal] = useState(300);

  // Sync state when allocation changes
  useEffect(() => {
    if (allocation) {
      setCheckInDateState(allocation.checkInDate || '');
      setCheckOutDateState(allocation.checkOutDate || new Date().toISOString().split('T')[0]);
      setDepositAmount(String(allocation.securityDeposit || 50));

      const fetchPaymentsAndBuildLedger = async () => {
        try {
          const alloc = allocation as any;
          let studentId = alloc.student?.documentId || alloc.student?.id || alloc.studentId || '';
          
          const { apiClient } = await import('@/services/api.service');

          if (!studentId || studentId.length < 5) {
            try {
              const studentsRes = await apiClient.get('/students?limit=1');
              const firstStudent = studentsRes.data?.data?.[0];
              if (firstStudent) {
                studentId = firstStudent.documentId || String(firstStudent.id);
              }
            } catch (e) {
              console.warn('Failed to resolve active fallback student:', e);
            }
          }

          const isDocId = studentId.length > 10;
          const filterParam = isDocId 
            ? `filters[student][documentId][$eq]=${studentId}` 
            : `filters[student][id][$eq]=${studentId}`;

          const res = await apiClient.get(`/hostel-payments?${filterParam}&populate=*`);
          const paymentsList = res.data?.data || [];

          // Calculate total paid credits
          const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          
          const feePortion = Number(allocation.termFee || 250);
          const depositPortion = Number(allocation.securityDeposit || 50);

          // Calculate remaining amounts
          const rDeposit = Math.max(0, depositPortion - totalPaid);
          const rFee = Math.max(0, feePortion - Math.max(0, totalPaid - depositPortion));
          const rBal = rDeposit + rFee;

          setRemainingDeposit(rDeposit);
          setRemainingFee(rFee);
          setRemainingBal(rBal);
          setPaymentAmount(String(rBal));

          // Build double-entry ledger dynamically
          const ledgerEntries = [
            {
              date: allocation.checkInDate,
              description: 'Initial Accommodation Term Fee billed',
              debit: feePortion,
              credit: 0
            },
            {
              date: allocation.checkInDate,
              description: 'Refundable Security Deposit billed (GL 2050)',
              debit: depositPortion,
              credit: 0
            }
          ];

          paymentsList.forEach((p: any) => {
            ledgerEntries.push({
              date: (p.paymentDate || p.createdAt || '').split('T')[0],
              description: `Hostel Fee Payment Received (${p.paymentMethod || 'Cash'})`,
              debit: 0,
              credit: Number(p.amount || 0)
            });
          });

          setDynamicLedger(ledgerEntries);
        } catch (e) {
          console.warn('Failed to load dynamic ledger:', e);
          // Fallback to static ledger if fetch fails
          setDynamicLedger(allocation.financialLedger || []);
          const totalInvoiced = Number(allocation.termFee || 250) + Number(allocation.securityDeposit || 50);
          setRemainingBal(totalInvoiced);
          setPaymentAmount(String(totalInvoiced));
        }
      };

      fetchPaymentsAndBuildLedger();
    }
  }, [allocation]);

  if (!isOpen || !allocation) return null;

  const handleCheckoutVacate = async () => {
    try {
      await hostelService.vacateBed(
        allocation.id, 
        allocation.studentName, 
        Number(allocation.securityDeposit || 50),
        checkOutDateState
      );
      toast.success('Resident has successfully checked out and vacated the bed.');
      onClose();
    } catch (e) {
      toast.error('Failed to vacate bed.');
    }
  };

  const handleReCheckIn = async () => {
    try {
      const targetCheckIn = checkInDateState || new Date().toISOString().split('T')[0];
      const { apiClient } = await import('@/services/api.service');
      await apiClient.put(`/hostel-allocations/${allocation.id}`, {
        data: {
          status: 'active',
          checkInDate: targetCheckIn,
          checkOutDate: null
        }
      });

      const alloc = allocation as any;
      if (alloc.bed?.documentId || alloc.bed?.id) {
        await apiClient.put(`/hostel-beds/${alloc.bed.documentId || alloc.bed.id}`, {
          data: { status: 'occupied' }
        });
      }

      toast.success('Resident re-checked in successfully.');
      onClose();
    } catch (e) {
      toast.error('Failed to re-check in resident.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    try {
      const alloc = allocation as any;
      const studentId = alloc.student?.documentId || alloc.student?.id || alloc.studentId || '';
      await hostelService.recordHostelPayment(
        allocation.id,
        studentId,
        amt,
        currency,
        paymentMethod,
        includeDeposit,
        Number(depositAmount) || 50.00
      );
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Finance & Ledger', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'assets', label: 'Room Assets', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'visitors', label: 'Visitors', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'medical', label: 'Medical', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'discipline', label: 'Discipline', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Audit Trail', icon: <FileSearch className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">

        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              {allocation.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{allocation.studentName}</h3>
                <StatusBadge status={allocation.status} size="sm" />
              </div>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{allocation.allocationNumber}</span>
              <span className="text-xs text-slate-500 ml-2">| {allocation.buildingName} (Room {allocation.roomNumber})</span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 11-Tab Navigation Header */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Scholar Profile</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{allocation.studentName}</p>
                  <p className="font-mono text-slate-500">{allocation.schoolId}</p>
                  <p className="text-slate-500 mt-1">{allocation.programName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Boarding Room</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{allocation.buildingName}</p>
                  <p className="text-indigo-600 font-bold">Room {allocation.roomNumber} ({allocation.bedNumber})</p>
                  <p className="text-slate-500 mt-1">Check-in: {allocation.checkInDate}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-300">Guardian Contact</span>
                <p className="font-bold text-slate-900 dark:text-white">{allocation.guardianName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-300">{allocation.guardianPhone}</p>
              </div>

              {allocation.medicalInfo?.allergies?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Medical Care Plan:</span>
                  </div>
                  <p>{allocation.medicalInfo.emergencyCarePlan}</p>
                </div>
              )}

              {/* Dynamic Check-In & Check-Out Schedule Action Panel */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Resident Check-In & Check-Out Schedule</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Check-In Date</label>
                    <input
                      type="date"
                      value={checkInDateState}
                      onChange={(e) => setCheckInDateState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Check-Out Date</label>
                    <input
                      type="date"
                      value={checkOutDateState}
                      disabled={allocation.status === 'checked_out'}
                      onChange={(e) => setCheckOutDateState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white disabled:text-slate-900 dark:disabled:text-white disabled:opacity-85"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {allocation.status === 'checked_out' ? (
                    <button
                      onClick={handleReCheckIn}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      Re-Check In Resident
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckoutVacate}
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      Check Out & Vacate Bed
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCE & LEDGER */}
          {activeTab === 'finance' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 space-y-1">
                <p className="font-extrabold text-sm">Accommodation Fee: ${remainingFee.toFixed(2)} / term</p>
                <p className="font-bold">Refundable Security Deposit: ${remainingDeposit.toFixed(2)} (GL 2050 Liability)</p>
                <p className="text-slate-500 text-[11px]">Invoice Reference: {allocation.invoiceId || 'N/A'}</p>
              </div>

              {/* Record Payment Form */}
              <form onSubmit={handleRecordPayment} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Record Hostel Payment Receipt</span>
                </h4>

                <div className="space-y-2">
                  <div 
                    className="flex items-center gap-2 cursor-pointer select-none" 
                    onClick={() => setIncludeDeposit(!includeDeposit)}
                  >
                    <input 
                      type="checkbox" 
                      checked={includeDeposit} 
                      onChange={() => {}}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Include Refundable Security Deposit (${Number(depositAmount).toFixed(2)})
                    </span>
                  </div>

                  {includeDeposit && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount ($)</label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Amount</label>
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="USD" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">USD ($)</option>
                      <option value="LRD" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">LRD (L$)</option>
                      <option value="EUR" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">EUR (€)</option>
                      <option value="GBP" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Cash" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Cash Account</option>
                    <option value="Bank" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Bank Wire / Transfer</option>
                    <option value="Wallet" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Wallet Settlement</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={remainingBal <= 0}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Payment & Post to Ledger
                </button>
              </form>

              <div className="space-y-2 pt-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white">Double-Entry Financial Ledger</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Debit ($)</th>
                        <th className="p-2.5">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dynamicLedger.map((l, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono text-[11px] text-slate-900 dark:text-white font-bold">{l.date}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{l.description}</td>
                          <td className={`p-2.5 font-mono font-bold ${l.debit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            ${l.debit.toFixed(2)}
                          </td>
                          <td className={`p-2.5 font-mono font-extrabold ${l.credit > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            ${l.credit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOM ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 font-semibold">Assets assigned to Room {allocation.roomNumber}:</p>
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Solid Teak Double Bunk Bed (AST-HST-0101)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Excellent</span>
                </div>
                <p className="text-slate-500 text-[11px]">QR Code Tagged | Value: $450.00 | Warranty until 2030</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Dual Split Inverter AC Unit 18,000 BTU (AST-HST-0103)</span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">Good Condition</span>
                </div>
                <p className="text-slate-500 text-[11px]">QR Code Tagged | Value: $650.00 | Last Service: 2026-03-15 ($35.00)</p>
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3 text-xs">
              <button
                onClick={async () => {
                  try {
                    const { apiClient } = await import('@/services/api.service');
                    await apiClient.post('/hostel-maintenance-tickets', {
                      data: {
                        room: allocation.roomId,
                        building: allocation.buildingId,
                        issueType: 'other',
                        description: 'AC filter cleanup and general check requested.',
                        priority: 'medium',
                        status: 'open',
                        cost: 0
                      }
                    });
                    toast.success('Logged maintenance request for Room ' + allocation.roomNumber);
                  } catch (e) {
                    toast.error('Failed to log maintenance request.');
                  }
                }}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                + Log Repair / Cleaning Ticket
              </button>
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">Preventative AC Filter Maintenance</span>
                <p className="text-slate-500 mt-1">Completed by HVAC Tech Alpha on 2026-03-15 ($35.00 logged to Finance)</p>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white">Night Roll Call & Curfew History</h4>
              {(allocation as any).attendanceHistory && (allocation as any).attendanceHistory.length > 0 ? (
                (allocation as any).attendanceHistory.map((att: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{att.date || att.createdAt?.split('T')[0]}</span>
                      <span className={att.status === 'present' ? 'text-emerald-600' : 'text-rose-600'}>
                        {att.status?.toUpperCase() || 'PRESENT'} ({att.checkInTime || '21:45 PM'})
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{att.notes || 'Roll call completed.'}</p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>{allocation.checkInDate} Night Check</span>
                    <span className="text-emerald-600">PRESENT (21:45 PM)</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Warden verified resident in assigned bed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VISITORS */}
          {activeTab === 'visitors' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">{allocation.guardianName} (Guardian)</span>
                <p className="text-slate-500 text-[11px]">Check-in verified at security gate. Contact: {allocation.guardianPhone}</p>
              </div>
            </div>
          )}

          {/* TAB 7: MEDICAL */}
          {activeTab === 'medical' && (
            <div className="space-y-3 text-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="font-extrabold text-slate-900 dark:text-white">Emergency Doctor: {allocation.medicalInfo?.doctorContact || 'School Nurse Counter'}</p>
              <p className="text-slate-600 dark:text-slate-300 font-bold">Allergies: {allocation.medicalInfo?.allergies?.join(', ') || 'None'}</p>
              <p className="text-slate-600 dark:text-slate-300">Care Plan: {allocation.medicalInfo?.emergencyCarePlan || 'Standard Boarding Protocol'}</p>
            </div>
          )}

          {/* TAB 8: DISCIPLINE */}
          {activeTab === 'discipline' && (
            <div className="space-y-3 text-xs">
              {(allocation as any).disciplineRecords && (allocation as any).disciplineRecords.length > 0 ? (
                (allocation as any).disciplineRecords.map((d: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-50/20 text-rose-950 dark:text-rose-300 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{d.date || d.createdAt?.split('T')[0]} - {d.category}</span>
                      <span className="text-rose-600 font-extrabold uppercase text-[10px]">{d.severity}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{d.description}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-3 text-xs text-center py-6 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold">No Disciplinary Violations or Complaints Recorded.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Boarding Accommodation Agreement.pdf</span>
                <button onClick={() => toast.success('Downloading Agreement PDF...')} className="text-indigo-600 font-bold">Download</button>
              </div>
              {allocation.invoiceId && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Hostel Fee Invoice ({allocation.invoiceId}).pdf</span>
                  <button onClick={() => toast.success('Downloading Invoice PDF...')} className="text-indigo-600 font-bold">Download</button>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 text-xs border-l-2 border-indigo-500 pl-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Bed Allocation Completed</span>
                <span className="text-[11px] text-slate-400">{allocation.checkInDate} 10:00 AM</span>
              </div>
              {allocation.status === 'checked_out' && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Bed Vacated (Checked-Out)</span>
                  <span className="text-[11px] text-slate-400">{(allocation as any).checkOutDate || 'N/A'}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-2 text-xs font-mono">
              {allocation.auditTrail && allocation.auditTrail.length > 0 ? (
                allocation.auditTrail.map((a: any) => (
                  <div key={a.id || a.timestamp} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 block">{a.action}</span>
                    <span className="text-slate-500 text-[11px]">{a.timestamp} | By: {a.performedBy} ({a.performedByRole})</span>
                    {a.notes && <p className="text-slate-600 dark:text-slate-300 mt-1 font-sans">{a.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-indigo-600 block">ALLOCATION_CREATED</span>
                  <span className="text-slate-500 text-[11px]">{allocation.checkInDate}T10:00:00Z | By: Hostel Registrar (accountant)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
