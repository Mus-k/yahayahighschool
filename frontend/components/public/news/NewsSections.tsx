'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslations, useLocale } from 'next-intl';
import { EffectFade } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-fade';

import type { NewsFeaturedEventComponent } from '@/types/cms.types';
import { formatCardDate, resolveEventDate, formatMonthAndDay } from '@/lib/format';


/**
 * News hero. Implemented from Figma node 384-3987 (frame 1920x3930).
 *
 * Measured off the export:
 *   band            y 99->978 (880 tall), #FAFAFA, photo full-bleed right
 *   text column     x 142, the same side padding used across the site
 *   headline        two lines, 53px pitch, #121C2A
 *   button          204 x 54 pill
 *   arrows          45px circles at x 142 (outlined) and x 207 (filled)
 *   progress rule   x 312->826 (515 wide, 2px), track #BCDFF1, fill #048ED6;
 *                   the 100px fill is 1/5 of the track, hence five slides
 *   event card      440 wide, y 765->1324 — it overhangs the band by 346
 *
 * The photo's left edge is a single arch, traced off the export at 5px
 * intervals: x 1127 at the top, easing to ~893 through the middle, then
 * flaring back out to 776 at the base. Reproduced as the clipPath below —
 * max deviation from the trace is 3.3px across a 1144px span.
 */

const MASK_PATH = 'M 351.0 0.0 C 346.7 1.7, 332.8 6.7, 325.0 10.0 C 317.2 13.3, 312.0 15.8, 304.0 20.0 C 296.0 24.2, 285.2 30.0, 277.0 35.0 C 268.8 40.0, 262.7 44.2, 255.0 50.0 C 247.3 55.8, 239.5 61.7, 231.0 70.0 C 222.5 78.3, 213.3 86.7, 204.0 100.0 C 194.7 113.3, 184.5 129.2, 175.0 150.0 C 165.5 170.8, 154.3 200.0, 147.0 225.0 C 139.7 250.0, 135.5 262.5, 131.0 300.0 C 126.5 337.5, 122.3 400.0, 120.0 450.0 C 117.7 500.0, 118.3 558.3, 117.0 600.0 C 115.7 641.7, 114.3 673.3, 112.0 700.0 C 109.7 726.7, 105.8 745.0, 103.0 760.0 C 100.2 775.0, 97.7 780.8, 95.0 790.0 C 92.3 799.2, 89.8 807.5, 87.0 815.0 C 84.2 822.5, 83.7 828.3, 78.0 835.0 C 72.3 841.7, 63.2 849.2, 53.0 855.0 C 42.8 860.8, 25.8 866.7, 17.0 870.0 C 8.2 873.3, 2.8 874.2, 0.0 875.0 L 1144 879 L 1144 0 Z';

export type FeaturedEvent = {
  /** Left slider */
  eyebrow: string; headline: [string, string]; lede: string;
  /** Right slider */
  image: string; alt: string;
  /** Overlapping card */
  month: string; day: string; category: string;
  title: string; time: string; place: string; blurb: string;
  href: string;
  buttonText?: string;
};

// Slide one carries the design's exact copy; the rest are the same shape.
const FEATURED: FeaturedEvent[] = [
  {
    eyebrow: 'School Stories',
    headline: ['News, Events &', 'Community'],
    lede: 'Discover the latest happenings at Yahaya International. From academic achievements to spiritual milestones, our stories reflect our commitment to faith, learning and character.',
    image: '/images/figma-home/09.png', alt: 'A lesson in progress',
    month: 'JUL', day: '15', category: 'CEREMONY', title: 'Graduation Ceremony',
    time: '10:00 AM - 1:00 PM', place: 'Main Auditorium',
    blurb: 'Join us as we celebrate the achievements of our graduating class.',
    href: '/news/science-tech-fair-2024',
    buttonText: 'Read More',
  },
  {
    eyebrow: 'Campus Life',
    headline: ['A New Home', 'for Hifz'],
    lede: 'Our dedicated memorization centre opens its doors, giving students a purpose-built space for recitation, review and quiet study.',
    image: '/images/figma-home/17.png', alt: 'Group study in the library',
    month: 'SEP', day: '12', category: 'OPENING', title: 'Memorization Hub',
    time: '9:00 AM - 11:00 AM', place: 'Hifz Centre',
    blurb: 'The doors open on our dedicated Hifz learning centre.',
    href: '/news/new-memorization-hub',
    buttonText: 'Read More',
  },
  {
    eyebrow: "D'awah",
    headline: ['Service Beyond', 'the Gates'],
    lede: 'Senior students carried our values into three neighbourhoods this month, leading an outreach programme built on listening as much as teaching.',
    image: '/images/figma-home/19.png', alt: 'Students walking on campus',
    month: 'JUN', day: '18', category: "D'AWAH", title: 'Community Outreach',
    time: '2:00 PM - 5:00 PM', place: 'City Centre',
    blurb: 'Senior students lead an outreach programme across three neighbourhoods.',
    href: '/news/community-dawah',
    buttonText: 'Read More',
  },
  {
    eyebrow: 'Achievement',
    headline: ['Character, and', 'Scholarship'],
    lede: 'The Excellence Awards recognise the students whose work and conduct set the tone for everyone around them.',
    image: '/images/figma-home/07-activity.png', alt: 'Students outside the school building',
    month: 'MAY', day: '10', category: 'AWARDS', title: 'Excellence Awards',
    time: '11:00 AM - 1:00 PM', place: 'Main Hall',
    blurb: 'Recognising outstanding academic and character achievement.',
    href: '/news/excellence-awards',
    buttonText: 'Read More',
  },
  {
    eyebrow: 'Events',
    headline: ['Ideas Worth', 'Gathering For'],
    lede: 'A full day of talks and demonstrations, bringing together some of the brightest minds working in the field today.',
    image: '/images/figma-home/13.png', alt: 'Students reading in the library',
    month: 'AUG', day: '05', category: 'EVENTS', title: 'Innovation Summit',
    time: '10:00 AM - 4:00 PM', place: 'Library Annex',
    blurb: 'A day of talks bringing together the brightest minds in the field.',
    href: '/news/innovation-summit',
    buttonText: 'Read More',
  },
];

import { getStrapiMediaUrl } from '@/services/cms.service';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function resolveEventHref(item: { href?: string; title?: string; headlineLine1?: string; headlineLine2?: string }): string {
  if (item.href && item.href.trim()) {
    const raw = item.href.trim();
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
      return raw;
    }
    return `/news/${raw}`;
  }
  const candidate = item.title || `${item.headlineLine1 || ''} ${item.headlineLine2 || ''}`.trim() || 'story';
  return `/news/${slugify(candidate)}`;
}

export function NewsHero({
  data,
  breadcrumbTitle,
  pageDate,
  locale: propLocale,
}: {
  data?: NewsFeaturedEventComponent[];
  breadcrumbTitle?: string;
  pageDate?: string;
  locale?: string;
}) {
  const [media, setMedia] = useState<SwiperClass | null>(null);
  const [text, setText] = useState<SwiperClass | null>(null);
  const [active, setActive] = useState(0);
  const t = useTranslations('newsPage');
  const hookLocale = useLocale();
  const locale = propLocale || hookLocale || 'en';

  const featured = data && data.length > 0 ? data.map(d => ({
    eyebrow: d.eyebrow,
    headline: [d.headlineLine1, d.headlineLine2 || ''] as [string, string],
    lede: d.lede,
    image: (d.image ? getStrapiMediaUrl(d.image) : null) || '/images/figma-home/09.png',
    alt: d.image?.alternativeText || d.title,
    date: d.date || d.publishDate || d.publishedAt || d.createdAt,
    month: d.month,
    day: d.day,
    category: d.category,
    title: d.title,
    time: d.time,
    place: d.place,
    blurb: d.blurb,
    href: resolveEventHref(d),
    buttonText: d.buttonText,
  })) : FEATURED;

  // The media slider is the single source of truth — the arrows drive it and
  // the text follows. Two sliders steering each other invites a feedback loop.
  useEffect(() => {
    if (text && !text.destroyed && text.activeIndex !== active) text.slideTo(active);
  }, [text, active]);

  const go = (delta: number) => media?.[delta > 0 ? 'slideNext' : 'slidePrev']();

  const item = featured[active];
  const progress = ((active + 1) / featured.length) * 100;
  const eventDate = resolveEventDate(item, pageDate);
  const { month: localizedMonth, day: localizedDay } = formatMonthAndDay(eventDate, locale);
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const toArabicNums = (str: string) => {
    return locale === 'ar' ? str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]) : str;
  };

  return (
    <section className="nh relative w-full bg-white">
      {/* The tinted band is its own element because the card below is meant to
          overhang it. */}
      <div className="nh-band absolute inset-x-0 top-0 bg-[#FAFAFA]" />

      <div className="relative mx-auto max-w-[1920px] px-(--spacing-side)">
        <div className="nh-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{t('breadcrumbHome', { fallback: 'Home' })}</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            <span className="text-[#048ED6]">{breadcrumbTitle || t('breadcrumbNews', { fallback: 'News' })}</span>
          </nav>

          {/* Left slider — the copy changes with the photograph beside it. */}
          <Swiper
            modules={[EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            onSwiper={setText}
            slidesPerView={1}
            autoHeight={true}
            speed={800}
            allowTouchMove={false}
            observer={true}
            observeParents={true}
            className="nh-text mt-[clamp(1rem,1.5vw,1.75rem)] w-full"
          >
            {featured.map((f, i) => (
              <SwiperSlide key={i} className='h-auto w-full'>
                <p className="font-semibold uppercase tracking-[0.18em] text-(--color-primary) text-[1rem] opacity-0 [.swiper-slide-active_&]:opacity-100 translate-y-[15px] overflow-hidden [.swiper-slide-active_&]:translate-y-0 transition-all duration-500 [.swiper-slide-active_&]:delay-[400ms]">
                  {f.eyebrow}
                </p>

                <h1 className="mt-[clamp(0.5rem,0.8vw,1rem)] font-serif leading-[1.05] text-[#121C2A] text-[clamp(1.5rem,2.76vw,3.3125rem)] opacity-0 [.swiper-slide-active_&]:opacity-100 translate-y-[15px] overflow-hidden [.swiper-slide-active_&]:translate-y-0 transition-all duration-500 [.swiper-slide-active_&]:delay-[500ms]">
                  {f.headline[0]}
                  <br />
                  {f.headline[1]}
                </h1>

                <p className="mt-[clamp(1rem,1.5vw,1.75rem)] sm:max-w-[24rem] leading-[1.6] text-[#5A636D] text-[clamp(1rem,0.94vw,1.125rem)] opacity-0 [.swiper-slide-active_&]:opacity-100 translate-y-[15px] overflow-hidden [.swiper-slide-active_&]:translate-y-0 transition-all duration-500 [.swiper-slide-active_&]:delay-[600ms]">
                  {f.lede}
                </p>

                <Link
                  href={href(f.href)}
                  tabIndex={i === active ? 0 : -1}
                  className="mt-[clamp(1.5rem,2.4vw,2.9rem)] inline-flex h-[clamp(2.75rem,2.8vw,3.375rem)] items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(1.75rem,2.66vw,3.1875rem)] font-semibold text-white transition-all hover:bg-[#037ab8] text-[clamp(0.8125rem,0.83vw,1rem)] opacity-0 [.swiper-slide-active_&]:opacity-100 translate-y-[15px] overflow-hidden [.swiper-slide-active_&]:translate-y-0 duration-500 [.swiper-slide-active_&]:delay-[800ms]"
                >
                  {f.buttonText || t('readMore') || 'Read More'}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-[clamp(2rem,4.3vw,5.1rem)] flex items-center gap-[clamp(0.75rem,1.1vw,1.3rem)]">
            <button
              type="button"
              aria-label="Previous featured event"
              onClick={() => go(-1)}
              disabled={active === 0}
              className="grid h-[clamp(2.25rem,2.34vw,2.8125rem)] cursor-pointer w-[clamp(2.25rem,2.34vw,2.8125rem)] shrink-0 place-items-center rounded-full border border-[#048ED6] text-[#048ED6] transition-colors hover:bg-[#048ED6] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#048ED6]"
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              aria-label="Next featured event"
              onClick={() => go(1)}
              disabled={active === featured.length - 1}
              className="grid h-[clamp(2.25rem,2.34vw,2.8125rem)] cursor-pointer w-[clamp(2.25rem,2.34vw,2.8125rem)] shrink-0 place-items-center rounded-full bg-[#048ED6] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </button>

            {/* 515 x 2 in the design, sitting 61 clear of the arrows */}
            <div
              className="ml-[clamp(1rem,3.2vw,3.8125rem)] h-[2px] w-[clamp(6rem,26.8vw,32.1875rem)] bg-[#BCDFF1]"
              role="progressbar"
              aria-valuenow={active + 1}
              aria-valuemin={1}
              aria-valuemax={featured.length}
              aria-label="Featured event"
            >
              <div
                className="h-full bg-[#048ED6] transition-[width] duration-[800ms] ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Masked photo — full-bleed right, arch-clipped along its left edge at
          lg. Below that it drops into the flow as a plain rounded panel. */}
      <div className="nh-photo">
        <div className="nh-clip h-full w-full">
          <Swiper
            onSwiper={setMedia}
            onSlideChange={(sw) => setActive(sw.activeIndex)}
            slidesPerView={1}
            speed={800}
            observer={true}
            observeParents={true}
            className="h-full w-full"
          >
            {featured.map((f, i) => (
              <SwiperSlide key={i}>
                <img src={f.image} alt={f.alt} className="h-full w-full object-cover" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Event card. It overhangs the band, so it sits outside the clipped
          photo rather than inside it. */}
      {(item.title || item.month || item.day || item.place || item.blurb || item.lede) && (
        <div className="nh-card relative mx-auto max-md:w-full max-w-[1920px] px-(--spacing-side) lg:px-0">
          <article className="nh-card-inner max-md:max-w-full! rounded-lg bg-white p-[clamp(1.25rem,1.6vw,1.9rem)] max-md:w-full md:shadow-[0_18px_50px_rgba(4,45,80,0.12)]">
            <div className="flex items-start gap-[clamp(0.75rem,1vw,1.25rem)] w-full">
              <div className="shrink-0 rounded-md bg-[#EAF5FD] px-[clamp(0.5rem,0.7vw,0.85rem)] py-[clamp(0.35rem,0.5vw,0.6rem)] text-center">
                <span className="block font-semibold uppercase leading-none text-[#6F757D] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
                  {localizedMonth}
                </span>
                <span className="mt-1 block font-serif leading-none text-[#048ED6] text-[clamp(1.125rem,1.35vw,1.625rem)]">
                  {localizedDay}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-[#EAF5FD] px-2.5 py-1 font-semibold uppercase tracking-[0.1em] text-[#048ED6] text-[clamp(0.5rem,0.52vw,0.625rem)]">
                  {item.category || item.eyebrow || 'NEWS'}
                </span>
                <h2 className="mt-2 font-serif leading-tight text-[#121C2A] text-[clamp(1.0625rem,1.25vw,1.5rem)]">
                  {item.title || item.headline[0]}
                </h2>
                {item.time && (
                  <p className="mt-2 flex items-center gap-1.5 text-[#5A636D] text-[1rem]">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden /> {toArabicNums(item.time || '')}
                  </p>
                )}
                {item.place && (
                  <p className="mt-1 flex items-center gap-1.5 text-[#5A636D] text-[1rem]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {item.place}
                  </p>
                )}

                {/* Blurb and link sit in this column, indented past the date
                    badge, as they do in the design. */}
                <p className="mt-[clamp(0.75rem,1vw,1.25rem)] leading-[1.6] text-[#5A636D] text-[1rem]">
                  {item.blurb || item.lede}
                </p>

                <Link
                  href={href(item.href)}
                  className="mt-[clamp(0.75rem,1vw,1.25rem)] inline-flex items-center gap-1.5 font-medium text-[#048ED6] transition-opacity hover:opacity-80 text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                >
                  {item.buttonText || t('readMore') || 'Read More'} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      )}

      <style>{`
        .nh { --band-h: clamp(30rem, 45.83vw, 55rem); min-height: calc(var(--band-h) + clamp(3rem, 6vw, 8rem)); }
        /* Below lg the hero stacks and runs taller than the design's band, so
           the tint covers the whole section rather than stopping mid-photo. */
        .nh-band { top: 0; bottom: 0; height: auto; }
        .nh-col { padding-top: clamp(2.5rem, 6.25vw, 7.5rem); }
        /* Let each text slide take its own height rather than Swiper's 100%,
           and keep the taller ones from being clipped. */
        .nh-text .swiper-slide { height: auto; }
        /* Held to the left column: at full container width the incoming slide
           would sweep across the gap beside the arch during a transition. */
        .nh-text.swiper { overflow: hidden; max-width: min(100%, 34rem); margin-inline: 0; }

        /* Below lg: in flow beneath the text, unmasked. The arch depends on a
           tall wide panel; at phone widths it reads as damage, not shape. */
        .nh-photo {
          position: relative;
          margin: clamp(1.5rem, 3vw, 2.5rem) var(--spacing-side) 0;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .nh-photo .swiper { aspect-ratio: 16 / 10; }

        /* Below lg the arch is dropped — at narrow widths it reads as damage
           rather than shape — and the card simply follows the text. */
        .nh-card { margin-top: clamp(1.5rem, 3vw, 2.5rem); padding-bottom: clamp(2rem, 4vw, 3.5rem); }
        .nh-card-inner { max-width: 27.5rem; }

        @media (min-width: 1281px) {
          .nh-col { padding-bottom: clamp(2rem, 3.6vw, 4.3rem); }
          .nh-band { bottom: auto; height: var(--band-h); }
          [dir="rtl"] .nh-band { border-bottom-right-radius: 0; border-bottom-left-radius: clamp(3rem, 10.4vw, 12.5rem); }

          /* 1144 of 1920 == 59.58vw: the full width of the masked panel */
          .nh-photo {
            position: absolute;
            right: 0;
            top: 0;
            width: 59.58vw;
            height: var(--band-h);
            margin: 0;
            border-radius: 0;
          }
          [dir="rtl"] .nh-photo {
            right: auto;
            left: 0;
          }

          .nh-photo .swiper { aspect-ratio: auto; height: 100%; }
          /* A mask rather than clip-path: url(#id). Safari does not reliably
             resolve a clipPath reference held in a zero-sized SVG, and when it
             fails it clips the element away entirely — the photo simply
             disappears. An unsupported mask just leaves a plain rectangle,
             which is a far safer way to fail. preserveAspectRatio='none' plus
             mask-size 100% 100% reproduces the objectBoundingBox scaling. */
          .nh-clip {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201144%20879%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M%20351.0%200.0%20C%20346.7%201.7%2C%20332.8%206.7%2C%20325.0%2010.0%20C%20317.2%2013.3%2C%20312.0%2015.8%2C%20304.0%2020.0%20C%20296.0%2024.2%2C%20285.2%2030.0%2C%20277.0%2035.0%20C%20268.8%2040.0%2C%20262.7%2044.2%2C%20255.0%2050.0%20C%20247.3%2055.8%2C%20239.5%2061.7%2C%20231.0%2070.0%20C%20222.5%2078.3%2C%20213.3%2086.7%2C%20204.0%20100.0%20C%20194.7%20113.3%2C%20184.5%20129.2%2C%20175.0%20150.0%20C%20165.5%20170.8%2C%20154.3%20200.0%2C%20147.0%20225.0%20C%20139.7%20250.0%2C%20135.5%20262.5%2C%20131.0%20300.0%20C%20126.5%20337.5%2C%20122.3%20400.0%2C%20120.0%20450.0%20C%20117.7%20500.0%2C%20118.3%20558.3%2C%20117.0%20600.0%20C%20115.7%20641.7%2C%20114.3%20673.3%2C%20112.0%20700.0%20C%20109.7%20726.7%2C%20105.8%20745.0%2C%20103.0%20760.0%20C%20100.2%20775.0%2C%2097.7%20780.8%2C%2095.0%20790.0%20C%2092.3%20799.2%2C%2089.8%20807.5%2C%2087.0%20815.0%20C%2084.2%20822.5%2C%2083.7%20828.3%2C%2078.0%20835.0%20C%2072.3%20841.7%2C%2063.2%20849.2%2C%2053.0%20855.0%20C%2042.8%20860.8%2C%2025.8%20866.7%2C%2017.0%20870.0%20C%208.2%20873.3%2C%202.8%20874.2%2C%200.0%20875.0%20L%201144%20879%20L%201144%200%20Z%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201144%20879%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M%20351.0%200.0%20C%20346.7%201.7%2C%20332.8%206.7%2C%20325.0%2010.0%20C%20317.2%2013.3%2C%20312.0%2015.8%2C%20304.0%2020.0%20C%20296.0%2024.2%2C%20285.2%2030.0%2C%20277.0%2035.0%20C%20268.8%2040.0%2C%20262.7%2044.2%2C%20255.0%2050.0%20C%20247.3%2055.8%2C%20239.5%2061.7%2C%20231.0%2070.0%20C%20222.5%2078.3%2C%20213.3%2086.7%2C%20204.0%20100.0%20C%20194.7%20113.3%2C%20184.5%20129.2%2C%20175.0%20150.0%20C%20165.5%20170.8%2C%20154.3%20200.0%2C%20147.0%20225.0%20C%20139.7%20250.0%2C%20135.5%20262.5%2C%20131.0%20300.0%20C%20126.5%20337.5%2C%20122.3%20400.0%2C%20120.0%20450.0%20C%20117.7%20500.0%2C%20118.3%20558.3%2C%20117.0%20600.0%20C%20115.7%20641.7%2C%20114.3%20673.3%2C%20112.0%20700.0%20C%20109.7%20726.7%2C%20105.8%20745.0%2C%20103.0%20760.0%20C%20100.2%20775.0%2C%2097.7%20780.8%2C%2095.0%20790.0%20C%2092.3%20799.2%2C%2089.8%20807.5%2C%2087.0%20815.0%20C%2084.2%20822.5%2C%2083.7%20828.3%2C%2078.0%20835.0%20C%2072.3%20841.7%2C%2063.2%20849.2%2C%2053.0%20855.0%20C%2042.8%20860.8%2C%2025.8%20866.7%2C%2017.0%20870.0%20C%208.2%20873.3%2C%202.8%20874.2%2C%200.0%20875.0%20L%201144%20879%20L%201144%200%20Z%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E");
            -webkit-mask-size: 100% 100%;
            mask-size: 100% 100%;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
          }
          [dir="rtl"] .nh-clip {
            transform: scaleX(-1);
          }
          /* Static so the card inside resolves its offsets against the section,
             not against this wrapper — which already sits below the band. */
          .nh-card { position: static; }
          /* card: 440 wide, left edge 1258/1920, top 666 into the band */
          .nh-card { margin-top: 0; padding-bottom: clamp(2rem, 18.02vw, 21.625rem); }
          .nh-card-inner {
            position: absolute;
            top: calc(var(--band-h) * 0.757);
            left: 65.52%;
            width: 22.92vw;
            max-width: 27.5rem;
          }
          [dir="rtl"] .nh-card-inner {
            left: auto;
            right: 65.52%;
          }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------------ */


/**
 * Filter chips plus the events grid.
 *
 * Data comes exclusively from [F] News Page → featuredEvents.
 * A client component because the filter chips need React state.
 */
export function NewsGrid({
  locale: propLocale,
  events = [],
  pageDate,
}: {
  locale?: string;
  events?: NewsFeaturedEventComponent[];
  pageDate?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const t = useTranslations('newsPage');
  const hookLocale = useLocale();
  const locale = hookLocale || propLocale || 'en';
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  // Derive slug the same way the detail page does
  function slugifyEvent(fe: NewsFeaturedEventComponent, idx: number): string {
    if (fe.href) {
      const raw = fe.href.trim();
      return raw
        .replace(/^\/[a-z]{2}\/news\//, '')
        .replace(/^\/news\//, '')
        .replace(/^\//, '')
        || `story-${idx}`;
    }
    const title = fe.title || `${fe.headlineLine1 || ''} ${fe.headlineLine2 || ''}`.trim() || `story-${idx}`;
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Unique categories from all events
  const categories = ['All', ...Array.from(
    new Set(events.map(fe => fe.category || fe.eyebrow || 'News').filter(Boolean))
  ) as string[]];

  const visible = activeCategory === 'All'
    ? events
    : events.filter(fe => (fe.category || fe.eyebrow || 'News') === activeCategory);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) pb-[clamp(3rem,5vw,6rem)] pt-[clamp(2.5rem,4vw,5rem)]">
        {/* Category filter chips */}
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((cat) => {
            const on = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={on}
                className={`rounded-full border px-6 py-2 text-sm font-bold transition-colors cursor-pointer ${
                  on
                    ? 'border-[#048ED6] bg-[#048ED6] text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#048ED6] hover:text-[#048ED6]'
                }`}
              >
                {cat === 'All' ? (t('categories.0') || 'All') : cat}
              </button>
            );
          })}
        </div>

        <div className="mt-[clamp(1.5rem,2.5vw,2.5rem)] grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((fe, idx) => {
            const slug = slugifyEvent(fe, idx);
            const imageUrl = (fe.image ? getStrapiMediaUrl(fe.image) : null) || '/images/figma-home/09.png';
            const catLabel = fe.category || fe.eyebrow || 'News';
            const title = fe.title || fe.headlineLine1 || 'School Story';
            const summary = fe.blurb || fe.lede || '';
            const eventDate = resolveEventDate(fe, pageDate);
            const displayDate = formatCardDate(eventDate, locale);

            return (
              <article
                key={fe.id || idx}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded border border-[#048ED6] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#048ED6]">
                      {catLabel}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {displayDate}
                    </span>
                  </div>

                  <h3 className="mb-3 font-serif text-xl font-bold text-gray-900 transition-colors group-hover:text-[#048ED6]">
                    <Link href={href(`/news/${slug}`)} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden />
                      {title}
                    </Link>
                  </h3>

                  <p className="flex-1 text-base leading-relaxed text-gray-600">{summary}</p>

                  <span className="mt-6 flex items-center gap-1 text-sm font-bold text-[#048ED6] transition-all group-hover:gap-2">
                    {t('readMore') || 'Read More'} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 text-gray-500">{t('emptyState', { category: activeCategory })}</p>
        )}
      </div>
    </section>
  );
}

