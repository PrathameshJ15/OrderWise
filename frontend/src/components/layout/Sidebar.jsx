import React from 'react';
import { NavLink } from 'react-router-dom';
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
  { name: 'AI Recommendations', to: '/admin/ai', icon: Sparkles, roles: ['admin'] },
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-arcade-neutral border-r border-arcade-border flex flex-col font-mono transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-arcade-border bg-arcade-surface/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 border border-arcade-accent bg-arcade-accent/15 text-arcade-accent flex items-center justify-center font-display font-extrabold text-sm shadow-[0_0_10px_rgba(200,255,58,0.25)]">
              OW
            </div>
            <div>
              <span className="font-display font-black text-base uppercase tracking-wider text-arcade-primary block leading-none">
                Order<span className="text-arcade-accent">Wise</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-arcade-secondary block mt-0.5">
                {userRole === 'inventory_manager' ? 'Manager Console' : 'Control Center'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-arcade-secondary hover:text-arcade-primary"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Badge Subheader */}
        <div className="px-4 py-2 border-b border-arcade-border bg-arcade-surface/30 flex items-center justify-between text-[10px]">
          <span className="text-arcade-secondary uppercase tracking-widest">Active Role:</span>
          <span className="text-arcade-accent uppercase font-bold px-1.5 py-0.2 bg-arcade-accent/10 border border-arcade-accent/20">
            {user?.role || 'admin'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" aria-label="Admin Sidebar">
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                    isActive
                      ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent shadow-[0_0_8px_rgba(200,255,58,0.15)]'
                      : 'border-transparent text-arcade-secondary hover:text-arcade-primary hover:border-arcade-border hover:bg-arcade-surface/50'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-arcade-border bg-arcade-surface/50 text-[10px] text-arcade-secondary flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="inline-block w-2 h-2 rounded-full bg-arcade-accent animate-pulse" />
            <span>Deterministic Engine</span>
          </div>
          <span className="font-bold">v1.0.0</span>
        </div>
      </aside>
    </>
  );
}
