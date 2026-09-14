'use client';

import React from 'react';

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status = 'active', size = 'md' }: StatusBadgeProps) {
  const safeStatus = (status && typeof status === 'string' && status.trim() !== '') ? status : 'active';
  let normalized = safeStatus.toLowerCase().replace(/_/g, ' ');
  if (normalized === 'checked out') {
    normalized = 'checkedout';
  }

  const getStyle = (s: string) => {
    switch (s) {
      case 'active':
      case 'full time':
      case 'completed':
      case 'promoted':
      case 'enrolled':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'graduated':
      case 'alumni':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300';
      case 'part time':
      case 'contract':
      case 'planned':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300';
      case 'on leave':
      case 'transferred':
      case 'repeated':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300';
      case 'suspended':
      case 'expelled':
      case 'withdrawn':
      case 'inactive':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-300';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border capitalize tracking-wide transition-all ${sizeClasses[size]} ${getStyle(normalized)}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {normalized}
    </span>
  );
}
