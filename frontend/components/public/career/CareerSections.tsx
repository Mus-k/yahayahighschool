'use client';

import React, { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight, CircleCheck, Clock, MapPin, Send, UploadCloud } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { STRAPI_URL } from '@/lib/constants';

import type { CareerPositionEntity, CustomPageEntity, CareerSettingEntity } from '@/types/cms.types';

/**
 * Career page. Implemented from Figma node 384-2082 (frame 1920×3424).
 *
 * Design reference values (measured off the 1920 export, half-scale sampling):
 *   hero photo y98→784, fading to white on the left · heading serif, 2nd line #048ED6
 *   job cards x384→1590 (1205 wide) — collapsed 96 tall, open 370, 24 gap
 *   application card 826×676 at x544/y1700, over a full-bleed photo
 *
 * Unlike Contact, this form's inputs are outlined rather than filled.
 */


export function CareerHero({ pageData, hasPositions = true }: { pageData?: CustomPageEntity | null, hasPositions?: boolean }) {
  const t = useTranslations('careerPage.hero');
  return (
    <section className="relative w-full bg-white overflow-hidden">
      {/* Photo occupies the right of the band and dissolves into the page on the left */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[82%]">
        <img
          src="/images/figma-home/15-news.jpeg"
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent lg:via-white/60 lg:to-transparent"
        />
      </div>

      <div className="relative max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(3rem,5.7vw,6.9rem)] min-h-[clamp(22rem,35.7vw,42.9rem)] flex items-center">
        <div className="max-w-[520px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 max-sm:gap-1 text-[clamp(1rem,0.73vw,1.1rem)]">
            <Link href="/" className="text-[#3F4941] lg:hover:text-[#048ED6] transition-colors">{t('breadcrumb.home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9AA3AE] rtl:-scale-x-100" aria-hidden />
            <Link href="/about" className="text-[#048ED6]">{t('breadcrumb.about')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9AA3AE] rtl:-scale-x-100" aria-hidden />
            <span className="text-[#048ED6]">{pageData?.breadcrumbTitle || t('breadcrumb.career')}</span>
          </nav>

          <h1 className="mt-[clamp(1rem,1.5vw,1.8rem)] font-serif text-[#121C2A] leading-[1.15]max-md:leading-relaxed text-[clamp(1.5rem,2.7vw,3.25rem)]">
            {pageData?.title ? (
              pageData.title.split('*').map((part, i) =>
                i % 2 === 1 ? (
                  <React.Fragment key={i}>
                    {i === 1 && <br className="max-md:hidden" />}
                    <span className="text-[#048ED6] max-md:pl-[1px]">{part}</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment key={i}>{part}</React.Fragment>
                )
              )
            ) : (
              <>
                {t('titleLine1')}
                <br className="max-md:hidden" />
                <span className="text-[#048ED6] max-md:pl-[1px]">{t('titleLine2')}</span>
              </>
            )}
          </h1>

          <p className="mt-[clamp(1rem,1.4vw,1.7rem)] md:max-w-[430px] text-[#3F4941] leading-[1.75] max-md:relaxed text-[1rem]">
            {pageData?.seo?.metaDescription || t('desc')}
          </p>

          {hasPositions && (
            <a
              href="#apply"
              className="mt-[clamp(1rem,2.1vw,2.5rem)] inline-flex items-center gap-3 h-[55px] max-sm:h-[45px] px-8 rounded-full bg-[#048ED6] text-white font-semibold tracking-[0.06em] transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
            >
              {pageData?.actionButtonText || t('applyNow')}
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CircleCheck className="w-4 h-4 mt-[3px] shrink-0 text-[#048ED6]" aria-hidden />
      <span className="text-[#3F4941] leading-[1.55] text-[clamp(0.8rem,0.68vw,1rem)]">
        {children}
      </span>
    </li>
  );
}

export function PositionsAccordion({ positions, careerSetting, onApply }: { positions?: CareerPositionEntity[]; careerSetting?: CareerSettingEntity | null; onApply?: (title: string) => void }) {
  const [open, setOpen] = useState<string | null>(positions?.[0]?.documentId || null);
  const t = useTranslations('careerPage.board');

  if (!positions || positions.length === 0) {
    return (
      <section id="apply" className="w-full bg-white">
        <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side) py-[clamp(1.5rem,4.2vw,5rem)]">
          <div className="max-w-[1205px] mx-auto text-center">
            <h2 className="font-serif text-[#121C2A] leading-[1.15] max-md:relaxed text-[clamp(1.5rem,1.87vw,2.25rem)]">
              {careerSetting?.boardTitle || t('title')}
            </h2>
            <p className="mt-8 text-[#5A636D] text-[1.1rem]">
              {careerSetting?.boardDescription || t('noPositions')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="apply" className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side) py-[clamp(1.5rem,4.2vw,5rem)]">
        <div className="max-w-[1205px] mx-auto">
        <div className='max-md:px-[20px] w-full relative max-sm:px-(--spacing-side)'>
            <h2 className="font-serif text-[#121C2A] leading-[1.15] max-md:relaxed  text-[clamp(1.5rem,1.87vw,2.25rem)]">
            {careerSetting?.boardTitle || t('title')}
          </h2>
          <p className="mt-2 text-[#3F4941] text-[1rem]">
            {careerSetting?.boardDescription || t('desc')}
          </p>

        </div>
          <div className="mt-[clamp(1.5rem,2.1vw,2.5rem)] flex flex-col gap-[24px]">
            {positions.map((p, i) => {
              const isOpen = open === p.documentId;
              const reqs = p.requirements || [];
              const resps = p.responsibilities || [];

              return (
                <article key={p.documentId || i} className="rounded-xl bg-[#F2F9FD] overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-sm:px-(--spacing-side) sm:px-[clamp(1.25rem,1.5vw,1.8rem)] py-[clamp(1.25rem,1.4vw,1.7rem)]">
                    <div>
                      <h3 className="font-serif text-[#121C2A] text-[clamp(1.2rem,1.25vw,1.5rem)]">
                        {p.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-x-6 gap-y-1 text-[#5A636D] text-[clamp(0.625rem,0.63vw,0.75rem)]">
                        <span className="inline-flex items-center gap-1.5 [&_p]:text-[1rem] [&_*]:text-nowrap">
                          <Clock className="w-3.5 h-3.5" aria-hidden /> <div>{p.type}</div>
                        </span>
                        {p.locationUrl ? (
                          <a href={p.locationUrl} target="_blank" rel="noopener noreferrer" className='w-full block relative'>
                            <span className="inline-flex items-center gap-1.5 lg:hover:text-(--color-primary) transition-colors duration-500">
                              <MapPin className="w-3.5 h-3.5" aria-hidden /> {p.location}
                            </span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" aria-hidden /> {p.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : (p.documentId || null))}
                        aria-expanded={isOpen}
                        aria-controls={`${p.documentId}-panel`}
                        className="inline-flex items-center gap-2 h-[42px] px-5 max-md:px-3 cursor-pointer rounded-full border border-[#9CCBEC] bg-white text-[#048ED6] transition-colors hover:bg-[#E6F0FB] text-[clamp(1rem,0.68vw,1.2rem)]"
                      >
                        {t('viewDetails')}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <a
                        href="#applyForm"
                        onClick={() => onApply?.(p.title)}
                        className="inline-flex items-center gap-2 h-[42px] px-5 max-md:px-3 rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.875rem,0.68vw,0.9rem)]"
                      >
                        {t('applyNow')}
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                      </a>
                    </div>
                  </div>

                  {/* grid-rows 0fr→1fr animates height without hardcoding one */}
                  <div
                    id={`${p.documentId}-panel`}
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[clamp(2rem,4vw,4.8rem)] gap-y-8 max-sm:px-(--spacing-side) sm:px-[clamp(1.25rem,1.5vw,1.8rem)] pb-[clamp(1.5rem,2.1vw,2.5rem)]">
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-[#048ED6] text-[clamp(1rem,0.78vw,1.2rem)]">
                            <CircleCheck className="w-4 h-4" aria-hidden />
                            {t('requirements')}
                          </h4>
                          <ul className="mt-4 flex flex-col gap-3">
                            {reqs.map((r) => <Bullet key={r.id || r.value}>{r.value}</Bullet>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-[#048ED6] text-[clamp(0.8rem,0.78vw,0.95rem)]">
                            <CircleCheck className="w-4 h-4" aria-hidden />
                            {t('responsibilities')}
                          </h4>
                          <ul className="mt-4 flex flex-col gap-3 [&_p]:text-[16px]">
                            {resps.map((r) => <Bullet key={r.id || r.value}>{r.value}</Bullet>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const OUTLINED =
  'w-full h-[52px] rounded-lg border border-[#9CCBEC] bg-white px-4 text-[#121C2A] ' +
  'placeholder:text-[#9AA3AE] outline-none transition-shadow focus:ring-2 focus:ring-[#048ED6]/40 ' +
  'text-[clamp(0.8125rem,0.78vw,0.9375rem)]';

export function ApplicationForm({
  positions,
  careerSetting,
  role,
  onRoleChange,
}: {
  positions?: CareerPositionEntity[];
  careerSetting?: CareerSettingEntity | null;
  role?: string;
  onRoleChange?: (title: string) => void;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTranslations('careerPage.form');

  const take = (files: FileList | null) => {
    if (files && files[0]) setFileName(files[0].name);
  };

  return (
    <section id="applyForm" className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        {careerSetting?.formBackgroundImage?.url ? (
          <img src={careerSetting.formBackgroundImage.url.startsWith('http') ? careerSetting.formBackgroundImage.url : `${STRAPI_URL}${careerSetting.formBackgroundImage.url}`} alt="" aria-hidden className="w-full h-full object-cover" />
        ) : (
          <img src="/images/figma-home/03-programs.jpeg" alt="" aria-hidden className="w-full h-full object-cover" />
        )}
        <span aria-hidden className="absolute inset-0 bg-white/55" />
      </div>

      <div className="relative max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(2.5rem,5.3vw,6.4rem)]">
        <div className="max-w-[826px] mx-auto rounded-2xl bg-white shadow-[0_10px_40px_rgba(16,24,40,0.10)] p-[clamp(1.5rem,2.6vw,3.125rem)]">
          <h2 className="font-sans text-[#121C2A] leading-tight text-[clamp(1.375rem,1.77vw,2.125rem)]">
            {careerSetting?.formTitle || t('title')}
          </h2>

          <form
            className="mt-[clamp(1.25rem,1.9vw,2.25rem)]"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sr-only" htmlFor={`${id}-name`}>{careerSetting?.formFullNameLabel || t('fullName')}</label>
                <input id={`${id}-name`} name="fullName" className={OUTLINED} placeholder={careerSetting?.formFullNamePlaceholder || t('fullName')} required />
              </div>
              <div>
                <label className="sr-only" htmlFor={`${id}-email`}>{careerSetting?.formEmailLabel || t('email')}</label>
                <input id={`${id}-email`} name="email" type="email" className={OUTLINED} placeholder={careerSetting?.formEmailPlaceholder || t('email')} required />
              </div>
              <div>
                <label className="sr-only" htmlFor={`${id}-phone`}>{careerSetting?.formPhoneLabel || t('phone')}</label>
                <input id={`${id}-phone`} name="phone" type="tel" className={OUTLINED} placeholder={careerSetting?.formPhonePlaceholder || t('phone')} />
              </div>
              <div>
                <label className="sr-only" htmlFor={`${id}-role`}>{t('position')}</label>
                <select
                  id={`${id}-role`}
                  name="position"
                  value={role ?? positions?.[0]?.title ?? ''}
                  onChange={(e) => onRoleChange?.(e.target.value)}
                  className={`${OUTLINED} appearance-none pr-10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23048ED6%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_1rem_center] bg-[length:18px_18px]`}>
                  {positions?.map((p) => <option key={p.documentId}>{p.title}</option>)}
                </select>
              </div>
            </div>

            {/* CV dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files); }}
              className={`mt-4 rounded-lg border border-dashed px-4 py-[clamp(1.5rem,2.1vw,2.5rem)] text-center transition-colors ${
                dragging ? 'border-[#048ED6] bg-[#F2F9FD]' : 'border-[#C7D0DA] bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 w-full cursor-pointer"
              >
                <UploadCloud className="w-6 h-6 text-[#048ED6]" aria-hidden />
                <span className="font-semibold text-[#121C2A] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                  {fileName ?? (careerSetting?.formUploadInstruction || t('upload'))}
                </span>
                <span className="text-[#9AA3AE] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
                  {careerSetting?.formUploadRequirements || t('uploadDesc')}
                </span>
              </button>
              <input
                ref={fileRef}
                id={`${id}-cv`}
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(e) => take(e.target.files)}
              />
            </div>

            <div className="mt-[clamp(1.25rem,1.7vw,2rem)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="w-4 h-4 shrink-0 accent-[#048ED6]"
                  required
                />
                <span className="text-[#3F4941] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                  {careerSetting?.formTermsPrefix || t('acceptTerms')} <Link href="?policy=terms" scroll={false} onClick={(e) => e.stopPropagation()} className="text-[#048ED6] underline">{careerSetting?.formTermsLinkText || t('legalTerms')}</Link>.
                </span>
              </label>

              <button
                type="submit"
                disabled={!accepted}
                className="inline-flex items-center justify-center gap-3 h-[48px] px-7 shrink-0 rounded-full bg-[#048ED6] text-white font-medium transition-colors hover:bg-[#037ab8] disabled:opacity-40 disabled:hover:bg-[#048ED6] disabled:cursor-not-allowed text-[clamp(0.75rem,0.73vw,0.875rem)]"
              >
                {careerSetting?.formSubmitButtonText || t('sendMessage')}
                <Send className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            </div>

            {sent && (
              <p role="status" className="mt-4 text-[#048ED6] text-[1rem]">
                {t('success')}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/**
 * Ties the two together: clicking "Apply Now" on a position preselects it in
 * the form below. The state has to live above both, and the page is a server
 * component, so this client wrapper owns it.
 */
export function CareerBoard({ positions, careerSetting }: { positions?: CareerPositionEntity[], careerSetting?: CareerSettingEntity | null }) {
  const [role, setRole] = useState<string>(positions?.[0]?.title || '');
  return (
    <>
      <PositionsAccordion positions={positions} careerSetting={careerSetting} onApply={setRole} />
      {positions && positions.length > 0 && (
        <ApplicationForm positions={positions} careerSetting={careerSetting} role={role} onRoleChange={setRole} />
      )}
    </>
  );
}
