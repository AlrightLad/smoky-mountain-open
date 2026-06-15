# Customization Slot Map — collision-free cosmetic architecture

> Authored 2026-06-15 for the brass/H&B cosmetic overhaul. The Founder's hard
> constraint on the two new types (Club Crest + Bag Tag) is **"thoroughly thought
> out, properly implemented, NO COLLISION with other customizations."** This map is
> the prerequisite: it enumerates every display surface, which cosmetic occupies it,
> and where the new types slot in WITHOUT overlapping anything.

## Existing slots (members/{uid}.equippedCosmetics.* + sibling fields)

| Slot key | Cosmetic type | Display surface(s) | Render entry |
|---|---|---|---|
| `border` | **Rings AND Decorations** (mutually exclusive — one `border` value) | The avatar RIM, everywhere an avatar shows | `renderAvatar`: `playerDecoSrc` (deco PNG) checked FIRST, else `playerRingClass` (CSS ring) |
| `nameplate` / `titleplate` | Nameplates | Behind the member NAME | `getPlayerCardClass` / `_npCls` plate classes |
| (`equippedTitle`) | Titles | UNDER the name (text) + shop chip materials | `renderUsername` text; shop `shopTitleSpanClass` |
| `card` | Scorecard skins | The round CARD background | `getPlayerCardClass` |
| `banner` | Banners | Profile HEADER strip | profile render |
| `ball` | Ball markers | On the green (marker glyph) | `pbMarkerGlyph` |
| `teemarker` | Tee markers | Beside the name / tee | `pbMarkerGlyph` |
| `name` | Name FX (text glow/gradient) | The name text itself | name css |
| (`theme`) | Themes (PL7b) | Whole-app palette | `applyTheme` |
| (`walkthrough.caddieVoice`) | Caddie | Voice + Settings portrait | caddie picker |

**Collision rule already in place:** rings + decorations cannot both show (shared
`border`). That's fine + intended (one avatar-rim treatment at a time). Every OTHER
slot is independent — a member can wear a ring + nameplate + title + card + banner +
ball + teemarker simultaneously with no overlap.

## New types — DISTINCT slots, zero overlap

### 1. Club Crest (build FIRST — growth lever)
- **New slot:** `equippedCosmetics.crest` (id of a built crest) — does NOT touch any
  existing slot.
- **Display surfaces (all NEW, none currently occupied by a cosmetic):**
  - Profile: a dedicated crest spot (e.g. beside the masthead handle) — NOT the
    avatar rim (that's `border`), NOT the header strip (that's `banner`).
  - Scorecard: a small watermark in a card CORNER — the `card` skin owns the
    background/texture; the crest is a discrete corner mark layered above, so it
    coexists with any card skin (verify z-order + that it never sits where the
    score text or card material reads).
  - SHARE CARD (`router-sharecard.js`): a corner crest — growth visibility.
- **Composition:** initials (from name) + a chosen motif (crossed clubs / rose /
  flag) in brass+enamel. Customizer UI = pick motif + (optional) enamel accent from
  the theme palette. Store the *config*, render deterministically (no raster needed —
  CSS/SVG crest), so it tracks theme + has no asset cost.
- **Collision check:** crest slot is new; its surfaces (profile crest spot, card
  corner, share-card corner) are unoccupied. ✅

### 2. Bag Tag (build SECOND)
- **New slot:** `equippedCosmetics.bagtag`.
- **Display surface (NEW):** hangs off a CORNER of the profile card (a brass+leather
  luggage tag on a stitched strap). NOT the banner (header), NOT the avatar rim.
  Single profile-card-corner anchor; ensure it doesn't overlap the crest spot (put
  crest near the handle/masthead, bag tag at the opposite card corner — define exact
  anchors in the build + V1 both-equipped to confirm no overlap).
- **Collision check:** new slot; new corner anchor. Must V1-verify crest + bag tag +
  banner all visible together with no overlap. ✅ (verify at build)

## Seasonal decorations + Archive (Founder 2026-06-15)
- Decorations stay on the `border` slot (shared with rings — unchanged).
- Add `season: {start, end, year}` to seasonal decoration SKUs → purchasable ONLY in
  the active window; outside it, render "Returns next <season>" (P10) and exclude from
  buy. After the window, the SKU is `archived:true` (still owned+equippable forever).
- **Archive surface:** a grid of past drops (name + season + year + "first dropped")
  so a new member who sees one worn can learn its provenance → FOMO + retention. The
  current 8 rubber-hose decos become the first archive entries.
- "Even mix of it all": seasonal drops span brass/H&B + rubber-hose character + themed
  styles (decorations are the ONE place rubber-hose character stays in the shop).

## Earned-free titles/cosmetics (Founder 2026-06-15)
- Free titles from achievements (many `getAchievements` entries already carry `title:`)
  + level milestones (Lv5/10/25/50/75/100) → render in the shop EARNED tier as
  "earned → Equip" (free), DERIVED from achievements (exploit-proof, same model as
  PL7/PL7b). No new slot — uses the existing title (`equippedTitle`) slot.
- Extend the earned-free model to other types where an achievement fits (a marker for
  an ace already exists as pc25; mirror for select achievements).

## Build order (collision-safe)
1. Earned-free titles (existing slot, no collision) + per-type 9.5 lifts.
2. Seasonal-decoration + Archive system (existing `border` slot + new Archive surface).
3. Club Crest (new `crest` slot + 3 new surfaces) — V1 with every other cosmetic equipped.
4. Bag Tag (new `bagtag` slot) — V1 with crest + banner + ring all on at once.
Each ships to staging → Founder ≥9.5 sign-off (AMD-028).
