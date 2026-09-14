'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Briefcase, ArrowRight, BookOpen, Users, Building2 } from 'lucide-react';
import type { DepartmentsGridSectionComponent, DepartmentEntity } from '../../../types/cms.types';
import { cmsService } from '../../../services/cms.service';

interface DepartmentsGridProps {
  data?: DepartmentsGridSectionComponent;
  initialDepartments?: DepartmentEntity[];
  locale?: string;
}

const FALLBACK_DEPTS: DepartmentEntity[] = [
  {
    id: 1,
    title: 'Faculty of Islamic Sciences & Qur\'an',
    slug: 'islamic-studies',
    headOfDepartment: 'Ustadh Ibrahim Al-Maliki',
    description: 'Dedicated to Qur\'anic memorization, Tajweed, Classical Arabic, Fiqh, and Islamic Ethics.',
  },
  {
    id: 2,
    title: 'Faculty of Pure & Applied Sciences',
    slug: 'sciences',
    headOfDepartment: 'Dr. Fatima Abdullah',
    description: 'Comprising state-of-the-art Biology, Chemistry, Physics, Mathematics, and Computer Science laboratories.',
  },
  {
    id: 3,
    title: 'Department of Languages & Linguistics',
    slug: 'languages',
    headOfDepartment: 'Mrs. Zainab Yilmaz',
    description: 'Excellence in English literature, Rhetoric, French, and Turkish foreign language acquisition.',
  },
  {
    id: 4,
    title: 'Faculty of Humanities & Commerce',
    slug: 'humanities',
    headOfDepartment: 'Mr. Abubakar Sadiq',
    description: 'Preparing students in Economics, Accounting, History, Geography, and Civic Leadership.',
  },
];

export function DepartmentsGridSection({ data, initialDepartments, locale = 'en' }: DepartmentsGridProps) {
  const [departments, setDepartments] = useState<DepartmentEntity[]>(initialDepartments || FALLBACK_DEPTS);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // 1024px is Tailwind's lg breakpoint, matching the 'abover lg' request
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  const title = data?.title || 'Specialized Departments & Faculties';
  const subtitle = data?.subtitle || 'Dedicated academic departments ensuring comprehensive subject mastery and mentorship';
  const limit = data?.limit || 4;

  useEffect(() => {
    if (initialDepartments && initialDepartments.length > 0) return;
    setLoading(true);
    cmsService.getDepartments(locale, limit).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setDepartments(fetched);
      }
      setLoading(false);
    });
  }, [locale, limit, initialDepartments]);

  const getHref = (slug: string) => {
    return locale === 'en' ? `/departments/${slug}` : `/${locale}/departments/${slug}`;
  };

  return (
    <section className="bg-gray-50/80 py-20 sm:py-28">
      <div key={isDesktop ? 'desktop' : 'mobile'} className="contents">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div 
            initial={isDesktop ? "hidden" : "visible"}
            whileInView="visible"
            variants={isDesktop ? { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } } : undefined}
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3">
              Academic Divisions
            </span>
            <h2 className="text-[clamp(1.5rem,2.29vw,2.75rem)] font-extrabold text-emerald-950 tracking-tight">
              {title}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg mt-2 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <Link
            href={locale === 'en' ? '/departments' : `/${locale}/departments`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-all self-start md:self-auto shrink-0"
          >
            <span>All Departments</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-gray-200 h-64 rounded-3xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial={isDesktop ? "hidden" : "visible"}
            whileInView="visible"
            variants={isDesktop ? containerVariants : undefined}
            viewport={{ once: true, amount: 0.1 }}
          >
            {departments.map((dept, idx) => (
              <motion.div
                key={idx}
                variants={isDesktop ? itemVariants : undefined}
                className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold shadow-xs border border-emerald-100 group-hover:bg-emerald-900 group-hover:text-amber-400 transition-colors">
                      <Building2 className="w-7 h-7" />
                    </div>
                    {dept.headOfDepartment && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        HOD: <strong className="text-emerald-950">{dept.headOfDepartment}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                    {dept.title}
                  </h3>

                  <div
                    className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: typeof dept.description === 'string' ? dept.description : 'Explore faculty curriculum, labs, and teaching staff.',
                    }}
                  />
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={getHref(dept.slug)}
                    className="inline-flex items-center gap-2 font-bold text-sm text-emerald-900 group-hover:text-amber-600 transition-colors"
                  >
                    <span>Explore Department & Faculty</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        </div>
      </div>
    </section>
  );
}
