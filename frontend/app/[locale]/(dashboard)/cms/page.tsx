/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Globe, CalendarDays, MessageSquare, Image, Megaphone,
  Users, Edit3, RefreshCw, ArrowRight, Clock, MapPin,
  Layers, ChevronRight
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { EventEntity, AnnouncementEntity } from '@/types/cms.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isoToDisplay(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso || ''; }
}

function isUpcoming(ev: EventEntity) {
  return new Date(ev.startDate) > new Date();
}

function eventTypeColor(type?: string) {
  const map: Record<string, string> = {
    'Academic': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    'Islamic/Religious': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'Sports': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'Cultural': 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    'Parent Gathering': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    'Holiday': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };
  return map[type || ''] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function priorityColor(p: string) {
  if (p === 'urgent') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  if (p === 'high') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
}

// ─────────────────────────────────────────────────────────────────────────────
// Module Tiles
// ─────────────────────────────────────────────────────────────────────────────

const CMS_MODULES = [
  {
    href: '/cms/events',
    label: 'Events',
    description: 'Schedule and manage school events, ceremonies, and institutional activities.',
    icon: CalendarDays,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    stat: 'events',
  },
  {
    href: '/cms/gallery',
    label: 'Photo Gallery',
    description: 'Curate campus photos, ceremony albums, and media for the public website.',
    icon: Image,
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-100 dark:border-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    stat: 'gallery',
  },
  {
    href: '/cms/contact',
    label: 'Contact Inquiries',
    description: 'Review and respond to messages submitted via the public school website.',
    icon: MessageSquare,
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-100 dark:border-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    stat: null,
  },
  {
    href: '/announcements',
    label: 'Announcements',
    description: 'Publish urgent ticker announcements to all students, parents, and staff.',
    icon: Megaphone,
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    stat: 'announcements',
  },
  {
    href: '/calendar',
    label: 'Calendar View',
    description: 'View all school events and academic schedule in a full calendar interface.',
    icon: CalendarDays,
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-100 dark:border-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    stat: null,
  },
  {
    href: '#',
    label: 'Homepage Editor',
    description: 'Customize hero headline, mission statement, stats counters, and enrollment CTAs.',
    icon: Edit3,
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    stat: null,
    comingSoon: true,
  },
];

interface CMSStats { events: number; upcomingEvents: number; announcements: number; gallery: number; }

export default function WebsiteCMSPage() {
  const [stats, setStats] = useState<CMSStats>({ events: 0, upcomingEvents: 0, announcements: 0, gallery: 0 });
  const [recentAnnouncements, setRecentAnnouncements] = useState<AnnouncementEntity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [events, announcements, gallery] = await Promise.allSettled([
        cmsService.getEvents('en', 200),
        cmsService.getAnnouncements('en'),
        cmsService.getGalleryItems('en', 200),
      ]);
      const evList = events.status === 'fulfilled' ? events.value : [];
      const annList = announcements.status === 'fulfilled' ? announcements.value : [];
      const galList = gallery.status === 'fulfilled' ? gallery.value : [];
      const upcoming = evList.filter(isUpcoming);
      setStats({ events: evList.length, upcomingEvents: upcoming.length, announcements: annList.length, gallery: galList.length });
      setRecentAnnouncements(annList.slice(0, 4));
      setUpcomingEvents(upcoming.slice(0, 5));
    } catch (err) {
      console.error('[CMS Dashboard]', err);
      toast.error('Failed to load CMS dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const statMap: Record<string, number> = { events: stats.events, announcements: stats.announcements, gallery: stats.gallery };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 space-y-6 animate-in fade-in duration-300">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-950">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Public Website CMS</h1>
              <p className="text-xs text-slate-400 font-mono">Content Management Console</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-14">
            Manage all public-facing content: events, photo gallery, announcements, and contact inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDashboard} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/cms/events" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-emerald-950 transition-colors">
            <CalendarDays className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.events, sub: `${stats.upcomingEvents} upcoming`, icon: <CalendarDays className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20' },
          { label: 'Announcements', value: stats.announcements, sub: 'Active live ticker items', icon: <Megaphone className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20' },
          { label: 'Gallery Items', value: stats.gallery, sub: 'Public media assets', icon: <Image className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/20' },
          { label: 'CMS Modules', value: CMS_MODULES.length, sub: 'Content areas managed', icon: <Layers className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/20' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.bg} flex items-center gap-3.5`}>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">{s.icon}</div>
            <div className="min-w-0">
              {loading
                ? <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-1" />
                : <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              }
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              <p className="text-[9px] text-slate-400 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Module Navigation Tiles */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">CMS Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CMS_MODULES.map((mod) => {
            const Icon = mod.icon;
            const count = mod.stat ? statMap[mod.stat] : null;
            const cardContent = (
              <div className={`group p-5 rounded-2xl border ${mod.bg} ${mod.border} hover:shadow-md transition-all relative overflow-hidden`}>
                {mod.comingSoon && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-extrabold rounded-full uppercase">Coming Soon</span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <Icon className={`w-5 h-5 ${mod.iconColor}`} />
                  </div>
                  {count !== null && !loading && (
                    <span className="text-xl font-black text-slate-900 dark:text-white">{count}</span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{mod.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                {!mod.comingSoon && (
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open module <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
            return mod.comingSoon || mod.href === '#'
              ? <div key={mod.label} onClick={() => toast.info(`${mod.label} editor coming soon`)} className="cursor-pointer">{cardContent}</div>
              : <Link key={mod.label} href={mod.href}>{cardContent}</Link>;
          })}
        </div>
      </div>

      {/* Two-Column: Upcoming Events + Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Upcoming Events</h3>
            </div>
            <Link href="/cms/events" className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />)}</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No upcoming events</p>
              <Link href="/cms/events" className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Schedule an event →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    {ev.eventType && <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${eventTypeColor(ev.eventType)}`}>{ev.eventType}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{isoToDisplay(ev.startDate)}</span>
                      {ev.location && <span className="flex items-center gap-1 truncate max-w-[120px]"><MapPin className="w-3 h-3 shrink-0" />{ev.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Live Announcements</h3>
            </div>
            <Link href="/announcements" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />)}</div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No active announcements</p>
              <Link href="/announcements" className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">Publish one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentAnnouncements.map(ann => (
                <div key={ann.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${priorityColor(ann.priority)}`}>{ann.priority}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{ann.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                      <span className="capitalize">{ann.targetAudience}</span>
                      {ann.publishDate && <span>{isoToDisplay(ann.publishDate)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/cms/events', label: '+ Schedule Event', color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
            { href: '/announcements', label: '+ Post Announcement', color: 'bg-amber-500 text-white hover:bg-amber-600' },
            { href: '/cms/gallery', label: '+ Add Gallery Item', color: 'bg-sky-600 text-white hover:bg-sky-700' },
            { href: '/cms/contact', label: 'View Inquiries', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' },
            { href: '/calendar', label: 'Open Calendar', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${a.color}`}>{a.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
