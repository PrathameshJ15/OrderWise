import React from 'react';

/**
 * AnimatedRedWaves
 * Signature OrderWise animated flowing red wave & energy mesh background.
 *
 * Recreates the three visual wave compositions from the design reference:
 *  - Top-Right: Flowing red mesh waves and diagonal energy curves behind warehouse/hero
 *  - Bottom-Left: Layered curved wave ribbons fading toward the center
 *  - Bottom-Right: Abstract glowing wave accent balancing the lower right edge
 *
 * Visual Palette:
 *  - Background: #08090D / #0A0A0A
 *  - Primary Red: #E11D32
 *  - Deep Burgundy: #450A16
 *  - Red Glow: rgba(225, 29, 50, 0.20)
 *  - Secondary Glow: rgba(120, 10, 30, 0.15)
 *
 * Properties:
 *  - variant: 'full' (all 3 compositions for Landing page),
 *             'corner' (top-right only for Auth & Layouts),
 *             'subtle' (soft accent)
 */

export default function AnimatedRedWaves({ variant = 'full', className = '' }) {
  // 1. Top-Right Ribbon Curves (Harmonic flowing mesh)
  const trCurves = [
    { d: 'M 80,-40 C 240,110 500,190 760,140 C 890,115 970,60 1060,10', width: 2.2, opacity: 0.85 },
    { d: 'M 110,-30 C 270,125 520,205 780,158 C 910,132 990,80 1070,30', width: 1.8, opacity: 0.75 },
    { d: 'M 145,-20 C 300,142 545,222 805,178 C 930,152 1010,102 1085,55', width: 1.5, opacity: 0.65 },
    { d: 'M 185,-10 C 335,162 575,242 830,200 C 955,175 1030,128 1100,82', width: 1.6, opacity: 0.70 },
    { d: 'M 230,0 C 375,184 610,265 860,225 C 980,200 1055,155 1115,112', width: 2.0, opacity: 0.80 },
    { d: 'M 280,15 C 420,208 650,290 890,252 C 1005,228 1078,185 1130,145', width: 1.4, opacity: 0.60 },
    { d: 'M 335,30 C 470,235 695,318 925,282 C 1035,258 1100,218 1145,180', width: 1.2, opacity: 0.50 },
    { d: 'M 395,50 C 525,264 745,348 965,315 C 1065,290 1125,252 1160,218', width: 1.5, opacity: 0.45 },
    { d: 'M 460,75 C 585,295 800,380 1010,350 C 1095,325 1150,290 1175,258', width: 1.0, opacity: 0.35 },
    { d: 'M 530,105 C 650,330 860,415 1060,390 C 1130,365 1175,330 1190,300', width: 0.9, opacity: 0.25 },
  ];

  // Secondary crossing harmonic wave for organic mesh depth
  const trCrossRibbon = [
    { d: 'M 320,-60 C 420,130 680,210 940,320 C 1020,360 1080,410 1120,480', width: 1.6, opacity: 0.55 },
    { d: 'M 360,-45 C 460,145 710,228 970,342 C 1045,382 1105,435 1140,505', width: 1.3, opacity: 0.45 },
    { d: 'M 405,-30 C 505,162 745,248 1005,365 C 1075,405 1130,460 1160,530', width: 1.8, opacity: 0.60 },
    { d: 'M 455,-15 C 555,180 785,270 1045,390 C 1110,430 1160,488 1185,560', width: 1.2, opacity: 0.40 },
  ];

  // 2. Bottom-Left Ribbon Curves (Signature flowing mesh from bottom-left corner)
  const blCurves = [
    { d: 'M -50,480 C 80,410 220,350 420,380 C 560,400 680,460 820,530', width: 1.2, opacity: 0.35 },
    { d: 'M -40,495 C 95,425 240,365 440,398 C 580,418 700,478 840,545', width: 1.0, opacity: 0.30 },
    { d: 'M -30,510 C 110,440 265,382 465,418 C 600,438 720,495 860,560', width: 0.9, opacity: 0.25 },
    { d: 'M -20,525 C 125,455 290,400 490,438 C 620,458 740,512 880,575', width: 1.1, opacity: 0.28 },
    { d: 'M -10,540 C 140,470 315,420 515,460 C 640,478 760,530 900,590', width: 1.2, opacity: 0.32 },
    { d: 'M 5,555 C 160,490 340,440 540,482 C 660,500 780,550 920,605', width: 0.9, opacity: 0.22 },
    { d: 'M 20,570 C 180,510 370,462 570,505 C 680,520 800,570 940,620', width: 0.8, opacity: 0.18 },
    { d: 'M 40,585 C 200,530 400,485 600,530 C 705,545 820,590 960,635', width: 0.9, opacity: 0.15 },
    { d: 'M 65,600 C 225,552 435,510 630,555 C 730,570 840,610 980,650', width: 0.7, opacity: 0.12 },
    { d: 'M 95,615 C 250,575 470,535 665,580 C 755,595 860,630 1000,665', width: 0.6, opacity: 0.08 },
  ];

  // Secondary crossing harmonic wave for organic mesh depth in bottom-left
  const blCrossRibbon = [
    { d: 'M 40,600 C 120,480 260,420 440,380 C 530,360 620,360 720,380', width: 1.0, opacity: 0.18 },
    { d: 'M 75,615 C 150,498 290,438 470,398 C 555,378 645,378 740,398', width: 0.8, opacity: 0.14 },
    { d: 'M 115,630 C 185,515 325,458 505,418 C 585,398 670,395 760,418', width: 1.0, opacity: 0.16 },
    { d: 'M 160,645 C 225,535 360,480 540,440 C 615,418 695,415 780,438', width: 0.7, opacity: 0.10 },
  ];

  // 3. Bottom-Right Balancing Ribbon
  const brCurves = [
    { d: 'M 620,360 C 470,290 320,270 120,330 C 50,352 0,390 -40,430', width: 1.8, opacity: 0.55 },
    { d: 'M 640,382 C 495,310 345,288 145,348 C 75,370 20,410 -20,450', width: 1.4, opacity: 0.45 },
    { d: 'M 662,405 C 522,332 372,308 172,368 C 100,390 42,430 0,472', width: 1.2, opacity: 0.35 },
    { d: 'M 685,430 C 550,355 400,330 200,390 C 128,412 65,452 20,495', width: 1.5, opacity: 0.40 },
  ];

  const showTopRight = variant === 'full' || variant === 'corner' || variant === 'subtle';
  const showBottomLeft = variant === 'full' || variant === 'bottom-left';
  const showBottomRight = variant === 'full';

  return (
    <div
      className={`orderwise-waves absolute inset-0 pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* ====================================================================
          SVG DEFINITIONS (SHARED GRADIENTS & RADIAL GLOWS)
          ==================================================================== */}
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          {/* Primary Top-Right Linear Stroke Gradient */}
          <linearGradient id="owRedWaveStrokeTR" x1="0%" y1="0%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#450A16" stopOpacity="0.25" />
            <stop offset="25%" stopColor="#991B1B" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#E11D32" stopOpacity="1" />
            <stop offset="78%" stopColor="#E53935" stopOpacity="0.85" />
            <stop offset="92%" stopColor="#450A16" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#08090D" stopOpacity="0" />
          </linearGradient>

          {/* Crossing Ribbon Stroke Gradient */}
          <linearGradient id="owRedWaveCrossTR" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#08090D" stopOpacity="0" />
            <stop offset="30%" stopColor="#E11D32" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#7F1D1D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#450A16" stopOpacity="0.1" />
          </linearGradient>

          {/* Bottom-Left Linear Stroke Gradient */}
          <linearGradient id="owRedWaveStrokeBL" x1="0%" y1="100%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="#450A16" stopOpacity="0.25" />
            <stop offset="25%" stopColor="#991B1B" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#E11D32" stopOpacity="1" />
            <stop offset="78%" stopColor="#E53935" stopOpacity="0.85" />
            <stop offset="92%" stopColor="#450A16" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#08090D" stopOpacity="0" />
          </linearGradient>

          {/* Bottom-Left Crossing Ribbon Gradient */}
          <linearGradient id="owRedWaveCrossBL" x1="10%" y1="100%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#08090D" stopOpacity="0" />
            <stop offset="30%" stopColor="#E11D32" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#7F1D1D" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#450A16" stopOpacity="0.1" />
          </linearGradient>

          {/* Bottom-Right Linear Stroke Gradient */}
          <linearGradient id="owRedWaveStrokeBR" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#450A16" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#E11D32" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#991B1B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#08090D" stopOpacity="0" />
          </linearGradient>

          {/* Atmospheric Radial Glow - Top Right */}
          <radialGradient id="owAtmosphericGlowTR" cx="72%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#E11D32" stopOpacity="0.22" />
            <stop offset="35%" stopColor="#7F1D1D" stopOpacity="0.16" />
            <stop offset="60%" stopColor="#450A16" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#08090D" stopOpacity="0" />
          </radialGradient>

          {/* Atmospheric Radial Glow - Bottom Left */}
          <radialGradient id="owAtmosphericGlowBL" cx="20%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#E11D32" stopOpacity="0.08" />
            <stop offset="40%" stopColor="#7F1D1D" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#450A16" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#08090D" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* ====================================================================
          A. TOP-RIGHT CORNER COMPOSITION
          Flowing red mesh waves and energy ribbons passing behind warehouse
          ==================================================================== */}
      {showTopRight && (
        <div
          className="absolute -top-12 -right-16 w-[70vw] min-w-[560px] max-w-[1080px] h-[580px] lg:h-[720px] pointer-events-none"
          aria-hidden="true"
        >
          {/* Atmospheric Burgundy/Red Radial Glow Backdrop */}
          <div
            className="absolute top-0 right-0 w-full h-full rounded-full blur-[90px] opacity-90 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 75% 25%, rgba(225, 29, 50, 0.20) 0%, rgba(69, 10, 22, 0.22) 42%, rgba(8, 9, 13, 0) 75%)',
            }}
          />

          {/* Animated SVG Mesh Ribbon */}
          <svg
            viewBox="0 0 1200 650"
            fill="none"
            className="w-full h-full animate-wave-tr"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Primary Mesh Lines */}
            {trCurves.map((curve, idx) => (
              <path
                key={`tr-${idx}`}
                d={curve.d}
                stroke="url(#owRedWaveStrokeTR)"
                strokeWidth={curve.width}
                strokeOpacity={curve.opacity}
                strokeLinecap="round"
              />
            ))}

            {/* Intersecting Wave Ribbon */}
            {trCrossRibbon.map((curve, idx) => (
              <path
                key={`tr-cross-${idx}`}
                d={curve.d}
                stroke="url(#owRedWaveCrossTR)"
                strokeWidth={curve.width}
                strokeOpacity={curve.opacity}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      )}

      {/* ====================================================================
          B. BOTTOM-LEFT CORNER COMPOSITION
          Signature flowing red mesh waves from bottom-left corner
          ==================================================================== */}
      {showBottomLeft && (
        <div
          className="absolute bottom-0 left-0 w-[45vw] min-w-[280px] max-w-[500px] h-[160px] sm:h-[200px] lg:h-[240px] pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Atmospheric Soft Glow Backdrop */}
          <div
            className="absolute bottom-0 left-0 w-full h-full rounded-full blur-[60px] opacity-35 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(225, 29, 50, 0.14) 0%, rgba(69, 10, 22, 0.10) 45%, rgba(8, 9, 13, 0) 80%)',
            }}
          />

          {/* Animated Wave SVG */}
          <svg
            viewBox="0 0 1100 600"
            fill="none"
            className="w-full h-full animate-wave-bl"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Primary Mesh Lines */}
            {blCurves.map((curve, idx) => (
              <path
                key={`bl-${idx}`}
                d={curve.d}
                stroke="url(#owRedWaveStrokeBL)"
                strokeWidth={curve.width}
                strokeOpacity={curve.opacity}
                strokeLinecap="round"
              />
            ))}

            {/* Intersecting Cross Mesh Ribbon */}
            {blCrossRibbon.map((curve, idx) => (
              <path
                key={`bl-cross-${idx}`}
                d={curve.d}
                stroke="url(#owRedWaveCrossBL)"
                strokeWidth={curve.width}
                strokeOpacity={curve.opacity}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      )}

      {/* ====================================================================
          C. BOTTOM-RIGHT CORNER COMPOSITION
          Smaller abstract wave composition balancing the right edge
          ==================================================================== */}
      {showBottomRight && (
        <div
          className="absolute -bottom-12 -right-8 w-[40vw] min-w-[340px] max-w-[620px] h-[280px] lg:h-[380px] pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          {/* Atmospheric Glow */}
          <div
            className="absolute bottom-0 right-0 w-full h-full rounded-full blur-[80px] opacity-70 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 55% 45% at 75% 75%, rgba(225, 29, 50, 0.14) 0%, rgba(69, 10, 22, 0.14) 50%, rgba(8, 9, 13, 0) 80%)',
            }}
          />

          <svg
            viewBox="0 0 700 520"
            fill="none"
            className="w-full h-full animate-wave-br"
            preserveAspectRatio="xMidYMid meet"
          >
            {brCurves.map((curve, idx) => (
              <path
                key={`br-${idx}`}
                d={curve.d}
                stroke="url(#owRedWaveStrokeBR)"
                strokeWidth={curve.width}
                strokeOpacity={curve.opacity}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
