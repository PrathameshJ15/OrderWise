const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const intelligenceService = require('../services/intelligenceService');
const allocationEngine = require('../services/allocationEngine');
const demoStore = require('../services/demoStore');

const router = express.Router();

// Role guards: Admin and Inventory Manager access
router.use(authenticate);
router.use(authorize('admin', 'inventory_manager'));

/**
 * GET /api/intelligence/forecast
 * Algorithmic demand forecasting using SES and SMA with 95% confidence bands.
 * Explicitly marked as [EXPERIMENTAL_ESTIMATE].
 */
router.get(
  '/forecast',
  asyncHandler(async (req, res) => {
    const rawProductId = req.query.product_id || req.query.productId;
    const productId = rawProductId ? Number(rawProductId) : null;
    const rawAlpha = req.query.alpha ? Number(req.query.alpha) : 0.3;
    const alpha = Number.isFinite(rawAlpha) && rawAlpha > 0 && rawAlpha <= 1 ? rawAlpha : 0.3;

    const data = await intelligenceService.getDemandForecasts({ productId, alpha });
    return successResponse(res, data, 'Demand forecasts calculated (Experimental estimate)');
  })
);

/**
 * GET /api/intelligence/fairness
 * Service metrics by priority tier, on-time delivery, and anti-starvation customer fairness monitor.
 * Proposes aging priority elevating action (requires human approval).
 */
router.get(
  '/fairness',
  asyncHandler(async (req, res) => {
    const data = await intelligenceService.getFairnessAndServiceMetrics();
    return successResponse(res, data, 'Fairness and service metrics evaluated');
  })
);

/**
 * GET /api/intelligence/explain/:runId
 * Explainability upgrade: Synthesizes a natural language executive summary for an allocation run.
 */
router.get(
  '/explain/:runId',
  asyncHandler(async (req, res) => {
    const runId = req.params.runId;
    let runData;

    try {
      runData = await allocationEngine.getAllocationRunById(runId);
    } catch (_err) {
      runData = demoStore.getRunDetails(runId);
    }

    if (!runData || !runData.run) {
      return errorResponse(res, `Allocation run #${runId} not found for explainability synthesis`, 'NOT_FOUND', 404);
    }

    const explanation = intelligenceService.generateRunExplanation(runData.run, runData.results || []);
    return successResponse(res, explanation, 'Run explanation synthesized successfully');
  })
);

/**
 * GET /api/intelligence/warehouses
 * Multi-warehouse topology, distributed inventory balances, and proximity routing overview.
 */
router.get(
  '/warehouses',
  asyncHandler(async (req, res) => {
    const data = intelligenceService.getMultiWarehouseOverview();
    return successResponse(res, data, 'Multi-warehouse overview retrieved');
  })
);

module.exports = router;

