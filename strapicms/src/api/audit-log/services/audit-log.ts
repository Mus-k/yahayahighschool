import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::audit-log.audit-log', ({ strapi }) => ({
  /**
   * Log an action to the audit trail.
   * Called from bootstrap lifecycle hooks and API controllers.
   */
  async log(payload: {
    action: string;
    entity?: string;
    entityId?: string | number;
    description?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    performedBy?: number;
  }): Promise<void> {
    try {
      await strapi.db.query('api::audit-log.audit-log').create({
        data: {
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId ? String(payload.entityId) : undefined,
          description: payload.description,
          metadata: payload.metadata,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          severity: payload.severity ?? 'info',
          performedBy: payload.performedBy,
        },
      });
    } catch (error) {
      // Audit logging should never throw — log the error but don't propagate
      strapi.log.error(`[AuditLog] Failed to write audit entry for action "${payload.action}":`, error);
    }
  },
}));
