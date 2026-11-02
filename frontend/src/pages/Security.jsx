import React from 'react';
import { Link } from 'react-router-dom';
import AmbientLighting from '../components/ui/AmbientLighting';

export default function Security() {
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
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/security" className="text-white font-semibold">Security</Link>
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
        <div className="space-y-3 relative z-10 max-w-3xl">
          <span className="text-ac font-mono text-[13px] block tracking-wider uppercase font-semibold">
            Security &amp; Governance
          </span>
          <h1 className="font-display text-[36px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Every decision is governed, scoped and logged
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            OrderWise is built so no AI recommendation can change stock without an authorized human, and no action goes unrecorded.
          </p>
        </div>

        {/* 6 Grid Security Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Human approval</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              AI outputs recommendations with evidence and confidence. It can never modify inventory without explicit admin approval.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Immutable audit log</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Cryptographically timestamped audit trail records who approved priorities, adjusted stock, or ran allocations.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Scoped real-time events</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Customers only receive Server-Sent Events strictly for their own orders. Zero cross-tenant data leakage.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Role-based access</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Separate strict authority levels enforced at the database level for admins, inventory managers, and customers.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Safe concurrency</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Transactional row locking and optimistic concurrency protect stock from duplicate allocation runs or conflicting updates.
            </p>
          </div>

          <div className="card-base p-6 space-y-2">
            <h3 className="text-[18px] font-display font-bold text-white">Soft-delete lifecycle</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Catalog items and customer orders are retired, not hard-deleted, so historical compliance records remain intact.
            </p>
          </div>
        </div>

        {/* Compliance and Certifications Banner */}
        <div className="card-base p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-bd/60">
          <div>
            <h3 className="text-[18px] font-display font-bold text-white">Compliance &amp; Certifications</h3>
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
