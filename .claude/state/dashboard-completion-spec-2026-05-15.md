# SPEC — Dashboard ecosystem completion + Janowiak capture + main-flows re-review + data truthfulness + token meter (gate before app work)

## SELF-INSTALL (first action on read)

This spec lives in C:\Users\Zach\Downloads\ when the agent first reads it. Before doing anything else, the agent MUST move itself into the repo:

```
mv /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-15.md /c/Users/Zach/smoky-mountain-open/.claude/state/dashboard-completion-spec-2026-05-15.md
```

After move, all subsequent references to this spec resolve at .claude/state/dashboard-completion-spec-2026-05-15.md. Commit the move as a tracked artifact (atomic commit: "spec(goal): install dashboard-completion-spec-2026-05-15 from Downloads").

If the file is already at .claude/state/ when the agent looks, skip the move and proceed.

## FOUNDER OBSERVATIONS FROM LAST SESSION (treat as priority signal)

The Founder reports three concrete failures from the last goal-close that this spec must remediate first:

### Observation 1: Dashboard shows zeros and dashes for everything

The prior goal-close declared fleet-average taste 7.80/10 and 6/6 UNANIMOUS APPROVE on the bubble vote, but the actual dashboard renders zeros and dashes for the data values. This is a regression-and-data-loss event that passed visual-regression checks because the visual test verified that *something rendered* without verifying that *what rendered was truthful*. Vision verification (V1) does not catch this class of failure; a new gate is required.

### Observation 2: Token counter has never updated

The sidecar cron task is operational per substrate but the dashboard token meter has never reflected actual spend across any of these ships. Either: (a) aggregator not producing output, (b) aggregator producing output that consumer doesn't read, (c) name/schema mismatch between producer and consumer, (d) display rendering but data path returns 0 because of (a)/(b)/(c). Token meter has its own dedicated DONE WHEN in this spec — it cannot be lumped under "all aggregators wired."

### Observation 3: Honest-delta agent self-reported overclaim from prior session

Agent committed P7 amendment at 5782351 after self-reporting "I overclaimed goal close against the spec file (24/24 DONE WHEN) without satisfying P7 from the goal text." Then the remediation closed against a 7.5 threshold which this spec raises to 9.5, AND the remediation itself did not verify that the 10 surfaces it scored were displaying real data (per Observation 1). The recursion is: agent closes → agent audits → agent remediates → agent closes the remediation → next audit finds new gap. The substrate produces honest-delta surfacing but does not produce closure-true ships.

These three observations are not failures to discipline. They are the data this spec is built around.

## FOUNDER OPERATING PHILOSOPHY (binding — read before any execution)

### P1. Depth-of-research over speed-of-closure

For every non-trivial decision, the agent runs at minimum 3 distinct investigations: (a) read existing repo state in full, (b) web-search current best practices including community alternatives, (c) emulate or simulate the change in an isolated workspace before applying. For every architectural choice, compare at least 2 viable approaches with pros/cons documented. "I looked into it" is NEVER sufficient. Evidence required: web-search citations, simulation results, hindsight analyses.

### P2. Emulation + simulation are mandatory tools

Before applying a change to live state, spin up an isolated copy in a scratch dir, run the change end-to-end, observe outcomes with vision verification per V1, compare to expected, only then apply to the real path.

### P3. Hindsight + foresight required in every ship-close retrospective

HINDSIGHT: "How could this have been done better? Simpler / cheaper / more-creative approach we missed?" FORESIGHT: "How does this scale? What breaks at 10x usage? What would a senior engineer at Stripe / Linear / Vercel say in review?"

### P4. Open-source + creative replication FIRST, paid services LAST

For every capability needed: web-search for open-source equivalents BEFORE recommending paid SaaS. If paid is only option: document why + free-replication cost + surface to Founder for explicit approval. Prefer custom-built when build cost < 2x integration cost. Propose free-replication migrations during retrospectives.

### P5. "Outside the box" thinking is the bar

Default action is NOT "ask Founder" and NOT "use the most obvious approach." Default: enumerate at least 3 distinct approaches including one non-obvious. Pick the most appropriate. Document why. Propose rejected alternatives in retrospective.

### P6. Time is not the constraint; truth is

No turn-count caps. 150 turns, 500 turns, 1000 turns — whatever it takes. Stop ONLY when: DONE WHEN truthfully met, genuine Founder-presence blocker, token budget genuinely exhausted, or findings suggest re-scope (surface, don't close).

### P7. Competitive benchmarking + industry-leading quality bar — PASSING SCORE = 9.5/10

#### P7.1 — Reference the real world before every build, review, or polish pass

Web-search for 3+ high-performing real-world products per surface category. Playwright-capture screenshots. Describe patterns. Pick BEST elements as inspiration. Cite in retrospective.

Required reference companies by surface category:
- **Dashboards:** Linear, Vercel, Stripe, Datadog, Sentry, PostHog, Grafana, Plausible, Cloudflare, Supabase
- **Settings / admin:** Linear settings, Vercel dashboard, Stripe Dashboard, Cal.com admin, GitHub settings
- **List views + filtering:** Linear issues, GitHub PRs, Notion databases, Airtable, Pipedrive
- **Approval / review flows:** GitHub PR review, Linear cycle review, Figma comments, Vercel deploy preview, Stripe Radar
- **Status / health banners:** Vercel status, Cloudflare status, Datadog incident banners, GitHub system status, AWS health
- **Empty / loading / error states:** Linear, Stripe, Vercel, Notion
- **Typography + design systems:** Linear, Stripe, Vercel, Apple HIG, Material Design 3, Radix Themes, shadcn/ui
- **Animation + micro-interactions:** Linear command palette, Vercel command menu, Stripe checkout, Cron calendar
- **Architecture / flow diagrams:** Janowiak ToDesktop video (main-flows) + Excalidraw, Eraser.io, Whimsical, Stripe Atlas, Cloudflare Architecture
- **Cost / billing meters / token counters:** Vercel usage dashboard, OpenAI usage dashboard, Anthropic console usage view, Stripe billing dashboard, AWS Cost Explorer, GitHub Actions usage

#### P7.2 — Mandatory TASTE SCORE block, passing threshold = 9.5/10

Every ship-close retrospective contains:

```
TASTE SCORE
-----------
Surface: [name]
Reference benchmarks consulted: [3+ named companies + URLs + screenshot paths]
Peer-company role identity adopted: [Linear designer / Vercel engineer / Stripe product engineer / etc.]

Dimension scores (1-10, where 10 = single best example of this dimension on the open web):
- Visual hierarchy: X/10 — [one-line justification + reference]
- Typography: X/10 — [one-line justification + reference]
- Spacing + density: X/10 — [one-line justification + reference]
- Color + contrast: X/10 — [one-line justification + reference]
- Interactive feedback: X/10 — [one-line justification + reference]
- Empty / loading / error states: X/10 — [one-line justification + reference]
- Information design: X/10 — [one-line justification + reference]
- Motion + transitions: X/10 — [one-line justification + reference]

Overall: X.X/10
Closest peer benchmark: [Company X surface at URL Y scores ~Z/10]
Gap to peer: [list of 3-5 specific concrete deltas]
Iteration count on this surface: [N]
```

**Passing threshold: overall score MUST be ≥ 9.5/10.** Below 9.5 = Taste bubble REJECTS. Iterate. Loop until ≥ 9.5 OR 5+ iterations without crossing threshold → surface to task-queue/founder/ with current state, references, gap, proposed alternative.

9.5 means "shippable next to Linear and Stripe." 7.5 is "good enough" — explicitly rejected.

#### P7.3 — Persistent competitive reference library

`.claude/state/design-research/competitive-references/`. One subdirectory per surface category. Each contains: screenshots via Playwright + notes.md describing what makes each excellent. Durable taste asset across sessions.

#### P7.4 — Peer-company role identity adoption

Linear-designer-mode, Vercel-engineer-mode, Stripe-engineer-mode, Datadog-engineer-mode. Retrospective documents which roles applied per ship-close.

#### P7.5 — Pre-flight competitive scan before any ship

web_search "[surface category] design 2026" + "best [surface category]". image_search visual references. Read 2+ design articles. Save findings to ship research artifact. Capture live screenshots of 3+ peer references via Playwright. Skipped = Taste bubble rejects.

### P8. Security + privacy + abuse-prevention as ship-blocking constraints

#### P8.1 — Pre-launch security checklist (binding on every commit)

Every ship-close writes a SECURITY block:

```
SECURITY + PRIVACY + ABUSE BLOCK
---------------------------------
Surface: [name]
Data classification: [public / authenticated / sensitive / PII / financial]

Privacy:
- Privacy policy coverage: [does the live privacy policy cover this surface's data flows?]
- Data storage location: [Firestore region / Cloud Storage bucket / localStorage / third-party]
- Data retention: [how long persists, deletion path]
- Third-party data sharing: [list each + privacy policy coverage]

Security headers:
- CSP / HSTS / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / Frame-Options state vs recommendation

OWASP basics scanned:
- SQL injection / XSS / Auth-authz / CSRF / Open redirect / IDOR each documented or N/A with reason

Secret / key exposure:
- .env in client bundle / API keys in frontend / secrets in git log / secrets in committed config / API responses leaking / logs leaking — each scanned

Abuse / rate limiting:
- Rate limits per-actor / cost ceilings / spam-enumeration vectors / auth abuse rate-limits

OVERALL SECURITY VERDICT: [GREEN / YELLOW / RED]
```

GREEN ships. YELLOW needs Founder approval. RED blocks.

#### P8.2 — OWASP Top 10 (2021) coverage per applicable ship

A01 Broken Access Control (Firestore rules audit). A02 Cryptographic Failures. A03 Injection (query-construction audit). A04 Insecure Design (architectural threat-model). A05 Security Misconfiguration. A06 Vulnerable Components (npm audit, HIGH/CRITICAL surfaced). A07 ID & Auth Failures. A08 Software & Data Integrity (SRI for 3rd-party scripts). A09 Security Logging & Monitoring. A10 SSRF.

#### P8.3 — Privacy + data minimization

Data minimization, purpose limitation, right to deletion, data export, COPPA gating if applicable.

#### P8.4 — Secrets management

All secrets in Firebase secrets / Cloud Function env / .env.local (gitignored) / IT Glue. Pre-commit scanner (trufflehog OR gitleaks) BLOCKS on hit. Pre-push diff scan against origin/main. Agent installs scanners in this goal per P4.

#### P8.5 — Frontend exposure surface audit

Inspect built bundle (npm run build) for secret patterns. Inspect deployed live site DevTools network for hidden admin/debug routes. Document delta.

#### P8.6 — Rate limit + cost-control gates

Per-actor rate limits on backend touchpoints. Cost-per-day budget alarms. Auth rate-limits on signup / password reset / OTP.

#### P8.7 — Concrete + accurate test reports

Every test result: exact command, exit code, exact stdout/stderr (truncate with "…[full at path]"), timestamp, environment. NO summary-only reports. All artifacts committed under `.claude/state/test-runs/{ts}/`.

### P9. Data truthfulness gate (NEW — addresses Observation 1)

**Vision verification confirms a surface RENDERED. P9 confirms a surface RENDERED THE TRUTH.** These are separate gates. A dashboard can render beautifully and display zeros that don't match reality. P9 is the gate that catches that.

#### P9.1 — Every visible value traces to source

For every numeric value, status indicator, list count, timestamp, percentage, or text label rendered on any dashboard, the agent MUST produce a trace:

```
DATA TRUTHFULNESS TRACE
-----------------------
Surface: [name]
Value shown: [literal text/number as rendered]
Aggregate field consumed: [path to .claude/state/aggregates/*.json field]
Aggregator script producing field: [scripts/aggregate-*.py or equivalent]
Underlying source(s): [actual data location — test log path, npm audit output, git command, file count, etc.]
Source value at trace time: [literal value pulled from underlying source]
Aggregator output value at trace time: [literal value in JSON after aggregator run]
Display value at trace time: [literal value rendered, captured via Playwright screenshot + Read]
End-to-end match: [PASS if all three values agree, FAIL otherwise]
```

#### P9.2 — Zero and dash defaults are SUSPECT until proven legitimate

When a dashboard displays `0`, `-`, `--`, `N/A`, "0 of 0", empty string, "—", or any null-representative value, the default treatment is FAIL UNTIL PROVEN LEGITIMATE. The agent must demonstrate one of:

- The underlying source is genuinely zero/empty (e.g., zero pending proposals because all are approved — trace the proposals directory and confirm)
- The state is intentionally empty and the surface has an INTENTIONAL EMPTY STATE (per P7 reference — Linear/Stripe/Notion-quality empty copy, not raw 0)
- The data is in transit but the UI correctly shows a LOADING state, not a zero state

Falling through to "0" or "—" because the aggregator returned nothing, the JSON is missing, the field name doesn't match, or the consumer doesn't know how to handle it → AUTOMATIC FAIL. The display is lying.

#### P9.3 — Producer/consumer parity check

For every aggregate JSON the dashboard reads, the agent confirms:
- The producing script (aggregator) writes the field names the dashboard expects
- The schema_version matches
- The generated_at is recent (within the freshness window the surface advertises)
- The shape (object / array / nested) matches consumer expectation

Mismatches surface explicitly. NO silent fallback-to-zero behavior in render code is acceptable. Render code that masks producer/consumer mismatch by defaulting to 0 is itself a bug to fix.

#### P9.4 — Founder verification step (the recursion-breaker)

Before this goal closes, the agent surfaces a `FOUNDER VERIFICATION PACKET` to `.claude/state/task-queue/founder/dashboard-completion-verification.md` containing:

- Live dashboard URL (file:// path)
- The data truthfulness trace for the 5 most prominent values on the dashboard
- Screenshots Read by the agent with observed_state
- A specific request: "Founder opens dashboard URL, visually confirms the 5 traced values match the truth-source values listed in the packet, approves or rejects"

Founder approval recorded in the file unlocks final goal close. Without it, the goal stays open. This breaks the agent-only validation loop — the Founder's eyes are the last gate.

#### P9.5 — Token meter is a P9 first-class concern (addresses Observation 2)

Token meter is NOT lumped under "aggregator wire-up." It has its own dedicated phase task and its own DONE WHEN. The dashboard must display actual cumulative spend (week-to-date, day-to-date, last-ship), pulled from the actual usage source (sidecar logs, Claude usage API if accessible, or the local accounting the substrate maintains). If the source itself is broken or absent, fix the source first, then wire the display. The display rendering "—" or "0" for token spend is a P9.2 FAIL.

## VISION + DESKTOP CONTROL AUTHORIZATION

### V1. Vision-based verification is REQUIRED

Smoke tests, lint tests, exit codes, grep counts are NECESSARY but NOT SUFFICIENT. Pattern: capture via Playwright → save PNG → Read tool the PNG → describe what is VISIBLE → compare against expected → record in retrospective. Skipped = Critic bubble REJECTS.

### V2. Desktop control authorization

Agent has authorization to: launch Chrome / Playwright with Founder's user profile (X.com auth carries over); run PowerShell + admin-elevated installers; Git operations including push (11-gate); edit files anywhere under repo; run cron tasks + smoke automation + FIQ checks; open + screenshot any file:// URL; Playwright headed mode; clipboard cross-context; local emulators (Firebase emulator, scratch dirs); ffmpeg + yt-dlp for video extraction; visit competitor sites via Playwright; run security scanners (trufflehog, gitleaks, npm audit, OWASP ZAP via docker).

Out-of-scope (requires task-queue/founder/ pre-auth): credentials / IT Glue / password manager modification; system-wide settings outside workspace; Firestore rules / Cloud Function deploys (AMD-018 exception list); Founder biometric / MFA; anything outside C:\Users\Zach\smoky-mountain-open\.

### V3. Less friction

Act within scope. Surface only on out-of-scope or true Founder-presence-required action. Don't ask when V2 authorizes.

## MAIN-FLOWS RE-REVIEW (M1-M7)

Prior 18-iteration polish loop produced false APPROVAL verdicts. The Janowiak reference video at https://x.com/DaveJ/status/2053867258653339746 is severely missed. M-phase starts fresh against new criteria.

- M1. Web-search + employ ANY available video-analysis capability (long-form video skill, ffmpeg motion analysis, frame-by-frame extraction). Surface to Founder if paid skill is the only option per P4.
- M2. Decompose Janowiak across: composition + spatial relationships, interaction model (hover/click/focus), motion/transition timing curves, color + density + contrast, editorial emphasis. Multiple passes required.
- M3. Produce `.claude/state/main-flows-v2/janowiak-decomposition-2026-05-15.md` characterizing the reference such that a senior designer could reconstruct intent without watching.
- M4. Score current main-flows.html against decomposition using P7.2 format. Document per-dimension gap.
- M5. Iterate main-flows.html to ≥ 9.5/10 against Janowiak decomposition AND 3+ industry peers (Excalidraw, Eraser, Whimsical, Stripe Atlas, Cloudflare Architecture). Single-reference matching FORBIDDEN.
- M6. Vision-verify every iteration (V1). Apply data-truthfulness trace if the surface displays any data (P9). Score every iteration.
- M7. Document M1–M6 in retrospective with full TASTE SCORE + side-by-side: PARBAUGHS vs Janowiak vs 2+ peers.

## PRE-RESEARCH (mandatory per AMD-025 + P1 + P7 + P8 + P9)

1. Run `claude --version`. Confirm Playwright MCP connected via `/mcp` listing.
2. Web-search "Playwright HTML5 video frame extraction currentTime canvas" for API.
3. Web-search "Playwright x.com twitter video element selector 2026" for current X DOM.
4. Web-search "Playwright launch chrome user-data-dir persistent context".
5. Web-search "open source twitter video download yt-dlp ffmpeg 2026".
6. Web-search "Anthropic skills long form video analysis 2026" + "Claude video understanding".
7. **NEW: Web-search "token usage tracking Claude API sidecar local accounting 2026"** for P9.5 token meter wire-up.
8. **NEW: Web-search "data dashboard truthfulness verification end-to-end trace" + "data lineage observability open source"** for P9 inspiration.
9. P7: capture screenshots from Linear, Vercel, Stripe, Datadog, Sentry dashboards. Save to competitive-references/dashboards/.
10. P7: capture status banner references (Vercel/Cloudflare/Datadog/GitHub/AWS).
11. P7: capture approval/review UI references (GitHub PR / Linear cycle / Figma).
12. P7: capture architecture diagram references (Excalidraw / Eraser / Whimsical / Stripe Atlas / Cloudflare).
13. **NEW P7: capture cost/usage meter references (Vercel usage / OpenAI usage / Anthropic console usage / Stripe billing / AWS Cost Explorer / GitHub Actions usage). Save to competitive-references/usage-meters/.**
14. P8: install trufflehog (or gitleaks) + npm audit baseline. Output to .claude/state/security/baseline-{ts}/.
15. Read in repo: scripts/visual-audit/capture-janowiak-reference.mjs, scripts/regen-all.sh, scripts/regen-*.py, scripts/inject-health-banners.py, scripts/scaffold-from-templates.sh, audit-report-2026-05-15.md, remediation-report-2026-05-15.md, all templates/dashboards/*.template.html, tests/round-trip-test.py, scripts/visual-audit/verify-*.mjs, firestore.rules (read-only), firestore.indexes.json (read-only), functions/ (read-only). **NEW: scripts/cron/sidecar*.* + scripts/aggregate-token-usage.py + any token-meter rendering code path in templates/dashboards/dashboard.template.html.**
16. For each pattern introduced/extended, identify 2+ high-quality open-source implementations on GitHub.
17. Cite ALL sources in post-push retrospective per AMD-025 section 1.

## GOAL

Complete the dashboard ecosystem to senior-engineering production quality such that ALL of the following are durably true:

- Every dashboard HTML in docs/reports/ renders with LIVE, TRUTHFUL data; no "awaiting data...", no unexplained zeros or dashes
- Every banner status reflects real underlying state, refreshed within 5 minutes of state change, with data-truthfulness trace per P9
- Token meter on dashboard displays actual cumulative spend (week-to-date, day-to-date, last-ship), traceable to source
- Every interactive element WORKS — vision-verified + data-truthfulness-verified
- 12 Janowiak reference frames captured with observed_state
- Janowiak video decomposition document complete
- main-flows.html scored ≥ 9.5/10 against Janowiak + 2+ industry peers, data-truthful where data is shown
- Full smoke test passes + vision-confirmed final states + concrete test reports per P8.7
- Full FIQ check passes
- Round-trip test passes
- All visual-audit scripts pass
- Zero CRITICAL / HIGH findings
- P8 security baseline established with zero RED items
- P9 Founder Verification Packet approved by Founder
- Tree clean, pushed, durably reproducible
- Every UI surface taste-scored ≥ 9.5/10
- Every commit going forward includes SECURITY block per P8.1 + DATA TRUTHFULNESS TRACE per P9 where applicable

This goal GATES all PARBAUGHS app feature work. No member-facing feature ships until this closes.

## CONTEXT

- Repo: /c/Users/Zach/smoky-mountain-open
- Live site: https://alrightlad.github.io/smoky-mountain-open/
- Dashboard local: file:///C:/Users/Zach/smoky-mountain-open/docs/reports/dashboard.html
- main-flows local: file:///C:/Users/Zach/smoky-mountain-open/docs/reports/main-flows.html
- Test account: smoke@parbaughs.test in smoke-test-league
- Founder's Chrome user-data-dir: C:\Users\Zach\AppData\Local\Google\Chrome\User Data
- Substrate: AMD-009 through AMD-025 binding, PROP-006 through PROP-014, all skills binding
- Janowiak tweet: https://x.com/DaveJ/status/2053867258653339746
- Janowiak frames: .claude/state/main-flows-v2/janowiak-reference-frames/
- Janowiak decomposition: .claude/state/main-flows-v2/janowiak-decomposition-2026-05-15.md
- Competitive reference library: .claude/state/design-research/competitive-references/
- Security baseline: .claude/state/security/baseline-{ts}/
- Test-run artifacts: .claude/state/test-runs/{ts}/
- Founder verification packet target: .claude/state/task-queue/founder/dashboard-completion-verification.md
- Scratch workspace: /home/claude/scratch or .claude/scratch
- Audit pattern: snapshot-PASS vs durable-PASS — every claim must survive a clean rebuild

## CONSTRAINTS

1. AMD-021 strict closure. No workarounds.
2. AMD-009 P5 honest delta.
3. AMD-018 11-gate push. Exception list requires Founder pre-auth.
4. AMD-020 auto-clean tree.
5. PROP-007 user-context verification.
6. PROP-009 click-every-interactive.
7. PROP-010 design-bot + Critic approve every ship-close.
8. PROP-012 visual review.
9. V1 vision verification REQUIRED.
10. V2 desktop control authorized within scope.
11. P1 depth-of-research mandatory.
12. P2 emulation REQUIRED before live application.
13. P3 hindsight + foresight in every retrospective.
14. P4 open-source FIRST, paid LAST.
15. P5 3+ approaches per non-trivial decision.
16. P6 no turn-count caps. Truth over time.
17. P7 competitive benchmarking. Taste score ≥ 9.5/10 (not 7.5). Reference library populated.
18. P8 security block on every ship-close. Zero RED. Concrete test reports.
19. **P9 data truthfulness trace on every rendered value. Zeros/dashes default to FAIL until proven legitimate. Founder verification packet approved before goal close.**
20. NO exit-code-swallowing without inline rationale.
21. NO -ExecutionPolicy Bypass per-run flag.
22. NO --no-verify, --force. NO except-pass swallowing.
23. NO agent self-authorization of governance.
24. Decision bubble voting: Engineer + Critic + Performance/Load + Data Integrity + Research Depth + Taste + Security + **Data Truthfulness (NEW)** on every ship-close. Quorum: 3.
25. AUTONOMOUS_FAILURE_RECOVERY v8.3.
26. Scope: docs/reports/, templates/dashboards/, scripts/, .claude/state/, tests/. Production app code OUT OF SCOPE except where dashboard regen depends on it AND where P8 audits read it read-only.

## PRIORITY (ordered; later phases require earlier phases green)

### PHASE A — Inventory + diagnostic + research + competitive + security + data-truthfulness baseline (BLOCKING)

- A1. Audit every file in docs/reports/. VISION CHECK per surface. **NEW: DATA TRUTHFULNESS BASELINE per surface — for the top 5 visible values per surface, trace to source per P9.1 format. Document mismatches as findings.**
- A2. Audit every aggregate JSON in .claude/state/aggregates/. Schema. Timestamp. Producer script. **NEW: producer/consumer parity per P9.3 — what reads this JSON? Does it read the field names that exist?**
- A3. Audit every cron task (Get-ScheduledTask). **NEW: explicitly include sidecar cron task. What does it produce? Is the output reaching the dashboard render?**
- A4. Audit every aggregator/regen pipeline component. **NEW: include scripts/aggregate-token-usage.py + sidecar token logging path.**
- A5. P1 research baseline: 2+ open-source implementations per pattern.
- A6. P5 outside-the-box: 3+ distinct fixes per broken pattern.
- A7. P7 competitive baseline: capture 3+ reference dashboards. Save to library. Score current PARBAUGHS on 8 P7.2 dimensions.
- A8. P8 security baseline: trufflehog/gitleaks + npm audit + OWASP scan. Capture to security/baseline-{ts}/.
- **A9. NEW: P9 data truthfulness baseline. Enumerate every aggregate JSON, every consuming render path, every visible value rendered. Build the matrix in .claude/state/dashboard-audit-2026-05-15/DATA-TRUTH-MATRIX.md. Mark every value as: TRUTHFUL / SUSPECT (0 or — with unconfirmed source) / BROKEN (mismatch confirmed) / UNTRACED (couldn't find source).**
- A10. Output: .claude/state/dashboard-audit-2026-05-15/INVENTORY.md with WORKING/DEGRADED/BROKEN/MISSING + OSS comparison + alternatives + competitive baseline + initial taste scores + initial security findings + **initial data-truthfulness baseline matrix**.

### PHASE B — Live data wiring (every banner shows real AND truthful state)

Per item: P2 emulate against scratch, then apply, vision-verify (V1), data-truthfulness-trace (P9.1), P7 score (≥ 9.5), P8 security check.

- B1. test-health aggregator wired + V1 + P9 + P7 score against Vercel/Cloudflare status banners.
- B2. security-health aggregator wired + V1 + P9 + P7 score against Datadog/Sentry. (Becomes P8 baseline surface.)
- B3. approvals-pipeline aggregator wired + V1 + P9 + P7 score against GitHub PR review / Linear cycle.
- B4. architecture-review aggregator OR intentional empty state per Linear/Stripe empty-state pattern + V1 + P9.
- B5. round-trip-last-pass STALE indicator + V1 + P9 + P7 score against Datadog stale indicators.
- B6. Each aggregator writes meta block (generated_at, source_files, schema_version).
- B7. Post-commit hook runs every aggregator + regen + inject + smoke + security scan + **NEW: P9 truthfulness self-check (every aggregator emits a self-test that confirms its output is non-zero where source is non-zero)**. NO silenced failures.

### PHASE T — Token meter dedicated wire-up (NEW — addresses Observation 2)

Token meter is treated as its own first-class phase, not a sub-task of B.

- T1. Investigate the sidecar cron task. Read scripts/cron/sidecar*. Confirm what it captures (Claude usage API? local proxy logs? estimate based on session lengths?). Document the actual source of truth in .claude/state/dashboard-audit-2026-05-15/TOKEN-METER-INVESTIGATION.md.
- T2. Investigate scripts/aggregate-token-usage.py. Confirm what fields it writes. Match against what the dashboard render reads.
- T3. P7 competitive scan: capture Vercel usage / OpenAI usage / Anthropic console usage / Stripe billing / AWS Cost Explorer / GitHub Actions usage dashboards. Document patterns: how do they display cumulative spend? day vs week vs month? cost vs token-count vs request-count?
- T4. P9 data-truthfulness trace: from Founder's actual Anthropic console usage view (Founder pastes a screenshot or grants Playwright access to the Anthropic console via Chrome profile per V2) → through sidecar capture → through aggregator → through dashboard render. End-to-end.
- T5. Fix every broken link in the chain. Producer/consumer parity per P9.3. NO fallback-to-zero defaults.
- T6. Dashboard token meter displays: cumulative week-to-date spend, cumulative day-to-date spend, last-ship spend, freshness timestamp. Each value carries a data-truthfulness-trace block in the retrospective.
- T7. Visual design: P7 score ≥ 9.5 against the captured references in T3.
- T8. Founder verification: the Founder Verification Packet for this goal MUST include token meter as one of the 5 traced values.

### PHASE C — Interactive UI completion

- C1. Enumerate every interactive element via Playwright.
- C2. Click each. V1: before/after screenshots Read. **NEW: if clicking changes a displayed value, P9 trace the new value.**
- C3. Fix every broken interaction at root cause. P2 emulate first.
- C4. Verify Approve/Reject flows propagate end-to-end. V1 + P9 on final state.
- C5. Filter dropdowns theme-match. P7 ≥ 9.5 vs Linear/Notion.
- C6. Sort + search on every list view. P7 ≥ 9.5 vs Linear/GitHub.
- C7. Mobile responsive at 375px. P7 ≥ 9.5 vs Linear/Vercel mobile.

### PHASE D — Janowiak reference frame capture (parallel to A–C)

- D1. FIRST: Playwright + Founder's Chrome user-data-dir. SECOND: yt-dlp/ffmpeg. THIRD: /i/status/ variant. FOURTH: video.twimg.com direct CDN. FIFTH: screen-record + post-process. 5+ approaches before STOP RULE 4.
- D2. Extract video duration.
- D3. Capture 12 frames at evenly-spaced timestamps.
- D4. Save as frame-NN-tS.Ss.png.
- D5. manifest.json with 12 entries including observed_state.
- D6. observed_state from agent Read-tool inspection of PNG. No imagination.
- D7. Critic gate + Taste gate.

### PHASE M — Main-flows deep re-review + iteration

Per M1-M7 specification above. 18-iteration history invalid. Fresh start with video decomposition.

### PHASE E — Smoke test (cross-browser + real Firebase, 12 scenarios)

- E1. Confirm + run + capture exit code + full stdout/stderr.
- E2. Root-cause fix any failure (P2 emulate first).
- E3. Output to smoke-results.json + test-health.json + .claude/state/test-runs/{ts}/.
- E4. Run on smoke@parbaughs.test.
- E5. V1 confirm each scenario's final state.
- E6. Concrete report per P8.7.

### PHASE F — FIQ + security verification

- F1. firebase deploy --only firestore:indexes --dry-run shows zero pending.
- F2. All composite indexes Active.
- F3. fiq-status.json + concrete report.
- F4. Dashboard banner reflects FIQ status (V1 + P9).
- F5. Firestore rules audit per P8.2 A01 + coverage matrix.
- F6. Cloud Function security audit.
- F7. Bundle exposure scan.

### PHASE G — Visual + structural audits

- G1. round-trip-test.py exit 0 (concrete report).
- G2. verify-scroll-reachability.mjs exit 0.
- G3. verify-all-flows-light-up.mjs exit 0.
- G4. PROP-012 visual review per surface. V1.
- G5. PROP-010 design-bot + P7 Taste ≥ 9.5 per surface.

### PHASE H — Durability proof (anti-snapshot-PASS test)

- H1. rm -rf docs/reports/_assets docs/reports/*.html ; bash scaffold ; bash regen-all.
- H2. After H1: every dashboard present + populated. V1 confirms. P7 scores hold. **NEW: P9 data truthfulness traces hold — re-trace every prominent value after rebuild.** P8 security verdicts hold.
- H3. verify-approval-pipeline.sh exit 0 twice in a row.
- H4. Document with vision evidence + taste scores + truthfulness traces + security verdicts.

### PHASE I — Polish + final UI pass (aggressive P7 application)

- I1. Typography, spacing, alignment. Reference Linear/Stripe/Apple HIG. V1.
- I2. Empty states intentional copy. Reference Linear/Stripe/Notion. V1. **P9: confirm "empty" means actually-empty-source, not aggregator-failure.**
- I3. Loading states. Reference Linear/Vercel/shadcn skeleton.
- I4. Error states with next-action guidance. Reference Stripe/Vercel.
- I5. Dark mode consistency. Reference Linear/Vercel.
- I6. Cross-page nav consistent.
- I7. Each polish item TASTE SCORE entry. Iterate until ≥ 9.5/10.

### PHASE J — Hindsight + foresight + open-source + competitive + security + truthfulness consolidation

After A–I + T + M complete, before final close:

- J1. HINDSIGHT pass per phase.
- J2. FORESIGHT pass per phase.
- J3. Open-source consolidation.
- J4. P7 competitive consolidation: final taste-score audit. Surfaces < 9.5 iterate or surface to Founder.
- J5. P8 security consolidation: full checklist audit. RED blocks. YELLOW Founder-decision.
- **J6. NEW: P9 truthfulness consolidation: final data-truthfulness audit. Every rendered value re-traced. DATA-TRUTH-MATRIX.md updated to all TRUTHFUL (or explicit Founder-approved exceptions).**
- **J7. NEW: Founder Verification Packet emitted to task-queue/founder/. Goal hold pending Founder approval recorded in that file.**
- J8. Document J1–J6 in .claude/state/dashboard-audit-2026-05-15/CONSOLIDATION-2026-05-15.md.

## DONE WHEN (validator-checkable, every condition required)

- D1. ls docs/reports/*.html shows >= 10 files, each > 5KB.
- D2. grep -r "awaiting data" docs/reports/*.html returns ZERO hits.
- D3. grep for data-fq-banner-meta returns 4+ unique anchors.
- D4. Every aggregate JSON has generated_at < 1 hour old after final regen.
- D5. scripts/verify-approval-pipeline.sh exit 0 run twice in sequence.
- D6. tests/round-trip-test.py exit 0.
- D7. verify-scroll-reachability.mjs exit 0.
- D8. verify-all-flows-light-up.mjs exit 0.
- D9. Smoke test exit 0 (12 × 4 browsers) + V1-confirmed + concrete reports per P8.7.
- D10. FIQ status pass.
- D11. 12 PNGs > 5KB in janowiak-reference-frames/.
- D12. manifest.json valid, 12 entries, observed_state non-empty.
- D13. PHASE H durability test passes, V1-confirmed.
- D14. Every interactive element verified via Playwright + V1.
- D15. PROP-010 + PROP-012 design-bot APPROVE per surface.
- D16. SUMMARY.md exists, CRITICAL=0, HIGH=0.
- D17. git status --porcelain empty.
- D18. Final commit pushed; 11-gate green.
- D19. Decision bubble retrospectives per ship-close (8 bubbles).
- D20. goal-final-report-dashboard-completion-{ts}.md committed.
- D21. Every UI surface ship-close has at least one V1 screenshot + observed_state.
- D22. HINDSIGHT-FORESIGHT-SECURITY.md exists with per-phase entries.
- D23. Every ship-close retrospective has CITATIONS section.
- D24. Non-trivial ships have SIMULATION section.
- D25. competitive-references/ populated with 3+ subdirs, each 3+ screenshots + notes.md.
- D26. Every UI surface ship-close has TASTE SCORE ≥ 9.5/10 OR Founder-approved gap.
- D27. TASTE-AUDIT.md committed.
- D28. janowiak-decomposition-2026-05-15.md exists, characterizes Janowiak across 5 dimensions.
- D29. main-flows scored ≥ 9.5 against Janowiak + 2+ peers; side-by-side committed.
- D30. .claude/state/security/baseline-{ts}/ with scanner outputs.
- D31. Every ship-close has SECURITY block, verdict GREEN (or Founder-approved YELLOW).
- D32. Pre-commit + pre-push secret scanner installed + REJECTS fixture commit.
- D33. Concrete test reports per P8.7 — every test run has artifact in .claude/state/test-runs/{ts}/.
- D34. Firestore rules coverage matrix committed.
- **D35. NEW: .claude/state/dashboard-audit-2026-05-15/DATA-TRUTH-MATRIX.md exists; every rendered value on every dashboard mapped to source → aggregator → display; status column shows TRUTHFUL for all entries (or Founder-approved exceptions).**
- **D36. NEW: Token meter on dashboard.html displays non-zero, current cumulative spend (W-T-D, D-T-D, last-ship); data-truthfulness trace committed showing source-aggregator-display agreement.**
- **D37. NEW: Dashboard renders zero "0" or "—" placeholders across all surfaces UNLESS the underlying source is genuinely empty AND the surface has an intentional P7-quality empty state.**
- **D38. NEW: Every ship-close retrospective contains a DATA TRUTHFULNESS TRACE block per P9.1 format for any value the ship affects.**
- **D39. NEW: .claude/state/task-queue/founder/dashboard-completion-verification.md exists, contains Founder Verification Packet with 5 traced values, AND has been approved by Founder (Founder edits the file to mark approved). Goal cannot close without this approval.**
- **D40. NEW: scripts/aggregate-*.py self-test mode (per B7): each aggregator can be invoked with --self-test flag, runs against source, asserts output is non-zero where source is non-zero, exits non-zero on parity failure. Wired into post-commit hook.**

## VERIFY (validator runs these exact commands each turn)

- D1: count of HTML files >= 10, non-empty.
- D2: grep -r "awaiting data" returns 0.
- D3: grep -o data-fq-banner-meta returns 4+ unique.
- D4: every JSON has generated_at within 60 min.
- D5: verify-approval-pipeline.sh twice, both exit 0.
- D6: round-trip-test.py exit 0.
- D7+D8: visual-audit scripts exit 0.
- D11: 12 PNGs > 5KB.
- D12: manifest.json valid + 12 + observed_state non-empty.
- D13: rm -rf + scaffold + regen-all + re-run D1+D2.
- D17: git status --porcelain empty.
- D21: grep retrospective for V1 observation blocks.
- D22: HINDSIGHT-FORESIGHT-SECURITY.md exists.
- D23: grep retrospectives for CITATIONS.
- D24: grep retrospectives for SIMULATION.
- D25: ls competitive-references subdirs (3+, each 3+ PNGs + notes.md).
- D26: grep retrospectives for TASTE SCORE ≥ 9.5 OR Founder-approval.
- D27: TASTE-AUDIT.md exists.
- D28: janowiak-decomposition-2026-05-15.md exists, contains 5 dimensions.
- D29: main-flows retrospective TASTE ≥ 9.5 + side-by-side.
- D30: security baseline dir + scanner outputs exist.
- D31: grep retrospectives for SECURITY block GREEN (or approved YELLOW).
- D32: pre-commit fires + rejects fixture.
- D33: ls test-runs per ship has command + exit + log + meta.
- D34: firestore-rules-coverage-{ts}.md exists.
- **D35: DATA-TRUTH-MATRIX.md exists, parse status column, all TRUTHFUL or Founder-approved.**
- **D36: Playwright headed open dashboard.html, screenshot token meter region, Read screenshot — value is non-zero numeric, not "0" or "—". Retrospective contains the truthfulness trace.**
- **D37: Playwright sweep every dashboard, screenshot each, Read each, grep observed_state for unexplained zeros/dashes. ZERO unexplained.**
- **D38: grep ship retrospectives for DATA TRUTHFULNESS TRACE block where applicable.**
- **D39: ls task-queue/founder/dashboard-completion-verification.md exists, contains the packet, contains Founder-approved marker (a specific string the Founder writes when approving).**
- **D40: bash scripts/aggregate-test-health.py --self-test (and equivalents for other aggregators) exit 0.**

## OUTPUT (per turn + final)

Per turn:
- Atomic commits tagged with phase prefix.
- Post-commit hook fires regen + security scan + truthfulness self-test (real, not silenced).
- Decision bubble transcript (8 bubbles).
- V1 observation blocks.
- CITATIONS + SIMULATION + HINDSIGHT + FORESIGHT + TASTE SCORE + SECURITY + **DATA TRUTHFULNESS TRACE** blocks per applicable ship-close.

Final:
- goal-final-report-dashboard-completion-{ts}.md with extended retrospective:
  1. What changed + files + Caddy Notes + skills referenced
  2. Roadmap % complete
  3. Bubble transcripts (plain English)
  4. Workflow doc test confirmed
  5. Growth report: skills + patterns + governance refinements
  6. Vision verification appendix
  7. Hindsight + foresight appendix
  8. Open-source consolidation proposals appendix
  9. Citations + alternatives-considered appendix
  10. Competitive benchmarking appendix
  11. Security + privacy + abuse-prevention appendix
  12. main-flows decomposition + iteration history appendix
  13. **NEW: Data truthfulness matrix appendix — every value on every dashboard traced, status reported**
  14. **NEW: Token meter wire-up appendix — investigation, fix, source-aggregator-display trace, P7 score**
  15. **NEW: Founder Verification Packet (committed) + Founder's recorded approval**

## STOP RULES

1. ALL DONE WHEN met (including D35-D40) → close pending Founder approval per D39.
2. AMD-015 real escalation (genuine Founder-presence; exception-list deploy; architectural ambiguity after 3+ agents + 3+ OSS comparisons + 2+ simulations + 3+ competitive references) → Surface to task-queue/founder/. Continue OTHER phases.
3. 5+ documented attempts on single sub-issue → surface, continue.
4. Janowiak: 5+ distinct creative approaches all fail → surface STOP RULE 4. Continue dashboard phases.
5. main-flows: 5+ iterations without crossing 9.5 → surface to Founder. Continue other phases.
6. P8 RED security finding → surface to Founder. Affected surfaces hold. Continue unaffected phases.
7. **NEW: P9 trace cannot be completed for a critical value (no source identifiable, no producer script reachable) → surface to Founder with the trace-as-far-as-possible + proposed fix. Continue unaffected phases.**
8. Token budget > 80% weekly quota → pause, preserve state, surface.

NOT a stop rule: turn count. Per P6.

## NOT STOP CONDITIONS

- "Most banners working"
- "Looks better than before"
- "Founder might want to review"
- "Cron will catch up next cycle"
- Single test failure (severity-triage then continue)
- Pacing concern
- Single phase complete
- "Need Founder to log into X" — try V2 + P4 + P5 first
- "We've been at this a long time"
- "We got the gist"
- "Easy parts are done"
- Turn count
- "Taste score 9.4, close enough" — NO, iterate.
- "Security YELLOW, probably fine" — surface to Founder.
- **"Dashboard shows 0 but the source might actually be 0" — NO, P9 trace required. Default is FAIL until proven.**
- **"Token meter shows — but the data is probably stale" — NO, fix the chain.**
- **"Founder Verification Packet sent, we can close" — NO, packet must be approved by Founder, not just sent.**

## DELIBERATION GATE (decision bubble voting)

Before each ship-close commit AND before declaring goal DONE:

- Engineer: technical correctness
- Critic: claim-vs-reality match; V1 vision check; P1 research check; P2 simulation check
- Performance/Load: scaling + foresight
- Data Integrity: aggregate timestamps reflect live state
- Research Depth: P1 + P4 + P5 satisfied
- Taste: P7 satisfied — competitive references consulted, taste ≥ 9.5/10, peer role identity, "would I ship this at Linear/Vercel/Stripe?"
- Security: P8 satisfied — SECURITY block GREEN, OWASP scanned, no secrets, rate limits, concrete reports. "Would I let this commit land at Stripe/Cloudflare/1Password?"
- **Data Truthfulness (NEW): P9 satisfied — every visible value has a trace, no unexplained zeros/dashes, producer/consumer parity verified, source actually exists. The Data Truthfulness bubble adopts the identity of a senior data engineer at Datadog or Snowflake and asks "would I trust this number? would I trust this dashboard?" If no, reject.**

Quorum: 3. Orchestrator breaks ties. Plain-English transcripts attached.

Reject conditions:
- Critic: "agent imagined" or "skipped vision check"
- Data Integrity: "stale aggregate masquerading as fresh"
- Research Depth: "no citations / alternatives / simulation"
- Taste: "no references" or "score < 9.5 without Founder approval" or "would not ship at peer company"
- Security: "no SECURITY block" or "OWASP not scanned" or "secret in diff" or "no rate limit"
- **Data Truthfulness: "value rendered without trace" or "0/— displayed without source verification" or "producer/consumer mismatch silently masked" or "would not trust this dashboard"**

## ANTI-PATTERNS TO AVOID

1. Do not declare PASS on validator state that won't survive a clean rebuild.
2. Do not inject markup into uncommitted ad-hoc DOM positions.
3. Do not write observed_state from imagination.
4. Do not self-authorize governance amendments.
5. Do not pattern-match "8/8 PASS" closure language.
6. Do not declare UI working based on exit codes / grep / lint alone.
7. Do not ask Founder when V2 authorizes.
8. Do not skip P1 depth-of-research.
9. Do not skip P2 simulation.
10. Do not skip P3 hindsight + foresight.
11. Do not adopt paid services when P4 free-replication exists.
12. Do not pick first-obvious when P5 enumeration would surface better.
13. Do not stop on turn count.
14. Do not declare design polish complete without P7 references + ≥ 9.5.
15. Do not let taste scores stagnate iteration over iteration.
16. Do not consult only ONE reference per surface.
17. Do not skip P8 security block on any commit.
18. Do not report test results as summaries.
19. Do not bypass the secret scanner.
20. Do not silently approve YELLOW security verdicts.
21. **NEW: Do not approve a beautiful empty surface. Aesthetic score + zero data = automatic reject regardless of taste rating. Beauty without truth is the deepest snapshot-PASS.**
22. **NEW: Do not let "0" or "—" or "N/A" defaults survive in render code. Mask them with intentional empty states OR fix the data path. Silent fallback-to-zero in consumer code is itself a bug.**
23. **NEW: Do not close the goal on agent-only bubble approval. Goal requires Founder approval per D39. The agent-only loop is what produced the 6/6 UNANIMOUS APPROVE on a dashboard showing zeros.**
24. **NEW: Do not lump token meter under "aggregator wire-up." It has its own phase T. Its own DONE WHEN. Its own truthfulness trace. Its own Founder verification.**

## SCOPE OUT (do not touch)

- src/pages/, src/core/, functions/ (production app code) except where dashboard regen reads them, except where P8 audits read read-only
- firestore.rules, firestore.indexes.json (except read-only for FIQ + P8 audits)
- secrets, IT Glue, credentials
- W1.S1+ ship work (gated by this goal)

P8 + P9 audits READ production app code/config for security + truthfulness review. They do NOT modify. Findings requiring modification surface to task-queue/founder/ + continue other phases.

## LAUNCH INVOCATION (paste this at /goal prompt — under 4k chars)

The Founder saves this spec to C:\Users\Zach\Downloads\ then launches Claude Code from the repo root with `claude --effort max --dangerously-skip-permissions` and pastes the following at the /goal prompt:

---BEGIN /goal PASTE---
/goal Self-install + execute dashboard + main-flows + security + truthfulness + token-meter spec. Step 1: move /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-15.md to .claude/state/dashboard-completion-spec-2026-05-15.md (commit). Step 2: read spec for FOUNDER OBSERVATIONS + P1-P9 + V1-V3 + M1-M7 + PRE-RESEARCH + 12 PHASES + 40 DONE WHEN + DELIBERATION GATE (8 bubbles, quorum 3).

GATE: Blocks all PARBAUGHS app feature work. W1.S1 does not open until this closes + Founder approves verification packet.

CRITICAL FOUNDER OBSERVATIONS THIS SPEC ADDRESSES: (1) dashboard shows 0s/dashes everywhere despite prior 6/6 UNANIMOUS APPROVE — regression-and-data-loss passed visual checks because visual ≠ truthful; (2) token meter has never updated across any ship — sidecar→aggregator→display chain broken somewhere; (3) agent recursion: close → self-audit → remediate → re-close, never closure-true.

P1-P9: P1 depth-of-research, P2 emulation mandatory, P3 hindsight+foresight, P4 OSS first paid last, P5 outside-the-box, P6 NO turn-count stop, P7 TASTE ≥9.5 vs 3+ industry peers (NOT 7.5), P8 security+privacy+abuse block every commit (OWASP+secret scanner+rate limits+concrete reports), P9 DATA TRUTHFULNESS — every visible value traces source→aggregator→display, zeros/dashes default FAIL until proven, FOUNDER VERIFICATION PACKET required at close.

V1-V3: V1 vision REQUIRED. V2 desktop control authorized. V3 less friction.

M1-M7: main-flows fresh re-review. Decompose Janowiak via video-analysis skill across composition+interaction+motion+color+editorial. Score current ≥9.5 against decomposition + 3+ peers.

12 PHASES: A inventory + research + competitive + security + truthfulness baselines; B live data wiring (simulate→V1→P9 trace→P7 ≥9.5→P8); T TOKEN METER DEDICATED PHASE (sidecar investigation→competitive scan→source-aggregator-display fix→Founder console trace); C interactive UI; D Janowiak frames 5+ creative approaches; M main-flows ≥9.5; E smoke + concrete reports; F FIQ + Firestore rules + Cloud Function + bundle scan; G visual/structural ≥9.5; H durability proof (V1+P9 hold after rebuild); I polish; J consolidation including P9 final audit + Founder Verification Packet emission.

CONSTRAINTS: all AMDs + PROPs + skills + AMD-021 strict closure + AMD-009 P5 honest delta + no exit-code-swallowing + no agent self-authorization + 8 bubbles (Engineer+Critic+Perf/Load+Data Integrity+Research Depth+Taste+Security+DATA TRUTHFULNESS) quorum 3.

STOP RULES: ALL DONE WHEN met + Founder approves verification packet. Real AMD-015 escalation. 5+ attempts on sub-issue. Janowiak 5+ creative paths fail. main-flows 5+ iterations without 9.5. P8 RED. P9 trace impossible for critical value. Token >80% weekly. NO turn-count stop.

NOT STOP: "most working", "looks better", "cron will catch up", single test failure, pacing, "need Founder for X login" (try user-data-dir first), "we got the gist", "easy parts done", turn count, "9.4 close enough", "YELLOW probably fine", "0 might actually be 0", "— might be stale", "packet sent we can close" (NO — Founder must APPROVE in the file).

Begin self-install immediately, then read spec in full, then begin PHASE A (includes P9 data-truthfulness baseline). Phases D + A + M + T can run in parallel after pre-research clears. Validator checks all 40 DONE WHEN every turn. Loop until truth + Founder approval, not time. Surfaces must score ≥ 9.5/10 AND display traceable truth to ship.
---END /goal PASTE---
