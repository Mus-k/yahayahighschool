'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMobile } from '@/hooks/useMobile';
import { Sidebar } from '@/components/shared/layout/Sidebar';
import { DashboardHeader } from '@/components/shared/layout/DashboardHeader';
import { STORAGE_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Dashboard Shell Layout
// ─────────────────────────────────────────────────────────────────────────────

import { useLocale } from 'next-intl';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isCollapsed] = useLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const isMobile = useMobile();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="flex min-h-screen bg-background w-full print:block print:bg-white">
      {/* Sidebar — hidden when printing */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-[padding] duration-300 w-full min-h-screen',
          'print:!pl-0 print:!pr-0 print:!w-full print:min-h-0 print:block',
          isMobile ? 'px-0' : isCollapsed 
            ? (isRtl ? 'pr-[72px] pl-0' : 'pl-[72px] pr-0') 
            : (isRtl ? 'pr-[280px] pl-0' : 'pl-[280px] pr-0')
        )}
      >
        {/* Header/Topbar — hidden when printing */}
        <div className="print:hidden">
          <DashboardHeader />
        </div>
        <div className="flex-1 flex flex-col min-h-0 print:block print:flex-none">
          {children}
        </div>
      </main>
    </div>
  );
}
