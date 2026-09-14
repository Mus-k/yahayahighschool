'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import type { FaqEntity } from '@/types/cms.types';

export function FaqAccordion({ faqs }: { faqs: FaqEntity[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        
        return (
          <div 
            key={faq.id} 
            className={`bg-white rounded-2xl border transition-all duration-300 ${
              isOpen ? 'border-[#048ED6] shadow-md' : 'border-gray-200 hover:border-[#BCD5EE] hover:shadow-sm'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleAccordion(faq.id)}
              className="w-full flex items-start justify-between gap-4 p-6 text-left"
              aria-expanded={isOpen}
            >
              <h3 className="text-[1.1rem] sm:text-lg font-bold text-[#111C2D] flex items-start gap-3">
                <HelpCircle className={`w-[22px] h-[22px] shrink-0 mt-0.5 transition-colors duration-300 ${isOpen ? 'text-[#048ED6]' : 'text-gray-400'}`} />
                <span className="leading-snug">{faq.question}</span>
              </h3>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-[#E6F0FB] text-[#048ED6]' : 'bg-gray-50 text-gray-400'}`}>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            <div 
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-6 px-6 pl-[3.25rem] text-[#545F73] text-[0.95rem] leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </div>
                {faq.category && (
                  <div className="pb-6 pl-[3.25rem]">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F0FB] text-[#048ED6] border border-[#BCD5EE]">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
