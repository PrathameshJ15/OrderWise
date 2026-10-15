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

// Products & Inventory
router.use('/products', productRoutes);
const inventoryRoutes = require('./inventory');
router.use('/inventory', inventoryRoutes);

// Orders & Priorities
router.use('/orders', orderRoutes);
router.use('/priorities', priorityRoutes);

// Simulation Lab
const simulationRoutes = require('./simulations');
router.use('/simulations', simulationRoutes);

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

// Reports, Exports and Audit Viewer (Phase 13)
const reportRoutes = require('./reports');
const auditRoutes = require('./audit');
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);

// Advanced Intelligence (Phase 18 Stretch)
const intelligenceRoutes = require('./intelligence');
router.use('/intelligence', intelligenceRoutes);

module.exports = router;
