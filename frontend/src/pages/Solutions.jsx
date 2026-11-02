import React from 'react';
import { Link } from 'react-router-dom';
import AmbientLighting from '../components/ui/AmbientLighting';
import PublicNavbar from '../components/layout/PublicNavbar';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-bg text-t font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Recreate exact soft ambient red lighting from reference video */}
      <AmbientLighting withGrid={false} />

      {/* Top Navigation */}
      <PublicNavbar active="solutions" />

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-12 space-y-14 flex-1 w-full relative z-10">
        {/* Page Header */}
        <div className="space-y-3 relative z-10 max-w-3xl">
          <span className="text-ac font-mono text-[13px] block tracking-wider uppercase font-semibold">
            Solutions
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-tight text-t leading-tight">
            Built for operations that cannot ship the wrong order
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            One deterministic allocation engine, tuned to how each operational tier functions.
          </p>
        </div>

        {/* Section 1: By Role */}
        <section className="space-y-5 relative z-10">
          <h2 className="font-display text-[24px] font-bold text-t tracking-tight">By role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-base p-7 space-y-3">
              <h3 className="text-[18px] font-display font-bold text-t">Administrators</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Run allocations, review AI recommendations with strict confidence thresholds, and inspect immutable audit trails.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[18px] font-display font-bold text-t">Inventory managers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Track on-hand vs. reserved stock, manage safety buffers, and act on shortage alerts before stockouts impact delivery.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[18px] font-display font-bold text-t">Customers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                See transparent order status, promised delivery dates, and clear fulfillment explanations for their own accounts.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: By Industry */}
        <section className="space-y-5 relative z-10">
          <h2 className="font-display text-[24px] font-bold text-t tracking-tight">By industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-base p-7 space-y-3">
              <span className="text-ac font-mono text-[11px] uppercase tracking-wider block font-semibold">Hardware distribution</span>
              <h3 className="text-[18px] font-display font-bold text-t">Pumps, valves &amp; gauges</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Scarce SKUs compete across major contractors. Priority rules resolve conflicts deterministically without favoritism.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <span className="text-ac font-mono text-[11px] uppercase tracking-wider block font-semibold">Manufacturing</span>
              <h3 className="text-[18px] font-display font-bold text-t">Production line components</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Protect critical assembly operations and prevent costly plant downtime when supply chain disruptions emerge.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <span className="text-ac font-mono text-[11px] uppercase tracking-wider block font-semibold">Wholesale and retail</span>
              <h3 className="text-[18px] font-display font-bold text-t">Multi-tier distribution</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Balance delivery commitments and partial shipment rules across key commercial accounts and standard buyers.
              </p>
            </div>
          </div>
        </section>

        {/* Callout Banner: See it on your own orders */}
        <section className="card-base p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display text-[24px] font-bold text-white">
              See it on your own orders
            </h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Explore how OrderWise resolves inventory scarcity and enforces business rules in the interactive demo console.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary min-h-[44px] px-6 text-[14px] shadow-[0_0_20px_rgba(229,9,20,0.35)] shrink-0"
          >
            <span>Launch Operations Portal &rarr;</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-bd bg-s py-12 px-4 sm:px-8 mt-16 text-[13px] text-t2 relative z-10">
        <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <img src="/logo-icon.png" alt="OrderWise" className="h-6 w-6 object-contain" />
              <span className="font-display font-bold text-[17px] text-t">
                Order<span className="text-ac">Wise</span>
              </span>
            </div>
            <p className="text-[13px] text-t2 leading-relaxed">
              Deterministic order allocation and supply intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-t uppercase text-[12px] font-mono mb-3">Product</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <Link to="/admin/allocation" className="hover:text-t transition-colors">Allocation</Link>
              <Link to="/admin/inventory" className="hover:text-t transition-colors">Inventory</Link>
              <Link to="/admin/audit" className="hover:text-t transition-colors">Audit log</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-t uppercase text-[12px] font-mono mb-3">Company</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <Link to="/" className="hover:text-t transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-t transition-colors">Pricing</Link>
              <Link to="/security" className="hover:text-t transition-colors">Security</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-t uppercase text-[12px] font-mono mb-3">Legal</h4>
            <div className="space-y-2 flex flex-col text-[14px]">
              <span className="hover:text-t transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-t transition-colors cursor-pointer">Terms</span>
              <Link to="/security" className="hover:text-t transition-colors">Security</Link>
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
