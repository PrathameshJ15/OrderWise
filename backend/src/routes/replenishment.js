const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { getReplenishmentRecommendations } = require('../services/replenishmentService');

const router = express.Router();

/**
 * GET /api/replenishment
 * Retrieves replenishment calculations and reorder advice across active products.
 * Roles: admin, inventory_manager
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const recommendations = await getReplenishmentRecommendations();

    res.json({
      success: true,
      data: {
        recommendations,
      },
      meta: {
        total: recommendations.length,
        reorder_recommended_count: recommendations.filter((r) => r.flag === 'REORDER_RECOMMENDED').length,
      },
    });
  })
);

/**
 * GET /api/replenishment/:productId
 * Retrieves replenishment advice for a specific product.
 * Roles: admin, inventory_manager
 */
router.get(
  '/:productId',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const productId = req.params.productId;
    const recommendations = await getReplenishmentRecommendations(productId);

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Product #${productId} not found or inactive.`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        recommendation: recommendations[0],
      },
    });
  })
);

module.exports = router;
