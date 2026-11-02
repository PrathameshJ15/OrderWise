import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function AccessDenied({ requiredRoles = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = (user?.role || 'Guest').toUpperCase();
  const targetDashboard = user?.role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 font-sans select-none">
      <div className="max-w-lg w-full bg-s border border-bd rounded-card p-8 shadow-none relative">
        <div className="flex items-center space-x-2 text-no text-[12px] font-mono mb-2 font-medium">
          <ShieldAlert className="h-4 w-4 text-no" />
          <span>Access boundary • 403 Forbidden</span>
        </div>

        <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">
          Access Restricted
        </h1>

        <div className="border border-bd rounded-card bg-s2 p-3.5 my-4 text-[13px] font-mono">
          <div className="flex justify-between items-center mb-1">
            <span className="text-t2 text-[12px]">
              Authenticated role:
            </span>
            <span className="text-white font-medium px-2 py-0.5 rounded-pill bg-ac/15 border border-ac/30 text-[11px]">
              {userRole}
            </span>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex justify-between items-center text-[12px] mt-1">
              <span className="text-t2">
                Required role:
              </span>
              <span className="text-wa font-medium">
                {requiredRoles.map((r) => r.toUpperCase()).join(' or ')}
              </span>
            </div>
          )}
        </div>

        <p className="text-[14px] text-t2 leading-relaxed mb-6 font-sans">
          Your account does not possess the requisite operational authority to view or mutate records in this module.
          Deterministic allocations and database records remain strictly protected.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary min-h-[44px] space-x-2 text-[14px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous screen</span>
          </button>

          <Link
            to={targetDashboard}
            className="btn-primary min-h-[44px] space-x-2 text-[14px]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Console home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
