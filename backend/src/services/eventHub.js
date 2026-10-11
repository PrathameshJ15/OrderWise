const { query } = require('../config/db');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Event Types:
 * - 'allocation_completed': Broadcast to admins & affected customers
 * - 'order_status_changed': Sent to order owner & admins
 * - 'priority_approved': Sent to order owner & admins
 * - 'new_alert': Sent to admin & inventory_manager
 */

class EventNotificationHub {
  constructor() {
    // Array of active SSE client objects: { id, res, user: { userId, role, email } }
    this.clients = new Set();
    // In-memory fallback notifications for offline-DB resilience
    this.inMemoryNotifications = [
      {
        id: 1,
        user_id: 3, // Alice
        role: 'customer',
        event_type: 'order_status_changed',
        title: 'Order #101 Placed',
        message: 'Your order requesting 25x Pressure Gauge Pro has been recorded as pending.',
        data: { orderId: 101 },
        read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        user_id: 1, // Admin
        role: 'admin',
        event_type: 'new_alert',
        title: 'Shortage Warning',
        message: 'Pressure Gauge Pro available inventory is below reorder threshold.',
        data: { productId: 3 },
        read: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];
  }

  /**
   * Register a new SSE connection.
   */
  registerClient(user, res) {
    const client = {
      id: `${user.userId || user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user: {
        userId: Number(user.userId || user.id),
        role: user.role,
        email: user.email,
        name: user.name,
      },
      res,
    };

    this.clients.add(client);
    logger.info(`[SSE] Client connected: user=${client.user.userId} (${client.user.role}). Total active clients: ${this.clients.size}`);

    // Send initial handshake / ping event
    this._sendToRawClient(client, 'connected', {
      connected: true,
      user: client.user,
      timestamp: new Date().toISOString(),
    });

    // Cleanup on disconnect
    res.on('close', () => {
      this.clients.delete(client);
      logger.info(`[SSE] Client disconnected: user=${client.user.userId}. Total active clients: ${this.clients.size}`);
    });

    return client;
  }

  _sendToRawClient(client, eventName, payload) {
    try {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      logger.warn(`[SSE] Failed writing to client ${client.id}: ${err.message}`);
      this.clients.delete(client);
    }
  }

  /**
   * Dispatch an event to target recipients (role-scoped, customer-scoped).
   *
   * @param {Object} event
   * @param {string} event.type - 'allocation_completed' | 'order_status_changed' | 'priority_approved' | 'new_alert'
   * @param {string} event.title - Human readable title
   * @param {string} event.message - Description
   * @param {Object} [event.data] - Context data (order_id, run_id, customer_id, etc.)
   * @param {number|number[]} [event.targetCustomerIds] - Targeted customer ID(s)
   * @param {string[]} [event.targetRoles] - Target roles (e.g. ['admin', 'inventory_manager'])
   */
  async broadcastEvent({
    type,
    title,
    message,
    data = {},
    targetCustomerIds = null,
    targetRoles = ['admin'],
  }) {
    const normalizedCustomerIds = targetCustomerIds
      ? (Array.isArray(targetCustomerIds) ? targetCustomerIds : [targetCustomerIds]).map(Number)
      : [];

    const now = new Date().toISOString();

    // 1. Persist notification to DB or fallback memory
    await this._persistNotification({
      type,
      title,
      message,
      data,
      targetCustomerIds: normalizedCustomerIds,
      targetRoles,
      now,
    });

    // 2. Stream event to connected SSE clients matching role / customer scope
    let dispatchedCount = 0;
    for (const client of this.clients) {
      const isTargetRole = targetRoles.includes(client.user.role);
      const isTargetCustomer =
        client.user.role === 'customer' &&
        normalizedCustomerIds.includes(client.user.userId);

      // Strict role & customer scoping: Customer never receives another customer's events!
      if (isTargetRole || isTargetCustomer) {
        this._sendToRawClient(client, type, {
          event_type: type,
          title,
          message,
          data,
          timestamp: now,
        });
        dispatchedCount++;
      }
    }

    logger.info(`[SSE] Event dispatched: ${type} -> Delivered to ${dispatchedCount} active clients.`);

    // 3. Email stub notification log if target includes email
    if (data.customerEmail) {
      await emailService.sendEmail({
        to: data.customerEmail,
        subject: `[OrderWise Update] ${title}`,
        body: message,
        metadata: { type, ...data },
      });
    }
  }

  async _persistNotification({ type, title, message, data, targetCustomerIds, targetRoles, now }) {
    // Collect users to notify
    const recipientUserIds = new Set(targetCustomerIds);

    try {
      // Find admin/manager user IDs from DB if applicable
      if (targetRoles && targetRoles.length > 0) {
        const adminRes = await query(
          `SELECT id FROM users WHERE role = ANY($1) AND active = true;`,
          [targetRoles]
        );
        for (const row of adminRes.rows) {
          recipientUserIds.add(Number(row.id));
        }
      }

      // Insert DB records
      for (const uid of recipientUserIds) {
        await query(
          `INSERT INTO notifications (user_id, role, event_type, title, message, data, read, created_at)
           VALUES ($1, (SELECT role FROM users WHERE id = $1), $2, $3, $4, $5, false, NOW());`,
          [uid, type, title, message, JSON.stringify(data)]
        );
      }
    } catch {
      // DB offline fallback: write into inMemoryNotifications
      if (recipientUserIds.size === 0) {
        // Fallback for role-based admin
        this.inMemoryNotifications.unshift({
          id: this.inMemoryNotifications.length + 1,
          user_id: 1,
          role: 'admin',
          event_type: type,
          title,
          message,
          data,
          read: false,
          created_at: now,
        });
      } else {
        for (const uid of recipientUserIds) {
          this.inMemoryNotifications.unshift({
            id: this.inMemoryNotifications.length + 1,
            user_id: uid,
            role: uid === 1 ? 'admin' : 'customer',
            event_type: type,
            title,
            message,
            data,
            read: false,
            created_at: now,
          });
        }
      }
    }
  }

  /**
   * Fetch unread and recent notifications for a user.
   */
  async getUserNotifications(user) {
    const userId = Number(user.userId || user.id);
    try {
      const res = await query(
        `SELECT id, user_id, role, event_type, title, message, data, read, read_at, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50;`,
        [userId]
      );
      const notifications = res.rows;
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    } catch {
      // In-memory fallback
      const list = this.inMemoryNotifications.filter(
        (n) => n.user_id === userId || (user.role === 'admin' && n.role === 'admin')
      );
      const unreadCount = list.filter((n) => !n.read).length;
      return { notifications: list, unreadCount };
    }
  }

  /**
   * Mark notification(s) as read.
   */
  async markAsRead(notificationId, user) {
    const userId = Number(user.userId || user.id);
    try {
      if (notificationId === 'all') {
        await query(
          `UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false;`,
          [userId]
        );
      } else {
        await query(
          `UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 AND user_id = $2;`,
          [notificationId, userId]
        );
      }
      return true;
    } catch {
      // In-memory fallback
      if (notificationId === 'all') {
        this.inMemoryNotifications.forEach((n) => {
          if (n.user_id === userId || (user.role === 'admin' && n.role === 'admin')) {
            n.read = true;
          }
        });
      } else {
        const item = this.inMemoryNotifications.find((n) => n.id === Number(notificationId));
        if (item) item.read = true;
      }
      return true;
    }
  }
}

const eventHub = new EventNotificationHub();
module.exports = eventHub;
