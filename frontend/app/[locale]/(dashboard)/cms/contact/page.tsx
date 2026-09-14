/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare, Search, Mail, Phone, Trash2, Eye, X,
  RefreshCw, Filter, Download, Clock, User,
  Reply, Inbox, Archive, MailOpen
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import qs from 'qs';

interface ContactSubmission {
  id: number | string;
  documentId?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  department?: string;
  message: string;
  status?: 'unread' | 'read' | 'replied' | 'archived';
  createdAt?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return ''; }
}

function statusColor(status?: string) {
  switch (status) {
    case 'unread': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    case 'replied': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'archived': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  }
}

// ─── Inspect Drawer ───────────────────────────────────────────────────────────

function InspectDrawer({ message, onClose, onStatusChange }: { message: ContactSubmission; onClose: () => void; onStatusChange: (id: string | number, status: string) => void; }) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Inquiry Details</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 font-black text-sm uppercase shrink-0">{message.name.slice(0, 2)}</div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{message.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColor(message.status)}`}>{message.status || 'unread'}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <a href={`mailto:${message.email}`} className="font-semibold hover:text-sky-600 break-all">{message.email}</a>
            </div>
            {message.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="font-semibold">{message.phone}</span></div>}
            {message.department && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><User className="w-3.5 h-3.5 text-violet-500 shrink-0" /><span className="font-semibold">Re: {message.department} Dept.</span></div>}
            {message.createdAt && <div className="flex items-center gap-2 text-slate-400"><Clock className="w-3.5 h-3.5 shrink-0" /><span>{timeAgo(message.createdAt)}</span></div>}
          </div>
        </div>
        {message.subject && <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Subject</p><p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{message.subject}</p></div>}
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Message</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{message.message}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {(['unread', 'read', 'replied', 'archived'] as const).map(s => (
              <button key={s} onClick={() => onStatusChange(message.documentId || message.id, s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${message.status === s ? statusColor(s) : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
        <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Your Inquiry')} — Yahaya Islamic School`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">
          <Reply className="w-3.5 h-3.5" />Reply via Email
        </a>
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer border-none transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">Close</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEMO_MESSAGES: ContactSubmission[] = [
  { id: 1, name: 'Dr. Tariq Al-Mansoor', email: 'tariq@example.com', phone: '+231-776-3322', subject: 'Hifz Boarding Facilities Inquiry', department: 'Admissions', message: 'Assalamu Alaikum. I would like to inquire about your boarding facilities for Grade 7 students. Does the school offer weekend Quran memorization sessions alongside the regular curriculum?', status: 'unread', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, name: 'Sister Zainab Touré', email: 'zainab.t@example.com', phone: '+231-554-1199', subject: 'Waqf Donation Tax Receipt', department: 'Finance', message: 'We made a Waqf donation last semester and need an official tax receipt for our records. Please advise on the process.', status: 'replied', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, name: 'Abdullah Cisse', email: 'a.cisse@example.com', phone: '+231-887-4455', subject: 'Transfer Application from International Islamic Academy', department: 'Admissions', message: 'I am writing on behalf of my daughter who is currently enrolled at International Islamic Academy in Grade 6. We are relocating and wish to transfer her to your school starting the new academic year.', status: 'read', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 4, name: 'Br. Umar Kamara', email: 'umar.k@example.com', subject: 'Arabic Language Teacher Position', department: 'HR', message: 'I hold an Ijazah in Arabic and have 5 years of teaching experience in West Africa. I am seeking a teaching position at your esteemed institution.', status: 'unread', createdAt: new Date(Date.now() - 43200000).toISOString() },
];

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [inspectMsg, setInspectMsg] = useState<ContactSubmission | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs.stringify({ sort: ['createdAt:desc'], pagination: { limit: 200 } }, { encodeValuesOnly: true });
      const res = await apiClient.get(`/contact-submissions?${q}`);
      setMessages(res.data?.data || []);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        toast.info('Showing demo data — connect /contact-submissions API to enable live data.');
        setMessages(DEMO_MESSAGES);
      } else {
        toast.error('Failed to load contact submissions');
        setMessages(DEMO_MESSAGES);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleStatusChange = async (id: string | number, status: string) => {
    try { await apiClient.put(`/contact-submissions/${id}`, { data: { status } }); } catch { /* silent */ }
    setMessages(prev => prev.map(m => (m.documentId === id || m.id === id) ? { ...m, status: status as any } : m));
    setInspectMsg(prev => prev && (prev.documentId === id || prev.id === id) ? { ...prev, status: status as any } : prev);
    toast.success(`Status updated to "${status}"`);
  };

  const handleDelete = async (msg: ContactSubmission) => {
    if (!confirm(`Delete inquiry from ${msg.name}?`)) return;
    try { await apiClient.delete(`/contact-submissions/${msg.documentId || msg.id}`); } catch { /* silent */ }
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    toast.success('Inquiry deleted');
    if (inspectMsg?.id === msg.id) setInspectMsg(null);
  };

  const handleMarkRead = (msg: ContactSubmission) => {
    if (msg.status === 'unread') handleStatusChange(msg.documentId || msg.id, 'read');
    setInspectMsg(msg);
  };

  const filtered = useMemo(() => {
    let list = messages;
    if (filterStatus) list = list.filter(m => m.status === filterStatus);
    if (query) { const q = query.toLowerCase(); list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.subject || '').toLowerCase().includes(q) || m.message.toLowerCase().includes(q)); }
    return list;
  }, [messages, filterStatus, query]);

  const stats = { total: messages.length, unread: messages.filter(m => !m.status || m.status === 'unread').length, replied: messages.filter(m => m.status === 'replied').length, archived: messages.filter(m => m.status === 'archived').length };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Subject', 'Department', 'Status', 'Message', 'Date'];
    const rows = filtered.map(m => [m.name, m.email, m.phone || '', m.subject || '', m.department || '', m.status || 'unread', m.message.replace(/\n/g, ' '), m.createdAt || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `contact_inquiries_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 space-y-5 animate-in fade-in duration-300">

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-rose-600 rounded-xl shadow-md shadow-rose-200 dark:shadow-rose-950"><MessageSquare className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Contact Inquiries</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">Review and respond to messages submitted via the public school website contact form.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadMessages} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards (clickable filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Inquiries', value: stats.total, icon: <Inbox className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/20', filter: '' },
          { label: 'Unread', value: stats.unread, icon: <MailOpen className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20', filter: 'unread' },
          { label: 'Replied', value: stats.replied, icon: <Reply className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20', filter: 'replied' },
          { label: 'Archived', value: stats.archived, icon: <Archive className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800', filter: 'archived' },
        ].map((s, i) => (
          <button key={i} onClick={() => setFilterStatus(filterStatus === s.filter ? '' : s.filter)} className={`p-4 rounded-2xl border ${s.bg} flex items-center gap-3.5 text-left cursor-pointer transition-all hover:shadow-sm ${filterStatus === s.filter ? 'ring-2 ring-offset-1 ring-rose-400' : ''}`}>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">{s.icon}</div>
            <div>
              {loading ? <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" /> : <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>}
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, email, subject, or message..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters || filterStatus ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:border-rose-700 dark:text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
          <Filter className="w-3.5 h-3.5" />Status Filter {filterStatus && <span className="ml-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">1</span>}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none">
            <option value="">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          {filterStatus && <button onClick={() => setFilterStatus('')} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer"><X className="w-3 h-3" /> Clear</button>}
          <span className="text-[11px] text-slate-400 font-semibold ml-auto">{filtered.length} messages</span>
        </div>
      )}

      {loading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />)}</div>}

      {!loading && (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">No Inquiries Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">No messages match the current search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => (
              <div key={msg.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-sm transition-shadow ${!msg.status || msg.status === 'unread' ? 'border-rose-200 dark:border-rose-900/40' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 font-black text-sm uppercase shrink-0">{msg.name.slice(0, 2)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{msg.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColor(msg.status)}`}>{msg.status || 'unread'}</span>
                        {msg.createdAt && <span className="text-[10px] text-slate-400 font-mono">{timeAgo(msg.createdAt)}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-sky-500" />{msg.email}</span>
                        {msg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" />{msg.phone}</span>}
                      </div>
                      {msg.subject && <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mb-1">{msg.subject}</p>}
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                    <button onClick={() => handleMarkRead(msg)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer border-none transition-colors">
                      <Eye className="w-3.5 h-3.5" />View
                    </button>
                    <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your Inquiry')} — Yahaya Islamic School`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-colors hover:bg-sky-100">
                      <Reply className="w-3.5 h-3.5" />Reply
                    </a>
                    <button onClick={() => handleDelete(msg)} className="p-1.5 rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {inspectMsg && <InspectDrawer message={inspectMsg} onClose={() => setInspectMsg(null)} onStatusChange={handleStatusChange} />}
    </div>
  );
}
