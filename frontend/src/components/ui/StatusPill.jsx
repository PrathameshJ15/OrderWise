import React from 'react';

// ─── Status Pill ─────────────────────────────────────────────────────────────

const STATUS_CONFIGS = {
  fulfilled: {
    label: 'Fulfilled',
    classes: 'bg-ok/15 text-ok border border-ok/30',
    dotClass: 'bg-ok',
  },
  partially_fulfilled: {
    label: 'Partially Fulfilled',
    classes: 'bg-wa/15 text-wa border border-wa/30',
    dotClass: 'bg-wa',
  },
  deferred: {
    label: 'Deferred',
    classes: 'bg-no/15 text-no border border-no/30',
    dotClass: 'bg-no',
  },
  pending: {
    label: 'Pending Allocation',
    classes: 'bg-[#232323] text-t2 border border-bd',
    dotClass: 'bg-series',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-[#1E1E1E] text-t2/70 border border-bd/60',
    dotClass: 'bg-t2/50',
  },
  shipped: {
    label: 'Shipped',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-ok/15 text-ok border border-ok/30',
    dotClass: 'bg-ok',
  },
};

const PRIORITY_CONFIGS = {
  critical: { label: 'CRITICAL', classes: 'bg-no/15 text-no border border-no/30' },
  high: { label: 'HIGH', classes: 'bg-wa/15 text-wa border border-wa/30' },
  medium: { label: 'MEDIUM', classes: 'bg-[#2A2A2A] text-white border border-[#3A3A3A]' },
  low: { label: 'LOW', classes: 'bg-[#1F1F1F] text-t2 border border-bd' },
};

export function StatusPill({ status, type = 'status', size = 'md' }) {
  if (type === 'priority') {
    const key = (status || '').toLowerCase();
    const config = PRIORITY_CONFIGS[key] || {
      label: status || 'UNKNOWN',
      classes: 'bg-[#232323] text-t2 border border-bd',
    };
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]';

    return (
      <span
        className={`inline-flex items-center rounded-pill font-mono font-medium tracking-wide ${sizeClasses} ${config.classes}`}
        aria-label={`Priority ${config.label}`}
      >
        {config.label}
      </span>
    );
  }

  const key = (status || 'pending').toLowerCase();
  const config = STATUS_CONFIGS[key] || {
    label: status,
    classes: 'bg-[#232323] text-t2 border border-bd',
    dotClass: 'bg-series',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill font-mono font-medium ${sizeClasses} ${config.classes}`}
      aria-label={`Status: ${config.label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function PriorityPill({ priority, className = '' }) {
  const p = (priority || 'MEDIUM').toUpperCase();

  const styles = {
    CRITICAL: 'bg-no/15 text-no border border-no/30',
    HIGH: 'bg-wa/15 text-wa border border-wa/30',
    MEDIUM: 'bg-[#2A2A2A] text-white border border-[#3A3A3A]',
    LOW: 'bg-[#1F1F1F] text-t2 border border-bd',
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill font-mono font-medium text-[12px] px-2.5 py-0.5 border ${
        styles[p] || 'bg-[#232323] text-t2 border-bd'
      } ${className}`}
    >
      {p}
    </span>
  );
}

// ─── Confidence Pill (AI recommendation confidence indicator) ────────────────

export function ConfidencePill({ confidence, className = '' }) {
  const c = (confidence || 'low').toLowerCase();

  const styles = {
    high: 'bg-ok/15 text-ok border border-ok/30',
    medium: 'bg-wa/15 text-wa border border-wa/30',
    low: 'bg-[#232323] text-t2 border border-bd',
  };

  const currentStyle = styles[c] || styles.low;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border ${currentStyle} ${className}`}
    >
      Confidence: {c}
    </span>
  );
}

// ─── Recommendation Status Pill (AI approval workflow) ────────────────────────

export function RecommendationStatusPill({ status, className = '' }) {
  const s = (status || 'pending').toLowerCase();

  const styles = {
    pending: 'bg-wa/15 text-wa border border-wa/30 animate-pulse',
    approved: 'bg-ok/15 text-ok border border-ok/30',
    overridden: 'bg-white/10 text-white border border-[#555]',
    rejected: 'bg-no/15 text-no border border-no/30',
  };

  const currentStyle = styles[s] || styles.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border ${currentStyle} ${className}`}
    >
      {s === 'overridden' ? 'Modified' : s}
    </span>
  );
}

export default StatusPill;
