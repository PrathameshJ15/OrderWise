import React from 'react';

/**
 * AmbientLighting
 * Recreates the exact soft ambient lighting effect from the reference video:
 * - OrderWise red (#E50914) replacing the reference video's soft green glow.
 * - Same softness, intensity, diffusion and spread as the original glow.
 * - Fades naturally into the deep black background (#0A0A0A).
 * - No neon, bloom, or harsh red shadows.
 * - Subtle dark architectural grid overlay.
 * - Smooth breathing animation with reduced-motion accessibility support.
 */
export default function AmbientLighting({ className = '', withGrid = true }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Subtle architectural dark grid overlay from reference video */}
      {withGrid && (
        <div
          className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-80"
          aria-hidden="true"
        />
      )}

      {/* Primary soft diffused radial red glow (#E50914) */}
      <div
        className="ambient-glow-red"
        aria-hidden="true"
      />

      {/* Secondary gentle fill for seamless diffusion across the hero */}
      <div
        className="ambient-glow-red-secondary"
        aria-hidden="true"
      />
    </div>
  );
}

