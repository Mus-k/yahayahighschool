/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Root — Smart Role-Based Redirect
// Waits for auth to fully settle before redirecting to avoid cold-start 404s.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_DASHBOARD: Record<string, string> = {
  'super-administrator': '/dashboard/admin',
  'director':            '/dashboard/director',
  'teacher':             '/dashboard/teacher',
  'student':             '/dashboard/student',
  'parent':              '/dashboard/parent',
  'accountant':          '/dashboard/accountant',
  'account-lead':        '/dashboard/account-lead',
  'worker':              '/dashboard/worker',
  'driver':              '/dashboard/driver',
  'section-head':        '/dashboard/section-head',
  'registrar':           '/dashboard/admin', // Registrar uses the registrar scope but admin page works or can redirect
};

export default function DashboardRootPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't redirect until auth has fully resolved
    if (isLoading) return;
    // Prevent double-redirect on re-renders
    if (hasRedirected.current) return;

    if (!isAuthenticated || !user) {
      // Not authenticated — go to login
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    const roleType = (user as any)?.role?.type as string | undefined;
    // All good — redirect to role-specific dashboard or fallback to admin
    const destination = (roleType && ROLE_DASHBOARD[roleType]) ? ROLE_DASHBOARD[roleType] : '/dashboard/admin';
    hasRedirected.current = true;
    router.replace(destination);
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading your portal...</p>
      </div>
    </div>
  );
}
