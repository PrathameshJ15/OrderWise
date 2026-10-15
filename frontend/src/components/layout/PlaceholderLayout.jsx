import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';

export default function PlaceholderLayout() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);

  const { user, logout } = useAuth();

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col font-mono selection:bg-arcade-accent selection:text-arcade-surface">
      {/* Top Navbar */}
      <header className="border-b border-arcade-border bg-arcade-neutral/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-arcade-accent text-arcade-surface flex items-center justify-center font-display font-extrabold text-xl shadow-[0_0_12px_rgba(200,255,58,0.4)]">
                OW
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-display font-black text-2xl tracking-wider text-arcade-primary uppercase">
                    OrderWise
                  </span>
                  <span className="text-[10px] tracking-widest px-1.5 py-0.5 bg-arcade-surface border border-arcade-border text-arcade-accent font-semibold uppercase">
                    VORTEXA 3.0
                  </span>
                </div>
                <p className="text-[10px] text-arcade-secondary hidden sm:block">
                  AI recommends. Rules validate. Humans approve. OrderWise allocates.
                </p>
              </div>
            </Link>
          </div>

          {/* User Nav and API Status Badge */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Backend Connectivity Status Badge */}
            <div
              className={`flex items-center space-x-2 px-2.5 py-1.5 border uppercase tracking-wider text-[11px] ${
                loading
                  ? 'border-arcade-border text-arcade-secondary bg-arcade-surface'
                  : health
                  ? 'border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent'
                  : 'border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger'
              }`}
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : health ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span className="font-semibold">
                {loading
                  ? 'Probing API...'
                  : health
                  ? `API Connected (${health.status})`
                  : 'API Disconnected'}
              </span>
            </div>

            {/* Auth Controls & Notification Bell */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-arcade-border">
                <NotificationBell />
                <Link
                  to={user.role === 'customer' ? '/dashboard' : '/admin'}
                  className="flex items-center space-x-1.5 text-arcade-primary hover:text-arcade-accent transition-colors py-1 px-2 border border-arcade-border bg-arcade-surface"
                >
                  <User className="h-3.5 w-3.5 text-arcade-accent" />
                  <span className="truncate max-w-[120px] font-semibold">{user.name}</span>
                  <span className="text-[9px] px-1 py-0.2 bg-arcade-neutral text-arcade-secondary uppercase border border-arcade-border">
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 border border-arcade-border text-arcade-secondary hover:text-arcade-danger hover:border-arcade-danger transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-2 border-l border-arcade-border">
                <Link
                  to="/home"
                  className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 text-arcade-secondary hover:text-arcade-primary text-xs uppercase tracking-wider transition-colors"
                >
                  Overview
                </Link>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-2.5 py-1.5 border border-arcade-border hover:border-arcade-accent text-arcade-primary hover:text-arcade-accent transition-colors"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-arcade-accent text-arcade-surface font-bold hover:opacity-90 transition-opacity"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Primary Role-Aware Navigation Bar */}
        {user && (
          <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-arcade-border/60 flex items-center space-x-1 overflow-x-auto text-xs">
            {user.role === 'customer' ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Catalog
                </NavLink>
                <NavLink
                  to="/orders/new"
                  className="px-3 py-1 text-arcade-accent hover:text-arcade-accent uppercase tracking-wider transition-colors font-bold"
                >
                  + Create Order
                </NavLink>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  My Orders
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Console
                </NavLink>
                <NavLink
                  to="/admin/allocation"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Allocation Center
                </NavLink>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Products
                </NavLink>
                <NavLink
                  to="/admin/inventory"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Inventory
                </NavLink>
                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Orders
                </NavLink>
                <NavLink
                  to="/admin/ai"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors flex items-center space-x-1 opacity-75 ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  <Sparkles className="h-3 w-3 text-arcade-secondary" />
                  <span>AI Priorities</span>
                  <span className="text-[8px] px-1 py-0.2 border border-arcade-border text-arcade-secondary uppercase">Soon</span>
                </NavLink>
                <NavLink
                  to="/admin/simulations"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors flex items-center space-x-1 opacity-75 ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  <span>Simulation</span>
                  <span className="text-[8px] px-1 py-0.2 border border-arcade-border text-arcade-secondary uppercase">Soon</span>
                </NavLink>
                <NavLink
                  to="/admin/alerts"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors flex items-center space-x-1 opacity-75 ${
                      isActive ? 'text-arcade-warning font-bold' : 'text-arcade-secondary hover:text-arcade-warning'
                    }`
                  }
                >
                  <span>Alerts</span>
                  <span className="text-[8px] px-1 py-0.2 border border-arcade-border text-arcade-secondary uppercase">Soon</span>
                </NavLink>
                <NavLink
                  to="/admin/replenishment"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors flex items-center space-x-1 opacity-75 ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  <span>Replenishment</span>
                  <span className="text-[8px] px-1 py-0.2 border border-arcade-border text-arcade-secondary uppercase">Soon</span>
                </NavLink>
                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Reports
                </NavLink>
                <NavLink
                  to="/admin/audit"
                  className={({ isActive }) =>
                    `px-3 py-1 uppercase tracking-wider transition-colors ${
                      isActive ? 'text-arcade-accent font-bold' : 'text-arcade-secondary hover:text-arcade-primary'
                    }`
                  }
                >
                  Audit Log
                </NavLink>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet context={{ health, loading, refreshHealth: fetchHealth }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-arcade-border bg-arcade-neutral/40 py-6 px-6 text-xs text-arcade-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OrderWise Platform • Problem Statement S-03 • 2026</span>
          <div className="flex items-center space-x-4">
            <span className="text-arcade-secondary/60">Node 20 • React 18 • PostgreSQL 15 • Groq Llama-3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
