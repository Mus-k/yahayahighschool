'use client';

import React, { useCallback, useRef, useMemo } from 'react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useTranslations } from 'next-intl';

/**
 * Home — hadith quote with a scroll-driven 3D book.
 * Implemented from Figma node 556-914 (frame 1920×1080).
 *
 * Design reference values (at the 1920 frame):
 *   bg #F2F8FD · filled text #000000 · unfilled text #919598
 *   attribution 17 bold · quote 58/67 (enlarged to 76 on request) · book 390×478
 *   cover #073739 · page block #DFD9CD
 *
 * (The export is mostly transparent — alpha 13 outside the book — so those
 * colours are the design composited over white, which is what it sits on.)
 *
 * Scroll choreography, all derived from one rAF-throttled scroll read and
 * written as custom properties so React never re-renders while scrolling:
 *   --fill  0→1 over the first 55%  — words turn grey → black, left to right
 *   --spin  0→1 across the whole    — the book turns toward the reader
 *   --open  0→1 over the last 65%   — the front cover swings open
 *
 * Below md the whole thing is switched off: no pin, no tall section, and the
 * end state is held — book open, quote fully black.
 */

// Moved into the component to use translations
import type { HomepageEntity } from '@/types/cms.types';

export function HomeAnimationSection({ data }: { data?: HomepageEntity | null; locale?: string }) {
  const t = useTranslations('homeAnimation');
  const attribution = data?.quoteAttribution || t('attribution');
  const quote = data?.quoteText || t('quote');
  const bookAr = data?.quoteBookArabic || t('bookAr');
  const bookTranslation = data?.quoteBookTranslation || t('bookTranslation');

  const WORDS = useMemo(() => quote.split(' '), [quote]);
  const sectionRef = useRef<HTMLElement>(null);

  const apply = useCallback((el: HTMLElement, p: number) => {
    // Below md there is no pin and no scroll animation: hold the end state so
    // the book simply sits open with the quote fully filled. These are written
    // as inline styles, so gating has to happen here — a stylesheet rule could
    // not override them.
    if (!window.matchMedia('(min-width: 1025px)').matches) {
      for (const k of ['--p', '--fill', '--spin', '--open']) el.style.setProperty(k, '1');
      return;
    }
    const seg = (a: number, b: number) => Math.min(Math.max((p - a) / (b - a), 0), 1);
    el.style.setProperty('--p', p.toFixed(4));
    el.style.setProperty('--fill', seg(0, 0.55).toFixed(4));
    el.style.setProperty('--spin', p.toFixed(4));
    // ease-out so the cover slows as it reaches full swing
    el.style.setProperty('--open', (1 - Math.pow(1 - seg(0.35, 1), 2)).toFixed(4));
  }, []);

  useScrollProgress(sectionRef, apply);

  return (
    <section ref={sectionRef} className="anim-section relative w-full bg-[#F2F8FD] md:h-[240svh] lg:h-[300svh]">
      <div className="md:sticky md:top-0 md:h-[100svh] py-[clamp(1.5rem,8vw,6rem)] md:py-0 flex flex-col items-center justify-center gap-[clamp(2rem,4vw,5rem)] px-(--spacing-side)">

        <div className="w-full max-w-[1320px] text-center">
          <p className="font-bold text-black text-[clamp(1rem,0.89vw,1.0625rem)]">
            {attribution}
          </p>

          <h2
            className="anim-quote mt-[clamp(1.25rem,2.7vw,3.25rem)] font-bold tracking-[-0.015em] leading-[1.155] text-[clamp(1.2rem,3.95vw,4.75rem)]"
            style={{ ['--n' as string]: WORDS.length }}
          >
            {WORDS.map((w, i) => (
              <span key={`${w}-${i}`} className="anim-word" style={{ ['--i' as string]: i }}>
                <span className="anim-word-fill" aria-hidden>{w}</span>
                {w}
              </span>
            ))}
          </h2>
        </div>

        {/* ── 3D book ──────────────────────────────────────────────── */}
        <div className="bk" aria-hidden>
          <div className="bk-stage">
            <div className="bk-back" />
            <div className="bk-pages">
              <div className="bk-leaf">
                <p className="bk-ar">{bookAr}</p>
                <span className="bk-rule" />
                <p className="bk-en">{bookTranslation}</p>
              </div>
            </div>
            <div className="bk-cover">

              <div className="bk-face bk-front" />
              <div className="bk-face bk-inside">
                <div className="bk-endpaper">
                  <div className="bk-plate">
                    <img src="/headerlogo.png" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Registering these as <number> matters for Safari: unregistered
           custom properties are raw tokens, and WebKit is unreliable about
           resolving them inside calc() when a unit is applied
           (e.g. calc(var(--open) * -158deg)). */
        @property --p    { syntax: '<number>'; inherits: true; initial-value: 0; }
        @property --fill { syntax: '<number>'; inherits: true; initial-value: 0; }
        @property --spin { syntax: '<number>'; inherits: true; initial-value: 0; }
        @property --open { syntax: '<number>'; inherits: true; initial-value: 0; }

        .anim-section { --p: 0; --fill: 0; --spin: 0; --open: 0; }

        /* ── Scroll-fill text ─────────────────────────────────────
           Each word carries its index; the dark copy sits exactly over the
           grey one and its opacity ramps as the fill front passes it, so the
           colour sweeps word by word instead of all at once. */
        .anim-word { position: relative; display: inline-block; color: #919598; }
        .anim-word + .anim-word { margin-left: 0.25em; }
        .anim-word-fill {
          position: absolute;
          inset: 0;
          color: #000;
          opacity: clamp(0, calc(var(--fill) * var(--n) - var(--i)), 1);
        }

        /* ── Book ─────────────────────────────────────────────────
           Sizes are in em off .bk's font-size, so one clamp scales the
           whole assembly responsively. */
        .bk {
          font-size: clamp(9px, 1.05vw, 20px);
          perspective: 90em;
          perspective-origin: 50% 40%;
        }
        .bk-stage {
          position: relative;
          width: 15em;
          height: 21em;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform:
            translateX(calc(var(--open) * 7.5em))
            rotateX(calc(7deg + var(--open) * 5deg))
            rotateY(calc(-26deg + var(--open) * 26deg));
        }
        .bk-back, .bk-pages, .bk-cover, .bk-face {
          position: absolute;
          inset: 0;
          border-radius: 0.15em 0.5em 0.5em 0.15em;
        }
        .bk-back {
          background: linear-gradient(120deg, #06302F, #0A4446);
          transform: translateZ(-1.1em);
          box-shadow: 0 2em 3em rgba(6, 40, 42, 0.35);
        }
        /* Page block, inset slightly so the covers overhang it as real books do */
        .bk-pages {
          top: 0.22em; bottom: 0.22em; left: 0.35em; right: 0.12em;
          background:
            linear-gradient(to right, rgba(110,96,72,0.30) 0, rgba(110,96,72,0) 1.8em),
            linear-gradient(100deg, #F4F0E4 0%, #E4DDCE 100%);
          border-radius: 0.1em 0.25em 0.25em 0.1em;
          transform: translateZ(-0.55em);
        }
        /* Stacked page edges along the fore-edge */
        .bk-pages::after {
          content: '';
          position: absolute;
          top: 0.1em; bottom: 0.1em; right: 0;
          width: 0.4em;
          background: repeating-linear-gradient(to bottom, #D9D2C2 0 2px, #C6BEAB 2px 4px);
          border-radius: 0 0.2em 0.2em 0;
          opacity: 0.9;
        }

        /* Gutter shadow where the pages meet the spine */
        .bk-pages::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 1.6em;
          background: linear-gradient(to right, rgba(70,58,40,0.38), rgba(70,58,40,0));
          z-index: 1;
        }
        /* Contact shadow so the book sits on something */
        .bk-back::after {
          content: '';
          position: absolute;
          left: -6%; right: -6%; bottom: -3%;
          height: 8%;
          background: radial-gradient(ellipse at center, rgba(20,40,45,0.30), rgba(20,40,45,0) 70%);
          filter: blur(0.35em);
        }

        .bk-cover {
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform-origin: left center;
          transform: rotateY(calc(var(--open) * -180deg)) translateZ(0.01em);
        }
        .bk-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .bk-front {
          background: linear-gradient(115deg, #073739 0%, #0B4B4D 55%, #052C2E 100%);
          box-shadow: inset -0.15em 0 0.5em rgba(0,0,0,0.25);
        }
        /* Gold rule inset on the cover, as in the design */
        .bk-front::after {
          content: '';
          position: absolute;
          inset: 0.7em 0.6em;
          border: 0.07em solid #C9A227;
          opacity: 0.85;
          border-radius: 0.1em;
        }
        /* Spine highlight down the hinge edge */
        .bk-front::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 0.5em;
          background: linear-gradient(to right, rgba(0,0,0,0.45), rgba(255,255,255,0.05));
          border-radius: 0.15em 0 0 0.15em;
        }
        /* Recto: the hadith the section quotes, in Arabic */
        .bk-leaf {
          position: absolute;
          inset: 1.6em 1.1em 1.6em 1.9em;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.9em;
          text-align: center;
          opacity: calc(var(--open) * 1.6 - 0.35);
        }
        .bk-ar {
          font-family: var(--font-arabic), serif;
          direction: rtl;
          font-size: 1.35em;
          line-height: 1.9;
          color: #17403C;
        }
        .bk-rule { width: 45%; height: 1px; background: #C9A227; opacity: 0.7; }
        .bk-en {
          font-size: 0.62em;
          line-height: 1.5;
          color: #6E6353;
          font-style: italic;
        }
        /* Verso: the crest, printed on the endpaper */
        .bk-plate {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          opacity: calc(var(--open) * 1.6 - 0.5);
        }
        .bk-plate img { width: 42%; height: auto; opacity: 0.5; }

        .bk-inside {
          transform: rotateY(180deg);
          background: linear-gradient(100deg, #0A4446, #063032);
        }
        /* Cream endpaper inset on the board, so the cover reads as a board */
        .bk-endpaper {
          position: absolute;
          inset: 0.3em;
          background: linear-gradient(100deg, #F3EEE2, #E2DBCC);
          border-radius: 0.1em;
          box-shadow: inset 0.9em 0 1.1em -0.7em rgba(70,58,40,0.45);
        }

        @media (prefers-reduced-motion: reduce) {
          .bk-stage { transform: rotateX(10deg) rotateY(-14deg); }
          .bk-cover { transform: none; }
          .anim-word-fill { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
