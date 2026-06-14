# Cosmetics Overhaul — research synthesis (6-app study, 2026-06-14)

Founder: "go full Discord extending-frame decorations... ALL frames and ALL shop items
need revamped + award-winning... web search other social apps for ideas, no copying."
Researched Discord, Reddit, Twitch, Snapchat/IG/BeReal, mobile games, sport-social.

## THREE-SLOT STACKED IDENTITY (build on what ships, don't rip out)
1. **RING slot** — ornament hugging the avatar (`equippedCosmetics.border` → playerRingClass).
2. **NAMEPLATE slot** — plate behind the member NAME that travels into leaderboard rows,
   chat, member list, settings bar. **Highest-leverage** (seen constantly w/o a profile
   visit). Currently under-wired — extend the `nameplate` cat into `renderUsername`.
3. **PROFILE-EFFECT slot** — card-level one-shot on profile-open (the `flair` cat).
Plus existing sub-slots: scorecard skin, ball/tee marker, title plate.

## RENDER MODEL (the award-winning leap)
- Stop relying on flat CSS pseudo-art for PREMIUM tiers. Each premium decoration =
  a **1.2×-oversized transparent PNG/APNG** (~256px ornament around an ~83% inner photo
  aperture), generated raster (Vertex Imagen, 1930s rubber-hose × H&B), processed locally,
  **committed under public/img/cosmetics/** (NEVER img/gen/ — that's gitignored; see the
  v8.25.171 broken-image bug). Positioned absolute over the avatar, **dead-center
  transparent so the face is never crossed** ([[feedback_rings_frame_not_cover_photo]]).
- Architecture note: current engine = ring class on an outer position:relative div, photo
  clipped by an inner overflow:hidden circle. VERIFY per surface (pf-av is overflow:hidden!)
  that the decoration layer sits on an overflow:visible element, restructure if needed
  (no-op-safe; V1 every surface). The struck-metal common rings (v8.25.170) are the right
  FLOOR — keep them for common tier.
- Animated pieces ship as a TWO-FILE PAIR: composed still PNG + APNG/Lottie loop; freeze
  to the still under prefers-reduced-motion (extend the existing per-ring keyframe gating
  to a body `.pb-reduce-motion` class). Heavy animation mounts ONLY on the profile page,
  never in dense lists; pause off-screen (mid-range Android PWA perf).

## RARITY = MATERIAL ESCALATION, not labels (Fortnite/Apex lesson)
- common = clean struck-metal hairline (the shipped ring-*-struck gradients).
- mid = enamel + bevel + soft drop-shadow lift.
- apex = engraved relief + ONE slow specular sweep (4-6s) + one inset gem/crest.
- NO "LEGENDARY" chips — let craft + the tier-shelf name carry it (Range Bucket → Pro
  Shop → Member's Locker → Champion's Cabinet already exist).

## TWO VISIBLE LANES, NEVER MIXED (the honesty rule)
- BOUGHT lane (ParCoin, priced) = glossy enamel/metal. Sold in the shop.
- EARNED lane (earnedBy:, NEVER priced) = matte struck relief + engraving. Shown in the
  Champion's Cabinet as locked-aspirational, never priced. So "earned it" vs "bought it"
  reads at a glance. Spend must never out-rank tenure visually (keeps it non-gambling).

## FLAGSHIP DECORATIONS (golf × rubber-hose × H&B — reinterpretations, NOT copies)
EARNED lane: 1) Laurel Ladder (tenure ring family: 3mo cream-enamel → 6mo bronze → 1yr
silver → 2yr+ engraved brass + claret crest); 3) Commissioner's Laurel (champion-only,
overrides default ring app-wide); 4) Green Jacket (shipped pc24 — elevate felt to raster
wool-weave); 5) Streak Signet Ring (tick-marks fill with posting streak: brass→claret-
enamel→guilloche); 8) Struck-Brass Bag Tags (≤3 earned feat-pins at 4/5/7 o'clock).
BOUGHT lane: 2) Club Pin (cloisonné rose-P crest, lvl-8); 10) Medallion (shipped pc53 —
elevate, lvl-6); 9) 19th-Hole Glow (toggleable standing aura: cream/brass/claret-pulse).
SEASONAL bundles: 11) Frost Delay (frosted ring + pennant + snow-drift effect); 12) Major
Season (azalea/claret). 6) Claret Pennant NAMEPLATE (cross-surface — the most-seen win:
felt pin-flag plate behind the name everywhere, 4s ripple, seasonal colorways).
7) Divot-Spray PROFILE EFFECT (rubber-hose phantom swing sprays turf on profile-open).

## BANNER DIRECTION (Discord-caliber)
Move premium banners off flat CSS gradients → raster MATERIAL grounds (felt billiard cloth
w/ nap, claret saddle-leather + stitching + brass grommet, cream linen + gold pinstripe,
walnut + engraved-brass plaque). ONE restrained motion per premium banner, profile-view
ONLY (divot-spray, pennant flutter, specular sweep, snow-drift), 4-6s, still+anim pair,
reduced-motion freezes. Coordinate banner+ring+nameplate+effect into named COLLECTIONS.

## SHOP REVAMP PRINCIPLES
- COLLECTIONS not one-offs: ring+nameplate+banner+effect drop together (Masters Week,
  Autumn Scotch, Frost Delay); bundle-discount only if you own none (Discord mechanic).
  Add a featured "Collections" shelf atop PRO_SHOP_SHELVES.
- MATERIAL DEPTH IS THE FLOOR, FLAT FILL BANNED: every priced item ≥ material gradient +
  bevel/rim-light + drop-shadow. Retire/re-skin remaining flat-#hex SKUs (border_birdie/
  ice/rose/flame) — no new flat ring ever ships.
- OWN-FOREVER + rotating featured shelf + seasonal retire/return (honest scarcity, NO
  gacha/loot-box/randomization — preserves ParCoin-not-gambling).
- Tenure/achievement gates the apex; spend buys variety (lvl gates retained).

## BUILD SEQUENCE (multi-ship)
1. Verify/establish the decoration overlay layer (overflow:visible outer + photo crop
   inner) — core-render, no-op-safe, V1 every avatar surface.
2. NAMEPLATE cross-surface wiring (highest-leverage, mostly CSS+renderUsername) — ship first.
3. Generate + commit flagship raster ring decorations (Club Pin, Medallion, Laurel tiers)
   under public/img/cosmetics/; wire as overlay layers.
4. Banner materialization (raster grounds).
5. Profile-effect (divot-spray) one-shot.
6. Shop reorg into Collections + retire flat SKUs + 2-lane visual split.
7. Per-step V1 + Founder taste sign-off (AMD-028).
Full per-app findings: see the workflow output (temp) — key points captured here.
