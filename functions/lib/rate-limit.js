// In-memory rate limiter for Cloud Functions.
//
// Why custom (not firebase-functions-rate-limiter): the published package
// uses Firestore for state, which adds 1 read + 1 write per request — at
// PARBAUGHS scale (20 members) that's cost we can defer until we need
// cross-instance persistence. The in-memory version handles the realistic
// abuse vectors:
//   - Brute-forcing FOUNDING-FOUR or other invite codes (rate by IP)
//   - Repeated joinLeague spam by a logged-in user (rate by uid)
//   - Cost-amplification attacks against searchCourses (rate by IP)
//
// Gen1 Cloud Functions on a single container instance share memory; warm
// instances retain the bucket. Cold starts reset state (acceptable —
// attacker has to wait for cold-start and re-attack from same IP).
//
// Window: rolling 60s. Limits enforced per (key, bucket) pair.
// Keys are bucket-prefixed so the same IP can have separate counters
// per handler.
//
// Wired by: functions/index.js validateInvite + joinLeague + searchCourses.
// AMD-018 gate: this is code-only; deploy still requires Founder pre-auth.

const WINDOW_MS = 60 * 1000;

// Map<bucketKey, { count, windowStart }>
const buckets = new Map();

// Sweep expired entries every 5 min so the Map doesn't grow unbounded.
let lastSweep = Date.now();
function sweepIfDue() {
  const now = Date.now();
  if (now - lastSweep < 5 * 60 * 1000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

/**
 * Check whether a key has exceeded its rate limit.
 * @param {string} bucket - bucket name, e.g. "validateInvite", "joinLeague", "searchCourses"
 * @param {string} keyId - identifier (IP, uid, etc.)
 * @param {number} max - max requests per window
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function check(bucket, keyId, max) {
  sweepIfDue();
  const key = bucket + ':' + keyId;
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    buckets.set(key, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.windowStart + WINDOW_MS,
  };
}

/**
 * Extract a reasonable client IP from a Cloud Functions HTTP request.
 * `x-forwarded-for` is set by the Google front-end; fallback to req.ip.
 */
function clientIp(req) {
  const fwd = (req.headers && req.headers['x-forwarded-for']) || '';
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || 'unknown';
}

/**
 * Limits (per 60s window):
 *   validateInvite:  30 requests per IP (signup is occasional; this catches brute-force)
 *   joinLeague:      10 requests per uid (joining a league is a deliberate action)
 *   searchCourses:   60 requests per IP (typing-search debounce-able; cap cost)
 *   deleteMyAccount:  5 requests per uid (rare, deliberate; reauth already gates it)
 */
const LIMITS = {
  validateInvite: 30,
  joinLeague: 10,
  searchCourses: 60,
  deleteMyAccount: 5,
};

module.exports = { check, clientIp, LIMITS, WINDOW_MS };
