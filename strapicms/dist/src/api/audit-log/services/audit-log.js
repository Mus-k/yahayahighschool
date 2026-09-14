"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::audit-log.audit-log', ({ strapi }) => ({
    /**
     * Log an action to the audit trail.
     * Called from bootstrap lifecycle hooks and API controllers.
     */
    async log(payload) {
        var _a;
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
                    severity: (_a = payload.severity) !== null && _a !== void 0 ? _a : 'info',
                    performedBy: payload.performedBy,
                },
            });
        }
        catch (error) {
            // Audit logging should never throw — log the error but don't propagate
            strapi.log.error(`[AuditLog] Failed to write audit entry for action "${payload.action}":`, error);
        }
    },
}));
