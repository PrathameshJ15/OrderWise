import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Minus,
  Zap,
  Package,
  ShieldCheck,
  Ban,
  Users,
} from 'lucide-react';

/**
 * Visual badge for allocation impact classification
 * Classes: IMPROVED, DEGRADED, UNCHANGED, NEWLY_FULFILLED, NEWLY_DEFERRED, NEW_ITEM, REMOVED_ITEM
 */
export function ImpactBadge({ classification, className = '' }) {
  const norm = (classification || 'UNCHANGED').toUpperCase();

  switch (norm) {
    case 'NEWLY_FULFILLED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Newly Fulfilled</span>
        </span>
      );

    case 'IMPROVED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-500/15 text-cyan-400 ${className}`}
        >
          <TrendingUp className="w-3 h-3" />
          <span>Improved</span>
        </span>
      );

    case 'DEGRADED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/15 text-amber-400 ${className}`}
        >
          <TrendingDown className="w-3 h-3" />
          <span>Degraded</span>
        </span>
      );

    case 'NEWLY_DEFERRED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-rose-500/40 bg-rose-500/15 text-rose-400 ${className}`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Newly Deferred</span>
        </span>
      );

    case 'NEW_ITEM':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-purple-500/40 bg-purple-500/15 text-purple-400 ${className}`}
        >
          <PlusCircle className="w-3 h-3" />
          <span>New Item</span>
        </span>
      );

    case 'REMOVED_ITEM':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-zinc-600/40 bg-zinc-800 text-zinc-400 ${className}`}
        >
          <MinusCircle className="w-3 h-3" />
          <span>Removed Item</span>
        </span>
      );

    case 'UNCHANGED':
    default:
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider border border-arcade-border bg-arcade-surface text-arcade-secondary ${className}`}
        >
          <Minus className="w-3 h-3" />
          <span>Unchanged</span>
        </span>
      );
  }
}

/**
 * Visual badge for cause attribution type linked to audit logs or system events
 */
export function CauseAttributionBadge({ causeType, description, triggerEvent }) {
  const norm = (causeType || 'UNKNOWN').toUpperCase();

  let Icon = Zap;
  let label = norm.replace(/_/g, ' ');
  let colorStyles = 'border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent';

  if (norm.includes('STOCK_INCREASED') || norm.includes('STOCK')) {
    Icon = Package;
    colorStyles = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  } else if (norm.includes('STOCK_DECREASED')) {
    Icon = Package;
    colorStyles = 'border-rose-500/30 bg-rose-500/10 text-rose-400';
  } else if (norm.includes('PRIORITY')) {
    Icon = ShieldCheck;
    colorStyles = 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
  } else if (norm.includes('CANCELLED')) {
    Icon = Ban;
    colorStyles = 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  } else if (norm.includes('COMPETING') || norm.includes('QUEUE')) {
    Icon = Users;
    colorStyles = 'border-purple-500/30 bg-purple-500/10 text-purple-400';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-1.5">
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${colorStyles}`}
        >
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </span>
        {triggerEvent && (
          <span className="text-[10px] font-mono text-arcade-secondary border border-arcade-border px-1.5 py-0.5 bg-arcade-surface">
            {triggerEvent.source === 'audit_logs' ? `Audit #${triggerEvent.id}` : triggerEvent.decision || 'Triggered'}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-arcade-primary leading-tight font-sans">
          {description}
        </p>
      )}
    </div>
  );
}

export default ImpactBadge;
