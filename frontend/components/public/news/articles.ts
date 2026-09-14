/**
 * Article data.
 *
 * Deliberately a plain module, not part of the 'use client' file: a server
 * component importing from a client module gets a client-reference proxy back,
 * not the value — which is exactly how ARTICLES.map stopped being a function.
 */

export const NEWS_CATEGORIES = ['All', 'News', 'Events', "D'awah"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type Article = {
  title: string; category: Exclude<NewsCategory, 'All'>; date: string;
  desc: string; slug: string; image: string; alt: string;
};

// Images come from the set already checked image-by-image. Most of
// /images/figma-home is NOT usable here despite the filenames: 01-hero,
// 04-programs, 08-activity and 20-news are stock portraits, 06-activity is the
// crest, 16/18 are book renders, 14-news is a wallpaper pattern, and 15-news /
// 02-about are corporate stock. The only real school scenes are 07-activity,
// 09, 13, 17, 19 and 03-programs. Open any new path before using it.
export const ARTICLES: Article[] = [
  { title: 'Annual Science & Tech Fair 2024', category: 'Events', date: 'Oct 24, 2024',
    desc: 'Students showcased ingenuity during the 15th Annual Science & Technology Fair.',
    slug: 'science-tech-fair-2024', image: '/images/figma-home/09.png', alt: 'A lesson in progress' },
  { title: 'New Memorization Hub Opening', category: 'News', date: 'Sep 12, 2024',
    desc: 'We are thrilled to announce the opening of our new dedicated Hifz learning center.',
    slug: 'new-memorization-hub', image: '/images/figma-home/17.png', alt: 'Group study in the library' },
  { title: 'Innovation Through Collaboration', category: 'Events', date: 'Aug 05, 2024',
    desc: "This year's summit brought together the brightest minds in the industry.",
    slug: 'innovation-summit', image: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building' },
  { title: 'Reimagining Digital Security', category: 'News', date: 'Jul 20, 2024',
    desc: 'Discover the next generation of our platform featuring advanced cyber protocols.',
    slug: 'digital-security', image: '/images/figma-home/13.png', alt: 'Students reading in the library' },
  { title: 'Community Dawah Initiative', category: "D'awah", date: 'Jun 18, 2024',
    desc: 'Our senior students led a community outreach program spanning three neighborhoods.',
    slug: 'community-dawah', image: '/images/figma-home/19.png', alt: 'Students walking on campus' },
  { title: 'Excellence Awards 2024', category: 'Events', date: 'May 10, 2024',
    desc: 'Recognizing outstanding academic and character achievements among our students.',
    slug: 'excellence-awards', image: '/images/figma-home/07-activity.png', alt: 'Students outside the school building' },
];

