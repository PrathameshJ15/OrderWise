import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield, Database, Cpu, Layers, CheckCircle2, Terminal } from 'lucide-react';

export default function Home() {
  const { health, loading, error } = useOutletContext();

  return (
    <div className="space-y-8 py-4">
      {/* Hero Banner */}
      <div className="border border-arcade-border bg-arcade-neutral p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-arcade-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs text-arcade-accent border border-arcade-accent/20 bg-arcade-accent/5 px-2.5 py-1 mb-3">
              <span className="w-1.5 h-1.5 bg-arcade-accent animate-ping rounded-full inline-block" />
              <span>PHASE 1 FOUNDATION ONLINE</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-arcade-primary">
              Order Allocation <span className="text-arcade-accent">&amp;</span> Supply Intelligence
            </h1>
            <p className="text-arcade-secondary text-sm max-w-2xl mt-3 leading-relaxed">
              Deterministic allocation engine paired with Groq AI-assisted priority recommendations,
              atomic PostgreSQL concurrency locking, and complete decision explainability.
            </p>
          </div>

          <div className="bg-arcade-surface border border-arcade-border p-4 min-w-[280px]">
            <div className="text-xs uppercase text-arcade-secondary tracking-wider mb-2 flex items-center justify-between">
              <span>Backend Status</span>
              <span className={`w-2 h-2 rounded-full ${health ? 'bg-arcade-accent' : 'bg-arcade-danger'}`} />
            </div>
            {loading ? (
              <p className="text-sm text-arcade-secondary animate-pulse">Connecting to API...</p>
            ) : health ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-arcade-secondary">Uptime:</span>
                  <span className="text-arcade-primary font-semibold">{health.uptime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-arcade-secondary">Environment:</span>
                  <span className="text-arcade-primary font-semibold">{health.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-arcade-secondary">Database:</span>
                  <span className={health.database?.connected ? 'text-arcade-accent' : 'text-arcade-warning'}>
                    {health.database?.status || 'unconnected'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-arcade-danger">
                <span>{error || 'Cannot connect to API server'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="w-9 h-9 border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="font-display font-bold text-lg uppercase text-arcade-primary">Allocation Engine</h3>
          <p className="text-xs text-arcade-secondary mt-1">
            Deterministic multi-tier priority sort with row-level transactional locks.
          </p>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="w-9 h-9 border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-display font-bold text-lg uppercase text-arcade-primary">AI Priority Guide</h3>
          <p className="text-xs text-arcade-secondary mt-1">
            Groq Llama-3 recommendations with mandatory human admin verification.
          </p>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="w-9 h-9 border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-display font-bold text-lg uppercase text-arcade-primary">What-If Sandbox</h3>
          <p className="text-xs text-arcade-secondary mt-1">
            Zero-mutation in-memory simulations for demand surge &amp; replenishment.
          </p>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="w-9 h-9 border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="font-display font-bold text-lg uppercase text-arcade-primary">Impact Analyzer</h3>
          <p className="text-xs text-arcade-secondary mt-1">
            Comprehensive diffing across sequential allocation iterations.
          </p>
        </div>
      </div>

      {/* Diagnostics & Verification Panel */}
      <div className="border border-arcade-border bg-arcade-neutral p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Terminal className="h-4 w-4 text-arcade-accent" />
          <h2 className="font-display font-bold text-xl uppercase tracking-wider text-arcade-primary">
            Phase 1 Foundation Verification
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-arcade-surface border border-arcade-border p-4 space-y-2">
            <h4 className="font-semibold text-arcade-primary uppercase text-[11px] tracking-wider mb-2">
              Backend Contract
            </h4>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>GET /api/health responding with standardized shape</span>
            </div>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Zod request &amp; fail-fast env schema validation active</span>
            </div>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Helmet, CORS, rate limiter, request ID &amp; error handler wired</span>
            </div>
          </div>

          <div className="bg-arcade-surface border border-arcade-border p-4 space-y-2">
            <h4 className="font-semibold text-arcade-primary uppercase text-[11px] tracking-wider mb-2">
              Frontend Architecture
            </h4>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Vite 5 + React 18 + Tailwind 3 (Arcade Night tokens)</span>
            </div>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Axios client with base URL &amp; JWT interceptors</span>
            </div>
            <div className="flex items-center space-x-2 text-arcade-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>ErrorBoundary, React Router v6 &amp; smoke tests ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
