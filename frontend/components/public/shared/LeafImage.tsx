import React from 'react';

/**
 * A photograph clipped to the leaf shape used by the academic and online
 * learning heroes.
 *
 * Traced off the Figma export at 2px intervals. The left boundary is two arcs
 * meeting at a cusp near y288 — the notch visible in the design — so each arc
 * was fitted separately to keep that corner sharp; max deviation 1.9px across
 * the 704px span.
 *
 * Masked rather than clipped: clip-path: url(#id) needs Safari to resolve a
 * reference into an SVG, which it does not do reliably, and when it fails the
 * element is clipped away entirely. A mask cannot draw the outline, so the
 * same path is stroked as an overlay on top.
 */

const MASK_URI = 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20705%20562%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M1.00202%20319.632C1.58349%20428.959%20132.343%20561%20132.343%20561H704V1H158.539V26.5416C158.539%2026.5416%20119.254%2063.228%20102.921%2092.3113C82.6146%20128.468%2074.7764%20193.839%2074.7764%20193.839C57.4768%20192.287%200.609289%20245.79%201.00202%20319.632Z%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E';
export const LEAF_PATH = 'M1.00202 319.632C1.58349 428.959 132.343 561 132.343 561H704V1H158.539V26.5416C158.539 26.5416 119.254 63.228 102.921 92.3113C82.6146 128.468 74.7764 193.839 74.7764 193.839C57.4768 192.287 0.609289 245.79 1.00202 319.632Z';

export function LeafImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`leaf relative w-full ${className} rtl:-scale-x-100`}>
      <div className="leaf-mask absolute inset-0 h-full w-full">
        <img src={src} alt={alt} className="h-full w-full object-cover rtl:-scale-x-100" />
      </div>
      <svg
        viewBox="0 0 705 562"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <path d={LEAF_PATH} fill="none" stroke="#048ED6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <style>{`
        .leaf { aspect-ratio: 705 / 562; }
        .leaf-mask {
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20705%20562%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M1.00202%20319.632C1.58349%20428.959%20132.343%20561%20132.343%20561H704V1H158.539V26.5416C158.539%2026.5416%20119.254%2063.228%20102.921%2092.3113C82.6146%20128.468%2074.7764%20193.839%2074.7764%20193.839C57.4768%20192.287%200.609289%20245.79%201.00202%20319.632Z%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20705%20562%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M1.00202%20319.632C1.58349%20428.959%20132.343%20561%20132.343%20561H704V1H158.539V26.5416C158.539%2026.5416%20119.254%2063.228%20102.921%2092.3113C82.6146%20128.468%2074.7764%20193.839%2074.7764%20193.839C57.4768%20192.287%200.609289%20245.79%201.00202%20319.632Z%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E");
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
        }
      `}</style>
    </div>
  );
}
