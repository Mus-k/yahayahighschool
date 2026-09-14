'use client';

import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — useMobile Hook
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);

    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/** Check if current viewport is tablet or larger */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const onChange = () => setIsTablet(mql.matches);
    mql.addEventListener('change', onChange);
    setIsTablet(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isTablet;
}
