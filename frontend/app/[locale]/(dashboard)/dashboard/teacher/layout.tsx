import { ReactNode } from 'react';
import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function TeacherDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      {children}
    </RoleGuard>
  );
}
