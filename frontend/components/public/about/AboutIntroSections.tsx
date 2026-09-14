'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { AboutIntroSectionComponent } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

/**
 * About — page header and the "Education, Practice and Advocacy" intro.
 * Implemented from Figma node 384-1451 (about page frame, 1920×6100).
 *
 * Design reference values (measured off the 1920 export):
 *   header band #FAFCFE, y99→430 · ink #121C2A · body #3F4941
 *   crumb 15 · title 52 · sub 18/29 (max 652 wide, centred)
 *   badge: solid #048ED6 pill, white text, 112×30
 *   intro heading 48/53 — second line italic #005F39
 *   intro content spans x304→1616 (1312 wide), image 736×558
 *
 * Note the intro is inset further than the rest of the site (304px margins at
 * 1920 vs ~142 elsewhere), so its grid carries its own max-width inside the
 * standard hero-width wrapper rather than filling it.
 */

export function AboutIntroSection({ data }: { data?: AboutIntroSectionComponent }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef     = useRef<HTMLImageElement>(null);
  const t = useTranslations('aboutPage.intro');
  const locale = useLocale();
  const yearFormatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, { useGrouping: false });
  const yearStr = yearFormatter.format(2020);

  const badge = data?.badge || t('badge', { year: yearStr });
  const title1 = data?.title1 || t('title1');
  const title2 = data?.title2 || t('title2');
  const description = data?.description || t('description');
  const imageUrl = data?.image ? getStrapiMediaUrl(data.image) : (data?.imageUrl || "/images/figma-home/03-programs.jpeg");

  useEffect(() => {
    const onScroll = () => {
      // Only run on desktop (≥1024 px, matching Tailwind's `lg` breakpoint)
      if (window.innerWidth < 1024) {
        if (imgRef.current) imgRef.current.style.transform = '';
        return;
      }
      const wrapper = wrapperRef.current;
      const img     = imgRef.current;
      if (!wrapper || !img) return;

      const rect     = wrapper.getBoundingClientRect();
      const viewH    = window.innerHeight;
      // progress: 0 when top of card hits bottom of viewport → 1 when bottom hits top
      const progress = 1 - (rect.bottom / (viewH + rect.height));
      // move the image ±40px relative to its container
      const offset   = (progress - 0.5) * 80;
      img.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initialise on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.1rem,4.5vw,5.5rem)]">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,530fr)_minmax(0,736fr)] items-center md:gap-y-10 max-md:gap-5 md:gap-x-[clamp(2rem,3.4vw,4rem)]">

          <div>
            <span className="inline-flex items-center h-[30px] px-4 rounded-full bg-[#048ED6] text-white font-semibold tracking-[0.06em] text-[clamp(0.6875rem,0.63vw,0.75rem)]">
              {badge}
            </span>

            <h2 className="mt-[clamp(1.25rem,1.7vw,2rem)] font-bold text-[#121C2A] tracking-[-0.015em] leading-[1.1] text-[clamp(1.5rem,2.5vw,3rem)]">
              {title1}
              <br  className='max-md:hidden'/>
              <span className="italic text-(--color-primary) max-md:pl-[1px]"> {title2}</span>
            </h2>

            <p className="mt-[clamp(1.25rem,1.5vw,1.8rem)] max-w-[600px] text-[#3F4941] leading-[1.81] text-[1rem]">
              {description}
            </p>
          </div>

          <div ref={wrapperRef} className="w-full aspect-[736/558] rounded-[18px] overflow-hidden">
            <div className='aboutImage w-full h-full relative'>
              <img
                ref={imgRef}
                src={imageUrl || ''}
                alt="The Yahaya International campus"
                className="w-full h-full object-cover transition-transform duration-75 ease-linear"
                style={{ willChange: 'transform' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
