'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown } from 'lucide-react';
import { useLenis } from 'lenis/react';

const LOCALES = [
  { code: 'en', label: 'UK', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
];

export function LanguageSwitcher({ 
  currentLocale,
  onToggle,
  forceClose
}: { 
  currentLocale: string;
  onToggle?: (isOpen: boolean) => void;
  forceClose?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const current = LOCALES.find((l) => l.code === currentLocale) || LOCALES[0];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  useEffect(() => {
    if (forceClose && isOpen) {
      setIsOpen(false);
      if (onToggle) onToggle(false);
    }
  }, [forceClose, isOpen, onToggle]);

  const lenis = useLenis();

  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [isOpen, lenis]);

  const switchLocale = (locale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale });
  };

  return (
    <>
      {mounted && isOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => {
            setIsOpen(false);
            if (onToggle) onToggle(false);
          }}
          aria-hidden="true"
        />,
        document.body
      )}
      <div className="group/lan relative h-full flex items-center z-50" ref={dropdownRef}>
        <button
          onClick={() => {
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (onToggle) onToggle(nextState);
          }}
        className=" flex items-center gap-1 cursor-pointer px-3 py-2 rounded-full border border-primary/30 bg-white lg:hover:border-primary transition-colors duration-500 lg:shadow-sm"
      >
        <span className="text-[20px] leading-none">{current.flag}</span>
        <span className="text-[18px] font-semibold text-gray-800">{current.label}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${
            isOpen ? '-rotate-180' : 'lg:group-hover/lan:-rotate-180'
          }`} 
        />
      </button>

      <div 
        className={`absolute top-full right-0 bg-[#048ED6] rounded-xl lg:shadow-xl border border-sky-400 p-2 z-50 flex flex-col gap-1 min-w-[100px] transition-all duration-300 origin-top ${
          isOpen 
            ? 'opacity-100 visible scale-100 pointer-events-auto' 
            : 'opacity-0 invisible scale-95 pointer-events-none lg:group-hover/lan:opacity-100 lg:group-hover/lan:visible lg:group-hover/lan:scale-100 lg:group-hover/lan:pointer-events-auto'
        }`}
      >
        {LOCALES.filter(l => l.code !== currentLocale).map((locale, idx) => (
          <React.Fragment key={locale.code}>
            <button
              onClick={() => switchLocale(locale.code)}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg text-white cursor-pointer duration-500 lg:hover:bg-white transition-colors"
            >
              <span className="text-xl leading-none">{locale.flag}</span>
              <span className="text-sm font-bold lg:group-hover:text-primary duration-500 transition-colors">{locale.label}</span>
            </button>
            {idx < LOCALES.filter(l => l.code !== currentLocale).length - 1 && (
              <div className="h-px bg-white/30 mx-2 my-0.5 lg:group-hover:bg-white duration-500 transition-colors" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
    </>
  );
}
