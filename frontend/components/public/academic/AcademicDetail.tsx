import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import type { SchoolAcademicProgramEntity, ProgramEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';
import { useTranslations, useLocale } from 'next-intl';

export function ProgramHero({ program }: { program: SchoolAcademicProgramEntity | ProgramEntity }) {
  const locale = useLocale();
  const t = useTranslations('academicDetail.hero');
  const tp = useTranslations('academicPage');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const p = program as SchoolAcademicProgramEntity;

  const getFallback = (key: string, defaultText: string) => {
    try {
      const res = tp(`programsList.${p.slug}.${key}`);
      return res.includes('programsList.') ? defaultText : res;
    } catch {
      return defaultText;
    }
  };

  const eyebrow = p.eyebrow || getFallback('eyebrow', 'Academic Excellence');
  const headline1 = p.headlineLine1 || p.title || getFallback('title', p.slug);
  const headline2 = p.headlineLine2 || t('headline_2');
  const lede = p.description || p.shortDescription || getFallback('lede', 'Explore our comprehensive program designed to nurture academic excellence and moral character in a supportive environment.');
  const heroImage = p.coverImage ? (getStrapiMediaUrl(p.coverImage) || '/images/figma-home/09.png') : '/images/figma-home/09.png';

  const primaryBtnText = p.primaryButtonText || t('contactUs');
  const primaryBtnUrl = p.primaryButtonUrl || href('/contact');

  const downloadPdfUrl = p.downloadPdf ? getStrapiMediaUrl(p.downloadPdf) : null;
  const downloadBtnText = p.downloadButtonText || t('downloadPdf');

  return (
    <section className="w-full bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) py-[clamp(2.5rem,4.7vw,5.6rem)] lg:grid-cols-[minmax(0,818fr)_minmax(0,820fr)]">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{t('home')}</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            <Link href={href('/programs')} className="text-[#048ED6] transition-opacity hover:opacity-80">{t('academics')}</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            <span className="text-[#048ED6]">{p.title || t('details')}</span>
          </nav>

          <span className="mt-[clamp(1.75rem,3.4vw,4.1rem)] inline-flex h-[clamp(1.5rem,1.56vw,1.875rem)] items-center gap-2 rounded-full bg-[#E1EFF6] px-3 font-semibold uppercase tracking-[0.14em] text-[#048ED6] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
            <BookOpen className="h-3 w-3" aria-hidden />
            {eyebrow}
          </span>

          <h1 className="mt-[clamp(0.75rem,1.15vw,1.375rem)] font-serif leading-[1.09] max-sm:leading-tight text-[clamp(1.5rem,2.29vw,2.75rem)]">
            <span className="block text-[#121C2A]">{headline1}</span>
            <span className="block text-[#048ED6]">{headline2}</span>
          </h1>

          <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[32rem] leading-[1.6] text-[#5A636D] text-[1rem]">
            {lede}
          </p>

          <div className="mt-[clamp(1.5rem,2.5vw,3rem)] flex flex-wrap items-center gap-[clamp(0.75rem,1vw,1.25rem)]">
            <Link
              href={primaryBtnUrl}
              className="inline-flex h-[clamp(2.75rem,3.33vw,4rem)] items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(1.25rem,1.77vw,2.125rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.8125rem,0.94vw,1.125rem)]"
            >
              {primaryBtnText}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>

            {downloadPdfUrl ? (
              <a
                href={downloadPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[clamp(2.75rem,3.33vw,4rem)] items-center gap-2 rounded-full border border-[#048ED6] bg-white px-[clamp(1.25rem,1.77vw,2.125rem)] font-semibold text-[#048ED6] transition-colors hover:bg-[#EAF5FD] text-[clamp(0.8125rem,0.94vw,1.125rem)]"
              >
                {downloadBtnText}
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={href('/contact')}
                className="inline-flex h-[clamp(2.75rem,3.33vw,4rem)] items-center gap-2 rounded-full border border-[#048ED6] bg-white px-[clamp(1.25rem,1.77vw,2.125rem)] font-semibold text-[#048ED6] transition-colors hover:bg-[#EAF5FD] text-[clamp(0.8125rem,0.94vw,1.125rem)]"
              >
                {downloadBtnText}
                <Download className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="w-full">
          <img
            src={heroImage}
            alt={p.title || ''}
            className="aspect-[820/605] w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export function ProgramPathway({ program }: { program: SchoolAcademicProgramEntity | ProgramEntity }) {
  const tp = useTranslations('academicPage');

  const p = program as SchoolAcademicProgramEntity;

  const getFallback = (key: string, defaultText: string) => {
    try {
      const res = tp(`programsList.${p.slug}.${key}`);
      return res.includes('programsList.') ? defaultText : res;
    } catch {
      return defaultText;
    }
  };

  const pathwayTitle = p.pathwayTitle || getFallback('pathwayTitle', 'The Learning Pathway');
  const pathwayDescription = p.pathwayDescription || getFallback('pathwayLede', 'Our curriculum is structured to guide students step-by-step towards mastery, ensuring deep understanding and practical application.');

  const steps = (p.pathwaySteps && p.pathwaySteps.length > 0)
    ? p.pathwaySteps.map((s, idx) => ({
        title: s.title,
        desc: s.description,
      }))
    : [0, 1, 2, 3].map((_, idx) => ({
        title: getFallback(`steps.${idx}.title`, `Stage ${idx + 1} Progression`),
        desc: getFallback(`steps.${idx}.desc`, 'Building foundational skills and advancing through structured, interactive learning modules tailored for success.'),
      }));

  const imageTall = p.pathwayImageLeft
    ? (getStrapiMediaUrl(p.pathwayImageLeft) || '/images/figma-home/17.png')
    : (p.pathwayImages?.[0] ? (getStrapiMediaUrl(p.pathwayImages[0]) || '/images/figma-home/17.png') : '/images/figma-home/17.png');

  const imageTop = p.pathwayImageTop
    ? (getStrapiMediaUrl(p.pathwayImageTop) || '/images/figma-home/09.png')
    : (p.pathwayImages?.[1] ? (getStrapiMediaUrl(p.pathwayImages[1]) || '/images/figma-home/09.png') : '/images/figma-home/09.png');

  const imageBottom = p.pathwayImageBottom
    ? (getStrapiMediaUrl(p.pathwayImageBottom) || '/images/figma-home/13.png')
    : (p.pathwayImages?.[2] ? (getStrapiMediaUrl(p.pathwayImages[2]) || '/images/figma-home/13.png') : '/images/figma-home/13.png');

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(1.5rem,4.7vw,5.6rem)]">
        <div className="mx-auto grid max-w-[72rem] grid-cols-1 gap-[clamp(2rem,3.6vw,4.4rem)] lg:grid-cols-2">
          <div className="min-w-0">
            <span className="block h-1 w-[clamp(2rem,2.6vw,3.125rem)] rounded bg-[#048ED6]" />

            <h2 className="mt-[clamp(0.75rem,1.15vw,1.375rem)] font-serif text-[#121C2A] text-[clamp(1.375rem,1.77vw,2.125rem)]">
              {pathwayTitle}
            </h2>

            <p className="mt-[clamp(0.75rem,1.15vw,1.375rem)] leading-[1.7] text-[#5A636D] text-[1rem]">
              {pathwayDescription}
            </p>

            <ul className="mt-[clamp(1.25rem,2.08vw,2.5rem)] space-y-[clamp(1rem,1.35vw,1.625rem)]">
              {steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle2 className="mt-[0.2em] h-4 w-4 shrink-0 text-[#048ED6]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[#121C2A] text-[clamp(0.9375rem,1.04vw,1.25rem)]">
                      {step.title}
                    </span>
                    <span className="mt-1 block leading-[1.6] text-[#5A636D] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                      {step.desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Collage: one tall panel beside two stacked ones */}
          <div className="grid grid-cols-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
            <img
              src={imageTall}
              alt="Program pathway overview"
              className="h-full w-full rounded-lg object-cover"
            />
            <div className="grid grid-rows-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
              <img
                src={imageTop}
                alt="Classroom in action"
                className="h-full w-full rounded-lg object-cover"
              />
              <img
                src={imageBottom}
                alt="Students studying"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
