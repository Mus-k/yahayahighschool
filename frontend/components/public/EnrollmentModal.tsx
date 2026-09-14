'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollmentModal({ isOpen, onClose }: EnrollmentModalProps) {
  const [tab, setTab] = useState<'pay' | 'alreadyPaid'>('pay');

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Top Close Button (floating outside the border box) */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-[#048ED6] text-white rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pt-12 flex flex-col items-center">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setTab('pay')}
              className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${
                tab === 'pay' 
                  ? 'bg-[#048ED6] text-white shadow-md' 
                  : 'bg-white text-[#048ED6] border border-[#048ED6] hover:bg-sky-50'
              }`}
            >
              Pay Online
            </button>
            <button 
              onClick={() => setTab('alreadyPaid')}
              className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${
                tab === 'alreadyPaid' 
                  ? 'bg-[#048ED6] text-white shadow-md' 
                  : 'bg-white text-[#048ED6] border border-[#048ED6] hover:bg-sky-50'
              }`}
            >
              Already Paid
            </button>
          </div>

          {/* Form Box */}
          <div className="w-full border border-[#048ED6] rounded-2xl overflow-hidden bg-white">
            <div className="bg-[#048ED6] text-white text-center py-4 font-bold text-lg">
              {tab === 'pay' ? 'Pay Online' : 'Verify Payment'}
            </div>
            
            <div className="p-8 space-y-6">
              
              {tab === 'pay' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-gray-900 font-bold">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-medium">$</span>
                      <input 
                        type="text" 
                        defaultValue="500"
                        className="w-full lg:w-[150px] pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#048ED6] focus:border-transparent text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-900 font-bold">Currency</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#048ED6] appearance-none bg-white text-gray-700">
                      <option>USD - US Dollar</option>
                      <option>EUR - Euro</option>
                      <option>GBP - British Pound</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-900 font-bold">Course Selection</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#048ED6] appearance-none bg-white text-gray-700 text-sm sm:text-base">
                      <option>English (speaking, Writting, and Listening)</option>
                      <option>Advanced Arabic Grammar</option>
                      <option>Qur'an Memorization (Hifz)</option>
                    </select>
                  </div>

                  <button className="w-full py-4 bg-[#048ED6] text-white font-bold rounded-xl hover:bg-sky-500 transition-colors flex items-center justify-center gap-2 mt-4 shadow-md">
                    <Lock className="w-5 h-5" />
                    <span>Pay Securely Now</span>
                  </button>

                  <p className="text-center text-gray-400 text-base mt-4">
                    Your payment is safe, secure and encrypted.
                  </p>
                </>
              ) : (
                <>
                   <div className="space-y-2">
                    <label className="block text-gray-900 font-bold">Transaction ID / Receipt Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TXN-123456789"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#048ED6] focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-900 font-bold">Course Selection</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#048ED6] appearance-none bg-white text-gray-700 text-sm sm:text-base">
                      <option>English (speaking, Writting, and Listening)</option>
                      <option>Advanced Arabic Grammar</option>
                      <option>Qur'an Memorization (Hifz)</option>
                    </select>
                  </div>

                  <button className="w-full py-4 bg-[#048ED6] text-white font-bold rounded-xl hover:bg-sky-500 transition-colors flex items-center justify-center mt-4 shadow-md">
                    <span>Verify & Request Access</span>
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
