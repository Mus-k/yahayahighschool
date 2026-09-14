/**
 * Programme data.
 *
 * A plain module, not part of any 'use client' file: a server component
 * importing from a client module receives a client-reference proxy rather than
 * the value, which is how ARTICLES.map stopped being a function on the news
 * page. Keep it that way.
 *
 * Images are from the set checked one by one — see the note in
 * components/public/news/articles.ts for which paths in /images/figma-home are
 * actually usable. The design's own artwork (a mosque at night, a boy reciting
 * at a podium) is not in the asset folder.
 */

export type Program = {
  slug: string;
  title: string;
  /** Chip above the headline on the detail page. */
  eyebrow: string;
  image: string;
  alt: string;
  /** Listing card copy. */
  desc: string;
  /** Detail hero copy. */
  lede: string;
  /** Detail body section. */
  pathwayTitle: string;
  pathwayLede: string;
  steps: { title: string; desc: string }[];
};

const HIFZ_STEPS = [
  { title: 'Intensive Memorization',
    desc: 'Daily structured sessions focused on new verses, previous revision, and long-term retention.' },
  { title: 'Tafsir & Understanding',
    desc: 'Weekly sessions exploring the context and meaning of the memorized portions.' },
  { title: 'Tajweed Mastery',
    desc: 'Close attention to articulation and rhythm, corrected one to one with a qualified teacher.' },
  { title: 'Ijazah Pathway',
    desc: 'A route to certification for students who complete the programme with consistent excellence.' },
];

export const PROGRAMS: Program[] = [
  {
    slug: 'quran-memorization', title: "Qur'an Memorization", eyebrow: 'Academic Excellence',
    image: '/images/figma-home/13.png', alt: 'Students reading in the library',
    desc: 'Guided Hifz program with tajweed, understanding, and character building — rooted in love for the Qur’an.',
    lede: "Yahaya International's Qur'an Memorization & Hifz Program offers a scholarly environment where spiritual devotion meets academic rigor, nurturing tomorrow's leaders through the wisdom of the Holy Qur'an.",
    pathwayTitle: 'The Hifz Pathway',
    pathwayLede: 'Our Qur’an Memorization program is more than a curriculum; it is a transformative journey. We combine traditional Ottoman and African memorization techniques with modern pedagogical approaches to ensure deep retention and authentic Tajweed.',
    steps: HIFZ_STEPS,
  },
  {
    slug: 'arabic-immersion', title: 'Arabic Immersion', eyebrow: 'Language',
    image: '/images/figma-home/17.png', alt: 'Group study in the library',
    desc: 'Comprehensive language acquisition enabling students to engage deeply with classical texts and modern dialogue.',
    lede: 'A full immersion in classical and modern Arabic, giving students the confidence to read primary sources and hold a conversation with equal ease.',
    pathwayTitle: 'The Language Pathway',
    pathwayLede: 'Students move from spoken confidence to classical fluency through daily immersion, structured grammar, and wide reading in original texts.',
    steps: [
      { title: 'Spoken Foundations', desc: 'Daily conversation practice that builds fluency before formal grammar takes over.' },
      { title: 'Classical Grammar', desc: 'Nahw and Sarf taught systematically so that original texts become approachable.' },
      { title: 'Reading Original Texts', desc: 'Guided study of classical works, read in Arabic from the first term.' },
      { title: 'Composition', desc: 'Written expression developed through regular assignments and close feedback.' },
    ],
  },
  {
    slug: 'stem-robotics', title: 'STEM & Robotics', eyebrow: 'Innovation',
    image: '/images/figma-home/09.png', alt: 'A lesson in progress',
    desc: 'Hands-on scientific inquiry and programming skills that prepare students for competitive technical fields.',
    lede: 'Laboratory work, programming, and competitive robotics, taught as a single discipline so that theory and practice reinforce one another.',
    pathwayTitle: 'The STEM Pathway',
    pathwayLede: 'From first principles to regional competition, students build, test, and defend their own work throughout the programme.',
    steps: [
      { title: 'Scientific Method', desc: 'Enquiry, measurement, and honest reporting established from the first year.' },
      { title: 'Programming', desc: 'Practical coding taught through problems students actually want to solve.' },
      { title: 'Robotics Build', desc: 'Design and fabrication in the workshop, culminating in a working machine.' },
      { title: 'Competition', desc: 'Regional challenges where students present and defend their engineering choices.' },
    ],
  },
  {
    slug: 'islamic-studies', title: 'Islamic Studies', eyebrow: 'Faith & Character',
    image: '/images/figma-home/07-activity.png', alt: 'Students outside the school building',
    desc: 'In-depth exploration of Fiqh, Aqeedah, and Seerah to build a strong foundational worldview.',
    lede: 'A grounding in Fiqh, Aqeedah, and Seerah that gives students a coherent worldview and the tools to reason within it.',
    pathwayTitle: 'The Studies Pathway',
    pathwayLede: 'Sources are read closely and discussed openly, so that conviction rests on understanding rather than habit.',
    steps: [
      { title: 'Aqeedah', desc: 'The foundations of belief, taught with room for genuine questions.' },
      { title: 'Fiqh', desc: 'Practical jurisprudence applied to the situations students actually meet.' },
      { title: 'Seerah', desc: 'The Prophetic biography studied as history and as a model of conduct.' },
      { title: 'Ethics in Practice', desc: 'Character work carried into daily school life, not confined to the classroom.' },
    ],
  },
  {
    slug: 'humanities-arts', title: 'Humanities & Arts', eyebrow: 'Culture',
    image: '/images/figma-home/19.png', alt: 'Students walking on campus',
    desc: 'Critical thinking through history, literature, and social sciences from global and Islamic perspectives.',
    lede: 'History, literature, and the social sciences read from both global and Islamic perspectives, with argument taken seriously.',
    pathwayTitle: 'The Humanities Pathway',
    pathwayLede: 'Students learn to read closely, weigh evidence, and write clearly — the habits that transfer to every other subject.',
    steps: [
      { title: 'Close Reading', desc: 'Texts studied slowly and argued over, rather than summarised.' },
      { title: 'Historical Method', desc: 'Sources weighed for reliability, bias, and context.' },
      { title: 'Written Argument', desc: 'Essays built on evidence and revised through feedback.' },
      { title: 'Creative Practice', desc: 'Studio and performance work alongside the written curriculum.' },
    ],
  },
  {
    slug: 'global-leadership', title: 'Global Leadership', eyebrow: 'Leadership',
    image: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building',
    desc: 'Mentorship, public speaking, and community service projects designed to nurture confident future leaders.',
    lede: 'Mentorship, public speaking, and service projects that ask students to lead in front of people who will hold them to it.',
    pathwayTitle: 'The Leadership Pathway',
    pathwayLede: 'Responsibility is given early and reviewed honestly, so that confidence is earned rather than assumed.',
    steps: [
      { title: 'Public Speaking', desc: 'Regular speaking before real audiences, with structured critique.' },
      { title: 'Mentorship', desc: 'Each student paired with a teacher who follows their progress across years.' },
      { title: 'Service Projects', desc: 'Community work planned and run by students themselves.' },
      { title: 'Reflection', desc: 'Written and spoken review of what worked, what did not, and why.' },
    ],
  },
];
