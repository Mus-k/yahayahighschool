/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, User, DollarSign, Calendar, Clock, CheckCircle2, AlertCircle, 
  CreditCard, Smartphone, CheckSquare, Square
} from 'lucide-react';
import { hostelService } from '@/services/hostel.service';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';

interface VisitorInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: any | null;
  onSuccess?: () => void;
}

export function VisitorInspectionDrawer({ isOpen, onClose, visitor, onSuccess }: VisitorInspectionDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'timeline'>('overview');
  
  // Check-In / Out Local States
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('30');

  // Dynamic UI display charges
  const [displayDailyCharge, setDisplayDailyCharge] = useState(0);
  const [displayDeposit, setDisplayDeposit] = useState(0);

  // Paid Transaction History
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!visitor?.id) return;
    setLoadingPayments(true);
    try {
      const res = await apiClient.get('/hostel-payments', {
        params: {
          'filters[paymentNumber][$startsWith]': `PAY-VST-${visitor.id}`,
          sort: 'paymentDate:desc',
          'pagination[limit]': -1
        }
      });
      setPayments(res.data?.data || []);
    } catch (err) {
      console.warn('Failed to load visitor payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [visitor?.id]);

  useEffect(() => {
    if (isOpen && visitor?.id) {
      loadPayments();
      setDisplayDailyCharge(visitor.dailyChargeUSD ?? 0);
      setDisplayDeposit(visitor.securityDepositUSD ?? 0);
      setPaymentAmount(String(visitor.dailyChargeUSD || 0));
      setDepositAmount(String(visitor.securityDepositUSD || 0));
      setCheckInTime(visitor.checkIn ? new Date(visitor.checkIn).toISOString().slice(0, 16) : '');
      setCheckOutTime(visitor.checkOut ? new Date(visitor.checkOut).toISOString().slice(0, 16) : '');
    }
  }, [isOpen, visitor?.id, loadPayments]);

  if (!isOpen || !visitor) return null;

  const handleCheckIn = async () => {
    const checkInVal = checkInTime || new Date().toISOString();
    await hostelService.recordVisitorCheckIn(visitor.id, checkInVal);
    onSuccess?.();
    onClose();
  };

  const handleCheckOut = async () => {
    const checkOutVal = checkOutTime || new Date().toISOString();
    const depVal = Number(depositAmount) || 0;
    await hostelService.recordVisitorCheckOut(visitor.id, checkOutVal, includeDeposit, depVal);
    onSuccess?.();
    onClose();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    const depVal = Number(depositAmount) || 0;

    try {
      // 1. Post General Ledger Entry
      await hostelService.recordVisitorPayment(
        visitor.id,
        amt,
        currency,
        paymentMethod,
        includeDeposit,
        depVal
      );

      // 2. Create the Hostel Payment record in Strapi
      const seq = `PAY-VST-${visitor.id}-${Date.now()}`;
      await apiClient.post('/hostel-payments', {
        data: {
          paymentNumber: seq,
          amount: amt,
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString(),
          status: 'completed'
        }
      });

      // 3. Clear charges on the visitor record in Strapi
      await apiClient.put(`/hostel-visitors/${visitor.id}`, {
        data: {
          dailyCharge: 0,
          securityDeposit: 0
        }
      });

      toast.success('Visitor payment recorded and posted to General Ledger.');
      
      // Update UI local states immediately
      setDisplayDailyCharge(0);
      setDisplayDeposit(0);
      setPaymentAmount('0');
      setDepositAmount('0');
      setIncludeDeposit(false);

      // Reload local payments table
      await loadPayments();

      // Trigger parent component data refresh (so outer tables/center stats update)
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process visitor payment.');
    }
  };

  // Safe variables parsing
  const bName = visitor.building?.name || '';
  const fName = visitor.floor?.floorName || '';
  const rNo = visitor.room?.roomNumber || '';
  const bNo = visitor.bed?.bedNumber || '';
  const scopeParts = [];
  if (bName) scopeParts.push(bName);
  if (fName) scopeParts.push(fName);
  if (rNo) scopeParts.push(`Suite ${rNo}`);
  if (bNo) scopeParts.push(`Bed ${bNo}`);
  const assignedRoomStr = scopeParts.join(' • ') || visitor.assignedRoom || 'Not Assigned';

  const tabs = [
    { id: 'overview', label: 'Overview & Check-In/Out', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Finance & Payments', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline & History', icon: <Clock className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              {visitor.visitorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{visitor.visitorName}</h3>
              <span className="text-[11px] text-slate-500 font-mono">Guest Profile | ID: {visitor.idPassportNumber}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & CHECK-IN/OUT */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Guest Information</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{visitor.visitorName}</p>
                  <p className="font-mono text-slate-500">{visitor.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Assigned Lodging</span>
                  <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{assignedRoomStr}</p>
                  <p className="text-slate-500 mt-1">Host Scholar: {visitor.hostStudentName}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Check-In & Check-Out Schedule</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Check-In Date/Time</label>
                    <input
                      type="datetime-local"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Expected Check-Out Date/Time</label>
                    <input
                      type="datetime-local"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCheckIn}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    Check In Visitor
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    Check Out (Vacate)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCE & PAYMENTS */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 space-y-1">
                <p className="font-extrabold text-sm">Daily Accommodation Charge: ${displayDailyCharge.toFixed(2)} / day</p>
                <p className="font-bold">Refundable Security Deposit: ${displayDeposit.toFixed(2)} (GL 2050 Liability)</p>
              </div>

              {/* Record Payment Form */}
              <form onSubmit={handleRecordPayment} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Record Guest Payment Receipt</span>
                </h4>

                <div className="space-y-2">
                  <div 
                    className={`flex items-center gap-2 cursor-pointer select-none ${displayDeposit === 0 ? 'opacity-50 pointer-events-none' : ''}`} 
                    onClick={() => setIncludeDeposit(!includeDeposit)}
                  >
                    {includeDeposit ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Include Security Deposit (${displayDeposit.toFixed(2)})
                    </span>
                  </div>

                  {includeDeposit && displayDeposit > 0 && (
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
                      disabled={displayDailyCharge === 0 && displayDeposit === 0}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold font-mono text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Currency</label>
                    <select
                      value={currency}
                      disabled={displayDailyCharge === 0 && displayDeposit === 0}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white disabled:opacity-50"
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
                    disabled={displayDailyCharge === 0 && displayDeposit === 0}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="Cash" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Cash Account</option>
                    <option value="Bank" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Bank Wire / Transfer</option>
                    <option value="Wallet" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Wallet Settlement</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={displayDailyCharge === 0 && displayDeposit === 0}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all mt-2 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {displayDailyCharge === 0 && displayDeposit === 0 ? 'All Fees Fully Paid' : 'Record Payment & Post to Ledger'}
                </button>
              </form>

              {/* Payments History Table */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-850 dark:text-slate-250">Paid Transaction History</h5>
                {loadingPayments ? (
                  <p className="text-slate-400 text-xs">Loading payment history...</p>
                ) : payments.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-905">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Payment Ref</th>
                          <th className="p-2.5 text-right">Amount</th>
                          <th className="p-2.5">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payments.map((p: any) => {
                          const pNum = p.paymentNumber || p.id || '';
                          const displayRef = pNum.length > 20 ? pNum.slice(0, 12) + '...' + pNum.slice(-5) : pNum;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-805/50 transition-colors">
                              <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                                {new Date(p.paymentDate).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="p-2.5 font-mono text-slate-500" title={pNum}>{displayRef}</td>
                              <td className="p-2.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-right">
                                ${(p.amount || 0).toFixed(2)} USD
                              </td>
                              <td className="p-2.5">
                                <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                  {p.paymentMethod}
                                </span>
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
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 border-l-2 border-emerald-500 pl-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Visitor Registered</span>
                <span className="text-[10px] text-slate-400 font-mono">Purpose: {visitor.purpose}</span>
              </div>
              {visitor.checkIn && (
                <div>
                  <span className="font-bold text-emerald-600 block">Check-In Completed</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(visitor.checkIn).toLocaleString()}</span>
                </div>
              )}
              {visitor.checkOut && (
                <div>
                  <span className="font-bold text-rose-600 block">Check-Out Completed (Vacated)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(visitor.checkOut).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
