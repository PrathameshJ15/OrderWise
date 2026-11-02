import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import {
  RefreshCw,
  LogIn,
  UserPlus,
  LogOut,
  User,
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
    <div className="min-h-screen bg-bg text-white flex flex-col font-sans selection:bg-ac selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-bd bg-s/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-container mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-ac text-white flex items-center justify-center font-bold text-xs">
                OW
              </div>
              <span className="font-bold text-lg tracking-tight text-white uppercase">
                Order<span className="text-ac">Wise</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationBell />
            {user ? (
              <div className="flex items-center space-x-2 text-[12px] font-mono">
                <span className="text-t2">{user.email}</span>
                <button
                  onClick={logout}
                  className="btn-header py-1 text-[12px]"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-secondary min-h-[38px] px-4 text-[13px]">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary min-h-[38px] px-4 text-[13px]">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-container w-full mx-auto p-4 sm:p-6">
        <Outlet context={{ health, fetchHealth }} />
      </main>
    </div>
  );
}
