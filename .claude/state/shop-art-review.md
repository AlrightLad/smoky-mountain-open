I have full verification. Tokens exist, the marker function is a global, the foundation bugs are real and already documented. Here is my review.

---

# TASTE + CRAFT REVIEW — Pro Shop cosmetic-preview elevations

## Verdict up front
The five proposals are individually competent at the visual layer but **do not cohere as one shop**, and more seriously, **at least one is built on a false premise, and all five chase preview polish while ignoring the four no-op/fraud bugs that are the actual reason the shop "reads cheap."** Do NOT apply them as written. There is already a verified, ranked source-of-truth for this exact work — `.claude/state/ui-audit-2026-06-11/SHOP-ELEVATION-SPEC.md` — and these five critiques duplicate ~30% of it while contradicting it on sizing and missing its central finding. Harmonize to that spec; apply the corrected plan below.

---

## Load-bearing finding: the tee-marker proposal's "root failure" is FALSE

Proposal 5 stakes its entire diagnosis on: *"pbMarkerGlyph is NOT in scope on shop.js render (it lives in router.js, a sibling file)... every teemarker/ball item falls through to the sphere."* **This is wrong.** Verified:
- `router.js:412` defines `function pbMarkerGlyph(id, px)` as a **plain function declaration** in module-global scope.
- `vite.config.js:25` bundles `router.js` into `CORE_FILES` **before** the page renderers, and the build inlines core into one IIFE-free global scope. `pbMarkerGlyph` is therefore a live global when shop.js runs.
- The shop's `typeof pbMarkerGlyph === 'function'` guard at `shop.js:326` **already resolves true** — the real glyphs already render in the shop today (this was the v8.24.68 fix, per the code comment). The fallback sphere only appears for items genuinely lacking art.

So Edit 1's premise ("make pbMarkerGlyph available to shop.js") is solving a non-problem, and its rationale ("the shop can't see them") is false. The *real* marker gap is purely scale/staging (38px → bigger, on a lit ground) — which the proposal also delivers, so keep the CSS, **discard the diagnosis and any "expose the global" change.** Trust will die faster from shipping a confident-but-false root cause than from a small ring.

## The bigger miss: all five critique PREVIEW; the spec proves the problem is WORN

`SHOP-ELEVATION-SPEC.md` (verified against live code) documents four **P9/Legal ship-blockers** none of the five proposals mention:
1. **`renderAvatar` (router.js:338) never applies the ring class** — all 7 ornamental rings (up to 1500 PC) collapse to a flat border *when actually worn*. The gallery rope, claret sweep, wax seal etc. exist in CSS but never reach a real avatar.
2. **`getPlayerCardCss` only searches `COSMETICS_CATALOG`** — all 5 Pro Shop card skins (up to 900 PC) **no-op when equipped.**
3. **pc29_stimp_13** (500 PC, sold + described) is unmapped — equipping it changes zero pixels.
4. **pc42 / pc36** misrender at the two top prices (1500 / 500 PC).

The Founder's reaction tracks more to this — you can make a 140px preview gorgeous, but a member who buys the 1500 PC ring and sees a flat border on their feed avatar is the actual "horrid." **Preview fidelity must equal worn fidelity** (the spec's first principle). The five proposals would polish the storefront window while the merchandise stays broken. Wiring (spec ranks 1–4) must land before or with any preview CSS.

---

## Cross-category coherence audit — they are FIVE styles, not ONE shop

The proposals were authored independently and it shows. Conflicts that must be reconciled to a single system:

| Dimension | Ring (P1) | Nameplate (P2) | Card (P3) | Flair/plates (P4) | Marker (P5) | **Verdict** |
|---|---|---|---|---|---|---|
| Preview height | 140px stage | 72px | ~90px | 60px ring / 60px plate | 92px | **Inconsistent.** P4 re-specs the SAME ring at 96px+120px box vs P1's 140px — direct contradiction. |
| Class namespace | `.shop-ring-preview__*` | `.shop-nameplate-{id}` | `.card-preview--*` | `.shop-ring-wrap`, `.shop-nameplate-brass` | `.shop-marker-stage` | **P2 and P4 define DIFFERENT nameplate class systems** (`.shop-nameplate-pc05_locker_brass` vs `.shop-nameplate-brass`). Pick one. |
| Token discipline | mostly tokens | **hardcoded `#1d3a2a`, `#caa75c`, `#d8d2c0`…** | mostly tokens | **hardcoded `#0d2818`, `#e8dcc4`…** | tokens (good) | P5 is the cleanest; P2/P4 leak raw hex that duplicates existing tokens. |

**P1 vs P4 collision is disqualifying as-is**: two proposals re-style the ring preview at different sizes with different wrappers. P4's whole nameplate block (`.shop-nameplate-brass/green/parchment`) also competes with P2's per-id block. You cannot apply both. **P4 is the weakest of the five** — it's a thinner re-derivation of P1+P2+P3 with extra `perspective:1000px`/`translateZ` theatrics. Discard P4 entirely; take its single good idea (the marker drop-shadow ground) which P5 already covers better.

## Register + "refined, not flashy" violations to cut

The Founder's bar is country-club restraint — *one* confident material moment, not five competing effects. Several proposals over-busy it:
- **P1 `ringGleam` opacity pulse on cabinet rings** + P1's stacked 4-layer `box-shadow` on the stage — drop the infinite gleam animation. Static brass with one specular edge reads more expensive than a pulsing one. (Spec principle: "scarcity of effects, not just inventory.")
- **P4 `perspective:1000px` + `transform:translateZ(0)` on flair** — gratuitous; no payoff at 48px. Cut.
- **P5 tier-escalating `radial-gradient` x4 backgrounds** — keep ONE marker ground; vary only the border weight by tier (cheaper, reads as a ladder, far less paint to composite).
- **Heavy `background-attachment:fixed` in P1's `__frame`** — this forces a repaint on every scroll and is a known mobile-Safari perf/jank trap. **Cut it outright.**

## No-hardcoded-color rule

Per CLAUDE.md, hardcoded colors are allowed *only* where the cosmetic IS the color (ring `preview` hex, calendar dots, share-card). The material **chrome** around a preview (stage grounds, shadows, brass tints) is NOT the cosmetic — it must use tokens. So:
- ALLOWED: the per-item `item.preview` hex on the swatch chip / ring border (the cosmetic itself).
- VIOLATION to fix: P2's `#1d3a2a`, `#d8d2c0`, `#caa75c`; P3's `#0d2818`, `#b3a378`, `#8a7355`; P4's `#0d2818`, `#e8dcc4`. Replace `#caa75c`→`var(--cb-brass-2)`, `#1d3a2a`/`#0d2818`→`var(--cb-felt)`, brass tints→`rgba(var(--cb-brass-rgb),…)`, ink→`var(--cb-ink)`. The felt-green nameplate/card materials (pc07/pc10/pc29) genuinely ARE a green material, so a felt token is correct, not a violation — but use `--cb-felt`, don't reinvent the hex three times.

## Technical risk

- **Perf at ~60 cards:** the shop renders many tiles at once. P1's 4-stop `box-shadow` + radial-gradient stage per ring, plus P5's 3-layer gradient grounds, plus P3's inset+drop shadows — composited 60×. Drop shadows and gradients are cheap-ish but `background-attachment:fixed` (P1) and `filter: drop-shadow()` (P4/P5) are NOT — filters force off-thread raster and stack. **Cap to: one box-shadow + one gradient per preview; no `filter` on the repeated tile; no infinite animations on more than the single featured/hero item.**
- **html2canvas share-card compat:** none of these previews appear on the share card, so direct risk is low — BUT the underlying `.ring-*`, `.title-engraved`, `.plate-*` classes the spec wires into `renderAvatar`/feed DO get captured. `conic-gradient`, `mask`, `border-image`, and `color-mix()` are all weak/unsupported in html2canvas. The existing rings already use `conic-gradient`/`mask` and the share card tolerates it (degrades to base color) — acceptable, but **verify the worn render on a captured share card** when wiring lands, and keep a solid-color fallback under every gradient.
- **`font-smooth`/`-webkit-font-smoothing:subpixel-antialiased` (P2):** `font-smooth` is non-standard/no-op; subpixel AA is ignored on most modern compositing. Harmless but cargo-cult — drop it.

---

## FINAL ORDERED IMPLEMENTATION PLAN

Sequence to `SHOP-ELEVATION-SPEC.md` (it's verified and already ranked). Preview CSS from these proposals is the **input to spec ranks 8–13**, not a replacement for ranks 1–7.

**Phase 1 — Wiring first (spec ranks 1–4). Ship-blocking. No preview polish until done.**
1. `router.js renderAvatar` — apply `playerRingClass(p)` + `position:relative`; suppress inline border when a ring class is present (spec rank 1).
2. `router.js getPlayerCardCss` fallback to `PRO_SHOP_CATALOG` + new `getPlayerCardClass()`; add the class in `router-activity-feed.js` (spec rank 2).
3. pc29 nameplate class + `.plate-stimp` CSS (spec rank 3).
4. pc42 `ring-founders-crest`, pc36 `title-tag-leather` preview branch + `members-detail.js` map (spec rank 4).

**Phase 2 — ONE harmonized preview system (consolidate the 5 proposals).** Single shared scale + token set:
- **Sizing ladder (one rule for all categories):** object previews **120px** (rings, markers — they're round, need the most detail), surface previews **72px** (nameplates, cards, flair — they're horizontal). Adopt **P1's 120px ring stage** and **P5's stage-on-felt pattern**, drop P4's competing 96px ring. This kills the P1/P4 contradiction.
- **One namespace:** `.shop-preview` base + `.shop-preview--ring / --plate / --card / --marker / --flair` modifiers + per-material classes keyed to the SAME ids the worn render uses (`.plate-locker-brass`, `.ring-gallery-rope`, etc.) so preview and worn share one CSS source of truth (spec rank 9's explicit instruction). Delete P2's `.shop-nameplate-{id}` AND P4's `.shop-nameplate-brass` — use the worn `.plate-*` classes for both.
- **One material recipe:** one `box-shadow` (inset highlight + drop) + one gradient + token colors. No `filter`, no `background-attachment:fixed`, no infinite animation except on the single Front-Table hero.
- **Typography:** Fraunces display name + IBM Plex Mono micro-label (P2/P3 got this right; apply uniformly). `--font-display` / `--font-mono` / `--font-ui` confirmed in base.css:160–162.

**Phase 3 — Per-category material (spec ranks 8–13), now that classes are shared:**
- Cards → spec rank 8 recipes (parchment dot-grid, member-guest double-brass + watermark, sunday chyron, sleeve kraft, trophy-room walnut). P3's previews are the best of the five — adopt, retokenized.
- Nameplates → spec rank 9 (brushed brass + screw heads, yardage kraft + contour, sunday board). P2's previews adopted, retokenized, merged onto worn `.plate-*`.
- Markers → spec ranks 12–13 SVG depth in `pbMarkerGlyph` + P5's 92px stage CSS (keep CSS, **discard P5's false "expose the global" edit and Edit 1's diagnosis**). Render at 56px glyph as P5 specs.
- Rings → spec ranks 14–15 art, on P1's 120px stage **minus the gleam pulse and the `__frame` fixed-attachment.**
- Flair → spec rank 6 (build preview + worn TOGETHER; flair is the one category with zero worn render — do not polish its preview alone). Discard P4's flair block.

**Tokens to use (all verified present in base.css):** `--cb-brass` `--cb-brass-2` `--cb-brass-3` `--cb-brass-deep` `--cb-brass-rgb` `--cb-felt` `--cb-paper` `--cb-ink` `--cb-ink-link` `--cb-mute-2/3` `--font-display/mono/ui` `--radius-lg`. `--cb-ink-rgb` exists; **`--cb-brass-3-rgb` is space-separated (`224 187 96`) not comma** — don't use it inside `rgb()` legacy syntax.

## What to verify in a member capture afterward (V1)
1. **Worn, not just sold:** equip a ring (pc01), a card (pc09), pc29 nameplate, pc42, pc36 → capture the **feed avatar + feed row + roster name**, confirm the ornament actually renders worn (this is the P9 fix; the previews are meaningless if this fails).
2. **Coherence:** one screenshot of the full shelf grid — confirm all five categories share the same stage scale, shadow depth, and Fraunces+Mono type. They should look like one shop.
3. **Restraint:** confirm no pulsing/gleaming on non-hero tiles; the page should feel quiet.
4. **Perf:** scroll the full catalog on a mobile viewport (iPhone + Pixel per the rubric) — confirm no scroll jank (the `background-attachment:fixed` cut is the main risk if it sneaks back in).
5. **Contrast/legibility:** name text on each material passes WCAG-AA (felt grounds with cream text, brass grounds with ink text) — per the #41 contrast marathon, V1-verify each color against its ACTUAL background.
6. **Truthfulness:** preview fidelity == worn fidelity for each item, side by side.

**Bottom line:** Proposals 1, 2, 3, 5 contain good preview CSS worth harvesting; **Proposal 4 should be discarded** (redundant + contradicts P1's sizing); **Proposal 5's diagnosis is factually false** (keep its CSS, drop its root-cause claim and the global-exposure edit). None of the five are shippable alone because they ignore the four worn-render P9 bugs that are the real "horrid." Drive the work from `SHOP-ELEVATION-SPEC.md`: wiring (ranks 1–4) first, then one harmonized 120px-object / 72px-surface preview system reusing the worn `.ring-*`/`.plate-*`/card classes, then per-category material — with the gleam pulse, `filter`s, fixed-attachment, and raw hex all removed.

Relevant files: `C:\Users\Zach\smoky-mountain-open\.claude\state\ui-audit-2026-06-11\SHOP-ELEVATION-SPEC.md` (authoritative ranked plan), `C:\Users\Zach\smoky-mountain-open\src\pages\shop.js` (lines 310–342 preview branches), `C:\Users\Zach\smoky-mountain-open\src\core\router.js` (renderAvatar ~338, getPlayerCardCss ~317, pbMarkerGlyph 412), `C:\Users\Zach\smoky-mountain-open\src\styles\components.css` (lines 4825–4877 ring/title/plate classes), `C:\Users\Zach\smoky-mountain-open\src\styles\base.css` (lines 59–195 tokens).