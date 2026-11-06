import React from 'react';
import { Link } from 'react-router-dom';
import AmbientLighting from '../components/ui/AmbientLighting';
import PublicNavbar from '../components/layout/PublicNavbar';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-bg text-t font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Soft ambient lighting */}
      <AmbientLighting withGrid={false} />

      {/* Top Navigation */}
      <PublicNavbar active="pricing" />

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-12 space-y-12 flex-1 w-full relative z-10">
        {/* Page Header */}
        <div className="text-center space-y-3 relative z-10 max-w-2xl mx-auto">
          <span className="text-ac font-mono text-[13px] block tracking-wider uppercase font-semibold">
            Pricing
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-tight text-t leading-tight">
            Transparent plans for high-stakes fulfillment
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            Predictable pricing designed for single-facility operations up to multi-tier enterprises.
          </p>
        </div>

        {/* 3 Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-2">
          {/* Card 1: Team */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[15px] font-semibold text-t">Team</span>
              <div className="font-display text-[40px] font-bold text-t tracking-tight leading-none flex items-baseline space-x-1.5">
                <span>$299</span>
                <span className="text-[14px] font-normal text-t2 font-sans">/month</span>
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                For single-warehouse operations automating priority allocations.
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
                'Deterministic allocation',
                'Live stock tracking',
                'Allocation dry-runs',
                'Audit CSV exports',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-t">
                  <span className="text-ok font-bold text-[15px]">&check;</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Growth (Featured tier, red border & badge) */}
          <div className="bg-s border-2 border-ac rounded-card flex flex-col justify-between p-7 space-y-6 relative ">
            <div className="space-y-4">
              <span className="badge-ac text-[11px] font-semibold px-3 py-1">
                Most popular
              </span>
              <span className="text-[15px] font-semibold text-t block">Growth</span>
              <div className="font-display text-[40px] font-bold text-t tracking-tight leading-none flex items-baseline space-x-1.5">
                <span>$799</span>
                <span className="text-[14px] font-normal text-t2 font-sans">/month</span>
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                For multi-facility supply chains requiring AI recommendations and audit logs.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full text-center flex items-center justify-center min-h-[44px] text-[14px] "
            >
              Book a demo
            </Link>

            <div className="space-y-3 pt-3 border-t border-bd text-[14px]">
              {[
                'Everything in Team',
                'AI recommendations',
                'Human approval flow',
                'What-if simulations',
                'Shortage alerts',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-t">
                  <span className="text-ok font-bold text-[15px]">&check;</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="card-base flex flex-col justify-between p-7 space-y-6">
            <div className="space-y-4">
              <span className="text-[15px] font-semibold text-t">Enterprise</span>
              <div className="font-display text-[40px] font-bold text-t tracking-tight leading-none flex items-baseline space-x-1.5">
                <span>Custom</span>
              </div>
              <p className="text-[14px] text-t2 leading-normal">
                For complex distribution networks with custom SLA and ERP integration requirements.
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
                'Everything in Growth',
                'SSO & custom RBAC',
                'REST API & webhooks',
                'Dedicated SLA support',
                'Custom data retention',
              ].map((feat, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-t">
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
