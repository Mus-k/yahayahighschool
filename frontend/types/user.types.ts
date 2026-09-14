import type { StrapiEntity } from './api.types';
import type { GenderEnum, LanguageEnum, UserRoleEnum } from './enums';
import type { StrapiRole, StrapiMediaFile } from './auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — User Management Types
// ─────────────────────────────────────────────────────────────────────────────

/** Full school user record */
export interface SchoolUser extends StrapiEntity {
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  schoolId: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  nationality: string | null;
  gender: GenderEnum | null;
  dateOfBirth: string | null;
  address: string | null;
  preferredLanguage: LanguageEnum;
  isActive: boolean;
  lastLogin: string | null;
  avatar: StrapiMediaFile | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  photo?: StrapiMediaFile | null;
  role: StrapiRole | null;
}

/** Payload for creating a new user */
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  nationality?: string;
  gender?: GenderEnum;
  dateOfBirth?: string;
  address?: string;
  preferredLanguage?: LanguageEnum;
  roleId: number;
  isActive?: boolean;
  confirmed?: boolean;
  blocked?: boolean;
}

/** Payload for updating an existing user */
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  nationality?: string;
  gender?: GenderEnum;
  dateOfBirth?: string;
  address?: string;
  preferredLanguage?: LanguageEnum;
  isActive?: boolean;
  blocked?: boolean;
  // schoolId is intentionally omitted — it's immutable
}

/** User list filter parameters */
export interface UserFilterParams {
  search?: string;
  role?: UserRoleEnum | '';
  isActive?: boolean | '';
  page?: number;
  pageSize?: number;
  sort?: string;
}

/** Email availability check response */
export interface EmailAvailabilityResponse {
  available: boolean;
  message?: string;
}

/** User display name utilities */
export const getUserDisplayName = (user: Partial<SchoolUser>): string => {
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.username) return user.username;
  return user.email ?? 'Unknown User';
};

/** Get user initials for avatar fallback */
export const getUserInitials = (user: Partial<SchoolUser>): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
  if (user.username) return user.username.substring(0, 2).toUpperCase();
  return '??';
};
