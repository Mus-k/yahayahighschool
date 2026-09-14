import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Next.js Proxy Middleware (Next.js 16+ Convention)
// Handles: i18n locale routing + JWT auth protection
// ─────────────────────────────────────────────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

/** Routes that require authentication (must be signed in) */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/users',
  '/audit-logs',
  '/settings',
  '/students',
  '/teachers',
  '/parents',
  '/workers',
  '/finance',
  '/hostel',
  '/exams',
  '/attendance',
  '/timetable',
  '/events',
  '/messages',
  '/notifications',
  '/reports',
  '/erp',
  '/lms',
  '/qms',
  '/llms',
  '/assessment',
  '/results',
  '/directory',
  '/academic-structure',
  '/profile',
  '/admissions',
];

/** Routes accessible only when NOT authenticated */
const AUTH_ONLY_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

function isProtectedRoute(pathname: string): boolean {
  // Strip locale prefix for checking (e.g., /ar/dashboard → /dashboard)
  const strippedPath = pathname.replace(/^\/(en|ar|fr|tr)/, '') || '/';
  return PROTECTED_PREFIXES.some((prefix) => strippedPath.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  const strippedPath = pathname.replace(/^\/(en|ar|fr|tr)/, '') || '/';
  return AUTH_ONLY_ROUTES.some((route) => strippedPath.startsWith(route));
}

function getJWT(request: NextRequest): string | null {
  return request.cookies.get('jwt')?.value ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Bypass static assets, API routes, and system files ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const jwt = getJWT(request);
  const isAuthenticated = !!jwt;

  // Extract locale prefix if present
  const localeMatch = pathname.match(/^\/(en|ar|fr|tr)\b/);
  const hasLocale = !!localeMatch;
  const localePrefix = hasLocale ? localeMatch[0] : '';

  // ── Redirect requests lacking a locale prefix to default /en prefix ──
  if (!hasLocale) {
    const redirectUrl = new URL(`/en${pathname === '/' ? '' : pathname}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // ── Auth Guard ────────────────────────────────────────────
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    // Redirect to login, preserving the intended URL
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from auth pages ──
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, request.url));
  }

  // ── next-intl locale middleware ───────────────────────────
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for the ones starting with:
  // - api (API routes)
  // - _next (Next.js internals)
  // - static files (contain a dot in path)
  matcher: [
    '/((?!api|_next|[^?]*\\.[^?]*$).*)'
  ],
};
