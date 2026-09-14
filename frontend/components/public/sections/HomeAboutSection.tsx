'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslations, useLocale } from 'next-intl';
import type { HomepageEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Home — "About Our Legacy" section.
 * Implemented from Figma node 533-415 (frame 1920×897).
 */

// Sampled from the Figma wave every 20px, normalised to a 660×126 box.
const WAVE_EDGE =
  'M0,0 L20,5 L40,10 L60,13 L80,15 L100,17 L120,21 L140,25 L160,30 L180,36 L200,42 L220,49 L240,55 L260,63 L280,70 L300,77 L320,82 L340,87 L360,92 L380,95 L400,99 L420,102 L440,105 L460,107 L480,110 L500,112 L520,114 L540,116 L560,117 L580,119 L600,120 L620,122 L640,123 L660,126 L0,126 Z';
const WAVE_FILL =
  'M0,7 L20,12 L40,17 L60,20 L80,22 L100,24 L120,28 L140,32 L160,37 L180,43 L200,49 L220,56 L240,62 L260,70 L280,77 L300,84 L320,89 L340,94 L360,99 L380,102 L400,106 L420,109 L440,112 L460,114 L480,117 L500,119 L520,121 L540,123 L560,124 L580,126 L660,126 L0,126 Z';

export function HomeAboutSection({ data, locale: localeProp }: { data?: HomepageEntity | null; locale?: string }) {
  const t = useTranslations('homeAbout');
  const activeLocale = useLocale();
  const locale = localeProp || activeLocale;
  const [isDesktop, setIsDesktop] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const eyebrow = data?.aboutEyebrow || t('eyebrow');
  const headingLine1 = data?.aboutHeadingLine1 || t('headingLine1');
  const headingLine2 = data?.aboutHeadingLine2 || t('headingLine2');
  const headingHighlight = data?.aboutHeadingHighlight || t('headingHighlight');
  const body = data?.aboutBody || t('body');
  const caption = data?.aboutCaption || t('caption');
  const imageSrc = getStrapiMediaUrl(data?.aboutImage?.url) || '/home/aboutImage.png';

  const STATS = [
    {
      icon: '/home/graduate.png',
      w: 33,
      h: 27,
      num: data?.aboutStat1Number ?? 250,
      suffix: data?.aboutStat1Suffix || '+',
      label: data?.aboutStat1Label || t('students')
    },
    {
      icon: '/home/people.png',
      w: 20,
      h: 20,
      num: data?.aboutStat2Number ?? 25,
      suffix: data?.aboutStat2Suffix || '+',
      label: data?.aboutStat2Label || t('employees')
    },
    {
      icon: '/home/approve.png',
      w: 20,
      h: 19,
      num: data?.aboutStat3Number ?? 6,
      suffix: data?.aboutStat3Suffix || '+',
      label: data?.aboutStat3Label || t('years')
    },
  ] as const;


  useEffect(() => {
    // 1280px is Tailwind's xl breakpoint
    const mq = window.matchMedia('(min-width: 1280px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      const counters = gsap.utils.toArray<HTMLElement>('.stat-value');
      counters.forEach((counter) => {
        const targetVal = parseInt(counter.getAttribute('data-target') || '0', 10);
        const suffix = counter.getAttribute('data-suffix') || '';

        const obj = { val: 0 };
        gsap.to(obj, {
          val: targetVal,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: counter,
            start: 'top 85%',
          },
          onUpdate: () => {
            const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale).format(Math.floor(obj.val));
            counter.innerText = formatted + suffix;
          },
        });
      });

      // Parallax and Scale effect
      gsap.fromTo(
        '.aboutImageWrapper',
        { y: 50 },
        {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: '.aboutImageWrapper',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        '.aboutImage',
        { scale: 1.2 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.aboutImageWrapper',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isDesktop]);

  return (
    <section ref={sectionRef} className="relative w-full bg-white overflow-hidden pt-[clamp(2rem,3.7vw,2.5rem)] sm:pt-[clamp(3.5rem,6.7vw,8rem)] pb-[clamp(6rem,8.3vw,10rem)]">
      <div key={isDesktop ? 'desktop' : 'mobile'} className="contents">
        <div className="max-w-[1920px] mx-auto px-(--spacing-side)">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] items-center gap-y-14 gap-x-[clamp(2.5rem,9vw,11rem)]">

          {/* ── Left column ─────────────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={isDesktop ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
              whileInView={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex items-center gap-[15px]"
            >
              <span className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-lg bg-[#E6F0FB]">
                <img src="/home/about.png" alt="" width={21} height={23} aria-hidden />
              </span>
              <span className="relative inline-block pb-[11px]">
                <span className="text-xs sm:text-[clamp(0.875rem,0.94vw,1.125rem)] tracking-[0.02em] uppercase text-[#048ED6]">
                  {eyebrow}
                </span>
                <span className="absolute bottom-0 left-0 w-[56%] h-[3px] rounded-full bg-(--color-primary)" />
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={isDesktop ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
              whileInView={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="mt-[clamp(2rem,3.1vw,3.7rem)] font-bold text-[#111C2D] text-[clamp(1.5rem,2.29vw,2.75rem)] leading-[1.09] tracking-[-0.01em]"
            >
              {headingLine1} <br className="max-sm:hidden" />
              {headingLine2} <span className="text-[#048ED6]">{headingHighlight}</span>
            </motion.h2>

            {/* Body */}
            <motion.p
              initial={isDesktop ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
              whileInView={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="mt-[clamp(1.25rem,1.5vw,1.8rem)] max-w-[38rem] text-[#414751] text-[clamp(1rem,0.94vw,1.125rem)] leading-[1.61]"
            >
              {body}
            </motion.p>

            {/* Stats */}
            <div className="mt-[clamp(3rem,5.4vw,6.4rem)] flex justify-between max-w-[600px] gap-4">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={isDesktop ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  whileInView={isDesktop ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  <span className="w-[60px] h-[60px] grid place-items-center rounded-full bg-[#E6F0FB]">
                    <img src={s.icon} alt="" width={s.w} height={s.h} aria-hidden />
                  </span>
                  <span 
                    className="stat-value mt-[30px] font-bold text-[#111C2D] text-[clamp(1.5rem,1.46vw,1.75rem)] leading-none whitespace-nowrap"
                    data-target={s.num}
                    data-suffix={s.suffix}
                  >
                    {new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale).format(s.num)}{s.suffix}
                  </span>
                  <span className="mt-[16px] text-[#414751] text-[clamp(0.875rem,0.83vw,1rem)] leading-none whitespace-nowrap">
                    {s.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Right column ────────────────────────────────────────── */}
          <motion.div
            initial={isDesktop ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }}
            whileInView={isDesktop ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative w-full md:mb-[40px]"
          >
            <div className="aboutImageWrapper relative w-full aspect-[855/570] rounded-2xl overflow-hidden">
              <img
                src={imageSrc}
                alt="Yahaya students studying together in class"
                className="aboutImage w-full h-full object-cover"
              />
            </div>

            {/*
              Caption card. The Figma only specifies the desktop treatment, where the card
              overlaps the photo and hangs 40px below it. Below md the copy wraps to ~7 lines
              and would cover the whole photo, so it stacks underneath with a small overlap.
            */}
            <div className="relative mx-4 -mt-8 md:mx-0 md:mt-0 md:absolute md:left-[9.4%] md:right-[6.1%] md:-bottom-[40px] flex items-center rounded-xl bg-[#048ED6] px-5 md:px-[28px] py-[17px] gap-4 md:gap-[24px]">
              <span className="w-[52px] h-[52px] shrink-0 grid place-items-center rounded-full bg-white">
                <img src="/home/book.png" alt="" width={25} height={21} aria-hidden />
              </span>
              <span className="w-px self-stretch shrink-0 bg-white/40" />
              <p className="text-white text-[clamp(1rem,1.04vw,1.25rem)] leading-[1.5]">
                {caption}
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Decorative wave, bottom-left */}
      <motion.svg
        initial={isDesktop ? { opacity: 0, scaleX: 0, transformOrigin: "left" } : { opacity: 1, scaleX: 1, transformOrigin: "left" }}
        whileInView={isDesktop ? { opacity: 1, scaleX: 1 } : { opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        viewBox="0 0 660 126"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 w-[34.3%] min-w-[320px] h-[clamp(4rem,6.6vw,7.9rem)]"
      >
          <path d={WAVE_EDGE} fill="#28289D" />
          <path d={WAVE_FILL} fill="#048ED6" />
        </motion.svg>
      </div>
    </section>
  );
}
