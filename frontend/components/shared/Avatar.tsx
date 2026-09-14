'use client';

import React, { useState } from 'react';
import { getStrapiMediaUrl } from '@/services/cms.service';
import { cn } from '@/lib/utils';

interface AvatarProps {
  /** Can be a URL string, a Strapi media object, or null */
  src?: string | { url: string } | null | any;
  /** Full name to generate initials if image is missing */
  name?: string;
  /** Predefined sizing classes and pixel dimensions */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Custom classes for border, shadow, etc. */
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6 text-[10px]', px: 24 },
  sm: { box: 'w-8 h-8 text-xs', px: 32 },
  md: { box: 'w-10 h-10 text-sm', px: 40 },
  lg: { box: 'w-16 h-16 text-xl', px: 64 },
  xl: { box: 'w-24 h-24 text-3xl', px: 96 },
  '2xl': { box: 'w-32 h-32 text-4xl', px: 128 },
};

export function Avatar({ src, name = 'User', size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { box, px } = SIZE_MAP[size] || SIZE_MAP.md;

  // Resolve image URL using the Strapi media helper
  const imageUrl = src && !imgError ? getStrapiMediaUrl(src) : null;

  // Generate initials
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

  // Seeded color schemes for initials based on hash of the name
  const colors = [
    'from-emerald-600 to-teal-500 text-emerald-100 border-emerald-500/30',
    'from-blue-600 to-indigo-500 text-blue-100 border-blue-500/30',
    'from-violet-600 to-purple-500 text-violet-100 border-violet-500/30',
    'from-amber-600 to-orange-500 text-amber-100 border-amber-500/30',
    'from-rose-600 to-pink-500 text-rose-100 border-rose-500/30',
  ];
  const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorClass = colors[charSum % colors.length];

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden flex items-center justify-center font-bold font-mono tracking-tighter select-none border shrink-0',
        box,
        imageUrl ? 'bg-slate-950 border-slate-800' : `bg-gradient-to-br ${colorClass}`,
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
