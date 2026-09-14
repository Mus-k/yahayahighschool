'use client';

import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { SOCIALS } from '@/components/public/shared/socials';
import { useTranslations } from 'next-intl';
import { StaffMemberEntity } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';

/**
 * Staffs — the faculty card grid.
 * Implemented from Figma node 384-1759 (staffs page frame, 1920×3361).
 *
 * Design reference values (measured off the 1920 export):
 *   4 columns of 398 at x137/553/969/1384 — pitch 416, so an 18 gutter
 *   photo 398×390 · name serif 20 · role uppercase 11 · hairline rule
 *   email row: #E6F0FB well + address · Load More pill 210×58, centred
 *
 * The social row only appears on the first card in the export, which is the
 * hover state being shown — so it is wired as a hover/focus reveal here.
 */

const STAFF_COUNT = 12;
const PAGE_SIZE = 8;

const FALLBACK_IMAGES = [
  '/images/figma-home/01-hero.jpeg',
  '/images/figma-home/20-news.jpeg',
  '/images/figma-home/04-programs.jpeg',
  '/images/figma-home/08-activity.jpeg',
];

const FALLBACK_STAFF: StaffMemberEntity[] = [
  { id: 1, name: 'Dr. Amina Al-Hassan', role: 'Head of Islamic Sciences', email: 'Yahayahighschool@Gmail.Com', order: 1, image: { url: '/images/figma-home/01-hero.jpeg' } as any },
  { id: 2, name: 'Prof. Julian Sterling', role: 'Dean of British Curriculum', email: 'Yahayahighschool@Gmail.Com', order: 2, image: { url: '/images/figma-home/20-news.jpeg' } as any },
  { id: 3, name: 'Dr. Farah Ibrahim', role: 'Lead, Science & Tech', email: 'Yahayahighschool@Gmail.Com', order: 3, image: { url: '/images/figma-home/04-programs.jpeg' } as any },
  { id: 4, name: 'Mr. Marcus Chen', role: 'Director of Arts', email: 'Yahayahighschool@Gmail.Com', order: 4, image: { url: '/images/figma-home/08-activity.jpeg' } as any },
  { id: 5, name: 'Ms. Layla Haruna', role: 'Head of Arabic Language', email: 'Yahayahighschool@Gmail.Com', order: 5, image: { url: '/images/figma-home/01-hero.jpeg' } as any },
  { id: 6, name: 'Mr. David Okoro', role: 'Head of Mathematics', email: 'Yahayahighschool@Gmail.Com', order: 6, image: { url: '/images/figma-home/08-activity.jpeg' } as any },
  { id: 7, name: 'Dr. Zainab Bello', role: 'Student Welfare Lead', email: 'Yahayahighschool@Gmail.Com', order: 7, image: { url: '/images/figma-home/04-programs.jpeg' } as any },
  { id: 8, name: 'Prof. Samuel Adeyemi', role: 'Dean of Admissions', email: 'Yahayahighschool@Gmail.Com', order: 8, image: { url: '/images/figma-home/20-news.jpeg' } as any },
  { id: 9, name: 'Mrs. Hauwa Sanni', role: 'Head of Early Years', email: 'Yahayahighschool@Gmail.Com', order: 9, image: { url: '/images/figma-home/01-hero.jpeg' } as any },
  { id: 10, name: 'Mr. Ibrahim Toure', role: 'Head of Qur’anic Studies', email: 'Yahayahighschool@Gmail.Com', order: 10, image: { url: '/images/figma-home/08-activity.jpeg' } as any },
  { id: 11, name: 'Ms. Grace Mensah', role: 'Head of Humanities', email: 'Yahayahighschool@Gmail.Com', order: 11, image: { url: '/images/figma-home/04-programs.jpeg' } as any },
  { id: 12, name: 'Mr. Yusuf Danladi', role: 'Head of Physical Education', email: 'Yahayahighschool@Gmail.Com', order: 12, image: { url: '/images/figma-home/20-news.jpeg' } as any },
];

function StaffCard({ member, index = 0 }: { member: StaffMemberEntity; index?: number }) {
  const name = member.name;
  const image = (member.image ? getStrapiMediaUrl(member.image) : null) || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const role = member.role;
  const email = member.email;

  const socialLinks = [];
  if (member.linkedinUrl) socialLinks.push({ name: 'LinkedIn', href: member.linkedinUrl, path: SOCIALS.find(s => s.name === 'LinkedIn')?.path });
  if (member.instagramUrl) socialLinks.push({ name: 'Instagram', href: member.instagramUrl, path: SOCIALS.find(s => s.name === 'Instagram')?.path });
  if (member.facebookUrl) socialLinks.push({ name: 'Facebook', href: member.facebookUrl, path: SOCIALS.find(s => s.name === 'Facebook')?.path });
  if (member.xUrl) socialLinks.push({ name: 'X', href: member.xUrl, path: SOCIALS.find(s => s.name === 'X')?.path });

  return (
    <article className="group rounded-xl overflow-hidden bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)]">
      <div className="relative w-full aspect-[398/390] cursor-pointer overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />

        {/* Socials ride in over the photo on hover; keyboard focus counts too. */}
        <div
          className="absolute left-[5.5%] bottom-[6%] flex items-center gap-2 transition-all duration-300
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                     group-focus-within:opacity-100 group-focus-within:translate-y-0"
        >
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.href}
              aria-label={`${name} on ${s.name}`}
              className="w-[30px] h-[30px] grid place-items-center rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]" aria-hidden>
                {s.path && <path d={s.path} />}
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div className="px-[clamp(0.9rem,1.15vw,1.4rem)] pt-[clamp(1rem,1.25vw,1.5rem)] pb-[clamp(1rem,1.15vw,1.4rem)]">
        <h3 className="font-serif text-[#121C2A] leading-[1.25] text-[clamp(1rem,1.04vw,1.25rem)]">
          {name}
        </h3>
        <p className="mt-1 uppercase tracking-[0.04em] text-[#7A828C] text-[1rem]">
          {role}
        </p>

        <hr className="my-[clamp(0.75rem,0.94vw,1.125rem)] border-0 border-t border-[#EBEFF3]" />

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 group/mail"
          >
            <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
              <Mail className="w-[15px] h-[15px]" />
            </span>
            <span className="min-w-0 truncate text-[#3F4941] transition-colors group-hover/mail:text-[#048ED6] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
              {email}
            </span>
          </a>
        )}
      </div>
    </article>
  );
}

export function StaffGrid({ initialStaff = [] }: { initialStaff?: StaffMemberEntity[] }) {
  const staffList = (initialStaff && initialStaff.length > 0) ? initialStaff : FALLBACK_STAFF;
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = staffList.slice(0, shown);
  const more = shown < staffList.length;
  const t = useTranslations('staffsPage');

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(2.5rem,4.2vw,5rem)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          {visible.map((member, idx) => (
            <StaffCard key={member.documentId || `${member.name}-${idx}`} member={member} index={idx} />
          ))}
        </div>

        {more && (
          <div className="mt-[clamp(2rem,3.4vw,4rem)] flex justify-center">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              className="inline-flex items-center justify-center gap-2 h-[58px] px-8 rounded-full border border-[#D7E3EE] bg-white text-[#121C2A] font-medium transition-colors hover:bg-[#F2F9FD] text-[clamp(0.8125rem,0.78vw,0.9375rem)]"
            >
              <ChevronDown className="w-4 h-4" />
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
