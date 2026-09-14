'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, BookOpen, GraduationCap, Newspaper, Calendar, Building2 } from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { NewsFeaturedEventComponent, Program, Department, Event } from '@/types/cms.types';


interface SearchPageProps {
  params?: Promise<{ locale?: string }>;
}

export default function SearchPage({ params }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    articles: NewsFeaturedEventComponent[];
    programs: Program[];
    departments: Department[];
    events: Event[];
  }>({
    articles: [],
    programs: [],
    departments: [],
    events: [],
  });
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    // Fetch across collections and filter by query
    // News: search featuredEvents from the News Page single type
    const [newsPageData, programs, departments, events] = await Promise.all([
      cmsService.getNewsPage('en'),
      cmsService.getPrograms('en', false, 50),
      cmsService.getDepartments('en', 50),
      cmsService.getEvents('en', 50),
    ]);

    const q = query.toLowerCase();
    const featuredEvents = newsPageData?.featuredEvents || [];

    setResults({
      articles: featuredEvents.filter(
        (fe) =>
          (fe.title || fe.headlineLine1 || '')?.toLowerCase().includes(q) ||
          (fe.blurb || fe.lede || '')?.toLowerCase().includes(q)
      ),
      programs: (programs || []).filter(
        (p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      ),
      departments: (departments || []).filter(
        (d) => d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      ),
      events: (events || []).filter(
        (ev) => ev.title?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)
      ),
    });

    setLoading(false);
  };

  const totalCount =
    results.articles.length + results.programs.length + results.departments.length + results.events.length;

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Search Header Banner */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            Search Campus Portal
          </h1>
          <p className="text-base sm:text-lg text-emerald-100 mb-8 max-w-2xl mx-auto font-light">
            Search across academic tracks, departments, campus news, events, and admission guides.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search keyword (e.g. Tahfidz, Robotics, Tuition, Cambridge)..."
              className="w-full bg-white/95 text-gray-900 pl-14 pr-32 py-4 rounded-2xl font-medium shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-amber-400 text-sm sm:text-base"
            />
            <Search className="w-6 h-6 text-emerald-800 absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 mt-14">
        {searched && (
          <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-emerald-950">
              Search Results for <span className="text-emerald-700">&ldquo;{query}&rdquo;</span>
            </h2>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full">
              {totalCount} item{totalCount !== 1 ? 's' : ''} found
            </span>
          </div>
        )}

        {searched && totalCount === 0 && !loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs space-y-4">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-xl font-bold text-emerald-950">No matching content found</h3>
            <p className="text-gray-600 text-base max-w-md mx-auto">
              We couldn\'t find any programs, news articles, or events matching your search. Please try broader terms or contact admissions directly.
            </p>
          </div>
        )}

        <div className="space-y-12">
          {/* Programs Results */}
          {results.programs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
                <span>Academic Programs ({results.programs.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.programs.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-950 mb-2">{p.title}</h4>
                      <p className="text-base text-gray-600 line-clamp-2 mb-4">{p.description}</p>
                    </div>
                    <Link
                      href={`/programs/${p.slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1 self-start"
                    >
                      <span>View Track Details</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments Results */}
          {results.departments.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <span>Departments & Faculties ({results.departments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.departments.map((d, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-950 mb-2">{d.title}</h4>
                      <p className="text-base text-gray-600 line-clamp-2 mb-4">{d.description}</p>
                    </div>
                    <Link
                      href={`/departments/${d.slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1 self-start"
                    >
                      <span>Explore Department</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles Results */}
          {results.articles.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-emerald-700" />
                <span>News & Articles ({results.articles.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.articles.map((a, idx) => {
                  const title = a.title || a.headlineLine1 || 'School Story';
                  const summary = a.blurb || a.lede || '';
                  const slug = a.href
                    ? a.href.replace(/^\/[a-z]{2}\/news\//, '').replace(/^\/news\//, '').replace(/^\//, '')
                    : title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/^-+|-+$/g, '');
                  return (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-950 mb-2">{title}</h4>
                      <p className="text-base text-gray-600 line-clamp-2 mb-4">{summary}</p>
                    </div>
                    <Link
                      href={`/news/${slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1 self-start"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* Events Results */}
          {results.events.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>Campus Events ({results.events.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.events.map((ev, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-950 mb-2">{ev.title}</h4>
                      <p className="text-base text-gray-600 line-clamp-2 mb-4">{ev.description}</p>
                    </div>
                    <Link
                      href={`/events/${ev.slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-amber-600 flex items-center gap-1 self-start"
                    >
                      <span>View Event Details</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
