'use client';

import React from 'react';
import { BookOpen, ShieldCheck, Microscope, HeartHandshake, Globe, Award } from 'lucide-react';
import type { FeatureCardsSectionComponent, FeatureCardItem } from '../../../types/cms.types';

interface FeatureCardsProps {
  data?: FeatureCardsSectionComponent;
}

export function FeatureCardsSection({ data }: FeatureCardsProps) {
  const title = data?.title || 'The YAHAYASCOOL Advantage';
  const subtitle = data?.subtitle || 'Why discerning parents choose our institution for their children\'s intellectual and spiritual growth';
  const cards: FeatureCardItem[] = data?.cards && data.cards.length > 0 ? data.cards : [
    {
      title: 'Rigorous Dual Curriculum',
      description: 'Mastery of Cambridge & National Western Sciences alongside structured Islamic Fiqh, Hadith, and Classical Arabic.',
      icon: 'book',
    },
    {
      title: 'Tahfidz Al-Qur\'an Program',
      description: 'Guided 3-year memorization track enabling high school students to become certified Hafiz of the Holy Qur\'an.',
      icon: 'award',
    },
    {
      title: 'Modern STEM & Laboratories',
      description: 'State-of-the-art Robotics, Physics, Chemistry, and ICT labs fostering innovation and analytical problem solving.',
      icon: 'microscope',
    },
    {
      title: 'Islamic Moral & Ethical Discipline',
      description: 'A protected, spiritually uplifting campus environment instilling God-consciousness (Taqwa), respect, and leadership.',
      icon: 'shield',
    },
    {
      title: 'Global University Preparation',
      description: 'Tailored SAT, IELTS, and university placement guidance connecting graduates with top institutions worldwide.',
      icon: 'globe',
    },
    {
      title: 'Sadaqah Jariyah & Waqf Ecosystem',
      description: 'Built upon enduring Islamic endowment principles, ensuring continuous investment in facilities and orphan scholarships.',
      icon: 'heart',
    },
  ];

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'microscope':
        return <Microscope className="w-7 h-7 text-emerald-600" />;
      case 'shield':
        return <ShieldCheck className="w-7 h-7 text-amber-500" />;
      case 'globe':
        return <Globe className="w-7 h-7 text-emerald-600" />;
      case 'heart':
        return <HeartHandshake className="w-7 h-7 text-amber-500" />;
      case 'award':
        return <Award className="w-7 h-7 text-amber-500" />;
      default:
        return <BookOpen className="w-7 h-7 text-emerald-600" />;
    }
  };

  return (
    <section className="bg-gray-50/70 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3">
            Our Core Pillars
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-900 group-hover:text-white transition-colors border border-emerald-100">
                  {getIcon(card.icon)}
                </div>
                <h3 className="text-xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-base sm:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
              
              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
                <span>Learn More</span>
                <span className="text-amber-500 text-lg leading-none">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
