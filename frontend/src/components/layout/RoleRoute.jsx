import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export default function RoleRoute({ allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  const userRole = (user.role || '').toLowerCase();

  if (!normalizedAllowed.includes(userRole)) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-s border border-no/30 rounded-card p-6 shadow-none">
          <div className="flex items-center space-x-3 mb-3">
            <ShieldAlert className="h-6 w-6 text-no" />
            <h2 className="text-[20px] font-bold tracking-tight text-white">
              Access Prohibited
            </h2>
          </div>
          <p className="text-[14px] text-t2 mb-4 leading-relaxed">
            Your account role (<span className="text-white font-mono font-medium">{user.role}</span>) does not have
            authorization to view this console.
          </p>
          <div className="flex space-x-3">
            <a
              href={user.role === 'customer' ? '/dashboard' : '/admin'}
              className="btn-primary min-h-[40px] px-5 text-[13px]"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
