import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle, Database } from 'lucide-react';

export default function Security() {
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
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/security" className="text-white font-semibold">Security</Link>
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
          className="absolute top-1/4 right-1/4 w-[450px] h-[350px] bg-ac/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Page Header */}
        <div className="text-center space-y-3 relative z-10 max-w-3xl mx-auto">
          <span className="text-ac font-mono text-[13px] uppercase tracking-wider font-semibold">
            Security
          </span>
          <h1 className="text-[34px] sm:text-[48px] font-bold tracking-tight text-white leading-tight">
            Every decision is governed, scoped and logged
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed">
            OrderWise is built so no recommendation can change stock without a human, and no action goes unrecorded.
          </p>
        </div>

        {/* 6 Grid Security Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-ok">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Human approval</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              AI outputs recommendations with evidence and confidence scores. It can never modify inventory or approved priorities without explicit admin approval.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-ac">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Immutable audit log</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Records who approved priorities, adjusted physical stock, or initiated allocation runs with timestamps, IP addresses, and state diffs.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-[#F5B544]">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Scoped real-time events</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Customers only receive SSE order events for their own account. Backend enforces strict SQL authorization on every query.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Role-based access (RBAC)</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Separate authority levels for Admins, Inventory Managers, and Customers. Inventory Managers cannot approve AI priorities or reallocations.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-ok">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Safe concurrency</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Optimistic concurrency versioning and row-level locking (SELECT FOR UPDATE) protect inventory balances from race conditions.
            </p>
          </div>

          <div className="card-base p-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-s2 flex items-center justify-center text-t2">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-white">Soft-delete lifecycle</h3>
            <p className="text-[14px] text-t2 leading-relaxed">
              Catalog items and historical records are retired, never erased, ensuring complete regulatory compliance and historic reproducibility.
            </p>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="card-base p-7 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-[20px] font-bold text-white">Compliance and certifications</h3>
            <p className="text-[14px] text-t2">
              Designed for SOC 2 Type II and ISO 27001 readiness with comprehensive access auditing.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-secondary min-h-[44px] px-6 text-[14px]"
          >
            Request security overview
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
