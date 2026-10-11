/**
 * logger.js — Structured JSON logger for OrderWise backend.
 *
 * Emits one JSON line per log call — easy to ingest by log aggregators
 * (Datadog, Loki, CloudWatch, etc.).
 *
 * Each log line shape:
 * {
 *   "ts":      "2025-10-11T14:00:00.000Z",  // ISO-8601 timestamp
 *   "level":   "info",                        // debug | info | warn | error
 *   "msg":     "Allocation run completed",    // human-readable message
 *   "reqId":   "a1b2c3...",                   // X-Request-Id when available
 *   "svc":     "orderwise-backend",           // service name
 *   ...meta                                   // any extra key/values spread in
 * }
 *
 * In test mode we suppress output unless LOG_LEVEL=debug is set explicitly.
 */

const SERVICE = 'orderwise-backend';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function activeLevel() {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] !== undefined ? raw : 'info';
}

function shouldLog(level) {
  // In test env, suppress unless LOG_LEVEL=debug
  if (process.env.NODE_ENV === 'test' && process.env.LOG_LEVEL !== 'debug') return false;
  return LEVELS[level] >= LEVELS[activeLevel()];
}

function emit(level, msg, meta = {}) {
  if (!shouldLog(level)) return;

  const { reqId, ...rest } = meta;
  const line = {
    ts: new Date().toISOString(),
    level,
    svc: SERVICE,
    ...(reqId ? { reqId } : {}),
    msg,
    ...rest,
  };

  const out = JSON.stringify(line);

  switch (level) {
    case 'error': process.stderr.write(out + '\n'); break;
    case 'warn':  process.stderr.write(out + '\n'); break;
    default:      process.stdout.write(out + '\n');
  }
}

const logger = {
  debug: (msg, meta = {}) => emit('debug', msg, meta),
  info:  (msg, meta = {}) => emit('info',  msg, meta),
  warn:  (msg, meta = {}) => emit('warn',  msg, meta),
  error: (msg, meta = {}) => emit('error', msg, meta),

  /**
   * Returns a child logger that automatically injects reqId into every call.
   * Usage: const log = logger.child(req.id);
   */
  child(reqId) {
    return {
      debug: (msg, meta = {}) => emit('debug', msg, { reqId, ...meta }),
      info:  (msg, meta = {}) => emit('info',  msg, { reqId, ...meta }),
      warn:  (msg, meta = {}) => emit('warn',  msg, { reqId, ...meta }),
      error: (msg, meta = {}) => emit('error', msg, { reqId, ...meta }),
    };
  },
};

module.exports = logger;
