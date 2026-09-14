'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { useTranslations } from 'next-intl';

import 'swiper/css';

/**
 * Home — "Latest News & Updates".
 * Implemented from Figma node 546-673 (frame 1920×1029).
 *
 * Design reference values (measured at the 1920 frame):
 *   ink #1A1C1C · body #3F4941 · excerpt #545F73 · brand #048ED6 · well #E6F0FB
 *   heading 35 · body 16/21 · card title 21/25 · excerpt 15/20 · Read More 15
 *   card 392 wide, gap 23 · image 392×257 · card padding 25 · arrows 45×45
 *
 * Copy note: cards 1–3 still carry the Figma's template placeholder copy
 * ("New Office Opening", "TrustVibe 2.0", …), which came from the same
 * source template as the testimonials section. Replace with real Yahaya
 * news — this list is the static fallback until Strapi is wired up.
 */

// const NEWS = [
//   {
//     id: 1,
//     title: 'Expanding Our Horizons: New Office Opening',
//     excerpt:
//       'We are thrilled to announce the opening of our newest innovation hub, designed to foster...',
//     category: 'CORPORATE',
//     image: '/images/figma-home/02-about.jpeg',
//     link: '/news/expanding-horizons',
//   },
// ...
// ];

function NavButton({
  dir,
  onClick,
  disabled,
}: {
  dir: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous news' : 'Next news'}
      className="w-[45px] h-[45px] shrink-0 grid place-items-center rounded-full border border-[#81B6EB] text-[#048ED6] bg-white transition-colors hover:bg-[#E6F0FB] disabled:opacity-35 disabled:hover:bg-white disabled:cursor-default"
    >
      <Icon className="w-[18px] h-[18px] rtl:rotate-180" />
    </button>
  );
}

import type { HomepageEntity, NewsFeaturedEventComponent } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

interface NewsGridSectionProps {
  locale?: string;
  data?: HomepageEntity | any | null;
  newsEvents?: NewsFeaturedEventComponent[];
}

export function NewsGridSection({ locale = 'en', data, newsEvents }: NewsGridSectionProps) {
  const t = useTranslations('newsSection');
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const eyebrow = data?.newsEyebrow || t('eyebrow');
  const heading = data?.newsHeading || t('heading');
  const description = data?.newsDescription || t('description');
  const readMoreText = data?.newsReadMoreText || t('readMore');

  const defaultNews = [
    {
      id: 1,
      title: t('items.n1.title'),
      excerpt: t('items.n1.excerpt'),
      category: t('items.n1.category'),
      image: '/images/figma-home/02-about.jpeg',
      link: '/news/expanding-horizons',
    },
    {
      id: 2,
      title: t('items.n2.title'),
      excerpt: t('items.n2.excerpt'),
      category: t('items.n2.category'),
      image: '/images/figma-home/09.png',
      link: '/news/tech-summit',
    },
    {
      id: 3,
      title: t('items.n3.title'),
      excerpt: t('items.n3.excerpt'),
      category: t('items.n3.category'),
      image: '/images/figma-home/15-news.jpeg',
      link: '/news/trustvibe-update',
    },
    {
      id: 4,
      title: t('items.n4.title'),
      excerpt: t('items.n4.excerpt'),
      category: t('items.n4.category'),
      image: '/images/figma-home/03-programs.jpeg',
      link: '/news/global-standards',
    },
    {
      id: 5,
      title: t('items.n5.title'),
      excerpt: t('items.n5.excerpt'),
      category: t('items.n5.category'),
      image: '/images/figma-home/13.png',
      link: '/news/bilingual-education',
    },
  ];

  const formatHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    return `/${locale}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const NEWS = (newsEvents && newsEvents.length > 0)
    ? newsEvents.map((fe, idx) => {
        const rawHref = fe.href?.trim();
        let link = '/news';
        if (rawHref) {
          link = rawHref;
        } else {
          const rawSlug = (fe.title || [fe.headlineLine1, fe.headlineLine2].filter(Boolean).join(' ') || `story-${idx}`)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/&/g, '-and-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
          link = `/news/${rawSlug}`;
        }
        return {
          id: fe.id || idx + 1,
          title: fe.title || [fe.headlineLine1, fe.headlineLine2].filter(Boolean).join(' ') || '',
          excerpt: fe.lede || fe.blurb || '',
          category: fe.category || fe.eyebrow || 'NEWS',
          image: getStrapiMediaUrl(fe.image?.url) || defaultNews[idx % defaultNews.length].image,
          link: formatHref(link),
        };
      })
    : defaultNews.map((n) => ({ ...n, link: formatHref(n.link) }));

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headerVariants: any = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const sync = (sw: SwiperClass) => {
    setAtStart(sw.isBeginning);
    setAtEnd(sw.isEnd);
  };

  return (
    <section className="w-full bg-white overflow-hidden pt-[clamp(2rem,6.1vw,7.4rem)] sm:pt-[clamp(3rem,6.1vw,7.4rem)] pb-[clamp(2rem,3.7vw,4rem)] sm:pb-[clamp(3.5rem,6.7vw,8rem)]">
      <div key={isDesktop ? 'desktop' : 'mobile'} className="contents">
        <div className="max-w-[1920px] mx-auto px-(--spacing-side)">
          {/* ── Header, arrows flanking the centred text ────────────── */}
          <div className="flex items-center justify-center gap-[clamp(1rem,3.6vw,4.4rem)]">
            <div className="max-sm:hidden">
              <NavButton dir="prev" onClick={() => swiper?.slidePrev()} disabled={atStart} />
            </div>

            <motion.div
              className="flex flex-col items-center text-center"
              initial={isDesktop ? "hidden" : "visible"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={isDesktop ? headerVariants : {}}
            >
              <motion.span
                variants={isDesktop ? itemVariants : {}}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#E6F0FB] text-[#048ED6] font-semibold text-[15px]"
              >
                <GraduationCap className="w-5 h-5" />
                {eyebrow}
              </motion.span>
              <motion.h2
                variants={isDesktop ? itemVariants : {}}
                className="mt-[clamp(0.75rem,1.2vw,1.45rem)] font-bold text-[#1A1C1C] tracking-[-0.015em] leading-[1.1] text-[clamp(1.5rem,1.82vw,2.1875rem)]"
              >
                {heading}
              </motion.h2>
              <motion.p
                variants={isDesktop ? itemVariants : {}}
                className="mt-[clamp(0.75rem,1.4vw,1.7rem)] max-w-[620px] text-[#3F4941] leading-[1.31] text-[1rem]"
              >
                {description}
              </motion.p>
            </motion.div>

            <div className="max-sm:hidden">
              <NavButton dir="next" onClick={() => swiper?.slideNext()} disabled={atEnd} />
            </div>
          </div>

          {/* ── Card carousel ───────────────────────────────────────── */}
          <motion.div
            initial={isDesktop ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={isDesktop ? headerVariants : {}}
          >
            <Swiper
              onSwiper={(sw) => {
                setSwiper(sw);
                sync(sw);
              }}
              onSlideChange={sync}
              onResize={sync}
              speed={600}
              spaceBetween={23}
              slidesPerView={1.15}
              breakpoints={{
                769: { slidesPerView: 2 },
                1025: { slidesPerView: 3 },
                1281: { slidesPerView: 4 },
              }}
              className="news-swiper mt-[clamp(2.5rem,4.7vw,5.7rem)]"
            >
              {NEWS.map((n) => (
                <SwiperSlide key={n.id} className="h-auto">
                  <motion.article
                    variants={isDesktop ? itemVariants : {}}
                    className="h-full flex flex-col rounded-xl overflow-hidden bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)]"
                  >
                    <div className="w-full aspect-[392/257] overflow-hidden">
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col flex-1 max-sm:p-[15px] sm:px-[25px] sm:pt-[29px] sm:pb-[clamp(2rem,2.8vw,3.3rem)]">
                      <span className="self-start px-3 py-[3px] rounded-full border border-[#C9D8EA] text-[#048ED6] font-semibold uppercase tracking-[0.08em] text-[11px]">
                        {n.category}
                      </span>

                      <h3 className="mt-[18px] font-medium text-[#1A1C1C] leading-[1.19] text-[clamp(1.0625rem,1.09vw,1.3125rem)]">
                        {n.title}
                      </h3>

                      <p className="mt-[16px] text-[#545F73] leading-[1.33] text-[1rem]">
                        {n.excerpt}
                      </p>

                      <Link
                        href={n.link}
                        className="mt-auto pt-[15px] sm:pt-[34px] inline-flex items-center gap-2 self-start text-[#048ED6] text-[clamp(0.875rem,0.78vw,0.9375rem)] transition-colors hover:text-[#037ab8]"
                      >
                        <span>{readMoreText}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </Link>
                    </div>
                  </motion.article>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          {/* Arrows move below the cards on the narrowest screens */}
          <div className="sm:hidden mt-8 flex items-center justify-center gap-4">
            <NavButton dir="prev" onClick={() => swiper?.slidePrev()} disabled={atStart} />
            <NavButton dir="next" onClick={() => swiper?.slideNext()} disabled={atEnd} />
          </div>

        </div>
      </div>

      <style>{`
        /* Swiper's stylesheet loads after Tailwind, so its bare .swiper-slide
           height:100% beats utilities — cards need to stretch to the tallest. */
        .news-swiper {
          /* room for the card shadow inside Swiper's overflow:hidden.
             margin-inline, NOT the margin shorthand — this rule loads after
             Tailwind and a shorthand would silently wipe the mt-[...] utility. */
          padding: 6px;
          margin-inline: -6px;
        }
        .news-swiper .swiper-slide { height: auto; display: flex; }
        .news-swiper .swiper-slide > * { width: 100%; }
      `}</style>
    </section>
  );
}
