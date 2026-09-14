'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Plus, Calendar, CheckCircle2, Edit2, Trash2,
  X, RefreshCw, Search, AlertTriangle, Power,
  CalendarRange, GraduationCap
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { t as i18nT } from '@/lib/i18n-dict';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AcademicYear {
  id: number;
  documentId: string;
  name: string;
  isCurrent?: boolean;
}

interface AcademicTerm {
  id: number;
  documentId: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  locale?: string;
  academicYear?: AcademicYear | null;
}

interface TermFormData {
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  academicYear: string; // documentId
}

const EMPTY_FORM: TermFormData = {
  name: '',
  startDate: '',
  endDate: '',
  active: true,
  academicYear: ''
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AcademicTermsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicTerm | null>(null);
  const [form, setForm] = useState<TermFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [termsRes, yearsRes] = await Promise.all([
        apiClient.get('/academic-terms', {
          params: {
            locale,                         // ← only entries for active locale
            populate: ['academicYear'],
            pagination: { limit: 200 },
            sort: 'startDate:asc',
          }
        }),
        apiClient.get('/academic-years', {
          params: {
            locale,                         // ← only academic years for active locale
            pagination: { limit: 100 },
            sort: 'startDate:desc',
          }
        }),
      ]);

      const rawTerms: AcademicTerm[] = (termsRes.data?.data || []).map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        active: item.active ?? true,
        locale: item.locale,
        academicYear: item.academicYear ?? null,
      }));

      const rawYears: AcademicYear[] = (yearsRes.data?.data || []).map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
        name: item.name,
        isCurrent: item.isCurrent ?? false,
      }));

      setTerms(rawTerms);
      setAcademicYears(rawYears);
    } catch (err) {
      console.error('Error loading academic terms:', err);
      toast.error(t('Failed to load academic terms'));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = terms.filter(term => {
    if (query && !term.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterYear !== 'all' && String(term.academicYear?.id) !== filterYear) return false;
    if (filterStatus === 'active' && !term.active) return false;
    if (filterStatus === 'inactive' && term.active) return false;
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount = terms.filter(t => t.active).length;
  const inactiveCount = terms.filter(t => !t.active).length;

  // ── Open Modal ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (term: AcademicTerm) => {
    setEditTarget(term);
    setForm({
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      active: term.active,
      academicYear: term.academicYear?.documentId || '',
    });
    setShowModal(true);
  };

  // ── Save (Create or Update) ───────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error(t('Please fill all required fields'));
      return;
    }
    if (form.startDate >= form.endDate) {
      toast.error(t('End date must be after start date'));
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        active: form.active,
        locale,                           // ← create in the active portal locale
      };
      if (form.academicYear) {
        payload.academicYear = form.academicYear;
      }

      if (editTarget) {
        await apiClient.put(`/academic-terms/${editTarget.documentId}`, { data: payload });
        toast.success(t('Academic term updated successfully'));
      } else {
        await apiClient.post('/academic-terms', { data: payload });
        toast.success(t('Academic term created successfully'));
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditTarget(null);
      loadData();
    } catch (err: any) {
      console.error('Save term error:', err);
      toast.error(editTarget ? t('Failed to update academic term') : t('Failed to create academic term'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Active ─────────────────────────────────────────────────────────
  const handleToggleActive = async (term: AcademicTerm) => {
    try {
      await apiClient.put(`/academic-terms/${term.documentId}`, {
        data: { active: !term.active }
      });
      setTerms(prev => prev.map(t => t.id === term.id ? { ...t, active: !t.active } : t));
      toast.success(term.active ? t('Term deactivated') : t('Term activated'));
    } catch {
      toast.error(t('Failed to update term status'));
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (term: AcademicTerm) => {
    if (!confirm(t('Are you sure you want to delete this term? This action cannot be undone.'))) return;
    try {
      await apiClient.delete(`/academic-terms/${term.documentId}`);
      setTerms(prev => prev.filter(t => t.id !== term.id));
      toast.success(t('Academic term deleted'));
    } catch {
      toast.error(t('Failed to delete academic term'));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span>{t('Academic Terms & Semesters')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Manage semester cycles, term schedules, grading windows, and vacation periods.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('New Academic Term')}</span>
          </button>
        </div>
      </div>

      {/* ── Stats KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Total Terms'), value: terms.length, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30' },
          { label: t('Active Terms'), value: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: t('Inactive Terms'), value: inactiveCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: t('Academic Years'), value: academicYears.length, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search terms...')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">{t('All Academic Years')}</option>
          {academicYears.map(yr => (
            <option key={yr.id} value={String(yr.id)}>{yr.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">{t('All Statuses')}</option>
          <option value="active">{t('Active')}</option>
          <option value="inactive">{t('Inactive')}</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-8 h-8 border-b-2 border-sky-600 rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">{t('Loading academic terms...')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <CalendarRange className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              {query || filterYear !== 'all' || filterStatus !== 'all'
                ? t('No terms match your filters')
                : t('No academic terms found. Create the first one!')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">{t('Term / Semester Name')}</th>
                  <th className="py-3.5 px-4">{t('Academic Year')}</th>
                  <th className="py-3.5 px-4">{t('Start Date')}</th>
                  <th className="py-3.5 px-4">{t('End Date')}</th>
                  <th className="py-3.5 px-4">{t('Duration')}</th>
                  <th className="py-3.5 px-4">{t('Status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filtered.map(term => {
                  const days = daysLeft(term.endDate);
                  const isExpiringSoon = term.active && days >= 0 && days <= 30;
                  const isExpired = days < 0;
                  return (
                    <tr key={term.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                          <span>{term.name}</span>
                          {term.active && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                              {t('Active')}
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                              {days}d {t('left')}
                            </span>
                          )}
                        </div>
                        {term.locale && (
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono uppercase">{term.locale}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {term.academicYear ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{term.academicYear.name}</span>
                            {term.academicYear.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                                {t('Current')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">{t('Unassigned')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{formatDate(term.startDate)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        <span className={cn(isExpired ? 'text-rose-500' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-semibold' : '')}>
                          {formatDate(term.endDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {term.startDate && term.endDate ? (
                          (() => {
                            const totalDays = Math.ceil((new Date(term.endDate).getTime() - new Date(term.startDate).getTime()) / (1000 * 60 * 60 * 24));
                            return <span className="font-mono font-medium">{totalDays} {t('days')}</span>;
                          })()
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                          term.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}>
                          {term.active ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {term.active ? t('Active') : t('Inactive')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(term)}
                            title={term.active ? t('Deactivate') : t('Activate')}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors text-xs cursor-pointer',
                              term.active
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                            )}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(term)}
                            title={t('Edit')}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(term)}
                            title={t('Delete')}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white text-base">
                    {editTarget ? t('Edit Academic Term') : t('Create Academic Term')}
                  </h2>
                  <p className="text-xs text-slate-500">{t('Fill in the term details below')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              {/* Term Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('Term Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('e.g. First Term, Second Semester')}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('Academic Year')}
                </label>
                <select
                  value={form.academicYear}
                  onChange={e => setForm(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">{t('-- No Academic Year --')}</option>
                  {academicYears.map(yr => (
                    <option key={yr.documentId} value={yr.documentId}>
                      {yr.name}{yr.isCurrent ? ` (${t('Current')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('Start Date')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('End Date')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Duration Preview */}
              {form.startDate && form.endDate && form.startDate < form.endDate && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300">
                  <CalendarRange className="w-4 h-4 shrink-0" />
                  <span>
                    {t('Duration')}: <strong>
                      {Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('days')}
                    </strong>
                  </span>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t('Term Status')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {form.active ? t('Term is currently active') : t('Term is inactive')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                    form.active ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                  )}
                >
                  <span className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                    form.active ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white rounded-xl text-sm font-bold transition shadow-md shadow-sky-600/30 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSaving ? t('Saving...') : editTarget ? t('Update Term') : t('Create Term')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
