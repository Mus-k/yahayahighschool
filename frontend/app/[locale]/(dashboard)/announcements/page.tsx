'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Megaphone, Plus, Bell, Users, X, RefreshCw,
  AlertTriangle, Info, CheckCircle2, Clock, Calendar as CalendarIcon,
  Filter, Pin, ExternalLink, Send
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { AnnouncementEntity } from '@/types/cms.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
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

function priorityConfig(p: AnnouncementEntity['priority']) {
  switch (p) {
    case 'urgent': return {
      badge: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-955/40 dark:text-rose-305 dark:border-rose-800',
      banner: 'border-l-4 border-l-rose-500 bg-rose-50/70 dark:bg-rose-950/20',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
      label: 'URGENT',
    };
    case 'high': return {
      badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-955/40 dark:text-amber-305 dark:border-amber-800',
      banner: 'border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/10',
      icon: <Bell className="w-4 h-4 text-amber-500 shrink-0" />,
      label: 'HIGH',
    };
    default: return {
      badge: 'bg-slate-105 text-slate-650 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      banner: 'border-l-4 border-l-slate-300 dark:border-l-slate-600 bg-white dark:bg-slate-900',
      icon: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
      label: 'NORMAL',
    };
  }
}

function audienceConfig(a: AnnouncementEntity['targetAudience']) {
  const map: Record<string, { label: string; color: string }> = {
    all:      { label: 'All',      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
    students: { label: 'Students', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-305' },
    parents:  { label: 'Parents',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-955/40 dark:text-violet-305' },
    teachers: { label: 'Teachers', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-305' },
    public:   { label: 'Public',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-305' },
  };
  return map[a] || { label: a, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' };
}

function isExpired(a: AnnouncementEntity) {
  return !!a.expiryDate && a.expiryDate < todayISO();
}

// ─── Create Announcement Modal ───────────────────────────────────────────────

function CreateAnnouncementModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]                   = useState('');
  const [content, setContent]               = useState('');
  const [priority, setPriority]             = useState<AnnouncementEntity['priority']>('normal');
  const [targetAudience, setTargetAudience] = useState<AnnouncementEntity['targetAudience']>('all');
  const [publishDate, setPublishDate]       = useState(todayISO());
  const [expiryDate, setExpiryDate]         = useState('');
  const [submitting, setSubmitting]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setSubmitting(true);
    try {
      await cmsService.createAnnouncement({
        title,
        content,
        priority,
        targetAudience,
        publishDate: publishDate || undefined,
        expiryDate: expiryDate || undefined,
      });
      toast.success('Announcement published successfully.');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish announcement.');
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
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40">
              <Megaphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Post Announcement</h3>
              <p className="text-[11px] text-slate-400 font-mono">Publish official dispatches and notices</p>
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
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Bulletin Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Eid Al-Adha Holiday Announcement"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Announcement Content *</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write detail announcement details here..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-655 dark:text-slate-300 uppercase tracking-wide">Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-655 dark:text-slate-300 uppercase tracking-wide">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="all">Platform Wide</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents / Guardians</option>
                  <option value="teachers">Faculty / Staff</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Publish Date</label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wide">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish Bulletin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ announcement }: { announcement: AnnouncementEntity }) {
  const [expanded, setExpanded] = useState(false);
  const pc = priorityConfig(announcement.priority);
  const ac = audienceConfig(announcement.targetAudience);
  const expired = isExpired(announcement);

  return (
    <div className={`rounded-2xl border shadow-sm transition-all hover:shadow-md ${ expired ? 'opacity-60' : '' } ${ pc.banner }`}>
      <div className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {pc.icon}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${pc.badge}`}>{pc.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ac.color}`}>
              <Users className="w-2.5 h-2.5 inline-block mr-0.5" />{ac.label}
            </span>
            {expired && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800">EXPIRED</span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
            {announcement.publishDate ? isoToDisplay(announcement.publishDate) : ''}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{announcement.title}</h3>

        {/* Content */}
        <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${ !expanded && announcement.content.length > 180 ? 'line-clamp-3' : '' }`}>
          {announcement.content}
        </p>
        {announcement.content.length > 180 && (
          <button onClick={() => setExpanded(e => !e)} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer">
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {announcement.expiryDate && !expired && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Expires {isoToDisplay(announcement.expiryDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/calendar" className="flex items-center gap-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <CalendarIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementEntity[]>([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState('');
  const [priorityFilter, setPriorityFilter]   = useState('all');
  const [audienceFilter, setAudienceFilter]   = useState('all');
  const [showExpired, setShowExpired]         = useState(false);
  const [density, setDensity]                 = useState<TableDensity>('cozy');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getAnnouncements('en');
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const q2 = query.toLowerCase();
      const matchQ  = !query || a.title.toLowerCase().includes(q2) || a.content.toLowerCase().includes(q2);
      const matchP  = priorityFilter === 'all' || a.priority === priorityFilter;
      const matchA  = audienceFilter === 'all' || a.targetAudience === audienceFilter;
      const matchEx = showExpired || !isExpired(a);
      return matchQ && matchP && matchA && matchEx;
    });
  }, [announcements, query, priorityFilter, audienceFilter, showExpired]);

  const activeFiltersCount = [
    priorityFilter !== 'all', audienceFilter !== 'all', showExpired
  ].filter(Boolean).length;

  const clearFilters = () => { setPriorityFilter('all'); setAudienceFilter('all'); setShowExpired(false); setQuery(''); };

  const urgentCount  = announcements.filter(a => a.priority === 'urgent' && !isExpired(a)).length;
  const highCount    = announcements.filter(a => a.priority === 'high' && !isExpired(a)).length;
  const activeCount  = announcements.filter(a => !isExpired(a)).length;
  const expiredCount = announcements.filter(isExpired).length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total', title: 'Active Announcements', value: String(activeCount),
      subtitle: `${expiredCount} expired`,
      trendDirection: 'neutral', icon: <Megaphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'urgent', title: 'Urgent Bulletins', value: String(urgentCount),
      subtitle: 'Requires immediate attention',
      trendDirection: urgentCount > 0 ? 'down' : 'up',
      icon: <AlertTriangle className={`w-5 h-5 ${urgentCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />,
      isActive: priorityFilter === 'urgent',
      onClick: () => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent'),
    },
    {
      id: 'high', title: 'High Priority', value: String(highCount),
      subtitle: 'Important notices',
      trendDirection: 'neutral', icon: <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      isActive: priorityFilter === 'high',
      onClick: () => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high'),
    },
    {
      id: 'all_count', title: 'Total Records', value: String(announcements.length),
      subtitle: 'All including expired',
      trendDirection: 'neutral', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  const sortedAnnouncements = useMemo(() => {
    const order: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    return [...filteredAnnouncements].sort((a, b) => {
      const pDiff = (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      const aDate = a.publishDate || '';
      const bDate = b.publishDate || '';
      return bDate.localeCompare(aDate);
    });
  }, [filteredAnnouncements]);

  return (
    <EnterpriseModuleShell
      title="Announcements & School Bulletins"
      description="Broadcast official notices, fee alerts, academic updates, and urgent bulletins across student, parent, and faculty portals."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Announcements' }]}
      icon={<Megaphone className="w-8 h-8" />}
      recordCount={filteredAnnouncements.length}
      recordLabel="Announcements"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <Link href="/cms/events" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all">
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Events
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 text-white text-xs font-black shadow-lg shadow-sky-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Post Announcement
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Quick links */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { href: '/announcements', label: 'Announcements', active: true  },
          { href: '/cms/events',    label: 'CMS Events',    active: false },
          { href: '/calendar',      label: 'Calendar',      active: false },
        ].map(({ href, label, active }) => (
          <Link key={href} href={href}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${ active ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            {urgentCount} urgent announcement{urgentCount > 1 ? 's' : ''} require immediate attention.
          </p>
          <button onClick={() => setPriorityFilter('urgent')} className="ml-auto px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors cursor-pointer">
            View Urgent
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Audience</label>
          <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500">
            <option value="all">All Audiences</option>
            <option value="all">Platform Wide</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
            <option value="teachers">Teachers</option>
            <option value="public">Public</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showExpired} onChange={e => setShowExpired(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 animate-none" />
          <span className="text-[11px] font-bold text-slate-500">Show expired</span>
        </label>
        {activeFiltersCount > 0 && (
          <button onClick={clearFilters} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer">
            Clear ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Search toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search announcements by title or content..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Announcements refreshed.'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel="+ Post Announcement"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* Card list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No announcements found.</p>
          <p className="text-xs text-slate-400 mt-1">Announcements published in Strapi CMS will appear here.</p>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors cursor-pointer">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAnnouncements.map(a => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
        />
      )}
    </EnterpriseModuleShell>
  );
}
