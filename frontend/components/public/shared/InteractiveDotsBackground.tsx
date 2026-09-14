'use client';

import React, { useRef } from 'react';

export function InteractiveDotsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !spotlightRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Direct DOM manipulation for buttery smooth 60fps performance (bypasses React state)
    spotlightRef.current.style.maskImage = `radial-gradient(circle 400px at ${x}px ${y}px, black 0%, transparent 100%)`;
    spotlightRef.current.style.webkitMaskImage = `radial-gradient(circle 400px at ${x}px ${y}px, black 0%, transparent 100%)`;
  };

  const handleMouseEnter = () => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '0.85';
    }
  };
  
  const handleMouseLeave = () => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base dots (always visible but faint) */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Spotlight dots (much brighter, slightly thicker dots where mouse is) */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:24px_24px] transition-opacity duration-300 ease-out"
        style={{
          opacity: 0,
        }}
      />
    </div>
  );
}
