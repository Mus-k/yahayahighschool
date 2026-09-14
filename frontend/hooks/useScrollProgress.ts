'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Reports how far a tall section has scrolled through the viewport, as 0→1.
 *
 * Deliberately does NOT listen for scroll events. This app wraps everything in
 * Lenis (`ReactLenis root`), which intercepts scrolling entirely — a probe
 * confirmed window 'scroll' fires zero times while the page is actually
 * moving, and assigning scrollTop is clamped straight back. Any handler hung
 * off 'scroll' silently never runs.
 *
 * So we sample the element's own rect on requestAnimationFrame instead, which
 * is true regardless of how scrolling is implemented. An IntersectionObserver
 * gates the loop so it only runs while the section is on screen.
 *
 * `apply` is called only when the value actually changes.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  apply: (el: HTMLElement, p: number) => void,
) {
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let running = false;
    let last = -1;

    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = travel > 0 ? Math.min(Math.max(-r.top / travel, 0), 1) : 0;
      if (p !== last) {
        last = p;
        applyRef.current(el, p);
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running && !raf) raf = requestAnimationFrame(frame);
    });

    // A resize can change what `apply` should do (callers gate on breakpoints)
    // without changing p at all, so force the next frame to re-apply.
    const onResize = () => {
      last = -1;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    io.observe(el);
    window.addEventListener('resize', onResize);
    frame();

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
