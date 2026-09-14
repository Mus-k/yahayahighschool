import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super-administrator', 'director']}>
      {children}
    </RoleGuard>
  );
}
