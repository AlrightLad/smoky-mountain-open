# Convergence critique findings — 41-route visual audit (Workflow wf_1c42d813, 2026-06-15)

41 routes scored mobile+desktop vs the 9.5 rubric by parallel subagents (full raw
output: the workflow result; ~2M tokens, 178 tool uses). Synthesized + triaged here.
Scores capped 9.4 (AMD-028). Worst-first. **m/d = mobile/desktop**, B = bland.

## ⚠️ THE "DOMINANT FINDING" IS LARGELY A FALSE POSITIVE — re-triaged 2026-06-15
The critique scored ~25 pages desktop **5.6–7.4** for "mobile-stretched / dead cream
gutters / not designed for width." INVESTIGATED the actual CSS: this is a **DELIBERATE
design decision** (base.css §"HQ RAW-LIST CONTENT WIDTH", v8.23.10-13). ~30 single-column
list/form/text pages are INTENTIONALLY capped at `max-width:680px; margin:0 auto`
(centered reading column) on desktop, with the documented rationale: at the full 1152px
content area "a title-left/action-right row strands its control across a void and short
idea-chips float in oversized pills." The team chose the centered column to match peer
apps (X ≈600px, Strava ≈660px feeds) and to keep the column on the same axis as the
full-width footer. The shell DOES widen (body → sidebar+1152px @≥960px); data-dense
pages (standings/members/trophyroom/calendar/shop/home) are deliberately LEFT full-width.
→ The critique agents applied a generic "desktop must fill width" heuristic WITHOUT the
rationale. **Autonomously forcing full-width would REGRESS the v8.23 design** (re-create
stranded controls + floating chips). leagues' "325×320 corner" = the leagues content is
just SHORT (few leagues) inside its 680px column, not a layout break.
**THIS IS A FOUNDER DESIGN-DIRECTION CALL, NOT AN ENGINEERING BUG** → surfaced in
`task-queue/founder/desktop-width-direction-2026-06-15.md`. Keep centered columns
(premium-doc feel) vs move data-dense pages to full-width grids/two-pane (more app-like,
larger effort + regression risk) vs hybrid. Do NOT flip autonomously. NOT Priority 1.
Genuinely-actionable desktop opportunities that AREN'T taste-flips: dms two-pane
master/detail (real elevation), profile-edit multi-column form + collapse the 40-input
club-distance ladder (real density win) — but both are page redesigns, fold into the
Founder direction.

## SYSTEMIC #2 — contrast (cream-on-cream / faint), WCAG-AA
home desktop right-rail near-invisible; profile Lv.3 strip + ParCoins washed-out (mobile);
dms subtitle low-contrast; findplayers member pills cream-on-cream; courses rows fade out
+ faint card shadows + faint thumbnails; chat empty-icon off-palette grey. → PRIORITY 3
(contrast pass; V1 each vs actual bg per [[feedback_contrast_verify_each_change]]).

## COPY/COUNT — VERIFIED against source 2026-06-15 (CRITICAL: VLM misreads kerned text!)
LESSON: the visual critique has a HIGH false-positive rate on copy — it misreads
stylized/letter-spaced fonts. EVERY copy flag MUST be grep-verified against source
before "fixing" (no-guessing discipline). Verification result:
- ❌ MISREAD "Mastera Azalea" — source is `name:"Masters Azalea"` (shop.js:208). CORRECT. No fix.
- ❌ MISREAD "Stim 13" — source is `name:"Stimp 13"` (shop.js:175). CORRECT. No fix.
- ❌ MISREAD "Fenese/Feneea" — source is `name:"Fescue"` (shop.js:124). CORRECT. No fix.
- ❌ MISREAD "GHN" — source uses "GHIN" everywhere (no "GHN" literal exists). CORRECT. No fix.
- ✅ REAL: **aces "Ace wall" → "Ace Wall"** casing (header+back-btn lowercase vs card/records
  title-case) — FIXED v8.25.202 (aces.js:20 + :91). The only confirmed copy bug of the batch.
STILL TO VERIFY (against source, before fixing): shop clipped card bodies (line-clamp —
likely real, a CSS height/clamp issue not a typo), shop title-preview binding, "Daily login
x5 +3" math, merch duplicated eyebrow, drills "Headcover Trap" dup hero (not a literal in
drills.js — comes from a data array; check if the hero'd drill is also in the list).
- shop: card bodies CLIPPED mid-sentence ("The cup is the only thing…", Mulligan Club
  "…breakfast halls.", Trophy Room "where the silver lives.") — line-clamp cutting copy
- shop: title-card preview binding inconsistent (some show username, some show title text)
- shop: "Daily login x5 +3" math looks off vs the +1/day rule
- merch: duplicated eyebrow label (PARBAUGHS·PRO SHOP vs THE TOUR COLLECTION); per-card
  mono row reads templated/placeholder — verify real per-product values

## REAL LAYOUT BUGS — TRIAGED 2026-06-15
- ✅ **drills: "Headcover Trap" hero DUPLICATED** — REAL, FIXED v8.25.203. The day-featured
  "Drill of the day" felt hero was also rendered as the first list card. Now excluded from
  the default "all" list (shared _featuredDrillId()); category tabs keep their full set.
- ❌ **awards mobile "dimmed/scrim/ghosted"** — NOT a bug. DOM check on staging: ZERO
  low-opacity/scrim/overlay elements on [data-page=awards]. It was the FIXED BOTTOM-NAV's
  near-opaque bg overlaying the content band in the fullPage screenshot (capture artifact).
- ❌ **findplayers/faq "bottom tab bar overlapping mid-page"** — SAME fullPage-capture
  artifact (position:fixed nav rendered at viewport coords over full-height capture). Pages
  scroll under the nav normally. NOT bugs. TOOL NOTE: the E2E sweep's fullPage screenshots
  misrepresent fixed-nav pages → capture viewport-only (or hide .bottom-nav) for accurate
  per-page V1; don't chase "nav overlap"/"dimmed-lower-portion" as bugs.
- ⏳ roundhistory mobile scorecard dot-row clip + profile mobile masthead crowding — STILL
  TO VERIFY (viewport capture next cycle; likely minor/artifact but unconfirmed).

## DM (already fixed v8.25.200) + further design opportunity
- dms mobile skeleton = FIXED (.200, V1-verified resolves to the 12-member list).
- REMAINING design (not a bug): desktop is a narrow centered roster (no two-pane), rows are
  24× "Start a conversation" with no last-message/timestamp/unread = no hierarchy/density.
  Folds into the systemic desktop fix + a Messages-inbox elevation.

## CAPTURE ARTIFACTS — NOT real bugs (count-up animations caught mid-frame)
Cross-viewport NUMBER mismatches are the data-count entrance animations photographed at
different frames between the mobile + desktop sweeps (taken minutes apart), NOT data bugs:
- richlist totals (Nick 238 vs 319, Mr Parbaugh 937 vs 1255, Kayvan 231 vs 310)
- trophyroom XP (676 vs 775), awards "Iron Man 6 vs 8 rounds"
- scramble "8 TEAMS" vs "0 TEAMS" — LIKELY count-up/cold-start, but body says "0-0 YOUR
  RECORD AWAITS" → SPOT-CHECK against prod (could be a real count vs empty-state mismatch).
- "Kayvan" vs "Kayvun" cross-viewport = almost certainly a font/letter-spacing misread.
NOTE: harden the E2E sweep to settle count-ups before capture (wait for data-count to reach
final, or add ?nomotion) so future critiques don't re-flag these as data mismatches.

## SCORES (worst-first)
2.5/6.2 dms(FIXED) · 7.4/5.6 profile-edit · 7.8/5.6 activity · 7.6/6.4 awards ·
7.8/6.2 rules · 8.4/5.8 aces · 8.2/6.3 findplayers · 8.4/6.2 leagues · 8.4/6.2 wrapped ·
8.4/6.3 home · 7.8/6.9 chat · 7.9/6.8 faq · 7.9/6.8 profile · 8.3/6.4 roundhistory ·
8.1/6.8 caddynotes · 8.3/6.6 teetimes · 8.4/6.6 courses · 8.6/6.4 drills · 8.2/6.8 range ·
8.4/6.8 rounds/wagers/records/tournament · 8.6/6.8 bounties/trips · 7.4/8.1 members ·
8.7/6.8 seasonrecap/partygames · 8.4/7.2 calendar · 8.4/7.4 feed/settings · 7.8/8.1 social ·
8.6/7.4 playnow/challenges/trophyroom · 8.4/7.6 standings/bugreport · 8.7/7.4 richlist/scramble ·
9.0/7.4 merch · 8.7/8.2 shop. MOBILE avg ~8.3 (strong); DESKTOP avg ~6.8 (the gap).

## FIX SEQUENCE (narrowing convergence)
1. **Desktop-width layout system** (PRIORITY 1) — biggest lever; lift the ~25 mobile-stretched
   pages. Investigate the app shell's desktop layout (nav rail + content), add a content
   max-width + grid/rail so 1440px is designed, not stretched. Start with the worst (leagues).
   V1 each at 1440px. (Likely multi-ship.)
2. **Copy bugs** (PRIORITY 2) — Mastera Azalea, Stim→Stimp, GHN→GHIN, Ace wall casing,
   garbled ring, shop clipped bodies, drills dup hero, awards scrim. Fast batch.
3. **Contrast pass** (PRIORITY 3) — cream-on-cream faint text, per page, V1 vs actual bg.
4. Re-run the critique workflow after each batch → scores should rise + flags shrink (narrow).
