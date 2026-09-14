'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useLenis } from 'lenis/react';

export type MediaItem = {
  type: 'image' | 'video';
  /** Path under /public, e.g. "/videos/promo1.mp4". */
  src: string;
  /** Names the dialog for screen readers and labels the frame. */
  title?: string;
  /** Images only. */
  alt?: string;
  /** Videos only. */
  poster?: string;
};

type Props = {
  items: MediaItem[];
  /** Index of the open item, or null when closed. */
  index: number | null;
  onClose: () => void;
  /** Omit to disable prev/next — a single-item lightbox. */
  onIndexChange?: (next: number) => void;
};

/**
 * Halt playback and release the source.
 *
 * Unmounting the element is NOT enough on its own. The spec's "pause when
 * removed from a document" step is honoured by Chrome but not reliably by
 * Safari, which happily keeps a detached element's audio running — so the
 * dialog would vanish while the video played on. Dropping the src also aborts
 * the in-flight download rather than letting it finish in the background.
 */
function stopPlayback(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.removeAttribute('src');
  video.load();
}

/**
 * One lightbox for both stills and film, with optional gallery navigation.
 *
 * A video is mounted only while it is the open item — see stopPlayback above
 * for why that matters, and note it applies when stepping between items too,
 * not just on close.
 */
export function MediaLightbox({ items, index, onClose, onIndexChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index] : null;
  const canPage = !!onIndexChange && items.length > 1;

  // Same scroll-lock the mobile menu uses; Lenis owns scrolling, so
  // overflow:hidden on its own would not hold.
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    return () => lenis?.start();
  }, [open, lenis]);

  const handleClose = useCallback(() => {
    // Runs while the element is still mounted, so the ref is live.
    stopPlayback(videoRef.current);
    onClose();
  }, [onClose]);

  const step = useCallback(
    (delta: number) => {
      if (index === null || !onIndexChange || items.length < 2) return;
      // Leaving a video: stop it before the element goes.
      stopPlayback(videoRef.current);
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, onIndexChange, items.length],
  );

  useEffect(() => {
    if (!open) return;

    // Captured now so the cleanup below still has it if React has already
    // cleared the ref by then. Note nothing here starts playback — the film
    // waits on its poster until the viewer presses play.
    const video = videoRef.current;

    restoreTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return handleClose();
      if (e.key === 'ArrowLeft') return step(-1);
      if (e.key === 'ArrowRight') return step(1);
      if (e.key !== 'Tab') return;

      // Keep focus inside the dialog while it owns the screen.
      const root = closeRef.current?.closest('[role="dialog"]');
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>('button, video, [href], [tabindex]:not([tabindex="-1"])'),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreTo.current?.focus?.();
      // Belt and braces: catches unmount paths that never reach handleClose,
      // such as a route change while the video is open.
      stopPlayback(video);
    };
  }, [open, index, handleClose, step]);

  if (!open || !item) return null;

  const label = item.title ?? item.alt ?? (item.type === 'video' ? 'Video' : 'Image');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.type === 'video' ? `Video: ${label}` : label}
      onClick={handleClose}
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/80 p-[clamp(1rem,4vw,3rem)] backdrop-blur-sm animate-[mlb-fade_200ms_ease-out]"
    >
      <div
        // The frame is not the dismiss target — only the backdrop around it is.
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[min(1100px,92vw)] animate-[mlb-rise_260ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="flex items-center justify-between gap-4 pb-3">
          <p className="min-w-0 truncate font-semibold text-white text-[clamp(1rem,1.04vw,1.125rem)]">
            {label}
            {canPage ? (
              <span className="ml-3 font-normal text-white/60">
                {index + 1} / {items.length}
              </span>
            ) : null}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="shrink-0 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {item.type === 'video' ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            autoPlay={false}
            preload="metadata"
            // object-cover so the poster (3:2) fills the frame instead of
            // letterboxing into it. promo1.mp4 is 1.774 against a 1.778 box, so
            // the footage itself loses 0.2% — swap to object-contain if a clip
            // with a genuinely different aspect is ever added.
            className="block aspect-video w-full rounded-lg bg-black object-cover shadow-2xl"
          />
        ) : (
          <img
            src={item.src}
            alt={item.alt ?? ''}
            // Stills are shown whole, never cropped — the frame takes the
            // photograph's own shape rather than forcing one.
            className="mx-auto block max-h-[76vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          />
        )}

        {canPage ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes mlb-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mlb-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.98) }
          to   { opacity: 1; transform: none }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] > div, [role="dialog"] { animation: none !important }
        }
      `}</style>
    </div>
  );
}
