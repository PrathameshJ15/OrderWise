

























import React from 'react';
import AnimatedRedWaves from './AnimatedRedWaves';

/**
 * AmbientLighting
 * Recreates the exact soft ambient lighting and signature animated red waves:
 * - Fluid animated red wave ribbons (#E11D32 / #450A16) in top-right, bottom-left, and bottom-right.
 * - Soft OrderWise industrial red glow replacing flat dark backdrops.
 * - Same softness, intensity, diffusion and spread as the reference design.
 * - Fades naturally into the deep black background (#08090D / #0A0A0A).
 * - No neon, bloom, or harsh red shadows.
 * - Subtle dark architectural grid overlay.
 * - Smooth breathing animation with reduced-motion accessibility support.
 */
export default function AmbientLighting({
  className = '',
  withGrid = true,
  withWaves = true,
  wavesVariant = 'full',
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Subtle architectural dark grid overlay */}
      {withGrid && (
        <div
          className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-80"
          aria-hidden="true"
        />
      )}

      {/* Signature Animated Flowing Red Wave Ribbons */}
      {withWaves && <AnimatedRedWaves variant={wavesVariant} />}

      {/* Primary soft diffused radial red glow */}
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

