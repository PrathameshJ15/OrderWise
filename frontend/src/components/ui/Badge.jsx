import React from 'react';

/**
 * Standardized Priority and Meta Badge
 */
export default function Badge({ priority, variant = 'default', children }) {
  if (priority) {
    const p = String(priority).toUpperCase();
    let style = 'border-arcade-border text-arcade-secondary bg-arcade-surface';

    switch (p) {
      case 'CRITICAL':
        style = 'border-arcade-danger/40 text-arcade-danger bg-arcade-danger/10';
        break;
      case 'HIGH':
        style = 'border-arcade-warning/40 text-arcade-warning bg-arcade-warning/10';
        break;
      case 'MEDIUM':
        style = 'border-blue-500/40 text-blue-400 bg-blue-500/10';
        break;
      case 'LOW':
        style = 'border-arcade-border text-arcade-secondary bg-arcade-surface';
        break;
      default:
        style = 'border-arcade-border text-arcade-secondary bg-arcade-surface';
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider border ${style}`}>
        {p}
      </span>
    );
  }

  let variantStyle = 'border-arcade-border text-arcade-secondary bg-arcade-surface';
  if (variant === 'active') {
    variantStyle = 'border-arcade-accent/30 text-arcade-accent bg-arcade-accent/10';
  } else if (variant === 'coming-soon') {
    variantStyle = 'border-arcade-border text-arcade-secondary/60 bg-arcade-surface/60 line-through';
  } else if (variant === 'warning') {
    variantStyle = 'border-arcade-warning/40 text-arcade-warning bg-arcade-warning/10';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider border ${variantStyle}`}>
      {children}
    </span>
  );
}
