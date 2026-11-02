import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-white flex font-sans selection:bg-ac selection:text-white relative">
      {/* Subtle upper-right ambient red lighting */}
      <div
        className="fixed top-0 right-0 w-[650px] h-[500px] pointer-events-none rounded-full blur-[90px] z-0"
        style={{
          background: 'radial-gradient(ellipse at 85% 5%, rgba(229, 9, 20, 0.15), transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative z-10">
        {/* Top Navbar */}
        <Navbar onOpenMobile={() => setMobileMenuOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 max-w-container w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-bd bg-s py-6 px-4 sm:px-8 mt-12 text-[13px] text-t2 font-sans">
          <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-white font-medium">OrderWise</span> — Deterministic inventory allocation and supply intelligence
            </div>
            <div className="text-t2 text-[12px]">
              All rights reserved • Enterprise Operations
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
