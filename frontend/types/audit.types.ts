import type { StrapiEntity } from './api.types';
import type { AuditActionEnum, AuditSeverityEnum } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Audit Log Types
// ─────────────────────────────────────────────────────────────────────────────

/** Audit log entry */
export interface AuditLog extends StrapiEntity {
  action: AuditActionEnum | string;
  entity: string | null;
  entityId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: AuditSeverityEnum;
  performedBy: {
    id: number;
    username: string;
    email: string;
    schoolId?: string;
  } | null;
}

/** Filters for audit log queries */
export interface AuditLogFilters {
  action?: string;
  entity?: string;
  severity?: AuditSeverityEnum | '';
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** Log action payload (for client-side logging via API) */
export interface LogActionPayload {
  action: string;
  entity?: string;
  entityId?: string | number;
  description?: string;
  metadata?: Record<string, unknown>;
}
