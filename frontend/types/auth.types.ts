import type { StrapiEntity } from './api.types';
import type { LanguageEnum, UserRoleEnum } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Authentication Types
// ─────────────────────────────────────────────────────────────────────────────

/** Login form credentials */
export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

/** JWT access + refresh token pair returned by Strapi */
export interface AuthTokens {
  jwt: string;
  refreshToken?: string;
}

/** Decoded JWT payload (standard claims + custom) */
export interface JWTPayload {
  id: number;
  iat: number;
  exp: number;
}

/** Strapi user role object */
export interface StrapiRole extends StrapiEntity {
  name: string;
  description: string;
  type: string;
}

/** Extended user profile as stored in Strapi */
export interface AuthUser extends StrapiEntity {
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
  gender: 'male' | 'female' | null;
  dateOfBirth: string | null;
  address: string | null;
  profile?: any;
  preferredLanguage: LanguageEnum;
  isActive: boolean;
  lastLogin: string | null;
  avatar: StrapiMediaFile | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  role: StrapiRole | null;
}

/** Strapi upload file object */
export interface StrapiMediaFile {
  id: number;
  name: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  size?: number;
  mime?: string;
  hash?: string;
  formats?: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  };
}

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

/** Strapi login response */
export interface LoginResponse {
  jwt: string;
  user: AuthUser;
}

/** Forgot password request */
export interface ForgotPasswordPayload {
  email: string;
}

/** Reset password request */
export interface ResetPasswordPayload {
  code: string;
  password: string;
  passwordConfirmation: string;
}

/** Email verification request */
export interface VerifyEmailPayload {
  confirmation: string;
}

/** Auth context state */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRoleEnum | null;
}

/** Auth context actions */
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export type AuthContextValue = AuthState & AuthActions;
