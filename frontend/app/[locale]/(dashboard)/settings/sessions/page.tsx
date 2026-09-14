'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Monitor, Smartphone, LogOut, RefreshCw, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { t as i18nT } from '@/lib/i18n-dict';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  blocked: boolean;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
  role?: { name: string; type: string };
}

function getDeviceIcon(ua: string) {
  if (/mobile|android|iphone|ipad/i.test(ua)) return <Smartphone className="w-5 h-5" />;
  return <Monitor className="w-5 h-5" />;
}

function getBrowserName(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Microsoft Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function getOSName(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown OS';
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function LoginSessionsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [users, setUsers] = useState<StrapiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  // Current session info from browser
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const currentDevice = `${getOSName(ua)} — ${getBrowserName(ua)}`;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', {
        params: {
          filters: { blocked: { $eq: false } },
          populate: 'role',
          pagination: { limit: 30 },
          sort: 'updatedAt:desc',
        }
      });
      const allUsers: StrapiUser[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      // Exclude current user
      const currentId = (user as any)?.id;
      setUsers(allUsers.filter(u => u.id !== currentId));
    } catch (err) {
      console.error('Load users error:', err);
      toast.error(t('Failed to load user sessions'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRevoke = async (u: StrapiUser) => {
    if (!confirm(`${t('Block user')} "${u.username}"? ${t('They will be logged out and unable to sign in.')}`)) return;
    setRevoking(u.id);
    try {
      await apiClient.put(`/users/${u.id}`, { blocked: true });
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success(`${t('User')} ${u.username} ${t('has been blocked and session revoked')}`);
    } catch {
      toast.error(t('Failed to revoke session'));
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Key className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            <span>{t('Active Login Sessions & Security Control')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Monitor authenticated users, device sessions, and enforce session revocations.')}
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {t('Refresh')}
        </button>
      </div>

      {/* Current Session */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {t('Your Current Session')}
        </h2>
        <div className="p-5 rounded-2xl border bg-emerald-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-emerald-500/40 shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            {getDeviceIcon(ua)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentDevice}</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">{t('This Device')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">{hostname}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('Logged in as')} <strong>{(user as any)?.username ?? (user as any)?.email ?? '—'}</strong>
              {(user as any)?.role?.name ? ` · ${(user as any).role.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Other Users */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          {t('Platform Users')} ({users.length})
        </h2>

        <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{t('Revoking a session will block the user account. They must be re-activated by an administrator.')}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('No other active users found')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div
                key={u.id}
                className="p-5 rounded-2xl border bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.username}</h3>
                      {u.role?.name && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {u.role.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('Last activity')}: {timeSince(u.updatedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(u)}
                  disabled={revoking === u.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-400 hover:text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {revoking === u.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>{t('Revoke')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
