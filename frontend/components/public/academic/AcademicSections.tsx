import React from 'react';
import Link from 'next/link';
import type { SchoolAcademicProgramEntity, SchoolAcademicProgramsPageEntity } from '@/types/cms.types';
import { LeafImage } from '@/components/public/shared/LeafImage';
import { ParallaxImage } from '@/components/public/shared/ParallaxImage';
import { getStrapiMediaUrl } from '@/services/cms.service';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowRight, BookOpen, ChevronRight, Compass, Heart, Users, Zap, Award,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap,
  Heart,
  Users,
  Compass,
  BookOpen,
  Award,
};

const DEFAULT_APPROACH = [
  {
    icon: Zap, title: 'Academic Rigor',
    desc: 'Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.'
  },
  {
    icon: Heart, title: 'Faith & Character',
    desc: 'Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.'
  },
  {
    icon: Users, title: 'Mentorship',
    desc: 'Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.'
  },
  {
    icon: Compass, title: 'Real-World Discovery',
    desc: 'Experiential projects, fieldwork, and technology connect classroom learning to the world around us.'
  },
];

export function AcademicHero({ pageData }: { pageData?: SchoolAcademicProgramsPageEntity | null }) {
  const locale = useLocale();
  const t = useTranslations('academicPage.hero');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const breadcrumb = pageData?.breadcrumbTitle || t('breadcrumbAcademic');
  const tagline = pageData?.tagline || t('tagline');
  const headline1 = pageData?.headlineLine1 || t('headline_1');
  const headline2 = pageData?.headlineLine2 || t('headline_2');
  const lede = pageData?.lede || t('lede');
  const heroImage = pageData?.heroImage ? (getStrapiMediaUrl(pageData.heroImage) || '/images/figma-home/09.png') : '/images/figma-home/09.png';

  return (
    <section className="ac relative w-full bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center lg:gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) lg:grid-cols-[minmax(0,932fr)_minmax(0,704fr)]">
        <div className="min-w-0 py-[clamp(1.5rem,3.6vw,4.4rem)]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{t('breadcrumbHome')}</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            <span className="text-[#048ED6]">{breadcrumb}</span>
          </nav>

          <p className="mt-[clamp(1.5rem,2.6vw,3.1rem)] font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
            {tagline}
          </p>

          <h1 className="mt-[clamp(0.75rem,1.35vw,1.625rem)] font-serif leading-[1.11] text-[clamp(1.75rem,2.81vw,3.375rem)]">
            <span className="block text-[#121C2A]">{headline1}</span>
            <span className="block italic text-[#048ED6]">{headline2}</span>
          </h1>

          <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[26rem] leading-[1.6] text-[#5A636D] text-[1rem]">
            {lede}
          </p>
        </div>

        {/* Leaf-masked photograph */}
        <div className="w-full max-lg:hidden mt-[-10px] h-[calc(100%+10px)]">
          <LeafImage
            src={heroImage}
            alt="A lesson in progress at Yahaya International"
          />
        </div>

        <div className="w-full lg:hidden">
          <img
            src={heroImage}
            alt="A lesson in progress at Yahaya International"
            className="aspect-[704/532] w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export function AcademicPrograms({
  locale,
  programs,
}: {
  locale: string;
  programs?: SchoolAcademicProgramEntity[];
}) {
  const t = useTranslations('academicPage');
  const tGrid = useTranslations('programsSection.programs');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const fallbackPrograms = [
    { slug: 'english', title: tGrid('english.title'), description: tGrid('english.desc'), coverImageUrl: '/images/figma-home/03-programs.jpeg' },
    { slug: 'arabic', title: tGrid('arabic.title'), description: tGrid('arabic.desc'), coverImageUrl: '/images/figma-home/19.png' },
    { slug: 'quran-memorization', title: "Qur'an Memorization", description: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.", coverImageUrl: '/images/figma-home/09.png' },
    { slug: 'dawah', title: tGrid('dawah.title'), description: tGrid('dawah.desc'), coverImageUrl: '/images/figma-home/17.png' },
    { slug: 'online', title: tGrid('online.title'), description: tGrid('online.desc'), coverImageUrl: '/images/figma-home/11.png' },
  ];

  const displayPrograms = (programs && programs.length > 0)
    ? programs.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.shortDescription || p.description,
        coverImageUrl: (p.coverImage ? getStrapiMediaUrl(p.coverImage) : null) || '/images/figma-home/09.png',
      }))
    : fallbackPrograms;

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2.5rem,4vw,4.8rem)]">
        <div className="grid grid-cols-1 gap-x-[clamp(1rem,2.76vw,3.3125rem)] gap-y-[clamp(1.25rem,4vw,4.8125rem)] md:grid-cols-2">
          {displayPrograms.map((p, idx) => {
            const imageUrl = p.coverImageUrl || '/images/figma-home/09.png';
            return (
              <article
                key={p.slug || idx}
                className="group grid aspect-[793/291] grid-cols-1 sm:grid-cols-[minmax(0,342fr)_minmax(0,451fr)] overflow-hidden rounded-lg max-sm:aspect-auto"
              >
                <div className="relative overflow-hidden ">
                  <Link
                    href={href(`/programs/${p.slug}`)}
                    className="w-full relative overflow-hidden"
                  >
                    <img src={imageUrl} alt={p.title || ''} className="h-full w-full object-cover lg:group-hover:scale-105 duration-500" />
                    <span className="absolute left-3 top-3 grid h-[clamp(1.75rem,1.98vw,2.375rem)] w-[clamp(1.75rem,1.98vw,2.375rem)] place-items-center rounded-md bg-[#048ED6] text-white">
                      <BookOpen className="h-[45%] w-[45%]" aria-hidden />
                    </span>
                  </Link>
                </div>

                <div className="flex flex-col justify-center bg-[#F2F9FD] p-[clamp(1rem,1.35vw,1.625rem)]">
                  <Link
                    href={href(`/programs/${p.slug}`)}
                    className="inline-flex items-center gap-1.5 font-medium text-[#048ED6] transition-opacity hover:opacity-80 text-[clamp(0.625rem,0.63vw,0.75rem)]"
                  >
                    {t('programs.explore')} <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                  </Link>
                  <Link
                    href={href(`/programs/${p.slug}`)}
                    className="w-full relative"
                  >
                    <h2 className="mt-[clamp(0.5rem,0.73vw,0.875rem)] font-serif text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)] line-clamp-2">
                      {p.title}
                    </h2>
                  </Link>
                  <p className="mt-[clamp(0.375rem,0.52vw,0.625rem)] leading-[1.6] text-[#5A636D] text-[1rem] line-clamp-3 2xl:line-clamp-4">
                    {p.description || t(`programsList.${p.slug}.desc`)}
                  </p>

                  <Link
                    href={href(`/programs/${p.slug}`)}
                    className="mt-[clamp(0.75rem,1vw,1.25rem)] inline-flex h-[clamp(2rem,2.08vw,2.5rem)] w-fit items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(0.875rem,1.04vw,1.25rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]"
                  >
                    {t('programs.readMore')}
                    <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AcademicApproach({ pageData }: { pageData?: SchoolAcademicProgramsPageEntity | null }) {
  const t = useTranslations('academicPage.approach');

  const tagline = pageData?.approachTagline || t('tagline');
  const title = pageData?.approachTitle || t('title');
  const statValue = pageData?.approachStatValue || t('statValue');
  const statDesc = pageData?.approachStatDescription || t('statDesc');
  const approachImage = pageData?.approachImage ? (getStrapiMediaUrl(pageData.approachImage) || '/images/figma-home/09.png') : '/images/figma-home/09.png';

  const items = (pageData?.approachItems && pageData.approachItems.length > 0)
    ? pageData.approachItems.map((item) => {
        const IconComponent = (item.icon && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : Zap;
        return {
          icon: IconComponent,
          title: item.title,
          desc: item.description,
        };
      })
    : DEFAULT_APPROACH.map((a, idx) => ({
        icon: a.icon,
        title: t(`items.${idx}.title`),
        desc: t(`items.${idx}.desc`),
      }));

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] sm:px-(--spacing-side) pb-[clamp(3rem,5vw,6rem)]">
        <div className="mx-auto grid max-w-[80rem] grid-cols-1 items-center gap-[clamp(2rem,3.6vw,4.4rem)] sm:rounded-lg bg-[#EFF4FF] p-[clamp(1.5rem,3.1vw,3.75rem)] lg:grid-cols-2">
          <div className="relative">
            <ParallaxImage
              src={approachImage}
              alt={t('alt')}
              ratio="4/3"
              minWidth={1281}
              className="w-full rounded-lg"
            />
            {/* Stat card */}
            <div className="absolute -bottom-6 right-0 w-[clamp(9rem,12.5vw,15rem)] translate-x-[8%] rounded-lg bg-[#048ED6] p-[clamp(0.875rem,1.25vw,1.5rem)] text-white shadow-xl">
              <p className="font-serif leading-none text-[clamp(1.25rem,1.56vw,1.875rem)]">{statValue}</p>
              <p className="mt-2 uppercase leading-[1.4] sm:tracking-[0.08em] text-white/90 text-[1rem]">
                {statDesc}
              </p>
            </div>
          </div>

          <div className="min-w-0 max-lg:mt-8">
            <p className="font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
              {tagline}
            </p>
            <h2 className="mt-[clamp(0.5rem,0.83vw,1rem)] font-serif leading-tight text-[#121C2A] text-[clamp(1.375rem,1.98vw,2.375rem)]">
              {title}
            </h2>

            <ul className="mt-[clamp(1.25rem,2.08vw,2.5rem)] space-y-[clamp(1rem,1.35vw,1.625rem)]">
              {items.map(({ icon: Icon, title: itemTitle, desc }, idx) => (
                <li key={idx} className="flex gap-[clamp(0.75rem,1vw,1.25rem)]">
                  <span className="grid h-[clamp(2rem,2.4vw,2.875rem)] w-[clamp(2rem,2.4vw,2.875rem)] shrink-0 place-items-center rounded-full bg-[#DCEBFB] text-[#048ED6]">
                    <Icon className="h-[45%] w-[45%]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#121C2A] text-[clamp(0.8125rem,0.83vw,1rem)]">
                      {itemTitle}
                    </span>
                    <span className="mt-1 block leading-[1.6] text-[#5A636D] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                      {desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
