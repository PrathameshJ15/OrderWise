import React from 'react';

// ─── Status Pill (branch_1: customer portal allocation statuses) ─────────────

const STATUS_CONFIGS = {
  fulfilled: {
    label: 'Fulfilled',
    classes: 'bg-green-100 text-green-800 border-green-200',
    dotClass: 'bg-green-500',
  },
  partially_fulfilled: {
    label: 'Partially Fulfilled',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotClass: 'bg-yellow-500',
  },
  deferred: {
    label: 'Deferred',
    classes: 'bg-red-100 text-red-800 border-red-200',
    dotClass: 'bg-red-500',
  },
  pending: {
    label: 'Pending Allocation',
    classes: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  shipped: {
    label: 'Shipped',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};

const PRIORITY_CONFIGS = {
  critical: { label: 'CRITICAL', classes: 'bg-red-600 text-white font-semibold' },
  high: { label: 'HIGH', classes: 'bg-orange-500 text-white font-semibold' },
  medium: { label: 'MEDIUM', classes: 'bg-blue-500 text-white' },
  low: { label: 'LOW', classes: 'bg-gray-500 text-white' },
};

export function StatusPill({ status, type = 'status', size = 'md' }) {
  if (type === 'priority') {
    const key = (status || '').toLowerCase();
    const config = PRIORITY_CONFIGS[key] || {
      label: status || 'UNKNOWN',
      classes: 'bg-gray-200 text-gray-700',
    };
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

    return (
      <span
        className={`inline-flex items-center rounded-full uppercase tracking-wider ${sizeClasses} ${config.classes}`}
        aria-label={`Priority ${config.label}`}
      >
        {config.label}
      </span>
    );
  }

  const key = (status || 'pending').toLowerCase();
  const config = STATUS_CONFIGS[key] || {
    label: status,
    classes: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${config.classes}`}
      aria-label={`Status: ${config.label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

// ─── Priority Pill (HEAD/main: admin AI recommendations panel) ────────────────

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

// ─── Confidence Pill (HEAD/main: AI recommendation confidence indicator) ──────

export function ConfidencePill({ confidence, className = '' }) {
  const c = (confidence || 'low').toLowerCase();

  const styles = {
    high: 'bg-arcade-success/15 text-arcade-success border-arcade-success/40',
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

// ─── Recommendation Status Pill (HEAD/main: AI approval workflow) ─────────────

export function RecommendationStatusPill({ status, className = '' }) {
  const s = (status || 'pending').toLowerCase();

  const styles = {
    pending: 'bg-arcade-warning/10 text-arcade-warning border-arcade-warning/40 animate-pulse',
    approved: 'bg-arcade-success/15 text-arcade-success border-arcade-success/40',
    overridden: 'bg-arcade-accent/15 text-arcade-accent border-arcade-accent/40',
    rejected: 'bg-arcade-danger/15 text-arcade-danger border-arcade-danger/40',
  };

  const currentStyle = styles[s] || styles.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${currentStyle} ${className}`}
    >
      {s === 'overridden' ? 'Modified' : s}
    </span>
  );
}

export default StatusPill;
