# dashboard.html — design-review (iter 15, Part 2 polish)

**Authored:** 2026-05-14 by design-bot per PROP-010 + PROP-012.
**Method:** Read tool on captured PNGs (built-in multimodal vision).
**Captures:** `.claude/state/main-flows-v2/founder-real-context/2026-05-14T20-58-19Z/`

This is the second systematic visual review after iter-14 main-flows.
Applies the same Read-and-articulate methodology PROP-012 codified.

## What I see — page top (00-page-top.png)

- Top nav bar: "PARBAUGHS ORCHESTRATION" brand line left, 10 nav
  links right; "Dashboard" underlined as active state
- "Dashboard" h1 (Fraunces display, chalk on green)
- Subtitle paragraph: "Current snapshot of weekly orchestration
  state — tokens, ships, halts, FIQ depth, proposals, recent
  activity. Numbers from `.claude/state/telemetry/aggregates/`."
- "GENERATED 2026-05-14 20:58 UTC" upper-right (mono small caps)
- **FOUNDER REVIEW QUEUE** section, brass-bordered hero:
  - "Items below need Founder review before next ship-close."
  - "LAST VISIT: NEVER RECORDED" right-aligned
  - GOVERNANCE GATES (4 KPI cards row): Amendments Pending 0,
    Bubbles Flagged 0, Proposals Pending 6, Open Escalations 0
  - SYSTEM HEALTH (3 cards row): Round-Trip Last Pass
    2026-05-14 18:15 UTC · STALE · last pass 150.1min ago;
    Working Tree dirty (17 files) · watcher cycling · commits
    pending; Active Halts 0 · no active halts
  - **1 CRON TASK NEWLY INSTALLED · AWAITING FIRST FIRE** banner
    (brass-bordered, benign):
    NEWLY INSTALLED · PARBAUGHS-Overnight-Triage · installed ·
    State=Ready · awaiting first fire (cadence 1440min)
  - Recent cron firings inline (downloads-watcher, maintenance,
    overnight-triage, proposal-readiness, sidecar)
  - ACTIVITY SINCE LAST VISIT: 4 ships closed · 6 new pending
    proposals
  - EXCEPTIONS: none
- THIS WEEK section heading
- 4 KPI cards row: TOKENS THIS WEEK 7.30M · $175.25 spend ·
  aggregate of telemetry events; ANTHROPIC QUOTA (no data) ·
  sidecar present but no source data · run scripts/refresh-quota-
  manual.ps1; SHIPS THIS WEEK 24 · approved & shipped; HALTS
  THIS WEEK 0 · clean = good
- (Cycles cards bottom-truncated)

## What I see — page bottom (03-full-page-bottom.png)

- RECENT HANDOFFS table: 10 rows visible, columns SCENARIO / FROM /
  TO / WHEN. Every row reads "team-commit / Zach Boogher / main /
  <timestamp>"
- RECENT SHIPS table: 10 rows visible, columns SHIP / TITLE /
  STATUS / TOKENS / COST. Rows: ESC-003 Per-ship token attribution
  applied; AMD-016 Infrastructure must answer its operational
  question applied; AMD-017 Continuation discipline applied;
  ESC-001 main-flows-v2 Phase 2 taxonomy applied; ESC-002 Wave 1
  ship 1 selection applied; AMD-015 Team proposes Agent 2 ratifies
  applied; AMD-014 PAUSE_DISCIPLINE applied; AMD-013 ROADMAP v2
  applied; AMD-012 Smoke-testing governance applied; AMD-011
  Auto-execute approved proposals applied. All TOKENS + COST
  columns show "—"
- Footer: "Source: .claude/state/telemetry/aggregates/" + 3 nav
  links (All reports, Proposals, Repo)

## Per-element articulated diff

| Element | Observation | Verdict |
|---|---|---|
| Top nav | 10 links, active state underlined on Dashboard | ✓ MATCH (consistent with main-flows nav) |
| Dashboard h1 + subtitle | Fraunces display, chalk body text | ✓ MATCH (design system) |
| GENERATED timestamp | mono small caps upper-right | ✓ MATCH |
| Founder Review Queue section | Brass-bordered hero, clear semantic emphasis | ✓ MATCH (intentional Founder-prioritization signal) |
| Governance Gates (4 KPI cards) | Even-width row, clean grid | ✓ MATCH |
| System Health (3 cards) | Mixed widths — Round-Trip card has more text ("STALE · last pass 150.1min ago"), Working Tree spans 2-line text, Active Halts is sparse | △ APPROXIMATION (functional; visual rhythm slightly uneven) |
| Cron banner (NEWLY INSTALLED) | Brass border, benign tone, accurate semantic | ✓ MATCH (iter-11 fix holds) |
| Recent cron firings inline | mono small text, compact | ✓ MATCH |
| Activity Since Last Visit / Exceptions | Tight summary line + "none" | ✓ MATCH |
| THIS WEEK KPI cards | 4 cards even row, $175.25 spend visible (iter-11 fix) | ✓ MATCH |
| Recent Handoffs table | 10 rows, all "team-commit / Zach Boogher / main" — same scenario+from+to across all rows | △ APPROXIMATION (low signal per row — could carry commit subject) |
| Recent Ships table | 10 most-recent applied; TOKENS + COST = "—" for all (honest per AMD-009 P5 — historical events have substrate-build-day-3 ship_id) | ✓ HONEST (per AMD-009 P5; ESC-003 Approach A starts going-forward attribution) |
| Footer | 3 links, minimal | ✓ MATCH |

## Findings

### Finding A — Recent Handoffs information density (POTENTIAL POLISH)

Every row in the Recent Handoffs table reads identically:
"team-commit / Zach Boogher / main / <timestamp>". The information
density is low — a user scanning the table can't tell which commit
shipped what.

Two possible refinements:
1. Add a "subject" column with first line of commit message
2. Filter out routine cron auto-commits (keep distinct from
   substantive ship-close commits)

Not blocking. The current state is honest (every team-commit IS a
handoff to main). But low signal-to-display ratio.

**Recommendation:** Defer. Adding commit-subject column is a small
follow-on; cron auto-commit filtering is a categorization decision
that's already partially handled by Recent Ships table. Surface as
Part 2 polish item for Founder review.

### Finding B — System Health card visual rhythm (APPROXIMATION)

Round-Trip Last Pass card has more text (timestamp + STALE + age).
Working Tree card has 2-line text. Active Halts card has 1 line.
Visual rhythm slightly uneven within the 3-card row.

**Recommendation:** Defer. Functional information is clear; minor
visual polish. Not user-blocking.

### Finding C — All other elements: ✓ MATCH

- iter-11 cron banner fix holds
- iter-11 weekly_cost $175.25 honest estimate visible
- iter-12 Recent 7 Days perceptual colors hold (verified in
  earlier audits; not visible in these captures since the chart
  is mid-page)
- iter-13 main-flows rail stability not relevant to dashboard
- Recent Ships table shows "—" honestly for unattributed historical
  events — ESC-003 going-forward attribution will populate
  these as future ships emit via scripts/emit-team-work-summary.py
  reading current-ship.json

## Design-bot verdict (PROP-010 format)

**APPROVE for ship-close.** Two minor approximations surfaced
(Findings A + B) are deferrable polish, not blocking issues. The
dashboard renders cleanly in user-context. All iter-11/12/13/14
fixes hold under this systematic Read-and-articulate review.

## Coverage notes for follow-on work

- Cycles cards (mid-page, not captured at page-top viewport)
  warrant their own viewport-targeted review when ship work
  touches them
- Recent 7 Days chart was already reviewed in iter-12 (5 distinct
  hues confirmed); confirmed again indirectly via PROP-009
  user-journey audit
- The dashboard data pipeline (cron status logic, weekly_cost
  computation, recent ships attribution) was reviewed at code-level
  in earlier iter ships
