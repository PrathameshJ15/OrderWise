import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  Bot,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import Breadcrumbs from './Breadcrumbs';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import AnimatedRedWaves from '../ui/AnimatedRedWaves';

export function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { name: 'Dashboard', shortName: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true, key: 'dashboard' },
    { name: 'Product Catalog', shortName: 'Catalog', to: '/products', icon: Package, key: 'catalog' },
    { name: 'Create Order', shortName: 'New Order', to: '/orders/new', icon: PlusCircle, key: 'create_order' },
    { name: 'My Orders', shortName: 'Orders', to: '/orders', icon: ClipboardList, key: 'my_orders' },
    { name: 'AI Assistant', shortName: 'AI Assistant', to: '/assistant', icon: Bot, key: 'ai_assistant', isAi: true },
  ];

  return (
    <div className="min-h-screen bg-bg text-t flex flex-col font-sans selection:bg-ac selection:text-white relative transition-colors">
      {/* Subtle signature animated red wave background */}
      <AnimatedRedWaves variant="corner" className="fixed" />

      {/* Subtle ambient lighting */}
      <div
        className="fixed top-0 right-0 w-[650px] h-[500px] pointer-events-none rounded-full blur-[90px] z-0"
        style={{
          background: 'radial-gradient(ellipse at 85% 5%, rgba(198, 40, 40, 0.12), transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Top Customer Navigation Header */}
      <header className="border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-30 relative transition-colors">
        <div className="max-w-container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            {/* Logo: Guaranteed no squish or overlap */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <Link to="/dashboard" className="flex items-center space-x-2 shrink-0">
                <img src="/logo-icon.png" alt="OrderWise" className="h-7 w-7 object-contain shrink-0" />
                <span className="font-display font-bold text-[18px] text-t tracking-tight whitespace-nowrap">
                  Order<span className="text-ac">Wise</span>
                </span>
              </Link>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-sans font-medium rounded-pill bg-ac/10 text-ac border border-ac/20 whitespace-nowrap shrink-0">
                Customer portal
              </span>
            </div>

            {/* Desktop Navigation Links: Wide screens (>= xl / 1280px) display full pills */}
            <nav className="hidden xl:flex items-center space-x-1.5 shrink-0" aria-label="Customer Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const label = t(`nav.${item.key}`, item.name);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-1.5 rounded-pill text-[13.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-ac text-white font-semibold shadow-xs'
                          : item.isAi
                          ? 'text-ac border border-ac/30 bg-ac/5 hover:bg-ac/15 font-semibold'
                          : 'text-t2 hover:text-t hover:bg-s2'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Laptop Navigation Links: (lg to xl / 1024px to 1279px) high-density compact pills */}
            <nav className="hidden lg:flex xl:hidden items-center space-x-1 shrink-0" aria-label="Customer Compact Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const label = t(`nav.${item.key}`, item.shortName);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    title={item.name}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-pill text-[12.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-ac text-white font-semibold shadow-xs'
                          : item.isAi
                          ? 'text-ac border border-ac/30 bg-ac/5 hover:bg-ac/15 font-semibold'
                          : 'text-t2 hover:text-t hover:bg-s2'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[110px]">{label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Controls: Guaranteed zero overlap and responsive scaling */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
              {/* Quick AI Assistant shortcut on tablet & mobile */}
              <NavLink
                to="/assistant"
                title="AI Assistant"
                className={({ isActive }) =>
                  `lg:hidden p-2 rounded-full border transition-colors shrink-0 ${
                    isActive
                      ? 'bg-ac text-white border-ac'
                      : 'border-ac/30 bg-ac/10 text-ac hover:bg-ac/20'
                  }`
                }
              >
                <Bot className="h-4 w-4" />
              </NavLink>

              <LanguageSwitcher variant="compact" />
              <ThemeToggle variant="segmented" className="hidden xl:inline-flex shrink-0" />
              <ThemeToggle variant="button" className="xl:hidden shrink-0" />
              <NotificationBell />
              <UserProfileMenu />

              {/* Mobile/Tablet Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-t transition-colors cursor-pointer shrink-0"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-bd bg-s px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-xl">
            <div className="pt-1 pb-2 border-b border-bd/40 flex items-center justify-between">
              <span className="text-[12px] font-sans text-t2">Language</span>
              <LanguageSwitcher variant="compact" />
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const label = t(`nav.${item.key}`, item.name);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-pill text-[14px] font-medium transition-colors active:scale-[0.99] ${
                      isActive
                        ? 'bg-ac text-white font-semibold'
                        : item.isAi
                        ? 'text-ac border border-ac/30 bg-ac/5 hover:bg-ac/15 font-semibold'
                        : 'text-t2 hover:text-t hover:bg-s2'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Breadcrumbs Sub-strip */}
      <div className="border-b border-bd/60 bg-s2/20 py-2.5 px-4 sm:px-8 relative z-10">
        <div className="max-w-container mx-auto">
          <Breadcrumbs />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-container w-full mx-auto px-4 sm:px-8 py-6 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-bd bg-s py-6 px-4 sm:px-8 mt-12 text-[13px] text-t2 font-sans relative z-10 transition-colors">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-t font-medium">OrderWise</span> — Deterministic inventory allocation and supply intelligence
          </div>
          <div className="text-t2 text-[12px]">
            All rights reserved • Customer Console
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
