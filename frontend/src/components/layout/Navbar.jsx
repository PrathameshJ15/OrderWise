import React from 'react';
import { Menu } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from '../ui/NotificationBell';
import UserProfileMenu from './UserProfileMenu';

export default function Navbar({ onOpenMobile = () => {} }) {
  return (
    <header className="h-16 border-b border-arcade-border bg-arcade-neutral/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between font-mono">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 border border-arcade-border text-arcade-secondary hover:text-arcade-primary hover:border-arcade-accent"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center space-x-3">
        <NotificationBell />
        <UserProfileMenu />
      </div>
    </header>
  );
}
