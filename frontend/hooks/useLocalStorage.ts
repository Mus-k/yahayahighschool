'use client';

import { useState, useEffect, useCallback } from 'react';
import { isBrowser, safeJsonParse } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — useLocalStorage Hook
// Type-safe localStorage with SSR support.
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser) return initialValue;
    const item = window.localStorage.getItem(key);
    if (item === null) return initialValue;
    return safeJsonParse<T>(item) ?? initialValue;
  });

  // Keep state in sync if localStorage changes in another tab
  useEffect(() => {
    if (!isBrowser) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(
          e.newValue !== null
            ? (safeJsonParse<T>(e.newValue) ?? initialValue)
            : initialValue
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        if (isBrowser) {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        }
        return nextValue;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    if (isBrowser) window.localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
