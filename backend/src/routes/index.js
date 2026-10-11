const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const inventoryRoutes = require('./inventory');
const orderRoutes = require('./orders');
const priorityRoutes = require('./priorities');
const aiRoutes = require('./ai');
const allocationRoutes = require('./allocation');
const impactRoutes = require('./impact');

const router = express.Router();

// Health check
router.use('/health', healthRoutes);

// Core Authentication & RBAC
router.use('/auth', authRoutes);

// Core Business APIs
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);

// Priorities & AI Priority Assistant
router.use('/priorities', priorityRoutes);
router.use('/ai', aiRoutes);

// Allocation Engine
router.use('/allocation', allocationRoutes);

// Allocation Impact Analyzer
router.use('/impact', impactRoutes);

module.exports = router;
