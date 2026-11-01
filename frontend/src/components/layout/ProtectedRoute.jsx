import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import AccessDenied from '../ui/AccessDenied';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-arcade-surface flex flex-col items-center justify-center p-6 text-arcade-primary font-mono">
        <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent mb-3" />
        <p className="text-xs tracking-wider uppercase text-arcade-secondary">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      return <AccessDenied requiredRoles={allowedRoles} />;
    }
  }

  return children ? children : <Outlet />;
}
