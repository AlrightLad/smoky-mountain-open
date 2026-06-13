I now have all the actuals verified against source. There are several material discrepancies between the three results and the live code. Here is the verified, ordered implementation plan.

---

# VERIFIED IMPLEMENTATION PLAN — swing-scene + shop-9.5 pass

**Overall verdict: the three results are NOT directly applicable as written.** The SCENE result targets a stale COURSE_SVG (its "old" string does not match disk). The SHOP-95 result assumes wrong line numbers, a wrong "last entry" (pc50 is no longer last), and re-introduces a `.plate-clubhouse-crest` recipe that is now a SHIPPED nameplate (pc46), not free real estate. Corrected coordinates and conflicts are below. The FINISH-FRAME result is the only one that is exactly applicable.

---

## STEP 1 — FINISH_FRAME (intro.js) — APPLICABLE AS-IS

**File:** `C:\Users\Zach\smoky-mountain-open\src\core\intro.js:38`

Current (verified): `var FINISH_FRAME = 74;` with the comment block at lines 38-40.

**Edit:** change `74` → `58` and update the inline comment to the recenter/respawn rationale.

- **Confirms the ball-respawn stop:** Per the frame-by-frame harness (`.claude/state/finish-frames-v3/`), `golf ball 2` (ip52→op96) is at its farthest bottom-right corner at f58 and walks toward the tee every later frame; recenter begins f71. Holding at 58 stops BEFORE both the walk-back and the recenter — it does fix both Founder complaints. **Honest caveat to carry forward:** f58 is a *compromise*, not a clean frame — the respawn ball still exists on screen (just at its far point). The only full fix is hiding/trimming the `golf ball 2` layer in the JSON (out of scope for the one-liner). Note this in the ship retrospective.
- **Buildable:** single `var` constant change, vanilla JS, no token impact. Hook 2 (acorn parse) will pass.
- **No conflict.**

---

## STEP 2 — COURSE_SVG (intro.js) — DISK HAS ALREADY MOVED ON; SCENE result is STALE

**File:** `C:\Users\Zach\smoky-mountain-open\src\core\intro.js:62`

**CONFLICT (blocking):** The SCENE result's "current COURSE_SVG" description (just fairway stripes, green, flag, sun glow) and its implied baseline do **not** match what is on disk. The live `COURSE_SVG` (line 62) was already rewritten — it currently has a `pbiSkyGrad` with **4 stops** (`#0a2218→#16382a→#2e4d36→#3c5037`), a bottom-anchored `pbiSun` radial (`cx=52% cy=100%`), a treeline ridge path, `pbiFairway`, three fairway stripes, a lit green + brass flagstick, and a foreground shadow ellipse. The SCENE result's proposed replacement uses a **different, conflicting palette direction**: its `pbiSkyGrad` runs `#0a2218→…→#7cb89a` (a *light* `#7cb89a` at 100%) and a **top-anchored sun** (`cx=50% cy=15%`). 

Two problems with applying SCENE verbatim:
1. **Palette regression risk.** intro.js defines the dawn palette as JS constants at line 44 (`SKY_TOP/SKY_MID/SKY_GLOW/GLOW_HOT/SUN`) and the `#pbIntro` root background (line 69) is a `radial-gradient` keyed off `SKY_GLOW/SKY_MID/SKY_TOP` glowing from `62% 80%` (bottom-ish). The current COURSE_SVG sun also sits at the **bottom** to match that root glow. SCENE's top-anchored sun + light-green horizon would fight the root radial (glow at bottom, but SVG brightest at top) — visually incoherent behind the centered golfer.
2. **The wordmark.** "Parbaughs." renders in `GLOW_HOT #f0d488` (line 76) over the scene. SCENE's `#7cb89a` light-green horizon band sits in the upper-middle where the wordmark lives — risks washing out the wordmark contrast.

**RECOMMENDATION:** Do **not** paste SCENE's string blind. Treat SCENE as a design *direction* (richer scene: trees L/R, bunkers, clubhouse, cart path) and port those *elements* onto the **current** bottom-sun / dawn-palette baseline:
- Keep the existing `pbiSkyGrad` (4-stop, dark→felt, no light horizon) and the bottom-anchored `pbiSun` so it stays coherent with the root radial (line 69) and keeps wordmark contrast.
- Add SCENE's value-adds that don't fight the composition: left/right `pbiTrees-L/R` treelines, two `pbiFairway`-adjacent bunkers (tan, `#d4a574` low-opacity so they don't pull focus center), the faint clubhouse silhouette (keep it low-opacity, off to mid-distance, NOT center where the golfer stands), cart path accent.
- Drop SCENE's clouds-with-`filter:blur(1.5px)` — see perf note.

**PERF (blocking-ish):** SCENE uses `style="filter:blur(1.5px)"` on two cloud paths. SVG filters force an offscreen raster pass on every composite; on the intro overlay (which also runs the Lottie canvas) this is a real cost on low-end Android (Founder target: mixed iPhone+Android). **Drop the blur** — use a low-opacity soft-edged ellipse or omit clouds. Everything else (paths, linear/radial gradients, no filters) is cheap and fine. Reuse gradient ids with the `pbi` prefix (collision-safe, already the convention per line 61).

**Buildable:** inline SVG string assigned to a `var`; vanilla JS. Cosmetic-hex is allowed here (Visual Reference / scene exception). **V1-verify required** (see V1 section) — this is the single most visible change and the only one with a palette-coherence risk.

---

## STEP 3 — SHOP cosmetics 9.5 pass (shop.js + components.css + router.js)

### 3a — Material recipe upgrades (components.css) — partially applicable, ONE HARD CONFLICT

**`.title-engraved` — APPLICABLE.** Verified at `components.css:4881`, matches the SHOP-95 "old" string exactly. Replace with the 7-stop struck-brass + `::after` specular band. Safe — every brass title chip inherits it. The `claretSweep` keyframe SHOP-95 references for the medallion is real (`components.css:4878`), reuse confirmed valid.

**`.plate-locker-brass` background — APPLICABLE but LINE IS WRONG.** SHOP-95 says L4898 "background" — verified correct at `components.css:4898`. The old string matches. Replace background with the 7-stop ramp as proposed.

**`.plate-clubhouse-crest` — HARD CONFLICT, DO NOT REPLACE.** SHOP-95 treats `.plate-clubhouse-crest` (L4944) as a base leather recipe to overwrite. **It is not free** — it is the SHIPPED worn render for `pc46_clubhouse_crest` (a live, purchasable 650-coin nameplate, `shop.js:165`, mapped in `_npCls` at `shop.js:329`). Overwriting its color (`#3a2818`→`#f3e6c8`), padding, and adding a `::before` dashed stitch **changes an item members may already own/have-equipped** — a silent cosmetic mutation on a shipped SKU. 
- **Correct move:** if you want the richer saddle-leather recipe, apply it as a **NEW class** (`.plate-calfskin-tag`, which SHOP-95 already defines for pc54) and leave `.plate-clubhouse-crest` untouched. If the Founder *wants* pc46 upgraded too, that is a deliberate visible change to a shipped item — surface it, don't fold it silently into a "material recipe" edit.

### 3b — New catalog items (shop.js) — COORDINATES WRONG, must re-anchor

**CONFLICT:** SHOP-95 says "append after pc50, the last entry, shop.js L169." **pc50 is no longer last.** The array's final element is now `pc50_eagle_soar` at `shop.js:169` BUT it is the last *listed* — verified the array closes at line 170 (`];`). However, SHOP-95's instruction "add a comma after pc50's closing brace" is correct *structurally* — pc50 at L169 currently has **no trailing comma** and is immediately followed by `]`. So: add `,` after pc50's `}`, then insert the 5 new entries before the `]` at L170. **This part of the coordinate holds** once you confirm pc50 is the last array member (it is). Re-verify the surrounding 7-item batch (pc44-pc51, lines 160-169) wasn't what SHOP-95 meant — it explicitly references pc50 and `ringClass` items, consistent with disk.

**The 5 new items are buildable** (vanilla object literals, `tier`/`cat`/`ringClass`/`css`/`preview`/`desc` fields all match the existing schema). Tier placement (pc52/54/56=locker, pc55=proshop, pc53=cabinet 1400) sorts correctly via `_tr` map at `shop.js:433`. **NEW badge:** note `_pcNum >= 26` triggers the NEW badge (`shop.js:318`) — pc52-56 all qualify, intended.

**`_npCls` map edit — APPLICABLE, line confirmed.** `shop.js:329`. Add `pc54_calfskin_tag: 'plate-calfskin-tag'` to the map object exactly as SHOP-95 specifies. Verified the map currently ends `...pc51_chalk_board: 'plate-chalk-board' }`.

### 3c — preview==worn confirmation (verified by reading render paths)

- **Rings (pc52/pc53):** `shop.js:320-325` — border items with `ringClass` render the worn `.ring-*` class at 104px on the ring stage. preview==worn holds **by construction**. ✓
- **Nameplate (pc54):** `shop.js:326-330` — resolves via `_npCls` to the worn `.plate-*` class on `.shop-surface-stage`. Holds **once the map entry is added** (3b). ✓
- **Card (pc55):** `shop.js:331-332` — renders `item.css` inline; pc55 carries `css`. Holds, no code change. ✓
- **Ball (pc56):** `shop.js:338-343` — calls `pbMarkerGlyph(item.id, 56)` in shop, and `pbMarkerGlyph(...,12)` worn (router.js:492). preview==worn **once the switch case is added** (3d). ✓

### 3d — pbMarkerGlyph new case (router.js) — APPLICABLE, location corrected

**File:** `C:\Users\Zach\smoky-mountain-open\src\core\router.js`. SHOP-95 says "before `default:`, switch starting L419." Verified: switch opens at `router.js:419`, `default: return '';` is at `router.js:486`. Insert the `case 'pc56_sterling':` block **immediately before line 486**. 
- **One correction:** the SHOP-95 case embeds its own `<defs><radialGradient id="stg">`. That is fine (function wraps each glyph in its own `<svg>` at L488), but **id `stg` must not collide** if two sterling glyphs render on one page (e.g., shop stage 56px + a worn 12px in the same view). SVG gradient ids are document-global; duplicate `id="stg"` → second instance may inherit the first's geometry. **Low real risk** (shop never shows the same item worn+staged simultaneously), but to be safe, suffix the id with the size or a counter, or accept the minor risk. Flagging per P9 rigor.

### 3e — PERF at ~60 cards

The shelves render every non-retired item via `_proShopCard` (`shop.js:437`), plus Front Table (3), Trophy Cabinet, and Paint Locker (~15). Adding 5 cards is negligible. **The real perf question is the new CSS recipes**, not card count:
- `.ring-medallion::after` uses `animation:claretSweep 5s linear infinite` — a **continuously animating conic-gradient rotation**. Per-card that's a compositor-thread transform (cheap), BUT it runs even when off-screen. With the existing `.ring-claret` already animating (L4876) plus a second always-on sweep, on a shelf where both ring items are visible you have 2 infinite animations. **Acceptable** (transform-only, GPU), but verify no jank on Android in the V1 capture. Consider `prefers-reduced-motion` gating for the sweep (the app already respects reduced-motion in intro.js — be consistent).
- Multi-layer `background` stacks (3-4 gradient layers on leather/medallion) are paint-time only, not animated — fine at this scale.
- `::before`/`::after` pseudo-elements on rings/plates: each adds one box; trivial.

**No perf regression expected.** The animation is the only thing to watch.

---

## CONFLICTS SUMMARY (ordered by severity)

| # | Severity | Issue |
|---|---|---|
| 1 | **BLOCK** | SHOP-95 overwrites `.plate-clubhouse-crest` (L4944) — that is the SHIPPED pc46 nameplate, not a base recipe. Apply leather upgrade as `.plate-calfskin-tag` only; leave pc46 untouched unless Founder explicitly wants pc46 changed. |
| 2 | **BLOCK** | SCENE's COURSE_SVG replacement targets a stale baseline + introduces a conflicting palette (light horizon + top sun) that fights the `#pbIntro` root radial (intro.js:69, bottom glow) and the wordmark. Port elements onto the current bottom-sun dawn baseline; do not paste verbatim. |
| 3 | HIGH | SCENE's clouds use `filter:blur(1.5px)` — drop (offscreen raster cost on Android). |
| 4 | MED | router.js `id="stg"` gradient could collide if two sterling glyphs co-render; suffix the id. |
| 5 | LOW | SHOP-95 line refs are mostly right but pc50's trailing-comma state must be confirmed at edit time (it currently has NO trailing comma at L169). |

---

## WHAT TO V1-VERIFY IN A MEMBER CAPTURE (P9/V1 — required before ship-close)

The emulator visual loop is noted blocked in the marathon memory; a Playwright capture is the gating next step. Capture at **1920 desktop + iPhone + Pixel** viewports:

1. **Sign-in intro overlay** (`#pbIntro`): scene reads as a coherent dawn course behind the centered golfer; trees L/R + bunkers + clubhouse present and NOT crowding the golfer; the "Parbaughs." wordmark stays legible against the sky band; no light-horizon/dark-glow mismatch with the root radial. Confirm Lottie golfer still stands "on the green."
2. **FINISH_FRAME=58 held pose:** capture the frozen end frame — confirm club at top / follow-through, NO recenter, respawn ball at far bottom-right corner (not mid-walk-back to the tee). Honestly note the ball is still faintly present.
3. **/shop shelves:** the 5 new items render with `preview==worn` (ring stage 104px for pc52/53; plate stage for pc54; card css for pc55; 56px sterling glyph for pc56). Confirm tier chips/sort place them correctly (pc55 Pro Shop, pc52/54/56 Member's Locker, pc53 Champion's Cabinet below the 1500 Founders' Crest).
4. **Material upgrades on existing items:** `.title-engraved` chips (every plain title preview) + `.plate-locker-brass` (pc05) now read as struck metal with a specular band — and crucially, **pc46 (`.plate-clubhouse-crest`) is UNCHANGED** vs prior baseline (regression check for conflict #1).
5. **Motion/Android:** the medallion `claretSweep` animation runs smooth, no jank; ideally honors reduced-motion.

---

## BUILDABILITY CONFIRMATION

All edits are vanilla JS `var`/object-literal + CSS; no ESM, no `let`/`const` introduced. Cosmetic hardcoded hex is permitted under the CLAUDE.md Visual-Reference / share-card / cosmetic-material exception. Hook 2 (acorn parse on src/*.js) will pass for intro.js/shop.js/router.js edits. Version bump + `CACHE_NAME` in `public/sw.js` + Caddy Notes line are required on ship (Hook 5 enforces APP_VERSION==package.json; CACHE_NAME is the manual step).

**Recommended Caddy Notes line (from SHOP-95, on-brand):** "New in the Pro Shop: a proper club pin, a struck medallion, a calfskin bag tag, the Sunday pairing sheet, and a sterling marker — the good stuff, finally finished like it."

**Key file:line references:** `src/core/intro.js:38` (FINISH_FRAME), `:44` (palette consts), `:62` (COURSE_SVG), `:69` (root radial); `src/pages/shop.js:169-170` (catalog tail), `:320-343` (render paths), `:329` (_npCls map), `:433` (tier sort); `src/styles/components.css:4878` (claretSweep), `:4881` (.title-engraved), `:4897-4902` (.plate-locker-brass), `:4944` (.plate-clubhouse-crest — DO NOT TOUCH), `:4945` (append point); `src/core/router.js:419` (switch open), `:486` (default — insert pc56 before).