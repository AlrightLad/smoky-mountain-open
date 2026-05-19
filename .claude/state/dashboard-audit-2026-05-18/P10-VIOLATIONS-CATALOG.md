# P10 violations catalog — 2026-05-19

Per AMD-026 (Actionable Surfacing). Per Founder LOCK 2026-05-19: retrofit
ALL 10 dashboards before re-emitting Founder Verification Packet.

**Audit scope:** 9 of 10 surfaces (main-flows.html EXCLUDED — main thread iterating).

**Method:** read template + regen script + most-recent V1 capture (where available).
Classify visible elements against P10 categories A–F. WHAT-ACTION proposes the
fix to make each element actionable (WHAT/WHERE/WHAT-ACTION per P10 statement).

**P10 categories (per AMD-026):**
- **A.** Count without destination — bare number with no click-to-detail
- **B.** Cron-noise mixed with Founder-state — heartbeats next to actionable events
- **C.** Unknown / dash / N/A / loading without action — "—" / "0 of 3" / "loading…" with no next-step copy
- **D.** Silent fallback-to-zero in render code — `data.value || 0` masking broken sources
- **E.** Banner state without resolution path — yellow/red with summary but no action button / command
- **F.** Empty state without classification — empty list with no copy classifying legitimate-empty / loading / error / misconfigured

---

## Summary

| Surface | Violations | Severity (max) | Estimated fix effort |
|---|---|---|---|
| dashboard.html | 14 | high | large |
| activity.html | 6 | high | medium |
| amendments.html | 4 | medium | small |
| design-system.html | 0 | n/a | n/a (P10-CLEAN) |
| discussion-bubbles.html | 7 | medium | medium |
| escalations.html | 5 | medium | small |
| index.html | 9 | high | medium |
| proposals.html | 8 | medium | medium |
| token-usage.html | 12 | high | large |
| **TOTAL (9 surfaces)** | **65** | — | — |

**Severity rubric:**
- **high** = element is Founder-action-required-or-cron-noise ambiguous, blocks decision-making, or masks broken data path
- **medium** = element renders honestly but lacks WHAT-ACTION affordance
- **low** = element shows count/state but a click-to-source link is the only missing piece

**P10-CLEAN surfaces:** design-system.html (static token reference; no data,
no counts, no banners — P10 not applicable).

---

## Most-severe top-5 violations (highest Founder visibility impact)

1. **dashboard.html · Round-Trip Last Pass card** — currently "unknown" + "watcher cycling" subtitle. No WHAT-ACTION. Founder cannot tell whether watcher is healthy (cron-noise) or whether autonomous work is genuinely blocked. Category **B + C**. (PHASE-B-GAPS.md confirms GAP-4 was identified for session 2 fix.)
2. **dashboard.html · System health 4-banner row** (Test / Security / Approvals / Architecture) — yellow/red status plus summary but **NO action button** linking to the underlying aggregator file or remediation. Category **E**. Founder clicks reveal a `data-fq-banner-detail` panel but no command-to-resolve.
3. **token-usage.html · "All-time tokens" donut shows 0 + "—" everywhere** — the V1 capture renders dashes in every bucket (real / estimated / manual / by_agent / by_cron / by_ship) with **no copy classifying** whether this is legitimate-empty (no events yet), error (aggregator failed), or misconfigured (sidecar absent). Category **C + D + F**.
4. **activity.html · "Handoffs (7d) 0 / Active agents 0 / Active ships 0 / Scenario coverage 0 of 11"** — all zeros, **no classification** of whether this is legitimate (no activity yet) or whether telemetry is broken. "0 of 11 canonical scenarios" with no link to scenarios doc. Category **C + F**.
5. **dashboard.html · TOKENS THIS WEEK = 102.0k** (per PHASE-B-GAPS GAP-1) — silent fallback-to-zero pattern: `snap.get("weekly_tokens", 0)` masks broken source (current-snapshot.json doesn't include session transcripts). Founder sees a confident "102k" that is 4 orders of magnitude smaller than reality. Category **D** (root P10 violation: silent fallback).

---

## Per-surface detail

### 1. dashboard.html

**Source:** `templates/dashboards/dashboard.template.html` (1157 lines) +
`scripts/regen-dashboard.py` (1580 lines). V1 capture: `scripts/visual-audit/dashboard/dashboard-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | "Amendments pending" KPI card | A | Bare number "0" inside `<a href="amendments.html">` | template.html:120-124 | KPI is wrapped in `<a>` (destination present) but count of 0 has no "click for amendments queue" hint copy; sub-label says "awaiting Founder ratification" — add empty-state classification "no drafts pending — orchestration team has none authored" when count=0 |
| 2 | "Bubbles flagged" KPI card | A | "0" + "tie-break or Founder weigh-in" | template.html:125-129 | Same pattern; legitimate-empty when 0 — sub-label should say "no flagged bubbles — quorum reached on all" |
| 3 | "Open escalations" + "phase escalations" subtitle | A + F | "0" + "phase escalations" (generic) | template.html:135-139 + JS line 857-859 | Sub-label literally renders "phase escalations" string; replace with classified empty-state "no escalations pending Founder decision" |
| 4 | "Round-trip last pass" + "watcher cycling" | **B + C** | "unknown" + "watcher cycling" subtitle | template.html:198-202 + regen-dashboard.py last_regen_all_status() | **PHASE-B-GAPS GAP-4 confirms:** when `lr.ts` is null, the JS renders literal "unknown" with subtitle that mixes cron heartbeat status ("watcher cycling") with Founder-actionable signal. Should classify: NEVER ("no heartbeat recorded; run scripts/regen-all.ps1 once to seed") vs STALE (with ts + action) vs PASS |
| 5 | Test/Security/Approvals/Architecture **health banners** (4 cards) | **E** | yellow/red + truncated summary; clicking reveals detail panel | template.html:165-217 + JS lines 1027-1076 | Detail panel surfaces `info.source` + `info.summary` but **no action button** ("Re-run scan", "Open aggregator JSON", "Acknowledge"). Add: explicit `<button>` for the next remediation step per banner — e.g. Security RED → "View leak findings" link + "Re-run AgentShield" command shown |
| 6 | "Architecture review" banner shows "unknown · 0 pending recommendations" | C + F | "—" + "0 pending recommendations" | template.html:189-197 (per PHASE-B-GAPS B4) | Sub-phase B4 calls this intentional empty state; needs explicit classification copy: "Architecture / AI Engineer agent (Terminal 6, AMD-024) has not yet emitted — see .claude/state/aggregates/architecture-review.json (absent) — action: none until Terminal 6 dispatches" |
| 7 | "Working tree" card states "dirty (39 files)" | A + E | "dirty (39 files)" + "requires Founder intervention" OR "commits pending; watcher will catch up" | template.html:203-207 + JS 889-910 | No link to `git status --short` output, no list of the 39 paths, no "Resolve" action. Add: details disclosure listing the 39 files OR a "Run scripts/commit-cron-output.ps1" command if dirty-cycling |
| 8 | "Active halts" KPI | A + F | "0" + "no active halts" | template.html:208-212 | Legitimate empty handled (good); but no link to `.claude/state/halts/` so Founder can verify "no active halts" against directory — add link to halts dir for trust verification |
| 9 | **TOKENS THIS WEEK** | **D** | "102.0k" (stale — should be 4.03B) | template.html:262-267 + regen-dashboard.py:1458 | **PHASE-B-GAPS GAP-1 root cause:** `snap.get("weekly_tokens", 0)` silently falls back to 0 when current-snapshot.json field missing; consumer should read from token-usage-snapshot.json session_transcripts.weekly_real_7d. P10 sister-fix: ALSO classify when fallback hits — sub-label should explicitly say "FALLBACK — token-usage-snapshot session_transcripts not ingested" |
| 10 | **Tokens today (UTC)** | D | "127.45M" or "—" + "day-to-date · UTC · no events recorded yet today" | template.html:273-277 + JS 478-484 | When 0, copy says "no events recorded yet today" — close to P10-compliant but doesn't surface the trace command ("scripts/aggregate-token-usage.py") to verify; add WHERE link |
| 11 | **Anthropic quota** card | D + C | "$0.00" + "no usage recorded yet · sidecar awaits Founder paste" | template.html:278-282 + JS lines 526-575 | Honest empty-state copy exists; missing WHAT-ACTION command. Add: "Run `scripts/refresh-quota-manual.ps1` to anchor a paste from claude.ai" as an actionable button |
| 12 | Cycles complete (7d) / Paused / Halted | A + F | "1 / 0 / 3" (numbers visible) | template.html:295-316 + JS 583-591 | Halted=3 is a high-severity signal but no link to halt list or "View 3 unresolved halts" action; clicking the card does nothing |
| 13 | Proposals KPI strip (3 cards: pending / in-flight / shipped) | A | "0 / 9 / 4" | template.html:318-333 + JS 593-602 | Cards display counts but are NOT wrapped in `<a href="proposals.html">` like amendments-pending was; counts have NO destination. Wrap each in proposals.html link with anchor |
| 14 | "Quota last anchored" | C | "—" + "via refresh-quota-manual.ps1" | template.html:344-348 | Sub-label cites the command but doesn't tell Founder whether the "—" is "never anchored" vs "anchored but cleared" vs "loading"; add classification |

### 2. activity.html

**Source:** `templates/dashboards/activity.template.html` (233 lines) +
`scripts/regen-activity.py` (340 lines). V1 capture: `scripts/visual-audit/dashboard/activity-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | "Handoffs (7d): 0" KPI | C + F | "0" + "cross-agent transitions" | template.html:83-87 + JS 155-159 | All zeros with no classification — is this legitimate (no work done) / loading / broken? Add: when 0, sub-label classifies "legitimate empty — no handoff files in `.claude/state/handoffs/`" + link to dir |
| 2 | "Active agents: 0" KPI | C + F | "0" + "distinct from/to agents" | template.html:88-92 | Same — classify empty state with link to scenarios doc and "agents are derived from handoff files; 0 means no handoffs exist" |
| 3 | "Active ships: 0" KPI | C + F | "0" + "tagged in handoffs" | template.html:93-97 | Same pattern |
| 4 | "Scenario coverage: 0 of 11 canonical scenarios" | **C + F + A** | "0" + "of 11 canonical scenarios" | template.html:98-102 + JS 162-163 | "0 of 11" is the prototype P10 violation (per AMD-026 reject conditions: "0 of 3 without next-step copy"). Add: link to the 11 canonical scenarios docs/list + classification "no scenarios observed yet — handoff files emit `scenario` field; check `.claude/state/handoffs/`" |
| 5 | Stream filter dropdowns (Scenario/Agent/Ship/Range) + "0 shown" | C + F | "0 shown" + dropdowns populated from data (currently empty) | template.html:108-132 + JS 168-227 | When list is empty, render an explicit empty-state copy panel: "No activity matches current filters — try widening the Range, or check `.claude/state/handoffs/` for recent files" |
| 6 | **(cron-noise filter is already correct)** — regen-activity.py:190-197 filters cron.*.end events from the feed (per AMD-026 P10 prototype fix in code comments). This is GOOD; it is the only surface where cron-noise has been explicitly separated. NOTE: counter-violation to track — verify activity.html still surfaces cron health somewhere (currently does NOT, which is correct per P10 separation) | — | code comment cites P10 fix already shipped | regen-activity.py:183-197 | **Counter-note (no violation):** Document this as the P10 reference pattern in the catalog — it's the model fix for category B. |

### 3. amendments.html

**Source:** `templates/dashboards/amendments.template.html` (329 lines) +
`scripts/regen-amendments.py` (176 lines). V1 capture: not present in prior audit.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | Decision Queue: "Pending" KPI | A | bare number (currently 0) + "awaiting Founder review" | template.html:86-90 + JS 235 | Sub-label classifies but no link to `.claude/state/amendments/pending/` dir or "see drafts" affordance; "0" alone leaves Founder unsure whether something failed to populate |
| 2 | Approve/Reject/Defer mini-KPIs ("marked in this session") | F | "0" + "marked in this session" | template.html:91-105 | When 0 and pending also 0, copy could say "no decisions yet — mark any pending amendment to populate" |
| 3 | "Approved — awaiting apply" empty | F | rendered list shows "No approved amendments." | template.html:120-123 + JS 220-222 | "No approved amendments" is rendered but doesn't classify: legitimate-empty (none authored) vs error (apply-amendments.sh failed); empty-state copy could note "between Founder approval and watcher catch (5-min cadence) — empty under normal flow" (already in template.html:121 subtitle, but not in the inner empty panel) |
| 4 | Deferred / Applied / Rejected archive sections | A + F | Numbers in section headers e.g. "Applied — archive (25)" but inner panels show empty if collapsed | template.html:132-144 + JS 240-243 | When section has items, the (count) is shown but there is no link/anchor to the archive directory `.claude/state/amendments/applied/` for verification |

### 4. design-system.html

**Source:** `templates/dashboards/design-system.template.html` (538 lines).
No regen script — this is a static reference page. V1 capture: `scripts/visual-audit/dashboard/design-system-desktop.png`.

**Verdict: P10-CLEAN.** This surface contains:
- Color swatches (static brand reference)
- Type scale samples
- Space scale visual
- Radius + elevation demos
- Motion playground
- Component primitives (buttons, badges, inputs)
- Composition examples (scorecard, leaderboard, discussion bubble, proposal card)
- Anti-pattern callouts

No counts, no banners, no aggregator-derived numbers, no empty states. P10 categories A–F are not applicable. NO violations.

### 5. discussion-bubbles.template.html

**Source:** `templates/dashboards/discussion-bubbles.template.html` (723 lines).
V1 capture: `scripts/visual-audit/dashboard/discussion-bubbles-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | "Total bubbles" KPI | A + F | "0" + "recorded threads" | template.html:396-400 + JS 495 | When 0, no classification — is this legitimate (no deliberations yet) or broken (regen failed)? Add: link to `.claude/state/discussion-bubbles/` + empty-state copy "no bubbles recorded — deliberations write to this dir" |
| 2 | "Open" KPI | A + F | "0" + "awaiting decision" | template.html:401-405 + JS 496 | Same pattern; warning-styled card showing "0" is ambiguous — looks pre-error |
| 3 | "Closed (7d)" KPI | A + F | "0" + "approved or rejected this week" | template.html:406-410 + JS 497 | Same pattern; positive-styled card with 0 — wraps "good" empty as "bad" empty |
| 4 | "Approved w/ dissent" KPI | A + F | "0" + "non-unanimous outcomes" | template.html:411-415 + JS 498 | Same pattern |
| 5 | Threads rail "0 threads" | C + F | "0 threads" subtitle | template.html:437 + JS 596 | "0 threads" with no classification copy — empty list panel has no fallback message; should classify ("no threads match filters — try 'All statuses' or check the source dir") |
| 6 | Empty-state right pane | F | "Select a discussion bubble" / "Pick a thread from the list…" | template.html:444-448 | This is OK for "no selection" but doesn't differentiate from "no threads exist at all"; when zero threads, replace with "No discussion bubbles recorded — see `.claude/state/discussion-bubbles/`" |
| 7 | Filter dropdowns when ships array empty | F | "All ships" select only — no other options when no ships | template.html:433-436 + JS 567-574 | When no ship options exist, dropdown is effectively no-op; add helper text "no ships tagged in any bubble yet" |

### 6. escalations.html

**Source:** `templates/dashboards/escalations.template.html` (451 lines) +
`scripts/regen-escalations.py` (210 lines). V1 capture: not present.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | Decision Queue: "Pending" KPI | A | "0" + "awaiting Founder review" | template.html:106-110 + JS 322 | Same pattern as amendments — no link to `.claude/state/escalations/pending/` for verification when 0; when nonzero, no anchor link to specific escalation cards below |
| 2 | Approve/Reject/Defer KPIs | F | "0" + "marked in this session" | template.html:111-125 | Same pattern as amendments; when nothing pending, classification copy needed |
| 3 | Empty-state list panels ("(none)") | C + F | "(none)" rendered inside `.esc-empty` div | template.html (CSS .esc-empty class) + JS 314 | "(none)" is too terse — no WHAT-ACTION, no classification (legitimate vs error). Per P10: replace with "No pending escalations — team has authored none" + dir link |
| 4 | "Approved — awaiting team apply" | F | "(none)" inside same empty-state | JS renderList opts.editable=false | Subtitle (template:141) says "Between Founder approval and team picking up the decision on next loop" — copy already explains; but inner empty panel just says "(none)". Replicate the explanatory subtitle into the empty panel |
| 5 | Stale-badge ('STALE') without resolution | C + E | Some escalations may render `is-stale` class + "STALE" badge | template.html:135-156 + JS 218-226 | When an escalation is stale (>24h default_window), badge says "STALE" but no "auto-default applied" message or "approve default" action; the `default_if_no_response` block is informational, not actionable. Add: "Apply default" button that exports the default decision automatically |

### 7. index.html

**Source:** `templates/dashboards/index.template.html` (300 lines) +
`scripts/regen-index.py` (257 lines). V1 capture: `scripts/visual-audit/dashboard/index-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | "Last updated —" + "git —" meta line | C | "Last updated —" + "git —" both literal em-dashes | template.html:131-133 + JS 264-267 | When `data.as_of` or `data.git_sha` missing, JS renders "—" — no classification ("regen never ran" vs "missing field"); add explicit "regen pending — run `scripts/regen-all.ps1`" copy |
| 2 | "Ships this week: 0" tile | A + F | "0" + "via ship-progress/*.json" | template.html:148-152 + JS 269 | Sub-label cites source path; good. But 0 with no classification — add: legitimate-empty copy when no ship-progress files written this week |
| 3 | "Proposals pending: 0" tile | A + F | "0" + "awaiting Founder review" | template.html:153-157 + JS 270 | Same pattern; no link to proposals.html anchor when 0 (cards in section below DO link, but the status tile itself is not clickable) |
| 4 | "FIQ depth (B+): 0" tile + "A:0 B:0 C:0 D:0 F:0" sub | A + F + C | "0" + "A:0 B:0 C:0 D:0 F:0" | template.html:158-162 + JS 271-272 | Grade distribution all zeros — no classification; "A:0 B:0 C:0 D:0 F:0" is non-zero text but zero data; classify "FIQ scanner finds no entries — see `.claude/state/founder-input-queue/`" |
| 5 | "Discussion bubbles: 0" tile | A + F | "0" + "via discussion-bubbles/" | template.html:163-167 + JS 273 | Same pattern |
| 6 | "Last cron run: never" tile | **C + E** | "never" + "substrate pending build" + amber/warning state | template.html:168-172 + JS 274 | "never" with "substrate pending build" subtitle does not tell Founder what to do — the install command is on dashboard.html but not here; add cross-link "See cron install status on dashboard.html" or replicate the install command |
| 7 | "HALT state: none" tile | A + F | "none" + "via halts/" | template.html:173-177 + JS 275 | When state is "none", positive case; when nonzero, halt name (e.g. "halt-2026-05-13") is shown but with no link to the halt file for context |
| 8 | Dashboard cards meta — "— · —" (mtime + badge) | C | Each dashboard card has `<span data-meta="..-mtime">—</span>` + badge "—" | template.html:183-213 + JS 278-284 | When mtimes/badges missing, both render as literal em-dashes; classify "regen has not yet written this dashboard" vs "file missing" |
| 9 | "Last orchestration action: no recorded action" | C | template.html:228 default + JS 285-286 | template.html:228 + JS 285-286 | "no recorded action" is borderline OK but no WHAT-ACTION; when truly no action, add "Run `scripts/regen-index.py` to refresh" or link to last commit |

### 8. proposals.html

**Source:** `templates/dashboards/proposals.template.html` (707 lines) +
`scripts/regen-proposals.py` (167 lines). V1 capture: `scripts/visual-audit/dashboard/proposals-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | Decision Queue "Pending" KPI | A | "0" + "awaiting Founder review" | template.html:190-194 + JS 676 | Same pattern as amendments/escalations — no link to `.claude/state/proposals/pending/` for verification when 0 |
| 2 | Approve/Reject/Defer mini-KPIs | F | "0" + "marked in this session" | template.html:195-209 | Same as amendments/escalations — empty-state copy needed |
| 3 | Filter dropdowns with no proposals to filter | F | dropdowns rendered + "No proposals match current filters." inside #proposal-list | template.html:218-247 + JS 521-522 | "No proposals match current filters." is good for filter-state but ambiguous when filters are ALL set to "all" + still 0; classify "no pending proposals exist — see `.claude/state/proposals/pending/`" |
| 4 | "Approved — in flight (0)" section | A + F | "No approved proposals." + section subtitle explains lifecycle | template.html:256-260 + JS 490 | Empty state OK but only when no proposals; when there ARE entries, the count "(0)" is misleading. Verify counter logic for the data.counts.approved field |
| 5 | "Deferred / Shipped / Rejected" archive sections (collapsible) | A | "(0)" badges in summary headers | template.html:262-284 + JS 558-561 | When section has nonzero entries, the (count) is shown but no anchor link to `.claude/state/proposals/{shipped,rejected,deferred}/` archive dirs |
| 6 | "Raw data (debug)" collapsible | A | `{}` rendered as JSON when data empty | template.html:286-292 + JS 314 | When data is empty `{}`, no copy says "regen has not populated yet" — looks intentional but is ambiguous; add header copy "Empty object means data block has not been swapped — re-run `scripts/regen-proposals.py`" |
| 7 | Compact card "tokens: ~—" for shipped/approved cards (when estimate.cost_tokens absent) | C + D | Compact card displays `~${ParbaughsReports.utils.fmtTokens(p.estimate.cost_tokens)}` | template.html (renderProposal):601-602 | If `p.estimate` is `null` (cards in shipped/rejected/deferred buckets often lack estimate), JS throws or fmtTokens(undefined)='—'; no classification of missing cost |
| 8 | Proposal card "files_affected (N)" + "evidence_paths" lists | A | code blocks listing paths | template.html:614-627 | Paths listed but not clickable — no link to view file content for Founder review; add anchor or open-in-editor command |

### 9. token-usage.html

**Source:** `templates/dashboards/token-usage.template.html` (751 lines) +
`scripts/regen-token-usage.py` (201 lines). V1 capture: `scripts/visual-audit/dashboard/token-usage-desktop.png`.

| # | Element | Category | Current display | File:line | Proposed fix (WHAT-ACTION) |
|---|---|---|---|---|---|
| 1 | "Meter status: estimated only" | **E** | "estimated only" + "event-aggregated estimates · no sidecar" | template.html:141-145 + JS 392-417 | Status communicates what is wrong (no sidecar) but no link to install sidecar or "Run `scripts/refresh-quota-manual.ps1`" action button |
| 2 | "Weekly tokens (live): 0" | **C + D** | "0" + "no usage recorded yet · sidecar awaits Founder paste" | template.html:146-150 + JS 472-475 | Honest copy exists; missing WHAT-ACTION command button. Should include "Run `scripts/refresh-quota-manual.ps1` now" as a clickable command box |
| 3 | "Org monthly: 0" | C | "0" + "no usage recorded yet" | template.html:151-155 + JS 487-489 | Same as #2; no WHAT-ACTION |
| 4 | All-time donut shows "0 ALL-TIME TOKENS" | **D + C + F** | SVG donut empty + center text "0" | template.html:159-167 + JS 339-373 + setStats() | When `data.all_time.real/estimated/manual` are all 0, the donut is correctly empty but the surrounding text says nothing. Classify: "no events ingested — run `scripts/aggregate-token-usage.py` first; if that yields 0, no Claude usage has been telemetry-recorded" |
| 5 | "Real / Estimated / Manual" stat cells show "—" | C + F | Em-dashes in all three cells | template.html:170-183 + JS 377-379 | Each cell renders fmtTokens(at.real) which yields "-" when None; no classification — add: when all 3 are "—" or 0, replace cells with "no data" + explanatory copy "telemetry events bucket: 0; cron sessions bucket: 0; manual entries bucket: 0; aggregator last ran: $TS" |
| 6 | "Where the tokens went" pie | **D + F** | Empty donut + "No tokens recorded for this view yet." | template.html:215-228 + JS 639-661 (renderPieLegend) + regen-token-usage.py:129 | Empty-state text exists ("No tokens recorded for this view yet.") but doesn't link to the underlying `pie_views` field path or specify "Run `scripts/aggregate-token-usage.py` to populate" |
| 7 | "Refreshed: never" meta in title row | C | "Refreshed never" | template.html:130 + JS 381 | When `data.generated_at` absent, fmtAgo returns "never"; classify as "regen-token-usage.py has not run since this file was scaffolded" with command hint |
| 8 | "Tokens by agent" table empty | F | "No data yet. Run scripts/aggregate-token-usage.py." (in colspan=5 cell) | template.html:234-247 + JS 513-516 | Empty-state copy already cites the script (GOOD — actionable); but no WHAT-ACTION button to run it from the UI. Could improve with a "Run aggregator" copy-to-clipboard button |
| 9 | "Tokens by cron source" table empty | F | Same empty-state copy | template.html:252-266 + JS 513-516 | Same as #8 |
| 10 | "Tokens by ship" table empty | F | Same empty-state copy | template.html:268-285 + JS 513-516 | Same as #8 |
| 11 | Cron source "is-warning" highlighting (downloads-watcher, maintenance) | E | When `r.total > 0` for downloads-watcher / maintenance → row highlights `is-warning` + `! ` prefix | template.html JS 519-522 | Warning state surfaces "downloads-watcher should be 0 but isn't" pattern, but no WHAT-ACTION ("Investigate which cron is leaking tokens — see scripts/cron/downloads-watcher.ps1") |
| 12 | Methodology footer paragraph | A | "How estimation works:" + INPUT_RATE × OUTPUT_RATE explanation + code path reference | template.html:287-293 | Excellent WHAT (rates) + WHERE (`scripts/aggregate-token-usage.py`) but no WHAT-ACTION ("To recalibrate, run X" command); footer is informational not actionable |

---

## Closing notes

**The P10-prototype-fix in activity.html (regen-activity.py:183-197)** is the
model pattern: cron.*.end heartbeats were explicitly filtered out of the
actionable feed with a code comment citing AMD-026 P10. This is what every
other surface needs: a deliberate cron-noise vs Founder-state separation,
documented in code with the principle citation.

**Recommended fix orchestration:**

1. **Phase 1 (P10 high-severity, blocks Founder Verification Packet):**
   dashboard.html GAP-4 (Round-Trip card) + token-usage.html "—" classifications + activity.html "0 of 11" link + dashboard.html health-banner action buttons.
2. **Phase 2 (P10 medium):** Wrap KPI cards in destination anchors (proposals/amendments/escalations cards). Add empty-state classification copy across all "0" states.
3. **Phase 3 (P10 low-severity polish):** Link archive-directory paths from "Applied/Shipped/Rejected" section headers; classify "—" displays as legitimate vs error.

**P10 retrofit verification per AMD-026 checklist:**

For each surface, after retrofit:
- [ ] Re-V1 capture
- [ ] Read PNG + verify every count has destination
- [ ] Verify cron-noise visually distinct from Founder-state
- [ ] Verify every empty state classified (legitimate / loading / error / misconfigured)
- [ ] Verify silent fallback-to-zero patterns replaced (per PHASE-B-GAPS GAP-1 root cause)
- [ ] Update `.claude/state/dashboard-audit-2026-05-18/P10-RETROFIT-LOG.md` per surface

**Cross-references:**
- AMD-026 spec: `.claude/state/amendments/applied/AMD-026-actionable-surfacing.md`
- Prior P9 audit: `.claude/state/dashboard-audit-2026-05-18/PHASE-B-GAPS.md`
- Inventory: `.claude/state/dashboard-audit-2026-05-18/INVENTORY.md`
- P10 prototype fix (model): `scripts/regen-activity.py:183-197`

---

**Catalog status:** Audit-only. Main thread orchestrates fixes.
**Total surfaces audited:** 9 (main-flows.html excluded per Founder LOCK).
**Total violations:** 65.
**P10-CLEAN surfaces:** 1 (design-system.html).
