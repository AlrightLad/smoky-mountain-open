// Scenario registry. Order is execution order.
// S11 (logout cleanup) MUST be last — subsequent scenarios would fail
// because the smoke account is logged out after S11 runs.

module.exports = [
  require('./s1-auth.js'),
  require('./s2-listener.js'),
  require('./s3-panel-render.js'),
  require('./s4-v6-nav-fix.js'),
  require('./s5-legacy-linkpage.js'),
  require('./s6-params-forwarding.js'),
  require('./s7-readat.js'),
  require('./s8-scrollback.js'),
  require('./s9-mark-read-promotion.js'),
  require('./s10-dismiss-delete.js'),
  require('./s12-spectator-nonregression.js'),
  // v8.20.0 (Ship 5+5) — engagement architecture surface coverage. P3 process
  // correction: smoke MUST validate user-visible surfaces, not just code paths.
  require('./s13-feed-action-row.js'),
  require('./s14-feed-kudos-persistence.js'),
  require('./s15-feed-comment-persistence.js'),
  require('./s16-hq-home-action-row.js'),
  require('./s17-hq-home-state-activity-clickable.js'),
  // v8.21.0 (Ship 5+6 Phase 7) — surface coverage for HQ Home polish + the
  // S1.2 surgical-engagement architecture. P8 process correction (locked
  // alongside the v8.21.0 kudos heart regression diagnosis): visual-layer
  // assertions on engagement surfaces, not just data writes.
  require('./s18-hq-greeting-hero.js'),
  require('./s19-hq-stats-strip-alignment.js'),
  require('./s20-hq-stats-last-30d.js'),
  require('./s21-masthead-league-chip.js'),
  require('./s22-hq-handicap-chart.js'),
  require('./s23-hq-engagement-no-rerender.js'),
  // v8.22.0 (Ship 5+7) — Rounds page consolidation + Manage section.
  // S24 covers list/dispatch surface; S25 covers Manage section visibility
  // tiers (author + spectator). P8 visual assertions on both.
  require('./s24-rounds-page-dispatch.js'),
  require('./s25-manage-section-tiers.js'),
  // v8.22.0 (Ship 5+7) — automated E2E replacing the manual 4-step
  // walkthrough. B.44 timestamp + edit + delete + non-author rejection.
  require('./s26-rounds-ship-5-7-e2e.js'),
  // v8.24.31 — 2026-06-10 marathon feature assertions (pbConfirm/confetti/
  // tee-intro-dark/invite-floor/toast-delegation/theme-flip).
  require('./s27-marathon-2026-06-10-features.js'),
  require('./s28-growth-trilogy.js'),
  require('./s29-rivalry-route.js'),
  require('./s30-xss-escaping.js'),
  // v8.25.0 — onboarding walkthrough (FTUE): 5-beat spine + demo-hole win + teardown.
  require('./s31-onboarding-walkthrough.js'),
  // v8.25.5 — P0 regression guard: rounds dedup (the duplicate-rounds 7-0 fix).
  require('./s32-rounds-dedup.js'),
  require('./s11-logout-cleanup.js')
];
