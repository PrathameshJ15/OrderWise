import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';
import {
  Menu,
  X,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
  DollarSign,
  UserPlus,
  Compass,
} from 'lucide-react';

export default function PublicNavbar({ active = '' }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'How it works', href: '/#how-it-works', isHash: true, icon: HelpCircle },
    { label: 'Modules', href: '/#modules', isHash: true, icon: Layers },
    { label: 'Solutions', href: '/solutions', key: 'solutions', icon: Compass },
    { label: 'Pricing', href: '/pricing', key: 'pricing', icon: DollarSign },
    { label: 'Security', href: '/security', key: 'security', icon: Shield },
  ];

  return (
    <>
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-colors shadow-[0_1px_0_rgba(229,9,20,0.35)]">
        <div className="max-w-container mx-auto flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <img src="/logo-icon.png" alt="OrderWise" className="h-7 w-7 object-contain" />
              <span className="font-display font-bold text-[19px] tracking-tight text-t">
                Order<span className="text-ac">Wise</span>
              </span>
            </Link>
            <div className="hidden sm:block border-l border-bd pl-3">
              <span className="text-[12px] font-mono text-t2 block">
                Supply chain &amp; allocation intelligence
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-[14px] text-t2 font-medium" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isCurrent = active === item.key || (item.isHash && location.pathname === '/' && location.hash === item.href.replace('/', ''));
              if (item.isHash && location.pathname === '/') {
                return (
                  <a
                    key={item.label}
                    href={item.href.replace('/', '')}
                    className={`transition-colors ${isCurrent ? 'text-t font-semibold' : 'hover:text-t'}`}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`transition-colors ${isCurrent ? 'text-t font-semibold' : 'hover:text-t'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right CTA Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <ThemeToggle variant="segmented" />

            <Link
              to="/login"
              className="text-[14px] text-t2 hover:text-t font-medium transition-colors px-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-secondary min-h-[38px] px-4 text-[13px] inline-flex items-center justify-center"
            >
              Register
            </Link>
            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)] flex items-center space-x-1.5"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary min-h-[38px] px-5 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)] flex items-center space-x-1.5"
              >
                <span>Launch Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle & Quick Portal Button & Hamburger */}
          <div className="flex sm:hidden items-center space-x-2">
            <ThemeToggle variant="button" />

            {user ? (
              <Link
                to={user.role === 'customer' ? '/dashboard' : '/admin'}
                className="btn-primary min-h-[36px] px-3.5 text-[12px] shadow-[0_0_15px_rgba(229,9,20,0.3)] flex items-center space-x-1"
              >
                <span>Console</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-primary min-h-[36px] px-3.5 text-[12px] shadow-[0_0_15px_rgba(229,9,20,0.3)] flex items-center space-x-1"
              >
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-10 h-10 rounded-full border border-bd bg-s text-t2 hover:text-t hover:border-t transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5 text-t" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Mobile Slide-Down Drawer & Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div className="relative w-full bg-s border-b border-bd shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-top duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-bd flex items-center justify-between bg-s">
              <div className="flex items-center space-x-2">
                <img src="/logo-icon.png" alt="OrderWise" className="h-6 w-6 object-contain" />
                <span className="font-display font-bold text-[17px] text-t">
                  Order<span className="text-ac">Wise</span>
                </span>
                <span className="text-[11px] font-mono text-t2 pl-2 border-l border-bd">
                  Navigation
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle variant="segmented" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full bg-s2 border border-bd text-t2 hover:text-t flex items-center justify-center cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="p-4 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isCurrent = active === item.key || (item.isHash && location.pathname === '/' && location.hash === item.href.replace('/', ''));
                
                if (item.isHash && location.pathname === '/') {
                  return (
                    <a
                      key={item.label}
                      href={item.href.replace('/', '')}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-card text-[15px] font-medium transition-colors ${
                        isCurrent
                          ? 'bg-ac/15 text-t border border-ac/30 font-semibold'
                          : 'text-t2 hover:text-t hover:bg-s2 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${isCurrent ? 'text-ac' : 'text-t2'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-t2/50" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-card text-[15px] font-medium transition-colors ${
                      isCurrent
                        ? 'bg-ac/15 text-t border border-ac/30 font-semibold'
                        : 'text-t2 hover:text-t hover:bg-s2 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isCurrent ? 'text-ac' : 'text-t2'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-t2/50" />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Actions Footer */}
            <div className="p-4 pt-3 border-t border-bd bg-s2/40 space-y-2.5">
              {user ? (
                <Link
                  to={user.role === 'customer' ? '/dashboard' : '/admin'}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full min-h-[46px] text-[14px] flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
                >
                  <span>Enter Operations Console ({user.role})</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full min-h-[46px] text-[14px] flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
                  >
                    <span>Launch Operations Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary w-full min-h-[44px] text-[14px] flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create customer account</span>
                  </Link>
                </>
              )}

              {/* Fast 1-click test hint */}
              <div className="pt-2 text-center">
                <span className="text-[12px] font-mono text-t2">
                  Admin, Manager &amp; Customer demo accounts available
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
