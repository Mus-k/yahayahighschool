'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { getTranslation } from './EnterpriseModuleShell';

export interface EnterpriseKPICard {
  id: string | number;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendColor?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  actionText?: string;
  badgeText?: string;
}

export interface EnterpriseKPIDeckProps {
  cards: EnterpriseKPICard[];
  isLoading?: boolean;
  className?: string;
}

export function EnterpriseKPIDeck({ cards, isLoading = false, className }: EnterpriseKPIDeckProps) {
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {cards.map((card) => {
        const TrendIcon =
          card.trendDirection === 'up'
            ? ArrowUpRight
            : card.trendDirection === 'down'
            ? ArrowDownRight
            : Minus;

        const defaultTrendColor =
          card.trendDirection === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : card.trendDirection === 'down'
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-500 dark:text-slate-400';

        const CardContent = (
          <div
            onClick={card.onClick}
            role={card.onClick ? 'button' : undefined}
            tabIndex={card.onClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (card.onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                card.onClick();
              }
            }}
            className={cn(
              "group relative p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-2xs select-none bg-white dark:bg-slate-900",
              card.isActive
                ? "border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-600 dark:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer"
            )}
          >
            {/* Top Bar: Title & Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">
                {getTranslation(card.title, locale)}
              </span>
              {card.icon && (
                <div
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 [&>svg]:w-3.5 [&>svg]:h-3.5",
                    card.isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-400"
                  )}
                >
                  {card.icon}
                </div>
              )}
            </div>

            {/* Middle Bar: Value & Optional Badge */}
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
                {card.value}
              </h3>
              {card.badgeText && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  {getTranslation(card.badgeText, locale)}
                </span>
              )}
            </div>

            {/* Bottom Bar: Trend or Subtitle */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 truncate">
                {card.trend && (
                  <span className={cn("inline-flex items-center font-bold font-mono", card.trendColor || defaultTrendColor)}>
                    <TrendIcon className="w-3 h-3 mr-0.5 shrink-0" />
                    {getTranslation(card.trend, locale)}
                  </span>
                )}
                {card.subtitle && (
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {getTranslation(card.subtitle, locale)}
                  </span>
                )}
              </div>

              {card.onClick && (
                <div className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                  <span>{getTranslation(card.actionText || 'Filter', locale)}</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </div>
          </div>
        );

        if (card.href && !card.onClick) {
          return (
            <Link key={card.id} href={card.href} className="block focus:outline-none">
              {CardContent}
            </Link>
          );
        }

        return <React.Fragment key={card.id}>{CardContent}</React.Fragment>;
      })}
    </div>
  );
}
