import React from 'react';

export default function StatusPill({ status, className = '' }) {
  const s = String(status || 'pending').toLowerCase();

  const styles = {
    // Allocation Statuses
    fulfilled: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    partially_fulfilled: 'bg-arcade-warning/15 text-arcade-warning border-arcade-warning/40',
    deferred: 'bg-arcade-danger/15 text-arcade-danger border-arcade-danger/40',

    // Order Lifecycle Statuses
    draft: 'bg-arcade-secondary/15 text-arcade-secondary border-arcade-border',
    submitted: 'bg-arcade-secondary/15 text-arcade-primary border-arcade-border',
    confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    allocated: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    partially_allocated: 'bg-arcade-warning/15 text-arcade-warning border-arcade-warning/40',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    shipped: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-arcade-danger/15 text-arcade-danger border-arcade-danger/40',
    pending: 'bg-arcade-secondary/15 text-arcade-secondary border-arcade-border',
  };

  const currentStyle = styles[s] || 'bg-arcade-secondary/15 text-arcade-secondary border-arcade-border';
  const label = s.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${currentStyle} ${className}`}
    >
      {label}
    </span>
  );
}

export function PriorityPill({ priority, className = '' }) {
  const p = (priority || 'MEDIUM').toUpperCase();

  const styles = {
    CRITICAL: 'bg-arcade-danger/15 text-arcade-danger border-arcade-danger/40',
    HIGH: 'bg-arcade-warning/15 text-arcade-warning border-arcade-warning/40',
    MEDIUM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    LOW: 'bg-arcade-secondary/15 text-arcade-secondary border-arcade-border',
  };

  const currentStyle = styles[p] || styles.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {p}
    </span>
  );
}

export function ConfidencePill({ confidence, className = '' }) {
  const c = (confidence || 'low').toLowerCase();

  const styles = {
    high: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    medium: 'bg-arcade-warning/15 text-arcade-warning border-arcade-warning/40',
    low: 'bg-arcade-secondary/15 text-arcade-secondary border-arcade-border',
  };

  const currentStyle = styles[c] || styles.low;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${currentStyle} ${className}`}
    >
      Confidence: {c}
    </span>
  );
}

export function RecommendationStatusPill({ status, className = '' }) {
  const s = (status || 'pending').toLowerCase();

  const styles = {
    pending: 'bg-arcade-warning/10 text-arcade-warning border-arcade-warning/40 animate-pulse',
    approved: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    overridden: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    rejected: 'bg-arcade-danger/15 text-arcade-danger border-arcade-danger/40',
  };

  const currentStyle = styles[s] || styles.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${currentStyle} ${className}`}
    >
      {s}
    </span>
  );
}
