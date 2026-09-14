'use client';

import React, { useState } from 'react';
import { X, KeyRound, QrCode, UserCheck, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { hostelService } from '@/services/hostel.service';
import type { GuestVisitorProfile } from '@/types/enterprise.types';
import { toast } from 'sonner';

interface GuestHostelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (guest: GuestVisitorProfile) => void;
}

export function GuestHostelModal({ isOpen, onClose, onSuccess }: GuestHostelModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [idPassportNumber, setIdPassportNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Academic Conference Visitor');
  const [hostStudentName, setHostStudentName] = useState('Tariq Ibrahim Mansour');
  const [assignedRoomNumber, setAssignedRoomNumber] = useState('Guest Suite 101');
  const [dailyChargeUSD, setDailyChargeUSD] = useState('50.00');
  const [depositUSD, setDepositUSD] = useState('30.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGuest, setCreatedGuest] = useState<GuestVisitorProfile | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      toast.error('Please enter visitor name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const guest = await hostelService.createGuestStay({
        visitorName: visitorName.trim(),
        idPassportNumber: idPassportNumber.trim() || 'PASS-990012',
        phone: phone.trim() || '+231 886 000 111',
        purpose: purpose.trim(),
        hostStudentName,
        assignedRoomNumber,
        dailyChargeUSD: parseFloat(dailyChargeUSD) || 50.00,
        securityDepositUSD: parseFloat(depositUSD) || 30.00
      });
      setCreatedGuest(guest);
      if (onSuccess) onSuccess(guest);
    } catch {
      toast.error('Failed to register guest stay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 overflow-hidden">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Guest Hostel & Visitor Portal</h3>
              <p className="text-xs text-slate-500">Short Stay Billing, Security Deposits & QR Badges</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!createdGuest ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                placeholder="Dr. Amina Sylla"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Passport / National ID</label>
                <input
                  type="text"
                  placeholder="PASS-881920"
                  value={idPassportNumber}
                  onChange={(e) => setIdPassportNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+231 886 112 233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  placeholder="Academic Conference Visitor"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Host Scholar / Dept</label>
                <input
                  type="text"
                  value={hostStudentName}
                  onChange={(e) => setHostStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Guest Suite</label>
              <input
                type="text"
                value={assignedRoomNumber}
                onChange={(e) => setAssignedRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Room Charge ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dailyChargeUSD}
                  onChange={(e) => setDailyChargeUSD(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Security Deposit ($ GL 2050)</label>
                <input
                  type="number"
                  step="0.01"
                  value={depositUSD}
                  onChange={(e) => setDepositUSD(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Registering Guest...' : 'Register Stay & Post GL'}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Guest Registered & Gate Pass Issued!</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{createdGuest.visitorNumber}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">Guest: {createdGuest.visitorName}</p>
              <p className="text-slate-500">Suite: {createdGuest.assignedRoomNumber}</p>
              <p className="text-slate-500 font-mono">Pass Code: {createdGuest.qrGatePassCode}</p>
              <p className="text-emerald-600 font-bold">Daily Fee: ${createdGuest.dailyChargeUSD.toFixed(2)} | Deposit: ${createdGuest.securityDepositUSD.toFixed(2)} (GL 2050)</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
