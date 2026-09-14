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
