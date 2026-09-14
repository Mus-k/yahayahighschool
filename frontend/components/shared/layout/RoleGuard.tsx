'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !role) {
        router.push(ROUTES.AUTH.LOGIN);
      } else if (!allowedRoles.includes(role)) {
        router.push(fallbackUrl);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [role, isLoading, isAuthenticated, router, allowedRoles, fallbackUrl]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
