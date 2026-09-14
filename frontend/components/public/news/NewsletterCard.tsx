'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { NewsletterSignupSectionComponent } from '@/types/cms.types';
import { cmsService } from '@/services/cms.service';

interface NewsletterCardProps {
  data?: NewsletterSignupSectionComponent | null;
  locale?: string;
}

export function NewsletterCard({ data, locale = 'en' }: NewsletterCardProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('newsDetailPage.newsletter');

  const isEnglishFallback = locale !== 'en' && data?.title === 'Stay Updated';

  const title = (!isEnglishFallback && data?.title) ? data.title : t('title');
  const subtitle = (!isEnglishFallback && data?.subtitle) ? data.subtitle : t('desc');
  const placeholder = (!isEnglishFallback && data?.placeholderText) ? data.placeholderText : t('placeholder');
  const buttonText = (!isEnglishFallback && data?.buttonText) ? data.buttonText : t('subscribe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await cmsService.subscribeNewsletter(email, locale);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message || t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#D6E9F6] bg-white p-[clamp(1.25rem,1.6vw,1.9rem)] shadow-sm">
      <h3 className="font-serif font-bold text-[#121C2A] text-[clamp(1.125rem,1.25vw,1.375rem)] leading-snug">
        {title}
      </h3>
      <p className="mt-2 leading-[1.6] text-[#5A636D] text-[1rem]">
        {subtitle}
      </p>

      {sent ? (
        <div
          role="status"
          className="mt-4 rounded-xl bg-[#EAF5FD] p-4 text-[#036CA3] text-[0.95rem] border border-[#BDE0F5] transition-all"
        >
          <div className="flex items-center gap-2 font-medium mb-1">
            <svg className="w-5 h-5 text-[#048ED6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{t('subscribed')}</span>
          </div>
          <p className="text-[#32526b]">{t('success', { email })}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label htmlFor="newsletter-email" className="sr-only">
            {placeholder}
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="h-[clamp(2.5rem,2.4vw,2.875rem)] w-full rounded-full border border-[#D6E9F6] px-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#9AA3AD] focus-visible:border-[#048ED6] focus-visible:ring-1 focus-visible:ring-[#048ED6] text-[clamp(0.75rem,0.73vw,0.875rem)] disabled:opacity-60"
          />
          {error && (
            <p className="text-xs text-red-500 px-2" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-[clamp(2.5rem,2.4vw,2.875rem)] w-full rounded-full bg-[#048ED6] font-semibold text-white transition-all hover:bg-[#037ab8] active:scale-[0.99] text-[clamp(0.75rem,0.73vw,0.875rem)] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            <span>{buttonText}</span>
          </button>
        </form>
      )}
    </div>
  );
}
