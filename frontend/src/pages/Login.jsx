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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin' || user.role === 'inventory_manager') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin' || user.role === 'inventory_manager') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 font-mono">
      <div className="max-w-md w-full bg-arcade-neutral border border-arcade-border p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arcade-accent via-arcade-secondary to-arcade-accent" />

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-arcade-accent text-xs mb-1 uppercase tracking-widest">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure Access Point</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight uppercase text-arcade-primary">
            Sign In to OrderWise
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Sign in to your account • Deterministic order allocation &amp; supply chain intelligence.
          </p>
        </div>

        {localError && (
          <div className="mb-6 p-3 bg-arcade-danger/10 border border-arcade-danger/40 text-arcade-danger text-xs flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider">Access Error</span>
              <span>{localError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider py-3 flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying Credentials...</span>
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
        <div className="mt-6 pt-6 border-t border-arcade-border">
          <div className="flex items-center justify-between mb-2">
            <span className="block text-[10px] uppercase tracking-widest text-arcade-secondary">
              Quick Demo Accounts
            </span>
            <span className="text-[9px] text-arcade-accent uppercase tracking-wider">
              1-Click Fast Login
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('admin@orderwise.com', 'Admin123!')}
              className="px-2 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent hover:bg-arcade-accent/10 text-arcade-primary text-center font-bold truncate transition-all disabled:opacity-50"
            >
              Admin
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('manager@orderwise.com', 'Manager123!')}
              className="px-2 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent hover:bg-arcade-accent/10 text-arcade-primary text-center font-bold truncate transition-all disabled:opacity-50"
            >
              Manager
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('alice@demo.com', 'Alice123!')}
              className="px-2 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent hover:bg-arcade-accent/10 text-arcade-primary text-center font-bold truncate transition-all disabled:opacity-50"
            >
              Customer
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-arcade-secondary">
          <span>New customer account? </span>
          <Link to="/register" className="text-arcade-accent hover:underline font-bold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
