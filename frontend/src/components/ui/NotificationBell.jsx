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
          style: 'border-ok/30 text-ok bg-ok/10',
        };
      case 'order_status_changed':
        return {
          label: 'ORDER',
          style: 'border-bd text-t bg-s2',
        };
      case 'priority_approved':
        return {
          label: 'PRIORITY',
          style: 'border-wa/30 text-wa bg-wa/10',
        };
      case 'new_alert':
        return {
          label: 'ALERT',
          style: 'border-no/30 text-no bg-no/10',
        };
      default:
        return {
          label: 'SYSTEM',
          style: 'border-bd text-t2 bg-s2',
        };
    }
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Live Activity"
        className="relative p-2 rounded-full border border-bd bg-s hover:border-t text-t2 hover:text-t transition-colors flex items-center justify-center cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-ac text-white font-mono font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 max-h-[80vh] flex flex-col bg-s border border-bd rounded-card shadow-2xl z-50 text-t overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-bd flex items-center justify-between bg-s2/40">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[15px] text-t">
                Activity Feed
              </span>
              <span
                className={`flex items-center space-x-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-pill border ${
                  connected
                    ? 'border-ok/30 text-ok bg-ok/10'
                    : 'border-bd text-t2 bg-s2'
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
                className="text-[12px] font-mono text-t hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-bd/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-t2">
                <Sparkles className="h-6 w-6 text-t2/50 mx-auto mb-2 opacity-50" />
                <span>No notifications yet. Live updates will stream here automatically.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const badge = getEventBadge(n.event_type);
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      n.read
                        ? 'bg-s opacity-75 hover:bg-s2'
                        : 'bg-s2/80 hover:bg-s2 border-l-2 border-ac'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wide px-2 py-0.5 rounded-pill border ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-t2 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
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

                    <div className="text-[14px] font-semibold text-t mb-0.5">
                      {n.title}
                    </div>
                    <div className="text-[12px] text-t2 leading-relaxed">
                      {n.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-bd text-center bg-s2/30">
            <span className="text-[11px] font-mono text-t2">
              Server-Sent Events Stream • Deterministic Updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
