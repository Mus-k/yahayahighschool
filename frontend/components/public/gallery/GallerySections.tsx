'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { MediaLightbox, type MediaItem } from '@/components/public/shared/MediaLightbox';

import 'swiper/css';
import 'swiper/css/free-mode';

import { useTranslations } from 'next-intl';
import type { GalleryItemEntity } from '@/types/cms.types';

/**
 * Gallery page. Implemented from Figma node 384-3717 (frame 1920×4655).
 *
 * Design reference values (measured off the 1920 export, half-scale sampling):
 *   hero band full-bleed, y102→628 (528 tall)
 *   grid 3 × 518 at x142/700/1258 — 42 column gutter, 60 row gutter, tiles 518×364
 *   video section full-bleed #048ED6, y2332→3348 · CTA card #F2F9FD, 450 tall
 */

const CATEGORIES = ['All', 'Academic Excellence', 'Spiritual Life', 'Sports & Arts', 'Campus Facilities'] as const;
type Category = (typeof CATEGORIES)[number];

type Shot = { src: string; alt: string; category: Exclude<Category, 'All'> };

const SHOTS: Shot[] = [
  { src: '/images/figma-home/13.png', alt: 'Students reading in the library', category: 'Campus Facilities' },
  { src: '/images/figma-home/19.png', alt: 'Students walking on campus', category: 'Sports & Arts' },
  { src: '/images/figma-home/07-activity.png', alt: 'Students outside the school building', category: 'Spiritual Life' },
  { src: '/images/figma-home/09.png', alt: 'A science lesson in progress', category: 'Academic Excellence' },
  { src: '/images/figma-home/17.png', alt: 'Group study in the library', category: 'Academic Excellence' },
  { src: '/images/figma-home/15-news.jpeg', alt: 'Staff meeting on campus', category: 'Campus Facilities' },
  { src: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building', category: 'Campus Facilities' },
  { src: '/images/figma-home/02-about.jpeg', alt: 'Working in the administration office', category: 'Academic Excellence' },
  { src: '/images/figma-home/09.png', alt: 'Classroom discussion', category: 'Spiritual Life' },
];

const PAGE = 9;

/**
 * Hero panels. Slanted parallelograms on a draggable strip.
 *
 * Measured off the 1920 export: the band runs y103→629 (526 tall), seams sit at
 * x 506 / 1016 / 1524 — a 509px pitch — and each seam leans dx/dy = -0.205,
 * i.e. 11.6 degrees, a 108px horizontal run across the band. The first panel's
 * left edge lands at -3, so the strip starts flush to the viewport.
 *
 * Paths come from SHOTS, which was checked image-by-image; do not add a new one
 * here without opening it first.
 */
const HERO_PANELS = [
  { src: '/images/figma-home/07-activity.png', alt: 'Students outside the school building' },
  { src: '/images/figma-home/17.png', alt: 'Group study in the library' },
  { src: '/images/figma-home/19.png', alt: 'Students walking on campus' },
  { src: '/images/figma-home/09.png', alt: 'A lesson in progress', video: true },
  { src: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building' },
  { src: '/images/figma-home/13.png', alt: 'Students reading in the library' },
  { src: '/images/figma-home/15-news.jpeg', alt: 'Staff meeting on campus' },
  { src: '/images/figma-home/02-about.jpeg', alt: 'Working in the administration office' },
];

export function GalleryHero() {
  // The panels form one navigable group; the film is a separate single item so
  // paging through the stills never lands on it.
  const [viewing, setViewing] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rail, setRail] = useState<SwiperClass | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const stills: MediaItem[] = HERO_PANELS.map((p) => ({ type: 'image', src: p.src, alt: p.alt }));

  // A strip that drifts on its own is exactly the motion someone asking for
  // reduced motion wants stopped, so honour the preference and keep watching it.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Nothing should keep drifting underneath an open lightbox.
  useEffect(() => {
    if (!rail || rail.destroyed || !rail.autoplay) return;
    const shouldRun = !reduceMotion && viewing === null && !playing;
    if (shouldRun) rail.autoplay.start();
    else rail.autoplay.stop();
  }, [rail, reduceMotion, viewing, playing]);

  return (
    <section className="gh relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, FreeMode]}
        onSwiper={setRail}
        slidesPerView="auto"
        spaceBetween={0}
        grabCursor
        loop
        // A hero strip should feel dragged, not stepped — freeMode lets it
        // glide and settle wherever the drag ends instead of snapping.
        freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
        // Steps one panel every few seconds. Deliberately a real interval
        // rather than the delay:0 continuous-marquee trick, which is far more
        // version-sensitive. disableOnInteraction false means a drag pauses
        // autoplay rather than killing it off for the rest of the visit.
        speed={800}
        autoplay={
          reduceMotion
            ? false
            : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
        }
        className="gh-rail"
      >
        {HERO_PANELS.map((panel, i) => (
          <SwiperSlide key={i} className="gh-slide">
            <div className="gh-frame relative h-full w-full overflow-hidden">
              {/* Counter-skewed so the photograph itself stays upright — only
                  the frame is a parallelogram. */}
              <img src={panel.src} alt={panel.alt} className="gh-img object-cover" draggable={false} />

              {/* A sibling overlay rather than wrapping the image, so the play
                  badge below is not a button inside a button. Swiper's
                  preventClicks keeps a drag from registering as a click. */}
              <button
                type="button"
                aria-label={`View photograph: ${panel.alt}`}
                onClick={() => setViewing(i)}
                className="absolute inset-0 z-[1] cursor-zoom-in"
              />

              {panel.video ? (
                <button
                  type="button"
                  aria-label="Play the campus film"
                  onClick={() => setPlaying(true)}
                  className="gh-play absolute left-1/2 top-1/2 z-[2] grid h-[clamp(2.25rem,2.9vw,3.5rem)] w-[clamp(2.25rem,2.9vw,3.5rem)] place-items-center rounded-full bg-[#048ED6] text-white shadow-lg transition-colors hover:bg-[#037ab8]"
                >
                  <Play className="h-[38%] w-[38%] fill-current" />
                </button>
              ) : null}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <MediaLightbox
        items={stills}
        index={viewing}
        onClose={() => setViewing(null)}
        onIndexChange={setViewing}
      />

      <MediaLightbox
        items={[{ type: 'video', src: PROMO, title: 'Life at Yahaya International', poster: HERO_PANELS[3].src }]}
        index={playing ? 0 : null}
        onClose={() => setPlaying(false)}
      />

      <style>{`
        .gh {
          --slant: 11.6deg;
          /* 526px at 1920 == 27.4vw, with a floor so it stays a band on phones */
          --hero-h: clamp(13.75rem, 27.4vw, 32.875rem);
          /* horizontal run of the slant across the band: h * tan(11.6deg) */
          --run: calc(var(--hero-h) * 0.2053);
        }
        /* The leading edge leans right, so its topmost point is its rightmost.
           Shifting the strip left by half a run puts that point at x=0 and the
           rest off-screen — matching the design, where panel 1 starts at -3. */
        .gh-rail.swiper {
          height: var(--hero-h);
          margin-left: calc(var(--run) / -2);
          width: calc(100% + var(--run));
        }
        /* 509/1920 == 26.5vw at desktop; wider panels on small screens or they
           become slivers once the slant eats into them. */
        .gh-rail .swiper-slide { width: 62vw; height: 100%; }
        @media (min-width: 769px)  { .gh-rail .swiper-slide { width: 42vw; } }
        @media (min-width: 1281px) { .gh-rail .swiper-slide { width: 26.5vw; } }

        .gh-frame { transform: skewX(calc(var(--slant) * -1)); }
        /* Skewing the frame leaves a triangle bare at each corner, so the image
           is widened by exactly one run and pulled back half of it — at the top
           the skew shifts it left by run/2, at the bottom right by run/2, which
           lands both edges flush. The 2px is slack against rounding. */
        .gh-img {
          position: absolute;
          top: 0;
          height: 100%;
          /* Preflight sets img { max-width: 100% }, which silently clamped the
             widened image back to the slide width and left the frame's overhang
             bare — that was the white wedge between panels. */
          max-width: none;
          left: calc(var(--run) / -2 - 1px);
          width: calc(100% + var(--run) + 2px);
          transform: skewX(var(--slant));
        }
        /* Undo the frame skew for the badge so it stays a circle. */
        .gh-play { transform: translate(-50%, -50%) skewX(var(--slant)); }
      `}</style>
    </section>
  );
}

export function PhotoGrid({ items = [] }: { items?: GalleryItemEntity[] }) {
  const [filter, setFilter] = useState<string>('All');
  const [shown, setShown] = useState(PAGE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const t = useTranslations('galleryPage');

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  const matching = filter === 'All' ? items : items.filter((s) => s.category === filter);
  const visible = matching.slice(0, shown);
  const more = shown < matching.length;

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(2rem,3.7vw,4.4rem)]">
        <h2 className="font-serif text-[#121C2A] leading-tight text-[clamp(1.5rem,1.87vw,2.25rem)]">
          {t('photoGrid.title')}
        </h2>

        <div className="mt-[clamp(1.25rem,1.9vw,2.25rem)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((c) => {
              const on = c === filter;
              return (
                <button
                  key={c as string}
                  type="button"
                  onClick={() => { setFilter(c as string); setShown(PAGE); }}
                  aria-pressed={on}
                  className={`h-[34px] px-4 rounded-full border transition-colors text-[clamp(1rem,0.63vw,1.1rem)] cursor-pointer ${on
                    ? 'bg-[#048ED6] border-[#048ED6] text-white'
                    : 'bg-white border-[#DCE4EC] text-[#3F4941] hover:border-[#9CCBEC] hover:text-[#048ED6]'
                    }`}
                >
                  {c === 'All' ? t('categories.All') : c}
                </button>
              );
            })}
          </div>

          <a
            href="#videos"
            className="inline-flex items-center gap-2 h-[38px] px-5 rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8] text-[clamp(1rem,0.68vw,1.5rem)]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {t('photoGrid.playVideos')}
          </a>
        </div>

        <div className="mt-[clamp(1.5rem,2.1vw,2.5rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:gap-x-[42px] max-md:gap-5 md:gap-y-[60px]">
          {visible.map((s, i) => {
            const src = s.mediaFile?.url || '/images/figma-home/13.png';
            return (
            <figure key={`${src}-${i}`} className="w-full aspect-[518/364] cursor-pointer overflow-hidden rounded-md">
              <button
                type="button"
                aria-label={`Open photo: ${s.title}`}
                onClick={() => setLightboxIndex(i)}
                className="group relative block w-full h-full cursor-pointer"
              >
                <img src={src} alt={s.title || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 grid place-items-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 grid place-items-center rounded-full bg-white/90 text-[#048ED6]">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M15 3h6m0 0v6m0-6-7 7M9 21H3m0 0v-6m0 6 7-7" />
                    </svg>
                  </span>
                </span>
              </button>
            </figure>
            )})}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 text-center text-[#3F4941]">{t('photoGrid.empty')}</p>
        )}

        {more && (
          <div className="mt-[clamp(1.75rem,2.6vw,3.125rem)] flex justify-center">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="h-[38px] px-6 rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
            >
              {t('photoGrid.loadMore')}
            </button>
          </div>
        )}

        <MediaLightbox
          items={visible.map((s) => ({ type: s.mediaType as 'image'|'video', src: s.mediaFile?.url || '', alt: s.title || '', title: s.title || '' }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(next) => setLightboxIndex(next)}
        />
      </div>
    </section>
  );
}

// promo1.mp4 is the only footage supplied so far, so every card opens it. Give
// each entry its own `src` as the real clips arrive — nothing else needs to
// change.
const PROMO = '/videos/promo1.mp4';
const CLIPS = [
  { key: 'testimonials', poster: '/images/figma-home/09.png', src: PROMO },
  { key: 'library', poster: '/images/figma-home/17.png', src: PROMO },
  { key: 'reading', poster: '/images/figma-home/13.png', src: PROMO },
  { key: 'campus', poster: '/images/figma-home/19.png', src: PROMO },
  { key: 'assembly', poster: '/images/figma-home/07-activity.png', src: PROMO },
];

/**
 * Two linked sliders: the feature runs horizontally, the rail beside it runs
 * vertically, both at 800ms. They are driven manually rather than through
 * Swiper's Thumbs module — that module repositions the rail on its own and
 * fights any explicit slideTo (learned the hard way on the testimonials).
 */
export function VideoHighlights() {
  const [main, setMain] = useState<SwiperClass | null>(null);
  const [rail, setRail] = useState<SwiperClass | null>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const t = useTranslations('galleryPage');

  // Swiper's own resizeObserver doesn't re-fire for these two (the rail is
  // absolutely positioned, the feature is sized by an aspect-ratio box), so a
  // viewport change leaves stale inline slide widths behind. Re-measure both.
  // Debounced on a timer rather than rAF: rAF is suspended while the tab is
  // hidden, so a resize/rotation in the background would never be picked up.
  useEffect(() => {
    if (!main && !rail) return;
    let t: ReturnType<typeof setTimeout>;
    const sync = () => {
      if (main && !main.destroyed) main.update();
      if (rail && !rail.destroyed) {
        // Crossing lg flips the rail between horizontal and vertical. That is
        // decided in setBreakpoint(), which update() does not call.
        rail.setBreakpoint?.();
        rail.update();
      }
    };
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(sync, 100);
    };
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [main, rail]);

  const go = (i: number) => main?.slideTo(i);

  return (
    <section id="videos" className="w-full h-full bg-[#048ED6] overflow-x-clip">
      <div className="max-w-[1920px] h-full mx-auto px-(--spacing-side) py-[clamp(1.5rem,4.7vw,5.7rem)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-white leading-tight text-[clamp(1.5rem,2.29vw,2.75rem)]">
              {t('videoHighlights.title')}
            </h2>
            <p className="mt-3 max-w-[720px] text-white/85 text-[1rem]">
              {t('videoHighlights.blurb')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous video"
              onClick={() => main?.slidePrev()}
              disabled={active === 0}
              className="w-[34px] h-[34px] grid place-items-center cursor-pointer rounded-full bg-white/25 text-white transition-colors hover:bg-white/40 disabled:opacity-40 disabled:hover:bg-white/25"
            >
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              aria-label="Next video"
              onClick={() => main?.slideNext()}
              disabled={active === CLIPS.length - 1}
              className="w-[34px] h-[34px] grid place-items-center cursor-pointer rounded-full bg-white text-[#048ED6] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>
        </div>

        <div className="mt-[clamp(1.5rem,2.6vw,3.125rem)] grid grid-cols-1 lg:grid-cols-[minmax(0,970fr)_minmax(0,646fr)] gap-[clamp(0.75rem,1.04vw,1.25rem)] items-stretch">
          <div className='h-fit w-full relative'>
            {/* Feature — horizontal */}
            <Swiper
              onSwiper={setMain}
              onSlideChange={(sw) => {
                setActive(sw.activeIndex);
                rail?.slideTo(sw.activeIndex);
              }}
              speed={800}
              slidesPerView={1}
              className="vh-main w-full rounded-lg overflow-hidden"
            >
              {CLIPS.map((clip, i) => (
                <SwiperSlide key={i}>
                  {/* No video sources exist yet — posters with a play affordance. */}
                  <button
                    type="button"
                    aria-label={`Play: ${t(`videoHighlights.clips.${clip.key}`)}`}
                    onClick={() => setPlaying(i)}
                    className="group relative block w-full cursor-pointer aspect-[970/560]"
                  >
                    <img src={clip.poster} alt="" aria-hidden className="w-full h-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="w-[clamp(3rem,3.6vw,4.4rem)] h-[clamp(3rem,3.6vw,4.4rem)] grid place-items-center rounded-full bg-[#048ED6] text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-5 h-5 fill-current" />
                      </span>
                    </span>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* Rail — vertical, three in view. Absolutely positioned inside this
              wrapper so its own content cannot stretch the grid row: the feature's
              aspect ratio decides the height, and the rail fills whatever that is. */}
          <div className="relative h-fit lg:min-h-[450px]">
            <Swiper
              onSwiper={setRail}
              speed={800}
              autoHeight={true}
              spaceBetween={14}
              // Direction is a JS param, not a class ("max-lg:horizontal" does
              // nothing). Below lg the rail sits under the feature, where a
              // vertical list would be a dead column, so it turns horizontal.
              // Breakpoints are min-width and mirror the project's own.
              direction="horizontal"
              slidesPerView={1.15}
              breakpoints={{
                769: { direction: 'horizontal', slidesPerView: 2 },
                1281: { direction: 'vertical', slidesPerView: 3 },
              }}
              className="vh-rail"
            >
              {CLIPS.map((clip, i) => (
                <SwiperSlide key={i} style={{ height: '100%' }}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === active ? 'true' : undefined}
                    className={`w-full h-full flex items-stretch gap-[4%] overflow-hidden rounded-lg p-[2%] text-left transition-[background-color,box-shadow] duration-300 ${i === active
                      ? 'bg-[#D6EBFB] shadow-[0_6px_18px_rgba(4,45,80,0.22)]'
                      : 'bg-white hover:shadow-lg'
                      }`}
                  >
                    {/* 228 / 646 of the card width in the design, stretched to the
                      card's inner height (228x155 at 1920). */}
                    <span className="relative w-[35%] cursor-pointer shrink-0 overflow-hidden rounded">
                      <img src={clip.poster} alt="" aria-hidden className="w-full h-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span
                          className={`w-[clamp(1.25rem,1.9vw,2.25rem)] h-[clamp(1.25rem,1.9vw,2.25rem)] grid place-items-center rounded-full transition-colors duration-300 ${i === active ? 'bg-[#048ED6] text-white' : 'bg-white/90 text-[#048ED6]'
                            }`}
                        >
                          <Play className="w-[45%] h-[45%] fill-current" />
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0 flex flex-col justify-center">
                      <span
                        className={`block font-semibold text-[clamp(1rem,1.04vw,1.35rem)] line-clamp-2 transition-colors duration-300 ${i === active ? 'text-[#036CA3]' : 'text-[#121C2A]'
                          }`}
                      >
                        {t(`videoHighlights.clips.${clip.key}`)}
                      </span>
                      <span className="mt-[0.35em] block text-[#5A636D] leading-[1.47] line-clamp-3 text-[clamp(0.8rem,0.83vw,1.1rem)]">
                        {t('videoHighlights.blurb')}
                      </span>
                    </span>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      <MediaLightbox
        items={CLIPS.map((c) => ({ type: 'video', src: c.src, title: t(`videoHighlights.clips.${c.key}`), poster: c.poster }))}
        index={playing}
        onClose={() => setPlaying(null)}
      />

      <style>{`
        /* Swiper's stylesheet loads after Tailwind, so its bare .swiper rules beat
           utilities — these two-class selectors are what actually take effect. */
        .vh-rail.swiper { position: absolute; inset: 0; }
        .vh-main .swiper-slide { height: auto; }
        @media (max-width: 1280px) {
          .vh-rail.swiper { position: static; width: 100%; height: 100%; overflow: visible; }
          .vh-rail .swiper-wrapper { overflow: visible; }
        }
      `}</style>
    </section>
  );
}

export function VisitCta() {
  const t = useTranslations('galleryPage');

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.5rem,4.2vw,5rem)]">
        <div className="max-w-[1281px] mx-auto rounded-2xl bg-[#F2F9FD] px-[clamp(1.5rem,3vw,3.6rem)] py-[clamp(2.5rem,4vw,4.8rem)] text-center">
          <span className="inline-grid place-items-center w-[clamp(2.75rem,3.1vw,3.75rem)] h-[clamp(2.75rem,3.1vw,3.75rem)] rounded-full bg-[#E6F0FB] text-[#048ED6]">
            <BookOpen className="w-5 h-5" />
          </span>

          <h2 className="mt-[clamp(1.5rem,1.5vw,1.8rem)] font-serif text-[#121C2A] leading-tight text-[clamp(1.375rem,1.77vw,2.125rem)]">
            {t('visitCta.title')}
          </h2>

          <p className="mt-[clamp(1rem,1.1vw,1.3rem)] mx-auto max-w-[660px] text-[#7A828C] leading-[1.7] text-[1rem]">
            {t('visitCta.description')}
          </p>

          <Link
            href="/contact"
            className="mt-[clamp(1.25rem,1.9vw,2.25rem)] inline-flex items-center gap-3 h-[44px] px-7 rounded-full bg-[#048ED6] text-white font-medium transition-colors hover:bg-[#037ab8] text-[clamp(0.75rem,0.73vw,0.875rem)]"
          >
            {t('visitCta.contactUs')}
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
