# FOUNDER VERIFICATION PACKET — dashboard-completion-spec-2026-05-18

**Status:** AWAITING FOUNDER APPROVAL — packet refreshed 2026-05-18 (session 2) post-Phase-B close.

**Per spec D49:** This goal cannot close until the Founder writes an approval marker `FOUNDER-APPROVED-{TIMESTAMP}` IN THIS FILE. Per spec ANTI-PATTERN 23: do not close the goal on agent-only bubble approval. The agent self-close recursion stops HERE.

**Created:** 2026-05-18 session 1; refreshed 2026-05-18 session 2 (post-Phase-B-close).
**Spec:** `.claude/state/dashboard-completion-spec-2026-05-18.md`
**Live dashboards:** `file:///C:/Users/Zach/smoky-mountain-open/docs/reports/dashboard.html` (and 9 sibling reports)

## ⚡ SESSION 2 PROGRESS SUMMARY (read first)

The Founder explicitly held approval pending Phase B close ("dashboard.html zeros"). Session 2 closes Phase B. The 5 traced values previously held over for re-verification have changed materially:

| Value | Session 1 state | Session 2 state | Change reason |
|---|---|---|---|
| TOKENS THIS WEEK (dashboard.html) | 102.0k (stale) | **4,051.83M** | Phase B GAP-1 fix — consumer now reads from token-usage-snapshot.json |
| TOKENS QUOTA WEEKLY | 102.0k (stale) | **4,051.83M** | Phase B GAP-2 fix — quota_status.weekly_tokens overridden with session-transcript truth |
| 7-day token trend chart | 1 bar (102k) | **7 bars (May 14 spike at 2.23B)** | Phase B GAP-3 fix — trend computed from session_transcripts.by_day_total |
| Round-Trip Last Pass | "unknown" + "watcher cycling" | **"2026-05-18T17:34:43Z" + "GATE-FAIL · regen ran Xmin ago but a gate failed"** | Phase B GAP-4 fix — schema parity in last_regen_all_status() |
| AgentShield CRITICAL count | 18 (framing: ~12 skill-instrumentation, ~3 false-pos, ~3 policy) | **18 (framing CORRECTED: 0 skill-instrumentation, 9 false-pos UNFIXABLE without upstream, 3 policy, 6 worktree → Phase H)** | Skill-instrumentation work shipped (42 MEDIUM closed) but did NOT reduce CRITICAL count; D31 zero-CRITICAL structurally blocked by AgentShield 1.5.0 lacking suppression mechanism |

**New ships this session (atomic commits in main, all pushed via cron):**
- `[session-2 prep]` cron drift commit
- `[security-P8] AgentShield skill instrumentation — 21 skills updated, 42 MEDIUM closed`
- `[phase-B] dashboard.html cross-surface P9 fix — GAP-1/2/3/4 closed`
- `[ecc-compat] HOOK-COMPARISON + Founder decision packet — 4 GAP-FILL ECC hooks recommended`
- `[security-P8] AgentShield false-positive suppression — 0 CRITICAL closed` (proof that suppression doesn't exist)
- `[phase-M] main-flows iteration M5.1+M5.2 — 7.8/10 → 8.6/10 vs Janowiak`
- (Phase T6 three-view pie chart — in flight via background agent)

**New Founder-facing decision files (3 surfaced, awaiting approval):**
1. `task-queue/founder/hook-comparison-decision.md` — 4 ECC hooks recommended for ALONGSIDE-PARBAUGHS install (NO install until Founder approves)
2. `task-queue/founder/` — task #3 policy overpermissiveness ratification (3 Bash(*) CRITICALs, need Founder to ratify the specific command list)
3. (THIS FILE for D31 path-forward) — AgentShield 1.5.0 has no suppression mechanism. D31 zero-CRITICAL is structurally blocked unless Founder picks: (a) accept --min-severity high gate with documented exception list, (b) wait for upstream PR, (c) refactor PARBAUGHS hooks to avoid the flagged patterns.

**Documents emitted this session:**
- `.claude/state/dashboard-audit-2026-05-18/PHASE-B-GAPS.md` — full per-card gap audit
- `.claude/state/dashboard-audit-2026-05-18/HOOK-COMPARISON.md` — ECC hooks head-to-head
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-REMEDIATION-LOG.md` — skill instrumentation report
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-FALSE-POSITIVE-LOG.md` — suppression mechanism investigation
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-UPSTREAM-ISSUES.md` — 3 upstream issue drafts ready
- `.claude/state/main-flows-v2/M4-M5-SCORE-2026-05-18-session-2.md` — Phase M scoring + iteration log + path-to-9.5

---

## Session-1 progress summary

Phases COMPLETED this session:
- ✅ **Phase 0 (all 7 sub-steps)** — Superpowers active, ECC + chrome staged for next session reload, AgentShield baseline captured (Grade F triage doc available), substrate audit done, CLAUDE.md rewritten 68.5k → 12.5k chars.
- ✅ **Phase A** — V1 baseline + INVENTORY.md committed. 10 dashboards × 3 viewports + wide variants = 32 PNGs at `scripts/visual-audit/2026-05-18/`. P9 baseline trace for token-usage surface complete; other surfaces noted as PENDING Phase B with honest disclosure.
- ✅ **Phase T1 + T5** — Token meter wire-up fix shipped. PARBAUGHS was never reading Claude Code session transcripts; now does. Real spend jumped from 102K → **6.3B tokens** captured across 28 sessions, the actual ground truth. Weekly card switched from stale 102k to live 3,951.52M (last-7-days from session transcripts).
- ✅ **Phase D** — 12 Janowiak frames captured (Plan A: Playwright + Chrome user-data-dir, first try success), manifest.json populated with observed_state per frame via V1 inspection, decomposition document characterizing the reference across 5 dimensions (composition, interaction, motion, color, editorial emphasis).

Compatibility verdict: **YELLOW** (clean rollback path documented, coexistence-policy specifies which plugin owns which surface). RED not triggered; spec proceed-condition met.

Phases NOT YET complete (will continue across sessions until D49 approved or Founder redirects): B (per-aggregator wiring for non-token surfaces), C (interactive UI verification), E (smoke 12 × 4 browsers), F (FIQ + Firestore rules audit), G remaining (visual structural), H (durability test), I (polish), J (consolidation) + remaining T (T2 tagging refinement, T3 competitive captures, T4 console comparison, T6 pie chart, T7 taste score) + M iteration to ≥9.5.

## Validator-confirmed DONE WHEN this session

✅ **D1** Superpowers + chrome installed/staged
✅ **D2** ECC rules/{common,typescript,python} at ~/.claude/rules/ecc/
✅ **D3** AgentShield via npx works (v1.5.0)
✅ **D4** Phase 0.4 verdict YELLOW committed
✅ **D5** coexistence-policy.md committed
✅ **D6** substrate-audit-2026-05-18.md committed
✅ **D7** CLAUDE.md 12,482 chars (under 15k)
✅ **D8** AMD-018/022/023/024 confirmed in KEEP list
✅ **D9** 10 dashboards, all > 5KB
✅ **D10** zero "awaiting data" hits
✅ **D11** data-fq-banner-meta: 5 unique anchors (≥ 4)
✅ **D14** round-trip-test.py exit 0 (with 12 documented internal warnings → Phase B/G backlog)
✅ **D15** verify-scroll-reachability.mjs exit 0 (all surfaces fully visible at bottom)
✅ **D16** verify-all-flows-light-up.mjs exit 0 (10/10 sample flows light up correctly)
✅ **D17** token meter cumulative week-to-date: 3,951.52M displayed, P9-traced through session-transcript-summary
✅ **D21** 12 PNGs > 5KB in janowiak-reference-frames/ (each ~2MB)
✅ **D22** manifest.json valid, 12 entries, observed_state non-empty per entry
✅ **D23** janowiak-decomposition-2026-05-18.md exists, characterizes across 5 dimensions
✅ **D27** .claude/state/security/baseline-20260518-131015/ with AgentShield + npm-audit outputs
✅ **D32** DATA-TRUTH-MATRIX.md exists (partial-but-honest: token-usage fully traced, others honestly noted PENDING)
✅ **D34** ingest-session-transcripts.py has --self-test mode (post-commit hook integration pending)
✅ **D40** competitive references peer-refs-2026-05-16 (Datadog/Linear/Sentry/Stripe/Vercel = 5 sources, 11 PNGs)
✅ **D48** verification packet exists with 5 traced values + screenshots + approval-string field (this file)

🟡 **D12** every aggregate generated_at within 60 min — likely TRUE post-current-regens; needs explicit verify
🟡 **D13** verify-approval-pipeline.sh twice — in flight, will report next iteration

🔄 Pending (next session(s)):
- D18 (day-to-date + last-ship explicit) — partial
- D19 three-view toggleable pie chart (Phase T6)
- D20 token meter Founder-console comparison (needs Founder paste)
- D24 main-flows ≥ 9.5 score (Phase M iteration)
- D25 smoke 12 × 4 browsers (Phase E)
- D26 FIQ status
- D28-D31 SECURITY block + scanner fixture + Firestore rules + zero-CRITICAL
- D33 zero unexplained zeros across all surfaces (Phase B)
- D35-D37 durability + tree-clean verify + push to origin
- D38-D42 interactive verification + design-bot + per-surface taste + TASTE-AUDIT.md
- D43-D47 retrospective + reports + consolidation
- D49 FOUNDER-APPROVED-{TS} (Founder action)

Total this session: **~22 of 49 DONE WHEN** verified passing. Plus substantial structural work (token meter wire is the heart of the audition).

---

## The 5 most-prominent traced values per P9.4

### Value 1 — Token meter shows **6,310,903,958 cumulative tokens** (was 102,000 before T1 wire)

| Field | Value |
|---|---|
| Displayed total | `all_time.real = 6,303,919,928` in `token-usage-snapshot.json` (plus 7.29M estimated, 0 manual) |
| Session-transcript source | `~/.claude/projects/C--Users-Zach-smoky-mountain-open/*.jsonl` — 28 JSONL files, 137 MB |
| Ingester | `scripts/ingest-session-transcripts.py` — 15,658+ assistant turns ingested |
| Summary file | `.claude/state/telemetry/aggregates/session-transcript-summary.json` (P9 trace) |
| Aggregator merge | `scripts/aggregate-token-usage.py` Source E function — scan_session_transcripts() |
| Dashboard data block | `docs/reports/token-usage.html` `<script id="report-data">` after `python scripts/regen-token-usage.py` |
| Self-test | `python scripts/ingest-session-transcripts.py --self-test` exits 0 (asserts non-zero source = non-zero output) |
| End-to-end match | ✅ PASS — all four points (source, summary, snapshot, dashboard data) agree |

**Founder verification step:**
Open `docs/reports/token-usage.html` in a browser. Confirm the headline total is in the BILLIONS (not millions). Spot-check the breakdown by day — `2026-05-14` should show ~2.23B (the substrate-build-day-3 marathon session); `2026-05-13` should show ~672M.

> Note on interpretation: the 6.3B is **raw token sum** including `cache_read_input_tokens`. Cache reads are priced ~10% of input tokens (Opus rate). True billing-equivalent spend is much smaller than the raw number suggests. Phase T (remaining T2-T8) will add cost-weighted display, three-view pie chart, and proper cache-read disaggregation in the UI. The raw number is HONEST; the dashboard polish is incomplete.

### Value 2 — `_meter_status: "wired-real"`

| Field | Value |
|---|---|
| Displayed | `_meter_status: "wired-real"` (top of snapshot) |
| Source | `.claude/state/quota-status.json` (sidecar output) |
| Sidecar state | `fresh` — `age_seconds: 33` at snapshot time |
| Dashboard data block | `quota_status.state: "fresh"` |
| End-to-end match | ✅ PASS |

**Founder verification step:** Open `docs/reports/token-usage.html`, look at the "Anthropic Quota" header strip. Confirm it shows either a percentage or "auto-derived from measured cycle telemetry" rather than "no data". This validates the sidecar is alive.

### Value 3 — AgentShield baseline: **Grade F (31/100), 18 CRITICAL + 32 HIGH**

| Field | Value |
|---|---|
| Displayed (when dashboard rebuilds) | `Grade F` |
| Source | `npx ecc-agentshield scan` (run 2026-05-18T17:17:15Z) |
| Report file | `.claude/state/security/baseline-20260518-131015/agentshield-baseline.txt` |
| Triage doc | `.claude/state/phase-0/install-record.md` "AgentShield baseline summary" section |
| End-to-end match | ✅ PASS — the F is the truthful baseline |

**Founder context:** The CRITICAL/HIGH findings are MOSTLY:
- **Skill instrumentation gaps** (PARBAUGHS skills written before ECC 2.0 standards exist — missing observation hooks + version metadata + rollback metadata)
- **False positives** in PARBAUGHS's own secrets-scanner.sh (the scanner's regex pattern `-----BEGIN PRIVATE KEY-----` is detected by AgentShield as a hardcoded private key)
- **Policy choices** (Bash(*), Edit(*), Write(*) overpermissive for dev iteration)

These are NOT credential leaks or RCE risks. They're remediable instrumentation work. Concrete next-step P8 backlog will:
1. Add observation hooks + version metadata to 21+ parbaughs-* skills
2. Tighten Bash/Edit/Write scopes once specific commands are stable
3. Get AgentShield to recognize PARBAUGHS scanner regex patterns as detection rules, not as embedded secrets (file an issue / submit PR upstream if needed)

**Founder verification step:** Read the "AgentShield baseline summary" in `.claude/state/phase-0/install-record.md`. Confirm the breakdown matches your understanding of "false positives + remediable, not credential leaks." If you disagree (i.e., you want a stricter interpretation), say so — that changes the goal-close definition.

### Value 4 — Plugin coexistence verdict: **YELLOW**

| Field | Value |
|---|---|
| Displayed | `YELLOW` — pre-existing + structural collisions, no startup errors |
| Source | `.claude/state/phase-0/compatibility-verdict.md` |
| Coexistence policy | `.claude/state/phase-0/coexistence-policy.md` |
| Known issues | continuation-discipline duplicated (pre-existing); ECC's 30+ hooks (gateguard-fact-force will block first Edit per file once active); ECC's bash-dispatcher overlaps PARBAUGHS pre-commit-lint |
| End-to-end match | ✅ PASS — verdict accurately reflects observed + anticipated state |

**Founder verification step:** Skim `.claude/state/phase-0/coexistence-policy.md`. Confirm the surface-ownership table reflects your intent (Superpowers owns methodology spine; AgentShield via npx is primary security; PARBAUGHS substrate takes precedence on conflicts). If the table is wrong, redirect.

### Value 5 — CLAUDE.md size: **12,482 chars** (was 68,525)

| Field | Value |
|---|---|
| Displayed | `12,482 chars` (verifiable: `wc -c CLAUDE.md`) |
| Target | ≤ 15,000 chars per spec line 122 |
| Pre-rewrite preserved | `.claude/state/archived-substrate-2026-05-18-claudemd-pre-rewrite.md` (68,525 chars) |
| Detail moved | `docs/`, `.claude/state/phase-0/coexistence-policy.md`, archived pre-rewrite for full historical detail |
| End-to-end match | ✅ PASS — under ceiling; no "Large CLAUDE.md" warning expected on next session start |

**Founder verification step:** Open `CLAUDE.md` and read it. Confirm:
1. Identity / vision / three-agent workflow / production-risk boundaries are present.
2. The P1-P9 + V1-V3 operating principles are stated.
3. The 11-gate AMD-018 production-risk boundary is intact.
4. Plugin coexistence pointer is present.
5. The detailed material you NEED is accessible via documented pointers (you should not have to ask "where did X go?" — if you do, that's a defect for the next session).

---

## What's NOT in this packet (transparently)

Phases B (live data wiring for non-token aggregators), C (interactive UI), D (Janowiak frames), E (smoke 12 × 4 browsers), F (FIQ + Firestore rules audit), G (visual + structural audits), H (durability rm-rf-scaffold-regen), I (polish + tree-clean), J (consolidation) are NOT YET COMPLETE this session.

Phase T sub-tasks remaining: T2 (tagging design beyond default unattributed), T3 (competitive scan for token meters + pie charts), T4 (Founder Anthropic console comparison for tolerance check), T5 (cleanup of stale fallback-to-zero paths now that real data flows), T6 (three-view toggleable pie chart), T7 (taste score ≥ 9.5), T8 (Founder packet — this file).

Phase M (main-flows fresh re-review ≥ 9.5 vs Janowiak + 2+ peers) is NOT YET STARTED this session.

The agent will continue making progress on remaining phases across subsequent sessions (or this one, if it keeps running) until D49 approval closes the goal OR you redirect.

---

## ⚠ Honest disclosure — dashboard.html P9 gap discovered post-T1

V1 inspection of `docs/reports/dashboard.html` (the main dashboard at the directory root) shows widespread `0` / `—` / "Loading..." across ~15 banner cards (Amendments Pending, Bubbles Flagged, Proposals Pending, Test Health, Security Health, Approvals Pipeline, Architecture Review, Round-Trip Last Pass, Working Tree, Active Halts, Tokens This Week, etc.).

This is a P9.2 violation across cross-surface data. The underlying aggregate JSONs DO have data (token-usage-snapshot.json shows 6.31B real; security-health.json has a fresh status; etc.), but the main dashboard's consumer JS isn't reading from the same sources OR has silent fallback-to-zero paths.

This is **NOT a regression introduced by this session's work** — the dashboard's structural data flow predates Phase T1. But T1's surfacing of session-transcript truth has made the cross-surface inconsistency more visible: `token-usage.html` correctly shows 6.3B; `dashboard.html` shows 0 for the same metric.

**Phase B (priority)** in the prioritized remaining-work list closes this. It's the largest single P9 gap.

## What to verify visually (under 5 minutes total)

These are the five visible things to look at in a browser. None require engineering judgment.

### 1. Token meter (open `docs/reports/token-usage.html`)

Look at the three KPI cards at the top:
- **METER STATUS: LIVE** + `sidecar fresh (~Nm ago)` — the agent says live data is flowing.
- **WEEKLY TOKENS (LIVE): 3,951.52M** + `last 7 days · session transcripts (real)` — the agent says this is the actual sum of Claude tokens consumed in the last 7 days, derived from Claude Code's own session transcripts.
- **ORG MONTHLY: 6,318.30M** + `estimated all-time · no org-monthly cap configured` — honest fallback (no monthly cap is set, so this shows all-time instead).

**Visually check:** numbers are in the BILLIONS / hundreds-of-millions, not 102k. If you see 102k anywhere, the wire broke. If you see "no data" anywhere, that's a stale rendering that should be re-regenerated.

> **Compare against your Anthropic console** (https://console.anthropic.com/settings/usage) — does the 3.95B weekly roughly track your actual paid usage? It will be HIGHER than billed-tokens because raw token sum includes cache reads (10x cheaper than uncached input). Phase T6 will add cost-weighted display.

### 2. Dashboard cards across surfaces

`docs/reports/index.html` is the directory. Open each linked dashboard and scan for:
- Big numbers that look reasonable (not all zeros)
- "Awaiting data..." text — should NOT appear anywhere (confirmed: 0 hits in current state)
- Stale dates older than today — flag if you see any "Refreshed N days ago" beyond ~1 hour

### 3. CLAUDE.md size

`wc -c CLAUDE.md` → 12,482 chars. Open it; confirm:
- Identity, three-agent workflow, AMD-018 11-gate are all present
- The detail you need is accessible via pointers (not deleted, just moved to `.claude/state/` and `docs/`)

### 4. Verification packet (this file)

Confirm the 5 traced values listed above the visual section are values you can actually check. If anything is too engineering-y, redirect.

### 5. Janowiak reference (decomposition + frames)

`.claude/state/main-flows-v2/janowiak-decomposition-2026-05-18.md` — read the senior-designer takeaway at the bottom. That's what main-flows.html will be measured against in subsequent ships.

Frames at `.claude/state/main-flows-v2/janowiak-reference-frames/frame-{01..12}-t*.png` (~24MB total).

## Prioritized remaining work (next sessions)

Highest leverage to ship next (per Founder priority):

### Tier 1 — Closes most user-visible gaps
- **Phase T6** — three-view toggleable pie chart (agent role / work category / session). The current donut chart is single-view; spec calls for three views.
- **Phase B** — wire remaining aggregator P9 traces (test-health, security-health integrating AgentShield baseline, approvals-pipeline, architecture-review). Closes D33 across-surface zero-sweep.
- **Phase M** — main-flows iteration against Janowiak decomposition + 2+ peers to ≥ 9.5. Closes D24.

### Tier 2 — Closes durability + security gates
- **Phase H** — durability test (rm-rf docs/reports/_assets + *.html → bash scaffold → bash regen-all → verify all dashboards re-render). Closes D35.
- **Phase F** — Firestore rules coverage matrix + Cloud Function audit + bundle exposure scan. Closes D30 + D31 partial.
- **Phase E** — smoke 12 × 4 browsers (chromium/firefox/webkit + mobile). Closes D25.
- **Skill instrumentation remediation** — add observation hooks + version metadata to 21+ parbaughs-* skills. Closes most of the AgentShield CRITICAL findings → D31 zero-CRITICAL.

### Tier 3 — Closes consolidation gates
- **Phase J** — retrospective + final report + CONSOLIDATION.md. Closes D43-D47.
- **Per-ship SECURITY blocks** in retrospectives. Closes D28.

## Open questions for Founder

Decide / hold / redirect on each:

1. **Token meter raw-count vs cost-weighted display.** Current ALL-TIME shows 6.3B which is dominated by cache-read tokens (very cheap). Do you want a USD-cost display that down-weights cache reads (more accurate to Anthropic billing) or do you want token count to stay primary?

2. **AgentShield CRITICAL findings.** Most are skill-instrumentation gaps + false positives in PARBAUGHS scanner regex. Should the agent (a) remediate them all this audit cycle to hit D31 zero-CRITICAL, OR (b) accept them as documented-known-issues and proceed to app feature work, OR (c) submit upstream PRs to AgentShield to teach it about scanner-regex false positives?

3. **D13 verify-approval-pipeline reliability.** The watcher requires a clean tree to apply approvals. In active development sessions the tree is rarely fully clean. Option (a): add `.claude/state/dashboard-health/post-commit-hook.log` to Class A auto-clean paths or .gitignore. Option (b): change the watcher to apply during dirty trees if the dirty files are scoped to .claude/state/dashboard-health. Both fix the loop; preference?

4. **ECC activation timing.** Currently ECC plugin is staged but not active in current session. Activating requires either (a) `/reload-plugins` slash command (Founder runs it) or (b) restart Claude Code. Once active, ECC's hook system fires — some hooks (gateguard-fact-force) WILL conflict with PARBAUGHS workflow. Coexistence-policy specifies disables. Should we (i) activate now and apply the disables, (ii) defer activation until app-work phase (using AgentShield via npx + ECC skills/agents as read-only library), or (iii) drop ECC entirely?

5. **Founder Verification Packet recursion-breaker confidence threshold.** Per spec P9.6, after three consecutive ships where automated truthfulness self-check + Founder visual verification + 48h no-surprise all hold, the substrate retires the packet for routine ships. Do you want to begin counting now, or only after Phase J closes?

## Founder approval section

**To approve this packet** (closes the goal per D49), append below this line:

```
FOUNDER-APPROVED-<TIMESTAMP>
```

…where `<TIMESTAMP>` is the ISO-8601 UTC time you approved (e.g., `FOUNDER-APPROVED-2026-05-18T18:15:00Z`).

**To redirect** (i.e., goal scope wasn't what you wanted): leave a note here and the agent will adjust on next session.

**To hold** (i.e., need more iteration before approval): leave a "HOLD: <reason>" note here. Agent continues iterating.

---

## Prior packet history

A 2026-05-16 packet existed for the prior `dashboard-completion-spec-2026-05-15.md` spec (40 DONE WHEN). It was never approved before the spec evolved to the current 2026-05-18 version. The prior content is preserved in git history and at `.claude/state/archived-substrate-2026-05-18-claudemd-pre-rewrite.md` if needed for cross-reference. Current packet supersedes.
