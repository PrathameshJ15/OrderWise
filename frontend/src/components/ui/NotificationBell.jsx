import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Radio, Sparkles, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, connected } = useNotifications();
  const dropdownRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEventBadge = (type) => {
    switch (type) {
      case 'allocation_completed':
        return {
          label: 'ALLOCATION',
          style: 'border-arcade-accent text-arcade-accent bg-arcade-accent/10',
        };
      case 'order_status_changed':
        return {
          label: 'ORDER',
          style: 'border-arcade-info text-arcade-info bg-arcade-info/10',
        };
      case 'priority_approved':
        return {
          label: 'PRIORITY',
          style: 'border-arcade-warning text-arcade-warning bg-arcade-warning/10',
        };
      case 'new_alert':
        return {
          label: 'ALERT',
          style: 'border-arcade-danger text-arcade-danger bg-arcade-danger/10',
        };
      default:
        return {
          label: 'SYSTEM',
          style: 'border-arcade-border text-arcade-secondary bg-arcade-surface',
        };
    }
  };

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Live Activity"
        className="relative p-1.5 border border-arcade-border bg-arcade-surface hover:border-arcade-accent text-arcade-primary transition-colors flex items-center justify-center"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-arcade-accent text-arcade-surface font-black text-[10px] px-1 py-0.2 shadow-[0_0_8px_rgba(200,255,58,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-arcade-neutral border border-arcade-border shadow-2xl z-50 text-arcade-primary">
          {/* Header */}
          <div className="p-3 border-b border-arcade-border flex items-center justify-between bg-arcade-surface">
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-sm uppercase tracking-wider text-arcade-primary">
                Activity Feed
              </span>
              <span
                className={`flex items-center space-x-1 text-[9px] px-1.5 py-0.5 border ${
                  connected
                    ? 'border-arcade-accent/30 text-arcade-accent bg-arcade-accent/10'
                    : 'border-arcade-border text-arcade-secondary bg-arcade-surface'
                }`}
              >
                <Radio className={`h-2.5 w-2.5 ${connected ? 'animate-pulse' : ''}`} />
                <span>{connected ? 'LIVE STREAM' : 'OFFLINE'}</span>
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAsRead('all')}
                className="text-[10px] text-arcade-accent hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-arcade-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-arcade-secondary">
                <Sparkles className="h-6 w-6 text-arcade-border mx-auto mb-2 opacity-50" />
                <span>No notifications yet. Live updates will stream here automatically.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const badge = getEventBadge(n.event_type);
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-3 transition-colors cursor-pointer ${
                      n.read
                        ? 'bg-arcade-neutral/40 opacity-75 hover:bg-arcade-neutral'
                        : 'bg-arcade-surface/90 hover:bg-arcade-surface border-l-2 border-arcade-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1 py-0.2 border font-bold ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-arcade-secondary flex items-center space-x-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {n.created_at
                            ? new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-arcade-primary mb-0.5">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-arcade-secondary leading-snug">
                      {n.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-arcade-border text-center bg-arcade-surface">
            <span className="text-[9px] text-arcade-secondary uppercase tracking-widest">
              Server-Sent Events Stream • Deterministic Updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
