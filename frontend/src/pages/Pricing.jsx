import React from 'react';
import { Link } from 'react-router-dom';
import AmbientLighting from '../components/ui/AmbientLighting';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-bg text-white font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Recreate exact soft ambient red lighting from reference video */}
      <AmbientLighting withGrid={false} />

      {/* Top Navigation */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <img src="/logo-icon.png" alt="OrderWise" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-[19px] tracking-tight text-white">
              Order<span className="text-ac">Wise</span>
            </span>
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
              className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)]"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-12 space-y-12 flex-1 w-full relative z-10">
        {/* Page Header */}
        <div className="text-center space-y-3 relative z-10 max-w-2xl mx-auto">
          <span className="text-ac font-mono text-[13px] block tracking-wider uppercase font-semibold">
            Pricing
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Simple plans that scale with your operation
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            Start with the demo, grow into an enterprise governed allocation platform.
          </p>
        </div>

        {/* 3 Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-2">
          {/* Card 1: Team */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[15px] font-semibold text-white">Team</span>
              <div className="font-display text-[44px] font-bold text-white tracking-tight leading-none">[Price]</div>
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

            <div className="space-y-3 pt-3 border-t border-bd text-[14px]">
              {[
                'Allocation engine',
                'Dry-run preview',
                'Live order updates',
                'CSV exports',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-white/90">
                  <span className="text-ok font-bold text-[15px]">&check;</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Business (Most popular, highlighted with red border) */}
          <div className="bg-s border-2 border-ac rounded-card flex flex-col justify-between p-7 space-y-6 relative shadow-[0_0_30px_rgba(229,9,20,0.15)]">
            <div className="space-y-4">
              <span className="inline-block rounded-pill bg-ac text-white font-mono text-[11px] font-semibold px-3 py-1">
                Most popular
              </span>
              <span className="text-[15px] font-semibold text-white block">Business</span>
              <div className="font-display text-[44px] font-bold text-white tracking-tight leading-none">[Price]</div>
              <p className="text-[14px] text-t2 leading-normal">
                For teams that need AI and full audit.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full text-center flex items-center justify-center min-h-[44px] text-[14px] shadow-[0_0_20px_rgba(229,9,20,0.35)]"
            >
              Book a demo
            </Link>

            <div className="space-y-3 pt-3 border-t border-bd text-[14px]">
              {[
                'Everything in Team',
                'AI recommendations with approval',
                'Simulation lab',
                'Immutable audit log',
                'Supply alerts',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-white/90">
                  <span className="text-ok font-bold text-[15px]">&check;</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[15px] font-semibold text-white">Enterprise</span>
              <div className="font-display text-[44px] font-bold text-white tracking-tight leading-none">Custom</div>
              <p className="text-[14px] text-t2 leading-normal">
                For multi-site, regulated operations.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-secondary w-full text-center flex items-center justify-center min-h-[44px] text-[14px]"
            >
              Contact sales
            </Link>

            <div className="space-y-3 pt-3 border-t border-bd text-[14px]">
              {[
                'Everything in Business',
                'Single sign-on',
                'API and webhooks',
                'Dedicated support',
                'Custom retention',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-white/90">
                  <span className="text-ok font-bold text-[15px]">&check;</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
