# PARBAUGHS app audit — SUMMARY (iter 16, in-progress)

**Authored:** 2026-05-14 per Founder PARBAUGHS PRIORITY EXECUTION P3.
**Status:** initial scaffolding from existing diagnostic sources;
full systematic flow-by-flow audit deferred to follow-on session.

## Methodology

This SUMMARY synthesizes findings from:
1. CLAUDE.md "Known Bugs (Diagnosed, Not Yet Fixed)" — 9 items
2. Memory `project_b43_webkit_mobile_smoke_timing.md` — B.43+B.46+B.47
3. Iter 14 visual review (main-flows.html)
4. Iter 15 design-review (dashboard.html)
5. P2 invite link end-to-end signup gap (this session)
6. Existing e2e Playwright suite at `tests/e2e/flows/` (6 spec files)

NOT yet covered by this scaffolding:
- Live walk-through of each member-facing flow via Playwright MCP
- click-every-interactive coverage on app pages (covered for dashboard
  pages only iter 15)
- Authenticated state flows (require emulator + seeded fixtures or
  real account credentials)
- Mobile-specific flows (Capacitor wrapper not exercised in agent ctx)

## Severity classification

- **CRITICAL** — blocks new member onboarding OR breaks core member journey
- **HIGH** — degrades a primary feature; member-visible impact
- **MEDIUM** — broken-but-workaround-available feature
- **LOW** — visible polish / cosmetic issues
- **POLISH** — refinement items, no functional impact

## Findings by severity

### CRITICAL (1)

| # | Finding | Source | Status |
|---|---|---|---|
| C1 | Invite link auto-apply: legacy invites (pre-iter-16) drop new members into `the-parbaughs` regardless of inviter's league | This session P2 | **CODE FIXED + DEPLOYED** for going-forward invites; legacy invites unfixed (client fallback preserves prior behavior). E2E signup verification deferred to Founder action. |

### HIGH (3)

| # | Finding | Source | Status |
|---|---|---|---|
| H1 | All-time records best rounds — needs split into 9-hole vs 18-hole columns | CLAUDE.md Known Bugs #4 | **FULLY CLOSED iter 16**: data layer (commit 7c3b5ba `getPlayerBest9`) + UI consumers in members.js (commit 94e4340) + trophyroom.js (commit 66a6e19). Records page already inlined pre-iter-16. |
| H2 | Shareable scorecards for 9-hole rounds — currently renders all 18 cells with empty back-9 | CLAUDE.md Known Bugs #5 | **STALE bug entry — ALREADY FIXED**: buildScorecardHTML (src/core/router.js:1109-1190) computes `front9count` + `back9count` separately; renders only the nines with data. Lines 1116-1120 detect `is9only`; lines 1187-1188 only emit nineHTML where count > 0. Verified via code trace. Founder live-test could confirm via 9-hole round share-card preview. |
| H3 | Parbaugh Round joined players not appearing on scorecard (host-only display) | CLAUDE.md Known Bugs #9 | Diagnosed in code scan: live `renderLiveScorecard` (src/pages/syncround.js:128-205) DOES render all `playerIds` — multi-player display works in live view. The "host-only" filter must be on the EXPORT/SHARE scorecard path or the completed-round detail view. Needs investigation. |

### MEDIUM (4)

| # | Finding | Source | Status |
|---|---|---|---|
| M1 | Course directory average display — needs to derive front/back/18-hole from `holesMode` field | CLAUDE.md Known Bugs #1 | **FULLY CLOSED iter 16**: courses.js Member Stats section now derives `full18cr` + `front9cr` + `back9cr` separately. Primary "Members average (18)" stat-box gets "9-hole · F9 X · B9 Y" stat-sub when 9-hole rounds present. Courses with only 9-hole rounds show "Members average (9)" primary stat. Pattern matches H1 (members.js + trophyroom.js). |
| M2 | Clubhouse calendar missing in-progress events — filter uses `startDate` only; needs end-date check | CLAUDE.md Known Bugs #2 | **STALE bug entry — ALREADY FIXED**: calendar.js:93 filter is `if(trip.startDate>=todayStr||ed>=todayStr)` where `ed=trip.endDate||trip.startDate` — correctly catches in-progress events (endDate>=today with startDate<today). Same line sets `time:"Happening now"` for in-progress. CLAUDE.md description is outdated. |
| M3 | Courses button on season standings — should navigate to 2026 courses with rounds | CLAUDE.md Known Bugs #6 | Diagnosed; not yet fixed |
| M4 | Courses button on player profiles — should show all courses with best round | CLAUDE.md Known Bugs #7 | **FULLY CLOSED iter 16**: members.js:419 + trophyroom.js:55 Courses stat-boxes now clickable; set `_courseViewMode='ours'` + navigate to courses page (shows all courses with league best round per course). Pattern matches M3 (standings Courses button). Per-player filter would be enhancement scope — current bug closure delivers "show all courses with best round" via Our Courses view. |

### LOW (2)

| # | Finding | Source | Status |
|---|---|---|---|
| L1 | Sequoyah National finalization bar tap — missing iOS tap CSS properties | CLAUDE.md Known Bugs #3 | **STALE bug entry — ALREADY FIXED**: scorecard.js:231 (`finishTripRound` button — the actual "Finalize" bar) has full iOS tap CSS: `-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-user-select:none;user-select:none;min-height:48px`. Line 227 (Unlock) same. Home.js pending-finalize card uses `.tappable` class which provides `-webkit-tap-highlight-color:transparent + cursor:pointer + :active` (components.css:1693-1708). |
| L2 | Scorecard logo — currently base64; should reference `logo.jpg` from repo | CLAUDE.md Known Bugs #8 | **STALE bug entry — ALREADY FIXED**: index.html:66 + 98 use `src="Logo.jpg"` (file reference). No base64 in scorecard logo path. The `data:image/jpeg;base64` in src/core/firebase.js:46 is `COURSE_DEFAULT_IMG` (default placeholder for missing course photos — different from scorecard logo). |

### POLISH (4, from iter 12-15 design-reviews)

| # | Finding | Source | Status |
|---|---|---|---|
| P1 | Dashboard Recent Handoffs information density low (all rows identical scenario+from+to) | iter 15 Finding A | Deferred; would add commit-subject column |
| P2 | System Health 3-card row visual rhythm slightly uneven | iter 15 Finding B | Deferred; functional info clear |
| P3 | Main-flows F9-F62 step paths less detailed than F1-F8 (generated via script) | iter 16 P1 | Deferred; baseline correct, refinement is enhancement |
| P4 | Component density on main-flows: 47 PARBAUGHS components vs ~60 in Janowiak ref | iter 14 visual review | Approximation accepted (data difference) |

### Cross-browser flake (existing in memory)

| # | Finding | Source | Status |
|---|---|---|---|
| B43 | Webkit smoke timing fragility (mobile + desktop) — intermittent webkit-only flakes | memory project_b43_webkit_mobile_smoke_timing | Tracking ongoing; not fixed |
| B46 | (captured alongside B43 in Ship 5+7) | memory | Tracking |
| B47 | Sibling smoke account (re-scoped W1.I2) | memory | Wave 1 ship work |

## Recommended fix sequence

For Priority 4 (CRITICAL + HIGH fixes):

1. **C1 (DONE this ship)** — invite link going-forward fix deployed
2. **H3** — Parbaugh Round joined players display (member-visible bug,
   affects multi-player rounds)
3. **H1** — best rounds 9/18 split (visible on every member's stats)
4. **H2** — 9-hole scorecard rendering

For MEDIUM + LOW: deferred to dedicated polish ship per AMD-015.

## Audit coverage gap (honest delta per AMD-009 P5)

This SUMMARY is **scaffolding**, not a comprehensive audit. Coverage
gaps:

- 30+ member-facing pages in `src/pages/` not walked through
  individually via Playwright MCP
- Authenticated flows (signup, round logging, social) require
  emulator + seeded fixtures (set up but not exercised in this
  session)
- Mobile-specific behavior (Capacitor wrapper) not exercised
- Click-every-interactive coverage limited to dashboard pages

Full audit requires dedicated session OR e2e suite run against
emulator. The existing 44+ e2e tests at `tests/e2e/flows/` cover
specific known failure modes; a fresh emulator run would surface
current regressions. Recommended next-session priority: emulator
boot + e2e suite run + categorize each spec result into this
SUMMARY.

## Path forward

1. **Immediate (this session if capacity):** H3 Parbaugh Round
   joined players fix — diagnose root cause in
   `src/pages/playnow.js` / `src/pages/round.js` / scorecard
   rendering
2. **Next session:** full Playwright MCP flow walk-through covering
   the 9 CLAUDE.md known bugs + e2e suite run
3. **Wave 1 ships:** mobile-specific flows + W1.I2 sibling smoke
   account
