# SPEC — Dashboard verification audit + PARBAUGHS application audit + App Health dashboard tab

## SELF-INSTALL (first action on read)

This spec lives in `C:\Users\Zach\Downloads\` when the agent first reads it. Before doing anything else:

```
mv /c/Users/Zach/Downloads/audit-spec-2026-05-19.md /c/Users/Zach/smoky-mountain-open/.claude/state/audit-spec-2026-05-19.md
```

Commit as atomic: `spec(goal): install audit-spec-2026-05-19 from Downloads`. All references resolve at `.claude/state/`.

## FOUNDER CONTEXT (read before any execution)

The dashboard-completion audition has closed. The orchestration team passed by demonstrating: honest framing corrections, recursion-breaking, surface-with-source-trace, count-with-destination, no false closure. P10 codified. AMD-028 raised quorum to 5/7 with Security/Truth/Action veto. Substrate is now operating-grade.

This goal is materially different from the audition. The audition was "prove you can do X." This goal is "use what you've proven to assess our actual product." The standard rises commensurately. **Failure modes the audition caught (snapshot-PASS, surface-without-trace, count-without-destination, self-rating inflation) are automatic ship-close rejection on review.**

Founder is NOT a senior engineer. Founder decides: taste/scope/values, audit-finding triage (which to fix, which to defer), App Health tab design direction, verification of final visible truth. Orchestration team decides: every engineering trade-off, scan tooling, audit methodology, code-quality scoring rubrics.

The audition output (dashboard ecosystem) is now operational tooling. This goal verifies it AND extends it. The App Health tab built here will be the Founder's permanent surface for understanding where the PARBAUGHS application stands — security, quality, roadmap, weak points, push-to-improve benchmarks.

## METHODOLOGY: Inherit ALL substrate discipline

Binding throughout: P1 depth-of-research, P2 emulation, P3 hindsight + foresight, P4 OSS first, P5 outside-the-box, P6 unlimited turn/token, P7 TASTE ≥ 9.5, P8 FULL SECURITY (AgentShield primary), P9 DATA TRUTHFULNESS, **P10 ACTIONABLE SURFACING**, V1 vision required, V2 desktop control authorized, V3 less friction.

AMD-028 binding: 9-bubble deliberation gate, quorum 5/7 (raised from 3), per-bubble veto on Security/Truth/Action, V1-first, **agent self-rating capped at 9.0/10** (not 9.4 — raised standard for this goal).

Recursion-breaker: Founder Verification Packet at goal close. Agent does NOT self-mark approval.

## CHANGE AUTHORITY — EXISTING SUBSTRATE GOVERNS

No new audit-mode authority tiers. The substrate already gates changes through overlapping layers:

- **AMD-018 11-gate** — Cloud Functions deploy, Firestore rules deploy, auth config, payment economy, IT Glue, secrets, production data writes, force pushes, App Store / Play Store actions, domain/DNS, Founder biometric. All require Founder pre-auth via `task-queue/founder/`.
- **PARBAUGHS hooks 1-5** — pre-commit lint, post-edit syntax, gate-assertions, gate-protected (`.env*` / `service-account.json` / `firestore.rules`), pre-commit version-sync.
- **ECC GAP-FILL hooks** — 4 hooks activated post-audition; coexistence-policy authoritative.
- **AMD-028 9-bubble deliberation gate** — quorum 5/7 with per-bubble veto on Security, Data Truthfulness, Actionability. Engineer + Critic + Performance bubbles reject without evidence + V1 + simulation.
- **AgentShield** — `npx ecc-agentshield scan` runs at commit time; zero CRITICAL is binding.
- **P10 Actionable Surfacing** — every visible state must show what / where / what-action; counts without destinations are violations.
- **AMD-027 file-size budgets** — orchestration-tier file-size limits enforced.

**Operating rule:** if a proposed change would clear all gates above, it's permitted. If it wouldn't, it surfaces to `task-queue/founder/` with full proposal + impact assessment. The bubble veto + hook layer already enforce the right scope.

**Specific implications for this audit work:**
- Reading any file in the repo: permitted (no gate prohibits read).
- Writing audit reports + the App Health tab + adding test fixtures: permitted (all clear gates).
- Modifying `templates/dashboards/`, `docs/reports/`, `.claude/state/`, `scripts/`: permitted (cleared by hooks + bubble vote).
- Modifying `src/`, `functions/`, `public/`: permitted ONLY if change clears Security + Truth + Action bubbles + AgentShield + the hooks. Most app-behavior changes will surface to `task-queue/founder/` because they fail the "would I let this commit land?" Security bubble check on first audit.
- AMD-018 11-gate items: surface for Founder pre-auth without exception.

## GOAL STRUCTURE — TWO SEQUENTIAL GOALS

This spec covers **TWO separate goals**, sequenced. Goal 1 must close GREEN before Goal 2 begins. The reasoning: if the dashboard infrastructure isn't verified solid, the App Health tab built on top of it inherits the wobble. Honest close of Goal 1 forces a clean substrate baseline before app work touches anything.

**Goal 1 — DASHBOARD VERIFICATION AUDIT (`/goal` block 1 below)**
- Adversarial sweep of every dashboard-completion-spec deliverable
- Re-verify the 5 traced values in the Founder Verification Packet are STILL true (not just true at packet emission)
- Re-run AgentShield, FIQ, smoke test, durability test (rm-rf + scaffold + regen + verify)
- Stress-test the dashboard infrastructure under real session load
- Output: `audit-1-verification-report-{ts}.md` — explicit GREEN / YELLOW / RED verdict per dashboard surface, per P10 actionability, per AgentShield CRITICAL count, per AMD-028 review standard
- Closes when: verdict on EVERY surface is GREEN OR Founder-approved-gap, AgentShield zero CRITICAL holds, durability test passes, V1 visual verification of every dashboard matches the audit report's claims

**Goal 2 — PARBAUGHS APPLICATION AUDIT + APP HEALTH DASHBOARD TAB (`/goal` block 2 below)**
- Read-and-test the PARBAUGHS application across 12+ dimensions (defined below)
- Build "App Health" tab on dashboard as the permanent Founder surface for app status
- Surface findings with peer benchmarks + concrete next-action prompts (push-to-improve framing)
- Change authority governed by existing substrate (see CHANGE AUTHORITY above)
- Closes when: App Health tab live + V1-verified + P10-compliant + scores trace to underlying evidence + Founder verifies and writes approval string

## GOAL 1 — DASHBOARD VERIFICATION AUDIT

### Read before executing

- `.claude/state/dashboard-completion-spec-2026-05-18.md` (original audition spec, 49 DONE WHEN)
- `.claude/state/dashboard-audit-2026-05-18/CONSOLIDATION.md` (sessions 1-4 history)
- `.claude/state/task-queue/founder/dashboard-completion-verification.md` (the packet with the 5 traced values + approval marker)
- `.claude/state/amendments/applied/AMD-026.md`, `AMD-027.md`, `AMD-028.md` (substrate amendments shipped during audition)
- `.claude/state/proposals/shipped/` to understand recent ship history
- Git log post-FOUNDER-APPROVED commit through HEAD

### Audit dimensions (all required)

**D1 — Five traced values re-verification.** Open dashboard.html, token-usage.html, security.html. Re-trace each of the 5 values in the verification packet. Must agree with source at re-trace time, not just at packet emission time.

**D2 — Cross-surface P9 sweep.** Playwright + Read every dashboard. Look for ANY unexplained zero, dash, "Loading...", placeholder. P10 violation if found AND no remediation path visible. Document EVERY occurrence with what/where/what-action triplet.

**D3 — AgentShield re-scan.** Run `npx ecc-agentshield scan`. Compare against the goal-close commit's zero-CRITICAL baseline. If anything has regressed, root-cause investigate (cron-introduced drift? Manual edit? Dependency update?). Re-establish zero-CRITICAL before proceeding to Goal 2.

**D4 — FIQ status.** `firebase deploy --only firestore:indexes --dry-run`. Zero pending. All composite indexes Active. If anything has drifted, surface honestly.

**D5 — Smoke test.** `npm run test:e2e` against local emulator. Document pass/fail per scenario. Cross-browser if bandwidth allows (chromium primary; firefox + webkit if reachable).

**D6 — Durability test.** `rm -rf docs/reports/_assets docs/reports/*.html ; bash scripts/scaffold-from-templates.sh ; bash scripts/regen-all.sh`. Every dashboard must re-render with ALL data populated. V1-verify per surface. If anything is broken from a clean rebuild, fix at root cause.

**D7 — Tree-clean discipline under cron load.** Let the cron cycle run for at least 30 minutes during audit. `git status --porcelain` should remain empty (or contain only cron-routine commits that auto-clean). If dirty files persist, the cron Class A auto-clean has a gap — find and fix it.

**D8 — P10 actionability sweep.** Every error / warning / yellow / red state on every dashboard must answer what / where / what-action. Any violation = audit FAIL on that surface. Document with screenshot evidence.

**D9 — Heartbeat freshness.** All aggregate JSONs have `generated_at` < 1 hour. If anything is stale, identify whether the producer is broken or the cron didn't fire. Fix at root cause.

**D10 — Activity feed completeness.** Confirms session 3-4 + post-audition commits all appear in activity.html. Spot-check 10 random recent commits against the feed render.

**D11 — Verification-packet drift.** Compare the 5 traced values in the packet against current dashboard render. If anything has changed (e.g., token meter now shows 4.8B instead of 4.6B), that's expected drift — but the SOURCES must still match. P9 trace re-validation.

**D12 — Workflow review audit.** AMD-028's 9.4 self-rating cap is in effect. Sample 5 ship commits from the audition + post-audition. Run AMD-028's review heuristic against each. Find any self-rating violations, false-closure patterns, snapshot-PASS occurrences. Surface honestly.

### Goal 1 DONE WHEN (validator-checkable)

G1-D1. Audit report exists at `.claude/state/audit-2026-05-19/audit-1-verification-report.md` with per-dimension verdict.
G1-D2. Verdict per dimension: GREEN or Founder-approved-gap. ZERO RED verdicts allowed.
G1-D3. AgentShield: zero CRITICAL on current commit (`npx ecc-agentshield scan` output captured).
G1-D4. FIQ: zero pending indexes.
G1-D5. Smoke test: documented exit per scenario (passes OR known-flake with B.43 reference + Founder-approved).
G1-D6. Durability test: passes (rm + scaffold + regen produces all 10 dashboards with data).
G1-D7. `git status --porcelain` empty after cron load test.
G1-D8. P10 sweep: zero violations OR documented Founder-approved-gap.
G1-D9. All aggregate JSONs have `generated_at` < 60 min.
G1-D10. Activity feed: spot-check 10 commits, all 10 present.
G1-D11. Verification packet drift: all 5 traced-value SOURCES still match.
G1-D12. Workflow review: 5 ships audited, findings logged.
G1-D13. 9-bubble deliberation gate per bubble: APPROVE (5/7 quorum, no Security/Truth/Action veto).
G1-D14. Founder reviews `audit-1-verification-report.md`, writes `FOUNDER-APPROVED-G1-{ISO-8601-TS}` into the file.

Goal 1 close ONLY on G1-D14. Agent does not self-mark.

### Goal 1 `/goal` paste (use launcher pattern; spec is authoritative)

```
/goal Goal 1 of audit-spec-2026-05-19 — Dashboard Verification Audit. Step 1: move /c/Users/Zach/Downloads/audit-spec-2026-05-19.md to .claude/state/audit-spec-2026-05-19.md (commit). Step 2: read spec in full.

GATE: This goal verifies the dashboard-completion audition deliverables hold under adversarial sweep BEFORE Goal 2 (PARBAUGHS app audit) opens.

INHERIT: P1-P10 + V1-V3 binding. AMD-028 9-bubble quorum 5/7 with Security/Truth/Action veto. Agent self-rating capped at 9.0/10 (raised from 9.4). Recursion-breaker (Founder writes approval). AMD-017 honest stop on API drop or context fill — no false closure.

CHANGE AUTHORITY: Existing substrate governs — AMD-018 11-gate + PARBAUGHS hooks 1-5 + ECC GAP-FILL hooks + AMD-028 deliberation gate + AgentShield + P10 + AMD-027 file-size budgets. If a change clears all gates, permitted. If not, surfaces to task-queue/founder/. No new audit-mode tier system.

EXECUTE 12 audit dimensions D1-D12 per spec — five-traced-values re-verification, cross-surface P9 sweep, AgentShield re-scan, FIQ, smoke, durability test (rm-rf + scaffold + regen + V1-verify all 10 dashboards), tree-clean under cron load, P10 actionability sweep, heartbeat freshness, activity-feed completeness, verification-packet source-match, workflow review audit (5 sampled ships).

OUTPUT: .claude/state/audit-2026-05-19/audit-1-verification-report.md with per-dimension verdict GREEN/YELLOW/RED + evidence per finding. Per-dimension verdict must be GREEN or Founder-approved-gap. ZERO RED allowed.

CONSTRAINTS: ANY P10 violation found = ship-close rejection. ANY snapshot-PASS pattern = automatic rejection. ANY count-without-destination = rejection. Findings without screenshot/log/grep evidence = rejection.

FOUNDER-FACING: Surface only (a) per-dimension verdict summary, (b) any RED or YELLOW requiring decision, (c) the final report for approval. Engineering trade-offs stay with orchestration team.

STOP RULES: ALL 14 DONE WHEN met + Founder writes FOUNDER-APPROVED-G1-{TS} → close. AMD-017 honest stop on API drop or context fill — commit + document state + stop cleanly. No false closure.

Begin immediately. Validator checks 14 DONE WHEN every turn. Loop until truth + Founder approval.
```

## GOAL 2 — PARBAUGHS APPLICATION AUDIT + APP HEALTH DASHBOARD TAB

### Prerequisite

Goal 1 must close with FOUNDER-APPROVED-G1-{TS}. If Goal 1 surfaces unresolved issues, Goal 2 does NOT open.

### Read before executing

- All of Goal 1's audit report
- `CLAUDE.md` (operational pointer document)
- `docs/v8.0-technical-design.md` and other docs/ files relevant to architecture
- Git log of v8.x ships to understand product trajectory

### Audit dimensions (PARBAUGHS application)

**A1 — Roadmap position.** Where is the app vs. the PARBAUGHS roadmap (docs/ + memory)? Wave 1 ship 1 status. Ship-readiness deferred queue. Identified gaps between intent and current state. Surface as a per-roadmap-stage progress chart.

**A2 — FIQ score.** Firestore Index Quality — composite index coverage, query-to-index match, missing-index detection from query patterns in `src/pages/` and `src/core/`. Score 0-100 with per-collection breakdown.

**A3 — Security posture.** AgentShield scan on app code. OWASP Top 10 review. Firestore rules coverage matrix (every collection × every operation). Bundle exposure scan for secrets. Authentication flow audit. Rate-limit audit on Cloud Functions. Per-finding surfaces through existing substrate (Security bubble + AgentShield + AMD-018).

**A4 — UI/UX weak points.** Lighthouse score on key pages (HQ home, profile, feed, scorecard, round detail, calendar). Mobile vs. desktop comparison. Touch-target compliance (44pt minimum per CLAUDE.md). Color contrast (WCAG AA). Reduced-motion compliance. Loading-state coverage. Error-state coverage. Empty-state coverage. Per-page taste score (1-10) against Linear / Vercel / Stripe / 18Birdies / Hole19 references.

**A5 — Code quality.** Cyclomatic complexity per module. Unused exports. Dead code paths. Test coverage by file. Bundle size by route. Code duplication. Per-file rating with concrete next-action.

**A6 — Architecture review.** Read `src/core/` + `src/pages/` + `functions/index.js`. Identify architectural debt (god objects, leaky abstractions, circular dependencies, anti-patterns). Score against AMD-027 file-size budgets. Per-finding propose next-action.

**A7 — Data integrity.** Firestore schema consistency across `src/core/data.js` writes, Cloud Function writes, migration scripts. Identify any field-name drift or schema mismatches between producer and consumer.

**A8 — Performance.** Bundle size (chunked + total). Lighthouse performance score. Time-to-interactive on slow 3G simulation. JavaScript execution time. Largest Contentful Paint. Cumulative Layout Shift. Per-route timing.

**A9 — Accessibility.** WCAG 2.1 AA compliance scan. Per-page rating. Specific findings (missing aria-labels, low contrast, keyboard-trap, focus-management).

**A10 — Mobile-first sanity.** All 45 pages render correctly at 375px width. Touch interactions work. Bottom-nav doesn't overlap content. Scroll behavior correct.

**A11 — Testing coverage.** What % of code paths have e2e or unit coverage. What critical paths have ZERO coverage. Where to prioritize next.

**A12 — Operational health.** Recent error rates (if instrumented). Cloud Function cold-start times. Firestore read/write ratio. Storage consumption trend. Cost trajectory.

### App Health dashboard tab — design intent

**Information architecture** (decided by orchestration team, not Founder; reviewed against Linear / Vercel / Stripe references):

The tab must answer one question per second of Founder attention:
- **Second 1:** Overall health letter grade (A-F) — single visible character at top
- **Second 2-5:** Per-dimension scores (A1-A12) as a row of cards with grade letter + color + sparkline
- **Second 6-10:** "What needs your attention" — top 3-5 surfaced items with what/where/what-action per P10
- **Second 11+:** Drill-in on any card opens its detail view

**Push-to-improve framing per Founder direction:**
- Each per-dimension score shows: current score, target score (industry-leader-comparable benchmark), gap, recommended next ship
- Peer benchmarks where credible: Lighthouse industry medians (publicly available), OWASP benchmark scores, GitHub Octoverse stats for similar repos. **Synthetic benchmarks preferred** — comparing to specific named competitors risks anchoring; comparing to "top quartile Lighthouse score for golf apps" pushes improvement without arbitrary anchors.
- Each weak point has a concrete file/function reference + the specific change that would close it

**Simple AND informative:**
- Default view is the second-1-to-5 high-level
- Detail views require explicit click
- No more than 12 numbers visible on the default view
- All scores trace to evidence via P9 (click a score → see the underlying scan output + commits)
- All weak points satisfy P10 (what / where / what-action visible without clicking)

**Visual style:** Inherit dashboard.html conventions (Clubhouse palette, JetBrains Mono for technical labels, brass for accents). Per AMD-028, 9.0/10 minimum taste rating per surface.

### Findings handling

Audit findings surface to `task-queue/founder/app-audit-findings-{category}.md` per category (security, performance, ui, code-quality, architecture, etc.). Each finding documents what was observed, where, severity, and proposed next-action. Founder triages and decides which become future ships.

The audit work itself does NOT change app code unless a proposed change clears Security + Truth + Action bubbles + AgentShield + the hooks. Most app-behavior changes will surface rather than ship — that's the existing substrate doing its job.

### Goal 2 DONE WHEN (validator-checkable)

G2-D1. App Health tab exists at `docs/reports/app-health.html`, > 5KB, renders.
G2-D2. App Health tab linked from `docs/reports/index.html` directory.
G2-D3. Tab displays A1-A12 dimension scores with per-dimension trace to scan output.
G2-D4. Tab top displays overall grade letter A-F with calculation transparently traceable.
G2-D5. P10 compliance: every visible weak point answers what/where/what-action.
G2-D6. P9 compliance: every score traces source → aggregator → display via DATA-TRUTH-MATRIX append.
G2-D7. AgentShield re-scan: still zero CRITICAL (no audit work introduced new findings).
G2-D8. Findings surfaced as `task-queue/founder/app-audit-findings-{category}.md` files.
G2-D9. Lighthouse scores captured for 6+ pages (HQ home, profile, feed, scorecard, round detail, calendar).
G2-D10. Firestore rules coverage matrix updated for current state.
G2-D11. Bundle exposure scan: no secrets, no PII, no internal config.
G2-D12. Per-dimension taste rating ≥ 9.0/10 (App Health tab itself).
G2-D13. V1 verification of App Health tab across desktop + tablet + mobile widths.
G2-D14. Durability test: App Health tab survives rm-rf + scaffold + regen.
G2-D15. Founder reviews App Health tab + audit findings, writes `FOUNDER-APPROVED-G2-{ISO-8601-TS}` into `task-queue/founder/app-audit-verification.md`.

Goal 2 close ONLY on G2-D15.

### Goal 2 `/goal` paste (use launcher pattern; spec is authoritative)

```
/goal Goal 2 of audit-spec-2026-05-19 — PARBAUGHS application audit + App Health dashboard tab. PREREQUISITE: Goal 1 must close GREEN with FOUNDER-APPROVED-G1-{TS}. Step 1: confirm Goal 1 closed; read .claude/state/audit-spec-2026-05-19.md in full + Goal 1 audit report.

GATE: This is the first audit the orchestration team performs as graduates of the dashboard audition. Standard rises commensurately. The App Health tab built here will be the Founder's permanent surface for app status.

INHERIT: P1-P10 + V1-V3 binding. AMD-028 9-bubble quorum 5/7 with Security/Truth/Action veto. Agent self-rating capped at 9.0/10. Recursion-breaker. AMD-017 honest stop.

CHANGE AUTHORITY: Existing substrate governs — AMD-018 11-gate + PARBAUGHS hooks + ECC GAP-FILL hooks + AMD-028 deliberation gate + AgentShield + P10. If a change clears all gates, permitted. If not, surfaces to task-queue/founder/. Most app-behavior changes will surface because Security bubble + hooks reject mid-audit code edits.

EXECUTE 12 audit dimensions A1-A12: roadmap position, FIQ score, security posture, UI/UX weak points, code quality, architecture review, data integrity, performance, accessibility, mobile-first, testing coverage, operational health. Each dimension scores 0-100 with per-finding surfaced via existing substrate.

BUILD App Health dashboard tab per design intent in spec: overall grade letter + 12 dimension cards + "what needs your attention" P10-compliant + detail-drill-in. Synthetic peer benchmarks (Lighthouse medians, OWASP averages, etc) — NOT named-competitor comparisons. Default view ≤ 12 numbers. All scores P9-traced. All weak points P10-compliant.

OUTPUT: docs/reports/app-health.html linked from index. task-queue/founder/app-audit-findings-*.md per category. task-queue/founder/app-audit-verification.md with the verification packet.

CONSTRAINTS: ZERO new AgentShield CRITICAL. ZERO P10 violations on App Health tab. ANY surface where a score doesn't trace to evidence = ship-close rejection. ANY weak point without what/where/what-action = rejection.

FOUNDER-FACING: Surface only (a) the App Health tab itself, (b) per-category findings files for triage, (c) the verification packet for D15 approval.

STOP RULES: ALL 15 DONE WHEN met + Founder writes FOUNDER-APPROVED-G2-{TS} → close. AMD-017 honest stop on API drop or context fill.

Begin immediately. Validator checks 15 DONE WHEN every turn. Loop until truth + Founder approval.
```

## ANTI-PATTERNS — ALL APPLY TO BOTH GOALS

1. Do not skip P10 actionability — every error/warning surfaces with what/where/what-action.
2. Do not declare PASS on snapshot state that won't survive clean rebuild.
3. Do not write findings from imagination — every finding has scan/grep/screenshot evidence.
4. Do not self-mark Founder approval. Agent stops at packet emission; Founder writes approval string.
5. Do not pattern-match "majority green therefore goal close." 5/7 quorum required; veto on Security/Truth/Action means a single rejection on those three bubbles blocks close regardless of other approvals.
6. Do not surface engineering trade-offs to Founder. Existing substrate governs.
7. Do not consult only one reference per surface. P7 still binding — multiple references per design dimension.
8. Do not skip V1 — every dashboard surface gets Playwright capture + Read inspection before claim.
9. Do not exceed agent self-rating cap of 9.0/10 without external evidence (peer comparison, user feedback simulation, A/B comparison against industry reference).
10. Do not let cron drift mask real broken state — P10 sweep is mandatory even when cron auto-clean is running.
11. Do not assume Goal 1's GREEN extends to Goal 2 forever. Goal 2 re-runs AgentShield + V1 + P9 + P10 at packet emission. If anything has regressed, surface honestly.
12. Do not invent new governance layers when existing substrate already gates the action. The substrate IS the governance.
13. Do not skip the Lighthouse capture for the 6 key pages — qualitative assessment doesn't replace measurement.
14. Do not invent peer benchmarks. Synthetic benchmarks must trace to a public source (Lighthouse public dataset, OWASP published averages, GitHub Octoverse stats).
15. Do not omit a dimension because "obvious it'll score well." If a dimension is in A1-A12, it gets scored with evidence.

## STOP RULES — APPLY TO BOTH GOALS

1. ALL DONE WHEN met + Founder approval string written → close.
2. Real AMD-015 escalation (Founder presence required) → surface, continue OTHER work that doesn't depend.
3. 5+ documented attempts on a single sub-issue without progress → surface, continue OTHER dimensions.
4. AgentShield CRITICAL regression → surface, hold affected, continue unaffected.
5. P10 trace impossible for a critical value → surface with trace-as-far-as-possible + proposed fix.
6. AMD-017 honest stop on API drop or context fill → commit + document state + stop cleanly. NO false closure.

NOT stop rules:
- "Most things working" — all DONE WHEN required, no waivers without Founder gap-approval
- "Looks better than before" — taste rating ≥ 9.0 measured against references, not assumed
- Turn count, token count, time elapsed — P6 unlimited authorized
- Single test failure — root-cause first
- "Founder might want to review" — substrate gates surface what needs surfacing
- "Score 8.9 close enough" — iterate to 9.0 or surface for Founder gap-approval
- "AgentShield finding might be false positive" — verify with manual review + surface, never silence

## SCOPE OUT (both goals)

- Production deploys (AMD-018 11-gate)
- Live member data writes
- Any action on App Store Connect / Google Play Console
- Modifications outside `C:\Users\Zach\smoky-mountain-open\`
- IT Glue / credentials / password-manager
- Firestore rules deploy or Cloud Function deploy without Founder pre-auth

## SEQUENCING

1. Spec lands at `.claude/state/audit-spec-2026-05-19.md` (self-install)
2. Goal 1 opens — Dashboard Verification Audit
3. Goal 1 closes with `FOUNDER-APPROVED-G1-{TS}` written by Founder
4. Goal 2 opens — PARBAUGHS App Audit + App Health Tab
5. Goal 2 closes with `FOUNDER-APPROVED-G2-{TS}` written by Founder
6. App Health tab becomes permanent operational surface for Founder
7. W1.S1 (PARBAUGHS app feature work) opens as next `/goal`

End of spec.
