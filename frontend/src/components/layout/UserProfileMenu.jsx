import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

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
      ? 'Inventory manager'
      : 'Customer';

  const roleBadgeStyle =
    role === 'admin'
      ? 'border-ac/30 text-white bg-ac/15'
      : role === 'inventory_manager'
      ? 'border-wa/30 text-wa bg-wa/15'
      : 'border-ok/30 text-ok bg-ok/15';

  const dashboardPath = role === 'customer' ? '/dashboard' : '/admin';

  return (
    <div className="relative font-sans" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2.5 rounded-pill border border-[#555] hover:border-white bg-s px-3 py-1.5 transition-colors text-left"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-6 h-6 rounded-full bg-ac flex items-center justify-center text-white font-bold text-xs uppercase">
          {user?.name ? user.name.charAt(0) : <User className="h-3.5 w-3.5" />}
        </div>
        <div className="hidden sm:block text-xs leading-none">
          <div className="text-white font-semibold truncate max-w-[120px]">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-[11px] font-mono text-t2 capitalize mt-0.5">{roleLabel}</div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-t2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-card border border-bd bg-s shadow-2xl z-50 text-xs py-2 overflow-hidden">
          <div className="p-4 border-b border-bd bg-s2/50">
            <div className="font-bold text-white text-[14px] truncate">{user?.name || 'Account'}</div>
            <div className="text-[12px] font-mono text-t2 truncate mt-0.5">{user?.email}</div>
            <div className="mt-2.5">
              <span className={`inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-pill border font-medium ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center space-x-2.5 px-4 py-2.5 text-t2 hover:text-white hover:bg-s2 transition-colors text-[13px]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Console dashboard</span>
            </Link>
          </div>

          <div className="pt-2 px-3 pb-2 border-t border-bd">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-pill border border-[#555] hover:border-white text-white text-[13px] font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
