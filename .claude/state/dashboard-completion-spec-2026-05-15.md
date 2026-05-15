# SPEC — Dashboard ecosystem completion + Janowiak capture (gate before app work)

## SELF-INSTALL (first action on read)

This spec lives in C:\Users\Zach\Downloads\ when the agent first reads it. Before doing anything else, the agent MUST move itself into the repo:

```
mv /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-15.md /c/Users/Zach/smoky-mountain-open/.claude/state/dashboard-completion-spec-2026-05-15.md
```

After move, all subsequent references to this spec resolve at .claude/state/dashboard-completion-spec-2026-05-15.md. Commit the move as a tracked artifact (atomic commit: "spec(goal): install dashboard-completion-spec-2026-05-15 from Downloads").

If the file is already at .claude/state/ when the agent looks, skip the move and proceed.

## FOUNDER OPERATING PHILOSOPHY (binding — read before any execution)

The Founder explicitly holds these positions. They override defaults wherever they conflict.

### P1. Depth-of-research over speed-of-closure

The Founder does NOT want fast closure. The Founder wants EXTENSIVE AND DEEP RESEARCH. This means:

- For every non-trivial decision, the agent runs at minimum 3 distinct investigations: (a) read existing repo state in full, (b) web-search current best practices including community alternatives, (c) emulate or simulate the change in an isolated workspace before applying.
- For every architectural choice, the agent compares at least 2 viable approaches with pros/cons documented in plain English, before picking one.
- "I looked into it" is NEVER sufficient. The agent must produce evidence: web-search citations, simulation results, hindsight analyses of how this has been done elsewhere, future-thinking on how this scales.
- Surface findings to retrospectives even when not asked. Over-document, don't under-document.

### P2. Emulation + simulation are mandatory tools, not optional

Before applying a change to live state (dashboards, aggregators, regen pipeline), the agent should:

- Spin up an isolated copy of the affected files in a scratch dir
- Run the change end-to-end against the scratch copy
- Observe outcomes (with vision verification per V1)
- Compare to expected
- Only then apply to the real path

Examples:
- Aggregator wire-up: emulate by running aggregator → mock dashboard render → screenshot → Read → confirm before touching production aggregator
- Banner injection: simulate inject-health-banners against a copy of the template, screenshot result, confirm visually before running against docs/reports/
- Approval pipeline: simulate decision JSON propagation in scratch directory mirroring .claude/state/proposals/ before testing real flow

### P3. Hindsight + foresight required in every ship-close retrospective

Every ship-close retrospective MUST contain two new sections:

- HINDSIGHT: "How could this have been done better in retrospect? Was there a simpler / cheaper / more-creative approach we missed? Did we replicate a pattern from existing open-source work that we should now cite?"
- FORESIGHT: "How does this scale? What breaks at 10x usage? What would a senior engineer at Stripe / Linear / Vercel say if they reviewed this PR?"

These are not optional. Missing sections = ship-close rejected by Critic.

### P4. Open-source + creative replication FIRST, paid services LAST

The Founder explicitly states: "since all software is man-made we can do anything or replicate anything AT A COST. The cost is what I don't like. I love open source and making it yourself being creative and thinking outside the box."

This binds the agent to:

- For every capability needed: web-search for open-source equivalents BEFORE recommending paid SaaS
- If a paid service is the only option: document why, what the free-replication path would cost in time/complexity, and surface to Founder via task-queue/founder/ for explicit approval rather than auto-adopting
- Prefer custom-built solutions in this codebase over external dependencies when the build cost is < 2x the integration cost
- When prior sessions adopted a paid pattern, the agent should propose a free-replication migration during retrospectives, not silently continue paying

### P5. "Outside the box" thinking is the bar, not the exception

When the agent encounters an obstacle:

- Default action is NOT "ask Founder" (V3 already covers this) AND is NOT "use the most obvious approach"
- Default action is: enumerate at least 3 distinct approaches, including one that other engineers would call non-obvious or creative
- Pick the most appropriate, document why, propose the rejected alternatives in retrospective

Examples:
- X.com login wall → not just "try /i/ variant"; also: pull video.twimg.com directly via network log, use ffmpeg + yt-dlp open-source extraction, screen-record Playwright session and post-process with ffmpeg, attach a userscript to the Chrome session that auto-extracts media
- Aggregator missing → not just "build one"; also: derive from existing telemetry already collected, use an existing open-source observability library, generate from git log history, write as inline JS in the dashboard itself reading directly from .claude/state/

### P6. Time is not the constraint; truth is

The Founder explicitly rejects turn-count caps as stop conditions. 150 turns, 500 turns, 1000 turns — whatever it takes to ground the work in real research, real emulation, real hindsight, real foresight. The agent should stop ONLY when:

- DONE WHEN conditions are met truthfully (not via snapshot-PASS)
- A genuine blocker requires Founder action (V2 out-of-scope)
- Token budget genuinely exhausted (> 80% weekly quota)
- The work has produced findings that suggest the goal should be re-scoped (in which case: surface the re-scope proposal, don't unilaterally close)

The agent should NOT stop because "we've been at this a long time," "I think we got the gist," or "the easy parts are done." Those are the Founder's enemies. The substrate exists to prevent them.

## VISION + DESKTOP CONTROL AUTHORIZATION (Founder grant)

The Founder explicitly grants the orchestration team the following capabilities for this goal AND for any subsequent work building on this substrate:

### V1. Vision-based verification is REQUIRED, not optional

Smoke tests, lint tests, exit codes, and grep counts are NECESSARY but NOT SUFFICIENT. Every UI claim must additionally be verified by the agent VIEWING the rendered output and TRANSLATING WHAT IT SEES into plain English before declaring PASS. This applies to:

- Every dashboard surface (read the rendered PNG, describe what banners actually display)
- Every aggregate render (does the data shown match the JSON's contents?)
- Every interactive state (after click: did the visual change match the documented expected outcome?)
- Janowiak reference frames (observed_state field per D6 — already required)
- Any visual-design or polish work

Pattern: capture via Playwright → save PNG → Read tool the PNG → describe what is VISIBLE → compare against expected state → record both descriptions in the retrospective. If the agent declares PASS without a visual observation step, the Critic bubble REJECTS the ship-close.

This closes the snapshot-PASS gap surfaced in audit-report-2026-05-15.md: exit codes can be green while the rendered UI is broken. Vision verification is the second gate.

### V2. Desktop control authorization

The Founder grants the orchestration team authorization to take control of the Founder's PC (C:\Users\Zach\smoky-mountain-open and related paths, PowerShell, Git Bash, Chrome browser sessions, Playwright sessions) at any capacity that enhances solutions, research, or training, subject to the constraints below.

In-scope desktop actions:
- Launching Chrome / Playwright with the Founder's user profile (for sites requiring login, including X.com)
- Running PowerShell scripts including admin-elevated installers (with consent-prompt for elevated steps; agent proceeds without prompt for non-elevated)
- Git operations including push, with AMD-018 11-gate satisfied
- Editing files anywhere under /c/Users/Zach/smoky-mountain-open/
- Running cron tasks, scheduled tasks, smoke automation, FIQ checks
- Opening, inspecting, screenshotting any local file:// URL
- Reading dashboard renders via Playwright headed mode for vision verification
- Using clipboard for cross-context paste (e.g., decision JSON download → manual move if downloads-watcher offline)
- Spinning up local emulators (Firebase emulator suite, Playwright sandboxes, scratch directories) for P2 simulation requirements
- Running ffmpeg, yt-dlp, screen-recording tools for creative-replication paths per P5

Out-of-scope desktop actions (require Founder pre-auth via task-queue/founder/):
- Any modification to credentials, IT Glue, password manager, browser saved-passwords store
- Any modification to system-wide settings outside the repo workspace
- Any operation against firestore.rules, firestore.indexes.json, Cloud Functions deploys (AMD-018 exception list)
- Any operation requiring Founder's actual biometric / MFA confirmation
- Any operation reaching outside the C:\Users\Zach\smoky-mountain-open\ workspace or its supporting tooling directories

If the agent encounters a desktop action that would benefit the goal but falls into out-of-scope: surface to task-queue/founder/ with proposed action + rationale + expected outcome per AMD-015 propose-first. Do not halt the entire goal — continue parallel work.

### V3. When to use vision + desktop control proactively

The agent should reach for vision-and-desktop-control INSTEAD OF asking the Founder whenever:

- An aggregate JSON looks correct but the dashboard banner appears wrong → don't ask; open dashboard.html in Playwright headed Chrome, screenshot, Read the PNG, compare
- A test passes but the user experience seems off → don't ask; click through the surface via Playwright user-context, screenshot every state, Read each PNG, document
- A capture step fails → don't ask; try Playwright with the Founder's Chrome profile (--user-data-dir pointing at the actual Chrome user data), which carries existing X.com authentication
- A design decision is ambiguous → don't ask; pull reference frames, Read them, compare to current state, propose-first the design direction with visual evidence

The agent should ASK THE FOUNDER (via task-queue/founder/) only when:

- An action genuinely requires Founder presence (MFA, biometric, password entry into a never-saved-credential field)
- A decision is value-laden and not derivable from observation (e.g., "should this league economy use coins or stars" — taste, not verification)
- An out-of-scope action under V2 would be the optimal path forward

The Founder has explicitly stated this preference: "less friction, take control to enhance solutions, you are capable." The agent honors that by acting autonomously within scope rather than batching clarifying questions.

## PRE-RESEARCH (mandatory per AMD-025 + P1 depth-of-research)

Before authoring ANY code, the executing agent MUST:

1. Run `claude --version`. Confirm Playwright MCP connected via `/mcp` listing.
2. Web-search "Playwright HTML5 video frame extraction currentTime canvas" to confirm current API.
3. Web-search "Playwright x.com twitter video element selector 2026" for current X DOM patterns.
4. Web-search "Playwright launch chrome user-data-dir persistent context" to confirm syntax for reusing Founder's Chrome session.
5. Web-search "open source twitter video download yt-dlp ffmpeg 2026" for P4 free-replication alternatives.
6. Web-search "open source aggregator alternatives [whatever pattern is being used]" before adopting any pattern.
7. Read in repo BEFORE writing:
   - scripts/visual-audit/capture-janowiak-reference.mjs
   - scripts/regen-all.sh + all scripts/regen-*.py
   - scripts/inject-health-banners.py
   - scripts/scaffold-from-templates.sh
   - .claude/state/audit-report-2026-05-15.md
   - .claude/state/remediation-report-2026-05-15.md
   - All templates/dashboards/*.template.html
   - tests/round-trip-test.py
   - scripts/visual-audit/verify-*.mjs (full list)
8. For each pattern being introduced or extended, identify how it's done in at least 2 high-quality open-source codebases on GitHub (Linear, Stripe, Vercel, Discord open-source repos, popular Electron tooling). Document in retrospective.
9. Cite ALL sources in post-push retrospective per AMD-025 section 1.

## GOAL

Complete the dashboard ecosystem to senior-engineering production quality AND capture 12 Janowiak reference frames, such that ALL of the following are durably true from a fresh checkout:

- Every dashboard HTML in docs/reports/ renders with LIVE data; no "awaiting data..." placeholder on any banner during normal operation
- Every banner status (test, security, approvals, architecture) reflects real underlying state, refreshed within 5 minutes of state change
- Every interactive element WORKS — clicks produce documented outcomes verified via Playwright user-context AND vision verification
- 12 Janowiak reference frames captured for downstream main-flows work
- Full smoke test passes (cross-browser, real Firebase, 12 scenarios) + vision-confirmed final states
- Full Firebase Index Queue (FIQ) check passes
- Round-trip test passes
- All visual-audit scripts pass
- Zero CRITICAL or HIGH findings in dashboard ecosystem audit
- Tree clean, pushed, durably reproducible
- Every UI surface confirmed by VISION verification (V1)
- Every phase grounded in P1 depth-of-research, P2 emulation, P3 hindsight+foresight, P4 open-source-first, P5 outside-the-box approaches

This goal GATES all PARBAUGHS app feature work (W1.S1 onward). No member-facing feature ships until this goal closes.

## CONTEXT

- Repo: /c/Users/Zach/smoky-mountain-open
- Live site: https://alrightlad.github.io/smoky-mountain-open/
- Dashboard local: file:///C:/Users/Zach/smoky-mountain-open/docs/reports/dashboard.html
- Test account: smoke@parbaughs.test in smoke-test-league
- Founder's Chrome user-data-dir (typical Windows path): C:\Users\Zach\AppData\Local\Google\Chrome\User Data
- Substrate: AMD-009 through AMD-025 binding, PROP-006 through PROP-014, all skills binding
- Janowiak tweet: https://x.com/DaveJ/status/2053867258653339746
- Janowiak frames target dir: .claude/state/main-flows-v2/janowiak-reference-frames/
- Audit pattern named: snapshot-PASS vs durable-PASS — every claim must survive a clean rebuild from templates
- Scratch workspace for emulation/simulation: /home/claude/scratch or .claude/scratch (agent's choice; document the choice)

## CONSTRAINTS

1. AMD-021 strict closure: every gap gets a root-cause fix plus proof committed. No "regen will run eventually." No "good enough for now." No workarounds.
2. AMD-009 P5 honest delta: any time a claim is point-in-time only, declare it "PASS at snapshot" explicitly — not unqualified "PASS."
3. AMD-018 11-gate push. Exception list (Cloud Functions, Firestore rules, auth providers, payment economy, IT Glue, secrets) requires Founder pre-authorization via task-queue/founder/.
4. AMD-020 auto-clean tree.
5. PROP-007 user-context verification: every UI claim verified via Playwright MCP real Chrome session, not Read-tool inference of source HTML.
6. PROP-009 click-every-interactive: enumerate every clickable on every dashboard page. Click each. Verify behavior. Document evidence (including a screenshot Read by the agent).
7. PROP-010 design-bot review and Critic both approve dashboard ecosystem ship-close.
8. PROP-012 visual review with reference frames where applicable.
9. V1: vision verification REQUIRED in addition to programmatic checks.
10. V2: desktop control authorized within scope; agent proceeds autonomously, surfaces only on out-of-scope or true Founder-presence-required actions.
11. P1: depth-of-research mandatory. "I looked into it" is rejected. Citations + emulations + comparisons required.
12. P2: emulation/simulation REQUIRED before applying changes to live state where applicable.
13. P3: hindsight + foresight sections REQUIRED in every retrospective.
14. P4: open-source + creative-replication FIRST. Paid services require Founder approval.
15. P5: 3+ distinct approaches enumerated for every non-trivial decision, including outside-the-box options.
16. P6: time is not the constraint; truth is. No turn-count caps.
17. NO exit-code-swallowing fallthroughs in scripts unless inline rationale documents WHY for that specific path.
18. NO -ExecutionPolicy Bypass per-run flag. Policy set CurrentUser RemoteSigned at install time only.
19. NO --no-verify, --force on git operations. NO except-pass swallowing in Python.
20. NO agent self-authorization of governance ratification. AMD-026+ lands in pending/ and surfaces to task-queue/founder/.
21. Decision bubble voting per Founder directive 2026-05-12: Engineer + Critic + Performance/Load + Data Integrity bubbles vote on each ship-close. Plain-English transcripts, with at least one documented disagreement OR explicit "unanimous" note, attached to retrospective.
22. AUTONOMOUS_FAILURE_RECOVERY v8.3: 5+ documented attempts before declaring blocked.
23. Scope: docs/reports/, templates/dashboards/, scripts/, .claude/state/, tests/. Production app code (src/pages/, src/core/, functions/) OUT OF SCOPE except where dashboard regen depends on it.

## PRIORITY (ordered; later phases require earlier phases green)

### PHASE A — Inventory + diagnostic + research (BLOCKING all other phases)

Surface the current state of EVERY dashboard AND establish research baseline before remediating.

- A1. Audit every file in docs/reports/. For each .html: present? size > 0? renders in Playwright headed Chrome without console errors? all banners populated with non-"awaiting data" content? last-updated timestamp newer than most recent commit? VISION CHECK: screenshot via Playwright, Read the PNG, describe observed state.
- A2. Audit every aggregate JSON in .claude/state/aggregates/: schema valid? timestamp field within 1 hour of now? source script identified?
- A3. Audit every cron task installed (Get-ScheduledTask): name, state, last run, next run, exit code of last run.
- A4. Audit every aggregator/regen pipeline component. For each: does it exist? Does it run cleanly? Does its output land where consumers expect?
- A5. RESEARCH BASELINE per P1: for each major dashboard pattern (banner aggregation, regen pipeline, approval-pipeline), find 2+ open-source implementations and document approach comparisons. Cite repos + commit SHAs.
- A6. P5 outside-the-box enumeration: for each broken/missing pattern, enumerate 3+ distinct ways to fix it before picking one.
- A7. Output: .claude/state/dashboard-audit-2026-05-15/INVENTORY.md with findings categorized: WORKING / DEGRADED / BROKEN / MISSING. Plus open-source-comparison appendix. Plus alternatives-considered appendix per surfaced issue.

### PHASE B — Live data wiring (every banner shows real state)

Per item: P2 emulate against scratch directory first, then apply to real path, then vision-verify rendered output.

- B1. test-health aggregator: parses round-trip-test.py output plus visual-audit results, writes .claude/state/aggregates/test-health.json with status (green/yellow/red), counts, last-run timestamp. Wires to dashboard.html banner via existing render path. VISION CHECK: after wire-up, screenshot dashboard, Read PNG, confirm banner DISPLAYS the status.
- B2. security-health aggregator: parses npm audit, secret-scan output, Firestore rules diff, dependency CVE list. Writes security-health.json. Yellow on open CVEs, red on active leak. VISION CHECK same pattern.
- B3. approvals-pipeline aggregator: parses scripts/cron/logs/*-downloads-watcher.log plus counts in .claude/state/proposals/. Writes approvals-pipeline.json with cycle health and counts. VISION CHECK same pattern.
- B4. architecture-review aggregator: reads .claude/state/aggregates/architecture-review.json IF present. If absent, banner shows "no architecture review yet" — not "awaiting data..." VISION CHECK same pattern.
- B5. round-trip-last-pass: reads test-health timestamp; computes STALE if > 30 min old; banner updates accordingly.
- B6. Each aggregator writes a meta block with generated_at, source_files, schema_version. Dashboard render reads this.
- B7. Post-commit hook MUST run every aggregator + every regen + every inject step + every smoke check. NO silenced failures.

### PHASE C — Interactive UI completion (every clickable works)

For every dashboard HTML (dashboard, amendments, proposals, escalations, activity, token-usage, discussion-bubbles, design-system, main-flows, index):

- C1. Enumerate every interactive element via Playwright.
- C2. Click each. VISION CHECK: before-click screenshot Read by agent; click; after-click screenshot Read by agent; describe delta; confirm matches expected.
- C3. Fix every broken interaction at root cause. P2 emulate fix in scratch first.
- C4. Verify Approve/Reject flows propagate end-to-end inbox → pending → approved → applied, final state vision-verified on next dashboard refresh.
- C5. Filter dropdowns on proposals.html theme-match the dashboard.
- C6. Sort and search work on every list view.
- C7. Mobile responsive at 375px renders without overflow (vision-verified at 375 viewport).

### PHASE D — Janowiak reference frame capture (parallel to A–C)

- D1. FIRST APPROACH per V2: launch Playwright with Founder's Chrome user-data-dir so existing X.com authentication carries over. SECOND: P5 outside-the-box — try yt-dlp / ffmpeg open-source extraction against the tweet URL (P4 free-replication path). THIRD: /i/status/ URL variant. FOURTH: direct video.twimg.com CDN URL from network log. FIFTH: screen-record the Playwright session and post-process. Only after 5+ distinct approaches all fail → STOP RULE 4.
- D2. Extract video duration.
- D3. Capture 12 frames at evenly-spaced timestamps.
- D4. Each frame saved as frame-NN-tS.Ss.png.
- D5. manifest.json with 12 entries: index, timestamp, filename, observed_state.
- D6. observed_state MUST come from agent LOOKING AT captured PNG via Read tool. No imagination.
- D7. Critic gate: "Did agent observe or invent observed_state?" Reject + redo if invented.

### PHASE E — Smoke test (cross-browser + real Firebase, 12 scenarios)

- E1. Confirm exists, run, capture exit code.
- E2. If any scenario fails: root-cause fix (P2 emulate first), re-run, document.
- E3. Smoke test output writes to .claude/state/aggregates/smoke-results.json + test-health.json reflects pass/fail.
- E4. Run on smoke@parbaughs.test account in smoke-test-league.
- E5. Vision-confirm final state of each scenario.

### PHASE F — FIQ (Firebase Index Queue) verification

- F1. firebase deploy --only firestore:indexes --dry-run shows zero pending indexes.
- F2. All composite indexes referenced in app queries exist + deployed Active.
- F3. Output: .claude/state/aggregates/fiq-status.json with pass/fail.
- F4. Dashboard banner reflects FIQ status.

### PHASE G — Visual + structural audits

- G1. tests/round-trip-test.py exit 0.
- G2. scripts/visual-audit/verify-scroll-reachability.mjs exit 0.
- G3. scripts/visual-audit/verify-all-flows-light-up.mjs exit 0.
- G4. PROP-012 visual review of every user-facing dashboard surface. Vision-verified per V1.
- G5. PROP-010 design-bot gate: each surface "intentional + clean + flows naturally" verdict logged with vision-observed evidence.

### PHASE H — Durability proof (the snapshot-vs-durable hard test)

- H1. From a clean state: rm -rf docs/reports/_assets docs/reports/*.html ; bash scripts/scaffold-from-templates.sh ; bash scripts/regen-all.sh.
- H2. After H1: every dashboard HTML present, every banner populated, grep "awaiting data" returns ZERO hits. VISION CHECK: screenshot dashboard, Read PNG, confirm banners visually populated.
- H3. scripts/verify-approval-pipeline.sh exit 0 twice in a row (idempotent).
- H4. Document H1+H2+H3 in retrospective as PROOF OF DURABILITY. Include vision evidence.

### PHASE I — Polish + final UI pass

- I1. Typography, spacing, alignment audited via PROP-012 across all dashboards. Vision-verified.
- I2. Empty states render with intentional copy. Vision-verified.
- I3. Loading states render before data arrives.
- I4. Error states render if an aggregator returns failure.
- I5. Dark mode consistent across all pages. Vision-verified.
- I6. Cross-page nav consistent.

### PHASE J — Hindsight + foresight + open-source consolidation (new)

After A–I are functionally complete, before final close:

- J1. HINDSIGHT pass: for each phase, write "How could this have been done better?" + cite open-source patterns we could now adopt as future migration paths.
- J2. FORESIGHT pass: for each phase, write "What breaks at 10x usage? At 100x?" + propose mitigations.
- J3. Open-source consolidation: identify any paid pattern silently inherited from prior sessions. Propose free-replication paths via task-queue/founder/ for Founder approval.
- J4. Document all of J1+J2+J3 in .claude/state/dashboard-audit-2026-05-15/HINDSIGHT-FORESIGHT.md.

## DONE WHEN (validator-checkable, every condition required)

- D1. ls docs/reports/*.html shows >= 10 files, each > 5KB.
- D2. grep -r "awaiting data" docs/reports/*.html returns ZERO hits.
- D3. grep for data-fq-banner-meta in docs/reports/dashboard.html returns 4+ unique anchors.
- D4. Every aggregate JSON in .claude/state/aggregates/ has generated_at < 1 hour old after final regen.
- D5. scripts/verify-approval-pipeline.sh exit 0 run twice in sequence.
- D6. tests/round-trip-test.py exit 0.
- D7. scripts/visual-audit/verify-scroll-reachability.mjs exit 0.
- D8. scripts/visual-audit/verify-all-flows-light-up.mjs exit 0.
- D9. Smoke test exit 0 (12 scenarios × 4 browsers green) + vision-confirmed final states.
- D10. FIQ status pass.
- D11. ls .claude/state/main-flows-v2/janowiak-reference-frames/*.png shows exactly 12 files, each > 5KB.
- D12. manifest.json valid JSON with 12 entries, each with non-empty observed_state.
- D13. PHASE H durability test passes (clean rebuild produces full working dashboard, vision-confirmed).
- D14. Every interactive element verified working via Playwright + vision-verified, evidence committed.
- D15. PROP-010 + PROP-012 design-bot APPROVE on every dashboard surface with vision evidence.
- D16. .claude/state/dashboard-audit-2026-05-15/SUMMARY.md exists with CRITICAL=0, HIGH=0 unresolved.
- D17. git status --porcelain empty.
- D18. Final commit pushed to origin/main; AMD-018 11-gate green.
- D19. Decision bubble retrospectives attached for every ship-close, plain-English, with disagreement OR unanimous note.
- D20. .claude/state/goal-final-report-dashboard-completion-{ts}.md committed, 5-component output per POST_PUSH_RETROSPECTIVE.md.
- D21. Every UI surface ship-close has at least one screenshot Read by the agent with observed_state recorded.
- D22. NEW: .claude/state/dashboard-audit-2026-05-15/HINDSIGHT-FORESIGHT.md exists with per-phase hindsight + foresight + open-source consolidation entries.
- D23. NEW: every ship-close retrospective contains a CITATIONS section listing web-search sources + open-source repos referenced + alternatives considered.
- D24. NEW: every aggregator + every fix has a SIMULATION section in its retrospective showing the P2 emulation outputs that preceded live application.

## VERIFY (validator runs these exact commands each turn)

- D1: count of HTML files in docs/reports/ is >= 10, each non-empty.
- D2: grep -r "awaiting data" across docs/reports/*.html returns count 0.
- D3: grep -o for data-fq-banner-meta returns >= 4 unique values.
- D4: load every JSON in .claude/state/aggregates/, assert generated_at within last 60 minutes.
- D5: run scripts/verify-approval-pipeline.sh twice, both exit 0.
- D6: python tests/round-trip-test.py exits 0.
- D7+D8: visual-audit scripts both exit 0.
- D11: 12 PNGs > 5KB each in janowiak-reference-frames/.
- D12: manifest.json valid, 12 entries, observed_state non-empty.
- D13 (durability): rm -rf + scaffold + regen-all ; re-run D1+D2.
- D17: git status --porcelain empty.
- D21: grep through ship retrospective markdown files for vision-observation blocks.
- D22: file exists at .claude/state/dashboard-audit-2026-05-15/HINDSIGHT-FORESIGHT.md, non-empty, contains per-phase sections.
- D23: grep through ship retrospectives for CITATIONS sections; assert each ship-close has one.
- D24: grep through ship retrospectives for SIMULATION sections where applicable; assert non-trivial aggregator/fix ships have one.

## OUTPUT (per turn + final)

Per turn:
- Atomic commits tagged with phase prefix.
- Post-commit hook fires regen pipeline (real, not silenced).
- Decision bubble transcript appended to ship's retrospective.
- Vision observation block(s) appended to ship's retrospective.
- CITATIONS + SIMULATION + HINDSIGHT + FORESIGHT sections per applicable ship-close.

Final:
- .claude/state/goal-final-report-dashboard-completion-{ts}.md with extended POST_PUSH_RETROSPECTIVE.md format:
  1. What changed + files + Caddy Notes + skills referenced
  2. Roadmap % complete
  3. Bubble transcripts (plain English, full agent conversations)
  4. Workflow doc test confirmed
  5. Growth report: skills + patterns + governance refinements
  6. Vision verification appendix
  7. Hindsight + foresight appendix
  8. Open-source consolidation proposals appendix
  9. Citations + alternatives-considered appendix

## STOP RULES

1. ALL DONE WHEN met → close.
2. AMD-015 real escalation (true Founder-presence-required action; exception-list deploy; architectural ambiguity unresolvable by 3+ agents discussing AND 3+ open-source comparisons AND 2+ simulations) → Surface to task-queue/founder/ with proposed answer + rationale. Continue OTHER phases in parallel.
3. 5+ documented attempts on single sub-issue without progress → surface, continue other phases.
4. Janowiak capture: 5+ distinct approaches per P5 enumeration AND vision/desktop control applied AND open-source extraction attempted AND all fail → surface STOP RULE 4 with last error verbatim, continue dashboard phases.
5. Token budget > 80% weekly quota → pause, preserve state, surface.

NOT a stop rule: turn count. Per P6, time is not the constraint; truth is. 150 turns, 500 turns, 1000 turns — the agent continues until DONE WHEN truthfully passes or another real stop fires.

## NOT STOP CONDITIONS

- "Most banners working"
- "Looks better than before"
- "Founder might want to review"
- "Cron will catch up next cycle"
- Single test failure (severity-triage then continue)
- Pacing concern (Founder explicitly directs no pacing pushback)
- Single phase complete (continue other phases)
- "Need Founder to log into X" — try user-data-dir + open-source extraction FIRST per V2 + P4
- "We've been at this a long time" — irrelevant per P6
- "We got the gist" — irrelevant per P6
- "Easy parts are done" — irrelevant per P6
- Turn count — NOT a stop rule per P6

## DELIBERATION GATE (decision bubble voting)

Before each ship-close commit AND before declaring goal DONE, run bubble vote:

- Engineer: technical correctness ("did this code do what it claims?")
- Critic: claim-vs-reality match ("did the agent observe or imagine?" — includes V1 vision check; includes P1 research check; includes P2 simulation check)
- Performance/Load: is the regen pipeline runtime acceptable? P3 foresight: how does this scale?
- Data Integrity: do aggregate timestamps reflect live state or stale?
- Research Depth (new): did the agent cite open-source alternatives per P4? Enumerate 3+ approaches per P5? Run simulation per P2?

Quorum: 2. Orchestrator breaks ties. Plain-English transcript attached.

Reject conditions:
- Critic: "agent imagined" or "agent skipped vision check"
- Data Integrity: "stale aggregate masquerading as fresh"
- Research Depth: "no citations, no alternatives, no simulation = depth-of-research violation per P1"

## ANTI-PATTERNS TO AVOID (explicit, per audit history + Founder philosophy)

1. Do not declare PASS on validator state that won't survive a clean rebuild from templates. That is snapshot-PASS.
2. Do not inject markup into uncommitted ad-hoc DOM positions. All banner anchors derive from templates.
3. Do not write observed_state for Janowiak frames from imagination.
4. Do not self-authorize governance amendments.
5. Do not pattern-match "8/8 PASS" closure language. Use scoped language.
6. Do not declare a UI surface working based on exit codes / grep / lint alone. Apply V1.
7. Do not ask Founder when V2 authorizes the action.
8. NEW: Do not skip P1 depth-of-research. "I looked into it" = rejected.
9. NEW: Do not skip P2 simulation before live application of changes.
10. NEW: Do not skip P3 hindsight + foresight in retrospectives.
11. NEW: Do not adopt paid services or paid patterns when P4 free-replication paths exist without explicit Founder approval.
12. NEW: Do not pick the first-obvious approach when P5 outside-the-box enumeration would surface a better option.
13. NEW: Do not stop on turn count or time. P6 explicitly rejects time-based stops.

## SCOPE OUT (do not touch)

- src/pages/, src/core/, functions/ (production app code) except where dashboard regen reads from them
- firestore.rules, firestore.indexes.json (except read-only for FIQ verify)
- secrets, IT Glue, credentials
- W1.S1+ ship work (gated by this goal)

## LAUNCH INVOCATION (paste this at /goal prompt — under 4k chars)

The Founder saves this spec to C:\Users\Zach\Downloads\ then launches Claude Code from the repo root with `claude --effort max --dangerously-skip-permissions` and pastes the following at the /goal prompt:

---BEGIN /goal PASTE---
/goal Self-install + execute dashboard completion spec. Step 1: move /c/Users/Zach/Downloads/dashboard-completion-spec-2026-05-15.md to .claude/state/dashboard-completion-spec-2026-05-15.md (commit it). Step 2: read that spec for full FOUNDER OPERATING PHILOSOPHY (P1-P6) + VISION+DESKTOP AUTHORIZATION (V1-V3) + PRE-RESEARCH + 10 PHASES + 24 DONE WHEN + VERIFY + STOP RULES + DELIBERATION GATE.

GATE: This goal BLOCKS all PARBAUGHS app feature work. W1.S1 does not open until this closes.

P1-P6 philosophy binds: P1 depth-of-research mandatory (citations + 3+ alternatives + open-source comparisons), P2 emulation required before live application, P3 hindsight + foresight in every retrospective, P4 open-source FIRST paid LAST, P5 outside-the-box enumeration (3+ approaches per non-trivial decision), P6 time is NOT the constraint — truth is — no turn-count stop.

V1-V3 authorization: V1 vision verification REQUIRED (screenshot + Read + observed_state on every UI claim). V2 desktop control authorized in scope (Playwright + Chrome user-data-dir, PowerShell, Git, scratch dirs, ffmpeg, yt-dlp, smoke automation). V3 less friction — act within authorization, surface only on out-of-scope.

10 PHASES: A inventory + research baseline; B live data wiring (simulate then apply); C interactive UI (before/after vision); D Janowiak via 5+ creative approaches (Chrome profile, yt-dlp, ffmpeg, /i/ variant, video.twimg.com CDN, screen-record); E smoke + vision; F FIQ; G visual/structural audits; H durability proof (rm -rf + scaffold + regen); I polish; J hindsight + foresight + open-source consolidation.

CONSTRAINTS bind: AMD-009..025, PROP-006..014, all skills, AMD-021 strict closure, AMD-009 P5 honest delta, no exit-code-swallowing, no agent self-authorization of governance, decision bubble voting (Engineer + Critic + Performance/Load + Data Integrity + Research Depth) on every ship-close.

STOP RULES: ALL DONE WHEN met → close. Real AMD-015 escalation (after 3+ agents discussed AND 3+ open-source comparisons AND 2+ simulations) → surface + continue. 5+ documented attempts on single sub-issue → surface, continue. Janowiak: 5+ distinct creative approaches all fail → surface, continue dashboard phases. Token > 80% weekly → pause. NO TURN-COUNT STOP per P6.

NOT STOP CONDITIONS: "most banners working", "looks better", "Founder might want to review", "cron will catch up", single test failure, pacing concern, "need Founder for X login" (try user-data-dir + yt-dlp first), "we've been at this a long time", "we got the gist", "easy parts done", turn count — all invalid per P6.

Begin self-install immediately, then read spec in full, then begin PHASE A (which includes P1 research baseline + P5 alternatives enumeration). Phases D + A run in parallel after pre-research clears. Validator checks all 24 DONE WHEN every turn. Loop continues until truth, not time.
---END /goal PASTE---
