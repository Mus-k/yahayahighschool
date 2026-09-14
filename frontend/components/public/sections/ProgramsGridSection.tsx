'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, BookOpen, BookOpenText, GraduationCap, Laptop } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { useTranslations } from 'next-intl';
import type { HomepageEntity, SchoolAcademicProgramEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

import 'swiper/css';
import 'swiper/css/pagination';

/** The Figma uses a mosque glyph here; lucide has no equivalent. */
function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.5 8.2c0-1 .8-1.6.8-2.6 0-.7-.4-1.1-.8-1.5-.4.4-.8.8-.8 1.5 0 1 .8 1.6.8 2.6Z" />
      <path d="M3.7 9.4h1.6V20H3.7V9.4Z" />
      <path d="M13 4.2c2.6 1.3 4.4 3.3 4.4 5.5v.5H8.6v-.5c0-2.2 1.8-4.2 4.4-5.5Z" />
      <path d="M6.8 20v-6.4c0-1.6 1.3-2.9 2.9-2.9h6.6c1.6 0 2.9 1.3 2.9 2.9V20h-3.6v-3.1a2.6 2.6 0 0 0-5.2 0V20H6.8Z" />
      <path d="M19.9 12.6c.9.5 1.4 1.3 1.4 2.2V20h-1.4v-7.4Z" />
    </svg>
  );
}

/** Rows carry either a lucide component or an exported illustration. */
function RowIcon({ p, className }: { p: { Icon?: React.ElementType; iconImg?: string }; className?: string }) {
  if (p.iconImg) return <img src={p.iconImg} alt="" aria-hidden className={className} />;
  const I = p.Icon || BookOpen;
  return <I className={className} />;
}

const TITLE_CLS =
  'font-bold text-black leading-[1.05] tracking-[-0.015em] text-[clamp(1.5rem,2.6vw,3.125rem)]';
const BODY_CLS = 'text-[#576059] leading-[1.31] text-[clamp(0.9375rem,0.83vw,1rem)]';

function LearnMore({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-[#048ED6] text-white font-semibold text-[15px] shadow-md transition-colors hover:bg-[#037ab8]"
    >
      <span>{text}</span>
      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
    </Link>
  );
}

interface ProgramsGridSectionProps {
  locale?: string;
  data?: HomepageEntity | any;
  programs?: SchoolAcademicProgramEntity[];
}

export function ProgramsGridSection({ locale = 'en', data, programs }: ProgramsGridSectionProps) {
  const t = useTranslations('programsSection');
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const homepage = data as HomepageEntity | undefined;
  const eyebrow = homepage?.programsEyebrow || t('eyebrow');
  const heading = homepage?.programsTitle || t('heading');
  const description = homepage?.programsDescription || t('description');
  const learnMoreText = homepage?.programsLearnMoreText || t('learnMore');

  const defaultPrograms = [
    {
      id: 'arabic',
      title: t('programs.arabic.title'),
      desc: t('programs.arabic.desc'),
      iconImg: '/images/figma-home/11.png',
      image: '/images/figma-home/19.png',
      link: `/${locale}/programs/arabic`,
    },
    {
      id: 'english',
      title: t('programs.english.title'),
      desc: t('programs.english.desc'),
      Icon: BookOpen,
      image: '/images/figma-home/03-programs.jpeg',
      link: `/${locale}/programs/english`,
    },
    {
      id: 'dawah',
      title: t('programs.dawah.title'),
      desc: t('programs.dawah.desc'),
      Icon: MosqueIcon,
      image: '/images/figma-home/17.png',
      link: `/${locale}/programs/dawah`,
    },
    {
      id: 'online',
      title: t('programs.online.title'),
      desc: t('programs.online.desc'),
      Icon: Laptop,
      image: '/images/figma-home/03-programs.jpeg',
      link: `/${locale}/online-learning`,
    },
  ];

  const displayPrograms = (programs && programs.length > 0)
    ? programs.map((p, idx) => {
        let Icon: React.ElementType | undefined = undefined;
        let iconImg: string | undefined = undefined;
        const slug = (p.slug || '').toLowerCase();
        if (slug.includes('arabic') || slug.includes('arab')) {
          iconImg = '/images/figma-home/11.png';
        } else if (slug.includes('english')) {
          Icon = BookOpen;
        } else if (slug.includes('dawah') || slug.includes('quran') || slug.includes('islamic')) {
          Icon = MosqueIcon;
        } else if (slug.includes('online')) {
          Icon = Laptop;
        } else {
          Icon = BookOpenText;
        }

        const fallback = defaultPrograms[idx % defaultPrograms.length];
        return {
          id: p.slug || String(p.id),
          title: p.title || fallback.title,
          desc: p.shortDescription || p.description || fallback.desc,
          Icon: iconImg ? undefined : Icon,
          iconImg,
          image: getStrapiMediaUrl(p.coverImage?.url) || fallback.image,
          link: slug.includes('online') ? `/${locale}/online-learning` : `/${locale}/programs/${p.slug}`,
        };
      })
    : defaultPrograms;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative w-full bg-white overflow-hidden pt-[clamp(2rem,2.5vw,3rem)] sm:pt-[clamp(3rem,4.5vw,5.5rem)] pb-[clamp(1.5rem,3.8vw,4.8rem)] sm:pb-[clamp(3.5rem,4.8vw,5.8rem)]">
      <div key={isDesktop ? 'desktop' : 'mobile'} className="contents">
        <div className="max-w-[1920px] mx-auto px-(--spacing-side)">

        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={isDesktop ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={isDesktop ? headerVariants : undefined}
        >
          <motion.span 
            variants={isDesktop ? itemVariants : undefined}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#E6F0FB] text-[#048ED6] font-semibold text-[15px]"
          >
            <GraduationCap className="w-5 h-5" />
            {eyebrow}
          </motion.span>
          <motion.h2 
            variants={isDesktop ? itemVariants : undefined}
            className="mt-[clamp(0.75rem,1.1vw,1.3rem)] font-bold text-black tracking-[-0.015em] leading-[1.09] text-[clamp(1.5rem,2.29vw,2.75rem)]"
          >
            {heading}
          </motion.h2>
          <motion.p 
            variants={isDesktop ? itemVariants : undefined}
            className={`mt-[clamp(0.75rem,1.1vw,1.3rem)] max-w-[620px] ${BODY_CLS}`}
          >
            {description}
          </motion.p>
        </motion.div>


        {/* ── md+ : hover-driven accordion ────────────────────────── */}
        <motion.div 
          className="max-md:hidden mt-[clamp(2.5rem,3.7vw,4.4rem)]"
          initial={isDesktop ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={isDesktop ? {
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          } : undefined}
        >
          {displayPrograms.map((p, i) => {
            const open = active === i;
            // The Figma drops the rule above the first row and above the row
            // that follows the open one; every other row keeps its divider.
            const rule = i !== 0 && i !== active + 1;
            return (
              <motion.div
                key={p.id}
                variants={isDesktop ? itemVariants : undefined}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`flex items-center gap-x-8 py-[14px] transition-colors ${rule ? 'border-t border-[#EBEBEB]' : 'border-t border-transparent'
                  }`}
              >
                {/* Left: icon + copy */}
                <div className="flex-1 min-w-0 flex items-start gap-8">
                  <span className="mt-1 w-[50px] h-[50px] shrink-0 grid place-items-center rounded-full bg-[#E6F0FB] text-[#048ED6]">
                    <RowIcon p={p} className="w-6 h-6 object-contain" />
                  </span>
                  <div className="min-w-0">
                    <h3 className={TITLE_CLS}>{p.title}</h3>
                    {/* Collapsed rows keep the copy in the DOM but at zero height. */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`mt-[clamp(1.1rem,2vw,2.4rem)] max-w-[620px] ${BODY_CLS}`}>
                          {p.desc}
                        </p>
                        <div className="mt-[clamp(1.1rem,1.9vw,2.3rem)] pb-1">
                          <LearnMore href={p.link} text={learnMoreText} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: image, 255 tall open / 101 tall closed */}
                <div
                  className={`shrink-0 w-[34.6%] rounded-lg overflow-hidden transition-[height] duration-500 ease-out ${open ? 'h-[255px]' : 'h-[101px]'
                    }`}
                >
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── below md : slider ───────────────────────────────────── */}
        <div className="md:hidden mt-10">
     
            <Swiper
  modules={[Pagination]}
  slidesPerView={1}
  spaceBetween={20}
  speed={800}
  autoplay={{
    delay: 5000,
    disableOnInteraction: false,
  }}
  pagination={{ clickable: true }}
  breakpoints={{
    690: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
   
  }}
     className="programs-swiper !pb-12"
>
            {displayPrograms.map((p) => (
              <SwiperSlide key={p.id}>
                <div className="flex flex-col">
                  <div className="w-full h-[210px] rounded-lg overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-4 mt-5">
                    <span className="w-[50px] h-[50px] shrink-0 grid place-items-center rounded-full bg-[#E6F0FB] text-[#048ED6]">
                      <RowIcon p={p} className="w-6 h-6 object-contain" />
                    </span>
                    <h3 className={TITLE_CLS}>{p.title}</h3>
                  </div>
                  <p className={`mt-4 ${BODY_CLS}`}>{p.desc}</p>
                  <div className="mt-6">
                    <LearnMore href={p.link} text={learnMoreText} />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        </div>
      </div>

      <style>{`
     
           .programs-swiper  .swiper-pagination-bullet {
          width: 14px;
          height: 14px;
          background-color: #d1d5db; /* Light gray inner */
          border: 1.5px solid #0066ff; /* Blue border */
          opacity: 1;
          border-radius: 50%;
          transition: all 0.3s ease;
          margin: 0 6px !important;
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 50;
        }
        .programs-swiper  .swiper-pagination-bullet-active {
          width: 36px;
          background-color: #0066ff; /* Solid blue */
          border-color: #0066ff;
          border-radius: 14px;
        }
      `}</style>
    </section>
  );
}
