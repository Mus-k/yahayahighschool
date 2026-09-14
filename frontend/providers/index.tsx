'use client';

import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { Toaster } from '@/components/ui/sonner';
import { type ReactNode, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { i18nDict } from '@/lib/i18n-dict';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Locale Providers Composition & Client-Side i18n Post-Processor
// Single entry point for query and auth providers.
// Translates all page texts dynamically after hydration using the centralized
// i18n dictionary in /lib/i18n-dict.ts.
// ─────────────────────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode;
}

function TranslationPostProcessor() {
  const locale = useLocale();

  useEffect(() => {
    if (locale === 'en') return;

    const targetDict = i18nDict[locale as keyof typeof i18nDict];
    if (!targetDict) return;

    // Helper to translate a single string
    const translateString = (str: string): string => {
      const clean = str.trim().toLowerCase().replace(/\s+/g, ' ');
      return targetDict[clean] ?? targetDict[clean.replace(/\.$/, '')] ?? str;
    };

    // Helper to translate a text node
    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const trimmed = node.nodeValue.trim();
        if (trimmed && trimmed.length > 1) {
          const translated = translateString(node.nodeValue);
          if (translated !== node.nodeValue) {
            node.nodeValue = translated;
          }
        }
      }
    };

    // Recursive tree walker
    const walk = (el: Element | Node) => {
      const nodeName = el.nodeName;

      // Handle input/textarea placeholders then skip
      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        const input = el as HTMLInputElement;
        if (input.placeholder) {
          const trans = translateString(input.placeholder);
          if (trans !== input.placeholder) {
            input.placeholder = trans;
          }
        }
        return;
      }

      // Skip non-translatable elements
      if (nodeName === 'SCRIPT' || nodeName === 'STYLE' || nodeName === 'CODE' ||
          nodeName === 'PRE' || nodeName === 'SVG') {
        return;
      }

      // Translate title / aria-label attributes
      if (el.nodeType === Node.ELEMENT_NODE) {
        const elem = el as Element;
        const titleAttr = elem.getAttribute('title');
        if (titleAttr) {
          const trans = translateString(titleAttr);
          if (trans !== titleAttr) elem.setAttribute('title', trans);
        }
      }

      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          translateNode(child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };

    // 1. Initial Translation Walk (slight delay to let React finish rendering)
    const initialTimer = setTimeout(() => {
      walk(document.body);
    }, 100);

    // 2. MutationObserver to translate any dynamically added or modified elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            walk(node);
          }
        });
        if (mutation.type === 'characterData' && mutation.target) {
          translateNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [locale]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const errorMsg = e.message || '';
      if (
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[ChunkErrorHandler] Chunk load failure detected. Reloading page...');
        window.location.reload();
      }
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      const errorMsg = e.reason?.message || e.reason?.toString() || '';
      if (
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[ChunkErrorHandler] Unhandled chunk rejection detected. Reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <TranslationPostProcessor />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Outfit, system-ui, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}

export { AuthProvider } from './auth.provider';
export { QueryProvider } from './query.provider';
export { ThemeProvider } from './theme.provider';
