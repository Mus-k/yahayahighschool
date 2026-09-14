import { ReactNode } from 'react';
import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function ParentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['parent']}>
      {children}
    </RoleGuard>
  );
}
