const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

/**
 * Dedicated rate limiter for authentication endpoints (prevent brute-force).
 * 20 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
  },
});

/**
 * Dedicated rate limiter for AI LLM inference endpoints (prevent API cost/quota exhaustion).
 * 50 requests per 15 minutes per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI recommendation rate limit exceeded. Please try again in a few minutes.',
    },
  },
});

module.exports = {
  authLimiter,
  aiLimiter,
};

