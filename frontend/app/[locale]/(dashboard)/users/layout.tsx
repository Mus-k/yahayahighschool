import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super-administrator']}>
      {children}
    </RoleGuard>
  );
}
