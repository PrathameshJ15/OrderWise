import React, { useState, useEffect, useRef } from 'react';

/**
 * IsometricWarehouseVisual - Scene 1: Landing Page Hero
 *
 * Built directly from the exact reference geometry in `docs/reference/orderwise-3d-hero.svg`.
 * Exact axonometric 30-degree isometric projection, warehouse platform slab,
 * 11 inventory boxes with authentic facet shading, red priority order boxes,
 * dashed supply routes, pill labels, and animated route indicator.
 */
export default function IsometricWarehouseVisual() {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Safely check user preference for reduced motion (guarded for SSR and test environments)
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(motionQuery.matches);

      const handler = (e) => setPrefersReducedMotion(e.matches);
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handler);
        return () => motionQuery.removeEventListener('change', handler);
      }
    }
  }, []);

  // Subtle mouse parallax handler (max 6px offset)
  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Math.round(xPct * 6),
      y: Math.round(yPct * 6),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-[14px] bg-[#161616] border border-[#2A2A2A] overflow-hidden select-none transition-transform duration-300 ease-out"
      style={{
        transform: prefersReducedMotion
          ? 'none'
          : `perspective(900px) rotateX(${-tilt.y * 0.4}deg) rotateY(${tilt.x * 0.4}deg)`,
      }}
      role="region"
      aria-label="Isometric illustration of warehouse inventory storage racks, priority fulfillment boxes, and supply route"
    >
      {/* Soft red radial ambient lighting in upper-right corner */}
      <div
        className="absolute top-0 right-0 w-[300px] h-[240px] pointer-events-none rounded-full blur-[70px]"
        style={{
          background: 'radial-gradient(circle at 75% 20%, rgba(229, 9, 20, 0.22), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Top Header Strip inside Card */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#161616]/90 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#E50914] inline-block animate-pulse" />
          <span className="text-[12px] font-mono text-[#A8A8A8] tracking-wide">
            Automated Facility &bull; Priority Routing
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#A8A8A8]">
          Real-time Dispatch
        </span>
      </div>

      {/* Exact Isometric SVG Canvas matching docs/reference/orderwise-3d-hero.svg */}
      <div className="relative w-full aspect-[667/560] min-h-[300px] flex items-center justify-center p-2 sm:p-4">
        <svg
          viewBox="-333 -268 667 618"
          className="w-full h-full overflow-visible select-none"
          role="img"
          aria-label="Isometric warehouse with red priority orders"
        >
          {/* Layer 0: Ground Platform Slab & Isometric Grid */}
          <g className="l0">
            {/* Slab Left Edge */}
            <polygon
              points="-323.9,153.0 0.0,340.0 0.0,326.4 -323.9,139.4"
              fill="#111"
              stroke="#3a3a3a"
              strokeWidth=".8"
              strokeLinejoin="round"
            />
            {/* Slab Right Edge */}
            <polygon
              points="323.9,153.0 0.0,340.0 0.0,326.4 323.9,139.4"
              fill="#0c0c0c"
              stroke="#3a3a3a"
              strokeWidth=".8"
              strokeLinejoin="round"
            />
            {/* Slab Top Rhombus */}
            <polygon
              points="0.0,-47.6 323.9,139.4 0.0,326.4 -323.9,139.4"
              fill="#1d1d1d"
              stroke="#3a3a3a"
              strokeWidth=".8"
              strokeLinejoin="round"
            />

            {/* Isometric Floor Grid Lines */}
            <polyline points="17.7,-23.8 -282.7,149.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-17.7,-23.8 282.7,149.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="47.1,-6.8 -253.2,166.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-47.1,-6.8 253.2,166.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="76.6,10.2 -223.8,183.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-76.6,10.2 223.8,183.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="106.0,27.2 -194.3,200.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-106.0,27.2 194.3,200.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="135.4,44.2 -164.9,217.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-135.4,44.2 164.9,217.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="164.9,61.2 -135.4,234.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-164.9,61.2 135.4,234.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="194.3,78.2 -106.0,251.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-194.3,78.2 106.0,251.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="223.8,95.2 -76.6,268.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-223.8,95.2 76.6,268.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="253.2,112.2 -47.1,285.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-253.2,112.2 47.1,285.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="282.7,129.2 -17.7,302.6" stroke="#262626" strokeWidth=".7" fill="none" />
            <polyline points="-282.7,129.2 17.7,302.6" stroke="#262626" strokeWidth=".7" fill="none" />

            {/* Primary Red Supply Route */}
            <polyline
              points="0.0,71.4 88.3,122.4 0.0,173.4 97.2,229.5"
              fill="none"
              stroke="#E50914"
              strokeWidth="1.6"
              strokeDasharray="5 5"
              opacity=".9"
            />

            {/* Secondary Grey Route */}
            <polyline
              points="-88.3,122.4 -185.5,178.5"
              fill="none"
              stroke="#555"
              strokeWidth="1.2"
              strokeDasharray="4 5"
            />
          </g>

          {/* Layer 1: 11 Isometric Boxes */}
          <g className="l1">
            {/* Box 1 (Standard Neutral) */}
            <g>
              <polygon points="-58.9,20.4 0.0,54.4 0.0,13.6 -58.9,-20.4" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="58.9,20.4 0.0,54.4 0.0,13.6 58.9,-20.4" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="0.0,-54.4 58.9,-20.4 0.0,13.6 -58.9,-20.4" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 2 (Standard Neutral) */}
            <g>
              <polygon points="29.4,71.4 88.3,105.4 88.3,71.4 29.4,37.4" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="147.2,71.4 88.3,105.4 88.3,71.4 147.2,37.4" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="88.3,3.4 147.2,37.4 88.3,71.4 29.4,37.4" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 3 (Standard Neutral) */}
            <g>
              <polygon points="-147.2,71.4 -88.3,105.4 -88.3,44.2 -147.2,10.2" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-29.4,71.4 -88.3,105.4 -88.3,44.2 -29.4,10.2" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-88.3,-23.8 -29.4,10.2 -88.3,44.2 -147.2,10.2" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 4 (Standard Neutral) */}
            <g>
              <polygon points="117.8,122.4 176.7,156.4 176.7,102.0 117.8,68.0" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="235.6,122.4 176.7,156.4 176.7,102.0 235.6,68.0" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="176.7,34.0 235.6,68.0 176.7,102.0 117.8,68.0" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 5: Priority Red Box (Critical Order) */}
            <g>
              <polygon points="-58.9,122.4 0.0,156.4 0.0,74.8 -58.9,40.8" fill="#b30710" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="58.9,122.4 0.0,156.4 0.0,74.8 58.9,40.8" fill="#7a0509" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="0.0,6.8 58.9,40.8 0.0,74.8 -58.9,40.8" fill="#ff2f3a" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 6 (Standard Neutral) */}
            <g>
              <polygon points="-235.6,122.4 -176.7,156.4 -176.7,122.4 -235.6,88.4" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-117.8,122.4 -176.7,156.4 -176.7,122.4 -117.8,88.4" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-176.7,54.4 -117.8,88.4 -176.7,122.4 -235.6,88.4" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 7: Priority Red Box (High Priority) */}
            <g>
              <polygon points="29.4,173.4 88.3,207.4 88.3,166.6 29.4,132.6" fill="#b30710" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="147.2,173.4 88.3,207.4 88.3,166.6 147.2,132.6" fill="#7a0509" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="88.3,98.6 147.2,132.6 88.3,166.6 29.4,132.6" fill="#ff2f3a" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 8 (Standard Neutral) */}
            <g>
              <polygon points="-147.2,173.4 -88.3,207.4 -88.3,159.8 -147.2,125.8" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-29.4,173.4 -88.3,207.4 -88.3,159.8 -29.4,125.8" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-88.3,91.8 -29.4,125.8 -88.3,159.8 -147.2,125.8" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 9 (Standard Neutral) */}
            <g>
              <polygon points="-58.9,224.4 0.0,258.4 0.0,190.4 -58.9,156.4" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="58.9,224.4 0.0,258.4 0.0,190.4 58.9,156.4" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="0.0,122.4 58.9,156.4 0.0,190.4 -58.9,156.4" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 10: Stacked Small Box */}
            <g>
              <polygon points="-123.7,10.2 -88.3,30.6 -88.3,-3.4 -123.7,-23.8" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-53.0,10.2 -88.3,30.6 -88.3,-3.4 -53.0,-23.8" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="-88.3,-44.2 -53.0,-23.8 -88.3,-3.4 -123.7,-23.8" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>

            {/* Box 11: Stacked Small Box */}
            <g>
              <polygon points="53.0,37.4 88.3,57.8 88.3,30.6 53.0,10.2" fill="#1b1b1b" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="123.7,37.4 88.3,57.8 88.3,30.6 123.7,10.2" fill="#121212" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
              <polygon points="88.3,-10.2 123.7,10.2 88.3,30.6 53.0,10.2" fill="#2c2c2c" stroke="#3a3a3a" strokeWidth=".8" strokeLinejoin="round" />
            </g>
          </g>

          {/* Layer 2: Pill Labels & Route Indicator */}
          <g className="l2">
            {/* Pill 1: Critical Order (Red) */}
            <g>
              <line x1="0.0" y1="40.8" x2="0.0" y2="26.8" stroke="#E50914" />
              <rect x="-54.2" y="4.8" width="108.4" height="22" rx="11" fill="#E50914" stroke="#E50914" />
              <text x="0.0" y="19.8" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#fff" fontWeight="500">
                Critical order
              </text>
            </g>

            {/* Pill 2: High Priority (Dark / Neutral) */}
            <g>
              <line x1="88.3" y1="132.6" x2="88.3" y2="118.6" stroke="#3a3a3a" />
              <rect x="37.4" y="96.6" width="101.8" height="22" rx="11" fill="#161616" stroke="#3a3a3a" />
              <text x="88.3" y="111.6" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#fff" fontWeight="500">
                High priority
              </text>
            </g>

            {/* Moving Indicator along Red Route (paused if prefers-reduced-motion) */}
            {!prefersReducedMotion && (
              <circle r="3.5" fill="#E50914">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path="M 0.0 71.4 L 88.3 122.4 L 0.0 173.4 L 97.2 229.5"
                />
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Bottom Subtext Strip */}
      <div className="px-5 py-2.5 bg-[#0F0F0F] border-t border-[#2A2A2A] flex items-center justify-between text-[11px] font-mono text-[#A8A8A8]">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E50914] inline-block" />
            <span>Priority route active</span>
          </span>
          <span className="hidden sm:inline text-[#555]">&bull;</span>
          <span className="hidden sm:inline">11 Storage bays monitored</span>
        </div>
        <span className="text-[#8A8A8A]">Zero over-allocation</span>
      </div>
    </div>
  );
}
