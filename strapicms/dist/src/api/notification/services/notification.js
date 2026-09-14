"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::notification.notification', ({ strapi }) => ({
    /**
     * Queue a notification for delivery.
     * Channel handling (email, SMS, push) will be added in future phases.
     */
    async send(payload) {
        var _a, _b;
        try {
            await strapi.db.query('api::notification.notification').create({
                data: {
                    title: payload.title,
                    body: payload.body,
                    channel: (_a = payload.channel) !== null && _a !== void 0 ? _a : 'dashboard',
                    priority: (_b = payload.priority) !== null && _b !== void 0 ? _b : 'normal',
                    status: 'pending',
                    metadata: payload.metadata,
                    scheduledAt: payload.scheduledAt,
                    relatedEntity: payload.relatedEntity,
                    relatedEntityId: payload.relatedEntityId,
                    recipient: payload.recipientId,
                    sender: payload.senderId,
                },
            });
        }
        catch (error) {
            strapi.log.error('[Notification] Failed to queue notification:', error);
        }
    },
    /**
     * Mark a notification as read.
     */
    async markAsRead(notificationId) {
        await strapi.db.query('api::notification.notification').update({
            where: { id: notificationId },
            data: { status: 'read', readAt: new Date() },
        });
    },
    /**
     * Get unread notifications for a user.
     */
    async getUnreadForUser(userId) {
        return strapi.db.query('api::notification.notification').findMany({
            where: { recipient: userId, status: { $in: ['pending', 'sent'] } },
            orderBy: { createdAt: 'desc' },
            limit: 50,
        });
    },
}));
