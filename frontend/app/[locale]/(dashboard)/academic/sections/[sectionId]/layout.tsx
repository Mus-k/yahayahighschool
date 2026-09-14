'use client';

import React from 'react';
import { SectionProvider, useSection } from '@/providers/SectionContext';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

interface SectionWorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ sectionId: string }>;
}

function SectionWorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, role } = useAuth();
  const { section, isLoading: sectionLoading } = useSection();

  if (authLoading || sectionLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-semibold">Validating security clearance...</p>
      </div>
    );
  }

  // Permitted roles: super-administrator, director, registrar
  const userRoleStr = role as string;
  const isGlobalManager = userRoleStr === 'super-administrator' || userRoleStr === 'director' || userRoleStr === 'registrar';

  // Section head match check
  const isSectionHead = userRoleStr === 'section-head';
  const isAssignedHead = 
    section?.academicHead && 
    (section.academicHead.id === user?.profile?.id || 
     section.academicHead.documentId === user?.profile?.documentId);

  if (!isGlobalManager && (!isSectionHead || !isAssignedHead)) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[500px]">
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950 p-8 rounded-3xl shadow-lg max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Security Clearance Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            As a Section Head, your workspace is restricted to your assigned Academic Section. 
            You do not have administrative clearance to access <strong>{section?.name ?? 'this section'}</strong>.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function SectionWorkspaceLayout({
  children,
  params,
}: SectionWorkspaceLayoutProps) {
  const { sectionId } = React.use(params);
  return (
    <SectionProvider sectionId={sectionId}>
      <SectionWorkspaceGuard>{children}</SectionWorkspaceGuard>
    </SectionProvider>
  );
}
