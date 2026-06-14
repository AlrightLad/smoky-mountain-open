# Cosmetics Overhaul — Discord-caliber rings + banners (Founder 2026-06-14 20:07)

> "these rings and cosmetics suck really bad we need a full overhaul on them and
> reference other apps that have the profile banners and rings like Discord"

The v8.25.167-168 re-theme was rename+recolour only — the rings are still plain
`Npx solid #color` CSS borders. That is the "nothing new." This spec is the real
visual overhaul, grounded in the Discord reference the Founder named.

## Discord reference (researched 2026-06-14)
- **Avatar decorations** = a cosmetic frame that sits **around + behind** the avatar,
  *larger than the avatar circle and overlapping its edge*, so it FRAMES without
  covering the face ([[feedback_rings_frame_not_cover_photo]] — same rule). Higher-
  quality animations + effects; many distinct styles. The avatar renders ON TOP.
- **Profile banners** = rich 600×240 (5:2) image/gradient behind the profile header;
  the avatar overlaps the bottom-left, so keep that quadrant clear.
- **Profile effects** (separate tier) = animated effects over the whole profile card.
- Sources: support.discord.com Avatar-Decorations FAQ; picturesizes.com Discord specs.

## The architecture change (why this is a real rebuild, not a re-theme)
Today: `playerRingClass` (router.js) maps a few ids → animated `border-color`/`box-shadow`
classes; most rings are just the avatar's CSS `border`. That can never read as a
Discord decoration (a border is inside the circle; a decoration is a frame outside it).

REBUILD:
1. **Decoration layer** — add an absolutely-positioned overlay element wrapping the
   avatar (~118-130% of avatar size), z-above the photo, `pointer-events:none`. The
   photo keeps `overflow:hidden;border-radius:50%`; the decoration frames it. This is
   the Discord model and it structurally guarantees the face is never covered.
2. **Decoration designs** (rubber-hose × H&B identity), tiered:
   - bronze/silver/gold *struck-metal laurel frames* (SVG ring of laurel + brass studs)
   - *claret pennant arc* / *flagstick crown* (a small golf flag at the top of the frame)
   - animated tiers: *Fairway Pulse* (soft green breathing glow halo), *Sunday Ember*
     (claret ember shimmer), *Major Season* (slow gold→green→claret sweep), *Diamond*
     (specular sweep). Built as SVG + CSS keyframes (scales crisply at every avatar
     size; themable) — OR generated decoration PNGs if SVG can't hit the bar.
3. **Profile banners** — upgrade the gradient banners to richer illustrated/gradient
   art at 5:2; the profile felt-hero already reserves the header — render the banner
   behind it, avatar overlapping bottom-left per Discord.
4. **Shop preview + worn-render** — the catalog preview shows the decoration around a
   sample avatar (not a colour swatch); worn-render applies it on profile + in-play +
   feed + leaderboard wherever `renderAvatar` is used.

## Execution discipline (HIGH-STAKES — avatars render everywhere)
- `renderAvatar`/`getAvatar` (router.js) is used on ~every page. A bug breaks avatars
  app-wide. Build behind a new decoration path that NO-OPs when no decoration equipped
  (so existing avatars are byte-identical until a decoration is equipped). TDD-ish:
  verify the no-decoration path is unchanged FIRST, then layer decorations in.
- V1 on REAL avatars at multiple sizes (40px feed, 104px profile) — frame must scale +
  never cover the face ([[feedback_avatar_photo_fit_review]]).
- Ship per-tier; Founder taste sign-off (AMD-028); reference Discord side-by-side.
- id-stable: keep existing ring ids; the decoration is an upgraded RENDER of the same
  owned item, so nobody loses what they bought.

## Sequence
1. Decoration render layer + the no-op-safe path (verify avatars unchanged).
2. 3-4 flagship decorations (one static struck-brass laurel + one animated) as proof.
3. Founder taste read → scale to the full tier ladder.
4. Profile banner richness pass.
This is a multi-ship fresh-context effort — drive it carefully, not at session-tail depth.
