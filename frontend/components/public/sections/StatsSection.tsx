'use client';

import React from 'react';
import { Award, Users, BookOpen, GraduationCap, Trophy, CheckCircle } from 'lucide-react';
import type { StatsSectionComponent, StatItem } from '../../../types/cms.types';

interface StatsProps {
  data?: StatsSectionComponent;
}

export function StatsSection({ data }: StatsProps) {
  const title = data?.title || 'Academic & Moral Excellence in Numbers';
  const subtitle = data?.subtitle || 'A proven track record of distinction, leadership, and ethical discipline';
  const statsList: StatItem[] = data?.statsList && data.statsList.length > 0 ? data.statsList : [
    { number: '100%', label: 'University Acceptance Rate', icon: 'graduation-cap' },
    { number: '1,200+', label: 'Active Enrolled Students', icon: 'users' },
    { number: '30+', label: 'Hafiz Qur\'an Graduates Annually', icon: 'book-open' },
    { number: '1:12', label: 'Dedicated Teacher-Student Ratio', icon: 'award' },
  ];

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-8 h-8 text-amber-500" />;
      case 'book-open':
        return <BookOpen className="w-8 h-8 text-emerald-600" />;
      case 'award':
        return <Award className="w-8 h-8 text-amber-500" />;
      case 'trophy':
        return <Trophy className="w-8 h-8 text-amber-500" />;
      default:
        return <GraduationCap className="w-8 h-8 text-emerald-600" />;
    }
  };

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-3 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {statsList.map((stat, idx) => (
            <div
              key={idx}
              className="bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-8 border border-emerald-100 shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform border border-emerald-100">
                {getIcon(stat.icon)}
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-2 font-mono">
                {stat.number}
              </span>
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
