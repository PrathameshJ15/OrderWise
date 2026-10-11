/**
 * health.js — GET /api/health (shallow) and GET /api/health/deep
 *
 * Shallow:  fast ping, always returns 200 (used by load balancers).
 * Deep:     checks DB connectivity + Groq AI reachability + in-process metrics.
 *           Returns 200 when healthy, 503 when any critical dependency is down.
 */

const express = require('express');
const { checkDbHealth } = require('../config/db');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');
const { env } = require('../config/env');
const { getMetrics } = require('../utils/metrics');

const router = express.Router();

// ── Shallow health ───────────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const dbStatus = await checkDbHealth();
    return successResponse(res, {
      status: dbStatus.connected ? 'healthy' : 'degraded',
      service: 'orderwise-backend',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      database: dbStatus,
    });
  })
);

// ── Deep health ──────────────────────────────────────────────────────────────
router.get(
  '/deep',
  asyncHandler(async (req, res) => {
    const checks = {};
    let overallHealthy = true;

    // 1. Database
    try {
      const dbStatus = await checkDbHealth();
      checks.database = {
        status: dbStatus.connected ? 'up' : 'down',
        latency_ms: dbStatus.latency_ms ?? null,
      };
      if (!dbStatus.connected) overallHealthy = false;
    } catch (err) {
      checks.database = { status: 'down', error: err.message };
      overallHealthy = false;
    }

    // 2. AI (Groq) — just probe the base URL with a HEAD request (no tokens consumed)
    try {
      const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
      if (groqKey && groqKey !== 'your_groq_api_key_here') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
          const resp = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${groqKey}` },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          checks.ai_groq = { status: resp.ok ? 'up' : 'degraded', http_status: resp.status };
        } catch (fetchErr) {
          clearTimeout(timeout);
          checks.ai_groq = { status: 'down', error: fetchErr.message };
          // AI being down is degraded but not critical — don't flip overallHealthy
        }
      } else {
        checks.ai_groq = { status: 'unconfigured', note: 'GROQ_API_KEY not set; rule-based fallback active' };
      }
    } catch (err) {
      checks.ai_groq = { status: 'error', error: err.message };
    }

    // 3. In-process metrics snapshot
    const metrics = getMetrics();
    checks.metrics = {
      uptime_seconds: metrics.uptime_seconds,
      allocation_runs_total: metrics.allocation.runs_total,
      allocation_p95_ms: metrics.allocation.p95_ms,
      http_requests_total: metrics.http.requests_total,
      http_p95_ms: metrics.http.p95_ms,
      http_errors_total: metrics.http.errors_total,
    };

    const httpStatus = overallHealthy ? 200 : 503;
    return res.status(httpStatus).json({
      success: overallHealthy,
      data: {
        status: overallHealthy ? 'healthy' : 'degraded',
        service: 'orderwise-backend',
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        checks,
      },
    });
  })
);

module.exports = router;
