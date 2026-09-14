'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  School, Save, MapPin, Mail, Phone, Globe, Award,
  Plus, Edit2, Trash2, X, RefreshCw, Building2,
  Calendar, AlertTriangle, CheckCircle2, Upload
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { apiClient } from '@/services/api.service';
import { t as i18nT } from '@/lib/i18n-dict';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SchoolProfile {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  academicYearStart: string;
  academicYearEnd: string;
  timezone: string;
  defaultLanguage: 'en' | 'ar' | 'fr' | 'tr';
  registrationNumber: string;
  foundedYear: string;
}

interface Campus {
  id: number;
  documentId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  recordStatus: 'active' | 'inactive';
}

const EMPTY_PROFILE: SchoolProfile = {
  schoolName: '',
  motto: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  academicYearStart: '',
  academicYearEnd: '',
  timezone: 'Africa/Lagos',
  defaultLanguage: 'en',
  registrationNumber: '',
  foundedYear: '',
};

const EMPTY_CAMPUS: {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  recordStatus: 'active' | 'inactive';
} = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  principalName: '',
  recordStatus: 'active',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchoolProfileSettingsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [profile, setProfile] = useState<SchoolProfile>(EMPTY_PROFILE);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Campus modal
  const [campusModal, setCampusModal] = useState(false);
  const [editCampus, setEditCampus] = useState<Campus | null>(null);
  const [campusForm, setCampusForm] = useState({ ...EMPTY_CAMPUS });
  const [savingCampus, setSavingCampus] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, campusRes] = await Promise.all([
        apiClient.get('/school-profile').catch(() => null),
        apiClient.get('/campuses', { params: { pagination: { limit: 100 }, sort: 'name:asc' } }),
      ]);

      const pd = profileRes?.data?.data;
      if (pd) {
        setHasProfile(true);
        setProfile({
          schoolName: pd.schoolName || '',
          motto: pd.motto || '',
          address: pd.address || '',
          phone: pd.phone || '',
          email: pd.email || '',
          website: pd.website || '',
          academicYearStart: pd.academicYearStart || '',
          academicYearEnd: pd.academicYearEnd || '',
          timezone: pd.timezone || 'Africa/Lagos',
          defaultLanguage: pd.defaultLanguage || 'en',
          registrationNumber: pd.registrationNumber || '',
          foundedYear: pd.foundedYear ? String(pd.foundedYear) : '',
        });
      } else {
        setHasProfile(false);
      }

      const rawCampuses: Campus[] = (campusRes.data?.data || []).map((c: any) => ({
        id: c.id,
        documentId: c.documentId,
        name: c.name || '',
        code: c.code || '',
        address: c.address || '',
        phone: c.phone || '',
        email: c.email || '',
        principalName: c.principalName || '',
        recordStatus: c.recordStatus || 'active',
      }));
      setCampuses(rawCampuses);
    } catch (err) {
      console.error('Load settings error:', err);
      toast.error(t('Failed to load school profile'));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.schoolName.trim()) {
      toast.error(t('School name is required'));
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        schoolName: profile.schoolName,
        motto: profile.motto,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        academicYearStart: profile.academicYearStart || null,
        academicYearEnd: profile.academicYearEnd || null,
        timezone: profile.timezone,
        defaultLanguage: profile.defaultLanguage,
        registrationNumber: profile.registrationNumber,
        foundedYear: profile.foundedYear ? parseInt(profile.foundedYear, 10) : null,
      };
      await apiClient.put('/school-profile', { data: payload });
      setHasProfile(true);
      toast.success(t('School profile saved successfully'));
    } catch (err: any) {
      console.error('Save profile error:', err);
      toast.error(t('Failed to save school profile'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Campus CRUD ────────────────────────────────────────────────────────────
  const openCreateCampus = () => {
    setEditCampus(null);
    setCampusForm({ ...EMPTY_CAMPUS });
    setCampusModal(true);
  };

  const openEditCampus = (campus: Campus) => {
    setEditCampus(campus);
    setCampusForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      phone: campus.phone,
      email: campus.email,
      principalName: campus.principalName,
      recordStatus: campus.recordStatus,
    });
    setCampusModal(true);
  };

  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim()) {
      toast.error(t('Campus name is required'));
      return;
    }
    setSavingCampus(true);
    try {
      if (editCampus) {
        await apiClient.put(`/campuses/${editCampus.documentId}`, { data: campusForm });
        toast.success(t('Campus updated successfully'));
      } else {
        await apiClient.post('/campuses', { data: campusForm });
        toast.success(t('Campus created successfully'));
      }
      setCampusModal(false);
      loadData();
    } catch {
      toast.error(editCampus ? t('Failed to update campus') : t('Failed to create campus'));
    } finally {
      setSavingCampus(false);
    }
  };

  const handleDeleteCampus = async (campus: Campus) => {
    if (!confirm(t('Are you sure you want to delete this campus?'))) return;
    try {
      await apiClient.delete(`/campuses/${campus.documentId}`);
      setCampuses(prev => prev.filter(c => c.id !== campus.id));
      toast.success(t('Campus deleted'));
    } catch {
      toast.error(t('Failed to delete campus'));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-80" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <School className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Institutional Profile & Branding')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Configure official institution name, contact channels, and campus locations.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!hasProfile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('No profile data yet — fill the form and save')}
            </div>
          )}
          {hasProfile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('Profile synced with Strapi')}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <School className="w-4 h-4 text-emerald-500" />
          {t('School Identity')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('School Official Name')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={profile.schoolName}
              onChange={e => setProfile(p => ({ ...p, schoolName: e.target.value }))}
              placeholder="Yahaya International Islamic and English High School"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Registration Number')}
            </label>
            <input
              type="text"
              value={profile.registrationNumber}
              onChange={e => setProfile(p => ({ ...p, registrationNumber: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            {t('Institutional Motto / Vision Statement')}
          </label>
          <input
            type="text"
            value={profile.motto}
            onChange={e => setProfile(p => ({ ...p, motto: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Mail className="inline w-3 h-3 mr-1" />{t('Contact Email')}
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Phone className="inline w-3 h-3 mr-1" />{t('Phone')}
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Globe className="inline w-3 h-3 mr-1" />{t('Website')}
            </label>
            <input
              type="text"
              value={profile.website}
              onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-sky-600 dark:text-sky-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            <MapPin className="inline w-3 h-3 mr-1" />{t('Headquarters Address')}
          </label>
          <textarea
            rows={2}
            value={profile.address}
            onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Founded Year')}
            </label>
            <input
              type="number"
              min={1900}
              max={2100}
              value={profile.foundedYear}
              onChange={e => setProfile(p => ({ ...p, foundedYear: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Timezone')}
            </label>
            <select
              value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
              <option value="Africa/Monrovia">Africa/Monrovia (GMT)</option>
              <option value="Europe/Istanbul">Europe/Istanbul (TRT +3)</option>
              <option value="Asia/Riyadh">Asia/Riyadh (AST +3)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Default Language')}
            </label>
            <select
              value={profile.defaultLanguage}
              onChange={e => setProfile(p => ({ ...p, defaultLanguage: e.target.value as any }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="en">English</option>
              <option value="ar">Arabic (عربي)</option>
              <option value="fr">Français</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Calendar className="inline w-3 h-3 mr-1" />{t('Academic Year Start')}
            </label>
            <input
              type="date"
              value={profile.academicYearStart}
              onChange={e => setProfile(p => ({ ...p, academicYearStart: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t('Saving...') : t('Save Profile Settings')}</span>
          </button>
        </div>
      </form>

      {/* ── Campuses ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-500" />
            {t('Campus Locations')}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              {campuses.length}
            </span>
          </h2>
          <button
            onClick={openCreateCampus}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('Add Campus')}
          </button>
        </div>

        {campuses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{t('No campuses yet. Add your first campus location.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campuses.map(campus => (
              <div
                key={campus.id}
                className={cn(
                  'p-5 rounded-2xl border shadow-sm transition-all',
                  campus.recordStatus === 'active'
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white">{campus.name}</h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {campus.code}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        campus.recordStatus === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}>
                        {campus.recordStatus === 'active' ? t('Active') : t('Inactive')}
                      </span>
                    </div>
                    {campus.principalName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('Principal')}: <span className="font-semibold">{campus.principalName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => openEditCampus(campus)}
                      className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 hover:bg-sky-100 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampus(campus)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {campus.address && <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />{campus.address}</p>}
                  {campus.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0 text-slate-400" />{campus.phone}</p>}
                  {campus.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 shrink-0 text-slate-400" />{campus.email}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Campus Modal ────────────────────────────────────────────────── */}
      {campusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white text-base">
                    {editCampus ? t('Edit Campus') : t('Add Campus')}
                  </h2>
                  <p className="text-xs text-slate-500">{t('Campus location details')}</p>
                </div>
              </div>
              <button onClick={() => setCampusModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Campus Name')} <span className="text-rose-500">*</span></label>
                  <input type="text" required value={campusForm.name} onChange={e => setCampusForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="CAMP-A"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Code')}</label>
                  <input type="text" value={campusForm.code} onChange={e => setCampusForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="CAMP-A01"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Principal Name')}</label>
                <input type="text" value={campusForm.principalName} onChange={e => setCampusForm(f => ({ ...f, principalName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Address')}</label>
                <textarea rows={2} value={campusForm.address} onChange={e => setCampusForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Phone')}</label>
                  <input type="text" value={campusForm.phone} onChange={e => setCampusForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('Email')}</label>
                  <input type="email" value={campusForm.email} onChange={e => setCampusForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t('Status')}: {campusForm.recordStatus === 'active' ? t('Active') : t('Inactive')}</p>
                <button type="button"
                  onClick={() => setCampusForm(f => ({ ...f, recordStatus: f.recordStatus === 'active' ? 'inactive' : 'active' }))}
                  className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer', campusForm.recordStatus === 'active' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600')}>
                  <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow', campusForm.recordStatus === 'active' ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCampusModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                  {t('Cancel')}
                </button>
                <button type="submit" disabled={savingCampus}
                  className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white rounded-xl text-sm font-bold transition shadow-md cursor-pointer disabled:cursor-not-allowed">
                  {savingCampus ? t('Saving...') : editCampus ? t('Update Campus') : t('Create Campus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
