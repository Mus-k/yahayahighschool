import React from 'react';
import type { Metadata } from 'next';
import { NewsHero, NewsGrid } from '@/components/public/news/NewsSections';
import { cmsService } from '@/services/cms.service';
import type { NewsFeaturedEventComponent } from '@/types/cms.types';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getNewsPage(locale);

  if (pageData?.seo) {
    return {
      title: pageData.seo.metaTitle || pageData.title,
      description: pageData.seo.metaDescription,
    };
  }

  return {
    title: 'News, Events & Community | YAHAYASCHOOL',
    description: 'Discover the latest happenings at Yahaya International.',
  };
}

import { FALLBACK_FEATURED_EVENTS } from '@/utils/news';

export default async function NewsListingPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;

  // Single source of truth: [F] News Page → featuredEvents
  let pageData = await cmsService.getNewsPage(locale);
  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getNewsPage('en');
  }

  // No CMS entry (or Strapi unreachable) → show the built-in stories instead of an empty grid
  const featuredEvents: NewsFeaturedEventComponent[] =
    pageData?.featuredEvents && pageData.featuredEvents.length > 0
      ? pageData.featuredEvents
      : FALLBACK_FEATURED_EVENTS;
  const pageDate = pageData?.updatedAt || pageData?.publishedAt || pageData?.createdAt;

  return (
    <main className="min-h-screen bg-white">
      <NewsHero
        data={featuredEvents}
        breadcrumbTitle={pageData?.breadcrumbTitle}
        pageDate={pageDate}
        locale={locale}
      />
      <NewsGrid locale={locale} events={featuredEvents} pageDate={pageDate} />
    </main>
  );
}
