import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  Database,
  ShoppingBag,
  Cpu,
  Sparkles,
  Layers,
  FlaskConical,
  ShieldAlert,
  Truck,
  BarChart3,
  ShieldCheck,
  X,
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', to: '/admin', icon: LayoutDashboard, exact: true, roles: ['admin', 'inventory_manager'] },
  { name: 'Product Management', to: '/admin/products', icon: Package, roles: ['admin', 'inventory_manager'] },
  { name: 'Inventory Management', to: '/admin/inventory', icon: Database, roles: ['admin', 'inventory_manager'] },
  { name: 'Order Management', to: '/admin/orders', icon: ShoppingBag, roles: ['admin', 'inventory_manager'] },
  { name: 'Allocation Center', to: '/admin/allocation', icon: Cpu, roles: ['admin'] },
  { name: 'AI Recommendations', to: '/admin/ai', icon: Sparkles, roles: ['admin'], badge: 'Chatbot' },
  { name: 'Impact Analyzer', to: '/admin/impact', icon: Layers, roles: ['admin'] },
  { name: 'Simulation Lab', to: '/admin/simulations', icon: FlaskConical, roles: ['admin'] },
  { name: 'Alerts', to: '/admin/alerts', icon: ShieldAlert, roles: ['admin', 'inventory_manager'] },
  { name: 'Replenishment', to: '/admin/replenishment', icon: Truck, roles: ['admin', 'inventory_manager'] },
  { name: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Audit Viewer', to: '/admin/audit', icon: ShieldCheck, roles: ['admin'] },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user } = useAuth();
  const userRole = (user?.role || 'admin').toLowerCase();

  const authorizedNavItems = ADMIN_NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-s border-r border-bd flex flex-col font-sans transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-bd bg-bg/50">
          <Link to="/admin" className="flex items-center space-x-2">
            <img src="/logo.png" alt="OrderWise" className="h-7 w-auto object-contain" />
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-full text-t2 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Badge Subheader */}
        <div className="px-4 py-2 border-b border-bd bg-s2/40 flex items-center justify-between text-[12px] font-mono">
          <span className="text-t2">Active role:</span>
          <span className="text-ac font-medium px-2 py-0.5 rounded-pill bg-ac/10 border border-ac/20">
            {user?.role || 'admin'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Admin Sidebar">
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-pill text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-ac text-white'
                      : 'text-t2 hover:text-white hover:bg-s2'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-pill bg-white/20 text-white font-mono font-medium ml-auto">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-bd bg-bg/40 text-[12px] font-mono text-t2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-ok" />
            <span>Deterministic engine</span>
          </div>
          <span className="text-white">v1.0</span>
        </div>
      </aside>
    </>
  );
}
