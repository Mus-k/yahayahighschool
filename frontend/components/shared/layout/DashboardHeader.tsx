'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { Breadcrumb } from '@/components/shared/layout/Breadcrumb';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName } from '@/types/user.types';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    router.push(pathname, { locale: newLocale as Locale });
  };

  const getStrapiMediaUrlLocal = (media: any) => {
    if (!media) return null;
    const rawUrl = typeof media === 'string' ? media : (media.url || media.photoUrl || media.avatarUrl);
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
    return `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  const displayName = user
    ? getUserDisplayName(user as unknown as Parameters<typeof getUserDisplayName>[0])
    : 'Sheikh Yahaya Camara';
  const schoolId = user?.schoolId || user?.username || 'AC000000001';
  const roleName = user?.role?.name || 'Executive Director';
  const avatarUrl = user?.avatarUrl || user?.photoUrl || getStrapiMediaUrlLocal(user?.avatar) || getStrapiMediaUrlLocal((user as any)?.photo) || null;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Breadcrumb className="hidden md:flex min-w-0 flex-shrink-0" />
        <div className="flex-1 max-w-md hidden sm:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Academic Year Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AY: 2026/2027 (Term 2)</span>
        </div>

        {/* Language Selector */}
        <div className={cn("flex items-center gap-1.5 border-slate-200 dark:border-slate-800", currentLocale === 'ar' ? 'border-l pl-3' : 'border-r pr-3')}>
          <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 border border-slate-200 dark:border-slate-700">
            {['en', 'ar', 'fr', 'tr'].map((code) => {
              const isActive = currentLocale === code;
              return (
                <button
                  key={code}
                  onClick={() => handleLocaleChange(code)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all",
                    isActive
                      ? "bg-indigo-500 text-white shadow-sm font-black"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        <NotificationCenter />

        {/* Always-visible User Profile Chip */}
        <Link href="/profile" className={cn("flex items-center gap-2.5 py-1 hover:opacity-90 transition-opacity cursor-pointer border-slate-200 dark:border-slate-800", currentLocale === 'ar' ? 'pr-3 border-r' : 'pl-3 border-l')}>
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                className="w-9 h-9 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-700"
              />
            ) : null}
            <div className={cn(
              "w-9 h-9 rounded-xl bg-gradient-to-br from-[#048ED6] to-sky-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#048ED6]/20",
              avatarUrl && "hidden"
            )}>
              {displayName.substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className={cn("hidden md:flex flex-col", currentLocale === 'ar' ? 'text-right' : 'text-left')}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{displayName}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-[#048ED6] border border-slate-200 dark:border-slate-700">
                {schoolId}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize mt-0.5">{roleName}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
