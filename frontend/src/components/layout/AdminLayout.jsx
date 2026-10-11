import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Boxes,
  LayoutDashboard,
  Sparkles,
  Layers,
  ShieldAlert,
  Truck,
  Sliders,
  Package,
  ClipboardList,
  FlaskConical,
  BarChart3,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { name: 'AI Priority', to: '/admin/ai', icon: Sparkles },
    { name: 'Impact Analyzer', to: '/admin/impact', icon: Layers },
    { name: 'Supply Alerts', to: '/admin/alerts', icon: ShieldAlert },
    { name: 'Replenishment', to: '/admin/replenishment', icon: Truck },
    { name: 'Allocation Center', to: '/admin/allocation', icon: Sliders },
    { name: 'Orders', to: '/admin/orders', icon: ClipboardList },
    { name: 'Inventory', to: '/admin/inventory', icon: Package },
    { name: 'Simulations', to: '/admin/simulations', icon: FlaskConical },
    { name: 'Reports', to: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col font-mono">
      {/* Top Navbar */}
      <header className="border-b border-arcade-border bg-arcade-neutral sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-arcade-accent bg-arcade-accent/15 text-arcade-accent shadow-[0_0_10px_rgba(200,255,58,0.2)]">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight uppercase text-arcade-primary">
                  Order<span className="text-arcade-accent">Wise</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent">
                  Command Center
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Admin Navigation">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                        isActive
                          ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent'
                          : 'border-transparent text-arcade-secondary hover:text-arcade-primary hover:border-arcade-border'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* User profile & Logout */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 border border-arcade-border px-2.5 py-1 bg-arcade-surface text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-arcade-accent" />
                <span className="text-arcade-secondary">{user?.email || 'admin@orderwise.com'}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 border border-arcade-border text-arcade-secondary hover:text-rose-400 hover:border-rose-500/50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu trigger */}
            <div className="flex sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 border border-arcade-border text-arcade-secondary hover:text-arcade-primary"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-arcade-border bg-arcade-neutral p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
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
            <div className="pt-2 border-t border-arcade-border mt-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs font-bold uppercase text-rose-400 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Subnav for quick phase jumping */}
      <div className="border-b border-arcade-border bg-arcade-neutral/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-arcade-secondary uppercase tracking-wider text-[10px] font-bold mr-1">Modules:</span>
          {navItems.map((item) => (
            <NavLink
              key={`sub-${item.to}`}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `px-2 py-0.5 whitespace-nowrap uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'text-arcade-accent font-bold underline'
                    : 'text-arcade-secondary hover:text-arcade-primary'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
