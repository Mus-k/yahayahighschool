import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { EventsGridSection } from '@/components/public/sections/EventsGridSection';

interface EventsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('events', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'التقويم المدرسي والفعاليات | يهايا سكول' : 'School Calendar & Events | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Upcoming academic symposiums, PTA meetings, sports tournaments, Qur\'an competitions, and religious gatherings.',
  };
}

export default async function EventsListingPage({ params }: EventsPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('events', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const events = await cmsService.getEvents(locale, 30);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Mark Your Calendar
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            School Calendar & Events
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Join our vibrant campus gatherings—from international academic olympiads and robotics symposiums to annual Tahfidz Al-Qur\'an graduation ceremonies.
          </p>
        </div>
      </section>

      {/* Events Grid Section */}
      <div className="pt-8">
        <EventsGridSection initialEvents={events} locale={locale} />
      </div>
    </main>
  );
}
