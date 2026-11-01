import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import Breadcrumbs from './Breadcrumbs';

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Product Catalog', to: '/products', icon: Package },
    { name: 'Create Order', to: '/orders/new', icon: PlusCircle },
    { name: 'My Orders', to: '/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col font-mono selection:bg-arcade-accent selection:text-arcade-surface">
      {/* Top Customer Navigation Header */}
      <header className="border-b border-arcade-border bg-arcade-neutral sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border border-arcade-accent bg-arcade-accent/15 text-arcade-accent flex items-center justify-center font-display font-extrabold text-sm shadow-[0_0_10px_rgba(200,255,58,0.25)]">
                OW
              </div>
              <div>
                <span className="font-display font-black text-lg tracking-wider text-arcade-primary uppercase">
                  Order<span className="text-arcade-accent">Wise</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent">
                  Customer Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Customer Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                        isActive
                          ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent shadow-[0_0_8px_rgba(200,255,58,0.15)]'
                          : 'border-transparent text-arcade-secondary hover:text-arcade-primary hover:border-arcade-border hover:bg-arcade-surface/50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Notifications & User Profile */}
            <div className="hidden sm:flex items-center space-x-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>

            {/* Mobile menu toggle */}
            <div className="flex sm:hidden items-center space-x-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 border border-arcade-border text-arcade-secondary hover:text-arcade-primary hover:border-arcade-accent"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-arcade-border bg-arcade-neutral p-4 space-y-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border ${
                        isActive
                          ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent'
                          : 'border-transparent text-arcade-secondary hover:text-arcade-primary'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-arcade-border">
              <UserProfileMenu />
            </div>
          </div>
        )}
      </header>

      {/* Subnav Breadcrumbs Bar */}
      <div className="border-b border-arcade-border bg-arcade-neutral/50 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-arcade-border bg-arcade-neutral/40 py-3 text-center text-[10px] text-arcade-secondary">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-arcade-accent" />
            <span>Deterministic Allocation Engine &amp; Business Rules Governance</span>
          </div>
          <span>OrderWise • VORTEXA 3.0 Platform</span>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
