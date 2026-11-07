import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation, LANGUAGES } from '../../contexts/I18nContext';
import { User, LogOut, LayoutDashboard, ChevronDown, Settings, Moon, Sun, Globe, Volume2, Shield } from 'lucide-react';
import Modal from '../ui/Modal';

export default function UserProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
      ? 'border-ac/30 text-ac bg-ac/10'
      : role === 'inventory_manager'
      ? 'border-wa/30 text-wa bg-wa/15'
      : 'border-ok/30 text-ok bg-ok/15';

  const dashboardPath = role === 'customer' ? '/dashboard' : '/admin';

  return (
    <>
      <div className="relative font-sans shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center space-x-2 rounded-pill border border-bd hover:border-t bg-s px-2.5 py-1.5 transition-colors text-left cursor-pointer shrink-0 whitespace-nowrap min-h-[36px]"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div className="w-6 h-6 rounded-full bg-ac flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
            {user?.name ? user.name.charAt(0) : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="hidden xl:block text-xs leading-none">
            <div className="text-t font-semibold truncate max-w-[110px]">
              {user?.name || user?.email?.split('@')?.[0] || 'User'}
            </div>
            <div className="text-[11px] font-mono text-t2 capitalize mt-0.5">{roleLabel}</div>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-t2 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-60 rounded-card border border-bd bg-s shadow-2xl z-50 text-xs py-2 overflow-hidden">
            <div className="p-4 border-b border-bd bg-s2/50">
              <div className="font-bold text-t text-[14px] truncate">{user?.name || 'Account'}</div>
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
                className="flex items-center space-x-2.5 px-4 py-2 text-t2 hover:text-t hover:bg-s2 transition-colors text-[13px]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Console dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSettingsOpen(true);
                }}
                className="w-full flex items-center space-x-2.5 px-4 py-2 text-t2 hover:text-t hover:bg-s2 transition-colors text-[13px] text-left cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Preferences &amp; Settings</span>
              </button>
            </div>

            <div className="pt-2 px-3 pb-2 border-t border-bd">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-pill border border-bd hover:border-t text-t text-[13px] font-medium transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences & Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Preferences & Settings"
      >
        <div className="space-y-5 text-sm font-sans pt-1">
          {/* Appearance */}
          <div>
            <label className="text-[13px] font-semibold text-t flex items-center space-x-2 mb-2">
              <Sun className="h-4 w-4 text-ac" />
              <span>Theme Appearance</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-[12px] border transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-ac bg-ac/10 text-ac font-semibold'
                    : 'border-bd bg-s2 text-t2 hover:text-t'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark Industrial</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-[12px] border transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'border-ac bg-ac/10 text-ac font-semibold'
                    : 'border-bd bg-s2 text-t2 hover:text-t'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light Contrast</span>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="text-[13px] font-semibold text-t flex items-center space-x-2 mb-2">
              <Globe className="h-4 w-4 text-ac" />
              <span>Display Language</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded-[12px] border text-[13px] transition-colors cursor-pointer ${
                    language === lang.code
                      ? 'border-ac bg-ac/10 text-ac font-bold'
                      : 'border-bd bg-s2 text-t2 hover:text-t'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound / Alerts */}
          <div>
            <label className="text-[13px] font-semibold text-t flex items-center space-x-2 mb-2">
              <Volume2 className="h-4 w-4 text-ac" />
              <span>Alert Notifications</span>
            </label>
            <div className="flex items-center justify-between p-3 rounded-[12px] border border-bd bg-s2">
              <div>
                <div className="font-medium text-t text-[13px]">Sound Chimes</div>
                <div className="text-[12px] text-t2">Play subtle notification tone on critical shortage alerts</div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-ac cursor-pointer"
              />
            </div>
          </div>

          {/* Security & Isolation Status */}
          <div className="p-3.5 rounded-[12px] border border-bd bg-s2/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-ok text-[13px] font-semibold">
              <Shield className="h-4 w-4" />
              <span>Deterministic RBAC Protection</span>
            </div>
            <div className="text-[12px] text-t2 font-mono">
              Signed in as <span className="text-t font-semibold">{user?.email}</span> ({roleLabel}). Read/write permissions validated server-side on every request.
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="btn-primary px-5 py-2 text-[13px]"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
