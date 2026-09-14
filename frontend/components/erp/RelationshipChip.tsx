'use client';

import React from 'react';
import Link from 'next/link';
import { Users, BookOpen, Building2, User, Award, Layers } from 'lucide-react';

interface RelationshipChipProps {
  type: 'section' | 'department' | 'program' | 'parent' | 'teacher' | 'student' | 'campus' | 'academicYear';
  label: string;
  sublabel?: string;
  href?: string;
}

export function RelationshipChip({ type, label, sublabel, href }: RelationshipChipProps) {
  const getIcon = () => {
    switch (type) {
      case 'section':
        return <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'department':
        return <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'program':
        return <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'parent':
      case 'student':
        return <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'teacher':
        return <Award className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'section':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-200 hover:border-emerald-300 dark:hover:border-emerald-500/40';
      case 'department':
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200 hover:border-amber-300 dark:hover:border-amber-500/40';
      case 'program':
        return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-200 hover:border-sky-300 dark:hover:border-sky-500/40';
      case 'teacher':
        return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200 hover:border-rose-300 dark:hover:border-rose-500/40';
      default:
        return 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-200 hover:border-purple-300 dark:hover:border-purple-500/40';
    }
  };

  const content = (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200 ${getBorderColor()}`}
    >
      {getIcon()}
      <span>{label}</span>
      {sublabel && <span className="text-[10px] opacity-75 ml-0.5 font-normal">({sublabel})</span>}
    </span>
  );

  if (href) {
    return <Link href={href} className="inline-block">{content}</Link>;
  }

  return content;
}
