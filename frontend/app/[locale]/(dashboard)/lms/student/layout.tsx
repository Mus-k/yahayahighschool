import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function AutoRoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super-administrator',"director","teacher","student"]}>
      {children}
    </RoleGuard>
  );
}
