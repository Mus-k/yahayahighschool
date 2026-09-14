'use client';

import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface DirectionProviderProps {
  locale: string;
  direction: 'rtl' | 'ltr';
}

/**
 * DirectionProvider sets document.documentElement ('html') attributes 'lang' and 'dir'
 * synchronously on the client whenever the active locale changes (e.g. from /en to /ar).
 */
export function DirectionProvider({ locale, direction }: DirectionProviderProps) {
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', direction);
  }, [locale, direction]);

  return null;
}
