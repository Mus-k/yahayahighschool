import { ReactNode } from 'react';
import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['student']}>
      {children}
    </RoleGuard>
  );
}
