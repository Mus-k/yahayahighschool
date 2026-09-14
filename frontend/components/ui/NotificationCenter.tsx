'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Trash2, ExternalLink, Clock, AlertCircle,
  CheckCircle2, Info, AlertTriangle, X, ShieldAlert, BookOpen,
  DollarSign, GraduationCap, Mail, MessageSquare
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/services/api.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useNotifications } from '@/hooks/useNotifications';
import { Link } from '@/i18n/routing';

interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'academic' | 'finance';
  channel?: 'in-app' | 'email' | 'sms' | 'whatsapp';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'academic' | 'finance'>('all');

  const {
    notifications: rawNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const notifications: NotificationItem[] = rawNotifications.map((n) => {
    let type: NotificationItem['type'] = 'info';
    const titleLower = (n.title || '').toLowerCase();
    const bodyLower = (n.body || '').toLowerCase();
    
    if (
      titleLower.includes('exam') || 
      titleLower.includes('homework') || 
      titleLower.includes('result') || 
      titleLower.includes('grade') || 
      n.relatedEntity === 'CourseOffering' || 
      n.relatedEntity === 'Homework'
    ) {
      type = 'academic';
    } else if (
      titleLower.includes('fee') || 
      titleLower.includes('invoice') || 
      titleLower.includes('payment') || 
      titleLower.includes('billing') || 
      n.relatedEntity === 'Invoice' || 
      n.relatedEntity === 'Payment'
    ) {
      type = 'finance';
    } else if (n.priority === 'urgent') {
      type = 'alert';
    } else if (n.priority === 'high') {
      type = 'warning';
    }

    const isRead = n.status === 'read' || n.recordStatus === 'read' || (n as any).status === 'read' || (n as any).recordStatus === 'read';

    return {
      id: n.id,
      title: n.title,
      message: n.body,
      type,
      channel: 'in-app',
      isRead,
      createdAt: n.createdAt,
      link: (n as any).link || (n.metadata?.link as string) || undefined,
    };
  });

  const handleMarkAsRead = async (id: number | string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id: number | string) => {
    await deleteNotification(id);
    toast.success('Notification removed');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'academic') return n.type === 'academic' || n.title.toLowerCase().includes('homework') || n.title.toLowerCase().includes('exam');
    if (activeTab === 'finance') return n.type === 'finance' || n.title.toLowerCase().includes('fee') || n.title.toLowerCase().includes('payment');
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'academic': return <BookOpen className="w-4 h-4 text-sky-500" />;
      case 'finance': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/10 text-xs font-medium">
                {(['all', 'unread', 'academic', 'finance'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg capitalize transition-colors',
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-3.5 transition-colors flex items-start gap-3 relative group',
                        !n.isRead ? 'bg-primary/5' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Link
                            href={`/messages?id=${n.id}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>Reply / Open Message</span>
                          </Link>
                          {n.link && (
                            <a
                              href={n.link}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                            >
                              <span>View Action</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            title="Mark as read"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          title="Delete"
                          className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No {activeTab !== 'all' ? activeTab : ''} notifications</p>
                    <p className="text-xs mt-0.5">You&apos;re all caught up!</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Messages Hub →</span>
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-primary font-medium hover:underline"
                >
                  Full History →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
