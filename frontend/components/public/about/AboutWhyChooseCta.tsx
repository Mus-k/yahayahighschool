import React from 'react';
import { Building2, GraduationCap, Moon, Users, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AboutWhyChooseSectionComponent } from '@/types/cms.types';

/**
 * About — "Why Choose Yahaya International?" cards and the closing CTA banner.
 * Implemented from Figma node 384-1451 (about page frame, 1920×6100).
 * The closing CTA moved to shared/PursuitCta — the Staffs design reuses it.
 *
 * Design reference values (measured off the 1920 export):
 *   heading 50 serif, centred (x510→1406) · sub 16/29
 *   4 cards 270×184 at x384/678/972/1266 — pitch 294, so a 24 gutter
 *   card fill #F2F9FD, white icon well with a #048ED6 glyph
 *   CTA card 1150 wide, same #F2F9FD, heading 34 serif italic, buttons h50
 *   Cards and CTA share the 1152-wide centred block used by Core Values.
 */

const FALLBACK_REASONS = [
  { key: 'faith', Icon: Moon },
  { key: 'academic', Icon: GraduationCap },
  { key: 'facilities', Icon: Building2 },
  { key: 'community', Icon: Users },
];

function getIconForName(name?: string): LucideIcon {
  switch (name?.toLowerCase()) {
    case 'moon':
    case 'faith': return Moon;
    case 'graduation-cap':
    case 'academic': return GraduationCap;
    case 'building':
    case 'building-2':
    case 'facilities': return Building2;
    case 'users':
    case 'community': return Users;
    default: return Moon;
  }
}

export function WhyChooseSection({ data }: { data?: AboutWhyChooseSectionComponent }) {
  const t = useTranslations('aboutPage.whyChoose');

  const title = data?.title || t('title');
  const description = data?.description || t('description');

  const reasons = data?.reasons?.length ? data.reasons.map(r => ({
    key: r.key,
    title: r.title,
    body: r.body,
    Icon: getIconForName(r.iconName || r.key)
  })) : FALLBACK_REASONS.map(r => ({
    key: r.key,
    title: t(`reasons.${r.key}.title`),
    body: t(`reasons.${r.key}.body`),
    Icon: r.Icon
  }));

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(1.5rem,4vw,4.8rem)]">
        <h2 className="text-center font-serif text-[#121C2A] leading-[1.15] text-[clamp(1.75rem,2.6vw,3.125rem)]">
          {title}
        </h2>
        <p className="mt-[clamp(0.75rem,1vw,1.2rem)] mx-auto max-w-[620px] text-center text-[#3F4941] leading-[1.81] text-[1rem]">
          {description}
        </p>

        <div className="mt-[clamp(2rem,3.1vw,3.7rem)] max-w-[1152px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r) => (
            <article
              key={r.key}
              className="rounded-xl bg-[#F2F9FD] px-[clamp(1rem,1.15vw,1.4rem)] py-[clamp(1.25rem,1.25vw,1.5rem)]"
            >
              <span className="grid place-items-center w-[clamp(2rem,2.1vw,2.5rem)] h-[clamp(2rem,2.1vw,2.5rem)] rounded-lg bg-white text-[#048ED6]">
                <r.Icon className="w-[clamp(1rem,1.04vw,1.25rem)] h-[clamp(1rem,1.04vw,1.25rem)]" />
              </span>
              <h3 className="mt-[clamp(0.75rem,0.94vw,1.125rem)] font-semibold text-[#121C2A] text-[clamp(0.8125rem,0.78vw,0.9375rem)]">
                {r.title}
              </h3>
              <p className="mt-[clamp(0.5rem,0.68vw,0.8125rem)] text-[#3F4941] leading-[1.7] text-[1rem]">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
