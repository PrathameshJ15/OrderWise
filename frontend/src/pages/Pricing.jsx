import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export default function Pricing() {
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
            <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-white font-semibold">Pricing</Link>
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
      <main className="max-w-container mx-auto px-4 sm:px-8 py-14 space-y-12 flex-1 w-full relative">
        {/* Soft Red Background Glow */}
        <div
          className="absolute top-1/4 right-1/4 w-[450px] h-[350px] bg-ac/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Page Header */}
        <div className="text-center space-y-3 relative z-10 max-w-2xl mx-auto">
          <span className="text-ac font-mono text-[13px] uppercase tracking-wider font-semibold">
            Pricing
          </span>
          <h1 className="text-[34px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Simple plans that scale with your operation
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            Start with the demo, grow into a governed allocation platform.
          </p>
        </div>

        {/* 3 Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-4">
          {/* Card 1: Team */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[14px] font-semibold text-white">Team</span>
              <div className="text-[38px] font-bold text-white tracking-tight">$499<span className="text-[14px] text-t2 font-normal font-mono"> /mo</span></div>
              <p className="text-[14px] text-t2 leading-normal">
                For one warehouse getting started.
              </p>
            </div>

            <Link
              to="/register"
              className="btn-secondary w-full text-center flex items-center justify-center min-h-[44px] text-[14px]"
            >
              Start free trial
            </Link>

            <div className="space-y-3 pt-2 border-t border-bd text-[14px]">
              {[
                'Deterministic allocation engine',
                'Dry-run simulation preview',
                'Live SSE order updates',
                'CSV exports & audit trail',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2 text-white/90">
                  <Check className="w-4 h-4 text-ok flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Business (Most popular, highlighted with red border) */}
          <div className="bg-s border-2 border-ac rounded-card flex flex-col justify-between p-7 space-y-6 relative shadow-[0_0_30px_rgba(229,9,20,0.15)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-block rounded-pill bg-ac text-white font-mono text-[11px] font-semibold px-3 py-1">
                  Most popular
                </span>
              </div>
              <span className="text-[14px] font-semibold text-white block">Business</span>
              <div className="text-[38px] font-bold text-white tracking-tight">$1,499<span className="text-[14px] text-t2 font-normal font-mono"> /mo</span></div>
              <p className="text-[14px] text-t2 leading-normal">
                For teams that need AI and full audit governance.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full text-center flex items-center justify-center min-h-[44px] text-[14px]"
            >
              Book a demo
            </Link>

            <div className="space-y-3 pt-2 border-t border-bd text-[14px]">
              {[
                'Everything in Team',
                'AI recommendations with human approval',
                'What-if Simulation Lab (5 scenarios)',
                'Immutable security audit log',
                'Proactive inventory supply alerts',
                'AI Demand Forecasting & Shortage Radar',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2 text-white/90">
                  <Check className="w-4 h-4 text-ok flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[14px] font-semibold text-white">Enterprise</span>
              <div className="text-[38px] font-bold text-white tracking-tight">Custom</div>
              <p className="text-[14px] text-t2 leading-normal">
                For multi-site, regulated supply chain operations.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-secondary w-full text-center flex items-center justify-center min-h-[44px] text-[14px]"
            >
              Contact sales
            </Link>

            <div className="space-y-3 pt-2 border-t border-bd text-[14px]">
              {[
                'Everything in Business',
                'Multi-warehouse regional distribution',
                'Supplier performance intelligence',
                'Controlled automated reallocation',
                'Single sign-on (SSO) & SCIM',
                'Dedicated 24/7 priority SLA',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2 text-white/90">
                  <Check className="w-4 h-4 text-ok flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
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
