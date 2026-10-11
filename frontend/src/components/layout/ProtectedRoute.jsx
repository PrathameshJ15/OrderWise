import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RefreshCw } from 'lucide-react';

export default function ProtectedRoute() {
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

  return <Outlet />;
}
