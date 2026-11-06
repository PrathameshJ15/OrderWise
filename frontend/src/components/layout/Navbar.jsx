import React from 'react';
import { Menu } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Navbar({ onOpenMobile = () => {} }) {
  return (
    <header className="h-16 border-b border-bd bg-s/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between font-sans transition-colors">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-t transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <img src="/logo-icon.png" alt="OrderWise" className="h-6 w-auto object-contain lg:hidden" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center space-x-3">
        <LanguageSwitcher variant="compact" className="hidden sm:inline-block" />
        <ThemeToggle variant="segmented" className="hidden sm:inline-flex" />
        <ThemeToggle variant="button" className="sm:hidden" />
        <NotificationBell />
        <UserProfileMenu />
      </div>
    </header>
  );
}
