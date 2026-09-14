'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, X, Megaphone, Globe, ExternalLink,
  AlertTriangle, RefreshCw, Filter, Radio
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { EventEntity, AnnouncementEntity } from '@/types/cms.types';
import { toast } from 'sonner';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function isoToDisplay(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function sameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10);
}

function eventTypeColor(type?: string) {
  const map: Record<string, string> = {
    'Academic': 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700',
    'Islamic/Religious': 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
    'Sports': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    'Cultural': 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-700',
    'Parent Gathering': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700',
    'Holiday': 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
  };
  return map[type || ''] || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
}

function priorityColor(p: string) {
  if (p === 'urgent') return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700';
  if (p === 'high') return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700';
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

// â”€â”€â”€ Event Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EventDetailModal({ event, onClose }: { event: EventEntity; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="space-y-1">
            {event.eventType && (
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${eventTypeColor(event.eventType)}`}>
                {event.eventType}
              </span>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 ml-3 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Start</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">{isoToDisplay(event.startDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> End</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">{isoToDisplay(event.endDate)}</p>
            </div>
          </div>
          {event.location && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-700 dark:text-slate-200">{event.location}</span>
            </div>
          )}
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{event.description}</p>
          )}
          {event.registrationRequired && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Registration Required</p>
                {event.capacity && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Capacity: {event.capacity.toLocaleString('en-US')} seats</p>}
                {event.registrationDeadline && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Deadline: {isoToDisplay(event.registrationDeadline)}</p>}
              </div>
              <Link href={`/cms/events`} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors">
                Register â†’
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Mini Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MiniCalendar({
  year, month, events, onDayClick, selectedDay
}: {
  year: number;
  month: number;
  events: EventEntity[];
  onDayClick: (d: string) => void;
  selectedDay: string | null;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow   = new Date(year, month, 1).getDay(); // 0 = Sun
  const today      = todayISO();

  const eventDays = useMemo(() => {
    const set = new Set<number>();
    events.forEach(ev => {
      const s = new Date(ev.startDate);
      const e = new Date(ev.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          set.add(d.getDate());
        }
      }
    });
    return set;
  }, [events, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 pb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday = iso === today;
          const isSelected = iso === selectedDay;
          const hasEvent = eventDays.has(day);
          return (
            <button
              key={i}
              onClick={() => onDayClick(iso)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer
                ${ isSelected ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' :
                   isToday    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400' :
                                'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300' }
              `}
            >
              {day}
              {hasEvent && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${ isSelected ? 'bg-white' : 'bg-emerald-500' }`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SchoolCalendarPage() {
  const [events, setEvents]               = useState<EventEntity[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementEntity[]>([]);
  const [loading, setLoading]             = useState(true);
  const [year, setYear]                   = useState(() => new Date().getFullYear());
  const [month, setMonth]                 = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay]     = useState<string | null>(null);
  const [typeFilter, setTypeFilter]       = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<EventEntity | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [evs, anns] = await Promise.all([
        cmsService.getEvents('en', 200),
        cmsService.getAnnouncements('en'),
      ]);
      setEvents(evs);
      setAnnouncements(anns);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); setSelectedDay(todayISO()); };

  // Events for current view month
  const monthEvents = useMemo(() => {
    return events.filter(ev => {
      const s = new Date(ev.startDate);
      const e = new Date(ev.endDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd   = new Date(year, month + 1, 0);
      const typeMatch  = typeFilter === 'all' || ev.eventType === typeFilter;
      return typeMatch && s <= monthEnd && e >= monthStart;
    });
  }, [events, year, month, typeFilter]);

  // Events for selected day (or all month if no day selected)
  const displayEvents = useMemo(() => {
    if (!selectedDay) return monthEvents.slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
    return monthEvents.filter(ev => {
      const s = new Date(ev.startDate);
      const e = new Date(ev.endDate);
      const d = new Date(selectedDay);
      return s <= d && e >= d;
    });
  }, [monthEvents, selectedDay]);

  const upcomingAnnouncements = useMemo(() =>
    announcements
      .filter(a => !a.expiryDate || a.expiryDate >= todayISO())
      .slice(0, 5),
    [announcements]
  );

  const eventTypes = ['Academic', 'Islamic/Religious', 'Sports', 'Cultural', 'Parent Gathering', 'Holiday'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            Enterprise School Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institutional master calendar â€” academic events, Islamic observances, examinations, and public ceremonies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer">
            Today
          </button>
          <button onClick={() => { loadData(); toast.success('Calendar refreshed.'); }} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/cms/events" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4 stroke-[3]" />
            Manage Events
          </Link>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${ typeFilter === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400' }`}
        >
          All Events
        </button>
        {eventTypes.map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${ typeFilter === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400' }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Mini Calendar + Month Nav */}
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <MiniCalendar year={year} month={month} events={events} onDayClick={setSelectedDay} selectedDay={selectedDay} />

          {/* Legend */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Types</h4>
            {eventTypes.map(t => (
              <div key={t} className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${eventTypeColor(t)}`}>{t}</span>
              </div>
            ))}
          </div>

          {/* Announcements panel */}
          {upcomingAnnouncements.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Announcements
                </h4>
                <Link href="/announcements" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline">View all â†’</Link>
              </div>
              <div className="space-y-2">
                {upcomingAnnouncements.map(a => (
                  <div key={a.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${priorityColor(a.priority)}`}>{a.priority.toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{a.targetAudience}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{a.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Event list for selected day / month */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {selectedDay ? `Events on ${isoToDisplay(selectedDay)}` : `Events in ${MONTH_NAMES[month]} ${year}`}
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">({displayEvents.length})</span>
            </h3>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold transition-colors cursor-pointer">Show month Ã—</button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {selectedDay ? 'No events scheduled for this day.' : 'No events this month.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Events created in the CMS Events module will appear here.</p>
              <Link href="/cms/events" className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors">
                Go to Events CMS â†’
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {displayEvents.map(ev => (
                <div
                  key={ev.id}
                  className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {ev.eventType && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${eventTypeColor(ev.eventType)}`}>
                            {ev.eventType}
                          </span>
                        )}
                        {ev.registrationRequired && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 text-[10px] font-bold">Registration Required</span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap">{isoToDisplay(ev.startDate)}</p>
                      {ev.startDate !== ev.endDate && (
                        <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap">â†’ {isoToDisplay(ev.endDate)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> {ev.location}
                        </span>
                      )}
                      {ev.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {ev.capacity.toLocaleString('en-US')} seats
                        </span>
                      )}
                    </div>
                    <button className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}