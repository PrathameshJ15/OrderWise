import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Cpu,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Boxes,
  Sparkles,
  BarChart3,
  Terminal,
  Activity,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

export default function Home() {
  const context = useOutletContext() || {};
  const { health } = context;
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-arcade-bg text-arcade-primary font-mono flex flex-col selection:bg-arcade-accent selection:text-arcade-surface">
      {/* 0. Top Landing Navigation Bar */}
      <header className="border-b border-arcade-border bg-arcade-neutral/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border border-arcade-accent bg-arcade-accent/15 text-arcade-accent flex items-center justify-center font-display font-black text-sm shadow-[0_0_12px_rgba(200,255,58,0.3)]">
              OW
            </div>
            <div>
              <span className="font-display font-black text-lg uppercase tracking-wider text-arcade-primary block leading-none">
                Order<span className="text-arcade-accent">Wise</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-arcade-secondary block mt-0.5">
                Supply Chain &amp; Allocation Intelligence
              </span>
            </div>
          </div>

          {/* Quick links & CTA */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/login"
              className="text-xs uppercase tracking-wider text-arcade-secondary hover:text-arcade-primary font-bold px-2 sm:px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs uppercase tracking-wider border border-arcade-border hover:border-arcade-accent text-arcade-primary px-3 py-1.5 transition-colors hidden sm:inline-block"
            >
              Register
            </Link>
            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="text-xs uppercase tracking-wider bg-arcade-accent text-arcade-surface font-extrabold px-3.5 sm:px-4 py-1.5 hover:opacity-90 shadow-[0_0_12px_rgba(200,255,58,0.3)] transition-all flex items-center space-x-1.5"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs uppercase tracking-wider bg-arcade-accent text-arcade-surface font-extrabold px-3.5 sm:px-4 py-1.5 hover:opacity-90 shadow-[0_0_12px_rgba(200,255,58,0.3)] transition-all flex items-center space-x-1.5"
              >
                <span>Launch Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 flex-1 w-full">
      {/* 1. Hero Section */}
      <section className="relative border border-arcade-border bg-arcade-neutral p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-arcade-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-arcade-info/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 text-xs text-arcade-accent border border-arcade-accent/30 bg-arcade-accent/10 px-3 py-1">
            <span className="w-2 h-2 bg-arcade-accent animate-ping rounded-full inline-block" />
            <span className="font-bold tracking-widest uppercase">VORTEXA 3.0 • Problem Statement S-03</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-arcade-primary leading-[1.05]">
            Deterministic Order Allocation <br />
            <span className="text-arcade-accent">&amp; Supply Intelligence</span>
          </h1>

          <p className="text-sm sm:text-base text-arcade-secondary leading-relaxed max-w-2xl">
            OrderWise resolves inventory conflicts across competing customer orders using
            <span className="text-arcade-primary font-bold"> deterministic priority rules</span>,
            <span className="text-arcade-accent font-bold"> Groq Llama-3 recommendations</span> with strict human governance, and
            <span className="text-arcade-primary font-bold"> real-time Server-Sent Events</span>.
          </p>

          {/* Call to action buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="px-6 py-3.5 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(200,255,58,0.4)] hover:opacity-95 transition-all"
              >
                <span>Enter {user.role === 'customer' ? 'Customer Hub' : 'Admin Operations Center'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(200,255,58,0.4)] hover:opacity-95 transition-all"
                >
                  <span>Launch Operations Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3.5 border border-arcade-border bg-arcade-surface hover:border-arcade-accent text-arcade-primary font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Create Customer Account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Core Architectural Pillars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-arcade-border pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-arcade-accent" />
            <h2 className="font-display text-xl font-black uppercase text-arcade-primary tracking-wide">
              System Pillars &amp; Core Engine
            </h2>
          </div>
          <span className="text-[10px] text-arcade-secondary uppercase tracking-widest">
            Deterministic • Auditable • Governed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-arcade-border bg-arcade-neutral p-6 space-y-3 relative">
            <div className="w-10 h-10 border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg uppercase text-arcade-primary">
              Deterministic Allocation
            </h3>
            <p className="text-xs text-arcade-secondary leading-relaxed">
              Strict multi-tier priority ordering: Approved Priority (Critical &gt; High &gt; Med &gt; Low) &rarr;
              Promised Delivery Date &rarr; Creation Timestamp &rarr; Order ID. Zero double-counting.
            </p>
          </div>

          <div className="border border-arcade-border bg-arcade-neutral p-6 space-y-3 relative">
            <div className="w-10 h-10 border border-arcade-warning/30 bg-arcade-warning/10 text-arcade-warning flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg uppercase text-arcade-primary">
              AI Recommends, Humans Approve
            </h3>
            <p className="text-xs text-arcade-secondary leading-relaxed">
              Groq Llama-3 70B evaluates natural language order context. AI outputs recommendations with
              evidence and confidence, but can never directly modify inventory without human admin approval.
            </p>
          </div>

          <div className="border border-arcade-border bg-arcade-neutral p-6 space-y-3 relative">
            <div className="w-10 h-10 border border-arcade-info/30 bg-arcade-info/10 text-arcade-info flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg uppercase text-arcade-primary">
              Live Real-Time Stream (SSE)
            </h3>
            <p className="text-xs text-arcade-secondary leading-relaxed">
              Server-Sent Events push instant updates when allocations conclude or order statuses shift.
              Customers only receive role-scoped events for their own orders.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Walkthrough / Live Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-arcade-border pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-arcade-accent" />
            <h2 className="font-display text-xl font-black uppercase text-arcade-primary tracking-wide">
              End-to-End Enterprise Capabilities
            </h2>
          </div>
          <span className="text-[10px] text-arcade-secondary uppercase tracking-widest">
            Production Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/allocation"
            className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">Module 01</span>
              <ArrowRight className="h-3.5 w-3.5 text-arcade-secondary group-hover:text-arcade-accent group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-display font-bold text-base uppercase text-arcade-primary">Allocation Center</h4>
            <p className="text-xs text-arcade-secondary mt-1">
              Run deterministic allocation engine with step-by-step audit explanations and dry-run preview.
            </p>
          </Link>

          <Link
            to="/admin/simulations"
            className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">Module 02</span>
              <ArrowRight className="h-3.5 w-3.5 text-arcade-secondary group-hover:text-arcade-accent group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-display font-bold text-base uppercase text-arcade-primary">Simulation Lab</h4>
            <p className="text-xs text-arcade-secondary mt-1">
              Zero-mutation in-memory sandbox testing inventory surges, stock drops, and supply delays.
            </p>
          </Link>

          <Link
            to="/admin/reports"
            className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">Module 03</span>
              <ArrowRight className="h-3.5 w-3.5 text-arcade-secondary group-hover:text-arcade-accent group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-display font-bold text-base uppercase text-arcade-primary">Reports &amp; CSV Exports</h4>
            <p className="text-xs text-arcade-secondary mt-1">
              Order fill rates, deferred demand root causes, inventory valuation, and 1-click CSV datasets.
            </p>
          </Link>

          <Link
            to="/admin/audit"
            className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">Module 04</span>
              <ArrowRight className="h-3.5 w-3.5 text-arcade-secondary group-hover:text-arcade-accent group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-display font-bold text-base uppercase text-arcade-primary">Audit Log Viewer</h4>
            <p className="text-xs text-arcade-secondary mt-1">
              Immutable evidence log tracking who approved priorities, adjusted stock, or ran allocations.
            </p>
          </Link>
        </div>
      </section>

      {/* 4. Quick Demo Credentials Callout */}
      <section className="border border-arcade-border bg-arcade-surface p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-arcade-accent font-bold">
            Instant Demo Access
          </span>
          <h3 className="font-display text-2xl font-black uppercase text-arcade-primary mt-1">
            Ready to explore OrderWise live?
          </h3>
          <p className="text-xs text-arcade-secondary mt-1 max-w-xl">
            Sign in with 1-click pre-configured demo accounts for Administrators, Inventory Managers, or Customers.
          </p>
        </div>

        <Link
          to="/login"
          className="px-6 py-3 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <span>Go to 1-Click Login</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-arcade-border bg-arcade-neutral/80 py-6 px-4 sm:px-8 mt-12 text-xs text-arcade-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-arcade-primary uppercase">OrderWise</span>
            <span>•</span>
            <span>Deterministic Inventory Allocation Engine</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <Link to="/login" className="hover:text-arcade-accent transition-colors">Login</Link>
            <Link to="/register" className="hover:text-arcade-accent transition-colors">Register</Link>
            <Link to="/admin" className="hover:text-arcade-accent transition-colors">Admin Console</Link>
            <Link to="/dashboard" className="hover:text-arcade-accent transition-colors">Customer Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
