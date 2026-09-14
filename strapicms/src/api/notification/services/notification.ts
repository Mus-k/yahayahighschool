import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::notification.notification', ({ strapi }) => ({
  /**
   * Queue a notification for delivery.
   * Channel handling (email, SMS, push) will be added in future phases.
   */
  async send(payload: {
    title: string;
    body: string;
    recipientId: number;
    senderId?: number;
    channel?: 'dashboard' | 'email' | 'sms' | 'whatsapp' | 'push';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, unknown>;
    scheduledAt?: Date;
    relatedEntity?: string;
    relatedEntityId?: string;
  }): Promise<void> {
    try {
      await strapi.db.query('api::notification.notification').create({
        data: {
          title: payload.title,
          body: payload.body,
          channel: payload.channel ?? 'dashboard',
          priority: payload.priority ?? 'normal',
          status: 'pending',
          metadata: payload.metadata,
          scheduledAt: payload.scheduledAt,
          relatedEntity: payload.relatedEntity,
          relatedEntityId: payload.relatedEntityId,
          recipient: payload.recipientId,
          sender: payload.senderId,
        },
      });
    } catch (error) {
      strapi.log.error('[Notification] Failed to queue notification:', error);
    }
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: number): Promise<void> {
    await strapi.db.query('api::notification.notification').update({
      where: { id: notificationId },
      data: { status: 'read', readAt: new Date() },
    });
  },

  /**
   * Get unread notifications for a user.
   */
  async getUnreadForUser(userId: number) {
    return strapi.db.query('api::notification.notification').findMany({
      where: { recipient: userId, status: { $in: ['pending', 'sent'] } },
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });
  },
}));
