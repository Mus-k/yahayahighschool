// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Typed Route Constants
// All internal routes are defined here to prevent typos and enable refactoring.
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTES = {
  // ── Public ──────────────────────────────────────────────
  HOME: '/',

  // ── Auth ────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },

  // ── Dashboard ────────────────────────────────────────────
  DASHBOARD: {
    ROOT: '/dashboard',
  },

  // ── User Management ──────────────────────────────────────
  USERS: {
    LIST: '/users',
    CREATE: '/users/create',
    DETAIL: (id: number | string) => `/users/${id}`,
    EDIT: (id: number | string) => `/users/${id}/edit`,
  },

  // ── Audit Logs ────────────────────────────────────────────
  AUDIT_LOGS: {
    LIST: '/audit-logs',
  },

  // ── Settings ─────────────────────────────────────────────
  SETTINGS: {
    ROOT: '/settings',
    SCHOOL_PROFILE: '/settings/school-profile',
    SECURITY: '/settings/security',
    NOTIFICATIONS: '/settings/notifications',
    LANGUAGES: '/settings/languages',
  },

  // ── External ─────────────────────────────────────────────
  STRAPI_ADMIN: `${process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1339'}/admin`,
} as const;

/** Routes that don't require authentication */
export const PUBLIC_ROUTES: string[] = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.AUTH.VERIFY_EMAIL,
];

/** Routes accessible only by admins and directors */
export const ADMIN_ONLY_ROUTES: string[] = [
  ROUTES.USERS.LIST,
  ROUTES.USERS.CREATE,
  ROUTES.AUDIT_LOGS.LIST,
  ROUTES.SETTINGS.ROOT,
];
