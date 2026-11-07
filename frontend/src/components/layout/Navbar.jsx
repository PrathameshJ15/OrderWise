import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Navbar({ onOpenMobile = () => {} }) {
  const { user } = useAuth();
  const userRole = (user?.role || 'admin').toLowerCase();

  return (
    <header className="h-16 border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between font-sans transition-colors gap-2">
      {/* Left Navigation & Breadcrumbs */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-t transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Mobile/Tablet Brand Logo when Sidebar is collapsed */}
        <Link to="/admin" className="flex items-center space-x-2 shrink-0 lg:hidden">
          <img src="/logo-icon.png" alt="OrderWise" className="h-6 w-6 object-contain shrink-0" />
          <span className="font-display font-bold text-[16px] text-t tracking-tight hidden xs:inline whitespace-nowrap">
            Order<span className="text-ac">Wise</span>
          </span>
        </Link>

        {/* Portal Role Badge */}
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-sans font-medium rounded-pill whitespace-nowrap shrink-0 ${
            userRole === 'inventory_manager'
              ? 'bg-wa/15 text-wa border border-wa/30'
              : 'bg-ac/10 text-ac border border-ac/20'
          }`}
        >
          {userRole === 'inventory_manager' ? 'Manager portal' : 'Admin console'}
        </span>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden md:block min-w-0 overflow-hidden">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right Controls: Guaranteed zero overlap and responsive scaling */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        <LanguageSwitcher variant="compact" />
        <ThemeToggle variant="segmented" className="hidden xl:inline-flex shrink-0" />
        <ThemeToggle variant="button" className="xl:hidden shrink-0" />
        <NotificationBell />
        <UserProfileMenu />
      </div>
    </header>
  );
}
