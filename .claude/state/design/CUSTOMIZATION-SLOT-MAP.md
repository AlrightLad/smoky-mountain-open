# PARBAUGHS — Customization Slot Map

> The Founder's HARD PREREQUISITE (2026-06-15) before building the NEW cosmetic
> types: *"author a CUSTOMIZATION SLOT MAP (every display surface + which cosmetic
> occupies it) so the two new types occupy DISTINCT slots that never overlap
> rings/nameplates/etc."* This is that map. Every existing slot, the visual REGION
> it owns, its render hook, and where it appears — then the two NEW slots (Club
> Crest, Bag Tag) placed in regions NO existing slot touches, with a collision
> matrix proving zero overlap.
>
> Source of truth: `equippedCosmetics.{key}` on the member doc + the render hooks
> in `src/core/router.js`. Verified 2026-06-15 from the live render code.

## The two render anchors
Cosmetics decorate one of two things: the **AVATAR** (a circle) or the
**PROFILE / round CARD** (a rectangle). Mapping by region within each prevents
collisions.

### Avatar regions (the circle, via renderAvatar)
```
        ┌─────────────┐
        │   [BORDER]   │  ← the RIM: ring CSS (playerRingClass) OR raster deco
        │  ┌───────┐   │     (playerDecoSrc). ONE slot owns the whole rim.
        │  │ photo │   │  ← the PHOTO (object-fit:cover; never covered)
        │  └───────┘   │
        └─────────────┘
   (a pendant hangs BELOW the rim on some decos — part of BORDER, not a new slot)
```

### Profile / name / card regions
```
 ┌───────────────────────────────────────────┐
 │  [BANNER] profile header background         │ ← getPlayerBannerCss (the hero bg)
 │     (avatar = [BORDER])                      │
 │     Name  [NAME effect]                      │ ← getPlayerNameClass (text shimmer/glow)
 │     ┌──[NAMEPLATE]──┐                         │ ← plate behind the name (_npCls / plate-*)
 │     │  Name on plate │                        │
 │     └────────────────┘                        │
 │     [TITLE] under the name                    │ ← equippedTitle + title-* material
 └───────────────────────────────────────────┘
 Round card (feed / rounds list):
 ┌───────────────────────────────────────────┐
 │ [CARD skin] background/border of the card    │ ← getPlayerCardClass / getPlayerCardCss
 │ ...score...           [FLAIR] effect on PB   │ ← feed-card animation (birdie-drop etc.)
 └───────────────────────────────────────────┘
 Live play / scorecard: [TEEMARKER/BALL] the marker glyph ← pbMarkerGlyph
```

## Existing slot inventory
| Slot key (`equippedCosmetics.…`) | Region owned | Render hook | Surfaces |
|---|---|---|---|
| `border` | avatar RIM (+ optional below-rim pendant) | `playerRingClass` (CSS ring) / `playerDecoSrc` (raster deco) | every avatar app-wide (feed, roster, members, profile hero, cards) |
| `name` | the NAME text itself (effect) | `getPlayerNameClass` | wherever `renderUsername` prints the name |
| `nameplate` | the PLATE behind/around the name | `_npCls` → `plate-*` | profile name block, shop preview |
| `title` (`equippedTitle`) | the line UNDER the name | `shopTitleSpanClass` → `title-*` | profile, feed author |
| `card` | the ROUND-CARD background/border | `getPlayerCardClass` / `getPlayerCardCss` → `card-skin-*` | feed round cards, rounds list |
| `banner` | the PROFILE HEADER background | `getPlayerBannerCss` | profile hero only |
| `teemarker` / `ball` | the MARKER glyph | `pbMarkerGlyph` | live-play hole header, scorecard |
| `flair` | a transient EFFECT on a feed card (PB/milestone) | feed-card flair class | feed cards on a qualifying event |
| `voice` | NON-VISUAL (caddie voice line) | caddie-voice picker | Settings + AI ribs (no visual region) |

## NEW slots — placed in regions NO existing slot touches
Founder approved BOTH, with the hard "no collision" constraint. Build **Crest first**.

### `crest` — Club Crest (brass + hard-enamel heraldic monogram)
- **Region:** a SMALL standalone CREST MEDALLION, NOT on the avatar rim, NOT the
  header bg, NOT behind the name. New spots:
  1. **Profile:** a dedicated crest spot in the masthead corner (e.g. top-right of
     the `.pf-hero`, opposite the avatar) — a ~44px medallion. Distinct from
     `banner` (full bg), `border` (avatar rim), `nameplate` (behind name).
  2. **Scorecard:** a faint WATERMARK behind the hole grid (a new surface — the
     scorecard carries no other cosmetic).
  3. **Share card:** a WATERMARK/seal on the generated share image (growth lever;
     the share card carries only the avatar [border] + name — the crest takes the
     empty corner/footer). 
- **Key:** `equippedCosmetics.crest`. **Hook (to add):** `playerCrestSrc(p)` /
  `playerCrestClass(p)` returning the crest art for the 3 surfaces.
- **Collision check:** profile masthead-corner + scorecard-watermark + share-card-
  seal are all regions currently EMPTY. ✓ No overlap with border/banner/nameplate/
  title/card/marker/flair.

### `bagtag` — Bag Tag (hanging brass + leather tag)
- **Region:** a hanging TAG pendant off a CORNER of the PROFILE CARD (e.g. clipped
  to the top-right edge of the `.pf-hero` card, hanging down a few px) — like a real
  bag tag on a golf bag. NOT the header bg (`banner`), NOT the crest medallion spot
  (opposite corner), NOT the avatar.
- **Key:** `equippedCosmetics.bagtag`. **Hook (to add):** `playerBagTagSrc(p)`.
- **Collision check:** the profile-card top-right hanging-pendant region is empty;
  put the `crest` medallion at top-LEFT-of-name (or masthead corner) and the bag tag
  at the card's top-right edge so the two new slots also don't collide with EACH OTHER. ✓

## Collision matrix (region × slot — exactly one slot per region)
| Region | Owning slot |
|---|---|
| avatar rim | `border` |
| avatar photo | (none — never covered) |
| name text | `name` |
| plate behind name | `nameplate` |
| line under name | `title` |
| profile header bg | `banner` |
| profile masthead crest spot | **`crest`** (NEW) |
| profile card hanging corner | **`bagtag`** (NEW) |
| round-card bg/border | `card` |
| feed-card transient effect | `flair` |
| marker glyph | `teemarker`/`ball` |
| scorecard watermark | **`crest`** (NEW — was empty) |
| share-card seal | **`crest`** (NEW — was empty) |
→ No region is owned by two slots. Constraint satisfied.

## Build order (Founder: Crest FIRST)
1. **Crest:** add `equippedCosmetics.crest` + `playerCrestSrc/Class`; render at the
   3 surfaces (profile masthead corner, scorecard watermark, share-card seal). ART
   is brass + hard-enamel monogram (initials + a motif: crossed hickories / rose /
   claret pennant) — generator/Founder-taste-gated (≥9.5, AMD-028) via the
   parbaughs-brand-gate skill. The SLOT + render scaffolding is autonomous; the ART
   is the Founder-collaborative piece.
2. **Bag Tag:** add `equippedCosmetics.bagtag` + `playerBagTagSrc`; render at the
   profile-card hanging corner. ART = brass + leather tag (same gate).
Both new slots are shop SKUs (tier locker/proshop) priced in the brass/H&B band;
worn-render wired like the existing deco/nameplate slots.
