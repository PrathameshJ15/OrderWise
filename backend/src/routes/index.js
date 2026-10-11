const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Customer & Core routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

// Placeholder routes for subsequent phases can be mounted here
// router.use('/inventory', inventoryRoutes);
// router.use('/priorities', priorityRoutes);
// router.use('/allocation', allocationRoutes);
// router.use('/ai', aiRoutes);
// router.use('/simulations', simulationRoutes);
// router.use('/alerts', alertRoutes);
// router.use('/replenishment', replenishmentRoutes);
// router.use('/reports', reportRoutes);

module.exports = router;
