'use client';

import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { can as canPermissions, hasPermission } from '@/lib/permissions';
import type { UserRoleEnum } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — usePermissions Hook
// Role-based access control checks for components.
// ─────────────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { role } = useAuth();

  const hasRole = useCallback(
    (...roles: UserRoleEnum[]) => hasPermission(role, roles),
    [role]
  );

  const can = useMemo(
    () => ({
      manageUsers: canPermissions.manageUsers(role),
      viewAuditLogs: canPermissions.viewAuditLogs(role),
      manageSettings: canPermissions.manageSettings(role),
      accessFinance: canPermissions.accessFinance(role),
      approveTransactions: canPermissions.approveTransactions(role),
      teach: canPermissions.teach(role),
      isAdmin: canPermissions.isAdmin(role),
    }),
    [role]
  );

  return useMemo(
    () => ({
      role,
      userRole: role,
      hasRole,
      can,
    }),
    [role, hasRole, can]
  );
}
