import React from 'react';
import { Link } from 'react-router-dom';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col selection:bg-ac selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="OrderWise" className="h-8 w-auto object-contain" />
            <span className="font-bold text-[19px] tracking-tight">
              Order<span className="text-ac">Wise</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-[14px] text-t2 font-medium">
            <Link to="/" className="hover:text-white transition-colors">Product</Link>
            <Link to="/solutions" className="text-white font-semibold">Solutions</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)]"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-14 space-y-14 flex-1 w-full relative">
        <div
          className="absolute top-1/4 right-1/4 w-[450px] h-[350px] bg-ac/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Page Header */}
        <div className="space-y-2 relative z-10 max-w-3xl">
          <span className="text-ac font-mono text-[13px] block">
            Solutions
          </span>
          <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Built for operations that cannot ship the wrong order
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            One allocation engine, tuned to how each team works.
          </p>
        </div>

        {/* Section 1: By Role (Exact match to Solutions.png - calm, text-first) */}
        <section className="space-y-4 relative z-10">
          <h2 className="text-[24px] font-bold text-white tracking-tight">By role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card-base p-6 space-y-2">
              <h3 className="text-[18px] font-bold text-white">Administrators</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Run allocations, approve AI suggestions and review the audit trail.
              </p>
            </div>

            <div className="card-base p-6 space-y-2">
              <h3 className="text-[18px] font-bold text-white">Inventory managers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Track stock, safety buffers and supply alerts before shortages hit.
              </p>
            </div>

            <div className="card-base p-6 space-y-2">
              <h3 className="text-[18px] font-bold text-white">Customers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                See live status and promised dates for their own orders.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: By Industry */}
        <section className="space-y-4 relative z-10">
          <h2 className="text-[24px] font-bold text-white tracking-tight">By industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card-base p-6 space-y-2">
              <span className="text-ac font-mono text-[11px] uppercase block">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Hardware distribution</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Pumps, valves and gauges compete for limited stock. Priority rules decide fairly.
              </p>
            </div>

            <div className="card-base p-6 space-y-2">
              <span className="text-ac font-mono text-[11px] uppercase block">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Manufacturing</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Protect critical production orders when parts run short.
              </p>
            </div>

            <div className="card-base p-6 space-y-2">
              <span className="text-ac font-mono text-[11px] uppercase block">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Wholesale and retail</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Balance promised delivery dates across many customers.
              </p>
            </div>
          </div>
        </section>

        {/* Callout Banner: See it on your own orders */}
        <section className="card-base p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-[24px] font-bold text-white">
              See it on your own orders
            </h3>
            <p className="text-[14px] text-t2">
              Explore how OrderWise handles scarce stock and competing order priorities.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary min-h-[44px] px-6 text-[14px] shadow-[0_0_20px_rgba(229,9,20,0.35)] shrink-0"
          >
            <span>Book a demo &rarr;</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-bd bg-s py-12 px-4 sm:px-8 mt-16 text-[13px] text-t2">
        <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="OrderWise" className="h-6 w-auto object-contain" />
              <span className="font-bold text-[17px] text-white">
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
