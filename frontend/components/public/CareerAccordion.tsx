'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Clock, MapPin, GraduationCap, Briefcase } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  type: string;
  location: string;
  requirements: string[];
  responsibilities: string[];
}

interface CareerAccordionProps {
  positions: Position[];
}

export function CareerAccordion({ positions }: CareerAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(positions[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {positions.map((pos) => {
        const isOpen = openId === pos.id;
        return (
          <div 
            key={pos.id} 
            className="bg-[#f8fcfb] rounded-2xl border border-sky-100 overflow-hidden transition-all duration-300"
          >
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif">{pos.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{pos.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{pos.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggle(pos.id)}
                  className="px-6 py-2.5 rounded-full border border-[#048ED6] text-[#048ED6] text-sm font-bold flex items-center gap-2 hover:bg-sky-50 transition-colors bg-white"
                >
                  <span>View Details</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button 
                  className="px-6 py-2.5 rounded-full bg-[#048ED6] text-white text-sm font-bold flex items-center gap-2 hover:bg-sky-500 transition-colors shadow-sm"
                  onClick={() => {
                    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Content */}
            {isOpen && (
              <div className="px-6 pb-6 pt-2 border-t border-sky-100/50 bg-[#f8fcfb]">
                <div className="grid md:grid-cols-2 gap-8 mt-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#048ED6] font-bold mb-4">
                      <GraduationCap className="w-5 h-5" />
                      <h4>Requirements</h4>
                    </div>
                    <ul className="space-y-3">
                      {pos.requirements.map((req, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-600">
                          <div className="w-4 h-4 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px]">✓</span>
                          </div>
                          <span className="leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[#048ED6] font-bold mb-4">
                      <Briefcase className="w-5 h-5" />
                      <h4>Responsibilities</h4>
                    </div>
                    <ul className="space-y-3">
                      {pos.responsibilities.map((res, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-600">
                          <div className="w-4 h-4 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px]">✓</span>
                          </div>
                          <span className="leading-relaxed">{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
