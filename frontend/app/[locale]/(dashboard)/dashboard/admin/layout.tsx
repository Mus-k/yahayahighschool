import { ReactNode } from 'react';
import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super-administrator', 'director', 'super-administrator']}>
      {children}
    </RoleGuard>
  );
}
