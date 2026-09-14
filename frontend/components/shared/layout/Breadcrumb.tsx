'use client';

import { usePathname } from '@/i18n/routing';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Breadcrumb Component
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  create: 'Create',
  edit: 'Edit',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  'school-profile': 'School Profile',
  security: 'Security',
  notifications: 'Notifications',
  languages: 'Languages',
  students: 'Students',
  teachers: 'Teachers',
  parents: 'Parents',
  finance: 'Finance',
  hostel: 'Hostel',
  exams: 'Exams',
  attendance: 'Attendance',
  timetable: 'Timetable',
  events: 'Events',
  quran: "Qur'an",
};

interface BreadcrumbProps {
  className?: string;
  pageTitle?: string;
}

export function Breadcrumb({ className, pageTitle }: BreadcrumbProps) {
  const pathname = usePathname();

  // Build breadcrumb segments from pathname
  const segments = pathname
    .replace(/^\/(en|ar|fr|tr)\//, '/')
    .split('/')
    .filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    // Check if it's an ID (numeric) — show as detail view
    const isId = /^\d+$/.test(segment);
    const label = isId ? 'Detail' : (ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1));
    return { href, label, isId };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {pageTitle ?? crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
