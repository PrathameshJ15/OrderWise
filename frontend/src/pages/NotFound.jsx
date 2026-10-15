import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertOctagon, ArrowLeft, Home, LayoutDashboard, ShieldCheck, HelpCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const dashboardRoute = user?.role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col justify-center items-center px-4 font-mono select-none">
      <div className="max-w-lg w-full bg-arcade-neutral border border-arcade-border p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arcade-danger via-arcade-warning to-arcade-accent" />

        <div className="flex items-center space-x-2 text-arcade-danger text-xs uppercase tracking-widest mb-3">
          <AlertOctagon className="h-4 w-4 animate-pulse" />
          <span>Navigation Failure • 404 Route Not Located</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl uppercase tracking-tight text-arcade-primary mb-2">
          Route Not Found
        </h1>

        <div className="border border-arcade-border bg-arcade-surface p-3 my-4 font-mono text-xs">
          <span className="text-arcade-secondary block uppercase text-[10px] tracking-wider mb-1">
            Target Request URI:
          </span>
          <span className="text-arcade-danger font-bold break-all">{location.pathname}</span>
        </div>

        <p className="text-xs text-arcade-secondary leading-relaxed mb-6">
          The requested system node does not exist or has been relocated within the OrderWise routing matrix.
          Deterministic allocations and user sessions remain active and secure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-arcade-border hover:border-arcade-primary text-arcade-secondary hover:text-arcade-primary text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Previous</span>
          </button>

          {user ? (
            <Link
              to={dashboardRoute}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(200,255,58,0.3)]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Go to Command Hub</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(200,255,58,0.3)]"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-arcade-border flex items-center justify-between text-[10px] text-arcade-secondary">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="h-3 w-3 text-arcade-accent" />
            <span>OrderWise Secure Core</span>
          </div>
          <span>VORTEXA 3.0 • Problem Statement S-03</span>
        </div>
      </div>
    </div>
  );
}
