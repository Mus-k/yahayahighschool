'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { FooterConfig } from '../../types/cms.types';
import { SOCIALS } from './shared/socials';
import { getStrapiMediaUrl } from '@/services/cms.service';

/**
 * Site footer.
 * Implemented from Figma node 549-744 (measured off the footer of the 1920-wide
 * page exports, since there is no standalone footer frame in pages-png).
 *
 * Design reference values (at the 1920 frame):
 *   brand #048ED6 · ink #111C2D · strip border #BCD5EE
 *   contact strip 1710×129 with the 104px crest straddling its top edge
 *   heading 48 · eyebrow 15 · link 15 (36 pitch) · pill h38 · bottom bar h79
 *   link columns at x 1108 / 1346 / 1605 — a 248px pitch
 */

const LINK_COLUMNS = [
  {
    key: 'quickLinks',
    icon: 'icon-education',
    links: [
      { key: 'aboutUs', href: '/about' },
      { key: 'academicPrograms', href: '/programs' },
      { key: 'newsEvents', href: '/news' },
      { key: 'gallery', href: '/gallery' },
      { key: 'careers', href: '/career' },
      { key: 'contact', href: '/contact' },
    ],
  },
  {
    key: 'academics',
    icon: 'icon-education',
    links: [
      { key: 'quranDepartment', href: '/programs' },
      { key: 'arabicLanguage', href: '/programs' },
      { key: 'englishDepartment', href: '/programs' },
      { key: 'onlineLearning', href: '/online-learning' },
      { key: 'studentLife', href: '/gallery' },
    ],
  },
  {
    key: 'support',
    icon: 'icon-linking',
    links: [
      { key: 'faqs', href: '/faq' },
      { key: 'helpCenter', href: '/contact' },
    ],
  },
];

const DEFAULT_LINK_LABELS: Record<string, string> = {
  aboutUs: 'About Us',
  academicPrograms: 'Academic Programs',
  newsEvents: 'News & Events',
  gallery: 'Gallery',
  careers: 'Careers',
  contact: 'Contact',
  quranDepartment: 'Quran Department',
  arabicLanguage: 'Arabic Language',
  englishDepartment: 'English Department',
  onlineLearning: 'Online Learning',
  studentLife: 'Student Life',
  faqs: 'FAQs',
  helpCenter: 'Help Center',
  // Backward compatibility in case CMS or legacy props provide string keys
  'Quran Department': 'Quran Department',
  'Arabic Language': 'Arabic Language',
  'English Department': 'English Department',
  'Online Learning': 'Online Learning',
  'Student Life': 'Student Life',
};

const PILLS = [
  { key: 'islamicEducation', href: '#' },
  { key: 'modernLearning', href: '#' },
  { key: 'brightFuture', href: '#' },
];

type LinkItem = { key: string; href: string; label?: string };
type ColType = { key: string; title?: string; links: LinkItem[] };

function getSafeTranslation(t: any, key: string, fallback: string): string {
  try {
    if (typeof t === 'function') {
      if (t.has && typeof t.has === 'function') {
        return t.has(key) ? t(key) : fallback;
      }
      const val = t(key);
      return val || fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function FooterAccordion({ col, open, onToggle }: { col: ColType; open: boolean; onToggle: () => void }) {
  const t = useTranslations('footer.links');

  const getLinkLabel = (l: LinkItem) => {
    if (l.label) return l.label;
    const fullKey = `${col.key}.${l.key}`;
    return t.has(fullKey) ? t(fullKey) : l.key;
  };

  const colTitle = col.title || (t.has(`${col.key}.title`) ? t(`${col.key}.title`) : col.key);

  return (
    <div className="sm:contents">
      {/* Mobile: accordion trigger (hidden on sm+) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="sm:hidden w-full flex items-center justify-between py-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-[#111C2D] text-[0.9375rem]">
          {colTitle}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#048ED6] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {/* Mobile: collapsible list via grid row trick */}
      <div
        className={`sm:hidden grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
        }`}
      >
        <ul className="overflow-hidden flex flex-col gap-2">
          {col.links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="text-[#545F73] text-[0.9375rem] transition-colors md:hover:text-[#048ED6]"
              >
                {getLinkLabel(l)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop: plain visible block (hidden on max-sm) */}
      <div className="hidden sm:block">
        <h3 className="flex items-center gap-2 font-semibold text-[#111C2D] text-[clamp(0.9375rem,0.83vw,1rem)]">
          {colTitle}
        </h3>
        <ul className="mt-[clamp(1.25rem,1.6vw,1.9rem)] flex flex-col gap-[clamp(0.9rem,1.16vw,1rem)]">
          {col.links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="text-[#545F73] text-[clamp(0.875rem,0.78vw,0.9375rem)] transition-colors md:hover:text-[#048ED6]"
              >
                {getLinkLabel(l)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Footer({
  locale: propLocale,
  config,
  contactInfo,
}: {
  config?: FooterConfig | null;
  locale?: string;
  contactInfo?: any;
}) {
  const t = useTranslations('footer');
  const activeLocale = useLocale();
  const locale = propLocale || activeLocale || 'en';
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const formattedYear = new Intl.NumberFormat(locale, { useGrouping: false }).format(currentYear);

  const logoUrl = config?.logo ? (getStrapiMediaUrl(config.logo) || '/headerlogo.png') : '/headerlogo.png';
  const email = config?.email || 'Yahayahighschool@Gmail.Com';
  const phone = config?.phone || '+23188368801';
  const brandName = config?.brandName || getSafeTranslation(t, 'brand.name', 'Yahaya International Islamic and English High School');
  const brandTagline1 = config?.brandTagline1 || getSafeTranslation(t, 'brand.tagline1', 'Knowledge Faith &');
  const brandTagline2 = config?.brandTagline2 || getSafeTranslation(t, 'brand.tagline2', 'Excellence');
  const brandDescription = config?.brandDescription || getSafeTranslation(t, 'brand.description', 'Building a brighter future through Islamic values, quality education and character development');
  const termsLabel = config?.termsLabel || getSafeTranslation(t, 'bottom.terms', 'Terms of Service');
  const privacyUrl = config?.privacyUrl || '/privacy';
  const privacyLabel = config?.privacyLabel || getSafeTranslation(t, 'bottom.privacy', 'Privacy Policy');
  const socialsLabel = config?.socialsLabel || getSafeTranslation(t, 'contact.socials', 'Follow us on Social Media');
  const emailLabel = config?.emailLabel || getSafeTranslation(t, 'contact.email', 'Email');
  const phoneLabel = config?.phoneLabel || getSafeTranslation(t, 'contact.phone', 'Phone');

  const socialLinksData = contactInfo?.socialMedia?.length ? contactInfo.socialMedia : config?.socialLinks;

  const socialLinks = socialLinksData?.length
    ? socialLinksData.map((s: any) => {
        let iconClass = 'icon-link';
        const iconName = s.icon || s.title;
        if (iconName) {
          iconClass = iconName.startsWith('icon-') ? iconName.toLowerCase() : `icon-${iconName.toLowerCase()}`;
        }
        return { name: s.title, href: s.url, icon: iconClass };
      })
    : SOCIALS.map((s) => ({ name: s.name, href: s.href, icon: `icon-${s.name.toLowerCase()}` }));

  const pills = config?.pills?.length
    ? config.pills.map((p) => {
        return {
          key: p.id?.toString() || p.title,
          label: p.title,
          href: p.url || '#',
        };
      })
    : PILLS.map((p) => {
        const fallback =
          p.key === 'islamicEducation'
            ? 'Islamic Education'
            : p.key === 'modernLearning'
            ? 'Modern Learning'
            : p.key === 'brightFuture'
            ? 'Bright Future'
            : p.key;
        return {
          key: p.key,
          label: getSafeTranslation(t, `pills.${p.key}`, fallback),
          href: p.href,
        };
      });

  const columns: ColType[] = [
    {
      key: 'quickLinks',
      title: config?.quickLinksTitle || getSafeTranslation(t, 'links.quickLinks.title', 'Quick Links'),
      links: config?.quickLinks?.length
        ? config.quickLinks.map((l) => ({ key: l.id?.toString() || l.title, label: l.title, href: l.url }))
        : LINK_COLUMNS[0].links,
    },
    {
      key: 'academics',
      title: config?.academicsTitle || getSafeTranslation(t, 'links.academics.title', 'Academics'),
      links: config?.academicsLinks?.length
        ? config.academicsLinks.map((l) => ({ key: l.id?.toString() || l.title, label: l.title, href: l.url }))
        : LINK_COLUMNS[1].links,
    },
    {
      key: 'support',
      title: config?.supportTitle || getSafeTranslation(t, 'links.support.title', 'Support'),
      links: config?.supportLinks?.length
        ? config.supportLinks.map((l) => ({ key: l.id?.toString() || l.title, label: l.title, href: l.url }))
        : LINK_COLUMNS[2].links,
    },
  ];

  let copyrightText = config?.copyrightText;
  if (!copyrightText) {
    try {
      if (t.has && t.has('bottom.copyright')) {
        copyrightText = t('bottom.copyright', { year: formattedYear });
      } else {
        copyrightText = `© ${formattedYear} Yahaya International Islamic and English School. All rights reserved.`;
      }
    } catch {
      copyrightText = `© ${formattedYear} Yahaya International Islamic and English School. All rights reserved.`;
    }
  }

  return (
    <footer className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side)">
        {/* ── Contact strip, crest straddling its top edge ─────────── */}
        <div className="relative pt-[52px] max-sm:pt-[80px] max-xs:pt-[100px]">
          <span
            style={{ fill: '#FFF', filter: 'drop-shadow(0 2px 2px rgba(15, 108, 189, 0.20))' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 md:w-[184px] md:h-[184px] w-[140px] h-[140px] rounded-full bg-white grid place-items-center overflow-hidden"
          >
            <div className="relative w-full h-full flex justify-center items-center">
              <Image
                src={logoUrl}
                alt={brandName}
                width={78}
                height={78}
                className="object-contain w-full h-full max-h-[150px] max-w-[100px]"
              />
            </div>
          </span>

          <div className="relative rounded-2xl overflow-hidden bg-linear-to-r from-(--color-primary) sm:via-white to-(--color-primary)">
            {/* Social */}
            <div className="relative rounded-2xl bg-white m-[1px] px-[clamp(1.25rem,2.1vw,2.5rem)] py-[31px] max-lg:pt-[66px] flex flex-col lg:flex-row lg:items-center justify-between gap-8 max-md:gap-5">
              <div className="flex flex-col gap-[14px]">
                <span className="text-[13px] text-[#6B7280]">{socialsLabel}</span>
                <div className="flex items-center gap-[20px]">
                  {socialLinks.map((s: any) => (
                    <a
                      key={s.name}
                      href={s.href}
                      aria-label={s.name}
                      className="w-[30px] h-[30px] grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6] transition-colors hover:bg-[#048ED6] md:hover:text-white"
                    >
                      <i className={`${s.icon} text-[15px] flex justify-center items-center`} aria-hidden />
                    </a>
                  ))}
                </div>
              </div>

              {/* Email / phone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-0">
                <a href={`mailto:${email}`} className="text-[15px] block text-[#111C2D] transition-colors">
                  <div className="flex flex-col gap-[10px] sm:pe-[46px]">
                    <span className="text-[13px] text-[#6B7280]">{emailLabel}</span>
                    <span className="flex items-center gap-3">
                      <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
                        <i className="icon-mail text-[15px] flex justify-center items-center" />
                      </span>
                      <p className="text-[15px] text-[#111C2D] md:hover:text-[#048ED6] transition-colors">
                        {email}
                      </p>
                    </span>
                  </div>
                </a>

                <span className="hidden sm:block w-px self-stretch bg-[#BCD5EE]" />
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="text-[15px] text-[#111C2D] md:hover:text-[#048ED6] transition-colors"
                >
                  <div className="flex flex-col gap-[10px] sm:ps-[46px]">
                    <span className="text-[13px] text-[#6B7280]">{phoneLabel}</span>
                    <span className="flex items-center gap-3">
                      <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
                        <i className="icon-whatsapp text-[15px] flex justify-center items-center" />
                      </span>
                      <p className="text-[15px] block text-[#111C2D] md:hover:text-[#048ED6] transition-colors" dir="ltr">
                        {phone}
                      </p>
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Brand block + link columns ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-x-[clamp(2rem,5vw,6rem)] gap-y-12 pt-[clamp(1.5rem,4.8vw,5.8rem)] pb-[clamp(1.5rem,4.5vw,5.5rem)]">
          <div>
            <p className="text-[#048ED6] font-semibold uppercase tracking-[0.02em] text-[1rem]">
              {brandName}
            </p>

            <h2 className="mt-[clamp(1.25rem,1.7vw,2.05rem)] font-bold text-[#111C2D] tracking-[-0.015em] leading-[1.1] text-[clamp(1.75rem,2.5vw,3rem)]">
              {brandTagline1}{' '}
              <span className="relative inline-block text-[#048ED6]">
                {brandTagline2}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 195 9"
                  fill="none"
                  className="absolute left-0 -bottom-[6px] w-full"
                  aria-hidden
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0.078125 8.5C0.078125 8.5 54.1334 -0.127191 94.4565 0.53641C131.155 1.14037 194.078 8.5 194.078 8.5"
                    stroke="url(#footer-excellence-gradient)"
                  />
                  <defs>
                    <linearGradient
                      id="footer-excellence-gradient"
                      x1="97.0781"
                      y1="-8.43934"
                      x2="97.0781"
                      y2="8.50112"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#005396" />
                      <stop offset="0.5" stopColor="#046ED6" />
                      <stop offset="1" stopColor="white" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>

            <p className="mt-[clamp(1rem,1.2vw,1.45rem)] max-w-[460px] text-[#545F73] leading-[1.6] text-[1rem]">
              {brandDescription}
            </p>

            <div className="mt-[clamp(1.75rem,2.4vw,2.9rem)] flex flex-wrap gap-[14px] max-w-[400px]">
              {pills.map((p) => (
                <Link
                  href={p.href}
                  key={p.key}
                  className="inline-flex items-center gap-2 h-[38px] px-4 rounded-full bg-[#048ED6] text-white font-medium text-[13px] transition-colors hover:bg-[#005396]"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-[clamp(1.5rem,5.6vw,6.75rem)] gap-y-10 max-sm:grid-cols-1 max-sm:gap-y-0 max-sm:divide-y max-sm:divide-[#E8EEF5]">
            {columns.map((col) => (
              <FooterAccordion
                key={col.key}
                col={col}
                open={activeAccordion === col.key}
                onToggle={() => setActiveAccordion(activeAccordion === col.key ? null : col.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────── */}
      <div className="bg-[#048ED6] text-white">
        <div className="max-w-[1920px] max-sm:[&_p]:text-center mx-auto px-(--spacing-side) min-h-[79px] py-4 flex flex-col sm:flex-row items-center justify-between max-sm:justify-center gap-3 text-[clamp(0.8125rem,0.73vw,0.875rem)]">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-8">
            <Link href="?policy=terms" scroll={false} className="transition-opacity hover:opacity-80">
              {termsLabel}
            </Link>
            <Link href={privacyUrl} className="transition-opacity hover:opacity-80">
              {privacyLabel}
            </Link>
          </div>
          <div className="flex items-center gap-2 max-xs:gap-1">
            <span className="text-[clamp(1rem,0.73vw,1.175rem)] text-white">Done</span>
            <a
              href="https://github.com/Mus-k"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80 font-medium text-[clamp(0.8125rem,0.73vw,0.875rem)] text-white relative before:absolute before:bottom-0 before:left-0 before:w-0 lg:hover:before:w-full before:ease-out before:duration-300 before:h-px before:bg-white max-md:before:hidden"
            >
              Musah
            </a>{' '}
            &{' '}
            <a
              href="https://github.com/Hakromah"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80 font-medium text-[clamp(0.8125rem,0.73vw,0.875rem)] text-white relative before:absolute before:bottom-0 before:left-0 before:w-0 lg:hover:before:w-full before:ease-out before:duration-300 before:h-px before:bg-white max-md:before:hidden"
            >
              Hassan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
