import React from 'react';
import { Link } from 'react-router-dom';
import AmbientLighting from '../components/ui/AmbientLighting';
import PublicNavbar from '../components/layout/PublicNavbar';

export default function Security() {
  return (
    <div className="min-h-screen bg-bg text-t font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Soft ambient lighting */}
      <AmbientLighting withGrid={false} />

      {/* Top Navigation */}
      <PublicNavbar active="security" />

      {/* Main Container */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-12 space-y-12 flex-1 w-full relative z-10">
        {/* Page Header */}
        <div className="space-y-3 relative z-10 max-w-3xl">
          <span className="text-ac font-mono text-[13px] block tracking-wider uppercase font-semibold">
            Security &amp; Governance
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-tight text-t leading-tight">
            Every decision is governed, scoped and logged
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            OrderWise ensures AI cannot modify inventory without human approval, and every operational change is permanently recorded.
          </p>
        </div>

        {/* 6 Grid Security Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Human-in-the-loop</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              AI recommends priorities with confidence scores; inventory modifies only after authorized administrator approval.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Immutable audit log</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Cryptographically timestamped ledger records all priority decisions, stock adjustments, and allocation runs.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Scoped live events</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Real-time telemetry feeds broadcast strictly to authorized accounts with zero cross-tenant data leakage.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Role-based access</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Granular authorization enforced at the database level for administrators, managers, and commercial customers.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Safe concurrency</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Row-level locking and ACID transactions eliminate double-allocation and concurrent fulfillment conflicts.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-t">Retention lifecycle</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Audit trails preserve historical order records and SKU changes permanently for regulatory compliance.
            </p>
          </div>
        </div>

        {/* Compliance and Certifications Banner */}
        <div className="card-base p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-bd/60">
          <div>
            <h3 className="text-[18px] font-display font-bold text-t">Compliance &amp; Certifications</h3>
            <p className="text-[14px] text-t2 mt-0.5">
              Architected for SOC 2 Type II, ISO 27001, and HIPAA compliance readiness.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-secondary min-h-[42px] px-5 text-[13px] shrink-0"
          >
            Request security overview
          </Link>
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
