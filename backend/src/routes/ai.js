const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const {
  fetchOrderContext,
  generatePriorityRecommendation,
} = require('../services/aiService');

const router = express.Router();

// GET /api/ai/recommendations - List recommendations with order details
router.use(auth);
router.use(rbac('admin'));

router.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const { status, order_id } = req.query;

    let sql = `
      SELECT r.id, r.order_id, r.suggested_priority, r.suggested_rank,
             r.confidence, r.explanation, r.evidence, r.warning,
             r.provider, r.model, r.prompt_version, r.status, r.created_at,
             o.promised_delivery_date, o.business_notes, o.status as order_status,
             u.name as customer_name, u.email as customer_email,
             op.approved_priority as current_order_priority
      FROM ai_recommendations r
      JOIN orders o ON o.id = r.order_id
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    if (order_id) {
      params.push(order_id);
      sql += ` AND r.order_id = $${params.length}`;
    }

    sql += ` ORDER BY r.created_at DESC`;

    try {
      const result = await query(sql, params);
      return successResponse(res, { recommendations: result.rows });
    } catch (_err) {
      return successResponse(res, { recommendations: [] });
    }
  })
);

// GET /api/ai/recommendations/:id
router.get(
  '/recommendations/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, o.promised_delivery_date, o.business_notes,
              u.name as customer_name, u.email as customer_email
       FROM ai_recommendations r
       JOIN orders o ON o.id = r.order_id
       JOIN users u ON u.id = o.customer_id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Recommendation not found', 'NOT_FOUND', {}, 404);
    }

    return successResponse(res, { recommendation: result.rows[0] });
  })
);

// POST /api/ai/recommend/:orderId - Generate new AI recommendation
router.post(
  '/recommend/:orderId',
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { additional_context } = req.body || {};

    // 1. Fetch full order context
    let orderContext;
    try {
      orderContext = await fetchOrderContext(orderId);
    } catch (err) {
      return errorResponse(res, err.message, 'NOT_FOUND', {}, 404);
    }

    // Append additional context to notes if provided by admin
    if (additional_context) {
      orderContext.business_notes = orderContext.business_notes
        ? `${orderContext.business_notes}\n[Admin note: ${additional_context}]`
        : `[Admin note: ${additional_context}]`;
    }

    // 2. Generate recommendation (Groq with retry or fallback)
    const rec = await generatePriorityRecommendation(orderContext);

    // 3. Store recommendation in database with status 'pending'
    // Guard: AI output never touches inventory or allocation results!
    const insertRes = await query(
      `INSERT INTO ai_recommendations (
        order_id, suggested_priority, suggested_rank, confidence,
        explanation, evidence, warning, provider, model, prompt_version, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *`,
      [
        orderId,
        rec.suggested_priority,
        rec.suggested_rank,
        rec.confidence,
        rec.explanation,
        rec.evidence,
        rec.warning,
        rec.provider,
        rec.model,
        rec.prompt_version,
      ]
    );

    const savedRec = insertRes.rows[0];

    return successResponse(res, {
      recommendation: {
        id: parseInt(savedRec.id, 10),
        order_id: parseInt(savedRec.order_id, 10),
        suggested_priority: savedRec.suggested_priority,
        suggested_rank: savedRec.suggested_rank,
        confidence: savedRec.confidence,
        explanation: savedRec.explanation,
        evidence: savedRec.evidence,
        warning: savedRec.warning,
        provider: savedRec.provider,
        model: savedRec.model,
        prompt_version: savedRec.prompt_version,
        recommendation_status: savedRec.status,
        status: savedRec.status,
        created_at: savedRec.created_at,
      },
    });
  })
);

module.exports = router;
