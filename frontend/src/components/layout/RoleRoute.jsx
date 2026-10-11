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
      <div className="min-h-screen bg-arcade-surface flex flex-col items-center justify-center p-6 text-arcade-primary font-mono">
        <div className="max-w-md w-full bg-arcade-neutral border border-arcade-danger p-6 shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldAlert className="h-7 w-7 text-arcade-danger" />
            <h2 className="font-display uppercase text-2xl font-bold tracking-wider text-arcade-primary">
              Access Prohibited
            </h2>
          </div>
          <p className="text-xs text-arcade-secondary mb-4 leading-relaxed">
            Your account role (<span className="text-arcade-accent font-bold uppercase">{user.role}</span>) does not have
            authorization to view this console.
          </p>
          <div className="flex space-x-3">
            <a
              href={user.role === 'customer' ? '/dashboard' : '/admin'}
              className="px-4 py-2 bg-arcade-accent text-arcade-surface text-xs uppercase font-bold tracking-wider hover:opacity-90"
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
