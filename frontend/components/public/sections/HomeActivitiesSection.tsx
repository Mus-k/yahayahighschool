'use client';

import React, { useCallback, useRef } from 'react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Home — activities. Implemented from Figma node 552-886 (frame 1920×1080).
 *
 * Design reference values (at the 1920 frame):
 *   heading 36/42 · sub 18/24 · CTA 140×43 #048ED6
 *   side cards ~490×345 (2 per side) · centre image 616×355
 *   faint Islamic geometric pattern behind everything
 *
 * Scroll animation (lg and up only — --breakpoint-lg is 1281px):
 * the section is 260vh tall with a pinned h-screen stage inside. Scroll
 * progress 0→1 is written to the section as the CSS custom property --p,
 * and every transform below is derived from it in plain CSS. Writing a
 * custom property instead of React state keeps this off the render path —
 * no component re-renders while scrolling.
 *
 * At --p 0 all transforms resolve to identity, so below lg (where the
 * media query never applies and --p stays 0) this is a plain static grid.
 */

// Moved inside component to use translations
// const CARDS = [
//   { key: 'lt', title: 'Mosque Activities', image: '/images/figma-home/09.png' },
//   { key: 'lb', title: 'Public Speaking', image: '/images/figma-home/17.png' },
//   { key: 'rt', title: 'Arts & Creativity', image: '/images/figma-home/07-activity.png' },
//   { key: 'rb', title: 'Arts & Creativity', image: '/images/figma-home/13.png' },
// ] as const;

import type { HomepageEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

function Card({ card }: { card: { key: string; title: string; image: string } }) {
  return (
    <div className={`act-card act-${card.key} relative w-full aspect-[490/345] rounded-lg overflow-hidden`}>
      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
      <span className="absolute inset-0 bg-black/25 pointer-events-none" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
      <span className="absolute left-5 bottom-4 right-5 text-white font-semibold text-[clamp(0.9375rem,0.94vw,1.125rem)] drop-shadow">
        {card.title}
      </span>
    </div>
  );
}

interface HomeActivitiesSectionProps {
  data?: HomepageEntity | null;
  locale?: string;
}

export function HomeActivitiesSection({ data, locale = 'en' }: HomeActivitiesSectionProps) {
  const t = useTranslations('homeActivities');
  const sectionRef = useRef<HTMLElement>(null);

  const heading = data?.activitiesHeading || t('heading');
  const subtitle = data?.activitiesSubtitle || t('subtitle');
  const ctaText = data?.activitiesCtaText || t('joinUs');
  const ctaUrl = data?.activitiesCtaUrl || '/gallery';
  const centerImage = getStrapiMediaUrl(data?.activitiesCenterImage?.url) || '/images/figma-home/19.png';

  const defaultCards = [
    { key: 'lt', title: t('mosqueActivities'), image: '/images/figma-home/09.png' },
    { key: 'lb', title: t('publicSpeaking'), image: '/images/figma-home/17.png' },
    { key: 'rt', title: t('artsCreativity'), image: '/images/figma-home/07-activity.png' },
    { key: 'rb', title: t('artsCreativity'), image: '/images/figma-home/13.png' },
  ];

  const keys = ['lt', 'lb', 'rt', 'rb'] as const;
  const CARDS = keys.map((key, idx) => {
    const cmsCard = data?.activitiesCards?.[idx];
    return {
      key,
      title: cmsCard?.title || defaultCards[idx].title,
      image: getStrapiMediaUrl(cmsCard?.image?.url) || defaultCards[idx].image,
    };
  });

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    return `/${locale}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Gate on the same breakpoint the CSS uses; below it --p stays 0 and every
  // transform resolves to identity.
  const apply = useCallback((el: HTMLElement, p: number) => {
    const on = window.matchMedia('(min-width: 1281px)').matches;
    el.style.setProperty('--p', on ? p.toFixed(4) : '0');
  }, []);

  useScrollProgress(sectionRef, apply);

  return (
    <section ref={sectionRef} className="act-section relative w-full bg-white lg:h-[260svh]">
      <div className="act-stage relative lg:sticky lg:top-0 lg:h-[100svh] flex items-center overflow-hidden py-[clamp(1.5rem,5vw,6rem)] lg:py-0">

        {/* Faint Islamic geometric pattern */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.1] bg-repeat bg-[length:420px] mix-blend-multiply"
          style={{ backgroundImage: "url('/images/figma-home/14-news.jpeg')" }}
        />

        <div className="relative w-full max-w-[1920px] mx-auto px-(--spacing-side)">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,490fr)_minmax(0,616fr)_minmax(0,485fr)] gap-x-[clamp(1.5rem,1.7vw,2rem)] gap-y-6 items-center">

            {/* Left cards */}
            <div className="flex flex-col gap-6 max-lg:order-2 max-lg:grid max-lg:grid-cols-2">
              <Card card={CARDS[0]} />
              <Card card={CARDS[1]} />
            </div>

            {/* Centre column */}
            <div className="flex flex-col items-center text-center max-lg:order-1">
              <h2 className="act-text font-normal text-black leading-[1.17] text-[clamp(1.1rem,1.87vw,2.25rem)] max-w-[460px]">
                {heading}
              </h2>

              <div className="act-hero relative w-full aspect-[616/355] rounded-lg overflow-hidden mt-[clamp(1.5rem,2vw,2.45rem)]">
                <img
                  src={centerImage}
                  alt="Yahaya students on campus"
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="act-text mt-[clamp(1.25rem,1.7vw,2.05rem)] max-w-[420px] text-black leading-[1.33] text-[clamp(1rem,0.94vw,1.125rem)]">
                {subtitle}
              </p>

              <Link
                href={getHref(ctaUrl)}
                className="act-text mt-[clamp(1.25rem,1.3vw,1.6rem)] inline-flex items-center justify-center gap-3 h-[43px] px-6 rounded-full bg-[#048ED6] text-white font-medium text-[15px] transition-colors hover:bg-[#037ab8]"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-6 max-lg:order-3 max-lg:grid max-lg:grid-cols-2">
              <Card card={CARDS[2]} />
              <Card card={CARDS[3]} />
            </div>

          </div>
        </div>
      </div>

      <style>{`
        /* Registered as <number> so Safari resolves it reliably inside
           calc() where a unit is applied (e.g. rotate(calc(var(--p)*-12deg))). */
        @property --p { syntax: '<number>'; inherits: true; initial-value: 0; }

        .act-section { --p: 0; }

        @media (min-width: 1281px) {
          .act-card, .act-hero, .act-text { will-change: transform, opacity; }

          /* Each card leaves through its own corner, so the four exits fan
             outward rather than all sliding the same way. */
          .act-lt { transform: translate(calc(var(--p) * -75%), calc(var(--p) * -95%)) rotate(calc(var(--p) * -12deg)); }
          .act-lb { transform: translate(calc(var(--p) * -75%), calc(var(--p) *  95%)) rotate(calc(var(--p) *  12deg)); }
          .act-rt { transform: translate(calc(var(--p) *  75%), calc(var(--p) * -95%)) rotate(calc(var(--p) *  12deg)); }
          .act-rb { transform: translate(calc(var(--p) *  75%), calc(var(--p) *  95%)) rotate(calc(var(--p) * -12deg)); }
          .act-card { opacity: calc(1 - var(--p) * 1.45); }

          /* Copy clears out early so the image has the stage to itself. */
          .act-text { opacity: calc(1 - var(--p) * 2.6); }

          /* Grows past the section on both axes; the stage clips the overflow. */
          .act-hero {
            transform: scale(calc(1 + var(--p) * 2.4));
            z-index: 2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .act-card, .act-hero, .act-text { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </section>
  );
}
