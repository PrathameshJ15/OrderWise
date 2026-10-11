const express = require('express');
const { query, pool } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const { PRIORITY_RANKS } = require('../services/aiService');

const router = express.Router();

// Apply auth to all priority routes
router.use(auth);

// GET /api/priorities/:orderId - Admin only: get current priority & approval history
router.get(
  '/:orderId',
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const priorityRes = await query(
      `SELECT op.*, u.name as approved_by_name, u.email as approved_by_email
       FROM order_priorities op
       LEFT JOIN users u ON u.id = op.approved_by
       WHERE op.order_id = $1`,
      [orderId]
    );

    const historyRes = await query(
      `SELECT pa.*, u.name as reviewer_name, u.email as reviewer_email
       FROM priority_approvals pa
       JOIN users u ON u.id = pa.reviewed_by
       WHERE pa.order_id = $1
       ORDER BY pa.created_at DESC`,
      [orderId]
    );

    if (priorityRes.rowCount === 0) {
      return errorResponse(res, 'Order priority not found', 'NOT_FOUND', {}, 404);
    }

    const current = priorityRes.rows[0];
    return successResponse(res, {
      order_id: parseInt(current.order_id, 10),
      approved_priority: current.approved_priority,
      priority_rank: current.priority_rank,
      notes: current.notes,
      approved_at: current.approved_at,
      approved_by: current.approved_by
        ? { id: parseInt(current.approved_by, 10), name: current.approved_by_name }
        : null,
      history: historyRes.rows,
    });
  })
);

// POST /api/priorities/approve - Admin only: approve, modify (overridden), or reject recommendation
router.post(
  '/approve',
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const {
      recommendation_id,
      order_id: directOrderId,
      decision, // 'approved' | 'overridden' | 'rejected'
      final_priority: requestedFinalPriority,
      reason,
      override_reason,
    } = req.body;

    const normalizedDecision = (decision || '').toLowerCase().trim();
    if (!['approved', 'overridden', 'rejected'].includes(normalizedDecision)) {
      return errorResponse(
        res,
        "Invalid decision. Must be 'approved', 'overridden', or 'rejected'.",
        'VALIDATION_ERROR',
        {},
        400
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let orderId = directOrderId;
      let recommendation = null;

      if (recommendation_id) {
        const recRes = await client.query(
          'SELECT * FROM ai_recommendations WHERE id = $1 FOR UPDATE',
          [recommendation_id]
        );
        if (recRes.rowCount === 0) {
          await client.query('ROLLBACK');
          return errorResponse(res, 'AI recommendation not found.', 'NOT_FOUND', {}, 404);
        }
        recommendation = recRes.rows[0];
        orderId = recommendation.order_id;
      }

      if (!orderId) {
        await client.query('ROLLBACK');
        return errorResponse(res, 'Either recommendation_id or order_id must be provided.', 'VALIDATION_ERROR', {}, 400);
      }

      // Fetch current authoritative priority before modification
      const currentPriorityRes = await client.query(
        'SELECT * FROM order_priorities WHERE order_id = $1 FOR UPDATE',
        [orderId]
      );

      const beforeState = currentPriorityRes.rows[0] || null;

      // Determine final priority & rank based on decision
      let effectivePriority;
      let effectiveRank;
      const rationale = override_reason || reason || '';

      if (normalizedDecision === 'approved') {
        if (recommendation) {
          effectivePriority = recommendation.suggested_priority;
          effectiveRank = recommendation.suggested_rank;
        } else if (requestedFinalPriority) {
          effectivePriority = requestedFinalPriority.toUpperCase();
          effectiveRank = PRIORITY_RANKS[effectivePriority];
        } else {
          effectivePriority = beforeState ? beforeState.approved_priority : 'MEDIUM';
          effectiveRank = PRIORITY_RANKS[effectivePriority] || 2;
        }
      } else if (normalizedDecision === 'overridden') {
        if (!requestedFinalPriority || !PRIORITY_RANKS[requestedFinalPriority.toUpperCase()]) {
          await client.query('ROLLBACK');
          return errorResponse(
            res,
            'A valid final_priority (CRITICAL, HIGH, MEDIUM, LOW) is required when overriding.',
            'VALIDATION_ERROR',
            {},
            400
          );
        }
        effectivePriority = requestedFinalPriority.toUpperCase();
        effectiveRank = PRIORITY_RANKS[effectivePriority];
      } else {
        // 'rejected'
        // When rejected, authoritative priority remains what it was before!
        effectivePriority = beforeState ? beforeState.approved_priority : (recommendation ? recommendation.suggested_priority : 'MEDIUM');
        effectiveRank = beforeState ? beforeState.priority_rank : (PRIORITY_RANKS[effectivePriority] || 2);
      }

      // Update recommendation status if recommendation_id is present
      if (recommendation) {
        await client.query(
          `UPDATE ai_recommendations
           SET status = $1
           WHERE id = $2`,
          [normalizedDecision, recommendation.id]
        );
      }

      // Insert into priority_approvals log
      const approvalRes = await client.query(
        `INSERT INTO priority_approvals (
          order_id, recommendation_id, decision, final_priority, final_rank,
          override_reason, reviewed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          orderId,
          recommendation ? recommendation.id : null,
          normalizedDecision,
          effectivePriority,
          effectiveRank,
          rationale,
          req.user.userId,
        ]
      );
      const approvalRecord = approvalRes.rows[0];

      let updatedOrderPriority = beforeState;

      // ONLY APPROVED or OVERRIDDEN (MODIFIED) updates authoritative priority!
      // If REJECTED, order_priorities remains untouched.
      if (normalizedDecision === 'approved' || normalizedDecision === 'overridden') {
        const upsertRes = await client.query(
          `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes, approved_by, approved_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (order_id)
           DO UPDATE SET
             approved_priority = EXCLUDED.approved_priority,
             priority_rank = EXCLUDED.priority_rank,
             notes = EXCLUDED.notes,
             approved_by = EXCLUDED.approved_by,
             approved_at = NOW(),
             updated_at = NOW()
           RETURNING *`,
          [orderId, effectivePriority, effectiveRank, rationale, req.user.userId]
        );
        updatedOrderPriority = upsertRes.rows[0];
      }

      // Log in audit_logs table
      const actionType =
        normalizedDecision === 'approved'
          ? 'PRIORITY_APPROVED'
          : normalizedDecision === 'overridden'
          ? 'PRIORITY_OVERRIDDEN'
          : 'PRIORITY_REJECTED';

      await client.query(
        `INSERT INTO audit_logs (
          actor_id, action, entity_type, entity_id, before_state, after_state,
          ip_address, user_agent
        ) VALUES ($1, $2, 'orders', $3, $4, $5, $6, $7)`,
        [
          req.user.userId,
          actionType,
          orderId,
          beforeState ? JSON.stringify(beforeState) : null,
          JSON.stringify({
            decision: normalizedDecision,
            effectivePriority,
            effectiveRank,
            rationale,
            order_priority: updatedOrderPriority,
          }),
          req.ip || null,
          req.get('user-agent') || null,
        ]
      );

      await client.query('COMMIT');

      // Phase 12: Real-time broadcast of priority approval
      try {
        const eventHub = require('../services/eventHub');
        const orderRes = await pool.query('SELECT customer_id FROM orders WHERE id = $1', [orderId]);
        const customerId = orderRes.rows[0]?.customer_id || null;
        eventHub.broadcastEvent({
          type: 'priority_approved',
          title: `Priority Approved: Order #${orderId}`,
          message: `Priority level for Order #${orderId} set to ${effectivePriority || 'UPDATED'} (${normalizedDecision}).`,
          data: {
            orderId: Number(orderId),
            decision: normalizedDecision,
            effectivePriority,
          },
          targetCustomerIds: customerId ? [customerId] : [],
          targetRoles: ['admin', 'inventory_manager'],
        }).catch(() => {});
      } catch {
        // Safe ignore
      }

      return successResponse(res, {
        approval: {
          id: parseInt(approvalRecord.id, 10),
          order_id: parseInt(orderId, 10),
          recommendation_id: approvalRecord.recommendation_id
            ? parseInt(approvalRecord.recommendation_id, 10)
            : null,
          decision: approvalRecord.decision,
          final_priority: approvalRecord.final_priority,
          final_rank: approvalRecord.final_rank,
          override_reason: approvalRecord.override_reason,
          reviewed_by: parseInt(approvalRecord.reviewed_by, 10),
          created_at: approvalRecord.created_at,
        },
        order_priority: updatedOrderPriority
          ? {
              order_id: parseInt(updatedOrderPriority.order_id, 10),
              approved_priority: updatedOrderPriority.approved_priority,
              priority_rank: updatedOrderPriority.priority_rank,
              notes: updatedOrderPriority.notes,
              approved_at: updatedOrderPriority.approved_at,
            }
          : null,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
