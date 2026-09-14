'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  /** Frame aspect ratio, e.g. "1418/685". */
  ratio?: string;
  className?: string;
  /**
   * How much taller the image is than its frame. 1.2 means 20% spare height,
   * which is the distance the parallax has to travel.
   */
  overscan?: number;
  /**
   * Only drift at or above this viewport width. Below it the image is parked
   * mid-travel and the loop never starts — on a phone the frame crosses the
   * screen so fast that the drift reads as a glitch rather than depth.
   * The project's lg is 1281.
   */
  minWidth?: number;
};

/**
 * An image that drifts against the scroll inside a fixed frame.
 *
 * Deliberately does NOT listen for scroll events. This app wraps everything in
 * Lenis, which intercepts scrolling entirely — a probe earlier in the build
 * confirmed window 'scroll' fires zero times while the page is actually
 * moving. So the frame's own rect is sampled on requestAnimationFrame, which
 * is true however scrolling is implemented, with an IntersectionObserver
 * gating the loop so it only runs while the frame is on screen.
 *
 * See hooks/useScrollProgress.ts, which does the same for full-height
 * sections; the progress here is measured across the viewport crossing
 * instead, because this frame is far shorter than the screen.
 */
export function ParallaxImage({
  src,
  alt,
  ratio = '16/9',
  className = '',
  overscan = 1.2,
  minWidth = 0,
}: Props) {
  // Bumped when the viewport crosses minWidth or the motion preference
  // changes, to re-run the effect and start or stop the loop.
  const [tick, setTick] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;

    // Spare height as a share of the image's own height — the translate is a
    // percentage of the element being moved, not of its container.
    const shift = ((overscan - 1) / overscan) * 100;

    // Park mid-travel so the framing still looks deliberate when nothing moves.
    const park = () => {
      img.style.transform = `translate3d(0, ${(-shift / 2).toFixed(3)}%, 0)`;
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    if (reduced.matches || !wide.matches) {
      park();
      // Re-run if the viewport crosses the breakpoint, or the preference
      // changes, so a resize picks the drift up rather than staying parked.
      const onChange = () => setTick((n) => n + 1);
      reduced.addEventListener('change', onChange);
      wide.addEventListener('change', onChange);
      return () => {
        reduced.removeEventListener('change', onChange);
        wide.removeEventListener('change', onChange);
      };
    }

    const onBreakpoint = () => setTick((n) => n + 1);
    reduced.addEventListener('change', onBreakpoint);
    wide.addEventListener('change', onBreakpoint);

    let raf = 0;
    let running = false;
    let last = -1;

    // Park it at the start of the travel so the first painted frame matches
    // where the loop will take over, rather than jumping on first tick.
    img.style.transform = `translate3d(0, ${(-shift).toFixed(3)}%, 0)`;

    const tick = () => {
      raf = 0;
      const r = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the frame's top meets the bottom edge, 1 as its bottom clears the top
      const travel = vh + r.height;
      const p = travel > 0 ? Math.min(Math.max((vh - r.top) / travel, 0), 1) : 0;
      if (p !== last) {
        last = p;
        // Drifts from -shift up to 0, which is the direction a fixed
        // background moves relative to its frame: as the page scrolls down the
        // image slides down within the window, so it reads as further away.
        // The opposite sign makes it appear to move faster than the page.
        img.style.transform = `translate3d(0, ${(-(1 - p) * shift).toFixed(3)}%, 0)`;
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running && !raf) raf = requestAnimationFrame(tick);
    });

    const onResize = () => {
      last = -1;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    io.observe(frame);
    window.addEventListener('resize', onResize);
    tick();

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
      reduced.removeEventListener('change', onBreakpoint);
      wide.removeEventListener('change', onBreakpoint);
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [overscan, minWidth, tick]);

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="absolute inset-x-0 top-0 w-full object-cover will-change-transform"
        style={{ height: `${overscan * 100}%` }}
      />
    </div>
  );
}
