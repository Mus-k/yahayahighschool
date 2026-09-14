'use client';

import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StrapiLocale {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
}

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

const COVERAGE: Record<string, string> = {
  en: '100%',
  ar: '98%',
  fr: '94%',
  tr: '85%',
};

const NATIVE_NAME: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
  tr: 'Türkçe',
};

export default function LocalizationSettingsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const router = useRouter();

  const [locales, setLocales] = useState<StrapiLocale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/i18n/locales')
      .then(res => {
        const data: StrapiLocale[] = Array.isArray(res.data) ? res.data : [];
        setLocales(data);
      })
      .catch(() => toast.error(t('Failed to load registered locales')))
      .finally(() => setLoading(false));
  }, []);

  const handleSetDefault = (code: string) => {
    router.push('/', { locale: code } as any);
    toast.success(t('Portal language switched'));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span>{t('Internationalization & Localization (i18n)')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Registered Strapi locales, RTL/LTR directions, and portal language switcher.')}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); apiClient.get('/i18n/locales').then(r => setLocales(Array.isArray(r.data) ? r.data : [])).finally(() => setLoading(false)); }}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locales.map(lang => {
            const isRTL = RTL_LOCALES.includes(lang.code);
            const isActive = locale === lang.code;
            return (
              <div
                key={lang.code}
                className={cn(
                  'p-6 rounded-2xl border transition-all flex flex-col justify-between shadow-sm',
                  isActive
                    ? 'bg-purple-50 dark:bg-slate-900/90 border-purple-500 shadow-md'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {NATIVE_NAME[lang.code] ?? lang.name}
                      </span>
                      {lang.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                          {t('Default')}
                        </span>
                      )}
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700">
                          {t('Current')}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 rounded-lg font-mono text-xs font-bold border',
                      isRTL
                        ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    )}>
                      {isRTL ? 'RTL' : 'LTR'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{lang.name}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{t('Translation Coverage')}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{COVERAGE[lang.code] ?? '80%'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: COVERAGE[lang.code] ?? '80%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">{lang.code}</span>
                  <button
                    onClick={() => handleSetDefault(lang.code)}
                    disabled={isActive}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 cursor-default'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-800 dark:text-slate-200 dark:hover:bg-purple-600'
                    )}
                  >
                    {isActive ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t('Active')}</span>
                    ) : (
                      <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> {t('Switch Portal')}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <strong className="text-slate-700 dark:text-slate-300">{t('Note')}:</strong>{' '}
        {t('Locales are registered in Strapi CMS. To add a new language, go to Strapi Admin → i18n Settings.')}
      </div>
    </div>
  );
}
