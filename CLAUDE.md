# PARBAUGHS — Golf League Platform

Invite-only multi-league golf app for a tight friend group based in York, PA. Solo-first golf tracking with optional league layer. Country club meets group chat meets fantasy sports. Community over competition in every decision.

This app is a labor of love. Quality is non-negotiable.

## Project state

- **Version:** v8.1.3 (Clubhouse Part A complete, 2026-04-22)
- **Stack:** vanilla JS + Vite + Firebase (Auth, Firestore, Cloud Functions Gen1 Node 22, us-central1) + GitHub Pages static deploy. ESLint, Husky pre-commit, Playwright E2E.
- **Repo:** AlrightLad/smoky-mountain-open · **Live:** https://alrightlad.github.io/smoky-mountain-open
- **Brand:** Parbaughs (platform) · The Parbaughs (founding 20-member league) · @Parbaughs / @ParbaughsGolf (social handles in flight) · domain parbaughs.com/.golf pending
- **Users:** 20 members, mixed iPhone + Android, real human play
- **Budget:** Zero beyond Firebase Blaze. P4 OSS first.

Detailed architecture, design system, ParCoin economy, roadmap, build setup, and historical notes live in `docs/` and `.claude/state/archived-substrate-2026-05-18-claudemd-pre-rewrite.md`. Read those when you need depth; do not bloat this file.

## Three-Agent Workflow

| Agent | Role | Authority |
|---|---|---|
| **Zach (Founder / Commissioner / Product Owner)** | Final decision on product + scope + taste; NOT a senior engineer; does NOT write code | Verifies visible truth |
| **Claude.ai (CTO / Strategic Planner)** | Specs, design docs, reviews; does NOT write code | Recommendations |
| **Claude Code (Engineer / QA)** | Executes specs, investigates, implements, tests; reports back | Trusted to make small judgment calls within spec scope |

Founder is NOT a senior engineer. Orchestration team makes engineering decisions. Surface to Founder ONLY for taste / scope / values / final visible verification.

Authority violations are process failures to be named and corrected.

## Methodology: Superpowers + ECC + PARBAUGHS triple layer

Phase 0 of `.claude/state/dashboard-completion-spec-2026-05-18.md` installed:

- **Superpowers** (claude-plugins-official v5.1.0) — methodology spine: brainstorming → writing-plans → executing-plans → TDD → subagent-driven-development → verification-before-completion → receiving/requesting-code-review. Active in every session.
- **superpowers-chrome** (obra/superpowers-marketplace v2.1.0) — Chrome DevTools Protocol control. Staged for next session activation.
- **ECC** (affaan-m/everything-claude-code v2.0.0-rc.1) — extended skills/agents library + AgentShield security scanner. Staged for next session activation.

`.claude/state/phase-0/coexistence-policy.md` is the authoritative source for which surface each plugin owns. Read it before adopting a methodology pattern. Highlights:
- **Methodology spine** → Superpowers (brainstorm/plan/execute/verify/test-drive/debug/review)
- **Security scanning** → AgentShield via `npx ecc-agentshield scan` (primary); supplementary trufflehog/gitleaks pre-commit per spec Phase F
- **Browser control** → Playwright MCP (already loaded, V2-authorized); superpowers-chrome adds CDP path once active
- **PARBAUGHS substrate** (AMD-018/022/023/024, parbaughs-* skills, .claude/hooks/) — takes precedence on any conflict

`.claude/state/substrate-audit-2026-05-18.md` enumerates KEEP/DROP/MIGRATE for all 25 AMDs + 13 PROPs + 36 skills.

## Operating principles (P1–P9, V1–V3)

Source of truth: `.claude/state/dashboard-completion-spec-2026-05-18.md`. Summary:

- **P1. Depth-of-research over speed-of-closure.** "I looked into it" is rejected. Evidence required: web-search citations, simulation, hindsight, OSS comparison.
- **P2. Emulation + simulation before live application.** Scratch dir → end-to-end → vision-verify → compare → apply.
- **P3. Hindsight + foresight in every ship-close.** "How could this have been better? What breaks at 10x?"
- **P4. Open-source FIRST, paid LAST.** Search OSS before SaaS. Paid requires Founder approval via `task-queue/founder/`.
- **P5. Outside-the-box enumeration.** Default to 3+ distinct approaches including one non-obvious. Pick most appropriate. Document why.
- **P6. Time is not the constraint; truth is.** NO turn-count caps. NO token-budget caps (Founder authorized unlimited for the active /goal). Stop ONLY when DONE WHEN truthfully met or genuine Founder-presence blocker.
- **P7. Competitive benchmarking — passing score ≥ 9.5/10.** Industry-leader-comparable per dimension (typography, hierarchy, density, motion), NOT a copy of industry visual style. PARBAUGHS keeps its own identity. Reference companies: Linear, Vercel, Stripe, Datadog, Sentry, PostHog, Grafana, Plausible, Cloudflare, Supabase. Below 9.5 → Taste bubble rejects.
- **P8. Security + privacy + abuse-prevention as ship-blocking.** AgentShield primary. Every ship-close writes a SECURITY block to retrospective. RED blocks; YELLOW needs Founder approval. OWASP basics + Firestore rules audit + bundle exposure + rate limits.
- **P9. Data truthfulness — every visible value traces to source.** V1 verifies a surface rendered; P9 verifies it rendered the truth. Zeros/dashes/N/A default to FAIL until proven legitimate. Founder Verification Packet is the recursion-breaker (5 visible values, `FOUNDER-APPROVED-{TS}` field).
- **P10. Actionable Surfacing (AMD-026, 2026-05-19).** Every visible error/warning/yellow/red state answers WHAT/WHERE/WHAT-ACTION. Counts without destinations are violations. Dashboards distinguish Founder-action-required from cron-noise. Silent fallback-to-zero in render code is a bug. Empty states classified explicitly (legitimate / loading / error / misconfigured). 9th deliberation bubble (Actionability) gates ship-close.
- **V1. Vision-based verification REQUIRED.** Playwright/Chrome → PNG → Read → describe → compare → record.
- **V2. Desktop control authorized within scope.** Playwright + Chrome user-data-dir; PowerShell + admin installers (consent for elevated, proceed for non-elevated); Git including push (with AMD-018); editing anywhere under repo; cron + smoke + FIQ; opening + screenshotting any file:// URL. Out-of-scope (requires Founder pre-auth): credentials / IT Glue / password manager; system-wide settings outside workspace; Firestore rules / Cloud Function deploys (AMD-018 exception list); Founder biometric / MFA; anything outside `C:\Users\Zach\smoky-mountain-open\`.
- **V3. Less friction.** Don't ask when V2 authorizes. Surface only on out-of-scope OR true Founder-presence-required. Do not surface engineering trade-offs.

## Hard production-risk boundaries (AMD-018 11-gate)

The following touch points require Founder pre-authorization in `task-queue/founder/` before agent action:

1. Cloud Functions deploy (`firebase deploy --only functions`)
2. Firestore rules deploy (`firebase deploy --only firestore:rules`) — also blocked by `.claude/hooks/gate-protected.sh`
3. Auth provider config (Firebase Auth, OAuth client setup)
4. Payment economy code (ParCoin earn/spend rules, wager flows)
5. IT Glue / credentials / password-manager content
6. Secrets handling (`.env*`, service-account.json) — blocked by `gate-protected.sh`
7. Production data writes outside emulator
8. Force pushes to `main`
9. Anything triggering App Store / Play Store submission state
10. Domain / DNS configuration
11. Founder biometric / MFA / device-paired auth

Hook 4 (`gate-protected.sh`) blocks file-level edits to `.env*`, `scripts/.service-account.json`, and `firestore.rules` unconditionally. Bypass pattern (`disableAllHooks: true` in `.claude/settings.local.json`) requires explicit Founder authorization for the specific ship.

## Hooks (PARBAUGHS substrate, takes precedence)

`.claude/hooks/` shell scripts + `.husky/pre-commit` git layer:

| # | Hook | Fires on | Behavior |
|---|---|---|---|
| 1 | `pre-commit-lint.sh` | `git commit` Bash | Runs `npm run lint`; blocks on non-zero |
| 2 | `post-edit-syntax.sh` | Edit/Write `*.js` under src/, tests/, scripts/ | Acorn parse; warns on stderr |
| 3 | `gate-assertions.sh` | Edit/Write `tests/e2e/helpers/assertions.js` | **Blocks** — Founder handshake required |
| 4 | `gate-protected.sh` | Edit/Write `.env*`, `scripts/.service-account.json`, `firestore.rules` | **Blocks** until Founder approves |
| 5 | `pre-commit-version-sync.sh` | `git commit` Bash | Verifies APP_VERSION (`src/core/utils.js`) == `package.json` `version`; blocks mismatch |
| — | Husky `pre-commit` | Git layer | Runs lint-staged + version-sync; blocks on failure; bypass with `--no-verify` (Husky only — Claude Code hooks still fire) |

`CACHE_NAME` in `public/sw.js` must also bump to `'parbaughs-v{version}'` on every version bump. NOT enforced by Hook 5 — manual step.

ECC's hook system (30+ hooks) is staged but not active. Coexistence-policy specifies which ECC hooks to disable on activation (`gateguard-fact-force`, `bash-dispatcher`, `config-protection`, `stop:format-typecheck`).

## Operational principles (apply to every change)

- **Caddy Notes** (`src/pages/caddynotes.js`) updates on every member-visible change; one honest line per ship if infrastructure-only. `currentNotes` holds latest version only; previous moves to `archiveNotes`. See `docs/CADDY_NOTES_STYLE.md` (writes if needed).
- **Firestore is source of truth.** localStorage allowed only for: `pb_appearance`, `pb_clubhouse_welcomed`, `pb_liveState`, `golfcourse_api_key`, `dm_read_*`. sessionStorage allowed only for: `pb_weather_cache`, `pb_location_staleness_checked`.
- **No hardcoded colors** except Visual Reference (hole-dot colors, calendar dots) and share-card template (html2canvas compat). Use Clubhouse tokens.
- **44pt minimum touch targets.** Test mobile Safari + Chrome.
- **Zero guessing on course/par data** — GolfCourseAPI only.
- **Targeted Edits preferred over full rewrites.** Bulk changes via Bash sed/perl with scoped patterns.
- **`var` (not `let`/`const`)** for current vanilla JS compat.
- **Settings in top-bar cog only, never in footer nav.**
- **No emojis** in place of SVG icons (exception: ⛳ for The Caddy bot, and explicit user request).

## Architecture pointer

Detailed file tree, Cloud Function inventory, Firestore rules architecture, design tokens, motion module, page-shell orchestrator, and ParCoin economy live in `docs/` and the archived pre-rewrite CLAUDE.md (`.claude/state/archived-substrate-2026-05-18-claudemd-pre-rewrite.md`). Key directories:

- `src/core/` — bundled-first foundation (utils, animate, handicap, firebase, data, sync, parcoins, caddie, charts, analytics, router, page-shell). See vite.config.js CORE_FILES order.
- `src/pages/` — ~45 page renderers; each registers with router
- `src/styles/base.css` — Clubhouse tokens (~90 tokens)
- `src/styles/components.css` — token-driven components
- `functions/index.js` — 8 Cloud Functions (Gen1 Node 22 us-central1): `searchCourses`, `validateInvite`, `sendPushNotification`, `onMemberRoleChange`, `onLeagueDelete`, `joinLeague`, `onFounderAccessLog`, `expireSuspensionsAndTransfers`
- `tests/e2e/` — Playwright suite + emulator fixtures
- `.claude/state/` — telemetry, proposals, amendments, audits, design research, security baselines
- `templates/dashboards/` — dashboard source-of-truth templates (regenerated by `scripts/regen-*.py`)

## Testing strategy

- **Tier 1 (planned v7.9.1):** pre-push smoke (~30-60s, 8-12 tests, blocks push)
- **Tier 2 (implemented):** Playwright E2E in `tests/e2e/flows/` (44+ tests). Grows with bugs, not features. Run via `npm run test:e2e` against local emulator. See `tests/e2e/_templates/` for diagnostic patterns. Diagnostic-first on bug reports (P5).
- **Tier 3:** Manual QA on Zach's device per ship.

## Dashboard work (active /goal)

`.claude/state/dashboard-completion-spec-2026-05-18.md` is the active spec for the dashboard ecosystem audition that gates all subsequent PARBAUGHS app feature work. Phase 0 install + compatibility verdict (YELLOW) committed. Phases A-J + T + M run in parallel where dependencies allow. 49 DONE WHEN conditions + Founder Verification Packet (`FOUNDER-APPROVED-{TS}` field) close the goal.

## Reference

- **Detailed history + architecture:** `.claude/state/archived-substrate-2026-05-18-claudemd-pre-rewrite.md`
- **Plugin coexistence policy:** `.claude/state/phase-0/coexistence-policy.md`
- **Substrate KEEP/DROP/MIGRATE:** `.claude/state/substrate-audit-2026-05-18.md`
- **Spec for active /goal:** `.claude/state/dashboard-completion-spec-2026-05-18.md`
- **AMDs (25 applied):** `.claude/state/amendments/applied/`
- **PROPs (4 shipped, 9 deferred):** `.claude/state/proposals/shipped/` + `ship-readiness-deferred/`
- **Design docs:** `docs/`
- **Design research:** `.claude/state/design-research/`
- **Token meter + dashboard regen:** `scripts/regen-*.py` + `templates/dashboards/`
