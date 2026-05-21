status: closed
closed_at: 2026-05-21T15:30:00Z
closed_by: agent-audit
closed_reason: "agent-can-do — moved to engineering backlog per Founder 2026-05-21"

# App Audit Findings — UI/UX (A4)

**Authored:** 2026-05-20T23:55Z by Goal 2 audit.
**Dimension:** A4 — UI/UX weak points.
**Score:** 80 / 100 — Grade B+.
**Source:** `.claude/state/app-audit-2026-05-14/SUMMARY.md` (prior audit) + Goal 1 visual sweep.

## Headline

Composite of prior 2026-05-14 audit findings + Goal 1 dashboard work. Most CRITICAL/HIGH items from prior audit are CLOSED; remaining are deferred or stale-entries-already-fixed.

## Carried-over findings (prior audit)

### CRITICAL — 1 of 1 deferred to Founder

- **C1: Invite link auto-apply legacy invites** — code fix shipped; legacy invite links (pre-iter-16) drop new members into `the-parbaughs` regardless of inviter league. E2E signup verification deferred to Founder action.

### HIGH — 1 of 3 deferred

- **H3: Parbaugh Round joined players not appearing on scorecard** — deferred with rationale (per-player stats model is intentional; multi-player completed-scorecard view requires Stage 1 product design).

### MEDIUM — 2 of 4 open

- **M3: Courses button on season standings** — should navigate to 2026 courses with rounds. Diagnosed; not yet fixed.

### LOW / POLISH — known-acceptable

Several "stale bug entries" in CLAUDE.md known-bugs section that have been silently fixed but the log entry remains:
- L1: Sequoyah finalization bar tap — already has iOS tap CSS (line src/pages/scorecard.js:227+231)
- L2: Scorecard logo — already file-based (Logo.jpg)
- H2: 9-hole share scorecards — already handled (src/core/router.js:1109-1190 builds only nines with data)

These should be **removed from CLAUDE.md known-bugs** to avoid confusion. Audit substrate finding.

## Goal 1 dashboard-side UI improvements (this session)

The Goal 1 audit also redesigned three dashboard surfaces that the orchestration team uses for monitoring. These are NOT member-facing but informed the team's design discipline:

1. **Main Flows** → vertical expandable list (Sentry/Stripe pattern); was a Janowiak grid copy
2. **Dashboard tokens-this-week** → smooth area chart with value chips (Tufte data-ink)
3. **Random-refresh** → fixed (auto-reload disabled; click to refresh)

These don't affect A4 score directly but show the team's visual-quality bar.

## Scope-cut

A4 dimension **DOES NOT YET** include:
- Live Lighthouse scores per page (Phase 2; tool not wired)
- WCAG 2.1 AA audit (Phase 2; axe-core not wired)
- Manual click-through of each member-facing page (Phase 2; prior audit covered only dashboards, not src/pages/)
- Mobile-Safari behavior verification (Phase 2; Capacitor wrapper not exercised in agent context)

## Status

**YELLOW** — score 80 is okay but proxy-based. Real Lighthouse + WCAG scores will reset this dimension's score honestly in Phase 2.
