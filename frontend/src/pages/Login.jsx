import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Boxes, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email, password);
      const redirectPath = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.error?.message || err.message || 'Invalid email or password. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md mb-4">
          <Boxes className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">OrderWise</h1>
        <p className="mt-2 text-sm text-slate-600">
          Deterministic Inventory Allocation & Intelligent Order Processing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Sign in to your account</h2>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border ${
                    errors.email ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } shadow-xs transition`}
                  placeholder="name@company.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border ${
                    errors.password ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } shadow-xs transition`}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Customer Logins */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alice@demo.com', 'Alice123!')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition border border-slate-200 text-slate-700"
              >
                Alice (High)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('bob@demo.com', 'Bob123!')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition border border-slate-200 text-slate-700"
              >
                Bob (Med)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('charlie@demo.com', 'Charlie123!')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition border border-slate-200 text-slate-700"
              >
                Charlie (High)
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
