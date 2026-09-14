'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare, Send, Search, Star, Trash2, CheckCheck,
  Plus, RefreshCw, X, Inbox, Mail,
  Users, UserCheck, Reply,
  Bell, Archive, Eye, EyeOff, Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { notificationService } from '@/services/notification.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageThread {
  id: string | number;
  documentId?: string;
  subject: string;
  body: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  senderInitials: string;
  recipientId?: number;
  recipientName?: string;
  recipientGroup?: string;
  channel: 'dashboard' | 'email' | 'sms' | 'whatsapp' | 'push';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recordStatus: 'pending' | 'sent' | 'read';
  isStarred: boolean;
  isArchived: boolean;
  sentAt: string;
  readAt?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
}

interface ContactUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleType: string;
  roleLabel: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function priorityColor(p: string) {
  if (p === 'urgent') return 'bg-rose-500/10 text-rose-600 border-rose-400/40 dark:text-rose-400';
  if (p === 'high') return 'bg-amber-500/10 text-amber-700 border-amber-400/40 dark:text-amber-400';
  if (p === 'normal') return 'bg-sky-500/10 text-sky-700 border-sky-400/40 dark:text-sky-400';
  return 'bg-slate-100 text-slate-500 border-slate-300/40 dark:bg-slate-800 dark:text-slate-400';
}

function roleColor(role: string) {
  const lc = role.toLowerCase();
  if (lc.includes('admin') || lc.includes('principal') || lc.includes('director')) return 'bg-violet-600';
  if (lc.includes('teacher') || lc.includes('faculty') || lc.includes('sheikh') || lc.includes('ustadh')) return 'bg-emerald-600';
  if (lc.includes('parent') || lc.includes('guardian')) return 'bg-amber-500';
  if (lc.includes('student') || lc.includes('scholar')) return 'bg-sky-600';
  if (lc.includes('cashier') || lc.includes('finance')) return 'bg-teal-600';
  if (lc.includes('registrar') || lc.includes('academic')) return 'bg-indigo-600';
  if (lc.includes('operations') || lc.includes('campus')) return 'bg-orange-600';
  return 'bg-slate-600';
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '??';
}

function roleLabelFromType(type: string): string {
  const map: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrator',
    principal: 'Principal / Head',
    teacher: 'Faculty / Teacher',
    student: 'Scholar / Student',
    parent: 'Parent / Guardian',
    cashier: 'Finance Cashier',
    librarian: 'Librarian',
    worker: 'School Worker',
    authenticated: 'Staff Member',
    public: 'Guest',
  };
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Channel Badge ─────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    dashboard: { label: 'Portal', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
    email: { label: 'Email', cls: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
    sms: { label: 'SMS', cls: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800' },
    whatsapp: { label: 'WhatsApp', cls: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800' },
    push: { label: 'Push', cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  };
  const c = cfg[channel] || cfg.dashboard;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Fallback Data ────────────────────────────────────────────────────────────
const FALLBACK_MESSAGES: MessageThread[] = [
  {
    id: 'MSG-001',
    subject: 'Juz 15 Memorization Assessment Results — SS3',
    body: `Assalamu Alaikum wa Rahmatullahi wa Barakatuh,\n\nThe oral evaluation scores for Juz 15 and Tajweed articulation have been published across the portal. All scholars in SS3 - Section A have been assessed on Madd, Ghunnah, Ikhfa, and Qalqalah rules.\n\nThe top performers have been nominated for the annual Hifz Shield. Please log into the LMS portal to view individual score breakdowns and progress tracking charts.\n\nWas-Salamu Alaikum,\nUstadh Ahmad Al-Razi\nHifz & Quranic Studies Lead`,
    senderId: 2, senderName: 'Ustadh Ahmad Al-Razi', senderRole: 'Hifz & Quranic Studies Lead', senderInitials: 'UA',
    recipientGroup: 'All Faculty & Staff', channel: 'dashboard', priority: 'high',
    recordStatus: 'pending', isStarred: true, isArchived: false,
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'MSG-002',
    subject: 'Term 2 Tuition Clearance — Ref #INV-8891',
    body: `Respected Administration,\n\nAssalamu Alaikum. We have initiated the bank wire transfer for Term 2 tuition fees for our ward Zaid Al-Mansoor (Adm #AC00000042). Reference number: INV-8891.\n\nKindly confirm receipt and update the clearance status in the student portal so that examination clearance can proceed accordingly.\n\nJazakAllahu Khairan,\nFatima Al-Mansoor\nParent Guardian`,
    senderId: 3, senderName: 'Fatima Al-Mansoor', senderRole: 'Parent / Guardian', senderInitials: 'FA',
    recipientGroup: 'Finance Department', channel: 'dashboard', priority: 'normal',
    recordStatus: 'pending', isStarred: false, isArchived: false,
    sentAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'MSG-003',
    subject: 'AY 2026/2027 Mid-Term Examination Timetable — Finalized',
    body: `Dear All Faculty & Supervisors,\n\nThe Mid-Term Examination timetable for AY 2026/2027 has been finalized and is now live in the Academic Calendar module.\n\nAll homeroom supervisors and subject teachers are requested to:\n1. Verify invigilation schedules before this Friday\n2. Ensure examination room assignments are confirmed with the Academic Registrar\n3. Submit any timetable conflict reports no later than 48 hours before commencement\n\nThe examination hall seating plans will be distributed by Thursday morning.\n\nAcademic Registrar\nYahaya Camara Islamic School`,
    senderId: 4, senderName: 'Central Academic Registrar', senderRole: 'Academic Administration', senderInitials: 'CA',
    recipientGroup: 'All Teachers & Staff', channel: 'dashboard', priority: 'urgent',
    recordStatus: 'read', isStarred: false, isArchived: false,
    sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    readAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'MSG-004',
    subject: 'Friday Jumuah Prayer & Gate 1 Logistics',
    body: `Assalamu Alaikum,\n\nPlease be advised that Gate 1 entry will be dedicated exclusively to scholar shuttle buses from 11:30 AM onwards every Friday.\n\nStaff and parent vehicles are requested to use Gate 2 (Eastern Campus Entrance) during Jumuah prayer hours (11:30 AM – 2:00 PM).\n\nBarakallahu Fiikum,\nDirector of Operations\nCampus Management`,
    senderId: 5, senderName: 'Director of Operations', senderRole: 'Campus Management', senderInitials: 'DO',
    recipientGroup: 'All Campus Members', channel: 'dashboard', priority: 'normal',
    recordStatus: 'read', isStarred: true, isArchived: false,
    sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    readAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

// ─── Main Content Component ───────────────────────────────────────────────────
function MessagesCenterContent() {
  const searchParams = useSearchParams();
  const targetMsgId = searchParams.get('id');
  const targetRecipientId = searchParams.get('recipientId');
  const shouldCompose = searchParams.get('compose') === 'true';

  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '');
  const canBroadcast = !['student', 'parent'].includes(userRoleStr);

  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'unread' | 'starred' | 'sent' | 'archive'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedMsg, setSelectedMsg] = useState<MessageThread | null>(null);

  const [isComposing, setIsComposing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [composeRecipientType, setComposeRecipientType] = useState<'group' | 'individual'>(canBroadcast ? 'group' : 'individual');
  const [composeGroup, setComposeGroup] = useState('');
  const [composeIndividualId, setComposeIndividualId] = useState<number | ''>('');
  const [composeContactSearch, setComposeContactSearch] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composePriority, setComposePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [composeChannel, setComposeChannel] = useState<'dashboard' | 'email' | 'sms'>('dashboard');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const currentUserId = (user as any)?.id as number | undefined;
  const myName = (user as any)?.firstName
    ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
    : (user as any)?.username || 'Staff Member';

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [notifRes, usersRes] = await Promise.allSettled([
        apiClient.get('/notifications?populate[sender][populate]=role&populate[recipient][populate]=role&sort=createdAt:desc&pagination[pageSize]=100')
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/users?populate=role&pagination[pageSize]=200')
          .catch(() => ({ data: [] })),
      ]);

      const rawU = (usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value?.data) ? usersRes.value.data : usersRes.value?.data?.data)
        : null) || [];
      const parsedContacts: ContactUser[] = rawU.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        email: u.email || '',
        fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || 'Unknown',
        roleType: u.role?.type || 'authenticated',
        roleLabel: roleLabelFromType(u.role?.type || 'authenticated'),
      }));
      setContacts(parsedContacts);

      const rawNotifs = (notifRes.status === 'fulfilled' ? notifRes.value?.data?.data : null) || [];

      if (rawNotifs.length > 0) {
        const parsed: MessageThread[] = rawNotifs.map((n: any) => {
          const s = n.sender || {};
          const sMeta = (n.metadata as any) || {};
          let sName = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.username || s.email || sMeta.senderName;
          let sRole = s.role?.type ? roleLabelFromType(s.role.type) : (sMeta.senderRole || '');
          let sId = s.id || sMeta.senderId || 0;

          // If sender was not populated in relation, resolve from contacts if known or fallback gracefully
          if (!sName) {
            if (sMeta.isBroadcast) {
              sName = sMeta.group ? `Faculty (${sMeta.group})` : 'Institutional Announcement';
              sRole = 'Broadcast Sender';
            } else {
              sName = 'Teacher / Faculty Staff';
              sRole = 'Instructor';
            }
          }
          if (!sRole) {
            sRole = 'Faculty Member';
          }

          const r = n.recipient || {};
          const rName = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.username || undefined;

          return {
            id: n.id,
            documentId: n.documentId,
            subject: n.title || 'No Subject',
            body: n.body || '',
            senderId: sId,
            senderName: sName,
            senderRole: sRole,
            senderInitials: initials(sName),
            recipientId: r.id,
            recipientName: rName,
            recipientGroup: sMeta?.group,
            channel: (n.channel || 'dashboard') as MessageThread['channel'],
            priority: (n.priority || 'normal') as MessageThread['priority'],
            recordStatus: (n.recordStatus || 'pending') as MessageThread['recordStatus'],
            isStarred: Boolean(sMeta?.starred),
            isArchived: Boolean(sMeta?.archived),
            sentAt: n.sentAt || n.createdAt || new Date().toISOString(),
            readAt: n.readAt || undefined,
            relatedEntity: n.relatedEntity || undefined,
            relatedEntityId: n.relatedEntityId || undefined,
          };
        });
        setMessages(parsed);

        // Check if a specific message ID was requested via query param
        let initialMsg: MessageThread | null = null;
        if (targetMsgId) {
          initialMsg = parsed.find(m => String(m.id) === targetMsgId || m.documentId === targetMsgId) || parsed[0] || null;
        } else {
          initialMsg = parsed[0] || null;
        }
        setSelectedMsg(initialMsg);

        // Auto mark selected initial message as read if it's currently unread
        if (initialMsg && initialMsg.recordStatus !== 'read') {
          const targetDocId = initialMsg.documentId || initialMsg.id;
          initialMsg.recordStatus = 'read';
          window.dispatchEvent(new CustomEvent('notifications-update', { detail: { id: initialMsg.id, documentId: initialMsg.documentId, action: 'read' } }));
          if (targetDocId) {
            apiClient.put(`/notifications/${targetDocId}`, { data: { recordStatus: 'read', readAt: new Date().toISOString() } }).catch(() => null);
          }
        }
      } else {
        setMessages(FALLBACK_MESSAGES);
        setSelectedMsg(prev => prev ?? FALLBACK_MESSAGES[0]);
      }

      // Pre-select recipient if specified in URL query params
      if (targetRecipientId) {
        const selUser = parsedContacts.find(c => String(c.id) === targetRecipientId);
        if (selUser) {
          setComposeRecipientType('individual');
          setComposeIndividualId(selUser.id);
          setComposeContactSearch(selUser.fullName);
          setIsComposing(true);
        }
      } else if (shouldCompose) {
        setIsComposing(true);
      }
    } catch {
      setMessages(FALLBACK_MESSAGES);
      setSelectedMsg(prev => prev ?? FALLBACK_MESSAGES[0]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [targetMsgId, targetRecipientId, shouldCompose]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredMessages = useMemo(() => messages.filter(m => {
    if (activeFolder === 'unread' && m.recordStatus === 'read') return false;
    if (activeFolder === 'starred' && !m.isStarred) return false;
    if (activeFolder === 'archive' && !m.isArchived) return false;
    if (activeFolder !== 'archive' && activeFolder !== 'sent' && m.isArchived) return false;
    if (activeFolder === 'sent' && m.senderId !== currentUserId) return false;
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.subject.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q) || m.body.toLowerCase().includes(q);
    }
    return true;
  }), [messages, activeFolder, priorityFilter, searchQuery, currentUserId]);

  const unreadCount = useMemo(() => messages.filter(m => m.recordStatus !== 'read' && !m.isArchived).length, [messages]);
  const starredCount = useMemo(() => messages.filter(m => m.isStarred).length, [messages]);

  const filteredContacts = useMemo(() => {
    if (!composeContactSearch) return contacts.slice(0, 30);
    const q = composeContactSearch.toLowerCase();
    return contacts.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.roleLabel.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [contacts, composeContactSearch]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSelectMessage = async (msg: MessageThread) => {
    setSelectedMsg(msg);
    setReplyText('');
    if (msg.recordStatus !== 'read') {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, recordStatus: 'read' as const, readAt: new Date().toISOString() } : m));
      const targetDocId = msg.documentId || msg.id;
      window.dispatchEvent(new CustomEvent('notifications-update', { detail: { id: msg.id, documentId: msg.documentId, action: 'read' } }));
      try {
        if (targetDocId) {
          await apiClient.put(`/notifications/${targetDocId}`, { data: { recordStatus: 'read', readAt: new Date().toISOString() } });
        }
      } catch { /* silent */ }
    }
  };

  const handleStar = async (msg: MessageThread, e: React.MouseEvent) => {
    e.stopPropagation();
    const starred = !msg.isStarred;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isStarred: starred } : m));
    if (selectedMsg?.id === msg.id) setSelectedMsg(p => p ? { ...p, isStarred: starred } : p);
    try {
      const targetDocId = msg.documentId || msg.id;
      if (targetDocId) {
        await apiClient.put(`/notifications/${targetDocId}`, { data: { metadata: { starred } } });
      }
    } catch { /* silent */ }
  };

  const handleArchive = async (msg: MessageThread) => {
    const archived = !msg.isArchived;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isArchived: archived } : m));
    if (selectedMsg?.id === msg.id) {
      const next = filteredMessages.find(m => m.id !== msg.id) || null;
      setSelectedMsg(next);
    }
    toast.success(archived ? 'Message archived.' : 'Message restored to inbox.');
    try {
      const targetDocId = msg.documentId || msg.id;
      if (targetDocId) {
        await apiClient.put(`/notifications/${targetDocId}`, { data: { metadata: { archived } } });
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (msg: MessageThread) => {
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    if (selectedMsg?.id === msg.id) {
      setSelectedMsg(filteredMessages.find(m => m.id !== msg.id) || null);
    }
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { id: msg.id, documentId: msg.documentId, action: 'delete' } }));
    toast.success('Message deleted.');
    try {
      const targetDocId = msg.documentId || msg.id;
      if (targetDocId) await apiClient.delete(`/notifications/${targetDocId}`);
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setMessages(prev => prev.map(m => ({ ...m, recordStatus: 'read' as const, readAt: new Date().toISOString() })));
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { action: 'read-all' } }));
    toast.success('All messages marked as read.');
    try { await notificationService.markAllAsRead(currentUserId); } catch { /* silent */ }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMsg) return;
    setIsSendingReply(true);
    try {
      let targetRecipientId = selectedMsg.senderId;
      if (!targetRecipientId || targetRecipientId <= 0) {
        const matched = contacts.find(c =>
          c.fullName.toLowerCase() === selectedMsg.senderName.toLowerCase() ||
          c.username.toLowerCase() === selectedMsg.senderName.toLowerCase() ||
          c.email.toLowerCase() === selectedMsg.senderName.toLowerCase()
        );
        if (matched) targetRecipientId = matched.id;
      }

      await notificationService.sendNotification({
        title: `Re: ${selectedMsg.subject}`,
        body: replyText,
        channel: 'dashboard' as any,
        priority: 'normal' as any,
        recipientId: targetRecipientId && targetRecipientId > 0 ? targetRecipientId : undefined,
        senderId: currentUserId && currentUserId > 0 ? currentUserId : undefined,
        metadata: {
          replyToId: selectedMsg.id,
          senderName: myName,
          senderRole: roleLabelFromType(userRoleStr),
          senderId: currentUserId,
        },
        relatedEntity: 'notification',
        relatedEntityId: String(selectedMsg.documentId || selectedMsg.id),
      });

      const sent: MessageThread = {
        id: `LOCAL-${Date.now()}`,
        subject: `Re: ${selectedMsg.subject}`,
        body: replyText,
        senderId: currentUserId || 0,
        senderName: myName,
        senderRole: roleLabelFromType(userRoleStr),
        senderInitials: initials(myName),
        recipientId: targetRecipientId,
        recipientName: selectedMsg.senderName,
        channel: 'dashboard',
        priority: 'normal',
        recordStatus: 'sent',
        isStarred: false,
        isArchived: false,
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [sent, ...prev]);
      setReplyText('');
      toast.success(`Reply dispatched to ${selectedMsg.senderName}.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) { toast.error('Subject and body are required.'); return; }
    if (composeRecipientType === 'group' && !composeGroup) { toast.error('Please select a recipient group.'); return; }
    if (composeRecipientType === 'individual' && !composeIndividualId) { toast.error('Please select a recipient.'); return; }
    setIsSendingBroadcast(true);
    try {
      if (composeRecipientType === 'individual' && composeIndividualId) {
        await notificationService.sendNotification({
          title: composeSubject,
          body: composeBody,
          channel: composeChannel as any,
          priority: composePriority as any,
          recipientId: Number(composeIndividualId),
          senderId: currentUserId,
          metadata: {
            senderName: myName,
            senderRole: roleLabelFromType(userRoleStr),
            senderId: currentUserId,
          },
        });
      } else {
        const postData: Record<string, any> = {
          title: composeSubject,
          body: composeBody,
          channel: composeChannel,
          priority: composePriority,
          recordStatus: 'sent',
          sentAt: new Date().toISOString(),
          metadata: {
            group: composeGroup,
            isBroadcast: true,
            senderName: myName,
            senderRole: roleLabelFromType(userRoleStr),
            senderId: currentUserId,
          },
        };
        if (currentUserId && currentUserId > 0) {
          postData.sender = currentUserId;
        }
        await apiClient.post('/notifications', { data: postData });
      }
      const sent: MessageThread = {
        id: `SENT-${Date.now()}`,
        subject: composeSubject, body: composeBody,
        senderId: currentUserId || 0, senderName: myName,
        senderRole: roleLabelFromType(userRoleStr), senderInitials: initials(myName),
        recipientGroup: composeRecipientType === 'group' ? composeGroup : undefined,
        recipientId: composeRecipientType === 'individual' ? Number(composeIndividualId) : undefined,
        recipientName: composeRecipientType === 'individual'
          ? contacts.find(c => c.id === Number(composeIndividualId))?.fullName : undefined,
        channel: composeChannel, priority: composePriority,
        recordStatus: 'sent', isStarred: false, isArchived: false,
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [sent, ...prev]);
      setIsComposing(false);
      setComposeSubject(''); setComposeBody(''); setComposeGroup('');
      setComposeIndividualId(''); setComposeContactSearch('');
      setComposePriority('normal'); setComposeChannel('dashboard');
      toast.success('Message dispatched successfully.');
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const folders = [
    { id: 'inbox', label: 'All Inbox', icon: Inbox, count: messages.filter(m => !m.isArchived).length },
    { id: 'unread', label: 'Unread', icon: Circle, count: unreadCount },
    { id: 'starred', label: 'Starred', icon: Star, count: starredCount },
    { id: 'sent', label: 'Sent', icon: Send, count: messages.filter(m => m.senderId === currentUserId).length },
    { id: 'archive', label: 'Archive', icon: Archive, count: messages.filter(m => m.isArchived).length },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <PageHeader
        title="Institutional Communication Hub"
        description="Secure intra-school messaging linking faculty, parents, scholars, and executive administration."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}
          {canBroadcast && (
            <button
              onClick={() => setIsComposing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Message</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Messages', val: messages.length, color: 'text-slate-900 dark:text-white' },
          { label: 'Unread', val: unreadCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Starred', val: starredCount, color: 'text-amber-500' },
          { label: 'Contacts Available', val: contacts.length, color: 'text-sky-500' },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Folders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 pb-1">Folders</p>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id as any)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer',
                  activeFolder === f.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className="flex items-center gap-2">
                  <f.icon className="w-3.5 h-3.5" />
                  {f.label}
                </span>
                {f.count > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono',
                    activeFolder === f.id ? 'bg-white/20 text-white'
                      : f.id === 'unread' ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 pb-1">Priority</p>
            {[
              { val: 'all', label: 'All Priorities', dot: 'bg-emerald-500' },
              { val: 'urgent', label: 'Urgent', dot: 'bg-rose-500' },
              { val: 'high', label: 'High', dot: 'bg-amber-500' },
              { val: 'normal', label: 'Normal', dot: 'bg-sky-500' },
              { val: 'low', label: 'Low', dot: 'bg-slate-400' },
            ].map(p => (
              <button
                key={p.val}
                onClick={() => setPriorityFilter(p.val)}
                className={cn(
                  'w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer',
                  priorityFilter === p.val
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className={`w-2 h-2 rounded-full ${p.dot} shrink-0`} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-black flex items-center gap-1 mb-0.5">
              <Bell className="w-3 h-3" /> Push Alerts Active
            </span>
            SMS & email delivery enabled for urgent priority channels.
          </div>
        </div>

        {/* ── Message List ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {filteredMessages.length} Message{filteredMessages.length !== 1 ? 's' : ''}
            </p>
            {filteredMessages.some(m => m.recordStatus !== 'read') && (
              <span className="text-[10px] font-bold text-emerald-600">
                {filteredMessages.filter(m => m.recordStatus !== 'read').length} unread
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <Mail className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No messages here</p>
                <p className="text-[11px] text-slate-400">Try a different folder or filter.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={cn(
                    'p-4 cursor-pointer transition-all group border-l-2',
                    selectedMsg?.id === msg.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent',
                    msg.recordStatus !== 'read' ? 'bg-slate-50/70 dark:bg-slate-800/20' : ''
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-xl text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5', roleColor(msg.senderRole))}>
                      {msg.senderInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn('text-xs truncate flex items-center gap-1', msg.recordStatus !== 'read' ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300')}>
                          {msg.recordStatus !== 'read' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />}
                          {msg.senderName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={e => handleStar(msg, e)} className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star className={cn('w-3 h-3', msg.isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">{timeAgo(msg.sentAt)}</span>
                        </div>
                      </div>
                      <p className={cn('text-[11px] truncate mb-1', msg.recordStatus !== 'read' ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400')}>
                        {msg.subject}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-1.5">
                        {msg.body.replace(/\n/g, ' ')}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <ChannelBadge channel={msg.channel} />
                        {msg.priority !== 'normal' && (
                          <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold border', priorityColor(msg.priority))}>
                            {msg.priority.charAt(0).toUpperCase() + msg.priority.slice(1)}
                          </span>
                        )}
                        {(msg.recipientGroup || msg.recipientName) && (
                          <span className="text-[9px] text-slate-400 font-mono truncate max-w-[80px]">
                            → {msg.recipientGroup || msg.recipientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Message Reader ───────────────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {selectedMsg ? (
            <>
              {/* Reader Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white leading-snug flex-1">
                    {selectedMsg.subject}
                  </h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => handleStar(selectedMsg, e)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Star">
                      <Star className={cn('w-3.5 h-3.5', selectedMsg.isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-400')} />
                    </button>
                    <button onClick={() => handleArchive(selectedMsg)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Archive">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(selectedMsg)} className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ChannelBadge channel={selectedMsg.channel} />
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border', priorityColor(selectedMsg.priority))}>
                    {selectedMsg.priority.charAt(0).toUpperCase() + selectedMsg.priority.slice(1)} Priority
                  </span>
                  {selectedMsg.recordStatus === 'read'
                    ? <span className="flex items-center gap-1 text-[10px] text-slate-400"><Eye className="w-3 h-3" /> Read</span>
                    : <span className="flex items-center gap-1 text-[10px] text-emerald-600"><EyeOff className="w-3 h-3" /> Unread</span>}
                  <span className="text-[10px] text-slate-400 font-mono ml-auto">{timeAgo(selectedMsg.sentAt)}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className={cn('w-9 h-9 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0', roleColor(selectedMsg.senderRole))}>
                    {selectedMsg.senderInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs text-slate-900 dark:text-white truncate">{selectedMsg.senderName}</p>
                    <p className="text-[10px] text-slate-500">{selectedMsg.senderRole}</p>
                  </div>
                  {(selectedMsg.recipientGroup || selectedMsg.recipientName) && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400">To</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedMsg.recipientGroup || selectedMsg.recipientName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedMsg.body}
                </div>
                {selectedMsg.relatedEntity && (
                  <div className="mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Related Record</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedMsg.relatedEntity} #{selectedMsg.relatedEntityId}
                    </span>
                  </div>
                )}
              </div>

              {/* Reply */}
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Reply className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Reply to {selectedMsg.senderName}
                  </p>
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Write a reply to ${selectedMsg.senderName}…`}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium resize-none focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{replyText.length} chars</span>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Sending…' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div className="space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No message selected</p>
                <p className="text-xs text-slate-400">Click a message from the list to read it here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Compose Modal ──────────────────────────────────────────────────── */}
      {isComposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Compose New Message
              </h3>
              <button onClick={() => setIsComposing(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              {/* Recipient type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Recipient Type</label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {(['group', 'individual'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setComposeRecipientType(t)}
                      className={cn(
                        'flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2',
                        composeRecipientType === t ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {t === 'group' ? <Users className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {t === 'group' ? 'Group Broadcast' : 'Individual'}
                    </button>
                  ))}
                </div>
              </div>

              {composeRecipientType === 'group' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Target Audience</label>
                  <select
                    value={composeGroup}
                    onChange={e => setComposeGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Audience Group --</option>
                    <optgroup label="Faculty & Staff">
                      <option value="All Faculty & Teachers">All Faculty & Teachers (Broadcast)</option>
                      <option value="Senior Teachers">Senior Subject Teachers</option>
                      <option value="Hifz Track Mentors">Intensive Hifz Track Mentors</option>
                      <option value="Homeroom Supervisors">Homeroom Supervisors</option>
                      <option value="Finance Staff">Finance & Accounts Team</option>
                      <option value="Administrative Staff">Administrative Staff</option>
                    </optgroup>
                    <optgroup label="Students / Scholars">
                      <option value="All Scholars">All Enrolled Scholars</option>
                      <option value="Senior Secondary Scholars">Senior Secondary (SS1–SS3)</option>
                      <option value="Junior Secondary Scholars">Junior Secondary (JSS1–JSS3)</option>
                      <option value="Primary Scholars">Primary Division Scholars</option>
                      <option value="Tahfidz Scholars">Tahfidz Programme Scholars</option>
                    </optgroup>
                    <optgroup label="Parents & Guardians">
                      <option value="All Parents & Guardians">All Parent Guardians</option>
                      <option value="Parents with Outstanding Fees">Parents with Outstanding Fees</option>
                    </optgroup>
                    <optgroup label="Whole Institution">
                      <option value="All Campus Members">Entire Campus Community</option>
                    </optgroup>
                  </select>
                </div>
              )}

              {composeRecipientType === 'individual' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Search & Select Recipient</label>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={composeContactSearch}
                      onChange={e => { setComposeContactSearch(e.target.value); setComposeIndividualId(''); }}
                      placeholder="Search by name, email, or role…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {contacts.length === 0 ? (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
                      No contacts loaded. Try group broadcast instead.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredContacts.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setComposeIndividualId(c.id); setComposeContactSearch(c.fullName); }}
                          className={cn(
                            'w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer',
                            composeIndividualId === c.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                          )}
                        >
                          <div className={cn('w-7 h-7 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0', roleColor(c.roleType))}>
                            {initials(c.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.fullName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{c.roleLabel} · {c.email}</p>
                          </div>
                          {composeIndividualId === c.id && <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="e.g. Urgent: Term 2 Examination Guidelines — All Scholars"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Message Body *</label>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  rows={6}
                  placeholder="Write your full message here…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-medium text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 text-right mt-0.5 font-mono">{composeBody.length} chars</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Priority</label>
                  <select
                    value={composePriority}
                    onChange={e => setComposePriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Delivery Channel</label>
                  <select
                    value={composeChannel}
                    onChange={e => setComposeChannel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="dashboard">Portal Dashboard</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950 rounded-b-3xl">
              <button onClick={() => setIsComposing(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={isSendingBroadcast}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingBroadcast ? 'Sending…' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function MessagesCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] text-xs font-bold text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
        <span>Loading Communication Hub…</span>
      </div>
    }>
      <MessagesCenterContent />
    </Suspense>
  );
}

