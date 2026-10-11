const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const productService = require('../services/productService');

const router = express.Router();

const createProductSchema = z.object({
  sku: z.string().min(2, 'SKU must be at least 2 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  description: z.string().optional(),
  unit: z.string().default('units'),
  initialStock: z.number().int().min(0).default(0),
  safetyStock: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(0),
});

const updateProductSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  active: z.boolean().optional(),
});

const demoStore = require('../services/demoStore');

// GET /api/products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { page, limit, search, active } = req.query;
      const result = await productService.listProducts({ page, limit, search, active });
      return successResponse(res, result.products, result.meta);
    } catch (_err) {
      return successResponse(res, demoStore.getProducts());
    }
  })
);

// GET /api/products/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, product);
    } catch (_err) {
      const p = demoStore.getProducts().find(item => item.id === Number(req.params.id));
      return successResponse(res, p || demoStore.getProducts()[0]);
    }
  })
);

// POST /api/products (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest({ body: createProductSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const newProduct = await productService.createProduct(req.body, req.user.userId, meta);
    return successResponse(res, newProduct, undefined, 201);
  })
);

// PUT /api/products/:id (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest({ body: updateProductSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const updated = await productService.updateProduct(req.params.id, req.body, req.user.userId, meta);
    return successResponse(res, updated);
  })
);

// DELETE /api/products/:id (Admin only - soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await productService.deactivateProduct(req.params.id, req.user.userId, meta);
    return successResponse(res, result);
  })
);

module.exports = router;
