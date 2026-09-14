import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { ArrowLeft, Calendar, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';

interface EventDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: EventDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  // Look up event by fetching and matching slug
  const events = await cmsService.getEvents(locale, 50);
  const event = events.find((e) => e.slug === slug);

  if (!event) {
    return { title: 'Event Not Found | YAHAYASCOOL' };
  }

  return {
    title: `${event.title} | YAHAYASCOOL`,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { locale, slug } = await params;
  const events = await cmsService.getEvents(locale, 50);
  const event = events.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'August 15, 2026 at 09:00 AM';
    try {
      return new Date(dateStr).toLocaleString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Event Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
          <Link
            href={getHref('/events')}
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-amber-400 font-semibold text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Back to All Events</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {event.eventType && (
              <span className="bg-amber-400 text-emerald-950 font-bold px-3.5 py-1 rounded-full text-xs">
                {event.eventType}
              </span>
            )}
            {event.registrationRequired && (
              <span className="bg-emerald-800 text-amber-300 font-bold px-3.5 py-1 rounded-full text-xs border border-emerald-700">
                Registration Required
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            {event.title}
          </h1>

          <div className="space-y-2 text-sm text-emerald-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Starts: {formatDateTime(event.startDate)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Venue: {event.location}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Details Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-xs space-y-8">
          <h2 className="text-2xl font-bold text-emerald-950 pb-4 border-b border-gray-100">
            About this Event
          </h2>

          <div
            className="prose prose-lg prose-emerald max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: typeof event.description === 'string' ? event.description : '' }}
          />

          {event.registrationRequired && (
            <div className="bg-emerald-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md mt-10">
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-1">Attendance Registration Open</h3>
                <p className="text-emerald-100 text-base">
                  Please reserve your seat in advance due to campus auditorium capacity limits.
                </p>
              </div>
              <Link
                href={getHref('/contact')}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-6 py-3 rounded-xl shadow-lg transition-colors whitespace-nowrap shrink-0 text-sm"
              >
                Reserve Seat / Inquire
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
