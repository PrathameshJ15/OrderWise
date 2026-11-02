import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import Breadcrumbs from './Breadcrumbs';
import ThemeToggle from '../ui/ThemeToggle';

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Product Catalog', to: '/products', icon: Package },
    { name: 'Create Order', to: '/orders/new', icon: PlusCircle },
    { name: 'My Orders', to: '/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-bg text-t flex flex-col font-sans selection:bg-ac selection:text-white relative transition-colors">
      {/* Subtle ambient lighting */}
      <div
        className="fixed top-0 right-0 w-[650px] h-[500px] pointer-events-none rounded-full blur-[90px] z-0"
        style={{
          background: 'radial-gradient(ellipse at 85% 5%, rgba(229, 9, 20, 0.14), transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Top Customer Navigation Header */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-30 relative transition-colors">
        <div className="max-w-container mx-auto px-4 sm:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo: 1 icon mark + 1 text wordmark */}
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-2.5">
                <img src="/logo-icon.png" alt="" className="h-7 w-7 object-contain" />
                <span className="font-display font-bold text-[18px] text-t tracking-tight">
                  Order<span className="text-ac">Wise</span>
                </span>
              </Link>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-sans font-medium rounded-pill bg-ac/10 text-ac border border-ac/20">
                Customer portal
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2" aria-label="Customer Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-pill text-[14px] font-medium transition-colors ${
                        isActive
                          ? 'bg-ac text-white font-semibold shadow-xs'
                          : 'text-t2 hover:text-t hover:bg-s2'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              <ThemeToggle variant="segmented" className="hidden sm:inline-flex" />
              <ThemeToggle variant="button" className="sm:hidden" />
              <NotificationBell />
              <UserProfileMenu />

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-t transition-colors cursor-pointer"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-bd bg-s px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-pill text-[14px] font-medium transition-colors active:scale-[0.99] ${
                      isActive
                        ? 'bg-ac text-white font-semibold'
                        : 'text-t2 hover:text-t hover:bg-s2'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Breadcrumbs Sub-strip */}
      <div className="border-b border-bd/60 bg-s2/20 py-2.5 px-4 sm:px-8 relative z-10">
        <div className="max-w-container mx-auto">
          <Breadcrumbs />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-container w-full mx-auto px-4 sm:px-8 py-6 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-bd bg-s py-6 px-4 sm:px-8 mt-12 text-[13px] text-t2 font-sans relative z-10 transition-colors">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-t font-medium">OrderWise</span> — Deterministic inventory allocation and supply intelligence
          </div>
          <div className="text-t2 text-[12px]">
            All rights reserved • Customer Console
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
