'use client';

import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

export default function LLMSDirectorAnalyticsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-4 p-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('LLMS Director Analytics')}</h1>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-lg">
        {t('This is a placeholder page for the Phase 3C LLMS module:')} <strong>{t('LLMS Director Analytics')}</strong>.
        {t('The full interface will be built out iteratively.')}
      </p>
    </div>
  );
}
