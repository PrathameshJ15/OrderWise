import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingBag, PlusCircle, Clock, LogOut, CheckCircle2 } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Welcome Banner */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <CheckCircle2 className="h-3 w-3" />
            <span>AUTHENTICATED CUSTOMER PORTAL</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Welcome, {user?.name || 'Customer'}
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Account: {user?.email} • Role: <span className="uppercase text-arcade-accent">{user?.role}</span>
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 border border-arcade-border text-arcade-secondary hover:text-arcade-danger hover:border-arcade-danger text-xs uppercase tracking-wider transition-colors self-start md:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Quick Customer Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <PlusCircle className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">Create New Order</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Place an order with custom requested quantities and minimum acceptable thresholds.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 5 Deliverable &rarr;
          </span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">My Orders &amp; Allocations</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Track allocation status (fulfilled, partial, deferred) with plain-English reasons.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 5 Deliverable &rarr;
          </span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">Product Catalog</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Inspect industrial pumps, safety valves, pressure gauges, and control units.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 4 Deliverable &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
