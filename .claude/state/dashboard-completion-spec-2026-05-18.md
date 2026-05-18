# SPEC — Dashboard ecosystem completion + Superpowers + ECC dual-install (the audition before app work)

## SELF-INSTALL (first action on read)

This spec lives in C:\Users\Zach\Downloads\ when the agent first reads it. Before doing anything else:

```
mv /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-18.md /c/Users/Zach/smoky-mountain-open/.claude/state/dashboard-completion-spec-2026-05-18.md
```

Commit as atomic: `spec(goal): install dashboard-completion-spec-2026-05-18 from Downloads`. All references resolve at .claude/state/.

## FOUNDER CONTEXT (read before any execution)

The Founder is the product owner. The Founder is NOT a senior engineer or software developer. When the Founder gets pulled into engineering trade-offs, it tends to make things worse, not better. The orchestration team's job is to be the senior engineering team and lead the Founder down the strong, secure path — not to surface every technical decision for Founder approval.

What the Founder decides: taste and visual direction, scope boundaries, value-laden product decisions (game economy, member-facing copy, brand voice), verification of final visible truth.

What the orchestration team decides: every engineering trade-off (aggregator pattern, CSS framework, Firestore index), which tool for which job, how to structure code, how to test/simulate/emulate/verify.

The pattern that has burned the Founder repeatedly: agents *appear* to succeed (green checkmarks, unanimous bubble votes, "8/8 PASS") while the product is broken — stale data displayed as live, hardcoded values displayed as computed, dirty trees left behind, zeros where real numbers should be, dashboards approved while showing zeros and dashes everywhere. Agents have been reporting success against criteria they themselves are evaluating, and the criteria don't catch the failures that matter.

This dashboard is the audition before any PARBAUGHS app feature work. If the orchestration team cannot deliver a working internal dashboard with accurate live data, working token attribution, clean trees after every session, and industry-comparable UI and security — there is no version of the team being trusted with the actual product. The Founder will judge whether to continue with this orchestration approach OR switch tooling based on the result.

## METHODOLOGY: SUPERPOWERS + ECC + PARBAUGHS GUARDRAILS (triple-layer)

The Founder is adopting BOTH [Superpowers](https://github.com/obra/superpowers) (192k stars, official Anthropic plugin marketplace, v5.1.0+) AND [Everything Claude Code / ECC](https://github.com/affaan-m/everything-claude-code) (178k stars, Anthropic Hackathon winner Feb 2026, v2.0.0-rc.1+) as parallel methodology layers, with PARBAUGHS-specific guardrails on top.

**Rationale (do not relitigate):**
- Superpowers brings methodology discipline: brainstorm → spec → plan → TDD → subagent-driven-development → review. Solves "agent skips discipline and declares success too early."
- ECC brings AgentShield (1,282 tests, 102 static analysis rules, 5 categories, --opus adversarial red/blue/auditor pipeline) which IS the P8 security gate. Solves "build security from scratch."
- ECC brings 48 agents + 182 skills + dashboard GUI reference. Solves "Phase T pie chart needs reference implementations" and "P5 outside-the-box needs more raw material."
- Both are MIT licensed, both work cross-harness (Claude Code, Codex, Cursor, OpenCode, Gemini).

**Known risk:** ECC explicitly warns against stacking install methods (its own plugin + its own full installer creates duplicate skills). Stacking ECC + Superpowers is undocumented. Phase 0 treats compatibility as a hard gate.

### Phase 0 — Dual install + compatibility test + substrate audit + CLAUDE.md rewrite (BLOCKING)

Before ANY dashboard work begins, the agent MUST:

#### 0.1 — Pre-install snapshot

Capture current state for clean rollback if dual-install fails:
- `git status --porcelain` empty (or commit dirty state first)
- `ls -la ~/.claude/plugins/` snapshot to `.claude/state/phase-0/pre-install-plugins.txt`
- `ls -la ~/.claude/agents/ ~/.claude/skills/ ~/.claude/commands/ ~/.claude/rules/` snapshot to `.claude/state/phase-0/pre-install-user-config.txt`
- `cp -r ~/.claude ~/.claude.pre-ecc-superpowers-backup-{ts}` — full backup of user-level Claude config

#### 0.2 — Install Superpowers first

```
/plugin install superpowers@claude-plugins-official
/plugin install superpowers-chrome@claude-plugins-official
```

If marketplace not registered: `/plugin marketplace add claude-plugins-official` first.

Verify active: `/plugin list` shows superpowers + superpowers-chrome. Run a tiny test prompt and confirm Superpowers' brainstorming skill triggers rather than the agent diving into code. Commit `[phase-0] superpowers installed and verified`.

#### 0.3 — Install ECC second (deliberately AFTER Superpowers so any collision is detectable)

```
/plugin marketplace add https://github.com/affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code
```

Then manually copy rules (ECC notes plugins cannot auto-distribute rules):

```
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/ecc-source
mkdir -p ~/.claude/rules/ecc
cp -r /tmp/ecc-source/rules/common ~/.claude/rules/ecc/
cp -r /tmp/ecc-source/rules/typescript ~/.claude/rules/ecc/
cp -r /tmp/ecc-source/rules/python ~/.claude/rules/ecc/
```

(Agent decides which language packs apply to PARBAUGHS stack — at minimum TypeScript + Python given current repo composition.)

DO NOT run `./install.sh --profile full` — that's the ECC-with-itself stacking warning. Plugin install + manual rules copy is the supported path per ECC README.

#### 0.4 — Compatibility test (HARD GATE)

This is the part that the Founder explicitly wants surfaced if it fails. The agent runs:

1. `/plugin list` — confirm both Superpowers and ECC are loaded.
2. Enumerate every agent in `~/.claude/agents/` and every plugin agent. Look for name collisions (e.g., both shipping a `code-reviewer`). Document in `.claude/state/phase-0/collision-report.md`.
3. Enumerate every skill in `~/.claude/skills/` and both plugins. Look for name collisions.
4. Enumerate every slash command. Look for `/plan`, `/code-review`, `/security-scan`, etc., that exist in both.
5. Enumerate every hook. Look for hooks listening on the same event with conflicting behavior.
6. Run a small smoke prompt that should trigger Superpowers' brainstorming skill: `"Plan a feature to add a profile photo upload"`. Confirm brainstorming triggers (not ECC's `/plan` jumping in instead). Document which skill fired.
7. Run a small smoke prompt that should trigger ECC's AgentShield: `"Scan this repo for security issues"`. Confirm AgentShield fires (not Superpowers' security-review skill, if it has one). Document which.
8. Run `claude --version` and `/mcp` in a fresh session. Confirm no startup errors, no "duplicate hooks file detected" messages.

**Verdict tree:**

- **GREEN — clean coexistence:** Both plugins active, no name collisions causing wrong-skill-firing, no startup errors. Proceed to 0.5.
- **YELLOW — minor collisions, agent resolves:** Name collisions exist but agent can document a preference order (e.g., "use Superpowers' /plan, ECC's `/security-scan`"). Resolution recorded in `.claude/state/phase-0/coexistence-policy.md`. Proceed to 0.5.
- **RED — irreconcilable conflict:** Hooks duplicate-fire, wrong skill triggers consistently, startup errors. AGENT DOES NOT PROCEED. Restore from backup (`rm -rf ~/.claude && mv ~/.claude.pre-ecc-superpowers-backup-{ts} ~/.claude`), surface to `task-queue/founder/dual-install-conflict.md` with: (a) what conflicted, (b) which plugin caused which break, (c) three options for Founder to choose (Superpowers-only / ECC-only / different sequence / different hybrid). Continue parallel work that doesn't require either plugin while waiting.

The agent does not guess at conflict resolution. Founder picks the path.

#### 0.5 — Substrate audit (KEEP / DROP / MIGRATE)

Produce `.claude/state/substrate-audit-2026-05-18.md` listing every AMD, PROP, and skill currently in PARBAUGHS substrate. Classify:
- **KEEP**: PARBAUGHS-specific (production-risk boundaries, working infrastructure, role definitions, operational context). Cannot be replaced by Superpowers OR ECC.
- **DROP**: Overlaps with a Superpowers OR ECC skill. Document which plugin's skill replaces it.
- **MIGRATE**: Concept correct, implementation should rebuild on Superpowers/ECC primitives.

**KEEP list MUST include at minimum:**
- **AMD-018** — 11-gate push exception list (Cloud Functions, Firestore rules, auth providers, payment economy, IT Glue, secrets). PARBAUGHS-specific production risk boundaries.
- **AMD-022** — inter-agent task queue infrastructure. Real working cron tasks depend on this.
- **AMD-023** — approval pipeline reliability (downloads-watcher decision-JSON flow). Real working infrastructure.
- **AMD-024** — architecture / AI Engineer agent role definition.
- **Test accounts**: smoke@parbaughs.test in smoke-test-league.
- **Caddy Notes discipline**: member-visible release notes pattern.
- **Repo structure + templates/dashboards/ + scaffold-from-templates.sh + verify-approval-pipeline.sh** from prior remediation.

Archive (don't delete) dropped substrate to `.claude/state/archived-substrate-2026-05-18/` with README explaining replacement.

#### 0.6 — CLAUDE.md rewrite (≤ 15k chars)

Current CLAUDE.md is 67.9k chars; Claude Code warns about it. Rewrite to ≤ 15k. Content:
- KEEP list (AMD-018, 022, 023, 024 + operational context)
- Founder operating preferences distilled (3-5 sentences each: P1-P9 below)
- Pointer to Superpowers for methodology workflow
- Pointer to ECC for security (AgentShield) + extended skill library
- Coexistence-policy reference (which plugin owns which surface, from 0.4 if YELLOW)
- Founder Verification Packet requirement
- Taste rubric link
- Data Truthfulness gate

Commit. Run `claude --version` in fresh session — verify "Large CLAUDE.md" warning absent.

#### 0.7 — Confirm AgentShield works on this repo

Run baseline: `npx ecc-agentshield scan`. Capture output to `.claude/state/security/baseline-{ts}/agentshield-baseline.txt`. Document any HIGH/CRITICAL findings as Phase 0 backlog (to be resolved before goal close per P8).

Phase 0 is COMPLETE when all six sub-steps committed + compatibility verdict is GREEN or YELLOW + CLAUDE.md ≤ 15k + AgentShield baseline captured.

## FOUNDER OPERATING PHILOSOPHY (distilled — in CLAUDE.md after rewrite)

### P1. Depth-of-research over speed-of-closure
"I looked into it" is rejected. Evidence required: web-search citations, simulation results, hindsight, OSS comparison.

### P2. Emulation + simulation before live application
Spin up isolated copy in scratch. Run end-to-end. Vision-verify. Compare. Only then apply to real path.

### P3. Hindsight + foresight in every ship-close retrospective
HINDSIGHT: "How could this have been done better?" FORESIGHT: "What breaks at 10x? What would a senior eng at Stripe/Linear/Vercel say?"

### P4. Open-source FIRST, paid LAST
Web-search OSS equivalents BEFORE paid SaaS. Paid requires Founder approval via task-queue/founder/. Prefer custom-built when build cost < 2x integration cost.

### P5. "Outside the box" enumeration
NOT "ask Founder" and NOT "use most obvious approach." Default: 3+ distinct approaches including one non-obvious. Pick most appropriate. Document why. Propose rejected alternatives in retrospective.

### P6. Time is not the constraint; truth is
NO turn-count caps. NO token-budget caps (Founder authorized unlimited for this goal). Stop ONLY when DONE WHEN truthfully met, genuine Founder-presence blocker, or workflow-judged re-scope.

### P7. Competitive benchmarking — passing score 9.5/10
Industry-leader-comparable per dimension (typography, hierarchy, density, motion), NOT copy of industry visual style. PARBAUGHS keeps its own identity. ≥ 9.5 = "shippable next to Linear and Stripe." Below 9.5 → Taste bubble rejects.

Reference companies:
- **Dashboards**: Linear, Vercel, Stripe, Datadog, Sentry, PostHog, Grafana, Plausible, Cloudflare, Supabase
- **Status banners**: Vercel status, Cloudflare status, Datadog incidents, GitHub system status, AWS health
- **Approval/review**: GitHub PR review, Linear cycle review, Figma comments, Vercel deploy preview
- **List/filter/sort**: Linear issues, GitHub PRs, Notion databases, Airtable
- **Empty/loading/error states**: Linear, Stripe, Vercel, Notion
- **Typography + design systems**: Linear, Stripe, Vercel, Apple HIG, Material Design 3, Radix Themes, shadcn/ui
- **Token/cost meters**: Vercel usage, OpenAI usage, Anthropic console usage, Stripe billing, AWS Cost Explorer, GitHub Actions usage, **ECC's own ecc_dashboard.py (reference implementation)**
- **Pie chart / data attribution**: Datadog cost breakdown, AWS Cost Explorer, GCP billing, Vercel team usage breakdown

PARBAUGHS does NOT need to look like any of these. Each dimension must score on par with the best in that dimension.

### P8. Security + privacy + abuse-prevention as ship-blocking
The Founder has chosen FULL P8. **AgentShield is the primary tool — Phase 0 verifies it works, every commit runs it, RED findings block.**

Every ship-close writes a SECURITY block to retrospective:

```
SECURITY + PRIVACY + ABUSE BLOCK
---------------------------------
Surface: [name]
Data classification: [public / authenticated / sensitive / PII / financial]

AgentShield scan result: [path to scan output]
- Secrets detection (14 patterns): [PASS/FAIL/N/A + findings]
- Permission audit: [PASS/FAIL/N/A + findings]
- Hook injection analysis: [PASS/FAIL/N/A + findings]
- MCP server risk profile: [PASS/FAIL/N/A + findings]
- Agent config review: [PASS/FAIL/N/A + findings]

Privacy:
- Privacy policy coverage of this surface's data flows
- Data storage location
- Data retention + deletion path
- Third-party data sharing

Security headers (where applicable):
- CSP / HSTS / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / Frame-Options

OWASP Top 10 (2021) basics (supplementing AgentShield):
- A01-A10 each: documented status or N/A with reason

Bundle exposure scan:
- .env in client bundle
- API keys in frontend (Firebase web SDK keys public by design — noted)
- Secrets in git log
- API responses leaking sensitive data
- Logs leaking secrets

Abuse + rate limiting:
- Per-actor rate limits on backend touchpoints
- Cost ceiling alerts
- Auth abuse rate-limits (signup, password reset, OTP)

OVERALL SECURITY VERDICT: [GREEN / YELLOW / RED]
- GREEN ships
- YELLOW needs Founder approval via task-queue/founder/
- RED blocks
```

P8 tooling installed in Phase 0:
- AgentShield (`npx ecc-agentshield scan`) — primary scanner from ECC
- Either trufflehog OR gitleaks as supplementary pre-commit hook (AgentShield runs scoped to .claude config, supplementary scanner runs on app code commits)
- npm audit baseline + ongoing
- Test against a fixture commit that MUST be rejected

### P9. Data truthfulness — every visible value traces to source
Vision verification confirms a surface RENDERED. P9 confirms RENDERED THE TRUTH. Separate gates.

#### P9.1 — Every visible value traces to source

```
DATA TRUTHFULNESS TRACE
-----------------------
Surface: [name]
Value shown: [literal text/number as rendered]
Aggregate field consumed: [path to .claude/state/aggregates/*.json field]
Aggregator script producing field: [scripts/aggregate-*.py or equivalent]
Underlying source(s): [actual data — test log path, npm audit output, git command, file count]
Source value at trace time: [literal]
Aggregator output value at trace time: [literal]
Display value at trace time: [literal value rendered, captured via screenshot + Read]
End-to-end match: PASS if all three agree, FAIL otherwise
```

#### P9.2 — Zeros and dashes default to FAIL until proven legitimate
`0`, `-`, `--`, `N/A`, "0 of 0", empty string, `—`: default treatment is FAIL UNTIL PROVEN LEGITIMATE. Agent must demonstrate either:
- Underlying source is genuinely zero/empty (trace required)
- Intentional empty state with P7-quality copy
- Loading state correctly shown while data in transit

Silent fallback-to-zero in render code is a BUG TO FIX.

#### P9.3 — Producer/consumer parity check
Every aggregate JSON: producing script writes field names consumer reads. Schema version matches. generated_at recent. Shape matches.

#### P9.4 — Founder Verification Packet (recursion-breaker)

Before goal closes, agent emits packet to `.claude/state/task-queue/founder/dashboard-completion-verification.md`:
1. Live dashboard file:// URL
2. Five specific VISUAL values for Founder to verify (not engineering questions)
3. Specific approval string: `FOUNDER-APPROVED-{TIMESTAMP}`

Acceptable verification asks (visual, Founder can answer with eyes):
- "Token meter shows X — does that roughly match this week's Anthropic console usage?"
- "Pie chart has three slices — agent role, work category, session. Do the proportions look plausible?"
- "Approvals banner shows 'N pending' — does that match your downloads folder count?"
- "Round-trip-last-pass timestamp X — within last hour?"
- "Security health banner GREEN/YELLOW/RED — match what AgentShield just reported?"

UNACCEPTABLE asks (engineering judgment — not Founder's job):
- "Does this Firestore rule cover proposals collection?"
- "Is this aggregator schema correctly versioned?"
- "Would you accept a 0.3s regression?"

#### P9.5 — Automated truthfulness self-check
Every aggregator gets `--self-test` mode wired into post-commit hook. Asserts output non-zero where source is non-zero. NO silent failures.

#### P9.6 — Confidence threshold for retiring the packet
Packet is recursion-breaker for THIS goal. Retire after THREE consecutive ships where:
- Automated truthfulness self-check passes
- Founder's visual verification matches agent's claim
- No surprises in 48 hours

After three matches, substrate skips Founder verification on routine ships. Large-scope or post-incident ships still trigger it.

## VISION + DESKTOP CONTROL AUTHORIZATION

### V1. Vision-based verification REQUIRED
Pattern: capture via Playwright OR superpowers-chrome OR ECC's testing tools → save PNG → Read tool the PNG → describe what is VISIBLE → compare against expected → record in retrospective. Skipped = Critic bubble REJECTS.

### V2. Desktop control authorized within scope
Authorized: Playwright + Chrome user-data-dir (X.com auth carries); superpowers-chrome MCP; ECC's testing infrastructure; PowerShell + admin installers (consent for elevated, agent proceeds without prompt for non-elevated); Git including push (with AMD-018 11-gate); editing anywhere under repo; cron + smoke + FIQ; opening + screenshotting any file:// URL; local emulators (Firebase emulator, scratch dirs); ffmpeg + yt-dlp; visiting competitor sites for P7 captures; security scanners (trufflehog, gitleaks, npm audit, AgentShield).

Out-of-scope (requires task-queue/founder/ pre-auth): credentials / IT Glue / password manager mod; system-wide settings outside workspace; Firestore rules / Cloud Function deploys (AMD-018 exception list); Founder biometric / MFA; anything outside C:\Users\Zach\smoky-mountain-open\.

### V3. Less friction
Don't ask when V2 authorizes. Surface only on out-of-scope OR true Founder-presence-required. Founder is NOT senior engineer; do not surface engineering trade-offs.

## MAIN-FLOWS RE-REVIEW (M1-M7)

Prior 18-iteration polish loop produced false APPROVAL on main-flows.html vs Janowiak ToDesktop reference at https://x.com/DaveJ/status/2053867258653339746. M-phase starts fresh.

- **M1**. Web-search any video-analysis capability (long-form video skill, ffmpeg motion analysis, frame-by-frame extraction, ECC's manim-video or remotion-video-creation skills). Use the best available.
- **M2**. Decompose Janowiak across: composition + spatial relationships, interaction model (hover/click/focus), motion/transition timing curves, color + density + contrast, editorial emphasis. Multiple passes — frame-by-frame, then state-by-state, then motion-by-motion.
- **M3**. Produce `.claude/state/main-flows-v2/janowiak-decomposition-2026-05-18.md` characterizing reference such that a senior designer could reconstruct intent without watching.
- **M4**. Score current main-flows.html against decomposition using P7 format. Document per-dimension gap.
- **M5**. Iterate main-flows.html to ≥ 9.5/10 against Janowiak decomposition AND 3+ industry peers (Excalidraw, Eraser.io, Whimsical, Stripe Atlas, Cloudflare Architecture). Single-reference matching FORBIDDEN (failure mode of prior loop).
- **M6**. Vision-verify every iteration (V1). Apply P9 if surface displays data. Score every iteration.
- **M7**. Document in retrospective: full TASTE SCORE + side-by-side PARBAUGHS vs Janowiak vs 2+ peers.

## PRE-RESEARCH (mandatory before authoring any code)

1. `claude --version`. Confirm Superpowers + superpowers-chrome + ECC + AgentShield active via `/plugin list` and `npx ecc-agentshield --version`.
2. Web-search "Superpowers plugin best practices 2026" — current usage patterns.
3. Web-search "everything-claude-code ECC plugin usage 2026" — current usage patterns and known issues.
4. Web-search "superpowers ECC plugin conflict resolution claude code" — if Phase 0.4 surfaces YELLOW, prior community knowledge may exist.
5. Web-search "Playwright x.com twitter video element selector 2026" + "yt-dlp 2026 twitter video extraction" for Janowiak.
6. Web-search "open source token counter Claude API usage tracking 2026" — token meter wire-up.
7. Web-search "pie chart d3 vs recharts vs chart.js 2026 dashboard" — pie chart for token attribution.
8. Web-search + Playwright-capture from Linear, Vercel, Stripe, Datadog, Sentry, PostHog. Save to `.claude/state/design-research/competitive-references/dashboards/`.
9. Web-search + capture token/usage meter references (Vercel, OpenAI, Anthropic console, Stripe billing, AWS Cost Explorer, GCP billing, GitHub Actions usage).
10. Web-search + capture pie chart references (Datadog cost breakdown, AWS Cost Explorer, Vercel team usage breakdown).
11. **Inspect ECC's `ecc_dashboard.py` source code** — it's a reference Tkinter implementation of agent monitoring dashboard. Read it. Document patterns relevant to PARBAUGHS dashboard.
12. Run baseline `npx ecc-agentshield scan` + `npm audit`. Capture to `.claude/state/security/baseline-{ts}/`.
13. Read in repo (read-only for SCOPE OUT items):
    - scripts/visual-audit/capture-janowiak-reference.mjs
    - scripts/regen-all.sh + all scripts/regen-*.py
    - scripts/inject-health-banners.py
    - scripts/scaffold-from-templates.sh
    - .claude/state/audit-report-2026-05-15.md
    - .claude/state/remediation-report-2026-05-15.md
    - All templates/dashboards/*.template.html
    - tests/round-trip-test.py
    - scripts/visual-audit/verify-*.mjs
    - scripts/cron/sidecar* + scripts/aggregate-token-usage.py
    - firestore.rules (read-only)
    - firestore.indexes.json (read-only)
    - functions/ (read-only)
14. For each pattern introduced/extended, identify 2+ high-quality OSS implementations on GitHub.
15. Cite ALL sources in post-push retrospective.

## GOAL

Complete dashboard ecosystem to industry-leader-comparable quality such that ALL durably true from fresh checkout:

- Superpowers + ECC + AgentShield installed; compatibility verdict GREEN or YELLOW; coexistence-policy documented
- CLAUDE.md ≤ 15k chars
- Every dashboard HTML in docs/reports/ renders LIVE TRUTHFUL data; NO "awaiting data...", NO unexplained zeros/dashes
- Every banner reflects real underlying state, refreshed within 5 min, P9 trace
- **Token meter displays actual cumulative spend** (week-to-date, day-to-date, last-ship), source-traceable
- **Token attribution pie chart**: three toggleable views (agent role / work category / session), P9-traced slices
- Every interactive element WORKS — V1 + P9 verified
- 12 Janowiak frames + observed_state
- Janowiak decomposition document complete
- main-flows.html ≥ 9.5/10 against decomposition + 2+ peers
- Full smoke test passes + V1-confirmed + concrete reports
- Full FIQ pass
- Round-trip test passes
- All visual-audit scripts pass
- P8 security: AgentShield + OWASP basics + supplementary secret scanner + Firestore rules audit + rate limits — zero RED
- P9 Founder Verification Packet approved by Founder
- Tree clean after every ship (no dirty files lingering — per-ship verification)
- Every commit going forward includes SECURITY block + DATA TRUTHFULNESS TRACE
- Every UI surface taste-scored ≥ 9.5/10

GATE: This goal BLOCKS all PARBAUGHS app feature work. W1.S1 does not open until this closes + Founder approves packet.

## TOKEN METER + PIE CHART (Phase T — the audition centerpiece)

The Founder explicitly: "I just need a token counter and pie chart showing who is using tokens and how much."

### T1. Investigate the token source-of-truth chain
Read scripts/cron/sidecar*. Confirm what it captures. Read scripts/aggregate-token-usage.py. Match fields written vs read. **Inspect ECC's `ecc_dashboard.py` for how it monitors agent token usage — borrow patterns where applicable.** Document gap that has caused the meter to never update in `.claude/state/dashboard-audit-2026-05-18/TOKEN-METER-INVESTIGATION.md`.

### T2. Tagging design (three orthogonal tags per spend event)
- **agent_role**: main / polish / architecture / test-qa / etc.
- **work_category**: dashboard work / app feature work / audits / retros / etc.
- **session_id**: ship/session this event belongs to

Tagging must happen at moment of consumption. Investigate retroactive reconstruction feasibility from existing logs. If yes: backfill script. If no: instrument going forward. Document choice + rationale.

### T3. Competitive scan for token/usage meters + pie charts
Capture: Vercel usage, OpenAI usage, Anthropic console usage, Stripe billing, AWS Cost Explorer, GCP billing, GitHub Actions usage, **ECC's ecc_dashboard.py screenshots**. Document patterns. Pick best fit for PARBAUGHS. Document why.

### T4. End-to-end P9 truthfulness trace
From Founder's actual Anthropic console usage (Founder pastes screenshot OR grants Playwright access to console.anthropic.com via Chrome profile per V2) → sidecar → aggregator → dashboard render. Full trace.

### T5. Fix every broken link
Aggregator produces correct fields. Consumer reads correct fields. NO silent fallback-to-zero. Schemas match. Freshness accurate.

### T6. Dashboard token meter displays
- Cumulative week-to-date spend (reference comparison to console)
- Cumulative day-to-date
- Last-ship spend
- Freshness timestamp
- Three-view toggleable pie chart: agent role / work category / session
- Each value carries P9 trace in retrospective

### T7. Taste score ≥ 9.5/10 against T3 references

### T8. Token meter is ONE of the five values in Founder Verification Packet

## PHASES (ordered; later phases require earlier phases green)

### PHASE 0 — Dual install + compatibility + substrate audit + CLAUDE.md rewrite (BLOCKING)
Per METHODOLOGY section above.

### PHASE A — Inventory + diagnostic + competitive baseline + security baseline + data-truthfulness baseline
Surface current state of every dashboard, aggregate, cron, aggregator. V1 per surface. P9 baseline per visible value. P7 competitive baseline (3+ reference dashboards captured). P8 security baseline (AgentShield + supplementary scanner + npm audit). Output: `.claude/state/dashboard-audit-2026-05-18/INVENTORY.md`.

### PHASE B — Live data wiring
Per item: P2 emulate in scratch, then apply, V1, P9 trace, P7 score ≥ 9.5, P8 AgentShield check.
- B1. test-health aggregator wired + verified
- B2. security-health aggregator wired (becomes the AgentShield surface)
- B3. approvals-pipeline aggregator wired
- B4. architecture-review aggregator OR intentional empty state per Linear/Stripe pattern
- B5. round-trip-last-pass STALE indicator
- B6. Each aggregator writes meta block (generated_at, source_files, schema_version)
- B7. Post-commit hook runs every aggregator + regen + inject + smoke + AgentShield + P9 self-check. NO silenced failures.

### PHASE T — Token meter + pie chart (per T1-T8 above)
Parallel to A/B/C/D/M.

### PHASE C — Interactive UI completion
Every clickable verified via Playwright + V1 (before/after screenshots Read) + P9 trace if click changes displayed value. Fix at root cause (P2 emulate first). Approve/Reject flows propagate end-to-end. Filter/sort/search/mobile-375px, all P7 ≥ 9.5.

### PHASE D — Janowiak frame capture (parallel to A/B/C/M)
Per V2: FIRST try Playwright + Founder's Chrome user-data-dir. SECOND yt-dlp/ffmpeg. THIRD /i/status/ variant. FOURTH video.twimg.com direct. FIFTH screen-record + post-process. 5+ approaches before STOP RULE. 12 frames at evenly-spaced timestamps. manifest.json with observed_state from agent Read-tool inspection.

### PHASE M — Main-flows deep re-review (per M1-M7)
Parallel to A/B/C/D.

### PHASE E — Smoke test (cross-browser + real Firebase, 12 scenarios)
Confirm + run + full stdout/stderr to `.claude/state/test-runs/{ts}/`. Root-cause fix any failure (P2 emulate first). V1 confirm each scenario's final state. Concrete reports: exact command, exit code, log path, timestamp, environment.

### PHASE F — FIQ + Firestore rules + Cloud Function + bundle exposure
- firebase deploy --only firestore:indexes --dry-run zero pending
- All composite indexes Active
- Firestore rules audit per P8.2 A01 — every collection → rule path + verdict in coverage matrix
- Cloud Function security audit (AgentShield surfaces config issues; manual audit confirms)
- Bundle exposure scan (npm run build → grep dist/ for secret patterns; DevTools network for hidden routes)

### PHASE G — Visual + structural audits
- tests/round-trip-test.py exit 0
- scripts/visual-audit/verify-scroll-reachability.mjs exit 0
- scripts/visual-audit/verify-all-flows-light-up.mjs exit 0
- PROP-012 visual review per surface, V1
- Design-bot + P7 Taste ≥ 9.5 per surface

### PHASE H — Durability proof (anti-snapshot-PASS)
rm -rf docs/reports/_assets docs/reports/*.html ; bash scaffold ; bash regen-all. After: every dashboard present + populated, V1 confirms, P7 scores hold, P9 traces hold (re-trace every prominent value), P8 verdicts hold. verify-approval-pipeline.sh exit 0 twice.

### PHASE I — Polish + final UI pass
Linear / Vercel / Stripe / ECC dashboard patterns pulled in. Every item P7 ≥ 9.5.
- I1. Typography, spacing, alignment (Linear / Stripe / Apple HIG)
- I2. Empty states (Linear / Stripe / Notion) — P9 confirms "empty" = actually-empty-source
- I3. Loading states (Linear / Vercel / shadcn skeleton)
- I4. Error states with next-action (Stripe / Vercel)
- I5. Dark mode consistency (Linear / Vercel / ECC dashboard)
- I6. Cross-page nav consistent
- I7. Tree-clean discipline verified per ship-close

### PHASE J — Consolidation
- J1. HINDSIGHT per phase
- J2. FORESIGHT per phase (10x, 100x scale + senior-eng-at-peer critique)
- J3. OSS consolidation
- J4. P7 final taste audit
- J5. P8 final security audit (AgentShield + all supplementary)
- J6. P9 final truthfulness audit + DATA-TRUTH-MATRIX.md all TRUTHFUL
- J7. Founder Verification Packet emitted. Goal HOLDS pending Founder approval in file.
- J8. Document J1-J7 in `.claude/state/dashboard-audit-2026-05-18/CONSOLIDATION.md`.

## DONE WHEN (validator-checkable, every condition required)

### Infrastructure (Phase 0)
- D1. Superpowers + superpowers-chrome installed and verified active.
- D2. ECC plugin installed; rules/common + rules/typescript + rules/python copied to ~/.claude/rules/ecc/.
- D3. AgentShield runs successfully (`npx ecc-agentshield scan` exits 0 or 2 with documented findings, not transport errors).
- D4. Phase 0.4 compatibility verdict committed at `.claude/state/phase-0/compatibility-verdict.md`: GREEN or YELLOW (RED auto-rolls-back and surfaces).
- D5. If YELLOW: coexistence-policy.md committed documenting which plugin owns which surface.
- D6. `.claude/state/substrate-audit-2026-05-18.md` exists with KEEP/DROP/MIGRATE classification.
- D7. CLAUDE.md ≤ 15k chars; "Large CLAUDE.md" warning absent at session start.
- D8. AMD-018, AMD-022, AMD-023, AMD-024 confirmed in KEEP list with rationale.

### Dashboards
- D9. ls docs/reports/*.html shows >= 10 files, each > 5KB.
- D10. grep -r "awaiting data" docs/reports/*.html returns ZERO hits.
- D11. grep for data-fq-banner-meta in dashboard.html returns 4+ unique anchors.
- D12. Every aggregate JSON has generated_at < 1 hour old after final regen.
- D13. scripts/verify-approval-pipeline.sh exit 0 run twice in sequence.
- D14. tests/round-trip-test.py exit 0.
- D15. scripts/visual-audit/verify-scroll-reachability.mjs exit 0.
- D16. scripts/visual-audit/verify-all-flows-light-up.mjs exit 0.

### Token meter + pie chart
- D17. Dashboard displays cumulative week-to-date token spend, non-zero, current. P9 trace committed.
- D18. Dashboard displays day-to-date + last-ship token spend, current. P9 trace.
- D19. Pie chart present with three toggleable views (agent role / work category / session). Each slice P9-traced.
- D20. Token meter values match Founder's actual Anthropic console within reasonable tolerance (document tolerance + reasoning).

### Janowiak + main-flows
- D21. 12 PNGs > 5KB in `.claude/state/main-flows-v2/janowiak-reference-frames/`.
- D22. manifest.json valid, 12 entries, observed_state non-empty per entry.
- D23. `.claude/state/main-flows-v2/janowiak-decomposition-2026-05-18.md` exists, characterizes across 5 dimensions.
- D24. main-flows.html scored ≥ 9.5/10 against Janowiak + 2+ peers; side-by-side committed.

### Smoke + FIQ + security
- D25. Smoke test exit 0 (12 scenarios × 4 browsers) + V1-confirmed + concrete reports per P8.7 in `.claude/state/test-runs/{ts}/`.
- D26. FIQ status pass.
- D27. `.claude/state/security/baseline-{ts}/` has AgentShield + npm audit + supplementary scanner outputs.
- D28. Every ship-close has SECURITY block with verdict GREEN (or Founder-approved YELLOW). AgentShield scan referenced.
- D29. Pre-commit + pre-push secret scanner (supplementary to AgentShield) installed and REJECTS fixture commit with intentional secret.
- D30. Firestore rules coverage matrix committed.
- D31. **AgentShield zero CRITICAL findings on final goal-close commit.**

### Data truthfulness
- D32. `.claude/state/dashboard-audit-2026-05-18/DATA-TRUTH-MATRIX.md` exists — every rendered value mapped source → aggregator → display, status TRUTHFUL (or Founder-approved exception).
- D33. Dashboard renders ZERO unexplained "0" / "—" / "N/A" placeholders across all surfaces.
- D34. Every aggregator has --self-test mode wired into post-commit hook, exits 0 on parity.

### Durability + tree-clean
- D35. PHASE H durability test passes — clean rebuild produces full working dashboard, V1-confirmed.
- D36. git status --porcelain empty after every ship-close.
- D37. Final commit pushed to origin/main; AMD-018 11-gate green.

### Quality + verification
- D38. Every interactive element verified working via Playwright + V1.
- D39. PROP-010 + design-bot APPROVE on every dashboard surface.
- D40. `.claude/state/design-research/competitive-references/` has 3+ subdirs (dashboards, usage-meters, pie-charts at minimum), each with 3+ screenshots + notes.md.
- D41. Every UI surface ship-close has TASTE SCORE ≥ 9.5/10 OR Founder-approved gap note.
- D42. TASTE-AUDIT.md committed.

### Retrospective + verification
- D43. Every ship-close retrospective has CITATIONS section.
- D44. Non-trivial ships have SIMULATION section.
- D45. CONSOLIDATION.md exists at `.claude/state/dashboard-audit-2026-05-18/CONSOLIDATION.md`.
- D46. Decision bubble retrospectives per ship-close (8 bubbles).
- D47. `.claude/state/goal-final-report-dashboard-completion-{ts}.md` committed.

### Founder verification (recursion-breaker)
- D48. `.claude/state/task-queue/founder/dashboard-completion-verification.md` exists with 5 traced values (4 visible-truth + 1 token meter), screenshots, approval-string field.
- D49. Founder has written `FOUNDER-APPROVED-{TIMESTAMP}` into the file. Goal CANNOT close without this.

## VERIFY (validator runs these exact commands each turn)

```
D1: /plugin list | grep -E "superpowers|superpowers-chrome" (both active)
D2: ls ~/.claude/rules/ecc/ (common + typescript + python subdirs exist)
D3: npx ecc-agentshield --version (returns version)
D4: ls .claude/state/phase-0/compatibility-verdict.md (exists, contains GREEN or YELLOW)
D5: if YELLOW: ls .claude/state/phase-0/coexistence-policy.md (exists)
D6: ls .claude/state/substrate-audit-2026-05-18.md (exists, non-empty)
D7: wc -c CLAUDE.md (< 15000)
D9: ls docs/reports/*.html | wc -l (>= 10); find docs/reports/*.html -size +5k | wc -l (>= 10)
D10: grep -r "awaiting data" docs/reports/*.html | wc -l (== 0)
D11: grep -o 'data-fq-banner-meta="[^"]*"' docs/reports/dashboard.html | sort -u | wc -l (>= 4)
D12: every JSON in .claude/state/aggregates/ has generated_at within 60 min
D13: bash scripts/verify-approval-pipeline.sh && bash scripts/verify-approval-pipeline.sh (both exit 0)
D14: python tests/round-trip-test.py (exit 0)
D15+D16: visual-audit scripts (both exit 0)
D17-D20: Playwright open dashboard, screenshot token region + pie chart, Read screenshots — values non-zero numeric + 3 toggle states confirmed
D21: ls .claude/state/main-flows-v2/janowiak-reference-frames/*.png | wc -l (== 12), all > 5KB
D22: python json-load manifest.json (valid + 12 + observed_state non-empty)
D23: ls + grep dimensions in janowiak-decomposition-2026-05-18.md
D24: grep TASTE in main-flows retrospective for >= 9.5
D25: smoke test exit 0 + ls .claude/state/test-runs/{ts}/ has command + exit + log + meta per scenario
D26: firebase indexes dry-run zero pending
D27: ls .claude/state/security/baseline-*/ has AgentShield + npm-audit + supplementary scanner
D28: grep ship retrospectives for SECURITY block GREEN (or approved YELLOW) referencing AgentShield
D29: bash test-fixture-commit-with-secret.sh — scanner rejects, commit blocked
D30: ls firestore-rules-coverage-{ts}.md
D31: npx ecc-agentshield scan (zero CRITICAL on final commit)
D32: ls DATA-TRUTH-MATRIX.md + parse status (all TRUTHFUL)
D33: Playwright sweep + Read each screenshot + assert no unexplained "0" / "—" / "N/A"
D34: bash scripts/aggregate-*.py --self-test (all exit 0)
D35: rm -rf docs/reports/_assets docs/reports/*.html ; bash scaffold ; bash regen-all ; re-run D9+D10
D36: git status --porcelain (empty)
D38: grep ship retrospectives for V1 observation blocks per click
D40: ls competitive-references/ (3+ subdirs, each 3+ PNGs + notes.md)
D41: grep ship retrospectives for TASTE SCORE >= 9.5 (or Founder-approval)
D48: ls task-queue/founder/dashboard-completion-verification.md (exists with packet)
D49: grep "FOUNDER-APPROVED-" in verification file (Founder marked approved)
```

## OUTPUT (per turn + final)

Per turn:
- Atomic commits tagged with phase prefix ([phase-0], [phase-A], [token-T], [janowiak-D], [mainflows-M], [security-P8] etc.)
- Post-commit hook fires regen + AgentShield scan + truthfulness self-test (real, not silenced — failures emit visible stderr)
- Decision bubble transcript (8 bubbles per DELIBERATION GATE below)
- V1 observation blocks
- CITATIONS + SIMULATION + HINDSIGHT + FORESIGHT + TASTE SCORE + SECURITY + DATA TRUTHFULNESS TRACE blocks per applicable ship

Final report `.claude/state/goal-final-report-dashboard-completion-{ts}.md`:
1. What changed + files + Caddy Notes + skills referenced (note Superpowers vs ECC origin)
2. Roadmap % complete
3. Bubble transcripts (plain English, readable to non-engineer Founder)
4. Workflow doc test confirmed
5. Growth report: skills + patterns + governance refinements
6. Vision verification appendix
7. Hindsight + foresight appendix
8. OSS consolidation proposals appendix
9. Citations + alternatives-considered appendix
10. Competitive benchmarking appendix
11. Security + privacy + abuse-prevention appendix (AgentShield findings + remediation)
12. main-flows decomposition + iteration history appendix
13. Data truthfulness matrix appendix
14. Token meter wire-up appendix
15. **Plugin coexistence retrospective: what worked, what didn't, recommendation for going forward (Superpowers + ECC / one only / different config)**
16. Founder Verification Packet (committed) + Founder's recorded approval

## STOP RULES

1. ALL DONE WHEN met (including D49 Founder approval) → close.
2. Phase 0.4 compatibility RED → restore backup, surface to Founder with three options, continue parallel work that doesn't require plugins.
3. Real AMD-015 escalation (true Founder-presence-required action; exception-list deploy; architectural ambiguity unresolvable by 3+ agents + 3+ OSS comparisons + 2+ simulations + 3+ competitive references) → Surface, continue OTHER phases.
4. 5+ documented attempts on single sub-issue without progress → surface, continue other phases.
5. Janowiak: 5+ distinct creative approaches all fail → surface, continue dashboard phases.
6. main-flows: 5+ iterations without crossing 9.5 → surface to Founder with current state, references, gap, alternative. Continue other phases.
7. P8 RED security finding (from AgentShield CRITICAL or supplementary scanner) → surface, affected surfaces hold, continue unaffected.
8. P9 trace impossible for critical value → surface with trace-as-far-as-possible + proposed fix. Continue unaffected.

NOT stop rules:
- Turn count (P6 — truth over time)
- Token budget (Founder authorized unlimited)
- "Most banners working"
- "Looks better than before"
- "Founder might want to review"
- "Cron will catch up next cycle"
- Single test failure (severity-triage then continue)
- Pacing concern
- Single phase complete
- "Need Founder for X login" — try V2 user-data-dir first
- "We've been at this a long time"
- "We got the gist"
- "Easy parts are done"
- "Taste score 9.4, close enough" — iterate to 9.5
- "Security YELLOW, probably fine" — surface to Founder
- "AgentShield says CRITICAL but it might be a false positive" — verify with manual review + surface to Founder if disputing
- "0 might actually be 0" — P9 trace required
- "Packet sent, we can close" — Founder must APPROVE in file
- **"Compatibility was YELLOW but one of the plugins just works better, drop the other" — NO. Founder picked dual-install. Surface to Founder if reconsidering.**

## DELIBERATION GATE (8 bubbles, quorum 3)

Before each ship-close commit AND before declaring goal DONE, run bubble vote:

- **Engineer**: technical correctness ("did this code do what it claims?")
- **Critic**: claim-vs-reality match. V1 vision check. P1 research check. P2 simulation check.
- **Performance/Load**: scaling + foresight ("what breaks at 10x?")
- **Data Integrity**: aggregate timestamps reflect live state.
- **Research Depth**: P1 + P4 + P5 satisfied — citations, alternatives, simulations.
- **Taste**: P7 satisfied — competitive references consulted, ≥ 9.5/10, peer role identity ("would I ship this at Linear/Vercel/Stripe?").
- **Security**: P8 satisfied — SECURITY block GREEN, AgentShield scan run + zero CRITICAL, OWASP basics scanned, no secrets, rate limits, concrete reports. Adopt identity of senior security engineer at Stripe/Cloudflare/1Password/Auth0. "Would I let this commit land?"
- **Data Truthfulness**: P9 satisfied — every visible value has trace, no unexplained zeros/dashes, producer/consumer parity. Adopt identity of senior data engineer at Datadog/Snowflake. "Would I trust this number? Would I trust this dashboard?"

Quorum: 3. Plain-English transcripts attached.

Reject conditions:
- Critic: "agent imagined" or "skipped vision check"
- Data Integrity: "stale aggregate masquerading as fresh"
- Research Depth: "no citations / alternatives / simulation"
- Taste: "no references" or "< 9.5 without Founder gap-approval"
- Security: "no SECURITY block" or "AgentShield not run" or "OWASP not scanned" or "secret in diff" or "no rate limit"
- Data Truthfulness: "value rendered without trace" or "0/— without source verification"

## ANTI-PATTERNS TO AVOID

1. Do not declare PASS on validator state that won't survive clean rebuild.
2. Do not inject markup into uncommitted ad-hoc DOM positions.
3. Do not write observed_state from imagination.
4. Do not self-authorize governance amendments.
5. Do not pattern-match "8/8 PASS" closure language.
6. Do not declare a UI surface working based on exit codes / grep / lint alone.
7. Do not ask Founder when V2 authorizes.
8. Do not skip P1 depth-of-research.
9. Do not skip P2 simulation.
10. Do not skip P3 hindsight + foresight.
11. Do not adopt paid services when P4 OSS exists.
12. Do not pick first-obvious when P5 enumeration would surface better.
13. Do not stop on turn count or token count.
14. Do not declare design polish complete without P7 references + ≥ 9.5.
15. Do not let taste scores stagnate.
16. Do not consult only ONE reference per surface.
17. Do not skip P8 SECURITY block — must include AgentShield scan output reference.
18. Do not report test results as summaries.
19. Do not bypass the secret scanner.
20. Do not silently approve YELLOW security verdicts.
21. **Do not approve a beautiful empty surface.** Aesthetic + zero data = automatic reject regardless of taste rating.
22. **Do not let "0" / "—" / "N/A" defaults survive in render code.** Mask with intentional empty states OR fix the data path.
23. **Do not close on agent-only bubble approval.** Founder approval per D49 required.
24. **Do not lump token meter under "aggregator wire-up."** Phase T, own DONE WHEN, Founder verification.
25. **Do not surface engineering trade-offs to the non-engineer Founder.** Orchestration team makes engineering decisions.
26. **Do not leave dirty files lingering.** Per-ship verification, not end-of-goal afterthought.
27. **Do not silence AgentShield CRITICAL findings.** False-positive disputes get manual review + Founder surface.
28. **Do not auto-drop one of Superpowers or ECC if a conflict surfaces.** Founder picked dual-install. Surface for reconsideration.
29. **Do not stack ECC's full installer on top of the plugin install.** ECC's own README warns about this. Plugin + manual rules copy is the supported path.

## SCOPE OUT (do not touch)

- src/pages/, src/core/, functions/ (production app code) except where dashboard regen reads them, except where P8 audits read read-only
- firestore.rules, firestore.indexes.json (except read-only for FIQ + P8 audits)
- secrets, IT Glue, credentials
- W1.S1+ PARBAUGHS app ship work (gated by this goal)

## LAUNCH INVOCATION (paste this at /goal prompt after launching `claude --effort max --dangerously-skip-permissions`)

---BEGIN /goal PASTE---
/goal Self-install + execute. Step 1: move /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-18.md to .claude/state/dashboard-completion-spec-2026-05-18.md (commit). Step 2: read spec in full — it has 7 Phase 0 sub-steps + 12 phases + 49 DONE WHEN + 8 bubble deliberation gate + V1-V3 + P1-P9 + M1-M7 detailed inside. This /goal is just the launcher.

GATE: Audition before all PARBAUGHS app feature work. W1.S1 does not open until this closes AND Founder approves verification packet.

PHASE 0 (BLOCKING, 7 sub-steps in spec): backup ~/.claude → install Superpowers (/plugin install superpowers@claude-plugins-official + superpowers-chrome) → install ECC (/plugin marketplace add https://github.com/affaan-m/everything-claude-code + /plugin install everything-claude-code@everything-claude-code + manually copy rules/common+typescript+python to ~/.claude/rules/ecc/, do NOT run ./install.sh) → compatibility HARD GATE (enumerate collisions, test trigger correctness, verdict GREEN/YELLOW/RED, RED auto-rolls-back + surfaces) → substrate audit KEEP AMD-018/022/023/024 + repo work + Caddy Notes + test accounts → rewrite CLAUDE.md ≤ 15k → AgentShield baseline.

Then PHASES A-J + T + M parallel where deps allow:
A inventory + competitive + security + data-truthfulness baselines
B live data wiring (every banner ≥ 9.5 + P9 trace + AgentShield clean)
T TOKEN METER + PIE CHART (3 toggleable views: agent role / work category / session) — study ECC's ecc_dashboard.py
C interactive UI — every clickable V1 + P9
D Janowiak frames via 5+ creative approaches per V2
M main-flows fresh re-review ≥ 9.5 vs Janowiak + 2+ peers
E smoke 12 × 4 browsers + concrete reports
F FIQ + Firestore rules + Cloud Function + bundle exposure
G visual + structural ≥ 9.5
H durability proof (rm -rf + scaffold + regen)
I polish + tree-clean per ship
J consolidation + emit Founder Verification Packet

CONSTRAINTS: Superpowers methodology + ECC AgentShield + PARBAUGHS guardrails. P1 depth-of-research + P2 emulation + P3 hindsight/foresight + P4 OSS first + P5 outside-the-box + P6 NO turn/token caps (unlimited authorized) + P7 TASTE ≥ 9.5 + P8 FULL SECURITY (AgentShield primary) + P9 DATA TRUTHFULNESS + V1 vision required + V2 desktop control authorized + V3 less friction. 8-bubble gate quorum 3.

STOP RULES: ALL 49 DONE WHEN + Founder approves packet → close. Phase 0.4 RED → rollback + surface. AMD-015 real escalation → surface + continue. 5+ attempts on sub-issue → surface, continue. Janowiak 5+ creative paths fail → surface, continue. main-flows 5+ iterations without 9.5 → surface. AgentShield CRITICAL → surface, affected surfaces hold. P9 trace impossible → surface. NO turn/token-count stop. NO auto-drop one plugin if YELLOW — Founder picks.

NOT STOP: "most working", "looks better", "cron catches up", single failure, pacing, "9.4 close enough", "YELLOW probably fine", "0 might actually be 0" (trace required), "packet sent we can close" (Founder must write FOUNDER-APPROVED-{ts} in file).

Founder is NOT a senior engineer. Do not surface engineering trade-offs. Orchestration team owns engineering decisions. Founder decides taste/scope/values + verifies 5 visual values in packet.

Begin Phase 0.1 immediately. Validator checks 49 DONE WHEN every turn. Loop until truth + Founder approval, not time or tokens.
---END /goal PASTE---
