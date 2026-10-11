import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestLiveEvent, setLatestLiveEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // Fetch persisted notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/events/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors on polling
    }
  }, [token]);

  // Mark one or all as read
  const markAsRead = async (id = 'all') => {
    try {
      await apiClient.patch('/events/notifications/read', { id });
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Local optimistic update
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  // Setup Server-Sent Events stream
  useEffect(() => {
    if (!user || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
      return;
    }

    fetchNotifications();

    // Check if EventSource exists in global environment (e.g. browser vs test)
    if (typeof EventSource === 'undefined') {
      return;
    }

    // In modern browsers, EventSource does not support custom headers,
    // so we pass the token in query parameter (?token=...)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    const sseUrl = `${baseUrl}/events?token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.onerror = () => {
        setConnected(false);
      };

      const handleIncomingEvent = (e) => {
        try {
          const payload = JSON.parse(e.data);
          setLatestLiveEvent({
            type: e.type,
            ...payload,
            receivedAt: new Date().toISOString(),
          });

          // Add to in-app notification list
          setNotifications((prev) => [
            {
              id: Date.now(),
              title: payload.title || 'System Update',
              message: payload.message || '',
              event_type: e.type,
              data: payload.data || {},
              read: false,
              created_at: payload.timestamp || new Date().toISOString(),
            },
            ...prev,
          ]);
          setUnreadCount((prev) => prev + 1);
        } catch {
          // parsing error
        }
      };

      // Attach listeners for all 4 key real-time event types
      es.addEventListener('allocation_completed', handleIncomingEvent);
      es.addEventListener('order_status_changed', handleIncomingEvent);
      es.addEventListener('priority_approved', handleIncomingEvent);
      es.addEventListener('new_alert', handleIncomingEvent);

      return () => {
        es.close();
        eventSourceRef.current = null;
        setConnected(false);
      };
    } catch {
      // EventSource initialization error fallback
    }
  }, [user, token, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        latestLiveEvent,
        connected,
        markAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return safe fallback values if component is rendered outside provider (e.g., in unit tests)
    return {
      notifications: [],
      unreadCount: 0,
      latestLiveEvent: null,
      connected: false,
      markAsRead: async () => {},
      fetchNotifications: async () => {},
    };
  }
  return context;
}
