const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const inventoryRoutes = require('./inventory');
const orderRoutes = require('./orders');

const allocationRoutes = require('./allocation');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Core Authentication & RBAC
router.use('/auth', authRoutes);

// Core Business APIs
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);

// Allocation Engine
router.use('/allocation', allocationRoutes);

// Placeholder routes for subsequent phases can be mounted here
// router.use('/priorities', priorityRoutes);
// router.use('/ai', aiRoutes);
// router.use('/simulations', simulationRoutes);
// router.use('/alerts', alertRoutes);
// router.use('/replenishment', replenishmentRoutes);
// router.use('/reports', reportRoutes);

module.exports = router;
