import React from 'react';

/**
 * Standardized Pill Badge
 * Design System: Pill shape (999px), JetBrains / IBM Plex Mono 500 12px.
 * Default/accent badge: --ac (#E50914) pill, white mono text.
 * Status colors (green, amber, red) are separate from accent.
 */
export default function Badge({ priority, variant = 'default', className = '', children }) {
  if (priority) {
    const p = String(priority).toUpperCase();
    let style = 'bg-s2 text-t2 border border-bd';

    switch (p) {
      case 'CRITICAL':
        style = 'bg-no/15 text-no border border-no/30';
        break;
      case 'HIGH':
        style = 'bg-wa/15 text-wa border border-wa/30';
        break;
      case 'MEDIUM':
        style = 'bg-s2 text-t border border-bd';
        break;
      case 'LOW':
        style = 'bg-s text-t2 border border-bd';
        break;
      default:
        style = 'bg-s2 text-t2 border border-bd';
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
    variantStyle = 'bg-s2 text-t2 border border-dashed border-bd';
  } else if (variant === 'secondary') {
    variantStyle = 'bg-s2 text-t2 border border-bd';
  }

  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-[12px] font-mono font-medium ${variantStyle} ${className}`}
    >
      {children}
    </span>
  );
}
