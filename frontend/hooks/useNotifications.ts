'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/services/api.service';
import type { Notification } from '@/types/notification.types';
import {
  NotificationChannelEnum,
  NotificationPriorityEnum,
  NotificationStatusEnum
} from '@/types/enums';

const STORAGE_KEY = 'yahayaschool_notifications';

// Default mock dispatches if API has no records
function generateDefaultNotifications(role: string | null): Partial<Notification>[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

  if (role === 'teacher') {
    return [
      { id: 101, title: 'Homework Submitted', body: 'Ahmad Abdullahi submitted Biology SS3 Homework #4.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 102, title: 'Exam Timetable Published', body: 'First Term Examination schedule is now live.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 103, title: 'Student Absent Alert', body: 'Fatima Musa was marked absent in Chemistry Section A.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  } else if (role === 'student') {
    return [
      { id: 201, title: 'Homework Due Soon', body: 'Mathematics Trigonometry assignment is due tomorrow at 8:00 AM.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 202, title: 'Results Published', body: 'Mid-term continuous assessment scores are now available.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
    ];
  } else if (role === 'parent') {
    return [
      { id: 301, title: 'Fee Due Reminder', body: 'Second Term Tuition Fee balance is due by Friday.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 302, title: 'Child Attendance Alert', body: 'Your ward Yusuf was marked present today at 7:45 AM.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  } else {
    // director / admin / default
    return [
      { id: 1, title: 'Term 2 Final Examination Results Certified', body: 'Academic Director Dr. Ibrahim Touré has officially signed off on all report cards for Section A.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 2, title: 'New Student Admission Application Submitted', body: 'Parent Harith bin Abu Bakr submitted an admission application (#APP-2026-089) for Hifz track.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: twoHoursAgo, sentAt: twoHoursAgo, readAt: null },
      { id: 3, title: 'System Backup & Database Checkpoint Completed', body: 'Database automated snapshot verified and saved to local storage.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
      { id: 4, title: 'Attendance Batch Warning: Section B', body: '5 students in Section B marked absent for more than 3 consecutive Qur\'anic Halaqah sessions.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  }
}

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const { userRole } = usePermissions();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      // 1. Try API with current user's ID
      const res = await notificationService.getMyNotifications({ 
        recipientId: user.id,
        pageSize: 50 
      });
      const apiList = (res?.data || []).map(n => ({
        ...n,
        status: (n.status || n.recordStatus || 'pending') as NotificationStatusEnum,
        recordStatus: (n.recordStatus || n.status || 'pending') as NotificationStatusEnum,
      }));
      
      setNotifications(apiList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiList));
    } catch (err) {
      // Offline fallback
      const localStr = localStorage.getItem(STORAGE_KEY);
      if (localStr) {
        setNotifications(JSON.parse(localStr));
      } else {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    loadNotifications();

    const handleUpdate = (e?: any) => {
      const detail = e?.detail;
      if (detail?.action === 'read' && (detail.id || detail.documentId)) {
        setNotifications(prev => {
          const next = prev.map(n => 
            (n.id === detail.id || n.documentId === detail.documentId || n.id === detail.documentId)
              ? { ...n, status: NotificationStatusEnum.Read, recordStatus: NotificationStatusEnum.Read, readAt: new Date().toISOString() }
              : n
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } else if (detail?.action === 'read-all') {
        setNotifications(prev => {
          const next = prev.map(n => ({ ...n, status: NotificationStatusEnum.Read, recordStatus: NotificationStatusEnum.Read, readAt: new Date().toISOString() }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } else if (detail?.action === 'delete' && (detail.id || detail.documentId)) {
        setNotifications(prev => {
          const next = prev.filter(n => n.id !== detail.id && n.documentId !== detail.documentId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } else {
        const localStr = localStorage.getItem(STORAGE_KEY);
        if (localStr) {
          try { setNotifications(JSON.parse(localStr)); } catch { /* ignore */ }
        }
      }
    };

    window.addEventListener('notifications-update', handleUpdate);
    window.addEventListener('focus', () => loadNotifications());

    // Periodic background sync every 30s
    const timer = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      window.removeEventListener('notifications-update', handleUpdate);
      window.removeEventListener('focus', () => loadNotifications());
      clearInterval(timer);
    };
  }, [loadNotifications]);

  const notifyChange = (detail?: any) => {
    window.dispatchEvent(new CustomEvent('notifications-update', { detail }));
  };

  const markAsRead = async (id: number | string) => {
    const updated = notifications.map(n => 
      (n.id === id || n.documentId === id) ? { ...n, status: NotificationStatusEnum.Read, recordStatus: NotificationStatusEnum.Read, readAt: new Date().toISOString() } : n
    );
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange({ id, action: 'read' });

    try {
      const match = notifications.find(n => n.id === id || n.documentId === id);
      const target = match?.documentId || id;
      await notificationService.markAsRead(target);
    } catch {
      // Silent catch for offline capability
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ 
      ...n, 
      status: NotificationStatusEnum.Read, 
      recordStatus: NotificationStatusEnum.Read,
      readAt: new Date().toISOString() 
    }));
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange({ action: 'read-all' });

    try {
      if (user?.id) {
        await notificationService.markAllAsRead(user.id);
      }
    } catch {
      // Silent catch
    }
  };

  const deleteNotification = async (id: number | string) => {
    const updated = notifications.filter(n => n.id !== id && n.documentId !== id);
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange({ id, action: 'delete' });

    try {
      const match = notifications.find(n => n.id === id || n.documentId === id);
      const target = match?.documentId || id;
      await apiClient.delete(`/notifications/${target}`);
    } catch {
      // Silent catch
    }
  };

  const unreadCount = notifications.filter(n => 
    n.status !== NotificationStatusEnum.Read && 
    n.recordStatus !== NotificationStatusEnum.Read &&
    (n as any).status !== 'read' &&
    (n as any).recordStatus !== 'read'
  ).length;

  return {
    notifications,
    unreadCount,
    isLoading: loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
}
