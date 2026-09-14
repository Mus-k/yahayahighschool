import React from 'react';
import { BookOpen, Heart, Megaphone, Sparkles, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AboutValuesSectionComponent, AboutDirectorSectionComponent } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

/**
 * About — Core Values bar and the Founding Director quote.
 * Implemented from Figma node 384-1451 (about page frame, 1920×6100).
 *
 * Design reference values (measured off the 1920 export):
 *   values card 1168×160 at x376, white on a #E5F3FA hairline, centred
 *     five columns at x432 / 725 / 937 / 1118 / 1364
 *   director panel 1280×850 at x320/y2408, #048ED6, white card inset 64px
 *     portrait 256 circle · name 22 · role 14 · heading 30 · body 14/26
 *   ink #121C2A · body #3F4941
 */

const FALLBACK_VALUES = [
  { key: 'knowledge', Icon: BookOpen },
  { key: 'action', Icon: Sparkles },
  { key: 'advocacy', Icon: Megaphone },
  { key: 'empathy', Icon: Heart },
];

function getIconForName(name?: string): LucideIcon {
  switch (name?.toLowerCase()) {
    case 'knowledge': return BookOpen;
    case 'action': return Sparkles;
    case 'advocacy': return Megaphone;
    case 'empathy': return Heart;
    default: return Sparkles;
  }
}

export function CoreValuesBar({ data }: { data?: AboutValuesSectionComponent }) {
  const t = useTranslations('aboutPage.coreValues');

  const title = data?.title || t('title');
  const description = data?.description || t('description');
  
  const values = data?.values?.length ? data.values.map(v => ({
    key: v.key,
    label: v.label,
    Icon: getIconForName(v.iconName || v.key)
  })) : FALLBACK_VALUES.map(v => ({
    key: v.key,
    label: t(`values.${v.key}`),
    Icon: v.Icon
  }));

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side) sm:py-[clamp(1.5rem,3.1vw,3.7rem)]">
        <div className="max-w-[1168px] mx-auto sm:rounded-2xl border border-[#E5F3FA] bg-white shadow-[0_6px_24px_rgba(16,24,40,0.05)] px-[clamp(1.5rem,2.9vw,3.5rem)] py-[clamp(1.5rem,2.1vw,2.5rem)]">
          <div className="flex flex-col md:flex-row md:items-center gap-y-8 gap-x-[clamp(1.5rem,3vw,3.6rem)]">

            <div className="md:w-[192px] shrink-0">
              <h2 className="font-serif text-[#121C2A] leading-tight text-[clamp(1.25rem,1.56vw,1.875rem)]">
                {title}
              </h2>
              <p className="mt-2 text-[#3F4941] leading-[1.45] text-[1rem]">
                {description}
              </p>
            </div>

            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4">
              {values.map((v) => (
                <div key={v.key} className="flex flex-col items-center text-center gap-3">
                  <v.Icon className="w-[clamp(1.1rem,1.15vw,1.375rem)] h-[clamp(1.1rem,1.15vw,1.375rem)] text-[#048ED6]" />
                  <span className="text-[#3F4941] whitespace-nowrap text-[clamp(0.75rem,0.73vw,0.875rem)]">
                    {v.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FoundingDirectorSection({ data }: { data?: AboutDirectorSectionComponent }) {
  const t = useTranslations('aboutPage.director');

  const name = data?.name || t('name');
  const role = data?.role || t('role');
  const portraitUrl = data?.portrait ? getStrapiMediaUrl(data.portrait) : (data?.portraitUrl || "/images/figma-home/08-activity.jpeg");
  const quoteTitle = data?.quoteTitle || t('quoteTitle');
  const quoteP1 = data?.quoteP1 || t('quoteP1');
  const quoteP2 = data?.quoteP2 || t('quoteP2');
  const quoteP3 = data?.quoteP3 || t('quoteP3');
  const signature = data?.signature || t('signature');

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side) sm:py-[clamp(1.5rem,4vw,4.8rem)]">
        <div className="max-w-[1280px] mx-auto sm:rounded-[28px] bg-[#048ED6] p-[clamp(1.5rem,3.3vw,4rem)]">
          <div className="rounded-[20px] bg-white px-[clamp(1.5rem,3.1vw,3.7rem)] py-[clamp(2rem,3.4vw,4rem)]">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,256px)_minmax(0,1fr)] gap-y-10 gap-x-[clamp(2rem,4.2vw,5rem)]">

              {/* Portrait */}
              <div className="flex flex-col items-center text-center">
                <div className="w-[clamp(9rem,13.3vw,16rem)] aspect-square rounded-full overflow-hidden">
                  <img
                    src={portraitUrl || ''}
                    alt={name}
                    aria-hidden
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-[clamp(1.25rem,1.9vw,2.25rem)] font-serif text-[#121C2A] text-[clamp(1.125rem,1.15vw,1.375rem)]">
                  {name}
                </p>
                <p className="mt-1 text-[#3F4941] text-[1rem]">
                  {role}
                </p>
              </div>

              {/* Quote */}
              <div>
                <svg viewBox="0 0 43 30" className="w-[clamp(1.75rem,2.2vw,2.7rem)] h-auto fill-[#048ED6] rtl:-scale-x-100" aria-hidden>
                  <path d="M0 30V17.6C0 12.9 1 9 3 5.9 5.1 2.8 8.2.9 12.4 0l2 4.4c-2.6.9-4.5 2.2-5.6 3.9-1.1 1.7-1.7 4-1.7 6.8h6.6V30H0Zm24.5 0V17.6c0-4.7 1-8.6 3-11.7C29.6 2.8 32.7.9 36.9 0l2 4.4c-2.6.9-4.5 2.2-5.6 3.9-1.1 1.7-1.7 4-1.7 6.8h6.6V30H24.5Z" />
                </svg>

                <h3 className="mt-[clamp(1rem,1.5vw,1.8rem)] font-serif text-[#121C2A] leading-[1.25] text-[clamp(1.25rem,1.56vw,1.875rem)]">
                  {quoteTitle}
                </h3>

                <div className="mt-[clamp(1rem,1.6vw,1.9rem)] flex flex-col gap-[clamp(1rem,1.5vw,1.8rem)] text-[#3F4941] leading-[1.86] text-[clamp(0.8125rem,0.73vw,0.875rem)]">
                  {quoteP1 && <p>{quoteP1}</p>}
                  {quoteP2 && <p>{quoteP2}</p>}
                  {quoteP3 && <p>{quoteP3}</p>}
                </div>

                <p className="mt-[clamp(1.5rem,2.3vw,2.75rem)] font-serif italic text-[#9AA3AE] text-[1rem]">
                  {signature}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
