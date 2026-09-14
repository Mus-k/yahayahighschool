import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { NewsletterCard } from '@/components/public/news/NewsletterCard';
import { ParallaxImage } from '@/components/public/shared/ParallaxImage';
import { StrapiBlocksRenderer } from '@/components/public/shared/StrapiBlocksRenderer';
import type { NewsFeaturedEventComponent, NewsletterSignupSectionComponent } from '@/types/cms.types';

import { getStrapiMediaUrl } from '@/services/cms.service';
import { formatCardDate } from '@/lib/format';

/**
 * News article. Implemented from Figma node 384-4389 (frame 1920x3799).
 *
 * Measured off the export:
 *   hero photo      full-bleed, y 99->1079 (981 tall), overlay inset at x142
 *   headline        two lines, 29 cap / 60 pitch  ->  ~40px, leading 1.5
 *   next-event card 352 x 247 at x1443, brand blue
 *   content         x 249->1668 (1420 wide)
 *   text column     758 wide · sidebar 412 at x1254 · 248 between them
 *   in-article photo breaks both columns: 1418 x 685 (~2.07)
 *   sidebar card    #F2F9FD, 422 tall; newsletter card below it at y1611
 */

const BODY_MAX = 'max-w-[47.375rem]'; // 758px — the design's text measure

export function NewsArticleHero({
  article,
}: {
  article: NewsFeaturedEventComponent & {
    id: number;
    title: string;
    slug?: string;
    summary?: string;
    body?: any[] | string | null;
    content?: string;
    featuredImage?: any;
    category?: { id: number; name: string; title: string; slug: string };
    createdAt?: string;
    publishedAt?: string;
    publishDate?: string;
    coverImage?: { url: string };
  };
}) {
  const locale = useLocale();
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const t = useTranslations('newsDetailPage');

  const localizedTitle = article.title;
  const localizedDate = formatCardDate(article.createdAt || article.publishDate || article.publishedAt, locale);

  const coverUrl = (article.featuredImage ? getStrapiMediaUrl(article.featuredImage) : null) || article.coverImage?.url || '/images/figma-home/13.png';

  return (
    <section className="relative w-full">
      <div className="nd-hero relative w-full overflow-hidden bg-[#121C2A]">
        <img src={coverUrl} alt={article.title || ''} className="h-full w-full object-cover" />
        {/* The overlay copy sits on photography, so it needs its own contrast
            rather than relying on whatever the image happens to be. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1920px] px-(--spacing-side) pb-[clamp(1.5rem,3.1vw,3.75rem)]">
            <div className="max-w-[56rem]">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/70 text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                <Link href={href('/')} className="transition-colors hover:text-white">{t('breadcrumbHome')}</Link>
                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                <Link href={href('/news')} className="transition-colors hover:text-white">{t('breadcrumbNews')}</Link>
                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                <span className="text-white">{t('breadcrumbDetails')}</span>
              </nav>

              <p className="mt-[clamp(0.75rem,1vw,1.25rem)] flex items-center gap-2 uppercase tracking-[0.14em] text-white/85 text-[1rem]">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {localizedDate}
              </p>

              <h1 className="mt-[clamp(0.5rem,0.9vw,1.1rem)] font-serif leading-[1.3] text-white text-[clamp(1.75rem,2.8vw,3.25rem)]">
                {localizedTitle}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* 981 of 1920 == 51.1vw, floored so it stays a hero on phones */
        .nd-hero { height: clamp(22rem, 51.1vw, 55.3125rem); }
      `}</style>
    </section>
  );
}

export function NewsArticleBody({
  locale = 'en',
  article,
  newsletterCard,
}: {
  locale?: string;
  article: any;
  newsletterCard?: NewsletterSignupSectionComponent | null;
}) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const t = useTranslations('newsDetailPage');

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2.5rem,4.7vw,5.6rem)]">
        {/* 1420 is the design's content width; centred so the measure stays
            readable on wider screens. */}
        <div className="mx-auto max-w-[88.75rem]">
          <div className="grid grid-cols-1 gap-[clamp(2rem,12.9vw,15.5rem)] lg:grid-cols-[minmax(0,758fr)_minmax(0,412fr)]">
            <div className={`${BODY_MAX} text-[#5A636D] text-[clamp(0.8125rem,0.83vw,1rem)] leading-[1.55] [&_:is(h1,h2,h3,h4,h5,h6)]:mb-4 [&_:is(h1,h2,h3,h4,h5,h6)]:leading-[1.5] [&_:is(h1,h2,h3,h4,h5,h6)]:text-[clamp(1.0625rem,1.25vw,2rem)]`}>
              {article.body || article.content ? (
                <StrapiBlocksRenderer content={article.body || article.content} />
              ) : (
                <p>{article.summary}</p>
              )}
            </div>

            {/* Sidebar — 412 wide in the design */}
            <aside className="space-y-[clamp(1rem,1.25vw,1.5rem)] lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl bg-[#F2F9FD] p-[clamp(1.5rem,2vw,2.4rem)] text-center">
                <h2 className="font-serif italic leading-tight text-[#0B3B57] text-[clamp(1.0625rem,1.25vw,1.5rem)]" dangerouslySetInnerHTML={{ __html: t('sidebarTitle') }} />
                <p className="mt-[clamp(0.75rem,1vw,1.25rem)] leading-[1.7] text-[#5A636D] text-[1rem]">
                  {t('sidebarDesc')}
                </p>
                <div className="mt-[clamp(1.25rem,1.6vw,1.9rem)] flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={href('/career')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    {t('joinSchool')}
                  </Link>
                  <Link
                    href={href('/news')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    {t('returnNews')}
                  </Link>
                </div>
              </div>

              <NewsletterCard data={newsletterCard} locale={locale} />
            </aside>
          </div>

          {/* In-article photo from Strapi gallery or fallback */}
          {(() => {
            const bottomPhotoUrl = (article.gallery && article.gallery.length > 0 ? getStrapiMediaUrl(article.gallery[0]) : null) || '/images/figma-home/17.png';
            return (
              <figure className="mt-[clamp(2rem,3.1vw,3.75rem)]">
                <ParallaxImage
                  src={bottomPhotoUrl}
                  alt={article.title || 'Article image'}
                  ratio="1418/685"
                  className="w-full rounded-lg"
                />
              </figure>
            );
          })()}

          <div className={`${BODY_MAX} mt-[clamp(1.5rem,2.1vw,2.5rem)] text-[#5A636D] text-[clamp(0.8125rem,0.83vw,1rem)] leading-[1.75]`}>
            {article.summary && (
              <p className="font-medium text-[#121C2A]">
                {article.summary}
              </p>
            )}

            <hr className="mt-[clamp(1.5rem,2.1vw,2.5rem)] border-t border-[#E5E7EB]" />

            {/* Dynamic hashtags from Strapi tags */}
            {(() => {
              const rawTags = article.tags;
              const tagsList: string[] = Array.isArray(rawTags)
                ? (rawTags as any[]).map((t: any) => typeof t === 'string' ? t : t?.name || t?.value || '').filter(Boolean)
                : typeof rawTags === 'string'
                  ? (rawTags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
                  : [article.category?.name || 'News', 'YahayaSchool', 'Campus', 'Community'];
              return (
                <ul className="mt-[clamp(1rem,1.35vw,1.625rem)] flex flex-wrap gap-2">
                  {tagsList.map((tag: string, idx: number) => (
                    <li
                      key={idx}
                      className="rounded bg-[#F1F2F4] px-3 py-1.5 text-[#5A636D] text-[clamp(0.625rem,0.63vw,0.75rem)] font-medium"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
