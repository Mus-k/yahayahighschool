// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Global Enumerations
// All enums used across the platform are centralized here.
// ─────────────────────────────────────────────────────────────────────────────

/** Platform roles matching the Strapi users-permissions roles */
export enum UserRoleEnum {
  SuperAdministrator = 'super-administrator',
  Director = 'director',
  Teacher = 'teacher',
  Student = 'student',
  Parent = 'parent',
  Worker = 'worker',
  Accountant = 'accountant',
  AccountLead = 'account-lead',
  Driver = 'driver',
  Authenticated = 'authenticated',
  Public = 'public',
}

/** Supported display languages */
export enum LanguageEnum {
  English = 'en',
  Arabic = 'ar',
  French = 'fr',
  Turkish = 'tr',
}

/** Text direction based on language */
export enum DirectionEnum {
  LTR = 'ltr',
  RTL = 'rtl',
}

/** Notification delivery channels */
export enum NotificationChannelEnum {
  Dashboard = 'dashboard',
  Email = 'email',
  SMS = 'sms',
  WhatsApp = 'whatsapp',
  Push = 'push',
}

/** Notification delivery status */
export enum NotificationStatusEnum {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Read = 'read',
}

/** Notification priority */
export enum NotificationPriorityEnum {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

/** Audit log severity levels */
export enum AuditSeverityEnum {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

/** Common audit action identifiers */
export enum AuditActionEnum {
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  LoginFailed = 'LOGIN_FAILED',
  PasswordChanged = 'PASSWORD_CHANGED',
  PasswordReset = 'PASSWORD_RESET',
  EmailVerified = 'EMAIL_VERIFIED',
  UserCreated = 'USER_CREATED',
  UserUpdated = 'USER_UPDATED',
  UserDeleted = 'USER_DELETED',
  RoleChanged = 'ROLE_CHANGED',
  PermissionChanged = 'PERMISSION_CHANGED',
  FileUploaded = 'FILE_UPLOADED',
  FileDeleted = 'FILE_DELETED',
  SettingChanged = 'SETTING_CHANGED',
  FinancialTransactionCreated = 'FINANCIAL_TRANSACTION_CREATED',
  FinancialTransactionApproved = 'FINANCIAL_TRANSACTION_APPROVED',
  FinancialTransactionRejected = 'FINANCIAL_TRANSACTION_REJECTED',
}

/** User account status */
export enum UserStatusEnum {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Pending = 'pending',
}

/** Gender options */
export enum GenderEnum {
  Male = 'male',
  Female = 'female',
}

/** Theme mode */
export enum ThemeModeEnum {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

/** File types supported for upload */
export enum FileTypeEnum {
  Image = 'image',
  Video = 'video',
  PDF = 'pdf',
  Word = 'word',
  Excel = 'excel',
  Audio = 'audio',
  Other = 'other',
}

/** RTL languages */
export const RTL_LANGUAGES: LanguageEnum[] = [LanguageEnum.Arabic];

/** Check if a language is RTL */
export const isRTL = (locale: string): boolean =>
  RTL_LANGUAGES.includes(locale as LanguageEnum);
