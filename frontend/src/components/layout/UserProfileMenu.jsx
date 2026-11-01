import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, LayoutDashboard, ChevronDown, ShieldCheck } from 'lucide-react';

export default function UserProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const role = (user?.role || 'user').toLowerCase();
  const roleLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'inventory_manager'
      ? 'Inventory Manager'
      : 'Customer';

  const roleBadgeStyle =
    role === 'admin'
      ? 'border-arcade-accent text-arcade-accent bg-arcade-accent/10'
      : role === 'inventory_manager'
      ? 'border-arcade-warning text-arcade-warning bg-arcade-warning/10'
      : 'border-arcade-info text-arcade-info bg-arcade-info/10';

  const dashboardPath = role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="relative font-mono" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 border border-arcade-border hover:border-arcade-accent bg-arcade-surface px-2.5 py-1.5 transition-colors text-left"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-6 h-6 border border-arcade-border bg-arcade-neutral flex items-center justify-center text-arcade-accent font-bold text-xs uppercase">
          {user?.name ? user.name.charAt(0) : <User className="h-3.5 w-3.5" />}
        </div>
        <div className="hidden sm:block text-xs leading-none">
          <div className="text-arcade-primary font-bold truncate max-w-[120px]">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-[10px] text-arcade-secondary capitalize mt-0.5">{roleLabel}</div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-arcade-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 border border-arcade-border bg-arcade-neutral shadow-2xl z-50 text-xs py-1">
          <div className="p-3 border-b border-arcade-border bg-arcade-surface/50">
            <div className="font-bold text-arcade-primary truncate">{user?.name || 'Account'}</div>
            <div className="text-[10px] text-arcade-secondary truncate mt-0.5">{user?.email}</div>
            <div className="mt-2">
              <span className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 border font-bold ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 text-arcade-secondary hover:text-arcade-primary hover:bg-arcade-surface transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-arcade-accent" />
              <span>Go to Hub</span>
            </Link>
          </div>

          <div className="border-t border-arcade-border pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-arcade-danger hover:bg-arcade-danger/10 transition-colors text-left font-bold"
            >
              <LogOut className="h-3.5 w-3.5 text-arcade-danger" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
