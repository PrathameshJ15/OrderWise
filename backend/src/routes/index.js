const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const priorityRoutes = require('./priorities');
const aiRoutes = require('./ai');
const allocationRoutes = require('./allocation');
const impactRoutes = require('./impact');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Auth & Access
router.use('/auth', authRoutes);

// Products
router.use('/products', productRoutes);

// Orders & Priorities
router.use('/orders', orderRoutes);
router.use('/priorities', priorityRoutes);

// AI Priority Assistant
router.use('/ai', aiRoutes);

// Allocation Engine
router.use('/allocation', allocationRoutes);

// Allocation Impact Analyzer
router.use('/impact', impactRoutes);

// Supply Intelligence: Alerts & Replenishment
const alertsRoutes = require('./alerts');
const replenishmentRoutes = require('./replenishment');
router.use('/alerts', alertsRoutes);
router.use('/replenishment', replenishmentRoutes);

// Real-Time Events & In-App Notifications (Phase 12)
const eventRoutes = require('./events');
router.use('/events', eventRoutes);

module.exports = router;
