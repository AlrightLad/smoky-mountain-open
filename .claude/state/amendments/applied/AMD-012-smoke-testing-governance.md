---
id: AMD-012
title: Smoke-testing governance (binding Critic gate across all Wave 1+ user-facing ships)
target_canonical_path: docs/agents/SMOKE_TESTING_GOVERNANCE.md
source_draft_path: .claude/state/amendments/pending/AMD-012-smoke-testing-governance.md
scope_summary: Codifies smoke testing as governance, not per-ship negotiation. Every user-facing ship in Wave 1+ MUST author smoke-test coverage as part of definition-of-done; Critic blocks "ship complete" determination without it. Builds on the v8.17.0 Playwright + real-Firebase framework rather than parallel infrastructure. Exceptions require explicit Founder waiver documented in the ship plan as a known risk.
type: new-file
section_anchor: null
depends_on: ["AMD-009"]
authored_by: claude-code (orchestration team)
authored_at: 2026-05-14T04:25:00Z
bubble_of_record: null
estimate_tokens_to_apply: 4500
rollback_strategy: git revert; the document is new. Implementation impact is policy-only — existing smoke framework continues to function regardless of this amendment's state.
status: pending
operating_status: ADVISORY — operates as guidance until Founder applies via amendments.html. AMD-009 Principle 4 (test before declaring done) already implies smoke testing for user-facing ships; this amendment codifies the specific coverage standard + Critic-gate teeth.
---

# Smoke-Testing Governance

## Founder principle (recorded verbatim)

> "Smoke testing is governance, not per-ship negotiation. Codify what
> smoke testing means for Wave 1 features so it's binding across all
> ships."

## Definition

**Smoke testing** = automated cross-browser scenarios that verify a
user-facing feature works end-to-end from a member's perspective.
For Wave 1 (HQ web; later Wave 3 mobile via Capacitor), this means
Playwright scenarios at minimum, running against real Firebase via
the v8.17.0 smoke-test-league fixture.

Smoke ≠ unit test. Unit tests verify code units; smoke tests verify
shipped features from a user's perspective. Both have a place; this
governance covers smoke only.

## When required

Every ship that touches user-facing surface MUST author smoke-test
coverage as part of the ship's definition-of-done. "User-facing
surface" means:

- HQ web pages (`src/pages/`)
- Clubhouse mobile screens (future, post-Capacitor)
- Member-visible workflows that span multiple screens
- Member-visible features that span backend + frontend (e.g., wager
  resolution, push notification delivery, etc.)

Ships that ONLY touch infrastructure DO NOT require smoke tests
unless they directly affect user-facing behavior:

- Cron / watcher / maintenance scripts → not required
- Governance docs / amendments → not required
- Telemetry / aggregators → not required UNLESS they emit data
  consumed by user-facing surfaces
- Internal dashboards (`docs/reports/*.html`) → not required (team-
  facing, not member-facing)
- Build pipeline + tooling → not required

The boundary is **member visibility**. If a member can perceive
the change (via the app, app behavior, or a notification), smoke is
required. If only the orchestration team perceives the change, smoke
is optional.

## Coverage standard

For each new user-facing feature, the smoke test must cover all 6:

- [ ] **Happy path** — feature works as designed for typical use
- [ ] **At least one edge case** — empty state, error state, OR
      permission-restricted state. Choice depends on what's most
      load-bearing for the feature.
- [ ] **Mobile viewport (375px width)** — feature renders + functions
- [ ] **Desktop viewport (1280px width)** — feature renders + functions
- [ ] **One additional browser beyond Chromium** — Firefox OR WebKit.
      Choose based on what platforms members actually use; default
      WebKit for mobile parity, Firefox for desktop-skewed features.
- [ ] **Real data round-trip** — test reads + writes against the
      Firebase smoke-test-league fixture from v8.17.0 infrastructure.
      Mocks are NOT acceptable — they hide rule/migration drift
      (lesson from prior burn cited in CLAUDE.md testing principles).

The 6 are minimums. Additional scenarios are encouraged for high-
complexity features (e.g., multi-actor workflows benefit from a second
edge case, multi-screen flows benefit from cross-screen navigation
assertion).

## Timing (binding per AMD-009 Principle 4)

Smoke tests are authored **AS PART OF** the ship, NOT as a follow-up.
A ship without smoke tests is NOT shipped per AMD-009 Principle 4
"Test before declaring done."

**Exception:** smoke tests CAN be authored in a paired ship that lands
immediately after the feature ship IF the team explicitly justifies
why splitting is needed AND Founder approves the split. Examples that
might justify a split (rare):
- Smoke fixture requires data-population infrastructure that itself
  needs Founder approval first
- Test framework gap requires extension that's wider than the feature
  ship's scope

The split exception requires:
- Ship plan explicitly states "smoke tests deferred to ship X+1"
- Paired ship X+1 has the smoke tests as ITS primary deliverable
- Ship X is labeled "feature shipped but smoke-gated" in Founder
  Review Queue until the paired ship lands
- If ship X+1 doesn't land within 1 ship-cycle, ship X is auto-
  rolled-back per AMD-009 P7 (acknowledge what breaks)

Default posture: smoke is in-ship, not paired. Split is rare.

## Critic gating

Critic BLOCKS "ship complete" determination if any of:

- [ ] User-facing ship lacks smoke tests (no `tests/smoke/scenarios/
      sNN-*.js` file authored as part of the ship)
- [ ] Smoke test coverage misses required scenarios (6 minimums
      enumerated above)
- [ ] Smoke tests fail when run
- [ ] Smoke tests are authored but NOT RUN before the ship-close
      commit (the run output must be evidence-captured in the
      commit message or linked report)

Critic's authority derives from AMD-009 Principle 8 (Critic
empowerment). Only Founder can override Critic, and override is
explicit + documented in the ship plan as a known risk.

## Framework (building on existing)

v8.17.0 added cross-browser smoke automation: 12 scenarios × 4 browsers
via Playwright + real Firebase. The framework lives at:

- `tests/smoke/scenarios/sNN-feature.js` — per-feature scenario files
- `tests/smoke/run.js` — orchestrator
- `tests/smoke/setup/` — fixture seeders (smoke-test-league)
- `tests/smoke/helpers/` — auth, navigation, capture
- `tests/smoke/output/` — results + screenshots

Wave 1+ smoke tests EXTEND this framework. The team does NOT build
parallel smoke infrastructure. New scenarios follow the existing
`sNN-feature.js` shape and integrate with `run.js`.

If a Wave 1 feature requires capability the existing framework
doesn't yet have (e.g., mobile-viewport simulation, push-
notification verification, image-attachment assertion), the team
EXTENDS the framework as part of the feature ship — that's an
in-scope addition, not a separate infrastructure ship.

## Exceptions process

A ship can waive smoke-test requirements by Founder approval ONLY.
The waiver mechanism:

1. Ship plan explicitly enumerates the waiver: which coverage item
   waived, why, what known risk results.
2. Waiver documented as a known risk in the ship's Critic-gate
   checklist.
3. Founder approves via amendments.html (a waiver is a governance
   action) OR via explicit ratification in the ship plan's
   pre-flight review.
4. Future ships re-asserting the SAME exception class require explicit
   re-approval. No standing waivers. Waivers don't compound.

Waivers are RARE and noteworthy. The amendment expects 0-3 waivers
across all of Wave 1; exceeding that is a signal the coverage
standard needs revisiting.

## What this amendment intentionally does NOT do

- Does NOT replace unit tests, integration tests, or visual regression
  tests. Smoke is one layer; the others retain their existing role.
- Does NOT require smoke tests for infrastructure-only ships. The
  member-visibility boundary is explicit.
- Does NOT mandate Cypress, WebdriverIO, or any framework other than
  the existing Playwright + real-Firebase stack.
- Does NOT auto-generate smoke test code. Authoring is the team's job;
  this amendment governs WHEN and WHAT, not HOW the test is written.

## Acceptance criteria for THIS amendment landing

Per AMD-009 P3 + P4, this amendment is "applied" only when:

1. `docs/agents/SMOKE_TESTING_GOVERNANCE.md` exists with the body
   of this AMD.
2. Critic checklist in next round-trip cycle picks up the new gates.
3. A subsequent user-facing ship is the first real-world test — at
   ship-plan authoring time, the ship plan cites this amendment's
   coverage standard.

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (the Principle 4 root)
- AMD-011 (auto-execute protocol — Critic's 3 gates include
  ship-complete which now MUST include smoke if user-facing)
- AMD-007 P18.6 Founder's Newspaper (smoke status surfaces in the
  Review Queue for in-flight ships)
- CLAUDE.md "Testing Strategy" section (the 3-tier model; smoke is
  Tier 2 extended)
- v8.17.0 cross-browser smoke infrastructure (the framework to extend)
- `tests/smoke/scenarios/*.js` (the pattern to mirror)
