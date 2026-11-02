import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight } from 'lucide-react';
import IsometricWarehouseVisual from '../components/3d/IsometricWarehouseVisual';
import AmbientLighting from '../components/ui/AmbientLighting';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Recreate exact soft ambient red lighting and subtle architectural grid from reference video */}
      <AmbientLighting />

      {/* Top Landing Navigation Bar */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <img src="/logo-icon.png" alt="OrderWise" className="h-7 w-7 object-contain" />
              <span className="font-display font-bold text-[19px] tracking-tight text-white">
                Order<span className="text-ac">Wise</span>
              </span>
            </Link>
            <div className="hidden sm:block border-l border-bd pl-3">
              <span className="text-[12px] font-mono text-t2 block">
                Supply chain &amp; allocation intelligence
              </span>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-[14px] text-t2 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#modules" className="hover:text-white transition-colors">Modules</a>
            <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-[14px] text-t2 hover:text-white font-medium transition-colors hidden sm:inline-block px-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-secondary min-h-[38px] px-4 text-[13px] hidden sm:inline-flex items-center justify-center"
            >
              Register
            </Link>
            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)] flex items-center space-x-1.5"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)] flex items-center space-x-1.5"
              >
                <span>Launch Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container: max-width 1200px, centered, 32px side padding */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-6 space-y-20 flex-1 w-full relative z-10">
        {/* 1. Landing Hero: 2 columns (1.1fr / 1fr), gap 56px */}
        <section className="relative pt-2 sm:pt-4">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="space-y-6">
              {/* Badge: --ac pill, white mono text */}
              <div>
                <span className="inline-flex items-center rounded-pill bg-ac text-white font-mono text-[12px] font-bold px-3 py-1">
                  VORTEXA 3.0 • Problem Statement S-03
                </span>
              </div>

              {/* Exact Landing H1 */}
              <h1 className="font-display text-[40px] md:text-[58px] font-bold leading-[1.05] tracking-[-0.03em] text-white">
                Deterministic order<br />
                allocation <span className="text-ac">and supply</span><br />
                <span className="text-ac">intelligence</span>
              </h1>

              {/* Subhead */}
              <p className="text-[16px] md:text-[17px] leading-[1.6] text-t2 font-normal max-w-xl">
                OrderWise resolves inventory conflicts across competing customer orders using
                deterministic priority rules, Groq Llama-3 recommendations with strict human governance,
                and real-time allocation explanations.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/dashboard' : '/admin'}
                    className="btn-primary space-x-2 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
                  >
                    <span>Enter {user.role === 'customer' ? 'Customer portal' : 'Admin console'} &rarr;</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-primary space-x-2 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
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

            {/* Right Column: 3D Warehouse Hero Visual enlarged to >=85% container width */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[580px]">
                <IsometricWarehouseVisual />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Stat Strip: 3 columns, gap 16px */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1 */}
            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Overall fill rate</span>
              <div className="text-[44px] font-display font-bold text-white tracking-tight my-2">94.2%</div>
              <span className="text-[12px] font-mono text-t2">Target: &ge;90% deterministic fulfillment</span>
            </div>

            {/* KPI 2 */}
            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-t2">Active catalog items</span>
              <div className="text-[44px] font-display font-bold text-white tracking-tight my-2">4 items</div>
              <span className="text-[12px] font-mono text-t2">Pumps, valves, gauges &amp; control units</span>
            </div>

            {/* KPI 3: Alert card */}
            <div className="bg-[#2B2010]/50 border border-alert-border rounded-card p-6 flex flex-col justify-between">
              <span className="text-[12px] font-mono text-wa font-medium">Unresolved alerts</span>
              <div className="text-[44px] font-display font-bold text-white tracking-tight my-2">1 critical</div>
              <span className="text-[12px] font-mono text-t2">GAUGE-P300 stock below reorder point</span>
            </div>
          </div>
        </section>

        {/* 3. How OrderWise Works: Text-first calm cards */}
        <section id="how-it-works" className="space-y-6">
          <div>
            <h2 className="text-[32px] font-display font-bold tracking-tight text-white">
              How OrderWise works
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Deterministic priority scheduling governed by authorized supply chain operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-white">
                Deterministic allocation
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Multi-tier priority order ensures zero double-counting across competing customer demands.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-white">
                AI recommends, humans approve
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Llama-3 analyzes context with confidence scores; inventory modifies only with admin approval.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-white">
                Live real-time stream
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Server-Sent Events broadcast instant allocations scoped strictly to customer permissions.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Enterprise Allocation Modules & Roadmap */}
        <section id="modules" className="space-y-6">
          <div>
            <h2 className="text-[32px] font-display font-bold tracking-tight text-white">
              Enterprise allocation modules
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Fully integrated tools for inventory planning, scenario testing, and compliance.
            </p>
          </div>

          {/* Module cards: text-first with clean hover arrow and no 'Active' tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/allocation"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-[18px] font-display font-bold text-white group-hover:text-white transition-colors">
                  Allocation Center
                </h4>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                Run deterministic allocation with step-by-step explanations.
              </p>
            </Link>

            <Link
              to="/admin/simulations"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-[18px] font-display font-bold text-white group-hover:text-white transition-colors">
                  Simulation Lab
                </h4>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                Zero-mutation sandbox testing stock surges and supply delays.
              </p>
            </Link>

            <Link
              to="/admin/reports"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-[18px] font-display font-bold text-white group-hover:text-white transition-colors">
                  Reports &amp; CSV
                </h4>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                Track fill rates and export 1-click supply chain audits.
              </p>
            </Link>

            <Link
              to="/admin/audit"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-[18px] font-display font-bold text-white group-hover:text-white transition-colors">
                  Audit Log Viewer
                </h4>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                Immutable governance logs tracking approvals and changes.
              </p>
            </Link>
          </div>

          {/* Clean Roadmap Row: single line of secondary text */}
          <div className="pt-3 text-[13px] text-t2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-bd/40">
            <span>
              <strong className="text-white font-medium">Roadmap:</strong> Multi-warehouse cross-docking &amp; automated vendor PO dispatch scheduled for Q2.
            </span>
            <span className="font-mono text-[11px] text-t2 shrink-0">Q2 Release</span>
          </div>
        </section>

        {/* 5. Built for operations that cannot ship the wrong order: Plain text columns without card borders */}
        <section className="space-y-8">
          <div>
            <h2 className="text-[32px] font-display font-bold tracking-tight text-white">
              Built for operations that cannot ship the wrong order
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2 mb-3 rounded-full" />
            <p className="text-[15px] text-t2">
              One allocation engine, tuned to how each team works.
            </p>
          </div>

          {/* Plain text columns: By role */}
          <div className="space-y-4 pt-2 border-t border-bd/40">
            <h3 className="text-[18px] font-display font-bold text-white">
              By role
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-white">Administrators</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  Run allocations, approve AI suggestions and review the immutable audit trail.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-white">Inventory managers</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  Track stock, safety buffers and supply alerts before shortages hit production lines.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-white">Customers</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  See live allocation status, promised delivery dates and explanations for their own orders.
                </p>
              </div>
            </div>
          </div>

          {/* Plain text columns: By industry */}
          <div className="space-y-4 pt-4 border-t border-bd/40">
            <h3 className="text-[18px] font-display font-bold text-white">
              By industry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-ac uppercase tracking-wider block">Hardware distribution</span>
                <h4 className="text-[16px] font-semibold text-white">Pumps, valves &amp; instrumentation</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  Scarce units compete for limited stock. Deterministic business rules decide strictly and fairly.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono text-ac uppercase tracking-wider block">Manufacturing</span>
                <h4 className="text-[16px] font-semibold text-white">Assembly &amp; component lines</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  Protect critical production orders and prevent costly plant shutdowns when parts run short.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono text-ac uppercase tracking-wider block">Wholesale &amp; Retail</span>
                <h4 className="text-[16px] font-semibold text-white">Multi-channel fulfillment</h4>
                <p className="text-[14px] text-t2 leading-relaxed">
                  Balance promised delivery dates across tiers of customers without over-promising available stock.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Callout Banner: See it on your own orders */}
        <section className="card-base p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-[26px] font-display font-bold text-white">
              See it on your own orders
            </h3>
            <div className="w-10 h-[3px] bg-ac rounded-full" />
            <p className="text-[15px] text-t2 pt-1 leading-relaxed">
              Sign in with 1-click pre-configured demo accounts for Administrators, Inventory Managers, or Customers.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary min-h-[46px] px-7 text-[14px] shadow-[0_0_25px_rgba(229,9,20,0.35)] shrink-0"
          >
            <span>Go to 1-Click Login &rarr;</span>
          </Link>
        </section>
      </main>

      {/* 7. Footer: 4 columns matching design specs */}
      <footer className="border-t border-bd bg-s py-12 px-4 sm:px-8 mt-16 text-[13px] text-t2 relative z-10">
        <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <img src="/logo-icon.png" alt="OrderWise" className="h-6 w-6 object-contain" />
              <span className="font-display font-bold text-[17px] text-white">
                Order<span className="text-ac">Wise</span>
              </span>
            </div>
            <p className="text-[13px] text-t2 leading-relaxed">
              Deterministic order allocation and supply intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase text-[12px] font-mono mb-3">Product</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <Link to="/admin/allocation" className="hover:text-white transition-colors">Allocation</Link>
              <Link to="/admin/inventory" className="hover:text-white transition-colors">Inventory</Link>
              <Link to="/admin/audit" className="hover:text-white transition-colors">Audit log</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase text-[12px] font-mono mb-3">Company</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <Link to="/" className="hover:text-white transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase text-[12px] font-mono mb-3">Legal</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>

        <div className="max-w-container mx-auto pt-6 border-t border-bd/60 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono text-t2 gap-2">
          <span>OrderWise &mdash; Deterministic inventory allocation and supply intelligence</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
