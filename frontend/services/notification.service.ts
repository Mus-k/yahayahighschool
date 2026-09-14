import { apiClient, normalizeError } from './api.service';
import type { Notification, NotificationFilters, CreateNotificationPayload } from '@/types/notification.types';
import { NotificationStatusEnum } from '@/types/enums';
import type { PaginatedResponse } from '@/types/api.types';
import { PAGINATION } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Notification Service
// ─────────────────────────────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Get notifications for the current user.
   */
  async getMyNotifications(filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const {
        status,
        channel,
        priority,
        recipientId,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      } = filters;

      const queryFilters: Record<string, unknown> = {};
      if (status) queryFilters.recordStatus = { $eq: status };
      if (channel) queryFilters.channel = { $eq: channel };
      if (priority) queryFilters.priority = { $eq: priority };
      if (recipientId) queryFilters.recipient = { id: { $eq: recipientId } };

      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
          pagination: { page, pageSize },
          sort: 'createdAt:desc',
          populate: ['sender'],
        },
      });

      const notifications = (data.data as Notification[]).map(n => ({
        ...n,
        status: (n.status || n.recordStatus || 'pending') as NotificationStatusEnum
      }));

      return {
        data: notifications,
        pagination: data.meta.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get count of unread notifications.
   */
  async getUnreadCount(recipientId?: number): Promise<number> {
    try {
      const queryFilters: any = { recordStatus: { $in: ['pending', 'sent'] } };
      if (recipientId) {
        queryFilters.recipient = { id: { $eq: recipientId } };
      }
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
          pagination: { page: 1, pageSize: 1 },
          fields: ['id'],
        },
      });
      return data.meta?.pagination?.total ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(idOrDocId: number | string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${idOrDocId}`, {
        data: { recordStatus: 'read', readAt: new Date().toISOString() },
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(recipientId?: number): Promise<void> {
    try {
      const queryFilters: any = { recordStatus: { $in: ['pending', 'sent'] } };
      if (recipientId) {
        queryFilters.recipient = { id: { $eq: recipientId } };
      }

      // Get all unread notification IDs
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
          pagination: { page: 1, pageSize: 100 },
          fields: ['id', 'documentId'],
        },
      });

      const items = (data.data as Array<{ id: number; documentId?: string }>);

      await Promise.all(
        items.map((n) => notificationService.markAsRead(n.documentId || n.id))
      );
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Create and send a new notification / message.
   */
  async sendNotification(payload: CreateNotificationPayload): Promise<void> {
    try {
      const data: Record<string, any> = {
        title: payload.title,
        body: payload.body,
        channel: payload.channel ?? 'dashboard',
        priority: payload.priority ?? 'normal',
        metadata: payload.metadata ?? null,
        scheduledAt: payload.scheduledAt ?? null,
        sentAt: new Date().toISOString(),
        relatedEntity: payload.relatedEntity ?? null,
        relatedEntityId: payload.relatedEntityId ?? null,
        recordStatus: 'sent',
      };

      if (payload.recipientId && payload.recipientId > 0) {
        data.recipient = payload.recipientId;
      }
      if (payload.senderId && payload.senderId > 0) {
        data.sender = payload.senderId;
      }

      await apiClient.post('/notifications', { data });
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
