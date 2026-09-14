// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Application Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Strapi API base URL */
export const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1339';

/** Strapi API endpoint */
export const API_URL = `${STRAPI_URL}/api`;


/** Frontend app URL */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Application display name */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'YAHAYASCOOL';

/** Full school name */
export const SCHOOL_NAME =
  process.env.NEXT_PUBLIC_SCHOOL_NAME ??
  'Yahaya International Islamic and English High School';

/** Supported locales */
export const SUPPORTED_LOCALES = ['en', 'ar', 'fr', 'tr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Default locale */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** RTL locales */
export const RTL_LOCALES: SupportedLocale[] = ['ar'];

/** API request timeout in milliseconds */
export const API_TIMEOUT_MS = 30_000;

/** Token storage keys */
export const STORAGE_KEYS = {
  JWT: 'yahaya_jwt',
  LOCALE: 'yahaya_locale',
  THEME: 'yahaya_theme',
  SIDEBAR_COLLAPSED: 'yahaya_sidebar_collapsed',
} as const;

/** Cookie names */
export const COOKIE_NAMES = {
  JWT: 'jwt',
  LOCALE: 'NEXT_LOCALE',
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/** Dashboard refresh intervals (milliseconds) */
export const REFRESH_INTERVALS = {
  NOTIFICATIONS: 30_000,   // 30 seconds
  DASHBOARD_STATS: 300_000, // 5 minutes
} as const;

/** Debounce delays (milliseconds) */
export const DEBOUNCE = {
  SEARCH: 400,
  EMAIL_CHECK: 600,
  FORM_SAVE: 1_000,
} as const;

/** File upload limits */
export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,    // 5 MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,  // 100 MB
  MAX_PDF_SIZE: 20 * 1024 * 1024,     // 20 MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10 MB
} as const;

/** School ID format */
export const SCHOOL_ID = {
  /** Length of the numeric portion */
  SEQUENCE_LENGTH: 9,
  /** Total ID length: 2 initials + 9 digits */
  TOTAL_LENGTH: 11,
  /** Regex pattern for validation */
  PATTERN: /^[A-Z]{2}\d{9}$/,
} as const;

/** Academic year format */
export const ACADEMIC_YEAR_FORMAT = 'YYYY/YYYY';

/** Brand colors (for programmatic use) */
export const BRAND_COLORS = {
  GREEN: 'oklch(0.53 0.145 163)',
  GOLD: 'oklch(0.76 0.16 85)',
  DARK: 'oklch(0.128 0.012 240)',
} as const;
