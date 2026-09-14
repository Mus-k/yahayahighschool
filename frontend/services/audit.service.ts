import { apiClient, normalizeError } from './api.service';
import type { AuditLog, AuditLogFilters, LogActionPayload } from '@/types/audit.types';
import type { PaginatedResponse } from '@/types/api.types';
import { PAGINATION } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Audit Log Service
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string | number;
  user: string;
  role: string;
  action: string;
  target?: string;
  module: string;
  severity: 'info' | 'normal' | 'warning' | 'high' | 'critical';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  /**
   * Get paginated audit logs with optional filtering.
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      const {
        action,
        entity,
        severity,
        performedBy,
        dateFrom,
        dateTo,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      } = filters;

      const queryFilters: Record<string, unknown> = {};

      if (action) queryFilters.action = { $containsi: action };
      if (entity) queryFilters.entity = { $eq: entity };
      if (severity) queryFilters.severity = { $eq: severity };
      if (performedBy) queryFilters.performedBy = { id: { $eq: performedBy } };
      if (dateFrom) queryFilters.createdAt = { $gte: dateFrom };
      if (dateTo) {
        queryFilters.createdAt = {
          ...(queryFilters.createdAt as object ?? {}),
          $lte: dateTo,
        };
      }

      const { data } = await apiClient.get('/audit-logs', {
        params: {
          filters: queryFilters,
          pagination: { page, pageSize },
          sort: 'createdAt:desc',
          populate: ['performedBy'],
        },
      });

      return {
        data: data.data as AuditLog[],
        pagination: data.meta?.pagination || { page: 1, pageSize, pageCount: 1, total: (data.data || []).length },
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Fetch and normalize all real-time platform user activity and workflow logs.
   */
  async getActivityLogs(params: { search?: string; module?: string; role?: string; severity?: string } = {}): Promise<ActivityItem[]> {
    const list: ActivityItem[] = [];

    try {
      const [auditRes, academicRes] = await Promise.all([
        apiClient.get('/audit-logs', {
          params: { pagination: { limit: 100 }, sort: 'createdAt:desc', populate: ['performedBy'] }
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/academic-audit-logs', {
          params: { pagination: { limit: 100 }, sort: 'createdAt:desc' }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      const auditData = auditRes.data?.data || [];
      auditData.forEach((a: any) => {
        const perf = a.performedBy || a.attributes?.performedBy?.data?.attributes || {};
        const username = perf.username || perf.name || a.performedBy?.email || 'System User';
        const role = perf.role?.name || perf.roleName || (username.toLowerCase().includes('admin') ? 'Super Admin' : 'Staff');
        const entity = a.entity || a.attributes?.entity || 'System';
        
        let moduleName = 'System';
        const entLower = entity.toLowerCase();
        if (entLower.includes('student') || entLower.includes('teacher') || entLower.includes('parent') || entLower.includes('section')) moduleName = 'Directory';
        else if (entLower.includes('finance') || entLower.includes('invoice') || entLower.includes('budget') || entLower.includes('receipt') || entLower.includes('expense')) moduleName = 'Finance';
        else if (entLower.includes('quran') || entLower.includes('hifz') || entLower.includes('halaqah')) moduleName = 'QMS';
        else if (entLower.includes('course') || entLower.includes('grade') || entLower.includes('exam') || entLower.includes('lesson')) moduleName = 'LMS';
        else if (entLower.includes('hostel') || entLower.includes('room') || entLower.includes('bed')) moduleName = 'Hostel';
        else if (entLower.includes('auth') || entLower.includes('user') || entLower.includes('role') || entLower.includes('session')) moduleName = 'Security';

        const rawSev = (a.severity || a.attributes?.severity || 'info').toLowerCase();
        let sev: ActivityItem['severity'] = 'normal';
        if (rawSev.includes('crit')) sev = 'critical';
        else if (rawSev.includes('high') || rawSev.includes('err')) sev = 'high';
        else if (rawSev.includes('warn')) sev = 'warning';
        else if (rawSev.includes('info')) sev = 'info';

        list.push({
          id: a.documentId || a.id,
          user: username,
          role,
          action: a.action || a.attributes?.action || a.description || 'System Activity',
          target: a.entityId ? `${entity} #${a.entityId}` : entity,
          module: moduleName,
          severity: sev,
          timestamp: a.createdAt || a.attributes?.createdAt || new Date().toISOString(),
          ipAddress: a.ipAddress || a.attributes?.ipAddress || '127.0.0.1',
          userAgent: a.userAgent || a.attributes?.userAgent || 'Internal System Client',
          metadata: a.metadata || a.attributes?.metadata
        });
      });

      const academicData = academicRes.data?.data || [];
      academicData.forEach((ac: any) => {
        const actor = ac.actor || ac.attributes?.actor || 'Faculty User';
        const entityType = ac.entityType || ac.attributes?.entityType || 'Academic';
        const entityId = ac.entityId || ac.attributes?.entityId;

        list.push({
          id: `ACAD-${ac.documentId || ac.id}`,
          user: actor,
          role: 'Academic Lead',
          action: ac.action || ac.attributes?.action || 'Academic Record Mutation',
          target: entityId ? `${entityType} #${entityId}` : entityType,
          module: 'LMS',
          severity: 'normal',
          timestamp: ac.timestamp || ac.createdAt || ac.attributes?.createdAt || new Date().toISOString(),
          ipAddress: ac.ipAddress || ac.attributes?.ipAddress || '127.0.0.1',
          userAgent: ac.browser || 'Browser Client'
        });
      });
    } catch {}

    // Sort descending by timestamp
    return list.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
  },

  /**
   * Log a client-side action to the audit trail via API.
   */
  async logAction(payload: LogActionPayload): Promise<void> {
    try {
      await apiClient.post('/audit-logs', {
        data: {
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId != null ? String(payload.entityId) : undefined,
          description: payload.description,
          metadata: payload.metadata,
        },
      });
    } catch {
      // Audit log failures should not propagate to the UI
    }
  },
};
