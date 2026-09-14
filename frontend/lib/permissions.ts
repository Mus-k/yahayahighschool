import { UserRoleEnum } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Permission Matrix
// Defines which roles can access which features.
// All permission checks should use these helpers — never hardcode role checks.
// ─────────────────────────────────────────────────────────────────────────────

/** Roles that have full admin access */
export const ADMIN_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
];

/** Roles that can manage users */
export const USER_MANAGEMENT_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
];

/** Roles that can view audit logs */
export const AUDIT_LOG_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
];

/** Roles that can manage school settings */
export const SETTINGS_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
];

/** Roles that can access financial data */
export const FINANCE_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
  UserRoleEnum.Accountant,
  UserRoleEnum.AccountLead,
];

/** Roles that can approve financial transactions */
export const FINANCE_APPROVAL_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
  UserRoleEnum.AccountLead,
];

/** Roles with teaching responsibilities */
export const TEACHING_ROLES: UserRoleEnum[] = [
  UserRoleEnum.SuperAdministrator,
  UserRoleEnum.Director,
  UserRoleEnum.Teacher,
];

// ─────────────────────────────────────────────────────────────────────────────
// Permission Checker Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Check if a role has access to a given permission group */
export function hasPermission(
  userRole: UserRoleEnum | string | null | undefined,
  allowedRoles: UserRoleEnum[]
): boolean {
  if (!userRole) return false;
  // Super Administrator always has all permissions
  if (userRole === UserRoleEnum.SuperAdministrator) return true;
  return allowedRoles.includes(userRole as UserRoleEnum);
}

export const can = {
  manageUsers: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, USER_MANAGEMENT_ROLES),
  viewAuditLogs: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, AUDIT_LOG_ROLES),
  manageSettings: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, SETTINGS_ROLES),
  accessFinance: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, FINANCE_ROLES),
  approveTransactions: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, FINANCE_APPROVAL_ROLES),
  teach: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, TEACHING_ROLES),
  isAdmin: (role: UserRoleEnum | string | null | undefined) =>
    hasPermission(role, ADMIN_ROLES),
};
