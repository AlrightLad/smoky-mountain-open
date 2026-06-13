I now have all the evidence I need. Critical findings confirmed:

1. **RECAP-ALIGN brief has a code-breaking error** — `getSeasonStandings(year, "_year")` does NOT return calendar-year data. The `else` fallback at data.js:2042 is Mar1–Nov30, and any unrecognized key (`"_year"`) hits it. Wrapped.js:25 is *itself* not aligned to its own Jan1–Dec31 round window.

2. **Existing shop items DO use hardcoded hex colors** (`css:"...#92400e..."`, `preview:"#92400e"`) — the "no-hardcoded-color rule" the prompt asks me to flag is already systematically violated in the catalog by design (html2canvas share-card / inline-style compat). The MERCH brief, however, is a *page render* (not a share-card), so it must use tokens.

Here is the integration plan.

---

# PARBAUGHS Founder Batch 2026-06-13 — Ordered Integration Plan

## TL;DR ordering

| # | Item | Verdict | Effort | Ship gate |
|---|---|---|---|---|
| 1 | RECAP-ALIGN | CODE-NOW **with a corrected fix** (brief's fix is buggy) | XS | none |
| 2 | SHOP-ITEMS | CODE-NOW (data + CSS only) | S | none |
| 3 | MERCH page | CODE-NOW (one render fn) | S–M | none |
| 4 | ANIMATIONS | CODE-NOW (additive, reduced-motion-aware) | S–M | none |
| 5 | COURSE-SCAN T1+T2 | CODE-NOW · T3 FOUNDER-GATED | M (T1) / S (T2) / M (T3) | T3: AMD-018 #1 + Anthropic spend (P4) |

All five except COURSE-SCAN Tier 3 are safe to build immediately. Ship 1→2→3→4 in that order (zero interdependency, ascending blast radius), then COURSE-SCAN T1, T2, and hold T3 for Founder.

---

## 1. RECAP-ALIGN — CODE-NOW, but the brief's fix is WRONG. Do this instead.

**File:** `src/pages/seasonrecap.js`

**Critical correction — the brief breaks the data layer.** The plan says line 4 → `PB.getSeasonStandings(year, "_year")`. Verified against `src/core/data.js:2036-2049`: `getSeasonStandings(year, seasonKey)` runs `SEASON_CONFIG.find(s => s.key === seasonKey)`. The keys are only `"spring" | "summer" | "fall"` (data.js:2013-2017). `"_year"` matches nothing → falls into the **else** branch (data.js:2042) which is `year-03-01` to `year-11-30`, label `"Full Year"`. That is **Mar–Nov, not Jan1–Dec31** — so the recap's standings would silently mismatch its own Jan–Dec round window. **And wrapped.js:25 has the same latent bug** — it also passes `"_year"` and gets Mar–Nov standings, not the calendar year its round filter (wrapped.js:27, `yearStart = year+"-01-01"`) uses. The Founder's Decision #59 ("whole calendar year") is currently only half-implemented in Wrapped.

**Two valid fixes — recommend Option A (no signature change, lowest risk):**

- **Option A (recommended):** Leave `getSeasonStandings` alone; pass **no** season key in seasonrecap.js. But default (no key) returns the *current* season (data.js:2044-2048), which is also wrong for a full-year recap. So Option A alone is insufficient → use Option B.
- **Option B (recommended, correct):** Add a real full-year branch to `getSeasonStandings` so both Wrapped and Recap get true Jan–Dec. One-line, backward-compatible:

  `src/core/data.js:2042` — change the else-fallback OR add an explicit key. Cleanest: make `"_year"` an explicit branch.
  - OLD (line 2042): `else { seasonStart = year + "-03-01"; seasonEnd = year + "-11-30"; seasonLabel = year + " Full Year"; }`
  - NEW: `else { seasonStart = year + "-01-01"; seasonEnd = year + "-12-31"; seasonLabel = year + " Full Year"; }`

  This makes the existing `"_year"` callers (wrapped.js:25) actually behave as their comments already claim, and lets seasonrecap.js opt in the same way. Verify no other caller depends on the Mar–Nov fallback: only Wrapped + (new) Recap use a non-season key; standings.js uses the real season keys. **Grep `getSeasonStandings` before shipping to confirm caller set.**

**seasonrecap.js edits (after the data.js fix):**
- **Line 4:** `var season = PB.getSeasonStandings(year, "_year");` (now correctly Jan–Dec)
- **Line 9:** `>= year + "-01-01" && r.date <= year + "-12-31"` (brief is correct here)
- **Line 21:** label → `'Calendar Year'` (brief correct)
- **Line 140:** the Iron Will filter uses `season.seasonStart`/`season.seasonEnd` — after the data.js fix these are now Jan1–Dec31 automatically, so **the brief's hardcoded line-140 replacement is unnecessary and should be skipped** (keep `season.seasonStart`/`seasonEnd` — DRY, single source). The brief would duplicate the literal; don't.
- **Line 196:** footer → `'See you in ' + (year+1)` (brief correct)

**Verify in member capture:** open `#/seasonrecap`, confirm header reads "Calendar Year", champion + Final Standings match the standings the Wrapped finale shows for the same year, and "Total Rounds" count equals Jan–Dec rounds (cross-check one player's round list). Buildable: vanilla, `var`, no new tokens.

---

## 2. SHOP-ITEMS — CODE-NOW. Data + 3 CSS classes only.

**Files:** `src/pages/shop.js` (the `PRO_SHOP_CATALOG` array, lines 99-160) + `src/styles/components.css` (the `.ring-* / .card-skin-* / .plate-*` block).

**No-hardcoded-color rule — important nuance the prompt asked me to flag:** The existing catalog **already uses raw hex everywhere** (`#92400e`, `#caa75c`, the `css:` strings on PC-08/09/10, every `preview:`). Verified shop.js:51-159. This is an established, intentional exception — these are inline-style cosmetic material renders and html2canvas/share-card-adjacent surfaces, exactly the CLAUDE.md carve-out ("share-card template," plus inline cosmetic CSS that can't read CSS vars in all render contexts). **So the 8 new items matching the existing hardcoded-hex pattern is consistent and correct** — do NOT try to tokenize them, that would make them inconsistent with PC-01..PC-43 and risk breaking the worn-render parity. The one place to use a token is `var(--cb-brass-rgb)` in PC-48's `box-shadow` (the brief already does this, and PC-37/38 precedent uses `var(--gold)` in `preview`, so tokens-where-they-render is fine).

**Buildability check on the brief's CSS — all clean,** with two notes:
- PC-46 `.plate-clubhouse-crest::after` has dead `radial-gradient(... transparent 3px,transparent)` no-op layers (both stops transparent → renders nothing). Drop them; keep the `repeating-linear-gradient` grain. Cosmetic-only, not a blocker.
- PC-47 (ball), PC-49 (teemarker), PC-50 (flair) are **preview-only** per brief (no CSS class) — correct, matches how PC-26/27 (ball) and PC-17-20/34 (teemarker) already render off `preview` + name. PC-50 flair is `arriving:true` so it never renders a surface yet (matches PC-11-13/31-33). Confirmed consistent with shop.js:138-159.

**Retirement of PC-28 "The Sleeve":** Add `retired:true` to the PC-28 object (shop.js:146). **Do NOT delete it** — verified shop.js:198-199 (`getCosmetic` resolves by id across both catalogs) and the grandfather note at lines 161-164: owned items must keep resolving forever. The sale-floor filters at shop.js:377/418 already exclude on flags; confirm `retired` is in the exclusion predicate (legacy `COSMETICS_CATALOG` uses `.retired` at line 452 — mirror that for `PRO_SHOP_CATALOG`; if the pro-shop filters at :377/:418 don't yet check `retired`, add `&& !i.retired`). This is the one real integration touch — **check those two filter predicates before shipping** or the retired item stays on the floor.

**Ship order within item 2:** add CSS classes first, then the 8 catalog objects, then PC-28 `retired`, then verify the filter predicate.

**Verify in member capture:** open `#/shop`, scroll each shelf — confirm 8 new items appear in correct shelves (Rings/Cards/Nameplates/Ball/Title/Tee/Flair), PC-28 is gone from the floor; equip one owned-retired check (if any test acct owns it) still resolves. Try-it-on (task #51) renders the new `preview`/css. Buildable: pure data + CSS.

---

## 3. MERCH — CODE-NOW. Replace the dead redirect with a token-driven SVG poster.

**File:** `src/pages/merch.js` (currently lines 4-9 redirect to shop; 11-37 is dead code after `return`).

**This is the ONE item where the no-hardcoded-color rule fully applies** — it's a page render (`[data-page="merch"]`), not a cosmetic/share-card. Use Clubhouse tokens. The brief names `--cb-brass`, `--cb-chalk`, `--cb-felt`, `--cb-chalk-3`, `--cb-green`. **Verify these token names exist** in `src/styles/base.css` before authoring (grep `--cb-felt`, `--cb-brass` — Wrapped uses `--cb-felt`/`--cb-chalk`/`--cb-paper`/`--cb-ink` with hex fallbacks at wrapped.js:140-142, so the fallback pattern `var(--cb-felt, #1d3a2a)` is the proven safe form — use it for every fill so the SVG never renders a missing-token black).

**Edits:**
- Remove lines 8-9 (`Router.go("shop"); return;`) and the dead legacy block (11-36 — the old `watermark.jpg` img + items array).
- Write one render: `var h = '<div class="sh">...back button...</div>'` + a full-bleed felt container holding **one inline `<svg viewBox="0 0 400 560">`** (poster ratio) with: `<defs>` linearGradient for dawn (brass→chalk), rolling-hill `<path>`s in green tints, a geometric clubhouse `<polygon>`/`<rect>` silhouette, a flag (`<line>` + `<path>` triangle), sun `<circle>`. Overlay "PARBAUGHS" in `font-family:var(--font-display)` (Fraunces), "COMING SOON", "EST. 2026".
- Back button: keep `Router.back('home')` (it's reachable now that the redirect is gone — confirm merch is in the nav/tab array or only deep-linked; if it was a "ghost in the tab-match array" per the old comment, that's fine, the page now renders instead of bouncing).

**Perf / SVG cost:** one static inline SVG, no animation loop, no html2canvas — negligible. Cap path count (~15-25 nodes); avoid per-frame work. If you add a subtle sunrise shimmer, gate it behind `prefersReducedMotion()` (animate.js:140 is global) and prefer a CSS `@keyframes` on a single gradient stop, not JS rAF.

**Verify in member capture:** open `#/merch` on iPhone + Pixel viewport — poster fills, wordmark uses Fraunces, colors track the active theme's `--cb-*` tokens (switch themes, confirm felt/brass shift), no black fills (proves token fallbacks resolve), back button returns to home. Run the `canvas-design`/`frontend-design` skill if you want a stronger composition pass. Buildable: vanilla, `var`, tokens.

---

## 4. ANIMATIONS — CODE-NOW. Additive, reduced-motion-aware.

**Files:** `src/core/animate.js` (add 3 fns after line 120, expose on `window` near lines 145-148), `src/pages/standings.js` (after the table renders), `src/pages/seasonrecap.js` (after innerHTML).

**Verified integration points (brief's line numbers are stale — use these):**
- standings.js renders the table at **lines 187-216**; `innerHTML` is set later in the function (the brief's "line 423" is past the file region I read — locate the actual `document.querySelector(...).innerHTML = h` assignment and fire after it). The rows are `tr.roster-row.std-row` inside `tbody` (line 204, 216). Points live in `span.std-pts` (line 213). The chase fill is `.std-chase__fill` (line 157) and **already respects reduced-motion in CSS** (per brief, components.css:541) — so `barFill` must **no-op when `prefersReducedMotion()`** to avoid double-handling.
- seasonrecap.js sets `innerHTML` at **line 198** (confirmed). `.stat-box` ×3 (lines 35-37), award `.card`s (166-173), Final Standings `.card`s (183-192).

**Build the 3 primitives** (`staggeredReveal`, `barFill`, `fadeInScale`) in animate.js using the existing `_easeOutCubic` + `_prefersReducedMotion` cache. Each MUST early-return to final state when `_prefersReducedMotion` (mirror animateNumber:64-68). Set `will-change` only during the animation and clear it on completion (mirror :71/:84). `countUp` already exists as `initCountAnimations` — reuse it, don't add a 4th.

**Perf risk — animations × rows (real, mitigate):**
- Stagger **caps**: with a 20-member league, standings = ~20 rows; a 40-60ms stagger = ~1s total tail — fine. But **guard for N**: cap total stagger window (e.g., `delay = Math.min(baseDelay, 600/rowCount)`) so a future 200-row league doesn't animate for 12s. Don't animate rows below the fold on first paint if you can cheaply detect it; otherwise the cap is sufficient.
- Use **transform/opacity only** (translateX + opacity), never animate `height`/`top`/`width` on rows (layout thrash). `barFill` animating `width` is acceptable for *one* element (the single chase bar), not for rows.
- Single shared rAF is ideal but not required at this row count; per-element rAF (like animateNumber) is fine for ≤50 rows. Clear `will-change` after — leaving it set on 20 rows pins compositor layers.
- `fadeInScale` on award cards: stagger ≤6 cards, negligible.

**Order:** build + expose the 3 fns in animate.js first (verify acorn parse via Hook 2), then wire standings.js, then seasonrecap.js. **Conflict check with item 1 & 3:** none — different files, except seasonrecap.js is touched by BOTH item 1 and item 4. **Sequence item 1 before item 4** so the animation calls attach to the post-alignment render (the `innerHTML = h` line is the same anchor for both).

**Verify in member capture:** record `#/standings` and `#/seasonrecap` once with motion on (rows slide+fade in staggered, points count up, chase bar fills) and once with OS reduced-motion enabled (everything snaps to final, zero motion). Confirm no layout shift / no flash of empty rows. Buildable: vanilla, `var`, reuses `--duration-*`/`--ease-*` tokens.

---

## 5. COURSE-SCAN — Tiers 1+2 CODE-NOW · Tier 3 FOUNDER-GATED

**Tier 1 (chart-it-yourself) — CODE-NOW, effort M.** Files: `src/pages/courses.js` (the three `prompt('State')` stubs — confirmed `quickAddCourseFromDir` at :413, `submitAddCourse` at :638, `showScorecardEditor` at :876; brief's playnow.js:643 / rounds.js:865 stubs to be confirmed by grep), plus Firebase Storage photo path reused from scorecard.js. This ships the full member-facing win at $0 with no gate. Write `source:'member-charted'`, unverified badge (reuse courses-detail.js:42-66 trust UI), dedupe guard before create, existing +50/+10 ParCoin cycle. **Bug-fix-adjacent + clearly-scoped feature → no Founder approval needed** per the standing 2026-06-11 grant (economy *design* unchanged; reuses existing award amounts).

**Tier 2 (free fallback sources) — CODE-NOW, effort S, one soft gate.** OpenGolfAPI + OSM Overpass fallback chain mapped onto the existing `_extractTeeData` shape (functions/index.js). **Gate: not Founder, but Legal & Compliance** — ODbL attribution wording must pass the `parbaughs-legal-compliance` skill before ship (route the attribution string through it). No spend, no AMD-018. Render estimated rating/slope explicitly (P9/P10 — never silent 72/113).

**Tier 3 (Claude-vision scorecard scan) — FOUNDER-GATED, effort M. Hold.** Three hard gates, all confirmed:
1. **AMD-018 gate #1** — `extractScorecard` is a Cloud Function deploy → Founder pre-auth in `task-queue/founder/` (same path as the deleteMyAccount #24 deploy).
2. **P4 paid-last + spend approval** — new Anthropic API key + billing (no existing key custody in the repo). ~$3/year at league scale, but it's a new external paid dependency → Founder decision required. P4 is satisfied *because* T1+T2 ship the feature at $0 first.
3. **P8 / AgentShield** — key lives only in Functions secret config, never the PWA bundle; AgentShield pass after wiring.

**Recommendation to surface to Founder (single decision):** bundle the T3 Anthropic-key spend approval + AMD-018 deploy window with the next already-pending Cloud Function deploy. Until then T1+T2 deliver the category-winning capability with zero gates. **Do not start T3 code until the `task-queue/founder/` item is approved** — but you *can* pre-stage the function scaffold (clone of `searchCourses`, functions/index.js:144-183) and the `showScorecardEditor` confirm-screen extension behind T1, since those are buildable without the key.

**Verify in member capture (T1):** at `#/playnow` or `#/courses`, chart a 9-hole + an 18-hole unknown course end-to-end (name → holes → pars → submit), confirm it's immediately playable, shows the amber "Charted by {member} — unverified" badge, is excluded from handicap-grade math, and a duplicate-name attempt trips the dedupe guard. Buildable: vanilla, `var`, tokens.

---

## Cross-item flags

- **Shared-file conflict:** `seasonrecap.js` is edited by Item 1 (data alignment) AND Item 4 (animations). Ship **Item 1 first**, then Item 4 attaches animation calls to the same post-`innerHTML` anchor (line 198). No conflict if sequenced.
- **`data.js` touch (Item 1, Option B):** the only `src/core/` edit in the batch — within AMD-027 file-size budget, one-line change, but grep all `getSeasonStandings` callers first (standings.js, wrapped.js, seasonrecap.js) to confirm none rely on the old Mar–Nov fallback. This is the highest-blast-radius edit in the CODE-NOW set; review it under code-review before commit.
- **No-hardcoded-color rule:** applies to **MERCH (Item 3) only**. Shop items (Item 2) are the documented inline-cosmetic exception and must stay hex to match PC-01..43.
- **Reduced-motion:** Item 4 must early-return to final state (animate.js cache); Item 3's optional shimmer must gate on `prefersReducedMotion()`. The chase bar already self-handles in CSS — `barFill` must no-op under reduced-motion to avoid conflict.
- **Perf:** animations cap the stagger window for row count; one static SVG for merch; no html2canvas/rAF loops added.
- **Version + Caddy Notes:** these are member-visible ships → bump `APP_VERSION` (src/core/utils.js) == package.json (Hook 5), bump `CACHE_NAME` in public/sw.js manually, and add a Caddy Notes line per ship.

**Buildability:** all CODE-NOW edits are vanilla JS, `var`, Clubhouse tokens (merch) or the documented hex exception (shop), and pass acorn (Hook 2) / lint (Hook 1). The only correction to the supplied briefs is RECAP-ALIGN's `"_year"` data-layer bug — fixed via the data.js:2042 one-liner above.