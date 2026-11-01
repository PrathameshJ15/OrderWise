import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-white flex font-sans selection:bg-ac selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <Navbar onOpenMobile={() => setMobileMenuOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 max-w-container w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer: top border, two mono lines */}
        <footer className="border-t border-bd bg-s py-6 px-4 sm:px-8 mt-12 text-[12px] font-mono text-t2">
          <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-white font-medium">OrderWise</span> — Deterministic inventory allocation and supply intelligence
            </div>
            <div className="text-t2">
              All rights reserved • High-contrast streaming console
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
