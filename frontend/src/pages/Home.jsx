import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowRight,
  Boxes,
  Shield,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col selection:bg-ac selection:text-white">
      {/* 0. Top Landing Navigation Bar */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="OrderWise" className="h-8 w-auto object-contain" />
            </Link>
            <div className="hidden sm:block border-l border-bd pl-3">
              <span className="text-[12px] font-mono text-t2 block">
                Supply chain &amp; allocation intelligence
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center space-x-7 text-[14px] text-t2 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#modules" className="hover:text-white transition-colors">Modules</a>
            <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
          </nav>

          {/* Navigation links & CTA - hidden on phones (max 760px) as per design spec */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-[14px] text-t2 hover:text-white font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-secondary min-h-[38px] px-4 text-[13px]"
            >
              Register
            </Link>
            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="btn-primary min-h-[38px] px-4 text-[13px] flex items-center space-x-1.5"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary min-h-[38px] px-4 text-[13px] flex items-center space-x-1.5"
              >
                <span>Launch Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile phone quick launch button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              to="/login"
              className="btn-primary min-h-[36px] px-4 text-[12px]"
            >
              Launch
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container: max-width 1120px, centered, 32px side padding */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-8 space-y-[88px] flex-1 w-full">
        {/* 1. Landing Hero: 2 columns (1.1fr / 1fr), gap 56px, phone collapses to 1 col */}
        <section className="relative pt-6 sm:pt-10">
          {/* One soft red glow in the landing hero only */}
          <div
            className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-ac/15 rounded-full blur-[100px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="space-y-6">
              {/* Badge: --ac pill, white mono text */}
              <div>
                <span className="inline-flex items-center rounded-pill bg-ac text-white font-mono text-[12px] font-medium px-3 py-1">
                  VORTEXA 3.0 • Problem Statement S-03
                </span>
              </div>

              {/* Landing H1: 60px / 1.02, tracking -0.03em, 700. Phones: drops to 38px. Sentence case */}
              <h1 className="text-[38px] md:text-[60px] font-bold leading-[1.02] tracking-[-0.03em] text-white">
                Deterministic Order Allocation <br />
                <span className="text-ac">and supply intelligence</span>
              </h1>

              {/* Body: 15-18px / 1.6, --t2, 400 */}
              <p className="text-[16px] md:text-[18px] leading-[1.6] text-t2 font-normal max-w-xl">
                OrderWise resolves inventory conflicts across competing customer orders using
                deterministic priority rules, Groq Llama-3 recommendations with strict human governance,
                and real-time allocation explanations.
              </p>

              {/* Buttons: pill (999px), min-height 44px */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/dashboard' : '/admin'}
                    className="btn-primary space-x-2"
                  >
                    <span>Enter {user.role === 'customer' ? 'Customer portal' : 'Admin console'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-primary space-x-2"
                    >
                      <span>Launch Operations Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/register"
                      className="btn-secondary"
                    >
                      <span>Create customer account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Hero Live Allocation Card */}
            <div className="card-base space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-bd">
                <div>
                  <div className="text-[12px] font-mono text-t2">Live allocation queue</div>
                  <div className="text-[18px] font-bold text-white mt-0.5">Pressure Gauge Pro (GAUGE-P300)</div>
                </div>
                <span className="inline-flex items-center rounded-pill bg-ac text-white font-mono text-[12px] font-medium px-2.5 py-0.5">
                  40 on hand
                </span>
              </div>

              {/* Queue rows: --s2 background, order name left, mono status right, thin progress bar below in status color */}
              <div className="space-y-3">
                {/* Row 1: Charlie */}
                <div className="bg-s2 rounded-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-white">Charlie • Order #103</span>
                    <span className="text-[12px] font-mono font-medium text-ok">Fulfilled 30/30</span>
                  </div>
                  {/* Progress bar: 6px tall, pill ends */}
                  <div className="w-full h-[6px] bg-[#1A1A1A] rounded-pill overflow-hidden">
                    <div className="h-full bg-ok rounded-pill w-full" />
                  </div>
                </div>

                {/* Row 2: Alice */}
                <div className="bg-s2 rounded-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-white">Alice • Order #101</span>
                    <span className="text-[12px] font-mono font-medium text-no">Deferred 0/25 (min 15)</span>
                  </div>
                  <div className="w-full h-[6px] bg-[#1A1A1A] rounded-pill overflow-hidden">
                    <div className="h-full bg-no rounded-pill w-[0%]" />
                  </div>
                </div>

                {/* Row 3: Bob */}
                <div className="bg-s2 rounded-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-white">Bob • Order #102</span>
                    <span className="text-[12px] font-mono font-medium text-no">Deferred 0/20 (no partial)</span>
                  </div>
                  <div className="w-full h-[6px] bg-[#1A1A1A] rounded-pill overflow-hidden">
                    <div className="h-full bg-no rounded-pill w-[0%]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[12px] font-mono text-t2 border-t border-bd">
                <span>Deterministic resolution</span>
                <span className="text-ok">Zero over-allocation</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Stat Strip: 3 columns, gap 16px */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1 */}
            <div className="card-base flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Overall fill rate</span>
              <div className="text-[34px] font-bold text-white tracking-tight my-2">94.2%</div>
              <span className="text-[12px] font-mono text-t2">Target: ≥90% deterministic fulfillment</span>
            </div>

            {/* KPI 2 */}
            <div className="card-base flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Active catalog items</span>
              <div className="text-[34px] font-bold text-white tracking-tight my-2">4 items</div>
              <span className="text-[12px] font-mono text-t2">Pumps, valves, gauges &amp; control units</span>
            </div>

            {/* KPI 3: Alert variant uses amber label and alert-bg / border */}
            <div className="bg-alert-bg border border-alert-border rounded-card p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-wa font-medium">Unresolved alerts</span>
              <div className="text-[34px] font-bold text-white tracking-tight my-2">1 critical</div>
              <span className="text-[12px] font-mono text-wa/80">GAUGE-P300 stock below reorder point</span>
            </div>
          </div>
        </section>

        {/* 3. How It Works: 3 columns, gap 16px */}
        <section className="space-y-6">
          <div className="border-b border-bd pb-4">
            <h2 className="text-[32px] font-bold tracking-tight text-white">
              How OrderWise works
            </h2>
            <p className="text-[15px] text-t2 mt-1">
              Deterministic priority scheduling governed by authorized supply chain operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 text-white flex items-center justify-center">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[20px] font-bold text-white">
                Deterministic allocation
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Multi-tier priority order ensures zero double-counting across competing customer demands.
              </p>
            </div>

            <div className="card-base space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 text-white flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[20px] font-bold text-white">
                AI recommends, humans approve
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Llama-3 analyzes context with confidence scores; inventory modifies only with admin approval.
              </p>
            </div>

            <div className="card-base space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 text-white flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[20px] font-bold text-white">
                Live real-time stream
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Server-Sent Events broadcast instant allocations scoped strictly to customer permissions.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Active Modules & Roadmap */}
        <section className="space-y-6">
          <div className="border-b border-bd pb-4">
            <h2 className="text-[32px] font-bold tracking-tight text-white">
              Enterprise allocation modules
            </h2>
            <p className="text-[15px] text-t2 mt-1">
              Fully integrated tools for inventory planning, scenario testing, and compliance.
            </p>
          </div>

          {/* Module cards: "Active" mono label in --ok, title, one-line description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/allocation"
              className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-[18px] font-bold text-white">Allocation Center</h4>
              </div>
              <p className="text-[15px] text-t2 leading-normal">
                Run deterministic allocation with step-by-step explanations.
              </p>
            </Link>

            <Link
              to="/admin/simulations"
              className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-[18px] font-bold text-white">Simulation Lab</h4>
              </div>
              <p className="text-[15px] text-t2 leading-normal">
                Zero-mutation sandbox testing stock surges and supply delays.
              </p>
            </Link>

            <Link
              to="/admin/reports"
              className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-[18px] font-bold text-white">Reports &amp; CSV exports</h4>
              </div>
              <p className="text-[15px] text-t2 leading-normal">
                Track fill rates and export 1-click supply chain audits.
              </p>
            </Link>

            <Link
              to="/admin/audit"
              className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-[18px] font-bold text-white">Audit log viewer</h4>
              </div>
              <p className="text-[15px] text-t2 leading-normal">
                Immutable governance logs tracking approvals and changes.
              </p>
            </Link>
          </div>

          {/* Upcoming modules collapsed into one dashed "Roadmap" row */}
          <div className="card-roadmap flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[12px] font-mono text-t2 uppercase tracking-wide">Roadmap</span>
                <span className="text-[12px] font-mono text-t2">• Next major release</span>
              </div>
              <h4 className="text-[18px] font-bold text-white mt-1">
                Multi-warehouse cross-docking &amp; vendor automated PO dispatch
              </h4>
              <p className="text-[15px] text-t2 mt-0.5">
                Automated supplier reorder purchase orders, supplier delay tracking, and real-time cold chain telemetry.
              </p>
            </div>
            <div className="text-[12px] font-mono text-t2 shrink-0">
              Q2 Delivery
            </div>
          </div>
        </section>

        {/* 5. Quick Demo Credentials Callout */}
        <section className="card-base flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[12px] font-mono text-ac font-medium">
              Instant demo access
            </span>
            <h3 className="text-[24px] font-bold text-white mt-1">
              Ready to explore OrderWise live?
            </h3>
            <p className="text-[15px] text-t2 mt-1 max-w-xl">
              Sign in with 1-click pre-configured demo accounts for Administrators, Inventory Managers, or Customers.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary space-x-2 shrink-0"
          >
            <span>Go to 1-Click Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      {/* 6. Footer: top border, two mono lines */}
      <footer className="border-t border-bd bg-s py-8 px-4 sm:px-8 mt-12 text-[12px] font-mono text-t2">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-medium">OrderWise</span> — Deterministic inventory allocation and supply intelligence
          </div>
          <div>
            All rights reserved • High-contrast streaming console
          </div>
        </div>
      </footer>
    </div>
  );
}
