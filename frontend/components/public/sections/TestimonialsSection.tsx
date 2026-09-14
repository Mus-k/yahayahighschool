'use client';

import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { useTranslations } from 'next-intl';

import 'swiper/css';
import 'swiper/css/effect-fade';

/**
 * Home — "Kind Words From Our Community" testimonials.
 * Implemented from Figma node 542-598 (frame 1920×1080).
 *
 * Design reference values (measured at the 1920 frame):
 *   band #048ED6 (0→429) · panel #FAFDFE · ink #121C2A
 *   role #02019B · quote mark #C8CBEA · meta #545F73 · idle tab name #A1D4EF
 *   heading 50 · sub 18/29 · tab name 16 · avatar 64 · portrait 256×256
 *   card title 34/39 · name 22 · role 14 · quote 18/29 · panel content 1024 wide
 *
 * The active tab is marked by a 109×10 panel-coloured notch on the band's
 * bottom edge, so the tab reads as joined to the panel underneath.
 *
 * Copy note: the Figma is filled with template placeholder text (Pagedone,
 * "Verified Purchase", "PRODUCT AND SALES MANAGER"). The real Yahaya
 * testimonials already in this component are kept; only the layout is new.
 */

// Moved into component to use translations
// const TESTIMONIALS = [
//   {
//     id: 1,
//     name: 'Mia Thompson',
//     role: 'PARENT',
//     image: '/images/figma-home/01-hero.jpeg',
//     title: 'A transformative experience for our child.',
//     quote:
//       '"Since enrolling our daughter at Yahaya International, we have seen remarkable growth not just in her academic performance but in her character. The seamless integration of Islamic values with rigorous modern education is exactly what we were looking for."',
//     rating: 5,
//   },
//   ...
// ];

import type { HomepageEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

/**
 * Enter animation for the panel: each block starts pushed down and faded out and
 * settles once Swiper marks its slide active, staggered by DELAY. Same pattern
 * HeroSection uses.
 *
 * Note the transition list is opacity,translate — NOT transform. Tailwind v4
 * compiles translate-y-* to the standalone CSS `translate` property, so a
 * transform-based transition list silently leaves the movement un-animated.
 */
const RISE =
  'transition-[opacity,translate] duration-700 ease-out opacity-0 translate-y-8 ' +
  'group-[&.swiper-slide-active]/slide:opacity-100 group-[&.swiper-slide-active]/slide:translate-y-0';
const DELAY = [
  'group-[&.swiper-slide-active]/slide:delay-100',
  'group-[&.swiper-slide-active]/slide:delay-200',
  'group-[&.swiper-slide-active]/slide:delay-300',
  'group-[&.swiper-slide-active]/slide:delay-[400ms]',
  'group-[&.swiper-slide-active]/slide:delay-500',
  'group-[&.swiper-slide-active]/slide:delay-700',
];

const INITIAL = 1;

interface TestimonialsProps {
  data?: HomepageEntity | any | null;
  locale?: string;
}

export function TestimonialsSection({ locale = 'en', data }: TestimonialsProps) {
  void locale;
  const t = useTranslations('testimonialsSection');
  const [thumbs, setThumbs] = useState<SwiperClass | null>(null);
  const [main, setMain] = useState<SwiperClass | null>(null);
  const [active, setActive] = useState(INITIAL);

  const heading = data?.testimonialsHeading || t('heading');
  const subtitle = data?.testimonialsSubtitle || t('subtitle');

  const defaultTestimonials = [
    {
      id: 1,
      name: t('items.t1.name'),
      role: t('items.t1.role'),
      title: t('items.t1.title'),
      quote: t('items.t1.quote'),
      image: '/images/figma-home/01-hero.jpeg',
      rating: 5,
    },
    {
      id: 2,
      name: t('items.t2.name'),
      role: t('items.t2.role'),
      title: t('items.t2.title'),
      quote: t('items.t2.quote'),
      image: '/images/figma-home/20-news.jpeg',
      rating: 5,
    },
    {
      id: 3,
      name: t('items.t3.name'),
      role: t('items.t3.role'),
      title: t('items.t3.title'),
      quote: t('items.t3.quote'),
      image: '/images/figma-home/04-programs.jpeg',
      rating: 5,
    },
    {
      id: 4,
      name: t('items.t4.name'),
      role: t('items.t4.role'),
      title: t('items.t4.title'),
      quote: t('items.t4.quote'),
      image: '/images/figma-home/08-activity.jpeg',
      rating: 5,
    },
  ];

  const items = (data?.testimonials && data.testimonials.length > 0)
    ? data.testimonials.map((item: any, idx: number) => ({
        id: item.id || idx + 1,
        name: item.name || '',
        role: item.role || 'PARENT',
        title: item.title || '',
        quote: item.quote || '',
        image: getStrapiMediaUrl(item.image?.url) || defaultTestimonials[idx % defaultTestimonials.length].image,
        rating: item.rating ?? 5,
      }))
    : defaultTestimonials;

  // Both sliders are driven directly rather than through Swiper's Thumbs module:
  // that module repositions the strip on its own (it only keeps the active thumb
  // *visible*) and overrode the centring below. Do not add update() here — it
  // re-applies the previous translate to the DOM and the slideTo never lands.
  useEffect(() => {
    if (!thumbs || thumbs.destroyed) return;
    thumbs.slideTo(active);
  }, [thumbs, active]);

  return (
    <section className="w-full bg-[#FAFDFE] overflow-hidden">

      {/* ── Blue band ───────────────────────────────────────────── */}
      <div className="relative bg-[#048ED6] pt-[clamp(1.5rem,5.5vw,6.6rem)]">
        <div className="max-w-[1920px] mx-auto px-(--spacing-side)">
          <h2 className="text-center font-bold text-white tracking-[-0.015em] leading-[1.08] text-[clamp(1.5rem,2.6vw,3.125rem)]">
            {heading}
          </h2>
          <p className="mt-[clamp(1rem,1.5vw,1.8rem)] mx-auto max-w-165 text-center text-white/85 leading-[1.61] max-sm:leading-relaxed text-[clamp(1rem,0.94vw,1.125rem)]">
            {subtitle}
          </p>

          {/*
            Thumb slider — clicking a face slides it in and drives the panel below.
            Centring is only wanted where the strip overflows: at md+ every thumb
            fits, so the CSS below centres them as a group (centeredSlides there
            would centre the *active* thumb and pull the row off-axis).
            --breakpoint-md is 1025px.
          */}
          <Swiper
            onSwiper={setThumbs}
            watchSlidesProgress
            centeredSlides
            initialSlide={INITIAL}
            breakpoints={{ 1025: { centeredSlides: false } }}
            slidesPerView="auto"
            spaceBetween={0}
            speed={800}
            className="thumbs-swiper mt-[clamp(1.5rem,2.1vw,2.6rem)]"
          >
            {items.map((item: any, i: number) => {
              const on = i === active;
              return (
                <SwiperSlide key={item.id}>
                  <button
                    type="button"
                    onClick={() => main?.slideTo(i)}
                    aria-pressed={on}
                    className="relative flex flex-col items-center px-4 py-1 sm:px-6 pb-[clamp(1.5rem,2.23vw,2.7rem)] cursor-pointer group"
                  >
                    <span
                      className={`w-16 h-16 rounded-full overflow-hidden ring-2 transition-all duration-500 ${
                        on ? 'ring-white/90 opacity-100' : 'ring-transparent opacity-60 group-hover:opacity-85'
                      }`}
                    >
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-[#048ED6]/40 opacity-0 transition-opacity" />
                    </span>
                    <span
                      className={`mt-3 whitespace-nowrap font-semibold transition-colors duration-500 text-[clamp(0.875rem,0.83vw,1rem)] ${
                        on ? 'text-white' : 'text-[#A1D4EF] group-hover:text-white/90'
                      }`}
                    >
                      {item.name}
                    </span>
                    {/* Notch joining the active thumb to the panel below. Both widths
                        live here so only one width utility is ever emitted. */}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[10px] rounded-t-md bg-[#FAFDFE] transition-[width,opacity] duration-500 ease-out ${
                        on ? 'w-[109px] opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <div className="max-w-[1920px] mx-auto px-(--spacing-side)">
        <div className="max-w-[1024px] mx-auto pt-[clamp(1.5rem,3.3vw,4rem)] pb-[clamp(1.5rem,5.4vw,6.4rem)]">
          <Swiper
            modules={[EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            onSwiper={setMain}
            onSlideChange={(sw) => setActive(sw.activeIndex)}
            initialSlide={INITIAL}
            slidesPerView={1}
            autoHeight
            speed={800}
            className="panel-swiper"
          >
            {items.map((tItem: any) => (
              <SwiperSlide key={tItem.id} className="group/slide">
                <div className="flex flex-col sm:flex-row gap-[34px] max-md:gap-[20px]">
                  <div
                    className={`w-[256px] h-[256px] max-sm:w-full max-sm:h-[280px] shrink-0 overflow-hidden ${RISE} ${DELAY[0]}`}
                  >
                    <img src={tItem.image} alt={tItem.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0 pt-[30px] max-sm:pt-0">
                    <svg
                      viewBox="0 0 43 30"
                      className={`w-[43px] h-[30px] max-md:w-[35px] max-md:h-[35px] fill-[#C8CBEA] ${RISE} ${DELAY[1]}`}
                      aria-hidden
                    >
                      <path d="M0 30V17.6C0 12.9 1 9 3 5.9 5.1 2.8 8.2.9 12.4 0l2 4.4c-2.6.9-4.5 2.2-5.6 3.9-1.1 1.7-1.7 4-1.7 6.8h6.6V30H0Zm24.5 0V17.6c0-4.7 1-8.6 3-11.7C29.6 2.8 32.7.9 36.9 0l2 4.4c-2.6.9-4.5 2.2-5.6 3.9-1.1 1.7-1.7 4-1.7 6.8h6.6V30H24.5Z" />
                    </svg>

                    {tItem.title ? (
                      <h3
                        className={`mt-[clamp(0.75rem,1vw,1.2rem)] max-w-[560px] font-bold text-[#121C2A] tracking-[-0.015em] leading-[1.15] text-[clamp(1.5rem,1.77vw,2.125rem)] ${RISE} ${DELAY[2]}`}
                      >
                        {tItem.title}
                      </h3>
                    ) : null}
                    <p
                      className={`mt-[clamp(0.5rem,0.7vw,0.85rem)] font-semibold text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)] ${RISE} ${DELAY[3]}`}
                    >
                      {tItem.name}
                    </p>
                    <p
                      className={`mt-[7px] max-sm:mt-[5px] font-bold uppercase tracking-[0.04em] text-[#02019B] text-[1rem] ${RISE} ${DELAY[3]}`}
                    >
                      {tItem.role}
                    </p>
                  </div>
                </div>

                <p
                  className={`mt-[clamp(1rem,3.1vw,3.7rem)] italic text-[#121C2A] leading-[1.61] text-[clamp(1rem,0.94vw,1.125rem)] ${RISE} ${DELAY[4]}`}
                >
                  {tItem.quote}
                </p>

                <div
                  className={`mt-[clamp(1.75rem,2.3vw,2.8rem)] flex items-center gap-3 ${RISE} ${DELAY[5]}`}
                >
                  <span className="flex items-center gap-1">
                    {Array.from({ length: tItem.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-(--color-primary) text-(--color-primary)" aria-hidden />
                    ))}
                  </span>
                  <span className="text-[#545F73] text-[clamp(0.75rem,0.73vw,0.875rem)]">
                    {t('verifiedReview')}
                  </span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style>{`
        /* Swiper's stylesheet loads after Tailwind, so its bare .swiper-slide rules
           beat equal-specificity utilities. Two-class selectors win. */
        .thumbs-swiper .swiper-slide { width: auto; }
        /* At md+ all four thumbs fit and Swiper locks the strip (it exposes this only
           as swiper.isLocked — no class is emitted), so centre them as the Figma does.
           Revisit if enough testimonials are added to overflow at this width. */
        @media (min-width: 1025px) {
          .thumbs-swiper .swiper-wrapper { justify-content: center; }
        }
        .panel-swiper .swiper-slide { height: auto; }
      `}</style>
    </section>
  );
}
