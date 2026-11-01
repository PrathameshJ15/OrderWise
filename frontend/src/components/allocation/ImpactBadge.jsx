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
 * Design System: Pill shape, IBM Plex Mono 12px font-medium.
 * Status colors (ok, wa, no) separated from accent.
 */
export function ImpactBadge({ classification, className = '' }) {
  const norm = (classification || 'UNCHANGED').toUpperCase();

  switch (norm) {
    case 'NEWLY_FULFILLED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-ok/30 bg-ok/15 text-ok ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Newly Fulfilled</span>
        </span>
      );

    case 'IMPROVED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-ok/30 bg-ok/15 text-ok ${className}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Improved</span>
        </span>
      );

    case 'DEGRADED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-wa/30 bg-wa/15 text-wa ${className}`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );

    case 'NEWLY_DEFERRED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-no/30 bg-no/15 text-no ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Newly Deferred</span>
        </span>
      );

    case 'NEW_ITEM':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-[#3A3A3A] bg-[#232323] text-white ${className}`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Item</span>
        </span>
      );

    case 'REMOVED_ITEM':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-bd bg-[#1B1B1B] text-t2 ${className}`}
        >
          <MinusCircle className="w-3.5 h-3.5" />
          <span>Removed Item</span>
        </span>
      );

    case 'UNCHANGED':
    default:
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border border-bd bg-s2 text-t2 ${className}`}
        >
          <Minus className="w-3.5 h-3.5" />
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
  let colorStyles = 'border-ac/30 bg-ac/10 text-white';

  if (norm.includes('STOCK_INCREASED') || norm.includes('STOCK')) {
    Icon = Package;
    colorStyles = 'border-ok/30 bg-ok/10 text-ok';
  } else if (norm.includes('STOCK_DECREASED')) {
    Icon = Package;
    colorStyles = 'border-no/30 bg-no/10 text-no';
  } else if (norm.includes('PRIORITY')) {
    Icon = ShieldCheck;
    colorStyles = 'border-[#3A3A3A] bg-[#232323] text-white';
  } else if (norm.includes('CANCELLED')) {
    Icon = Ban;
    colorStyles = 'border-wa/30 bg-wa/10 text-wa';
  } else if (norm.includes('COMPETING') || norm.includes('QUEUE')) {
    Icon = Users;
    colorStyles = 'border-bd bg-s text-t2';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-1.5">
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[12px] font-mono font-medium rounded-pill border ${colorStyles}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </span>
        {triggerEvent && (
          <span className="text-[12px] font-mono text-t2 border border-bd px-2 py-0.5 rounded-pill bg-s2">
            {triggerEvent.source === 'audit_logs' ? `Audit #${triggerEvent.id}` : triggerEvent.decision || 'Triggered'}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[14px] text-t leading-normal font-sans">
          {description}
        </p>
      )}
    </div>
  );
}

export default ImpactBadge;
