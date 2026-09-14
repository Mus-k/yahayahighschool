'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from '@/i18n/routing';
import { Phone, Mail, Globe, LogIn, UserPlus } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

interface TopbarProps {
  currentLocale?: string;
  phone?: string;
  email?: string;
}

export function Topbar({
  currentLocale = 'en',
  phone = '+234 (0) 800-YAHAYA-S',
  email = 'admissions@yahayaschool.edu',
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const locales = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  ];

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // next-intl handles the prefix mapping automatically
    router.push(pathname, { locale: newLocale as Locale });
  };

  return (
    <div className="bg-emerald-950 text-emerald-100 text-xs border-b border-emerald-900/60 py-2 px-4 sm:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* Left: Motto & Quick Contact */}
        <div className="flex flex-wrap items-center gap-4 text-center sm:text-left">
          <span className="font-semibold tracking-wide text-emerald-300">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ • Excellence in Islamic & Western Education
          </span>
          <div className="hidden md:flex items-center gap-4 text-emerald-200/80">
            <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{phone}</span>
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>{email}</span>
            </a>
          </div>
        </div>

        {/* Right: Quick Links & Language Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-emerald-800/60 pr-4">
            <Link
              href="/online-registration"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Online Registration</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-emerald-200 hover:text-white font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Portal Login</span>
            </Link>
          </div>

          {/* Locale Selector */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex items-center gap-1 bg-emerald-900/50 rounded-full p-0.5 border border-emerald-800/80">
              {locales.map((loc) => {
                const isActive = currentLocale === loc.code;
                return (
                  <button
                    key={loc.code}
                    onClick={() => handleLocaleChange(loc.code)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-emerald-950 font-bold shadow-sm'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                    }`}
                    title={loc.label}
                  >
                    {loc.code.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
