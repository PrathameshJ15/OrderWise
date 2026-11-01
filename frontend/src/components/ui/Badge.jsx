import React from 'react';

/**
 * Standardized Pill Badge
 * Design System: Pill shape (999px), IBM Plex Mono 500 12px.
 * Default/accent badge: --ac (#E50914) pill, white mono text.
 * Status colors (green, amber, pink-red) are separate from accent.
 */
export default function Badge({ priority, variant = 'default', className = '', children }) {
  if (priority) {
    const p = String(priority).toUpperCase();
    let style = 'bg-[#232323] text-t2 border border-bd';

    switch (p) {
      case 'CRITICAL':
        style = 'bg-no/15 text-no border border-no/30';
        break;
      case 'HIGH':
        style = 'bg-wa/15 text-wa border border-wa/30';
        break;
      case 'MEDIUM':
        style = 'bg-[#2A2A2A] text-[#FFFFFF] border border-[#3A3A3A]';
        break;
      case 'LOW':
        style = 'bg-[#1A1A1A] text-t2 border border-bd';
        break;
      default:
        style = 'bg-[#232323] text-t2 border border-bd';
    }

    return (
      <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-[12px] font-mono font-medium ${style} ${className}`}>
        {p}
      </span>
    );
  }

  let variantStyle = 'bg-ac text-white';

  if (variant === 'active' || variant === 'success') {
    variantStyle = 'bg-ok/15 text-ok border border-ok/30';
  } else if (variant === 'warning' || variant === 'partial') {
    variantStyle = 'bg-wa/15 text-wa border border-wa/30';
  } else if (variant === 'danger' || variant === 'deferred') {
    variantStyle = 'bg-no/15 text-no border border-no/30';
  } else if (variant === 'coming-soon' || variant === 'roadmap') {
    variantStyle = 'bg-[#232323] text-t2 border border-dashed border-bd';
  } else if (variant === 'secondary') {
    variantStyle = 'bg-[#232323] text-t2 border border-bd';
  }

  return (
    <span className={`inline-flex items-center rounded-pill px-3 py-1 text-[12px] font-mono font-medium ${variantStyle} ${className}`}>
      {children}
    </span>
  );
}
