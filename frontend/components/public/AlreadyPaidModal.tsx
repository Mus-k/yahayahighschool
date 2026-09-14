'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AlreadyPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlreadyPaidModal({ isOpen, onClose }: AlreadyPaidModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 overflow-y-auto">
          <div className="flex justify-center gap-4 mb-8">
            <button className="px-6 py-2 rounded-full border border-[#048ED6] text-[#048ED6] font-medium text-sm hover:bg-sky-50 transition-colors">
              Pay Online
            </button>
            <button className="px-6 py-2 rounded-full bg-[#048ED6] text-white font-medium text-sm hover:bg-sky-500 transition-colors shadow-sm">
              Already Paid
            </button>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-left">Enroll Now</h2>

          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400"
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="tel" 
                placeholder="Phone" 
                className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400"
              />
              <input 
                type="text" 
                placeholder="Country" 
                className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <input 
              type="text" 
              placeholder="Inquiry Topic" 
              className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400"
            />

            <textarea 
              rows={4}
              placeholder="Your Message" 
              className="w-full px-5 py-4 rounded-xl border border-sky-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-gray-700 placeholder:text-gray-400 resize-none"
            />

            <button 
              type="button"
              className="w-full py-4 bg-[#048ED6] text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-md mt-2"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
