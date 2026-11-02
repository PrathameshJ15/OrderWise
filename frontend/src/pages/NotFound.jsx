import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertOctagon, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const dashboardRoute = user?.role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col justify-center items-center px-4 font-sans select-none">
      <div className="max-w-lg w-full bg-s border border-bd rounded-card p-8 shadow-none relative">
        <div className="flex items-center space-x-2 text-no text-[12px] font-mono mb-2 font-medium">
          <AlertOctagon className="h-4 w-4" />
          <span>404 Route Not Located</span>
        </div>

        <h1 className="text-[34px] font-bold tracking-tight text-white mb-2">
          Route Not Found
        </h1>

        <div className="border border-bd rounded-card bg-s2 p-3.5 my-4 font-mono text-[13px]">
          <span className="text-t2 block text-[11px] mb-1">
            Target request URI:
          </span>
          <span className="text-no font-medium break-all">{location.pathname}</span>
        </div>

        <p className="text-[14px] text-t2 leading-relaxed mb-6 font-sans">
          The requested system node does not exist or has been relocated within the OrderWise routing matrix.
          Deterministic allocations and user sessions remain active and secure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary min-h-[44px] space-x-2 text-[14px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous screen</span>
          </button>

          {user ? (
            <Link
              to={dashboardRoute}
              className="btn-primary min-h-[44px] space-x-2 text-[14px]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Go to Command Hub</span>
            </Link>
          ) : (
            <Link
              to="/"
              className="btn-primary min-h-[44px] space-x-2 text-[14px]"
            >
              <Home className="h-4 w-4" />
              <span>Main portal</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
