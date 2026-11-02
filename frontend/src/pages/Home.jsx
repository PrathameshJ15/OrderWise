import React, { useState } from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight } from 'lucide-react';
import IsometricWarehouseVisual from '../components/3d/IsometricWarehouseVisual';

export default function Home() {
  const { user } = useAuth();
  const [heroRightTab, setHeroRightTab] = useState('queue');

  return (
    <div className="min-h-screen bg-bg text-t font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Subtle upper-right ambient lighting */}
      <div
        className="fixed top-[-240px] right-[-180px] w-[760px] h-[760px] pointer-events-none rounded-full blur-[60px] -z-0"
        style={{
          background: 'radial-gradient(closest-side, rgba(229, 9, 20, 0.13), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Top Landing Navigation Bar */}
      <PublicNavbar active="home" />

      {/* Main Content Container: max-width 1120px matching reference specs */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-6 space-y-16 flex-1 w-full relative z-10">
        {/* 1. Landing Hero: 2 columns (1.15fr / 1fr), gap 56px */}
        <section className="relative pt-6 sm:pt-10">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="space-y-6">
              {/* Badge: Red pill matching reference image */}
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[12px] font-medium text-white bg-ac px-3.5 py-1.5 rounded-pill shadow-xs inline-block">
                  VORTEXA 3.0 • Problem Statement S-03
                </span>
              </div>

              {/* Product Hero Heading matching reference */}
              <h1 className="font-display text-[44px] sm:text-[60px] font-bold leading-[1.04] tracking-[-0.03em] text-t">
                Deterministic order allocation <span className="text-ac">and supply intelligence</span>
              </h1>

              {/* Supporting description */}
              <p className="text-[17px] sm:text-[18px] leading-[1.6] text-t2 font-normal max-w-[520px]">
                OrderWise resolves inventory conflicts across competing customer orders using deterministic priority rules, Groq Llama-3 recommendations with strict human governance, and real-time allocation explanations.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/dashboard' : '/admin'}
                    className="btn-primary space-x-2 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
                  >
                    <span>Enter {user.role === 'customer' ? 'Customer portal' : 'Admin console'} &rarr;</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-primary space-x-2 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
                    >
                      <span>Launch Operations Portal &rarr;</span>
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

            {/* Right Column: Hero Visual Switcher */}
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between">
                <div
                  className="flex items-center space-x-1 p-1 bg-s rounded-pill border border-bd text-xs"
                  role="tablist"
                  aria-label="Hero visual display options"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === 'queue'}
                    onClick={() => setHeroRightTab('queue')}
                    className={`px-3 py-1 rounded-pill font-mono text-[11px] font-medium transition-colors ${
                      heroRightTab === 'queue'
                        ? 'bg-ac text-white font-semibold shadow-xs'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    Live Allocation Queue
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === '3d'}
                    onClick={() => setHeroRightTab('3d')}
                    className={`px-3 py-1 rounded-pill font-mono text-[11px] font-medium transition-colors ${
                      heroRightTab === '3d'
                        ? 'bg-ac text-white font-semibold shadow-xs'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    3D Warehouse Facility
                  </button>
                </div>
                <span className="text-[11px] font-mono text-t2 hidden sm:inline">
                  {heroRightTab === 'queue' ? '40 on hand' : 'Interactive Axonometric'}
                </span>
              </div>

              {heroRightTab === '3d' ? (
                <div className="w-full max-w-[580px]">
                  <IsometricWarehouseVisual />
                </div>
              ) : (
                <div className="card-base w-full p-7 bg-s/95 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-bd">
                    <div>
                      <span className="text-[12px] font-mono text-t2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-ac shadow-[0_0_10px_#E50914] inline-block mr-2 animate-pulse" />
                        Live allocation queue
                      </span>
                      <h3 className="text-[20px] font-display font-bold text-t mt-1">
                        Pressure Gauge Pro (GAUGE-P300)
                      </h3>
                    </div>
                    <span className="text-[12px] font-mono text-t2 font-medium">40 on hand</span>
                  </div>

                  {/* Charlie */}
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="font-semibold text-t">Charlie · Order #103</span>
                      <span className="text-[12px] font-mono text-ok font-medium">Fulfilled 30/30</span>
                    </div>
                    <div className="h-1.5 w-full bg-bd rounded-full overflow-hidden">
                      <div className="h-full bg-ok rounded-full w-full" />
                    </div>
                  </div>

                  {/* Alice */}
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="font-semibold text-t">Alice · Order #101</span>
                      <span className="text-[12px] font-mono text-no font-medium">Deferred 0/25 (min 15)</span>
                    </div>
                    <div className="h-1.5 w-full bg-bd rounded-full overflow-hidden">
                      <div className="h-full bg-no rounded-full w-[4%]" />
                    </div>
                  </div>

                  {/* Bob */}
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="font-semibold text-t">Bob · Order #102</span>
                      <span className="text-[12px] font-mono text-no font-medium">Deferred 0/20 (no partial)</span>
                    </div>
                    <div className="h-1.5 w-full bg-bd rounded-full overflow-hidden">
                      <div className="h-full bg-no rounded-full w-[4%]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-bd text-[12px] font-mono text-t2">
                    <span>Deterministic resolution</span>
                    <span>Zero over-allocation</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Capability / Fill Rate KPI Strip */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Overall fill rate</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">94.2%</div>
              <span className="text-[12px] font-mono text-t2">Target: ≥90% deterministic fulfillment</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Active catalog items</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">4 items</div>
              <span className="text-[12px] font-mono text-t2">Pumps, valves, gauges &amp; control units</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between border-ac/70 shadow-[inset_0_0_40px_rgba(229,9,20,0.10)]">
              <span className="text-[12px] font-mono text-t2">Unresolved alerts</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">1 critical</div>
              <span className="text-[12px] font-mono text-t2">GAUGE-P300 stock below reorder point</span>
            </div>
          </div>
        </section>

        {/* 3. How OrderWise Works: Matching reference image */}
        <section id="how-it-works" className="space-y-6">
          <div>
            <h2 className="text-[34px] font-display font-bold tracking-tight text-t">
              How OrderWise works
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2.5 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Deterministic priority scheduling governed by authorized supply chain operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                Deterministic allocation
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Multi-tier priority order ensures zero double-counting across competing customer demands.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                AI recommends, humans approve
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Llama-3 analyzes context with confidence scores; inventory modifies only with admin approval.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                Live real-time stream
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Server-Sent Events broadcast instant allocations scoped strictly to customer permissions.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Enterprise Allocation Modules: 4 columns matching reference */}
        <section id="modules" className="space-y-6">
          <div>
            <h2 className="text-[34px] font-display font-bold tracking-tight text-t">
              Enterprise allocation modules
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2.5 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Fully integrated tools for inventory planning, scenario testing, and compliance.
            </p>
          </div>

          {/* Module cards: 4 columns matching reference image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/allocation"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Allocation Center
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Run deterministic allocation with step-by-step explanations.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/simulations"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Simulation Lab
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Zero-mutation sandbox testing stock surges and supply delays.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Reports &amp; CSV exports
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Track fill rates and export 1-click supply chain audits.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Audit log viewer
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Immutable governance logs tracking approvals and changes.
                </p>
              </div>
            </Link>
          </div>

          {/* Roadmap card matching Image 3 */}
          <div className="card-roadmap p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[12px] font-mono text-t2 block">ROADMAP · Next major release</span>
              <h3 className="text-[19px] font-display font-bold text-t">
                Multi-warehouse cross-docking &amp; vendor automated PO dispatch
              </h3>
              <p className="text-[14px] text-t2 leading-normal">
                Automated supplier reorder purchase orders, supplier delay tracking, and real-time cold chain telemetry.
              </p>
            </div>
            <span className="text-[12px] font-mono text-t2 shrink-0">Q2 Delivery</span>
          </div>
        </section>

        {/* 5. Callout Banner */}
        <section className="card-base p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-ac/40">
          <div className="space-y-2 max-w-xl">
            <span className="text-[12px] font-mono text-t2 block">Instant demo access</span>
            <h2 className="text-[28px] sm:text-[32px] font-display font-bold text-t">
              Ready to explore OrderWise live?
            </h2>
            <div className="w-10 h-[3px] bg-ac rounded-full mt-2 mb-3" />
            <p className="text-[15px] text-t2 pt-1 leading-relaxed">
              Sign in with 1-click pre-configured demo accounts for Administrators, Inventory Managers, or Customers.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary min-h-[46px] px-7 text-[14px] shadow-[0_6px_24px_rgba(229,9,20,0.4)] shrink-0"
          >
            <span>Go to 1-Click Login &rarr;</span>
          </Link>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-bd bg-s py-10 px-4 sm:px-8 mt-16 text-[13px] text-t2 relative z-10">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono text-t2 gap-4">
          <span>OrderWise &mdash; Deterministic inventory allocation and supply intelligence</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
