'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Building2, CheckCircle2, ChevronDown, ChevronRight,
  Copy, Globe, HeartHandshake, ShieldCheck, Star,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { useTranslations, useLocale } from 'next-intl';
import { LeafImage } from '@/components/public/shared/LeafImage';
import PhoneInput from 'react-phone-input-2';
import { getStrapiMediaUrl } from '@/services/cms.service';
import type { DonationCampaignEntity, DonationSettingsEntity } from '@/types/cms.types';

import 'swiper/css';
import 'react-phone-input-2/lib/style.css';

/**
 * Donation page. Implemented from Figma node 384-2393 (frame 1920x3774).
 *
 * Measured off the export:
 *   hero band     #FAFAFA, y 99->636 (538 tall), leaf image x1135->1781
 *   give section  left panel #F8FAFC x139->1087 (949), right card from x1131,
 *                 44 between them, both 590 tall
 *   gratitude     #048ED6 band, 764 tall
 *
 * ─────────────────────────────────────────────────────────────────────────
 * The bank details below are TRANSCRIBED FROM THE DESIGN AND ARE PLACEHOLDERS.
 * "YTIBNGLXXXX" is not a real SWIFT code and the IBAN is a dummy. Publishing a
 * donation page with the wrong account details sends people's money nowhere.
 * Replace every value in BANK_ACCOUNTS with figures confirmed by the school's
 * bank before this page goes anywhere near production.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BANK_ACCOUNTS = [
  {
    id: 'intl',
    icon: Globe,
    label: 'International Transfer (USD/EUR)',
    rows: [
      { k: 'Bank Name', v: 'Ecobank of Liberia', copy: false },
      { k: 'Account Name', v: 'Yahaya International Islamic & English High School', copy: false },
      { k: 'Account Number (IBAN)', v: 'NG73 0123 4567 8901 2345', copy: true },
      { k: 'Swift / BIC Code', v: 'YTIBNGLXXXX', copy: true },
    ],
  },
  {
    id: 'local',
    icon: Building2,
    label: 'Local Account (Liberia)',
    rows: [
      { k: 'Bank Name', v: 'Ecobank of Liberia', copy: false },
      { k: 'Account Name', v: 'Yahaya International Islamic & English High School', copy: false },
      { k: 'Account Number', v: '0123 4567 8901', copy: true },
    ],
  },
];

const AMOUNTS = ['$25', '$50', '$100', '$250', '$500', 'Other'];
const CURRENCIES = ['USD - US Dollar', 'EUR - Euro', 'GBP - British Pound', 'LRD - Liberian Dollar'];
const DESIGNATIONS = [
  "General Fund (Where it's needed most)",
  'Scholarships & Sponsorship',
  'Buildings & Facilities',
  'Boarding & Student Welfare',
  'Mosque & Spiritual Life',
];

const CAUSES = [
  {
    tag: 'Scholarship', title: 'Sponsor Hifz', cta: 'Sponsor Now',
    image: '/images/figma-home/13.png', alt: 'A student reading in the library',
    desc: 'Support the sacred journey of a student memorizing the Holy Qur’an with full tuition and care.'
  },
  {
    tag: 'Infrastructure', title: 'Build Facilities', cta: 'Fund Building',
    image: '/images/figma-home/09.png', alt: 'A lesson in progress',
    desc: 'Contribute to the construction of state-of-the-art classrooms and research laboratories.'
  },
  {
    tag: 'Living', title: 'Hostel Support', cta: 'Support Housing',
    image: '/images/figma-home/17.png', alt: 'Group study in the library',
    desc: 'Help provide a secure, nurturing, and professional environment for our boarding students.'
  },
  {
    tag: 'Legacy', title: 'Mosque Fund', cta: 'Contribute',
    image: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building',
    desc: 'Support the spiritual center of our institution, ensuring its maintenance and community life.'
  },
  {
    tag: 'Learning', title: 'Library & Books', cta: 'Give Books',
    image: '/images/figma-home/19.png', alt: 'Students walking on campus',
    desc: 'Stock the shelves that every subject depends on, from Qur’anic study to the sciences.'
  },
];

const PATRONS = [
  { name: 'The Al-Fayed Family', quote: 'A legacy of learning for our children and generations to come.' },
  { name: 'Umar & Sarah Mansoor', quote: 'Proud to support the next generation of global leaders.' },
  { name: 'Islamic Relief', quote: 'Committed to global excellence in faith-based education.' },
  { name: 'Community Fund', quote: 'Building a sustainable and enlightened future together.' },
  { name: 'Anonymous Patron', quote: 'Give quietly, and let the work speak for itself.' },
  { name: 'The Kromah Trust', quote: 'Education is the surest investment a community can make.' },
];

export function DonationHero({
  title,
  description,
  bulletPoints,
  coverImage,
  breadcrumbTitle
}: {
  title?: string;
  description?: string;
  bulletPoints?: { text: string }[];
  coverImage?: any;
  breadcrumbTitle?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('donationsPage.hero');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const bullets = bulletPoints && bulletPoints.length > 0
    ? bulletPoints.map(bp => bp.text)
    : [t('bullet_1'), t('bullet_2')];

  // Ensure the image URL is absolute since Strapi returns a relative path like `/uploads/...`
  const rawUrl = coverImage?.url;
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
  const imageUrl = rawUrl
    ? (rawUrl.startsWith('http') ? rawUrl : `${strapiUrl}${rawUrl}`)
    : "/images/figma-home/09.png";

  const renderTitle = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={i} className="italic text-[#048ED6]">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i} className="text-[#121C2A]">{part}</span>;
    });
  };

  return (
    <section className="w-full bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center md:gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) lg:grid-cols-[minmax(0,996fr)_minmax(0,647fr)]">
        <div className="min-w-0  py-[clamp(1.5rem,3.1vw,3.75rem)]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{t('breadcrumbHome')}</Link>
            <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
            <span className="text-[#048ED6]">{breadcrumbTitle || t('breadcrumbDonation')}</span>
          </nav>

          {title ? (
            <h1 className="mt-[clamp(1.25rem,2.1vw,2.5rem)] leading-[1.1] text-[clamp(1.75rem,2.81vw,3.375rem)]">
              {renderTitle(title)}
            </h1>
          ) : (
            <h1 className="mt-[clamp(1.25rem,2.1vw,2.5rem)] leading-[1.1] text-[clamp(1.75rem,2.81vw,3.375rem)]">
              <span className="text-[#121C2A]">{t('headline_1')}</span>
              <span className="italic text-[#048ED6]">{t('headline_2')}</span>
            </h1>
          )}

          <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[26rem] leading-[1.6] text-[#5A636D] text-[1rem]">
            {description || t('lede')}
          </p>

          <ul className="mt-[clamp(1.5rem,2.4vw,2.9rem)] flex flex-wrap items-center gap-[clamp(1rem,1.35vw,1.625rem)]">
            {bullets.map((text, idx) => {
              const I = idx === 0 ? ShieldCheck : HeartHandshake;
              return (
                <li key={idx} className="flex items-center gap-2 text-[#121C2A] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                  <span className="grid h-[clamp(1.75rem,1.98vw,2.375rem)] w-[clamp(1.75rem,1.98vw,2.375rem)] place-items-center rounded-full bg-[#E1EFF6] text-[#048ED6]">
                    <I className="h-[45%] w-[45%]" aria-hidden />
                  </span>
                  {text}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-full max-lg:hidden mt-[-10px] h-[calc(100%+10px)]">
          <LeafImage src={imageUrl} alt={title || "Students working together in class"} />
        </div>
        <div className="w-full lg:hidden">
          <img src={imageUrl} alt={title || "Students working together in class"} className="aspect-[704/532] w-full rounded-lg object-cover" />
        </div>
      </div>
    </section>
  );
}

export function GiveSection({ settings }: { settings?: DonationSettingsEntity | null }) {
  const t = useTranslations('donationsPage.give');
  const [openAccount, setOpenAccount] = useState<string | null>('intl');
  const [amountIdx, setAmountIdx] = useState(2);
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [copied, setCopied] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');

  const accountsToUse = settings?.bankTransfer?.bankAccounts?.length ? settings.bankTransfer.bankAccounts : BANK_ACCOUNTS;
  const amountsToUse = settings?.amounts?.length ? settings.amounts.map(a => a.value) : AMOUNTS;
  const currenciesToUse = settings?.currencies?.length ? settings.currencies.map(c => c.value) : CURRENCIES;
  const designationsToUse = settings?.designations?.length ? settings.designations.map(d => d.value) : DESIGNATIONS;

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      // Clipboard can be blocked by permissions; the value is on screen either way.
    }
  };

  const select =
    'h-[clamp(2.5rem,2.6vw,3.125rem)] w-full rounded-lg border border-[#DCE6F0] bg-white px-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#8A939C] focus-visible:border-[#048ED6] text-[clamp(0.75rem,0.78vw,0.9375rem)]';
  const customSelect = `${select} custom-select truncate`;

  return (
    <section id="give-online-form" className="w-full bg-white">
      <style>{`
        .custom-select {
          appearance: none;
          padding-right: 2.5rem !important;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23121C2A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 15px center !important;
          background-size: 16px 16px !important;
        }
        .react-tel-input .form-control {
          width: 100% !important;
          height: clamp(2.5rem, 2.6vw, 3.125rem) !important;
          border-radius: 0.5rem !important;
          border: 1px solid #DCE6F0 !important;
          background-color: white !important;
          color: #121C2A !important;
          font-size: clamp(0.75rem, 0.78vw, 0.9375rem) !important;
          padding-left: 3rem !important;
          transition: border-color 0.2s !important;
          font-family: inherit !important;
        }
        .react-tel-input .form-control:focus {
          border-color: #048ED6 !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .react-tel-input .flag-dropdown {
          border: none !important;
          background: transparent !important;
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        .react-tel-input .flag-dropdown.open {
          background: transparent !important;
          border: none !important;
        }
        .react-tel-input .flag-dropdown:hover, 
        .react-tel-input .flag-dropdown:focus {
          background: transparent !important;
        }
        .react-tel-input .selected-flag {
          background: transparent !important;
          width: 48px !important;
          padding: 0 0 0 16px !important;
        }
        [dir="rtl"] .react-tel-input {
          direction: ltr !important;
        }
        [dir="rtl"] .react-tel-input .form-control {
          text-align: left !important;
        }
        [dir="rtl"] .react-tel-input .flag-dropdown {
          left: 0 !important;
          right: auto !important;
        }
        .react-tel-input .selected-flag:hover, 
        .react-tel-input .selected-flag:focus {
          background: transparent !important;
        }
        .react-tel-input .selected-flag .arrow {
          display: none !important;
        }
        .react-tel-input .country-list {
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #D6E9F6 !important;
          margin-top: 4px !important;
          width: 260px !important;
          max-width: 85vw !important;
          font-family: inherit !important;
          color: #121C2A !important;
          background-color: white !important;
        }
        .react-tel-input .country-list .search {
          padding: 10px !important;
          background-color: white !important;
        }
        .react-tel-input .country-list .search-box {
          width: 100% !important;
          margin: 0 !important;
          border-radius: 0.375rem !important;
          border: 1px solid #D6E9F6 !important;
          padding: 0.5rem 0.75rem !important;
          background-color: #F7FBFE !important;
          font-size: 0.875rem !important;
          outline: none !important;
          transition: border-color 0.2s !important;
          color: #121C2A !important;
        }
        .react-tel-input .country-list .search-box::placeholder {
          color: #8A939C !important;
        }
        .react-tel-input .country-list .search-emoji,
        .react-tel-input .country-list .search-icon {
          display: none !important;
        }
        .react-tel-input .country-list .search-box:focus {
          border-color: #048ED6 !important;
        }
        .react-tel-input .country-list .country {
          padding: 0.5rem 1rem !important;
        }
        .react-tel-input .country-list .country-name {
          display: none !important;
        }
        .react-tel-input .country-list .dial-code {
          color: #121C2A !important;
          margin-left: 0.5rem !important;
        }
        .react-tel-input .country-list .country.highlight {
          background-color: #EAF5FD !important;
        }
        .react-tel-input .country-list .country:hover {
          background-color: #F7FBFE !important;
        }
        .react-tel-input .country-list .no-entries-message {
          color: #8A939C !important;
          padding: 0.5rem 1rem !important;
        }
      `}</style>
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2rem,3.1vw,3.75rem)]">
        {/* 949 / 650 with 44 between them, at 1920 */}
        <div className="grid grid-cols-1 gap-[clamp(1.25rem,2.29vw,2.75rem)] lg:grid-cols-[minmax(0,949fr)_minmax(0,650fr)]">
          {/* Left Column: Bank transfer & Image */}
          <div className="flex flex-col gap-[clamp(1.25rem,2.29vw,2.75rem)]">
            <div className="rounded-lg bg-[#F8FAFC] p-[clamp(1.25rem,2.08vw,2.5rem)]">
              <h2 className="text-center font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                {settings?.bankTransfer?.title || t('preferBank')}
              </h2>

              <div className="mt-[clamp(1.25rem,1.66vw,2rem)] space-y-[clamp(0.75rem,1.04vw,1.25rem)]">
                {accountsToUse.map((account: any, idx: number) => {
                  const id = account.id.toString();
                  const Icon = account.icon === 'Globe' ? Globe : Building2;
                  const on = openAccount === id;
                  return (
                    <div key={id} className="overflow-hidden rounded-lg border border-[#E5EBF2] bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenAccount(on ? null : id)}
                        aria-expanded={on}
                        className="flex w-full items-center gap-3 p-[clamp(0.875rem,1.15vw,1.375rem)] text-left"
                      >
                        <span className="grid h-[clamp(1.75rem,1.98vw,2.375rem)] w-[clamp(1.75rem,1.98vw,2.375rem)] shrink-0 place-items-center rounded-lg bg-[#E1EFF6] text-[#048ED6]">
                          <Icon className="h-[45%] w-[45%]" aria-hidden />
                        </span>
                        <span className={`min-w-0 flex-1 font-semibold text-[clamp(0.75rem,0.83vw,1rem)] ${on ? 'text-[#048ED6]' : 'text-[#121C2A]'}`}>
                          {account.title || account.label || t(`bankAccounts.${idx}.label`)}
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[#6F757D] transition-transform ${on ? 'rotate-180' : ''}`} aria-hidden />
                      </button>

                      <div className={`grid transition-[grid-template-rows] duration-300 ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <dl className="grid grid-cols-1 gap-[clamp(0.75rem,1.04vw,1.25rem)] border-t border-[#E5EBF2] p-[clamp(0.875rem,1.15vw,1.375rem)] sm:grid-cols-2">
                            {account.rows.map((r: any) => {
                              const keyMap: Record<string, string> = {
                                'Bank Name': t('bankKeys.bankName'),
                                'Account Name': t('bankKeys.accountName'),
                                'Account Number (IBAN)': t('bankKeys.iban'),
                                'Swift / BIC Code': t('bankKeys.swift'),
                                'Account Number': t('bankKeys.accountNum')
                              };
                              const k = r.k || r.label;
                              const v = r.v || r.value;
                              const canCopy = r.copy !== undefined ? r.copy : r.canCopy;
                              return (
                                <div key={k} className="min-w-0">
                                  <dt className="font-semibold uppercase tracking-[0.1em] text-[#8A939C] text-[clamp(0.5rem,0.52vw,0.625rem)]">
                                    {keyMap[k] || k}
                                  </dt>
                                  <dd className="mt-1 flex items-start gap-2">
                                    <span className="min-w-0 break-words text-[#121C2A] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                                      {v}
                                    </span>
                                    {canCopy ? (
                                      <button
                                        type="button"
                                        onClick={() => copy(v, `${id}-${k}`)}
                                        aria-label={`Copy ${k}`}
                                        className="relative shrink-0 text-[#048ED6] transition-opacity hover:opacity-70"
                                      >
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                                          {copied === `${id}-${k}` ? t('copiedBtn') : t('copyBtn')}
                                        </span>
                                        {copied === `${id}-${k}` ? (
                                          <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </button>
                                    ) : null}
                                  </dd>
                                </div>
                              )
                            })}
                          </dl>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
            {settings?.bankTransfer?.image?.url && (
              <div className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded-lg hidden lg:block">
                <img
                  src={getStrapiMediaUrl(settings.bankTransfer.image.url) || '/images/figma-home/02-about.jpeg'}
                  alt={settings.bankTransfer.image.alternativeText || "Bank Transfer Details"}
                  className="absolute inset-0 h-full w-full object-cover" 
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#048ED6] p-[clamp(1.25rem,1.66vw,2rem)] h-fit">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <p className="grid h-[clamp(2.5rem,2.3vw,2.75rem)] place-items-center rounded-lg bg-[#048ED6] font-semibold text-white text-[1rem]">
                {settings?.formLabels?.formTitle || t('title')}
              </p>

              <fieldset className="mt-[clamp(1.25rem,1.66vw,2rem)]">
                <legend className="font-medium text-[#121C2A] text-[1.125rem]">
                  {settings?.formLabels?.amountLabel || t('amountLabel')}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {amountsToUse.map((a, idx) => {
                    const on = amountIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAmountIdx(idx)}
                        aria-pressed={on}
                        className={`h-[clamp(2.25rem,2.29vw,2.75rem)] min-w-[clamp(3.25rem,3.6vw,4.375rem)] rounded-lg border px-3 font-semibold transition-colors text-[clamp(0.6875rem,0.73vw,0.875rem)] ${on
                          ? 'border-[#048ED6] bg-[#048ED6] text-white'
                          : 'border-[#DCE6F0] bg-white text-[#121C2A] hover:border-[#048ED6] hover:text-[#048ED6]'
                          }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-[clamp(1.25rem,1.66vw,2rem)]">
                <legend className="font-medium text-[#121C2A] text-[1.125rem]">{settings?.formLabels?.frequencyLabel || t('frequencyLabel')}</legend>
                <div className="mt-3 flex gap-4 max-sm:flex-col">
                  <label
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-[4px] border py-[clamp(0.75rem,0.8vw,1rem)] font-medium text-[clamp(0.875rem,0.9vw,1rem)] transition-all ${frequency === 'one-time'
                      ? 'border-[#048ED6] bg-[#048ED6] text-white'
                      : 'border-[#DAE0E7] bg-white text-[#5A636D]'
                      }`}
                  >
                    <input type="radio" name="frequency" value="one-time" className="hidden" checked={frequency === 'one-time'} onChange={(e) => setFrequency(e.target.value as any)} />
                    {settings?.formLabels?.oneTimeLabel || t('oneTimeLabel')}
                  </label>
                  <label
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-[4px] border py-[clamp(0.75rem,0.8vw,1rem)] font-medium text-[clamp(0.875rem,0.9vw,1rem)] transition-all ${frequency === 'monthly'
                      ? 'border-[#048ED6] bg-[#048ED6] text-white'
                      : 'border-[#DAE0E7] bg-white text-[#5A636D]'
                      }`}
                  >
                    <input type="radio" name="frequency" value="monthly" className="hidden" checked={frequency === 'monthly'} onChange={(e) => setFrequency(e.target.value as any)} />
                    {settings?.formLabels?.monthlyLabel || t('monthlyLabel')}
                  </label>
                </div>
              </fieldset>

              <div className="mt-[clamp(1.25rem,1.66vw,2rem)] grid grid-cols-1 gap-[clamp(1rem,1.3vw,1.5rem)] sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="currency" className="font-medium text-[#121C2A] text-[1rem]">
                    {settings?.formLabels?.currencyLabel || t('currencyLabel')}
                  </label>
                  <select id="currency" name="currency" className={`${customSelect} mt-0`}>
                    {currenciesToUse.map((curr, idx) => <option key={idx}>{curr}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="designation" className="font-medium text-[#121C2A] text-[1rem]">
                    {settings?.formLabels?.designationLabel || t('designationLabel')}
                  </label>
                  <select id="designation" name="designation" className={`${customSelect} mt-0`}>
                    {designationsToUse.map((desig, idx) => <option key={idx}>{desig}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-[clamp(1.5rem,2vw,2.5rem)] border-t border-[#E5EBF2] pt-[clamp(1.25rem,1.66vw,2rem)]">
                <h3 className="font-semibold text-[#121C2A] text-[clamp(0.875rem,0.94vw,1.125rem)] mb-4">
                  {settings?.formLabels?.donorInfoLabel || t('donorInfo')}
                </h3>

                <div className="grid grid-cols-1 gap-[clamp(1rem,1.25vw,1.5rem)] sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="don-name" className="font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)]">{settings?.formLabels?.fullNameLabel || t('fullName')}</label>
                    <input id="don-name" name="name" required placeholder={settings?.formLabels?.fullNamePlaceholder || t('fullNamePlaceholder')} className={`${select} mt-2`} />
                  </div>

                  <div>
                    <label htmlFor="don-email" className="font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)]">{settings?.formLabels?.emailLabel || t('email')}</label>
                    <input id="don-email" name="email" type="email" required placeholder={settings?.formLabels?.emailPlaceholder || t('emailPlaceholder')} className={`${select} mt-2`} />
                  </div>

                  <div>
                    <label htmlFor="don-phone" className="font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)]">{settings?.formLabels?.phoneLabel || t('phone')}</label>
                    <PhoneInput
                      country={'lr'}
                      enableSearch={true}
                      value={phoneValue}
                      onChange={setPhoneValue}
                      inputProps={{
                        name: 'phone',
                        id: 'don-phone'
                      }}
                      containerClass="w-full mt-2"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-[clamp(1.25rem,1.66vw,2rem)] flex h-[clamp(2.75rem,3.1vw,3.75rem)] w-full items-center justify-center gap-2 rounded-lg bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.875rem,0.94vw,1.125rem)]"
              >
                <HeartHandshake className="h-4 w-4" />
                {settings?.formLabels?.submitButtonLabel || t('donateButton')}
              </button>

              {/* The design reads "safe, secure and tax-deductible". Whether a
                  gift is deductible depends on the donor's jurisdiction and the
                  school's registered status, so that claim is not repeated. */}
              <p className="mt-3 text-center text-[#8A939C] text-[1rem]">
                {settings?.formLabels?.secureInfoText || t('secureInfo')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TargetedGiving({ campaigns = [], settings }: { campaigns?: DonationCampaignEntity[], settings?: DonationSettingsEntity }) {
  const t = useTranslations('donationsPage.targeted');
  const [sw, setSw] = useState<SwiperClass | null>(null);
  const [active, setActive] = useState(0);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) max-sm:pb-5 sm:py-[clamp(1.5rem,4vw,4.8rem)]">
        <h2 className="text-center text-[#121C2A] text-[clamp(1.5rem,2.08vw,2.5rem)]">{settings?.targetedGiving?.title1 || t('title_1')} <span className="italic text-[#048ED6]">{settings?.targetedGiving?.title2 || t('title_2')}</span></h2>
        <span className="mx-auto mt-3 block h-[3px] w-[clamp(2rem,2.6vw,3.125rem)] rounded bg-[#048ED6]" />
        <p className="mx-auto mt-4 max-w-[38rem] text-center text-[#5A636D] text-[1rem]">
          {settings?.targetedGiving?.subtitle || t('subtitle')}
        </p>

        <div className="relative mt-[clamp(1.5rem,2.6vw,3.125rem)]">
          <Swiper
            onSwiper={setSw}
            onSlideChange={(s) => setActive(s.activeIndex)}
            speed={800}
            slidesPerView={1}
            spaceBetween={24}
            breakpoints={{ 769: { slidesPerView: 2 }, 1025: { slidesPerView: 3 }, 1281: { slidesPerView: 4 } }}
            className="dn-causes"
          >
            {campaigns.length > 0 ? campaigns.map((c, idx) => {
              const progress = c.targetAmount > 0 ? (c.raisedAmount / c.targetAmount) * 100 : 0;
              return (
                <SwiperSlide key={c.slug || idx} className="!h-auto py-1">
                  <article className="group flex h-full flex-col cursor-pointer overflow-hidden rounded-lg bg-white shadow-[0_6px_24px_rgba(4,45,80,0.10)]">
                    <div className="relative overflow-hidden">
                      <img src={(c.banner?.url ? getStrapiMediaUrl(c.banner.url) : null) || '/images/figma-home/13.png'} alt={c.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-in-out lg:group-hover:scale-110 rtl:-scale-x-100" />
                      <span className="absolute left-3 top-3 rounded bg-[#048ED6] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-white text-[clamp(0.5rem,0.52vw,0.625rem)]">
                        {c.categoryTag || t(`causes.${Math.min(idx, 4)}.tag`)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-[clamp(1rem,1.15vw,1.375rem)]">
                      <div className="mb-[clamp(0.75rem,1vw,1.25rem)]">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-[#048ED6]" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <div className="flex justify-between mt-3 text-[#5A636D] text-[clamp(0.75rem,0.73vw,0.875rem)]">
                          <span>${c.raisedAmount?.toLocaleString() || 0} {c.raisedLabel || settings?.targetedGiving?.raisedLabel || "raised"}</span>
                          {c.targetAmount != null && c.targetAmount > 0 && (
                            <span>${c.targetAmount.toLocaleString()} {c.goalLabel || settings?.targetedGiving?.goalLabel || "goal"}</span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-[#048ED6] text-[clamp(1rem,1.15vw,1.375rem)]">{c.title}</h3>
                      <p className="mt-2 flex-1 leading-[1.6] text-[#5A636D] text-[1rem]">{c.description}</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('give-online-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-[clamp(1rem,1.35vw,1.625rem)] rounded-full h-[clamp(2.25rem,2.4vw,2.875rem)] w-full bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]"
                      >
                        {c.buttonText || t(`causes.${Math.min(idx, 4)}.cta`)}
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              )
            }) : [0, 1, 2, 3, 4].map((idx) => {
              const c = CAUSES[idx];
              return (
                <SwiperSlide key={c.title} className="!h-auto py-1">
                  <article className="group flex h-full flex-col cursor-pointer overflow-hidden rounded-lg bg-white shadow-[0_6px_24px_rgba(4,45,80,0.10)]">
                    <div className="relative overflow-hidden">
                      <img src={c.image} alt={c.alt} className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-in-out lg:group-hover:scale-110 rtl:-scale-x-100" />
                      <span className="absolute left-3 top-3 rounded bg-[#048ED6] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-white text-[clamp(0.5rem,0.52vw,0.625rem)]">
                        {t(`causes.${idx}.tag`)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-[clamp(1rem,1.15vw,1.375rem)]">
                      <h3 className="text-[#048ED6] text-[clamp(1rem,1.15vw,1.375rem)]">{t(`causes.${idx}.title`)}</h3>
                      <p className="mt-2 flex-1 leading-[1.6] text-[#5A636D] text-[1rem]">{t(`causes.${idx}.desc`)}</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('give-online-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-[clamp(1rem,1.35vw,1.625rem)] rounded-full h-[clamp(2.25rem,2.4vw,2.875rem)] w-full bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]"
                      >
                        {t(`causes.${idx}.cta`)}
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              )
            })}
          </Swiper>

          <button
            type="button"
            aria-label="Previous causes"
            onClick={() => sw?.slidePrev()}
            disabled={active === 0}
            className={`absolute -left-2 top-1/2 z-[2] grid h-[clamp(2rem,2.08vw,2.5rem)] w-[clamp(2rem,2.08vw,2.5rem)] -translate-y-1/2 place-items-center rounded-full border border-[#048ED6] bg-white text-[#048ED6] transition-colors hover:bg-[#048ED6] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#048ED6] max-lg:hidden ${sw?.isLocked ? 'hidden' : ''}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next causes"
            onClick={() => sw?.slideNext()}
            disabled={!!sw?.isEnd}
            className={`absolute -right-2 top-1/2 z-[2] grid h-[clamp(2rem,2.08vw,2.5rem)] w-[clamp(2rem,2.08vw,2.5rem)] -translate-y-1/2 place-items-center rounded-full border border-[#048ED6] bg-white text-[#048ED6] transition-colors hover:bg-[#048ED6] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#048ED6] max-lg:hidden ${sw?.isLocked ? 'hidden' : ''}`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style>{`
        .dn-causes .swiper-slide { height: auto; }
      `}</style>
    </section>
  );
}

export function WallOfGratitude({ settings }: { settings?: DonationSettingsEntity }) {
  const t = useTranslations('donationsPage.wall');
  const [sw, setSw] = useState<SwiperClass | null>(null);
  // Track Swiper's snap grid rather than dividing the slide index by the page
  // size: with 6 patrons at 4 per view the last page clamps to index 2, so
  // floor(index / 4) never reaches the second dot.
  const [snap, setSnap] = useState({ index: 0, count: 1 });
  const readSnap = (s: SwiperClass) =>
    setSnap({ index: s.snapIndex ?? 0, count: Math.max(1, s.snapGrid?.length ?? 1) });

  return (
    <section className="w-full bg-[#048ED6] mb-10 max-sm:mb-5">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(1.5rem,4.7vw,5.6rem)]">
        <h2 className="text-center font-semibold text-white text-[clamp(1.5rem,2.08vw,2.5rem)]">{settings?.wallOfGratitude?.title || "Wall of Gratitude"}</h2>
        <span className="mx-auto mt-4 block h-[2px] w-8 bg-white/40" />
        <p className="mx-auto mt-4 max-w-[42rem] text-center text-white/90 text-[clamp(0.875rem,0.94vw,1.125rem)]">
          {settings?.wallOfGratitude?.subtitle || "May Allah reward all those who support the pursuit of beneficial knowledge."}
        </p>

        <Swiper
          onSwiper={(s) => { setSw(s); readSnap(s); }}
          onSlideChange={readSnap}
          onBreakpoint={readSnap}
          onResize={readSnap}
          speed={800}
          slidesPerView={1}
          slidesPerGroup={1}
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 2, slidesPerGroup: 2 },
            768: { slidesPerView: 3, slidesPerGroup: 3 },
            1281: { slidesPerView: 4, slidesPerGroup: 4 },
          }}
          className="dn-patrons mt-[clamp(1.5rem,2.6vw,3.125rem)]"
        >
          {(settings?.wallOfGratitude?.patrons?.length ? settings.wallOfGratitude.patrons : PATRONS).map((p, idx) => {
            return (
              <SwiperSlide key={p.name || idx} className="!h-auto">
                <figure className="flex h-full flex-col items-center rounded-lg border border-white/40 p-[clamp(1.25rem,1.66vw,2rem)] text-center">
                  <Star className="h-5 w-5 fill-white text-white" aria-hidden />
                  <figcaption className="mt-4 text-white text-[clamp(1rem,1.15vw,1.375rem)]">{p.name || t(`patrons.${idx}.name`)}</figcaption>
                  <span className="mx-auto mt-3 block h-px w-16 bg-white/40" />
                  <blockquote className="mt-3 leading-[1.6] text-white/85 text-[clamp(0.625rem,0.68vw,0.8125rem)]">
                    “{p.quote || t(`patrons.${idx}.quote`)}”
                  </blockquote>
                </figure>
              </SwiperSlide>
            )
          })}
        </Swiper>

        <div className="mt-[clamp(1.5rem,2.1vw,2.5rem)] flex items-center justify-center gap-2">
          {Array.from({ length: snap.count }).map((_, i) => {
            const on = snap.index === i;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to page ${i + 1}`}
                aria-current={on ? 'true' : undefined}
                // snapGrid is in pixels, so step by the group size and let
                // Swiper clamp the final page.
                onClick={() => sw?.slideTo(i * (Number(sw.params.slidesPerGroup) || 1))}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${on ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        .dn-patrons .swiper-slide { height: auto; }
      `}</style>
    </section>
  );
}
