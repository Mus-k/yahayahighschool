'use client';

import React, { useId, useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Link from 'next/link';

import { useTranslations, useLocale } from 'next-intl';

/**
 * Contact — enquiry form and the Campus Information panel.
 * Implemented from Figma node 384-1202 (contact page frame, 1920×2542).
 *
 * Design reference values (measured off the 1920 export):
 *   content block x384→1535 (1152, the same centred block the About cards use)
 *   form card 657 wide · 29 gutter · blue panel 466 wide, both from y493
 *   inputs 264 wide in the two-up rows, fill #EFF4FF · card padding 52
 *   map 1152×500 at y1165
 */

const SUBJECT_KEYS = [
  'admissions',
  'academic',
  'fees',
  'careers',
  'general',
];

import type { ContactInfo } from '@/types/cms.types';

const FIELD =
  'w-full h-[52px] rounded-lg bg-[#EFF4FF] px-4 text-[#121C2A] placeholder:text-[#9AA3AE] ' +
  'outline-none transition-shadow focus:ring-2 focus:ring-[#048ED6]/40 text-[clamp(0.8125rem,0.78vw,0.9375rem)]';
const LABEL = 'block mb-2 text-[#3F4941] text-[clamp(1rem,0.68vw,1.1rem)]';

export function ContactSection({ info }: { info?: ContactInfo }) {
  const id = useId();
  const t = useTranslations('contactPage');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');

  const addressLines = (info?.campusInfo?.address || t('campus.address1') + '\n' + t('campus.address2') + '\n' + t('campus.address3')).split('\n').filter(Boolean);
  const adminPhone = info?.campusInfo?.phone || '+971 4 123 4567';
  const whatsappPhone = info?.campusInfo?.whatsapp || info?.campusInfo?.phone || '+971 4 123 4567';
  const adminEmail = info?.campusInfo?.email || 'admissions@yahaya.edu';
  const officeHoursLines = (info?.campusInfo?.officeHours || t('campus.hours1') + '\n' + t('campus.hours2')).split('\n').filter(Boolean);

  const dynamicCampus = [
    {
      Icon: MapPin,
      key: 'mainCampus',
      title: info?.campusInfo?.addressLabel || 'Main Campus',
      lines: addressLines,
      url: info?.campusInfo?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${info?.campusInfo?.latitude || 6.3005},${info?.campusInfo?.longitude || -10.7969}`,
      isRaw: true,
    },
    { Icon: Phone, key: 'administration', title: info?.campusInfo?.phoneLabel || 'Administration', lines: [adminPhone], isRaw: true, url: `tel:${adminPhone.replace(/\s+/g, '')}` },
    { Icon: null, key: 'whatsapp', title: info?.campusInfo?.whatsappLabel || 'WhatsApp Us', lines: [whatsappPhone], isRaw: true, whatsapp: true, url: `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}` },
    { Icon: Mail, key: 'admissionsDesk', title: info?.campusInfo?.emailLabel || 'Admissions Desk', lines: [adminEmail], isRaw: true, url: `mailto:${adminEmail}` },
    {
      Icon: Clock,
      key: 'officeHours',
      title: info?.campusInfo?.officeHoursLabel || 'Office Hours',
      lines: officeHoursLines,
      url: '#',
      isRaw: true,
    },
  ];

  return (
    <section className="w-full bg-white">
      <style>{`
        .contact-phone .form-control {
          width: 100% !important;
          height: 52px !important;
          border-radius: 0.5rem !important;
          border: none !important;
          background-color: #EFF4FF !important;
          color: #121C2A !important;
          font-size: clamp(0.8125rem,0.78vw,0.9375rem) !important;
          padding-left: 3rem !important;
          font-family: inherit !important;
        }
        .contact-phone .form-control:focus {
          box-shadow: 0 0 0 2px rgba(4, 142, 214, 0.4) !important;
        }
        .contact-phone .flag-dropdown {
          border: none !important;
          background: transparent !important;
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        .contact-phone .flag-dropdown.open {
          background: transparent !important;
          border: none !important;
        }
        .contact-phone .flag-dropdown:hover, 
        .contact-phone .flag-dropdown:focus {
          background: transparent !important;
        }
        .contact-phone .selected-flag {
          background: transparent !important;
          width: 48px !important;
          padding: 0 0 0 16px !important;
        }
        .contact-phone .selected-flag:hover, 
        .contact-phone .selected-flag:focus {
          background: transparent !important;
        }
        .contact-phone .selected-flag .arrow {
          display: none !important;
        }
        .contact-phone .country-list {
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
        .contact-phone .country-list .search {
          padding: 10px !important;
          background-color: white !important;
        }
        .contact-phone .country-list .search-box {
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
        .contact-phone .country-list .search-box::placeholder {
          color: #8A939C !important;
        }
        .contact-phone .country-list .search-emoji,
        .contact-phone .country-list .search-icon {
          display: none !important;
        }
        .contact-phone .country-list .search-box:focus {
          border-color: #048ED6 !important;
        }
        .contact-phone .country-list .country {
          padding: 0.5rem 1rem !important;
        }
        .contact-phone .country-list .country-name {
          display: none !important;
        }
        .contact-phone .country-list .dial-code {
          color: #121C2A !important;
          margin-left: 0.5rem !important;
        }
        .contact-phone .country-list .country.highlight {
          background-color: #EAF5FD !important;
        }
        .contact-phone .country-list .country:hover {
          background-color: #F7FBFE !important;
        }
        .contact-phone .country-list .no-entries-message {
          color: #8A939C !important;
          padding: 0.5rem 1rem !important;
        }
        
        /* RTL overrides */
        html[dir="rtl"] .contact-phone .form-control {
          padding-left: 1rem !important;
          padding-right: 3rem !important;
          text-align: right !important;
        }
        html[dir="rtl"] .contact-phone .flag-dropdown {
          left: auto !important;
          right: 0 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        html[dir="rtl"] .contact-phone .selected-flag {
          padding: 0 16px 0 0 !important;
        }
      `}</style>
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.3rem,4.2vw,5rem)]">
        <div className="max-w-[1152px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,657fr)_minmax(0,466fr)] gap-[29px] items-stretch">

          {/* Enquiry form */}
          <div className="rounded-xl bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)] p-[clamp(1.5rem,2.7vw,3.25rem)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // NOT WIRED: there is no endpoint for this yet. Submitting only
                // flips local state — no message is sent anywhere. Point this at
                // the real handler (Strapi, a route handler, or a form service)
                // before the page goes live, or the form silently loses enquiries.
                setSent(true);
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[31px] gap-y-5">
                <div>
                  <label className={LABEL} htmlFor={`${id}-first`}>{info?.contactForm?.formFirstNameLabel || t('form.firstName')}</label>
                  <input id={`${id}-first`} name="firstName" className={FIELD} placeholder={info?.contactForm?.formFirstNamePlaceholder || t('form.firstNamePlaceholder')} required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-last`}>{info?.contactForm?.formLastNameLabel || t('form.lastName')}</label>
                  <input id={`${id}-last`} name="lastName" className={FIELD} placeholder={info?.contactForm?.formLastNamePlaceholder || t('form.lastNamePlaceholder')} required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-email`}>{info?.contactForm?.formEmailLabel || t('form.email')}</label>
                  <input id={`${id}-email`} name="email" type="email" className={FIELD} placeholder={info?.contactForm?.formEmailPlaceholder || t('form.emailPlaceholder')} dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }} required />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${id}-phone`}>{info?.contactForm?.formPhoneLabel || t('form.phone')}</label>
                  <PhoneInput
                    country={'lr'}
                    enableSearch={true}
                    value={phoneValue}
                    onChange={setPhoneValue}
                    inputProps={{
                      name: 'phone',
                      id: `${id}-phone`,
                      dir: 'ltr'
                    }}
                    containerClass="w-full contact-phone"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className={LABEL} htmlFor={`${id}-subject`}>{info?.contactForm?.formSubjectLabel || t('form.subject')}</label>
                <select id={`${id}-subject`} name="subject" className={`${FIELD} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239AA3AE%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat ltr:bg-[right_1rem_center] rtl:bg-[left_1rem_center] bg-[length:18px_18px] ltr:pr-12 rtl:pl-12`}>
                  {SUBJECT_KEYS.map((s) => <option key={s}>{t(`subjects.${s}`)}</option>)}
                </select>
              </div>

              <div className="mt-5">
                <label className={LABEL} htmlFor={`${id}-message`}>{info?.contactForm?.formMessageLabel || t('form.message')}</label>
                <textarea
                  id={`${id}-message`}
                  name="message"
                  rows={5}
                  className={`${FIELD} h-auto py-3 resize-y`}
                  placeholder={info?.contactForm?.formMessagePlaceholder || t('form.messagePlaceholder')}
                  required
                />
              </div>

              <div className="mt-[clamp(1.25rem,1.9vw,2.25rem)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <label className="flex items-start gap-3 cursor-pointer max-w-[280px]">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-[3px] w-4 h-4 shrink-0 accent-[#048ED6]"
                    required
                  />
                  <span className="leading-[1.5] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                    <Link href="?policy=terms" scroll={false} onClick={(e) => e.stopPropagation()} className="font-semibold text-[#121C2A] hover:underline hover:text-[#048ED6] transition-colors">{info?.contactForm?.formTermsLinkText || t('form.terms1')}</Link>{' '}
                    <span className="text-[#7A828C]">{info?.contactForm?.formTermsSuffix || t('form.terms2')}</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!accepted}
                  className="inline-flex items-center justify-center gap-3 h-[52px] px-7 shrink-0 rounded-full bg-[#048ED6] text-white font-medium transition-colors hover:bg-[#037ab8] disabled:opacity-40 disabled:hover:bg-[#048ED6] disabled:cursor-not-allowed text-[clamp(0.8125rem,0.78vw,0.9375rem)]"
                >
                  <span className="font-semibold text-white/95 tracking-wide text-[clamp(0.9375rem,1.02vw,1rem)] relative z-10 transition-transform group-hover:-translate-x-1 duration-300">
                    {info?.contactForm?.formSubmitButtonText || t('form.send')}
                  </span>
                  <Send className="w-4 h-4 rtl:-scale-x-100" />
                </button>
              </div>

              {sent && (
                <p role="status" className="mt-4 text-[#048ED6] text-[1rem]">
                  {t('form.success')}
                </p>
              )}
            </form>
          </div>

          {/* Campus information */}
          <div className="relative overflow-hidden rounded-xl bg-[#048ED6] text-white p-[clamp(1.5rem,2.3vw,2.75rem)]">
            {/* folded corner, top-right */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-6 w-[150px] h-[150px] rotate-45 bg-white/[0.07]"
            />

            <h2 className="relative font-serif leading-tight text-[clamp(1.5rem,1.77vw,2.125rem)]">
              {info?.campusInfo?.campusTitle || t('campus.title')}
            </h2>

            <ul className="relative mt-[clamp(1.5rem,2.1vw,2.5rem)] flex flex-col gap-[clamp(1.25rem,1.7vw,2rem)]">
              {dynamicCampus.map((item) => (
                <li key={item.key} className="w-full relative">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <div className="flex gap-4">
                      <span className="mt-[2px] shrink-0">
                        {'whatsapp' in item && item.whatsapp ? (
                          <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-[#25D366]" aria-hidden>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                          </svg>
                        ) : (
                          item.Icon && <item.Icon className="w-[19px] h-[19px] text-white/90" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="font-semibold text-[1rem]">{item.title}</p>
                        {item.lines.map((l) => (
                          <p key={l} className="text-white/85 leading-[1.55] text-[1rem]" dir={'isRaw' in item && item.isRaw ? 'ltr' : 'auto'}>
                            {'isRaw' in item && item.isRaw ? l : t(`campus.${l}`)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </a>
                </li>

              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactMap({ info }: { info?: ContactInfo }) {
  // Extract embed URL using logic from the old map component
  let embedUrl = "";
  const rawUrl = info?.campusInfo?.mapUrl?.trim();
  const lat = info?.campusInfo?.latitude ?? 6.3005;
  const lon = info?.campusInfo?.longitude ?? -10.7969;
  const zoomLevel = 15;

  if (rawUrl) {
    if (rawUrl.includes("google.com/maps/embed")) {
      embedUrl = rawUrl;
    } else if (rawUrl.includes("<iframe")) {
      // Extract the src attribute if the user pasted the entire HTML iframe tag
      const match = rawUrl.match(/src="([^"]+)"/);
      embedUrl = match ? match[1] : rawUrl;
    } else if (rawUrl.includes("google.com/maps") && rawUrl.includes("output=embed")) {
      embedUrl = rawUrl;
    } else {
      // Fallback for standard Google Maps URLs that are not directly embeddable
      embedUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=${zoomLevel}&output=embed`;
    }
  } else {
    embedUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=${zoomLevel}&output=embed`;
  }

  const directionsUrl = info?.campusInfo?.mapUrl?.trim() || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) pb-[clamp(2rem,4.2vw,5rem)]">
        <div 
          className="relative max-w-[1152px] mx-auto aspect-[1152/500] overflow-hidden rounded-xl border border-black/[0.06] bg-[#F7FBFE] bg-[url('/map-placeholder.jpg')] bg-cover bg-center"
        >
          {/* Floating 'Get Directions' button that doesn't block map interactivity */}
          <a 
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/95 text-[#048ED6] px-6 py-2.5 rounded-full font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-[#048ED6] hover:text-white transition-colors"
          >
            Get Directions
          </a>
          
          <iframe
            title="Yahaya International campus location"
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
