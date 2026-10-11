const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const simulationService = require('../services/simulationService');

const router = express.Router();

// All simulation routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

const scenarioTypeEnum = z.enum([
  'inventory_increase',
  'inventory_decrease',
  'demand_surge',
  'supplier_delay',
  'priority_change',
  'chained',
]);

const singleStepSchema = z.object({
  type: z.enum([
    'inventory_increase',
    'inventory_decrease',
    'demand_surge',
    'supplier_delay',
    'priority_change',
  ]),
  product_id: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  surge_percent: z.coerce.number().positive().optional(),
  surgePercent: z.coerce.number().positive().optional(),
  delay_days: z.coerce.number().int().positive().optional(),
  delayDays: z.coerce.number().int().positive().optional(),
  order_id: z.coerce.number().int().positive().optional(),
  orderId: z.coerce.number().int().positive().optional(),
  hypothetical_priority: z.enum(['critical', 'high', 'medium', 'low', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  hypotheticalPriority: z.enum(['critical', 'high', 'medium', 'low', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
});

const runSimulationSchema = z.object({
  scenario_type: scenarioTypeEnum.optional(),
  scenarioType: scenarioTypeEnum.optional(),
  scenario_inputs: z.record(z.any()).optional(),
  scenarioInputs: z.record(z.any()).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  save_record: z.boolean().default(true).optional(),
  saveRecord: z.boolean().default(true).optional(),
  // For chaining:
  steps: z.array(singleStepSchema).optional(),
});

const compareSimulationsSchema = z.object({
  simulation_ids: z.array(z.coerce.number().int().positive()).min(2, 'At least 2 simulation IDs are required'),
});

// POST /api/simulations (Run simulation)
router.post(
  '/',
  validateRequest({ body: runSimulationSchema }),
  asyncHandler(async (req, res) => {
    let type = req.body.scenario_type || req.body.scenarioType || 'inventory_increase';
    let inputs = req.body.scenario_inputs || req.body.scenarioInputs || {};

    // If steps array is provided at root, treat as chained
    if (req.body.steps && Array.isArray(req.body.steps)) {
      type = 'chained';
      inputs = { steps: req.body.steps };
    }

    const name = req.body.name || null;
    const description = req.body.description || null;
    const save = req.body.save_record ?? req.body.saveRecord ?? true;

    const result = await simulationService.runSimulation({
      scenarioType: type,
      scenarioInputs: inputs,
      userId: req.user.userId,
      name,
      description,
      saveRecord: save,
    });

    return successResponse(res, result, undefined, 200);
  })
);

// GET /api/simulations (List past simulations)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    const data = await simulationService.getSimulations({ page, limit });
    return successResponse(res, data.simulations, { pagination: data.pagination });
  })
);

// POST /api/simulations/compare (Compare multiple simulations)
router.post(
  '/compare',
  validateRequest({ body: compareSimulationsSchema }),
  asyncHandler(async (req, res) => {
    const comparison = await simulationService.compareSimulations(req.body.simulation_ids);
    return successResponse(res, comparison);
  })
);

// GET /api/simulations/:id (Get specific simulation)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const simulation = await simulationService.getSimulationById(req.params.id);
    return successResponse(res, simulation);
  })
);

module.exports = router;
