'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, X, UploadCloud, FileCheck, Receipt } from 'lucide-react';
import { useLenis } from 'lenis/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import type { OnlineCourseEntity, OnlineLearningPageEntity } from '@/types/cms.types';

// We only define length here; actual titles come from onlineLearningPage namespace
const COURSES = Array.from({ length: 6 });
const CURRENCIES = ['usd', 'eur', 'gbp', 'lrd'];

type Tab = 'pay' | 'paid';

export function EnrollmentModal({
  open,
  onClose,
  initialTab = 'pay',
  selectedCourse = '',
  courses = [],
  defaultAmount = 500,
  currencies,
  note,
  pageData,
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
  selectedCourse?: string;
  courses?: OnlineCourseEntity[];
  defaultAmount?: number;
  currencies?: string[];
  note?: string;
  pageData?: OnlineLearningPageEntity | null;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sent, setSent] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [currentCourse, setCurrentCourse] = useState(selectedCourse);
  const [topicValue, setTopicValue] = useState('');
  const [amountValue, setAmountValue] = useState(String(defaultAmount));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const t = useTranslations('enrollmentModal');
  const tOnline = useTranslations('onlineLearningPage');
  const tContact = useTranslations('contactPage');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [accepted, setAccepted] = useState(false);
  const [acceptedPay, setAcceptedPay] = useState(false);

  // Dynamic variables with fallback to i18n translations
  const tabPayOnline = pageData?.popupTabPayOnline || t('payOnline');
  const tabAlreadyPaid = pageData?.popupTabAlreadyPaid || t('alreadyPaid');
  const payOnlineTitle = pageData?.popupPayOnlineTitle || pageData?.popupTitle || t('payOnline');
  const alreadyPaidTitle = pageData?.popupAlreadyPaidTitle || t('enrollNow');

  const nameLabel = pageData?.popupNameLabel || `${t('firstName')} & ${t('lastName')}`;
  const namePlaceholder = pageData?.popupNamePlaceholder || t('placeholders.name');
  const emailLabel = pageData?.popupEmailLabel || t('email');
  const emailPlaceholder = pageData?.popupEmailPlaceholder || t('placeholders.email');
  const phoneLabel = pageData?.popupPhoneLabel || t('phone');
  const selectCourseLabel = pageData?.popupSelectCourseLabel || t('selectCourse');
  const selectAmountLabel = pageData?.popupSelectAmountLabel || t('selectAmount');
  const selectCurrencyLabel = pageData?.popupSelectCurrencyLabel || t('selectCurrency');
  const checkoutButtonText = pageData?.popupCheckoutButtonText || t('checkout');
  const securePaymentNote = pageData?.popupNote || note || t('securePayment');

  const countryPlaceholder = pageData?.popupCountryPlaceholder || t('country');
  const topicPlaceholder = pageData?.popupTopicPlaceholder || t('inquiryTopic');
  const messagePlaceholder = pageData?.popupMessagePlaceholder || t('message');
  const receiptLabel = pageData?.popupReceiptLabel || t('uploadReceipt');
  const receiptHint = pageData?.popupReceiptHint || t('uploadReceiptHint');
  const termsLinkText = pageData?.popupTermsLinkText || tContact('form.terms1');
  const termsSuffix = pageData?.popupTermsSuffix || tContact('form.terms2');
  const sendMessageButtonText = pageData?.popupSendMessageButtonText || t('sendMessage');

  // Same scroll lock the mobile menu and the media lightbox use; Lenis owns
  // scrolling, so overflow:hidden alone would not hold, but we need both.
  useEffect(() => {
    if (open) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [open, lenis]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSent(false);
      setReceiptFile(null);
      setIsDragging(false);
      const chosen = selectedCourse || (courses && courses.length > 0 ? courses[0].title : '');
      setCurrentCourse(chosen);
      setTopicValue(chosen);
      const matched = courses?.find(c => c.title === chosen);
      if (matched && matched.price) {
        setAmountValue(String(matched.price));
      } else if (defaultAmount) {
        setAmountValue(String(defaultAmount));
      }
    }
  }, [open, initialTab, selectedCourse, courses, defaultAmount]);

  const handleCourseChange = (courseTitle: string) => {
    setCurrentCourse(courseTitle);
    const matched = courses?.find(c => c.title === courseTitle);
    if (matched && matched.price) {
      setAmountValue(String(matched.price));
    }
  };

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return handleClose();
      if (e.key !== 'Tab') return;
      const root = closeRef.current?.closest('[role="dialog"]');
      if (!root) return;
      const items = [
        ...root.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreTo.current?.focus?.();
    };
  }, [open, handleClose]);

  if (!open) return null;

  const field =
    'h-[clamp(2.75rem,3.1vw,3.375rem)] w-full rounded-lg border border-[#D6E9F6] bg-[#F7FBFE] px-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#8A939C] focus-visible:border-[#048ED6] text-[clamp(0.8125rem,0.83vw,1rem)]';
  const selectField =
    `${field} custom-select truncate`;
  const label =
    'block font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)]';

  return (
    <div data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Enrollment"
      onClick={handleClose}
      className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-black/50 p-[clamp(1rem,3vw,2.5rem)] backdrop-blur-sm"
    >
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
          height: clamp(2.75rem, 3.1vw, 3.375rem) !important;
          border-radius: 0.5rem !important;
          border: 1px solid #D6E9F6 !important;
          background-color: #F7FBFE !important;
          color: #121C2A !important;
          font-size: clamp(0.8125rem, 0.83vw, 1rem) !important;
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
        .react-tel-input .selected-flag:hover, 
        .react-tel-input .selected-flag:focus {
          background: transparent !important;
        }
        .react-tel-input .selected-flag .arrow {
          display: none !important; /* Hide the small arrow for a cleaner look */
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

        /* RTL overrides */
        html[dir="rtl"] .react-tel-input .form-control {
          padding-left: 1rem !important;
          padding-right: 3rem !important;
          text-align: right !important;
        }
        html[dir="rtl"] .react-tel-input .flag-dropdown {
          left: auto !important;
          right: 0 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        html[dir="rtl"] .react-tel-input .selected-flag {
          padding: 0 16px 0 0 !important;
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[49.3125rem] rounded-xl bg-white p-[clamp(1.25rem,2vw,2.4rem)] shadow-2xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 cursor-pointer top-4 grid h-8 w-8 place-items-center rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div role="tablist" aria-label="Enrollment options" className="flex items-center justify-center gap-3">
          {[
            { id: 'pay' as const, text: tabPayOnline },
            { id: 'paid' as const, text: tabAlreadyPaid },
          ].map(({ id, text }) => {
            const on = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={`h-[clamp(2.25rem,2.3vw,2.75rem)] cursor-pointer rounded-full border px-[clamp(1rem,1.35vw,1.625rem)] font-semibold transition-colors text-[clamp(0.75rem,0.78vw,0.9375rem)] ${
                  on
                    ? 'border-[#048ED6] bg-[#048ED6] text-white'
                    : 'border-[#048ED6] bg-white text-[#048ED6] hover:bg-[#EAF5FD]'
                }`}
              >
                {text}
              </button>
            );
          })}
        </div>

        {/* 579 inner width, 1px brand border in the design */}
        <div className="mx-auto mt-[clamp(1.25rem,2vw,2.4rem)] max-w-[36.1875rem] rounded-xl border border-[#048ED6] p-[clamp(1rem,1.66vw,2rem)]">
          {tab === 'pay' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Integration point: hand off to the payment provider here.
                // Nothing is charged and no confirmation is shown, because
                // claiming a completed payment would be a lie.
              }}
            >
              <p className="grid h-[clamp(2.5rem,2.3vw,2.75rem)] place-items-center rounded-lg bg-[#048ED6] font-semibold text-white text-[1rem]">
                {payOnlineTitle}
              </p>

              <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-1 gap-[clamp(1rem,1.5vw,1.75rem)] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="enr-name" className={label}>{nameLabel}</label>
                  <input id="enr-name" name="name" required placeholder={namePlaceholder} className={`${field} mt-2`} />
                </div>
                
                <div>
                  <label htmlFor="enr-email" className={label}>{emailLabel}</label>
                  <input id="enr-email" name="email" type="email" required placeholder={emailPlaceholder} dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }} className={`${field} mt-2`} />
                </div>

                <div>
                  <label htmlFor="enr-phone" className={label}>{phoneLabel}</label>
                  <PhoneInput
                    country={'lr'}
                    enableSearch={true}
                    value={phoneValue}
                    onChange={setPhoneValue}
                    inputProps={{
                      name: 'phone',
                      id: 'enr-phone',
                      dir: 'ltr'
                    }}
                    containerClass="w-full mt-2"
                  />
                </div>
              </div>

              <div className="mt-[clamp(1rem,1.66vw,2rem)]">
                <label htmlFor="enr-course" className={label}>{selectCourseLabel}</label>
                <select
                  id="enr-course"
                  name="course"
                  className={`${selectField} mt-2`}
                  value={currentCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  {courses && courses.length > 0
                    ? courses.map((c) => (
                        <option key={c.id || c.title} value={c.title}>
                          {c.title}
                        </option>
                      ))
                    : COURSES.map((_, i) => (
                        <option key={i} value={tOnline(`coursesList.${i}.title`)}>
                          {tOnline(`coursesList.${i}.title`)}
                        </option>
                      ))}
                </select>
              </div>

              <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
                <div>
                  <label htmlFor="enr-amount" className={label}>{selectAmountLabel}</label>
                  <input
                    id="enr-amount"
                    name="amount"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    inputMode="decimal"
                    className={`${field} mt-2`}
                  />
                </div>
                <div>
                  <label htmlFor="enr-currency" className={label}>{selectCurrencyLabel}</label>
                  <select id="enr-currency" name="currency" className={`${selectField} mt-2`}>
                    {(currencies && currencies.length > 0 ? currencies : CURRENCIES).map((c) => (
                      <option key={c} value={c.toUpperCase()}>
                        {c.toUpperCase()} - {t(`currencies.${c.toLowerCase()}`) || c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mt-[clamp(1rem,1.25vw,1.5rem)] flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPay}
                  onChange={(e) => setAcceptedPay(e.target.checked)}
                  className="mt-[3px] w-4 h-4 shrink-0 accent-[#048ED6]"
                  required
                />
                <span className="leading-[1.5] text-[clamp(0.6875rem,0.68vw,0.8125rem)] text-start">
                  <Link href="?policy=terms" scroll={false} onClick={(e) => e.stopPropagation()} className="font-semibold text-[#121C2A] hover:underline hover:text-[#048ED6] transition-colors">{termsLinkText}</Link>{' '}
                  <span className="text-[#7A828C]">{termsSuffix}</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={!acceptedPay}
                className="mt-[clamp(1.25rem,2vw,2.4rem)] cursor-pointer flex h-[clamp(2.75rem,3.1vw,3.75rem)] w-full items-center justify-center gap-2 rounded-lg bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] disabled:opacity-40 disabled:hover:bg-[#048ED6] disabled:cursor-not-allowed text-[clamp(0.875rem,0.94vw,1.125rem)]"
              >
                <CreditCard className="h-4 w-4" />
                {checkoutButtonText}
              </button>

              <p className="mt-3 text-center text-[#8A939C] text-[1rem]">
                {securePaymentNote}
              </p>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h2 className="font-serif text-[#121C2A] text-[clamp(1.5rem,2.08vw,2.5rem)]">{alreadyPaidTitle}</h2>

              {sent ? (
                <div role="status" className="mt-6 rounded-lg bg-[#EAF5FD] p-4 text-[#036CA3] border border-[#B8D7ED]">
                  <div className="flex items-center gap-2 font-semibold text-[#036CA3] text-[clamp(0.875rem,0.94vw,1rem)] mb-1">
                    <FileCheck className="h-5 w-5 text-[#048ED6]" />
                    {t('successTitle')}
                  </div>
                  <p className="text-[clamp(0.8125rem,0.83vw,0.875rem)] text-[#121C2A]/80 leading-relaxed">
                    {receiptFile ? t('successThanksWithReceipt') : t('successThanks')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-[clamp(1rem,1.66vw,2rem)] grid grid-cols-1 gap-[clamp(0.75rem,1.04vw,1.25rem)] sm:grid-cols-2">
                    <input name="name" required placeholder={namePlaceholder} aria-label={nameLabel} className={field} />
                    <input name="email" type="email" required placeholder={emailPlaceholder} aria-label={emailLabel} dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }} className={field} />
                    <div className="sm:col-span-2 md:col-span-1">
                      <PhoneInput
                        country={'lr'}
                        enableSearch={true}
                        value={phoneValue}
                        onChange={setPhoneValue}
                        inputProps={{
                          name: 'phone',
                          'aria-label': phoneLabel,
                          dir: 'ltr'
                        }}
                        containerClass="w-full"
                      />
                    </div>
                    <input name="country" placeholder={countryPlaceholder} aria-label={countryPlaceholder} className={field} />
                  </div>

                  <input
                    name="topic"
                    value={topicValue}
                    onChange={(e) => setTopicValue(e.target.value)}
                    placeholder={topicPlaceholder}
                    aria-label={topicPlaceholder}
                    className={`${field} mt-[clamp(0.75rem,1.04vw,1.25rem)]`}
                  />

                  <textarea
                    name="message"
                    rows={4}
                    placeholder={messagePlaceholder}
                    aria-label={messagePlaceholder}
                    className="mt-[clamp(0.75rem,1.04vw,1.25rem)] w-full rounded-lg border border-[#D6E9F6] bg-[#F7FBFE] p-4 text-[#121C2A] outline-none transition-colors placeholder:text-[#8A939C] focus-visible:border-[#048ED6] text-[clamp(0.8125rem,0.83vw,1rem)]"
                  />

                  {/* Non-required receipt / proof of payment upload field */}
                  <div className="mt-[clamp(0.75rem,1.04vw,1.25rem)]">
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="enr-receipt" className="flex items-center gap-1.5 font-semibold text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.9375rem)] cursor-pointer">
                        <Receipt className="h-4 w-4 text-[#048ED6]" aria-hidden />
                        <span>{receiptLabel}</span>
                        <span className="font-normal text-[#8A939C] text-xs">({t('optional')})</span>
                      </label>
                      {receiptFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-[#E03137] hover:underline cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('removeFile')}
                        </button>
                      )}
                    </div>

                    {!receiptFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setReceiptFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed ${
                          isDragging
                            ? 'border-[#048ED6] bg-[#EAF5FD]'
                            : 'border-[#D6E9F6] bg-[#F7FBFE] hover:border-[#048ED6] hover:bg-[#F2F9FD]'
                        } p-4 text-center transition-all duration-200`}
                      >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF5FD] text-[#048ED6] transition-colors duration-200 group-hover:bg-[#048ED6] group-hover:text-white">
                          <UploadCloud className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-[#121C2A] text-[clamp(0.75rem,0.78vw,0.875rem)]">
                          <span className="text-[#048ED6] underline underline-offset-2">{t('uploadReceiptClick')}</span>{' '}
                          {t('orDragDrop')}
                        </p>
                        <p className="mt-1 text-[#8A939C] text-[clamp(0.65rem,0.68vw,0.75rem)]">
                          {receiptHint}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-[#B8D7ED] bg-[#F0F7FD] p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#048ED6] text-white">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#121C2A]">{receiptFile.name}</p>
                            <p className="text-[11px] text-[#5A636D]">
                              {(receiptFile.size / 1024).toFixed(1)} KB •{' '}
                              <span className="font-medium text-[#036CA3]">{t('readyToSend')}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full text-[#8A939C] hover:bg-white hover:text-[#E03137] transition-colors cursor-pointer"
                          aria-label={t('removeFile')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      id="enr-receipt"
                      name="receipt"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReceiptFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>

                  <label className="mt-[clamp(1rem,1.25vw,1.5rem)] flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-[3px] w-4 h-4 shrink-0 accent-[#048ED6]"
                      required
                    />
                    <span className="leading-[1.5] text-[clamp(0.6875rem,0.68vw,0.8125rem)] text-start">
                      <Link href="?policy=terms" scroll={false} onClick={(e) => e.stopPropagation()} className="font-semibold text-[#121C2A] hover:underline hover:text-[#048ED6] transition-colors">{termsLinkText}</Link>{' '}
                      <span className="text-[#7A828C]">{termsSuffix}</span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!accepted}
                    className="mt-[clamp(1rem,1.66vw,2rem)] cursor-pointer h-[clamp(2.75rem,3.1vw,3.75rem)] w-full rounded-lg bg-[#048ED6] font-semibold text-white transition-colors hover:bg-[#037ab8] disabled:opacity-40 disabled:hover:bg-[#048ED6] disabled:cursor-not-allowed text-[clamp(0.875rem,0.94vw,1.125rem)]"
                  >
                    {sendMessageButtonText}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
