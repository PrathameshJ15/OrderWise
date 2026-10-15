/**
 * Structured console logger for OrderWise backend with OWASP-compliant sensitive data masking.
 * Never logs passwords, JWT tokens, API keys, or authorization secrets.
 */

const SENSITIVE_KEY_PATTERN = /^(password|password_hash|passwordhash|token|jwt|refreshtoken|refresh_token|secret|jwt_secret|groq_api_key|api_key|apikey|authorization|cookie|credit_card|creditcard|card_number|cvv)$/i;

function sanitizeValue(key, val) {
  if (val === null || val === undefined) return val;

  const keyStr = String(key || '').trim();
  if (SENSITIVE_KEY_PATTERN.test(keyStr) || /password|secret|authorization|token/i.test(keyStr)) {
    return '[REDACTED]';
  }

  if (typeof val === 'string') {
    // Redact JWT patterns (three base64 segments) or Bearer tokens
    if (/^Bearer\s+[A-Za-z0-9-_.]+/i.test(val)) {
      return 'Bearer [REDACTED_TOKEN]';
    }
    if (/^[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}$/.test(val)) {
      return '[REDACTED_JWT]';
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item, idx) => sanitizeValue(idx, item));
  }

  if (typeof val === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = sanitizeValue(k, v);
    }
    return cleaned;
  }

  return val;
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  return sanitizeValue('meta', meta);
}

const logger = {
  sanitizeValue,
  sanitizeMeta,
  info: (msg, meta = {}) => {
    const safeMeta = sanitizeMeta(meta);
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, Object.keys(safeMeta || {}).length ? safeMeta : '');
  },
  warn: (msg, meta = {}) => {
    const safeMeta = sanitizeMeta(meta);
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, Object.keys(safeMeta || {}).length ? safeMeta : '');
  },
  error: (msg, meta = {}) => {
    const safeMeta = sanitizeMeta(meta);
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, Object.keys(safeMeta || {}).length ? safeMeta : '');
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const safeMeta = sanitizeMeta(meta);
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, Object.keys(safeMeta || {}).length ? safeMeta : '');
    }
  },
};

module.exports = logger;
