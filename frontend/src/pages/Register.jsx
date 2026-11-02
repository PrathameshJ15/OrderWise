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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 font-sans py-8 relative">
      {/* Subtle upper-right ambient red lighting */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[400px] pointer-events-none rounded-full blur-[120px] -z-0"
        style={{
          background: 'radial-gradient(ellipse at 85% 5%, rgba(229,9,20,0.18), transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-md w-full bg-s border border-bd rounded-card p-8 shadow-none relative z-10">
        <div className="mb-6">
          <Link to="/" className="flex items-center space-x-2 mb-4">
            <img src="/logo-icon.png" alt="OrderWise" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-[19px] tracking-tight text-t">
              Order<span className="text-ac">Wise</span>
            </span>
          </Link>
          <div className="flex items-center space-x-2 text-ac text-[12px] font-mono mb-1 font-medium">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Customer onboarding</span>
          </div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-t">
            Create OrderWise Account
          </h1>
          <p className="text-[14px] text-t2 mt-1">
            Register your enterprise or organization to place priority orders.
          </p>
        </div>

        {localError && (
          <div className="mb-6 p-4 bg-no/10 border border-no/30 text-no rounded-card text-[13px] flex items-start space-x-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Registration error</span>
              <span>{localError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Company / Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Industrial Corp"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="purchasing@acme.example"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-t2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-s2 border border-bd rounded-pill pl-10 pr-4 py-2.5 text-[14px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
              />
            </div>
          </div>

          {/* Password policy requirements */}
          <div className="bg-s2/60 border border-bd rounded-card p-4 space-y-2 text-[12px] font-mono">
            <span className="block font-medium text-t">Password Security Policy:</span>
            <div className="space-y-1.5">
              <div className={`flex items-center space-x-2 ${isLengthValid ? 'text-ok' : 'text-t2'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasLetter ? 'text-ok' : 'text-t2'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Contains letters</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasNumber ? 'text-ok' : 'text-t2'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Contains at least one number</span>
              </div>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Complete Customer Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-t2">
          <span>Already have an account? </span>
          <Link to="/login" className="text-t hover:underline font-semibold ml-1">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
