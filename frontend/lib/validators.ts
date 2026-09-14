import { z } from 'zod';
import { SCHOOL_ID } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Shared Zod Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ──────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]{7,20}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

export const schoolIdSchema = z
  .string()
  .regex(SCHOOL_ID.PATTERN, 'Invalid School ID format (e.g., AC000000001)')
  .optional();

// ── Authentication Schemas ───────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, 'Please confirm your password'),
    code: z.string().min(1, 'Reset code is required'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ── User Schemas ─────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  email: emailSchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(60, 'Username must be less than 60 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens'),
  password: passwordSchema,
  phone: phoneSchema,
  nationality: z.string().max(100).optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'ar', 'fr', 'tr']).default('en'),
  roleId: z.number().int().positive({ message: 'Role is required' }),
});
export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(200).optional(),
  phone: phoneSchema,
  nationality: z.string().max(100).optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'ar', 'fr', 'tr']).optional(),
});
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// ── School Profile Schema ────────────────────────────────────────────────────

export const schoolProfileSchema = z.object({
  schoolName: z.string().min(1, 'School name is required').max(200),
  motto: z.string().max(500).optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  defaultLanguage: z.enum(['en', 'ar', 'fr', 'tr']).optional(),
});
export type SchoolProfileFormData = z.infer<typeof schoolProfileSchema>;
