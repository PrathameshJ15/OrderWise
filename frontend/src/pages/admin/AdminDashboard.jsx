import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Cpu, ShieldCheck, Database, Layers, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Admin Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <ShieldCheck className="h-3 w-3" />
            <span>OPERATIONS COMMAND CENTER</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Admin Console: {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Logged in as {user?.email} • Authority Level: <span className="uppercase text-arcade-accent font-bold">{user?.role}</span>
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

      {/* Admin Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Cpu className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">Allocation Center</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Execute deterministic multi-tier allocation engine runs across pending customer orders.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Core Engine (Phase 6) &rarr;
          </span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">AI Priority Review</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Evaluate Groq Llama-3 priority recommendations and enact authorized approvals.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 7 Deliverable &rarr;
          </span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Database className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">Inventory Hub</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Manage physical on-hand quantities, safety buffers, and optimistic version locks.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 4 Deliverable &rarr;
          </span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/40 transition-colors">
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary">Simulation Lab</h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Test what-if inventory shifts and demand surge scenarios without touching live data.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Phase 8 Deliverable &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
