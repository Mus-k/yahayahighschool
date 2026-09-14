'use client';

/**
 * About — "Our Timeline"
 *
 * Three Swiper instances wired together:
 *   1. THUMB  (left)  — year numbers; slidesPerView configurable; controls both others
 *   2. IMAGE  (centre)— one photo per slide, horizontal; parallax on scroll (lg+)
 *   3. TEXT   (right) — title + body; vertical fade between slides
 *
 * All three share the same active index via controller / thumbs API.
 */

import React, { useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, Controller, EffectFade, Autoplay, A11y, Parallax } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { AboutTimelineSectionComponent } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

import 'swiper/css';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const FALLBACK_ENTRIES = [
  {
    year: '2020',
    image: '/images/figma-home/09.png',
  },
  {
    year: '2021',
    image: '/images/figma-home/17.png',
  },
  {
    year: '2022',
    image: '/images/figma-home/07-activity.png',
  },
  {
    year: '2023',
    image: '/images/figma-home/13.png',
  },
  {
    year: '2024',
    image: '/images/figma-home/19.png',
  },
  {
    year: '2025',
    image: '/images/figma-home/13.png',
  },
  {
    year: '2026',
    image: '/images/figma-home/19.png',
  },
];

/* ─── Config ─────────────────────────────────────────────────────────────────
   Tweak these to adjust the thumb slider behaviour:
   - THUMBS_VISIBLE  : how many year labels are visible at once (desktop)
   - SLIDE_SPEED     : transition duration in ms
   - AUTOPLAY_DELAY  : set to 0 to disable autoplay
*/
const THUMBS_VISIBLE = 3;   // e.g. 3 → shows the active + 1 above + 1 below
const SLIDE_SPEED = 800; // ms
const AUTOPLAY_DELAY = 0;   // ms — 0 = disabled

/* ─── Nav button ─────────────────────────────────────────────────────────────  */
function NavBtn({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick(): void; disabled: boolean }) {
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous milestone' : 'Next milestone'}
      className="w-[34px] h-[34px] cursor-pointer shrink-0 grid place-items-center rounded-full border border-[#81B6EB] text-[#048ED6] bg-white transition-colors hover:bg-[#E6F0FB] disabled:opacity-35 disabled:cursor-default"
    >
      <Icon className="w-[15px] h-[15px] rtl:-scale-x-100" />
    </button>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────────  */
export function AboutTimelineSection({ data }: { data?: AboutTimelineSectionComponent }) {
  // Swiper instance refs — wired via controller
  const [thumbSwiper, setThumbSwiper] = useState<SwiperType | null>(null);
  const [imageSwiper, setImageSwiper] = useState<SwiperType | null>(null);
  const [textSwiper, setTextSwiper] = useState<SwiperType | null>(null);
  const [activeIdx, setActiveIdx] = useState(2);
  const t = useTranslations('aboutPage.timeline');
  const locale = useLocale();
  const yearFormatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, { useGrouping: false });

  const title = data?.title || t('title');
  const entries = data?.milestones?.length ? data.milestones.map(m => ({
    year: m.year,
    title: m.title,
    body: m.body,
    image: m.image ? getStrapiMediaUrl(m.image) : (m.imageUrl || '')
  })) : FALLBACK_ENTRIES.map(e => ({
    year: e.year,
    title: t(`entries.${e.year}.title`),
    body: t(`entries.${e.year}.body`),
    image: e.image
  }));

  const goTo = useCallback((i: number) => {
    imageSwiper?.slideTo(i);
    textSwiper?.slideTo(i);
    thumbSwiper?.slideTo(i);
  }, [imageSwiper, textSwiper, thumbSwiper]);

  const prev = useCallback(() => goTo(Math.max(0, activeIdx - 1)), [activeIdx, goTo]);
  const next = useCallback(() => goTo(Math.min(entries.length - 1, activeIdx + 1)), [activeIdx, entries.length, goTo]);

  const modules = [Thumbs, Controller, EffectFade, Parallax, A11y,
    ...(AUTOPLAY_DELAY > 0 ? [Autoplay] : [])];

  return (
    <section className="w-full bg-[#F7F7F7]">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.5rem,4.2vw,5rem)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:px-(--spacing-side)">
          <h2 className="font-serif text-[#121C2A] text-[clamp(1.75rem,2.6vw,3.125rem)]">
            {title}
          </h2>
        </div>

        <div className="mt-[clamp(2rem,3.4vw,4rem)] max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-[auto_minmax(0,569fr)_minmax(0,666fr)] items-stretch">

          {/* ── 1. THUMB slider — year numbers ── */}
          <div className="lg:pr-[clamp(1.5rem,3vw,3.5rem)]">

            {/* Mobile: 3.5 slides visible, centred */}

            {/* Desktop: vertical thumb — exactly THUMBS_VISIBLE slides visible */}
            <div className="block w-full overflow-hidden max-lg:mb-5">
              <Swiper
                modules={modules}
                slidesPerView={THUMBS_VISIBLE}
                breakpoints={{
                  0: {
                    slidesPerView: 3,
                    direction: "horizontal",
                     spaceBetween: 64,
                  },
                  768: {
                    slidesPerView: 4,
                     spaceBetween: 50,
                  },
                  1280: {
                    slidesPerView: 5,
                    direction: "vertical",
                    spaceBetween: 24,
                  },
                }}
                centeredSlides
                initialSlide={2}
                speed={SLIDE_SPEED}
                watchSlidesProgress
                slideToClickedSlide
                onSwiper={setThumbSwiper}
                onSlideChange={s => {
                  const i = s.activeIndex;
                  setActiveIdx(i);
                  imageSwiper?.slideTo(i);
                  textSwiper?.slideTo(i);
                }}
                {...(AUTOPLAY_DELAY > 0 ? { autoplay: { delay: AUTOPLAY_DELAY, disableOnInteraction: false } } : {})}
              
                className="timeline-thumb-swiper w-full overflow-hidden lg:h-[540px]"
              >
                {entries.map((e, i) => (
                  <SwiperSlide key={e.year} className="!flex !items-center">
                    {({ isActive }: { isActive: boolean }) => (
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        className={`flex items-center gap-3 font-serif leading-none transition-colors duration-[800ms] cursor-pointer text-[clamp(1.5rem,2.6vw,3.125rem)] w-full ${isActive ? 'text-(--color-primary)' : 'text-black/50 lg:hover:text-[#B6BCC2]'}`}
                      >
                        {yearFormatter.format(Number(e.year))}
                        <span style={{background: 'linear-gradient(90deg, rgba(4, 110, 214, 0.10) 0%, #048ED6 50%, rgba(4, 142, 214, 0.10) 100%)'}} aria-hidden className={`block h-[2px] flex-1 max-lg:hidden w-[70px] transition-opacity duration-[800ms] ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* ── 2. IMAGE slider — Swiper native X-axis parallax ── */}
          <div className="w-full aspect-[569/581] overflow-hidden max-lg:rounded-t-lg lg:rounded-l-lg">
            <Swiper
              modules={modules}
              parallax
              initialSlide={2}
              speed={SLIDE_SPEED}
              allowTouchMove={false}
              onSwiper={setImageSwiper}
              onSlideChange={s => setActiveIdx(s.activeIndex)}
              {...(AUTOPLAY_DELAY > 0 ? { autoplay: { delay: AUTOPLAY_DELAY, disableOnInteraction: false } } : {})}
              className="w-full h-full"
            >
              {entries.map((e) => (
                <SwiperSlide key={e.year} className="overflow-hidden relative">
                  {/*
                    Swiper background-image parallax pattern.
                    Div is 150% wide centred at left: -25%.
                    data-swiper-parallax-x="-25%" shifts by 25% of swiper width.
                    At max shift: left = -25% + (-25%) = -50%; right = -50%+150% = 100% → no gap.
                  */}
                  <div
                    className="parallax-bg absolute inset-y-0"
                    data-swiper-parallax-x="-25%"
                    style={{
                      backgroundImage: `url(${e.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      width: '150%',
                      left: '-25%',
                      height: '100%',
                    }}
                    role="img"
                    aria-label={e.year}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* ── 3. TEXT slider — fade effect ── */}
          <div className="bg-white rounded-r-lg max-lg:rounded-b-lg flex flex-col px-[clamp(1.5rem,2.6vw,3.125rem)] py-[clamp(1.75rem,2.6vw,3.125rem)]">
            <Swiper
              modules={modules}
              effect="fade"
              fadeEffect={{ crossFade: false }}
              initialSlide={2}
              speed={SLIDE_SPEED}
              allowTouchMove={false}
            
              onSwiper={setTextSwiper}
              onSlideChange={s => setActiveIdx(s.activeIndex)}
              {...(AUTOPLAY_DELAY > 0 ? { autoplay: { delay: AUTOPLAY_DELAY, disableOnInteraction: false } } : {})}
              className="w-full flex-1 !overflow-visible timeline-text-swiper"
            >
              {entries.map((e) => (
                <SwiperSlide key={e.year} className="!h-auto group/slide">
                  <p className="font-serif opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:translate-y-0 translate-y-5 overflow-hidden duration-500 text-[#121C2A] text-[clamp(1.125rem,1.25vw,1.5rem)]">
                    {yearFormatter.format(Number(e.year))}
                  </p>
                  <h3 className="mt-[clamp(0.75rem,1vw,1.2rem)] font-serif opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:translate-y-0 translate-y-5 overflow-hidden duration-500 text-[#048ED6] leading-[1.3] text-[clamp(1.25rem,1.56vw,1.875rem)]">
                    {e.title}
                  </h3>
                  <p className="mt-[clamp(1rem,1.4vw,1.7rem)] text-[#3F4941] leading-[1.85] text-[1rem] opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:translate-y-0 translate-y-5 overflow-hidden duration-500">
                    {e.body}
                  </p>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Nav buttons */}
            <div className="pt-[clamp(1.5rem,2.1vw,2.5rem)] flex items-center gap-3">
              <NavBtn dir="prev" onClick={prev} disabled={activeIdx === 0} />
              <NavBtn dir="next" onClick={next} disabled={activeIdx === entries.length - 1} />
            </div>
          </div>

        </div>
      </div>

      {/* Swiper overrides */}
      <style>{`
        /* Thumb — all breakpoints: active full, prev/next dimmed */
        .timeline-thumb-swiper .swiper-slide {
          opacity: 0.3;
          transition: opacity 0.5s ease;
          cursor: pointer;
        }
        .timeline-thumb-swiper .swiper-slide-active {
          opacity: 1;
        }
        .timeline-thumb-swiper .swiper-slide-prev,
        .timeline-thumb-swiper .swiper-slide-next {
          opacity: 0.6;
        }

        /*
          Text fade with sequenced delay:
          - outgoing slide fades out over SLIDE_SPEED ms (no delay)
          - incoming slide waits half that time, then fades in
          This prevents the two slides from overlapping visually.
        */
        .timeline-text-swiper .swiper-slide {
          opacity: 0 !important;
          transition: opacity ${SLIDE_SPEED}ms ease !important;
          transition-delay: 0ms !important;
          pointer-events: none;
          cursor: pointer;
        }
        .timeline-text-swiper .swiper-slide-active {
          opacity: 1 !important;
          transition-delay: ${Math.round(SLIDE_SPEED * 0.55)}ms !important;
          pointer-events: auto;
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}
