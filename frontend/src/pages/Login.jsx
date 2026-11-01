import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, AlertTriangle, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const getDestination = (loggedInUser) => {
    const role = (loggedInUser?.role || '').toLowerCase();
    if (role === 'customer') {
      if (from && !from.startsWith('/admin') && from !== '/login' && from !== '/') {
        return from;
      }
      return '/dashboard';
    }
    if (role === 'admin' || role === 'inventory_manager') {
      if (from && from.startsWith('/admin')) {
        return from;
      }
      return '/admin';
    }
    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      navigate(getDestination(user), { replace: true });
    } catch (err) {
      setLocalError(err?.error?.message || err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError(null);
    setSubmitting(true);

    try {
      const user = await login(demoEmail, demoPassword);
      navigate(getDestination(user), { replace: true });
    } catch (err) {
      setLocalError(err?.error?.message || err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 font-sans">
      <div className="max-w-md w-full bg-s border border-bd rounded-card p-8 shadow-none relative">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="OrderWise" className="h-8 w-auto object-contain" />
            </Link>
            <div className="flex items-center space-x-1 text-t2 text-[12px] font-mono">
              <Lock className="h-3.5 w-3.5 text-ac" />
              <span>Secure access</span>
            </div>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-white">
            Sign In to OrderWise
          </h1>
          <p className="text-[14px] text-t2 mt-1">
            Sign in to your account • Deterministic order allocation &amp; supply chain intelligence.
          </p>
        </div>

        {localError && (
          <div className="mb-6 p-4 bg-[#291313] border border-no/30 text-no rounded-card text-[13px] flex items-start space-x-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Access error</span>
              <span>{localError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[12px] font-mono text-t2 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-white placeholder-t2/50 focus:outline-none focus:border-white transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] font-mono text-t2 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-white placeholder-t2/50 focus:outline-none focus:border-white transition-colors font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill & 1-Click Access Shortcuts */}
        <div className="mt-6 pt-6 border-t border-bd">
          <div className="flex items-center justify-between mb-2.5">
            <span className="block text-[12px] font-mono text-t2">
              Quick Demo Accounts
            </span>
            <span className="text-[12px] font-mono text-ac font-medium">
              1-Click fast login
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[12px] font-mono">
            <button
              type="button"
              disabled={submitting}
              onClick={() => fillCredentials('admin@orderwise.com', 'Admin123!')}
              className="px-2.5 py-2 border border-bd bg-s2 hover:border-white text-white rounded-pill text-center font-medium truncate transition-colors disabled:opacity-50"
            >
              Admin
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => fillCredentials('manager@orderwise.com', 'Manager123!')}
              className="px-2.5 py-2 border border-bd bg-s2 hover:border-white text-white rounded-pill text-center font-medium truncate transition-colors disabled:opacity-50"
            >
              Manager
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => fillCredentials('alice@demo.com', 'Alice123!')}
              className="px-2.5 py-2 border border-bd bg-s2 hover:border-white text-white rounded-pill text-center font-medium truncate transition-colors disabled:opacity-50"
            >
              Customer
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[13px] text-t2">
          <span>New customer account? </span>
          <Link to="/register" className="text-white hover:underline font-semibold ml-1">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
