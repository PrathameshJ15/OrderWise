import React from 'react';

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

export default StatusPill;
