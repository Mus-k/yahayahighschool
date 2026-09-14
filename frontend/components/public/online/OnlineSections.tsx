'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { LeafImage } from '@/components/public/shared/LeafImage';
import { EnrollmentModal } from '@/components/public/online/EnrollmentModal';
import { useTranslations } from 'next-intl';
import type { OnlineLearningPageEntity, OnlineCourseEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

const FALLBACK_COURSES = [
  {
    title: 'Advanced Arabic Grammar', tag: 'Languages • Advanced', badge: 'New Release',
    image: '/images/figma-home/13.png', price: 500,
    desc: 'An intensive study into classical Nahw and Sarf for profound textual understanding.'
  },
  {
    title: 'Tajweed Foundations', tag: 'Qur’an • Beginner', badge: 'New Release',
    image: '/images/figma-home/17.png', price: 500,
    desc: 'Articulation and rhythm taught from first principles, corrected one to one.'
  },
  {
    title: 'Islamic History', tag: 'Humanities • Intermediate', badge: 'New Release',
    image: '/images/figma-home/07-activity.png', price: 500,
    desc: 'The major periods and figures, read through primary sources rather than summaries.'
  },
  {
    title: 'English for Academic Study', tag: 'Languages • Intermediate', badge: 'New Release',
    image: '/images/figma-home/09.png', price: 500,
    desc: 'Speaking, writing, and listening built around the demands of academic work.'
  },
  {
    title: 'Qur’anic Arabic', tag: 'Qur’an • Intermediate', badge: 'New Release',
    image: '/images/figma-home/19.png', price: 500,
    desc: 'Vocabulary and syntax drawn directly from the text, taught verse by verse.'
  },
  {
    title: 'Fiqh Essentials', tag: 'Islamic Studies • Beginner', badge: 'New Release',
    image: '/images/figma-home/03-programs.jpeg', price: 500,
    desc: 'Practical jurisprudence for daily life, with evidence given for every ruling.'
  },
];

export function OnlineLearning({
  locale = 'en',
  pageData,
  courses,
}: {
  locale?: string;
  pageData?: OnlineLearningPageEntity | null;
  courses?: OnlineCourseEntity[];
}) {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const t = useTranslations('onlineLearningPage');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const breadcrumbHome = t('breadcrumbHome');
  const breadcrumbOnline = pageData?.breadcrumbTitle || t('breadcrumbOnline');
  const tagline = pageData?.tagline || t('tagline');
  const headlineLine1 = pageData?.headlineLine1 || t('headline_1');
  const headlineLine2 = pageData?.headlineLine2 || t('headline_2');
  const lede = pageData?.lede || t('lede');
  const liveLessonText = pageData?.liveLessonButtonText || t('liveLesson');
  const liveLessonUrl = pageData?.liveLessonButtonUrl || '#';
  const heroImageUrl = pageData?.heroImage ? (getStrapiMediaUrl(pageData.heroImage) || '/images/figma-home/09.png') : '/images/figma-home/09.png';

  // Course list
  const displayCourses: OnlineCourseEntity[] = (courses && courses.length > 0)
    ? courses
    : FALLBACK_COURSES.map((c, i) => ({
        id: i + 1,
        title: t(`coursesList.${i}.title`, { default: c.title }),
        tag: t(`coursesList.${i}.tag`, { default: c.tag }),
        badge: t(`coursesList.${i}.badge`, { default: c.badge }),
        description: t(`coursesList.${i}.desc`, { default: c.desc }),
        price: c.price,
        order: i + 1,
        enrollmentOpen: true,
      }));

  const defaultJoinText = pageData?.joinEnrollmentButtonText || t('joinEnrollment');

  const joinBtn =
    'inline-flex h-[clamp(2.25rem,2.4vw,2.875rem)] items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(0.875rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]';

  const handleOpenEnrollment = (courseTitle?: string) => {
    if (courseTitle) {
      setSelectedCourse(courseTitle);
    } else if (displayCourses.length > 0) {
      setSelectedCourse(displayCourses[0].title);
    }
    setEnrollOpen(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="w-full bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center md:gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) lg:grid-cols-[minmax(0,932fr)_minmax(0,704fr)]">
          <div className="min-w-0 py-[clamp(1.5rem,3.6vw,4.4rem)]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
              <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{breadcrumbHome}</Link>
              <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
              <span className="text-[#048ED6]">{breadcrumbOnline}</span>
            </nav>

            <p className="mt-[clamp(1.5rem,2.6vw,3.1rem)] font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
              {tagline}
            </p>

            <h1 className="mt-[clamp(0.75rem,1.35vw,1.625rem)] font-serif leading-[1.11] text-[clamp(1.75rem,2.81vw,3.375rem)]">
              <span className="block text-[#121C2A]">{headlineLine1}</span>
              <span className="block text-[#048ED6]">{headlineLine2}</span>
            </h1>

            <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[24rem] leading-[1.6] text-[#5A636D] text-[1rem]">
              {lede}
            </p>

            <div className="relative inline-flex mt-[clamp(1.5rem,2.4vw,2.9rem)] group">
              <button
                type="button"
                onClick={() => handleOpenEnrollment()}
                className={`${joinBtn} !mt-0 relative z-10 shadow-lg hover:shadow-[#048ED6]/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>{liveLessonText}</span>
                <ArrowRight className="h-3 w-3 rtl:-scale-x-100 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="w-full max-lg:hidden mt-[-10px] h-[calc(100%+10px)]">
            <LeafImage src={heroImageUrl} alt="Students working together in class" />
          </div>
          <div className="w-full lg:hidden">
            <img src={heroImageUrl} alt="Students working together in class" className="aspect-[704/532] w-full rounded-lg object-cover" />
          </div>
        </div>
      </section>

      {/* Course catalogue */}
      <section className="w-full bg-white pt-[clamp(2rem,3.1vw,3.75rem)]">
        <div className="mx-auto max-w-[1920px] px-(--spacing-side) pb-[clamp(2.5rem,4vw,4.8rem)]">
          <div className="grid grid-cols-1 gap-[clamp(1rem,2.1vw,2.5rem)] lg:grid-cols-2">
            {displayCourses.map((c, idx) => {
              const courseImageUrl = c.image ? (getStrapiMediaUrl(c.image) || FALLBACK_COURSES[idx % FALLBACK_COURSES.length]?.image || '/images/figma-home/13.png') : (FALLBACK_COURSES[idx % FALLBACK_COURSES.length]?.image || '/images/figma-home/13.png');
              return (
                <article
                  onClick={() => handleOpenEnrollment(c.title)}
                  key={c.id || idx}
                  className="cursor-pointer group grid grid-cols-[minmax(0,240fr)_minmax(0,560fr)] overflow-hidden rounded-lg border border-[#EDEFF2] bg-white shadow-sm max-sm:grid-cols-1 hover:border-[#048ED6]/40 transition-all duration-300"
                >
                  <div className="h-full w-full overflow-hidden">
                    <img
                      src={courseImageUrl}
                      alt={c.title}
                      className="h-full w-full object-cover max-sm:aspect-[16/10] lg:group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex flex-col p-[clamp(1rem,1.35vw,1.625rem)]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.1em] text-[#048ED6] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
                        {c.tag || 'Online Course'}
                      </span>
                      {c.badge && (
                        <span className="shrink-0 rounded bg-[#E1EFF6] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-[#048ED6] text-[clamp(0.5rem,0.52vw,0.625rem)]">
                          {c.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 mb-2">
                      <h2 className="mt-[clamp(0.375rem,0.52vw,0.625rem)] font-serif text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)]">
                        {c.title}
                      </h2>
                      <p className="mt-2 leading-[1.6] text-[#5A636D] text-[1rem]">
                        {c.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between">
                      {c.price ? (
                        <span className="font-serif font-bold text-[#121C2A] text-[1.125rem]">
                          ${c.price}
                        </span>
                      ) : <span />}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEnrollment(c.title);
                        }}
                        className={`${joinBtn} cursor-pointer`}
                      >
                        {c.buttonText || defaultJoinText}
                        <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enrollment Popup Modal */}
      <EnrollmentModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        selectedCourse={selectedCourse}
        courses={displayCourses}
        pageData={pageData}
        defaultAmount={pageData?.popupDefaultAmount || 500}
        currencies={pageData?.popupCurrencies ? pageData.popupCurrencies.split(',').map(s => s.trim()) : undefined}
        note={pageData?.popupNote}
      />
    </>
  );
}
