/**
 * metrics.js — In-process metrics store for OrderWise.
 *
 * Tracks:
 *  - allocation_runs_total        : total number of allocation runs executed
 *  - allocation_duration_ms[]     : rolling window of last 1000 run durations (for p50/p95/p99)
 *  - http_requests_total          : total HTTP requests handled
 *  - http_request_duration_ms[]   : rolling window of last 5000 request durations
 *  - http_errors_total            : total 5xx responses
 *
 * All data is in-memory — resets on server restart.
 * For production: swap to Prometheus / OpenTelemetry.
 */

const ALLOC_WINDOW = 1000;
const HTTP_WINDOW  = 5000;

const store = {
  startedAt: Date.now(),

  // Allocation
  allocation_runs_total: 0,
  allocation_duration_ms: [],   // ring buffer, newest last

  // HTTP
  http_requests_total: 0,
  http_request_duration_ms: [], // ring buffer, newest last
  http_errors_total: 0,
};

/** Push a value into a capped ring buffer. */
function pushRing(arr, value, cap) {
  arr.push(value);
  if (arr.length > cap) arr.shift();
}

/** Compute a percentile (0-100) from a sorted copy of values. */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Record a completed allocation run.
 * @param {number} durationMs
 */
function recordAllocationRun(durationMs) {
  store.allocation_runs_total += 1;
  pushRing(store.allocation_duration_ms, durationMs, ALLOC_WINDOW);
}

/**
 * Record a completed HTTP request.
 * @param {number} durationMs
 * @param {number} statusCode
 */
function recordHttpRequest(durationMs, statusCode) {
  store.http_requests_total += 1;
  pushRing(store.http_request_duration_ms, durationMs, HTTP_WINDOW);
  if (statusCode >= 500) store.http_errors_total += 1;
}

/**
 * Return a snapshot of all metrics, including computed percentiles.
 */
function getMetrics() {
  const allocDurations = store.allocation_duration_ms;
  const httpDurations  = store.http_request_duration_ms;

  return {
    uptime_seconds: Math.floor((Date.now() - store.startedAt) / 1000),
    allocation: {
      runs_total: store.allocation_runs_total,
      sample_size: allocDurations.length,
      p50_ms: percentile(allocDurations, 50),
      p95_ms: percentile(allocDurations, 95),
      p99_ms: percentile(allocDurations, 99),
      min_ms: allocDurations.length ? Math.min(...allocDurations) : 0,
      max_ms: allocDurations.length ? Math.max(...allocDurations) : 0,
    },
    http: {
      requests_total: store.http_requests_total,
      errors_total:   store.http_errors_total,
      sample_size:    httpDurations.length,
      p50_ms:  percentile(httpDurations, 50),
      p95_ms:  percentile(httpDurations, 95),
      p99_ms:  percentile(httpDurations, 99),
      min_ms:  httpDurations.length ? Math.min(...httpDurations) : 0,
      max_ms:  httpDurations.length ? Math.max(...httpDurations) : 0,
    },
  };
}

module.exports = { recordAllocationRun, recordHttpRequest, getMetrics };
