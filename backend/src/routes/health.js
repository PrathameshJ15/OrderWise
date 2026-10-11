const express = require('express');
const { checkDbHealth } = require('../config/db');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');
const { env } = require('../config/env');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const dbStatus = await checkDbHealth();

    const healthData = {
      status: dbStatus.connected ? 'healthy' : 'degraded',
      service: 'orderwise-backend',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      database: dbStatus,
    };

    return successResponse(res, healthData);
  })
);

module.exports = router;
