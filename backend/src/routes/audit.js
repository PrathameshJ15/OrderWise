const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const { query } = require('../config/db');
const demoStore = require('../services/demoStore');

const router = express.Router();

/**
 * All audit endpoints require authentication and 'admin' role.
 * Read-only through the API (GET only, no mutation routes).
 */
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/audit
 * Retrieve audit log events with filter support (user, action, date range).
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { action, user, actor_id, start_date, end_date, limit = 100, page = 1 } = req.query;

    try {
      let sql = `
        SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id,
               a.before_state, a.after_state, a.ip_address, a.user_agent, a.created_at,
               u.name as actor_name, u.email as actor_email, u.role as actor_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.actor_id
        WHERE 1=1
      `;
      const params = [];

      if (action && action !== 'all') {
        params.push(action);
        sql += ` AND a.action = $${params.length}`;
      }

      if (actor_id) {
        params.push(actor_id);
        sql += ` AND a.actor_id = $${params.length}`;
      }

      if (user) {
        params.push(`%${user}%`);
        sql += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
      }

      if (start_date) {
        params.push(start_date);
        sql += ` AND a.created_at >= $${params.length}`;
      }

      if (end_date) {
        params.push(end_date);
        sql += ` AND a.created_at <= $${params.length}`;
      }

      sql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
      const offset = (Number(page) - 1) * Number(limit);
      params.push(Number(limit), offset);

      const dbRes = await query(sql, params);
      const logs = dbRes.rows.map((r) => ({
        ...r,
        details: r.after_state
          ? typeof r.after_state === 'object'
            ? JSON.stringify(r.after_state)
            : r.after_state
          : `${r.action} performed on ${r.entity_type} #${r.entity_id || ''}`,
      }));

      return successResponse(res, {
        logs,
        pagination: { page: Number(page), limit: Number(limit), total: logs.length },
      });
    } catch {
      // Offline DB fallback using demoStore
      const logs = demoStore.getAuditLogs({ action, user, actor_id });
      return successResponse(res, {
        logs,
        pagination: { page: 1, limit: logs.length, total: logs.length },
      });
    }
  })
);

module.exports = router;
