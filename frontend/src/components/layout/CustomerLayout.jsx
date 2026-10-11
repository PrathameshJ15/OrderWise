import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Boxes,
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Product Catalog', to: '/products', icon: Package },
    { name: 'Create Order', to: '/orders/new', icon: PlusCircle },
    { name: 'My Orders', to: '/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Portal title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Order<span className="text-indigo-600">Wise</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Customer Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Customer portal navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/orders'}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 font-semibold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-800 truncate max-w-[150px]">{user?.name || 'Customer'}</div>
                  <div className="text-slate-500 truncate max-w-[150px]">{user?.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile menu toggle button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/orders'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="pt-4 border-t border-slate-200 mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Deterministic Allocation Engine & Business Governance</span>
          </div>
          <div>OrderWise • VORTEXA 3.0 Platform</div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
