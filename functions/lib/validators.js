// Zod input schemas for Cloud Function HTTP/callable handlers.
//
// Why zod (Goal 2 A7 Architecture +12): the existing handlers do ad-hoc
// validation (typeof checks, manual length limits). Centralizing schemas
// gives us:
//   - One place to reason about every accepted input shape
//   - Consistent error responses for invalid requests
//   - Defense-in-depth alongside firestore.rules
//
// Each exported schema maps to one Cloud Function handler in functions/index.js.
// Handlers call .safeParse(data) and short-circuit with a 400 (HTTP) or
// HttpsError('invalid-argument', ...) (callable) on failure.
//
// AMD-018 note: this file is code-only. firebase deploy is still gated.
// Validators run at function invocation; no deploy needed for these to take
// effect in the emulator (smoke + e2e). Production behavior unchanged until
// `firebase deploy --only functions` is approved.

const { z } = require('zod');

// Invite codes: 4-32 chars, alphanumeric + dash + underscore + dot.
// Includes FOUNDING-FOUR (uppercase + dash). Server uppercases before checking.
const inviteCodeSchema = z.string()
  .min(4, 'Invite code too short')
  .max(32, 'Invite code too long')
  .regex(/^[A-Za-z0-9._-]+$/, 'Invite code has invalid characters');

// League IDs: Firestore doc IDs. Conservative: 1-100 chars, no slashes or dots.
// (Firestore allows up to 1500 bytes but realistic IDs are short slugs.)
const leagueIdSchema = z.string()
  .min(1, 'leagueId required')
  .max(100, 'leagueId too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'leagueId has invalid characters');

// Emails: RFC-lite. Trim + lowercase happens on the consumer side.
const emailSchema = z.string()
  .min(3)
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email format invalid');

// Course search query: 1-100 chars, no control chars or HTML angle brackets.
const courseQuerySchema = z.string()
  .min(1, 'Query required')
  .max(100, 'Query too long')
  .regex(/^[^<>\x00-\x1f]+$/, 'Query has invalid characters');

// GolfCourseAPI key: opaque alphanumeric token. 16-64 chars per their docs.
const apiKeySchema = z.string()
  .min(16, 'API key too short')
  .max(128, 'API key too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'API key has invalid characters');

// =============================================================================
// Handler-level schemas
// =============================================================================

// POST /validateInvite — body shape
const validateInviteRequestSchema = z.object({
  code: inviteCodeSchema,
  email: emailSchema.optional(),
});

// joinLeague (callable) — data shape
const joinLeagueRequestSchema = z.object({
  leagueId: leagueIdSchema,
  inviteCode: inviteCodeSchema,
});

// GET /searchCourses?q=...&key=...
const searchCoursesQuerySchema = z.object({
  q: courseQuerySchema,
  // v8.24.42 — key is optional: the handler falls back to the server-held
  // GOLFCOURSE_API_KEY env var so members don't need personal API keys
  // (course auto-create). Code-only until the gated deploy (AMD-018 gate 1).
  key: apiKeySchema.optional(),
});

// ParCoin Stage 2 — grantCoins (server-authoritative earn). reason is an
// allow-list of WIRED single-uid earns; sourceId names the authoritative doc
// the server re-derives the award from (round id, session id, achievement id,
// course id, or a YYYY-MM-DD date for daily_login). NEVER an amount.
const grantReasonSchema = z.enum([
  'round_complete', 'round_attested_bonus', 'personal_best_18h', 'personal_best_9h',
  'range_session', 'achievement', 'daily_login', 'scorecard_contribution', 'scorecard_verify',
]);
const sourceIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_:\-]+$/, 'sourceId has invalid characters');
const grantCoinsRequestSchema = z.object({
  reason: grantReasonSchema,
  sourceId: sourceIdSchema,
});
// settleWager / claimBounty — the cross-uid internal transfers. The server
// re-resolves from the wager/bounty doc + the canonical rounds; the caller
// only names which contest to settle.
const settleWagerRequestSchema = z.object({ wagerId: sourceIdSchema });
const claimBountyRequestSchema = z.object({ bountyId: sourceIdSchema });

module.exports = {
  // raw schemas (in case downstream wants to compose)
  inviteCodeSchema,
  leagueIdSchema,
  emailSchema,
  courseQuerySchema,
  apiKeySchema,
  // handler-level schemas
  validateInviteRequestSchema,
  joinLeagueRequestSchema,
  searchCoursesQuerySchema,
  grantCoinsRequestSchema,
  settleWagerRequestSchema,
  claimBountyRequestSchema,
};
