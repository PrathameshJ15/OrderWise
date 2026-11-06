const express = require('express');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const {
  handleOrderAssistantChat,
  getCustomerRecommendations,
  getCustomerOrderInsights,
  parseOrderPrompt,
} = require('../services/customerAiService');

const router = express.Router();

// Require authentication for all customer AI routes
router.use(auth);

// 1. POST /api/customer/ai/chat - Order Assistant Chat
router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(res, 'Message is required', 'VALIDATION_ERROR', {}, 400);
    }

    const userId = req.user.userId;
    const result = await handleOrderAssistantChat(userId, message.trim(), history);
    return successResponse(res, result);
  })
);

// 2. GET /api/customer/ai/recommendations - Personalized Product Recommendations
router.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await getCustomerRecommendations(userId);
    return successResponse(res, result);
  })
);

// 3. GET /api/customer/ai/orders/:orderId/insights - Explain Allocation & Shortages
router.get(
  '/orders/:orderId/insights',
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
      const insights = await getCustomerOrderInsights(orderId, userId);
      return successResponse(res, { insights });
    } catch (err) {
      return errorResponse(res, err.message, 'NOT_FOUND', {}, 404);
    }
  })
);

// 4. POST /api/customer/ai/parse-order-prompt - Natural language order draft builder
router.post(
  '/parse-order-prompt',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return errorResponse(res, 'Prompt text is required', 'VALIDATION_ERROR', {}, 400);
    }

    const result = await parseOrderPrompt(prompt.trim());
    return successResponse(res, result);
  })
);

module.exports = router;

