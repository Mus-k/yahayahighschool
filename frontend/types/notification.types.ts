import type { StrapiEntity } from './api.types';
import type {
  NotificationChannelEnum,
  NotificationPriorityEnum,
  NotificationStatusEnum,
} from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Notification Types
// ─────────────────────────────────────────────────────────────────────────────

/** A notification record */
export interface Notification extends StrapiEntity {
  title: string;
  body: string;
  channel: NotificationChannelEnum;
  status?: NotificationStatusEnum;
  recordStatus?: NotificationStatusEnum;
  priority: NotificationPriorityEnum;
  metadata: Record<string, unknown> | null;
  scheduledAt: string | null;
  sentAt: string | null;
  readAt: string | null;
  relatedEntity: string | null;
  relatedEntityId: string | null;
  recipient: { id: number; username: string } | null;
  sender: { id: number; username: string } | null;
}

/** Payload for creating a notification */
export interface CreateNotificationPayload {
  title: string;
  body: string;
  channel?: NotificationChannelEnum;
  priority?: NotificationPriorityEnum;
  recipientId?: number;
  senderId?: number;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
}

/** Notification filters */
export interface NotificationFilters {
  status?: NotificationStatusEnum | '';
  channel?: NotificationChannelEnum | '';
  priority?: NotificationPriorityEnum | '';
  page?: number;
  pageSize?: number;
  recipientId?: number;
}
