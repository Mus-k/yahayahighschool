import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/services/cms.service';
import { NewsArticleHero, NewsArticleBody } from '@/components/public/news/NewsDetail';
import type { NewsFeaturedEventComponent } from '@/types/cms.types';
import { slugifyEvent, FALLBACK_FEATURED_EVENTS } from '@/utils/news';

import { resolveEventDate } from '@/lib/format';

interface NewsDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** All slugs come from the news page's featuredEvents */
export async function generateStaticParams() {
  const pageData = await cmsService.getNewsPage('en');
  const events = pageData?.featuredEvents?.length ? pageData.featuredEvents : FALLBACK_FEATURED_EVENTS;
  return events.map((fe, idx) => ({ slug: slugifyEvent(fe, idx) }));
}

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const result = await findEventBySlug(slug, locale);
  if (!result) return { title: 'Story Not Found | YAHAYASCHOOL' };
  const event = result.event;
  const title = event.title || event.headlineLine1 || 'School Story';
  return {
    title: `${title} | YAHAYASCHOOL`,
    description: event.blurb || event.lede || '',
  };
}

/** Lookup a featured event by its derived slug */
async function findEventBySlug(
  slug: string,
  locale: string
): Promise<{
  event: NewsFeaturedEventComponent;
  pageDate?: string;
  newsletterCard?: any;
} | null> {
  // Try locale first, then fall back to 'en'
  const locales = locale !== 'en' ? [locale, 'en'] : ['en'];

  for (const loc of locales) {
    const pageData = await cmsService.getNewsPage(loc);
    const events = pageData?.featuredEvents || [];
    const pageDate = pageData?.updatedAt || pageData?.publishedAt || pageData?.createdAt;

    const match = events.find((fe, idx) => slugifyEvent(fe, idx) === slug);
    if (match) return { event: match, pageDate, newsletterCard: pageData?.newsletterCard };
  }

  // Built-in stories shown when the CMS has no News Page content
  const fallback = FALLBACK_FEATURED_EVENTS.find((fe, idx) => slugifyEvent(fe, idx) === slug);
  if (fallback) return { event: fallback };
  return null;
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { locale, slug } = await params;
  const result = await findEventBySlug(slug, locale);

  if (!result) notFound();
  const { event, pageDate, newsletterCard } = result;
  const resolvedDate = resolveEventDate(event, pageDate);

  // Shape the event into the structure NewsDetail expects
  const article = {
    id: event.id,
    title: event.title || `${event.headlineLine1 || ''} ${event.headlineLine2 || ''}`.trim() || 'School Story',
    slug,
    summary: event.blurb || event.lede || '',
    body: event.body || null,
    featuredImage: event.image || null,
    gallery: event.gallery || [],
    author: event.author || 'School Communications',
    tags: Array.isArray(event.tags)
      ? event.tags.map((t: any) =>
          typeof t === 'string' ? t : t?.name || t?.value || ''
        ).filter(Boolean)
      : typeof event.tags === 'string'
        ? event.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    category: {
      id: 0,
      name: event.category || event.eyebrow || 'News',
      title: event.category || event.eyebrow || 'News',
      slug: (event.category || event.eyebrow || 'news').toLowerCase().replace(/\s+/g, '-'),
    },
    createdAt: resolvedDate.toISOString(),
    publishedAt: resolvedDate.toISOString(),
    publishDate: resolvedDate.toISOString(),
  } as any;

  return (
    <main className="min-h-screen bg-white">
      <NewsArticleHero article={article} />
      <NewsArticleBody locale={locale} article={article} newsletterCard={newsletterCard} />
    </main>
  );
}
