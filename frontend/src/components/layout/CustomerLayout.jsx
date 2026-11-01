import React, { useState } from 'react';
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

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Product Catalog', to: '/products', icon: Package },
    { name: 'Create Order', to: '/orders/new', icon: PlusCircle },
    { name: 'My Orders', to: '/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col font-sans selection:bg-ac selection:text-white">
      {/* Top Customer Navigation Header */}
      <header className="border-b border-bd bg-s sticky top-0 z-30">
        <div className="max-w-container mx-auto px-4 sm:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <img src="/logo.png" alt="OrderWise" className="h-7 w-auto object-contain" />
              </Link>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-pill bg-ac/15 text-white border border-ac/30">
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
                      `flex items-center space-x-2 px-3.5 py-2 rounded-pill text-[14px] font-medium transition-colors ${
                        isActive
                          ? 'bg-ac text-white'
                          : 'text-t2 hover:text-white hover:bg-s2'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
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
                className="p-2 rounded-full border border-[#555] text-t2 hover:text-white hover:border-white"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-bd bg-s p-4 space-y-2">
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
                      `flex items-center space-x-3 px-4 py-2.5 rounded-pill text-[14px] font-medium ${
                        isActive
                          ? 'bg-ac text-white'
                          : 'text-t2 hover:text-white hover:bg-s2'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Breadcrumbs Sub-bar */}
      <div className="border-b border-bd bg-s2/30 px-4 sm:px-8 py-2">
        <div className="max-w-container mx-auto">
          <Breadcrumbs />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-container w-full mx-auto px-4 sm:px-8 py-6">
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
  );
}

export default CustomerLayout;
