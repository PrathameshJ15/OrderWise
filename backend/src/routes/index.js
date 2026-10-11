const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
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

// Orders & Priorities
router.use('/orders', orderRoutes);
router.use('/priorities', priorityRoutes);

// AI Priority Assistant
router.use('/ai', aiRoutes);

// Allocation Engine
router.use('/allocation', allocationRoutes);

// Allocation Impact Analyzer
router.use('/impact', impactRoutes);

module.exports = router;
