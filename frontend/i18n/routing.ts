import { defineRouting } from 'next-intl/routing';

import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // All supported locales
  locales: ['en', 'ar', 'fr', 'tr'] as const,

  // Default locale — no URL prefix (e.g., /dashboard not /en/dashboard)
  defaultLocale: 'en',

  // Always add locale prefix
  localePrefix: 'always',

  // Disable automatic browser language detection so it always defaults to English
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
