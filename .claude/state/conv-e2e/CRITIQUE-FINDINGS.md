# Convergence critique findings — 41-route visual audit (Workflow wf_1c42d813, 2026-06-15)

41 routes scored mobile+desktop vs the 9.5 rubric by parallel subagents (full raw
output: the workflow result; ~2M tokens, 178 tool uses). Synthesized + triaged here.
Scores capped 9.4 (AMD-028). Worst-first. **m/d = mobile/desktop**, B = bland.

## THE DOMINANT FINDING — SYSTEMIC: desktop/HQ is mobile-stretched (directive #4)
~25 pages score desktop **5.6–7.4** with the IDENTICAL complaint: content pinned to a
narrow center/left column, **huge dead cream gutters** on the 1440px viewport; the
desktop layout does not use width. This is THE systemic lever — a desktop layout system
(content max-width + a real grid/rail, or two-pane where it fits) lifts ~25 desktop
scores at once. Worst offenders: **leagues** (content in a 325×320 top-left corner, ~70%
dead), drills/roundhistory/range/caddynotes/profile/activity/rules/awards/findplayers
(all "~330px column in 1440px, ~500px+ empty gutters"). Mobile is generally strong
(8.2–9.0); the gap is almost entirely DESKTOP. → **PRIORITY 1.**

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

## REAL LAYOUT BUGS → PRIORITY 2
- **drills: "Headcover Trap" hero DUPLICATED** — appears as the dark hero AND the first
  cream list card (both in first viewport). Dedup.
- **awards mobile: lower ~40% dimmed/grayed, footer floating over it, ghosted "Mr Parbaugh"
  bleeding through** — looks like a stuck scrim/overlay or scroll-fade escape. VERIFY + fix.
- findplayers/faq mobile: bottom tab bar overlapping mid-page list — verify bottom content
  padding clears the 44pt fixed bar (could be capture artifact; confirm on the page).
- roundhistory mobile: scorecard dot-row may clip at card right edge — verify 18 dots fit.
- profile mobile masthead: greeting overlaps avatar/icons — crowded at 430px, verify no clip.

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
