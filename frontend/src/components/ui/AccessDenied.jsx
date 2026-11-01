import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock, ShieldCheck } from 'lucide-react';

export default function AccessDenied({ requiredRoles = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = (user?.role || 'Guest').toUpperCase();
  const targetDashboard = user?.role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 font-mono select-none">
      <div className="max-w-lg w-full bg-arcade-neutral border border-arcade-danger/60 p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arcade-danger via-arcade-warning to-arcade-danger" />

        <div className="flex items-center space-x-2 text-arcade-danger text-xs uppercase tracking-widest mb-3">
          <ShieldAlert className="h-4 w-4 animate-pulse text-arcade-danger" />
          <span>Access Boundary • 403 Forbidden</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight text-arcade-primary mb-2">
          Access Restricted
        </h1>

        <div className="border border-arcade-border bg-arcade-surface p-3 my-4 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-arcade-secondary text-[10px] uppercase tracking-wider">
              Authenticated Role:
            </span>
            <span className="text-arcade-accent font-bold px-1.5 py-0.5 bg-arcade-accent/10 border border-arcade-accent/30 text-[10px]">
              {userRole}
            </span>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-arcade-secondary uppercase tracking-wider">
                Required Role:
              </span>
              <span className="text-arcade-warning font-semibold">
                {requiredRoles.map((r) => r.toUpperCase()).join(' or ')}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-arcade-secondary leading-relaxed mb-6">
          Your account does not possess the requisite operational authority to view or mutate records in this module.
          Deterministic allocations and database records remain strictly protected.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-arcade-border hover:border-arcade-primary text-arcade-secondary hover:text-arcade-primary text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous Screen</span>
          </button>

          <Link
            to={targetDashboard}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(200,255,58,0.25)]"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Go to My Dashboard</span>
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-arcade-border flex items-center justify-between text-[10px] text-arcade-secondary">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="h-3 w-3 text-arcade-accent" />
            <span>OrderWise RBAC Security Enforcer</span>
          </div>
          <span>VORTEXA 3.0</span>
        </div>
      </div>
    </div>
  );
}
