# Convergence E2E + critique — progress tracker (Founder 2026-06-15 night marathon)

Drives BACKLOG "★★ CONVERGENCE MARATHON" (4 directives). Goal: every route
rendered + every control exercised + screenshotted + copy/count/spelling
spot-checked + bugs fixed, at BOTH mobile AND HQ/desktop viewports, narrowing
to genuinely nothing left. Close with the full multi-user data E2E.

## Tooling
- `scripts/_e2e-overnight.mjs <uid> <label>` — signs in via custom token (SA),
  walks routes, screenshots each, captures console errors + dead controls →
  `.claude/state/e2e-overnight/<label>/`. `VIEWPORT=desktop` for HQ (1440x900),
  default mobile (430x932). v8.25.199: expanded to 41 routes + settle-wait fix
  (was false-FAILing async pages profile/tournament on a fixed 1600ms snapshot).
- Test member = `1fwuewlis6Yvrtvlk7m0I3rRYwQ2` = **FatalBert69420** (real member,
  Lv3, 1 round, 138 ParCoin) — real data, good for render + the visual critique.
- Param-routes NOT in the bare sweep (need context): round, scorecard, dm-thread,
  range-detail, scramble-live, syncround, tee-create, trophycreate, invite,
  onboarding, admin. Exercise these by DRIVING into them (tap a round → scorecard).

## Findings log

### v8.25.199 — RING FLUSH fix (Founder "rings should sit flush") — SHIPPED prod+staging
- Diagnosed via `.claude/state/ring-fit` render harness over a real avatar.
- Only ring-medallion (laurel inset:-10px→-1px) + ring-gallery-rope (studs -7px→-2px)
  floated with a gap; every other ring already hugs. V1 before+after verified.

### Mobile sweep #1 (FatalBert, 26 routes, pre-expansion) — 26/26 OK
- 2 console WARNs: chat + wagers "Missing or insufficient permissions" = the
  documented cold-sign-in rules-race. V1-confirmed BOTH self-heal: chat shows
  graceful "No messages yet" empty state; wagers shows bankroll 138 + "No action
  on the books". NOT bugs (the page resolves correctly).

### Mobile sweep #2 (FatalBert, 41 routes) — 38 OK / 3 false-FAIL (all verified render-OK)
- profile / profile-edit / tournament reported ctrls=0/len<=30 = FALSE FAILS:
  V1 screenshots show them FULLY rendered (profile = felt hero + nemesis + stat
  grid + ParCoin ledger; tournament = events board + Smoky Mountain Open). Cause:
  async data-load pages not settled at the fixed 1600ms snapshot. FIXED in the
  script (waitForFunction on the active #mainApp [data-page] container, cap 5s).
- calendar: PAGEERROR permissions (same cold-start race class; page renders, ctrls=42).

### v8.25.200 — DM INBOX stuck-skeleton (REAL BUG, found by sweep) — SHIPPED + V1-VERIFIED
- Messages inbox showed 3 loading-skeleton rows forever (cold-start members.get()/
  preview get() hang → never resolve/reject → .catch never fires). Same class as
  chat (v8.25.166). Fix: dual settle-once + timeout safety nets (6s members, 5s
  previews) → inbox always resolves. V1 post-deploy: STILL-SKELETON-AFTER-7s=false;
  resolves to the full 12-member list (Lieph/Luke/Mr Parbaugh/Nick/… each "Start a
  conversation"). `.claude/state/conv-e2e/dms-after.png`.
- Sweep tool hardened (measures active #mainApp [data-page]:not(.hidden)) → redirect/
  async routes (profile→members, tournament) no longer false-FAIL. Mobile now 40/41
  OK (the 1 "fail" was this real DM bug, now fixed → 41/41).

### CALENDAR uncaught PAGEERROR (FOLLOW-UP, low priority — page renders fine)
- calendar shows an UNCAUGHT FirebaseError "insufficient permissions" (cold-start race
  via a shared liveTeeTimes-class listener; calendar.js's own gets are all .catch'd).
  Page renders (ctrls=42). Not a broken page — console noise. Find the shared listener
  lacking an error cb + route through pbWarn for consistency. NOT chased yet.

### KNOWN benign class (do NOT chase as a render bug)
- chat feed listener / wagers / calendar "Missing or insufficient permissions" on a
  FRESH custom-token sign-in = the cold-start rules-context race (listeners attach
  before league membership hydrates in rules). Self-heals; pages render. Logged at
  `[PB CRITICAL]` in console — CANDIDATE: downgrade severity (console noise, not
  critical) since it self-heals + is already kept out of the errors collection.

## Per-route status (✓=render-verified, V=visual-critique done, ✗=bug open)
Render-verified via sweep #2 (mobile): home playnow rounds standings members feed
chat shop merch settings richlist courses wagers bounties challenges trips scramble
records seasonrecap trophyroom drills teetimes aces awards social leagues activity
caddynotes calendar dms faq findplayers partygames profile profile-edit range rules
roundhistory wrapped tournament bugreport = ALL render OK (41/41 after timing fix).
VISUAL critique (9.5 rubric) + HQ/desktop + param-routes + full data E2E = IN PROGRESS.

## Next
1. Desktop/HQ sweep (running) — confirm 41/41 render at 1440x900 too.
2. Visual critique pass (rubric: hierarchy/focal-peak/density/motion/contrast/copy/
   counts) over mobile+desktop PNGs → findings → fix → re-verify → narrow.
3. Param-route E2E (drive into round/scorecard/dm-thread/etc.).
4. Cosmetic aesthetic work (rings revamp via brand-gate, markers, decorations, crest).
5. CLOSE: full data E2E — test user + 2nd independent/cross-league member; play a
   round, set/win a bounty, range, 18, 9, handicap, achievement, theme — screenshots.
