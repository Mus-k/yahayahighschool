'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import type { EventsGridSectionComponent, EventEntity } from '../../../types/cms.types';
import { cmsService } from '../../../services/cms.service';

interface EventsGridProps {
  data?: EventsGridSectionComponent;
  initialEvents?: EventEntity[];
  locale?: string;
}

const FALLBACK_EVENTS: EventEntity[] = [
  {
    id: 1,
    title: '3rd Annual Islamic & Science Education Symposium',
    slug: 'annual-symposium-2026',
    description: 'Keynote lectures by invited scholars and STEM project exhibitions by our senior secondary students.',
    eventType: 'Academic',
    location: 'Main School Auditorium & Innovation Hall',
    startDate: '2026-08-15T09:00:00Z',
    endDate: '2026-08-15T16:00:00Z',
    registrationRequired: true,
  },
  {
    id: 2,
    title: 'Parent-Teacher Academic Progress & Tarbiyah Consultation',
    slug: 'parent-teacher-consultation-q3',
    description: 'One-on-one sessions between faculty teachers and parents regarding student academic performance and character development.',
    eventType: 'Parent Gathering',
    location: 'Administration Wing & Classroom Complex',
    startDate: '2026-08-22T08:30:00Z',
    endDate: '2026-08-22T14:00:00Z',
    registrationRequired: false,
  },
  {
    id: 3,
    title: 'Qur\'an Memorization & Arabic Oratory Competition',
    slug: 'quran-oratory-competition-2026',
    description: 'Inter-house student competition celebrating excellence in Qur\'an recitation, Tajweed, and Classical Arabic speech.',
    eventType: 'Islamic/Religious',
    location: 'Campus Central Mosque & Lecture Hall',
    startDate: '2026-09-05T10:00:00Z',
    endDate: '2026-09-05T15:00:00Z',
    registrationRequired: false,
  },
];

export function EventsGridSection({ data, initialEvents, locale = 'en' }: EventsGridProps) {
  const [events, setEvents] = useState<EventEntity[]>(initialEvents || FALLBACK_EVENTS);
  const [loading, setLoading] = useState(false);

  const title = data?.title || 'Upcoming School Events & Calendar';
  const subtitle = data?.subtitle || 'Mark your calendar and join our academic symposiums, Islamic gatherings, and community days';
  const limit = data?.limit || 3;

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) return;
    setLoading(true);
    cmsService.getEvents(locale, limit).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setEvents(fetched);
      }
      setLoading(false);
    });
  }, [locale, limit, initialEvents]);

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return { day: '15', month: 'AUG', time: '09:00 AM' };
    try {
      const d = new Date(dateStr);
      return {
        day: d.getDate().toString(),
        month: d.toLocaleDateString(locale, { month: 'short' }).toUpperCase(),
        time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { day: '15', month: 'AUG', time: '09:00 AM' };
    }
  };

  return (
    <section className="bg-gray-50/70 pt-[clamp(1.5rem,5.5vw,6.6rem)] pb-[clamp(1.5rem,5.5vw,6.6rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[clamp(1.5rem,5.5vw,6.6rem)] gap-6">
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3 border border-emerald-200">
              Campus Life
            </span>
            <h2 className="text-[clamp(1.5rem,2.29vw,2.75rem)] font-extrabold text-emerald-950 tracking-tight">
              {title}
            </h2>
            <p className="text-gray-600 text-[clamp(1rem,0.94vw,1.125rem)] mt-2 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <Link
            href={locale === 'en' ? '/events' : `/${locale}/events`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-all self-start md:self-auto shrink-0"
          >
            <span>Full School Calendar</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-200 h-64 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {events.map((evt, idx) => {
              const { day, month, time } = formatEventDate(evt.startDate);
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      {/* Date Badge */}
                      <div className="bg-emerald-900 text-white rounded-2xl px-4 py-3 flex flex-col items-center justify-center shrink-0 shadow-md group-hover:bg-amber-500 group-hover:text-emerald-950 transition-colors">
                        <span className="text-2xl font-black leading-none">{day}</span>
                        <span className="text-xs font-bold tracking-widest mt-0.5">{month}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {evt.eventType && (
                          <span className="bg-emerald-50 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                            {evt.eventType}
                          </span>
                        )}
                        {evt.registrationRequired && (
                          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-300">
                            Registration Open
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-emerald-950 mb-3 leading-snug group-hover:text-emerald-800 transition-colors">
                      {evt.title}
                    </h3>

                    <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-2">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Starts at {time}</span>
                    </div>

                    {evt.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{evt.location}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href={locale === 'en' ? `/events/${evt.slug}` : `/${locale}/events/${evt.slug}`}
                        className="inline-flex items-center gap-1.5 font-bold text-sm text-emerald-900 group-hover:text-amber-600 transition-colors"
                      >
                        <span>Event Details</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
