import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';

/**
 * The banded page header used across the inner pages (About, Staffs, …).
 *
 * Design reference values (measured at 1920 on the about and staffs exports):
 *   band #FAFCFE · crumb 15 · title 52 serif · sub 18/29 centred
 *   the sub's measure differs per page, hence `subMaxWidth`
 */
export function PageHeader({
  title,
  crumb,
  children,
  subMaxWidth = 720,
  parentPage,
}: {
  title: string;
  /** Breadcrumb label when it differs from the heading (Contact → "Get in Touch"). */
  crumb?: string;
  children: React.ReactNode;
  subMaxWidth?: number;
  /** Optional parent page for a 3-level breadcrumb. */
  parentPage?: { label: string; href: string };
}) {
  const t = useTranslations('publicNav');

  return (
    <section className="w-full bg-[#FAFCFE]">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) pt-[clamp(2.5rem,4.2vw,5rem)] pb-[clamp(2.5rem,4.6vw,5.5rem)]">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center justify-center gap-2 max-sm:gap-1 text-[clamp(1rem,0.73vw,1.1rem)]"
        >
          <Link href="/" className="text-[#3F4941] transition-colors hover:text-[#048ED6]">
            {t('home')}
          </Link>
          <ChevronRight className="w-4 h-4 text-[#9AA3AE] rtl:rotate-180" aria-hidden />
          {parentPage && (
            <>
              <Link href={parentPage.href} className="text-[#048ED6] transition-colors hover:text-[#037ab8]">
                {parentPage.label}
              </Link>
              <ChevronRight className="w-4 h-4 text-[#9AA3AE] rtl:rotate-180" aria-hidden />
            </>
          )}
          <span className="text-[#121C2A] font-medium">{crumb ?? title}</span>
        </nav>

        <h1 className="mt-[clamp(1rem,1.4vw,1.7rem)] text-center font-serif text-[#121C2A] tracking-[-0.015em] leading-[1.1] text-[clamp(1.5rem,2.7vw,3.25rem)]">
          {title}
        </h1>

        <p
          style={{ maxWidth: subMaxWidth }}
          className="mt-[clamp(1rem,2.2vw,2.6rem)] mx-auto text-center text-[#3F4941] leading-[1.61] text-[clamp(1rem,0.94vw,1.125rem)]"
        >
          {children}
        </p>
      </div>
    </section>
  );
}
