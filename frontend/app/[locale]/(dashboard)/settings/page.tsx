'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { Settings, School, Cpu, ShieldCheck, Key, Globe, ArrowRight, Building2, Landmark } from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';

export default function SettingsOverviewPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [campusCount, setCampusCount] = useState<number | null>(null);
  const [roleCount, setRoleCount] = useState<number | null>(null);

  useEffect(() => {
    // Load live stats for the hub cards
    apiClient.get('/campuses', { params: { pagination: { limit: 1 } } })
      .then(res => setCampusCount(res.data?.meta?.pagination?.total ?? 0))
      .catch(() => setCampusCount(0));

    apiClient.get('/users-permissions/roles')
      .then(res => setRoleCount((res.data?.roles ?? []).length))
      .catch(() => setRoleCount(0));
  }, []);

  const sections = [
    {
      title: t('School Profile & Campus Info'),
      desc: t('School branding, address, phone numbers, contact email, and campus locations.'),
      href: '/settings/school-profile',
      icon: School,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badge: campusCount !== null ? `${campusCount} ${t('Campuses')}` : null,
    },
    {
      title: t('Finance & Accounting Governance'),
      desc: t('Fiscal years, base currencies, multi-currency rates, fee parameters, and tax exemptions.'),
      href: '/settings/finance',
      icon: Landmark,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      badge: t('Active Policies'),
    },
    {
      title: t('Roles & RBAC Permissions'),
      desc: t('Granular privileges for Super Admin, Director, Teachers, Students, and Parents.'),
      href: '/settings/roles',
      icon: ShieldCheck,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      badge: roleCount !== null ? `${roleCount} ${t('Roles')}` : null,
    },
    {
      title: t('Active Login Sessions'),
      desc: t('Monitor live JWT bearer sessions, IP addresses, and enforce device revocations.'),
      href: '/settings/sessions',
      icon: Key,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: null,
    },
    {
      title: t('Internationalization (i18n)'),
      desc: t('Multi-language locale toggles (English, Arabic RTL, French) and translation strings.'),
      href: '/settings/languages',
      icon: Globe,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      badge: '4 ' + t('Locales'),
    },
    {
      title: t('System API & Strapi Integrations'),
      desc: t('Manage API webhooks, SMTP email relays, SMS gateways, and payment providers.'),
      href: '/settings/integrations',
      icon: Cpu,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      badge: null,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Enterprise System Settings & Configuration')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Global system settings, security policies, institutional identity, and external service integrations.')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {campusCount !== null ? `${campusCount} ${t('Active Campuses')}` : '...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <Link
              key={i}
              href={sec.href}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${sec.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {sec.badge && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {sec.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{sec.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>{t('Configure')}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
