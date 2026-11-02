import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Factory, Warehouse, ShoppingCart, UserCheck, Cpu } from 'lucide-react';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col selection:bg-ac selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="OrderWise" className="h-8 w-auto object-contain" />
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
              className="btn-primary min-h-[38px] px-5 text-[13px]"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-14 space-y-16 flex-1 w-full relative">
        <div
          className="absolute top-1/4 left-1/4 w-[450px] h-[350px] bg-ac/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Page Header */}
        <div className="text-center space-y-3 relative z-10 max-w-3xl mx-auto">
          <span className="text-ac font-mono text-[13px] uppercase tracking-wider font-semibold">
            Solutions
          </span>
          <h1 className="text-[34px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Built for operations that cannot ship the wrong order
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            One allocation engine, tuned to how each supply chain team works.
          </p>
        </div>

        {/* Section 1: By Role */}
        <section className="space-y-6 relative z-10">
          <h2 className="text-[24px] font-bold text-white tracking-tight">By role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-base p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-ac">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Administrators</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Run deterministic allocations, review and approve AI priority recommendations, and inspect the immutable audit trail.
              </p>
            </div>

            <div className="card-base p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-ok">
                <Warehouse className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Inventory managers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Track real-time stock balances, manage safety stock buffers, evaluate supplier reliability, and avert shortages before they hit.
              </p>
            </div>

            <div className="card-base p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-[#F5B544]">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Customers</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Place multi-line orders, see transparent fulfillment explanations, track promised delivery dates, and receive real-time notifications.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: By Industry */}
        <section className="space-y-6 relative z-10">
          <h2 className="text-[24px] font-bold text-white tracking-tight">By industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-base p-6 space-y-3">
              <span className="text-ac font-mono text-[12px] uppercase tracking-wider">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Hardware distribution</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Pumps, valves, gauges, and telemetry sensors compete for limited warehouse stock. Deterministic business rules allocate fairly.
              </p>
            </div>

            <div className="card-base p-6 space-y-3">
              <span className="text-ac font-mono text-[12px] uppercase tracking-wider">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Manufacturing</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Protect mission-critical assembly lines when critical parts run scarce. Emergency orders receive priority with full governance.
              </p>
            </div>

            <div className="card-base p-6 space-y-3">
              <span className="text-ac font-mono text-[12px] uppercase tracking-wider">Industry</span>
              <h3 className="text-[18px] font-bold text-white">Wholesale and retail</h3>
              <p className="text-[14px] text-t2 leading-relaxed">
                Balance promised delivery dates across tiered enterprise buyers and prevent contract penalty breaches during supply crunches.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <div className="card-base p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-[22px] font-bold text-white">See it on your own orders</h3>
            <p className="text-[14px] text-t2">
              Explore how OrderWise deterministic allocation resolves your inventory bottlenecks.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-primary min-h-[44px] px-8 text-[14px]"
          >
            Book a demo
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-bd bg-s py-10 px-4 sm:px-8 mt-16 text-[13px] text-t2">
        <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.png" alt="OrderWise" className="h-7 w-auto object-contain mb-3" />
            <p className="text-[13px] text-t2">
              Deterministic order allocation and supply intelligence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Product</h4>
            <div className="space-y-1.5 flex flex-col">
              <Link to="/admin/allocation" className="hover:text-white">Allocation</Link>
              <Link to="/admin/inventory" className="hover:text-white">Inventory</Link>
              <Link to="/admin/audit" className="hover:text-white">Audit log</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Company</h4>
            <div className="space-y-1.5 flex flex-col">
              <Link to="/" className="hover:text-white">About</Link>
              <Link to="/pricing" className="hover:text-white">Pricing</Link>
              <Link to="/security" className="hover:text-white">Security</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Legal</h4>
            <div className="space-y-1.5 flex flex-col">
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
              <span>Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
