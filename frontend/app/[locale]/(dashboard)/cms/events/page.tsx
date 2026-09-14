'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Calendar as CalendarIcon, Plus, Users, MapPin, Clock, Eye,
  Globe, Radio, CheckCircle2, AlertCircle, X, RefreshCw,
  Download, Edit2, Trash2, ExternalLink, Filter, Send
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { EventEntity } from '@/types/cms.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function isoToDisplay(iso: string) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function isUpcoming(ev: EventEntity) {
  return new Date(ev.startDate) > new Date();
}

function isPast(ev: EventEntity) {
  return new Date(ev.endDate) < new Date();
}

function eventTypeColor(type?: string) {
  const map: Record<string, string> = {
    'Academic': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-305',
    'Islamic/Religious': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-305',
    'Sports': 'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-305',
    'Cultural': 'bg-violet-100 text-violet-700 dark:bg-violet-955/40 dark:text-violet-305',
    'Parent Gathering': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-305',
    'Holiday': 'bg-rose-100 text-rose-700 dark:bg-rose-955/40 dark:text-rose-305',
  };
  return map[type || ''] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────

function EventDetailPanel({ event, onClose }: { event: EventEntity; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 flex-wrap">
              {event.eventType && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${eventTypeColor(event.eventType)}`}>{event.eventType}</span>
              )}
              <span className="font-mono text-[10px] text-slate-400">{event.slug}</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
            {[
              { label: 'Start Date', value: isoToDisplay(event.startDate) },
              { label: 'End Date',   value: isoToDisplay(event.endDate) },
              { label: 'Location',   value: event.location || '—' },
              { label: 'Capacity',   value: event.capacity ? event.capacity.toLocaleString('en-US') + ' seats' : '—' },
              { label: 'Registration', value: event.registrationRequired ? 'Required' : 'Open / None' },
              { label: 'Reg. Deadline', value: event.registrationDeadline ? isoToDisplay(event.registrationDeadline) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-slate-900 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {event.description && (
              <div>
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Description</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{event.description}</p>
              </div>
            )}
            {event.department && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Department:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{event.department.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors">
            <CalendarIcon className="w-3.5 h-3.5" /> View on Calendar
          </Link>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Event Modal ───────────────────────────────────────────────────────

function CreateEventModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]                           = useState('');
  const [slug, setSlug]                             = useState('');
  const [description, setDescription]               = useState('');
  const [eventType, setEventType]                   = useState<EventEntity['eventType']>('Academic');
  const [location, setLocation]                     = useState('');
  const [startDate, setStartDate]                   = useState(todayISO());
  const [endDate, setEndDate]                       = useState(todayISO());
  const [registrationRequired, setRegRequired]     = useState(false);
  const [capacity, setCapacity]                     = useState('');
  const [registrationDeadline, setRegDeadline]     = useState('');
  const [submitting, setSubmitting]                 = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      toast.error('Title, start date, and end date are required.');
      return;
    }

    setSubmitting(true);
    try {
      await cmsService.createEvent({
        title,
        slug: slug || undefined,
        description,
        eventType,
        location: location || undefined,
        startDate,
        endDate,
        registrationRequired,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        registrationDeadline: registrationDeadline || undefined,
      });
      toast.success('Event scheduled successfully.');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Schedule Public Event</h3>
              <p className="text-[11px] text-slate-400 font-mono">Create an institutional event on CMS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Annual Hifz Graduation Ceremony"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Event URL Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain ceremonies, agenda, target attendees..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Event Type</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Academic">Academic</option>
                  <option value="Islamic/Religious">Islamic/Religious</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Parent Gathering">Parent Gathering</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Location / Venue</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={registrationRequired}
                  onChange={e => setRegRequired(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Registration / RSVP Required</span>
              </label>

              {registrationRequired && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Seat Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={e => setCapacity(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">RSVP Deadline</label>
                    <input
                      type="date"
                      value={registrationDeadline}
                      onChange={e => setRegDeadline(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents]   = useState<EventEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [timingFilter, setTimingFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedEvent, setSelectedEvent] = useState<EventEntity | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getEvents('en', 200);
      setEvents(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const q2 = query.toLowerCase();
      const matchQ  = !query || ev.title.toLowerCase().includes(q2) || (ev.location || '').toLowerCase().includes(q2) || ev.slug.toLowerCase().includes(q2);
      const matchTy = typeFilter === 'all' || ev.eventType === typeFilter;
      const matchTm = timingFilter === 'all' || (timingFilter === 'upcoming' && isUpcoming(ev)) || (timingFilter === 'past' && isPast(ev));
      return matchQ && matchTy && matchTm;
    });
  }, [events, query, typeFilter, timingFilter]);

  const activeFiltersCount = [typeFilter !== 'all', timingFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setTypeFilter('all'); setTimingFilter('all'); setQuery(''); };

  const upcomingCount  = events.filter(isUpcoming).length;
  const pastCount      = events.filter(isPast).length;
  const regRequired    = events.filter(e => e.registrationRequired).length;
  const totalCapacity  = events.reduce((s, e) => s + (e.capacity || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total', title: 'Total Events', value: String(events.length),
      subtitle: `${upcomingCount} upcoming · ${pastCount} past`,
      trendDirection: 'up', icon: <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'upcoming', title: 'Upcoming', value: String(upcomingCount),
      subtitle: 'Scheduled future events',
      trendDirection: 'up', icon: <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      isActive: timingFilter === 'upcoming',
      onClick: () => setTimingFilter(timingFilter === 'upcoming' ? 'all' : 'upcoming'),
    },
    {
      id: 'registration', title: 'Reg. Required', value: String(regRequired),
      subtitle: 'Events with RSVP/registration',
      trendDirection: 'neutral', icon: <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
    },
    {
      id: 'capacity', title: 'Total Capacity', value: totalCapacity.toLocaleString('en-US'),
      subtitle: 'Aggregate seat count',
      trendDirection: 'neutral', icon: <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  const EVENT_TYPES = ['Academic', 'Islamic/Religious', 'Sports', 'Cultural', 'Parent Gathering', 'Holiday'];

  const columns = useMemo<ColumnDef<EventEntity, any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Event',
      cell: ({ row }) => {
        const ev = row.original;
        return (
          <div className="space-y-1 max-w-sm py-1">
            <div className="flex items-center gap-2 flex-wrap">
              {ev.eventType && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${eventTypeColor(ev.eventType)}`}>{ev.eventType}</span>
              )}
              {ev.registrationRequired && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-955/40 text-amber-700 dark:text-amber-305 text-[10px] font-bold">RSVP</span>
              )}
            </div>
            <p className="font-black text-slate-900 dark:text-white text-sm truncate">{ev.title}</p>
            {ev.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ev.description}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Schedule',
      cell: ({ row }) => {
        const ev = row.original;
        return (
          <div className="font-mono text-xs space-y-0.5">
            <span className="font-black text-slate-900 dark:text-white block">{isoToDisplay(ev.startDate)}</span>
            {ev.startDate !== ev.endDate && (
              <span className="text-slate-400 block">to {isoToDisplay(ev.endDate)}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Venue & Capacity',
      cell: ({ row }) => {
        const ev = row.original;
        return (
          <div className="space-y-1 text-xs">
            {ev.location && (
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold truncate max-w-[180px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{ev.location}
              </span>
            )}
            {ev.capacity && (
              <span className="flex items-center gap-1 text-slate-400">
                <Users className="w-3 h-3" />{ev.capacity.toLocaleString('en-US')} seats
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => {
        const d = row.original.department;
        return d ? (
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.title}</span>
        ) : <span className="text-xs text-slate-400">-</span>;
      },
    },
    {
      id: 'timing',
      header: 'Status',
      cell: ({ row }) => {
        const ev = row.original;
        if (isPast(ev)) return <StatusBadge status="completed" size="sm" />;
        if (isUpcoming(ev)) return <StatusBadge status="active" size="sm" />;
        return <StatusBadge status="pending" size="sm" />;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); setSelectedEvent(row.original); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Eye className="w-3 h-3" /> Inspect
          </button>
          <Link
            href="/calendar"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700"
          >
            <CalendarIcon className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
  ], []);

  return (
    <EnterpriseModuleShell
      title="Events & Institutional CMS Console"
      description="Manage institutional ceremonies, Hifz graduations, debate championships, parent conferences, and academic events. All events sync to the School Calendar."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'CMS' }, { label: 'Events' }]}
      icon={<CalendarIcon className="w-8 h-8" />}
      recordCount={filteredEvents.length}
      recordLabel="Events"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            View Calendar
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Event
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Quick links to related modules */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { href: '/cms/events',       label: 'Events',        active: true  },
          { href: '/announcements',    label: 'Announcements', active: false },
          { href: '/calendar',         label: 'Calendar View', active: false },
        ].map(({ href, label, active }) => (
          <Link key={href} href={href}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${ active ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="all">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Timing</label>
          <select value={timingFilter} onChange={e => setTimingFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={clearFilters} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer">
            Clear ({activeFiltersCount})
          </button>
        )}
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search events by title, venue, or slug…"
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Events refreshed from CMS.'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel="+ Create Event"
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredEvents}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={setSelectedEvent}
        onRowClick={setSelectedEvent}
        emptyStateProps={{
          title: 'No Events Found',
          description: 'No CMS events match your current filters. Click "Create Event" to schedule one.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: clearFilters,
          createLabel: 'Create New Event',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {selectedEvent && (
        <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
        />
      )}
    </EnterpriseModuleShell>
  );
}