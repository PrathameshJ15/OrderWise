import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Mail, User, AlertTriangle, ArrowRight, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const isLengthValid = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPolicyMet = isLengthValid && hasLetter && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!isPolicyMet) {
      setLocalError('Password must meet the security policy criteria below');
      return;
    }

    setSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setLocalError(err?.error?.message || err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 font-mono py-8">
      <div className="max-w-md w-full bg-arcade-neutral border border-arcade-border p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arcade-accent via-arcade-secondary to-arcade-accent" />

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-arcade-accent text-xs mb-1 uppercase tracking-widest">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Customer Onboarding</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight uppercase text-arcade-primary">
            Create OrderWise Account
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Register your enterprise or organization to place priority orders.
          </p>
        </div>

        {localError && (
          <div className="mb-6 p-3 bg-arcade-danger/10 border border-arcade-danger/40 text-arcade-danger text-xs flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider">Registration Error</span>
              <span>{localError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Company / Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Industrial Corp"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="purchasing@acme.example"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-arcade-secondary mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-arcade-secondary" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-arcade-surface border border-arcade-border px-9 py-2.5 text-xs text-arcade-primary placeholder-arcade-secondary/40 focus:outline-none focus:border-arcade-accent transition-colors"
              />
            </div>
          </div>

          {/* Password Policy Tracker */}
          <div className="bg-arcade-surface border border-arcade-border p-3 text-[11px] space-y-1">
            <span className="block text-arcade-secondary font-semibold uppercase text-[10px] tracking-wider mb-1">
              Password Security Policy:
            </span>
            <div className={`flex items-center space-x-1.5 ${isLengthValid ? 'text-arcade-accent' : 'text-arcade-secondary'}`}>
              <CheckCircle2 className="h-3 w-3" />
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${hasLetter ? 'text-arcade-accent' : 'text-arcade-secondary'}`}>
              <CheckCircle2 className="h-3 w-3" />
              <span>Contains letters</span>
            </div>
            <div className={`flex items-center space-x-1.5 ${hasNumber ? 'text-arcade-accent' : 'text-arcade-secondary'}`}>
              <CheckCircle2 className="h-3 w-3" />
              <span>Contains at least one number</span>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Customer Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-arcade-secondary">
          <span>Already registered? </span>
          <Link to="/login" className="text-arcade-accent hover:underline font-bold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
