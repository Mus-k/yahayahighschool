import type { NewsFeaturedEventComponent } from '@/types/cms.types';

/** Derive a URL slug from a featured event entry */
export function slugifyEvent(fe: NewsFeaturedEventComponent, idx: number): string {
  if (fe.href) {
    const raw = fe.href.trim();
    return raw
      .replace(/^\/[a-z]{2}\/news\//, '')
      .replace(/^\/news\//, '')
      .replace(/^\//, '')
      || `story-${idx}`;
  }
  const title = fe.title || `${fe.headlineLine1 || ''} ${fe.headlineLine2 || ''}`.trim() || `story-${idx}`;
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Built-in stories shown when Strapi has no News Page entry (or is unreachable).
 * Images live in /public/images, so getStrapiMediaUrl leaves them untouched.
 */
export const FALLBACK_FEATURED_EVENTS: NewsFeaturedEventComponent[] = [
  {
    id: -1,
    eyebrow: 'School Stories',
    headlineLine1: 'News, Events &',
    headlineLine2: 'Community',
    lede: 'Discover the latest happenings at Yahaya International. From academic achievements to spiritual milestones, our stories reflect our commitment to faith, learning and character.',
    image: { url: '/images/figma-home/09.png', alternativeText: 'A lesson in progress' } as any,
    month: 'JUL', day: '15', category: 'CEREMONY', title: 'Graduation Ceremony',
    time: '10:00 AM - 1:00 PM', place: 'Main Auditorium',
    blurb: 'Join us as we celebrate the achievements of our graduating class.',
    href: '/news/science-tech-fair-2024',
    buttonText: 'Read More',
  },
  {
    id: -2,
    eyebrow: 'Campus Life',
    headlineLine1: 'A New Home',
    headlineLine2: 'for Hifz',
    lede: 'Our dedicated memorization centre opens its doors, giving students a purpose-built space for recitation, review and quiet study.',
    image: { url: '/images/figma-home/17.png', alternativeText: 'Group study in the library' } as any,
    month: 'SEP', day: '12', category: 'OPENING', title: 'Memorization Hub',
    time: '9:00 AM - 11:00 AM', place: 'Hifz Centre',
    blurb: 'The doors open on our dedicated Hifz learning centre.',
    href: '/news/new-memorization-hub',
    buttonText: 'Read More',
  },
  {
    id: -3,
    eyebrow: "D'awah",
    headlineLine1: 'Service Beyond',
    headlineLine2: 'the Gates',
    lede: 'Senior students carried our values into three neighbourhoods this month, leading an outreach programme built on listening as much as teaching.',
    image: { url: '/images/figma-home/19.png', alternativeText: 'Students walking on campus' } as any,
    month: 'JUN', day: '18', category: "D'AWAH", title: 'Community Outreach',
    time: '2:00 PM - 5:00 PM', place: 'City Centre',
    blurb: 'Senior students lead an outreach programme across three neighbourhoods.',
    href: '/news/community-dawah',
    buttonText: 'Read More',
  },
  {
    id: -4,
    eyebrow: 'Achievement',
    headlineLine1: 'Character, and',
    headlineLine2: 'Scholarship',
    lede: 'The Excellence Awards recognise the students whose work and conduct set the tone for everyone around them.',
    image: { url: '/images/figma-home/07-activity.png', alternativeText: 'Students outside the school building' } as any,
    month: 'MAY', day: '10', category: 'AWARDS', title: 'Excellence Awards',
    time: '11:00 AM - 1:00 PM', place: 'Main Hall',
    blurb: 'Recognising outstanding academic and character achievement.',
    href: '/news/excellence-awards',
    buttonText: 'Read More',
  },
  {
    id: -5,
    eyebrow: 'Events',
    headlineLine1: 'Ideas Worth',
    headlineLine2: 'Gathering For',
    lede: 'A full day of talks and demonstrations, bringing together some of the brightest minds working in the field today.',
    image: { url: '/images/figma-home/13.png', alternativeText: 'Students reading in the library' } as any,
    month: 'AUG', day: '05', category: 'EVENTS', title: 'Innovation Summit',
    time: '10:00 AM - 4:00 PM', place: 'Library Annex',
    blurb: 'A day of talks bringing together the brightest minds in the field.',
    href: '/news/innovation-summit',
    buttonText: 'Read More',
  },
];
