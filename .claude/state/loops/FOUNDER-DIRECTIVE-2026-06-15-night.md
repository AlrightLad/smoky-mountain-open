# FOUNDER MEGA-DIRECTIVE — 2026-06-15 night (the governing brief for the loop)

Verbatim intent captured so it survives compaction. The Founder answered my HQ
blockers then said "let me loop." He is FRUSTRATED that I write code without
VISUAL verification, defer the actual design, under-use my tools (3 image gens +
web search + lab envs), stop the loop too early, and let backlog build for weeks.
**The process fix is non-negotiable: visual + regression + taste/branding E2E on
every change — not lint/code checks.** Use web research + image gen DEEPLY
(research rubber-hose golf art → brandify via gen, don't copy, don't churn slop).

## HQ / DESKTOP DECISIONS (locked this session)
- **Architecture:** SAME codebase, desktop DIVERGES. At desktop width the app
  becomes an immersive awwwards.com-level SHOWCASE; mobile stays the functional app.
- **Feel:** complete immersion, rubber-hose COUNTRY-CLUB CARTOON style, NOT muted,
  NOT black-and-white. A COMPLETELY different feel from the app — this is where we
  showcase art + sell merch + post app updates. Benchmark: awwwards.com winners.
- **Structure (brand-immersion first, top→bottom):** full-bleed ANIMATED hero
  (rubber-hose country-club scene) → ART-STYLE showcase (caddies/course art/motion)
  → MERCH storefront (tour + leisure lanes) → LIVE app updates/changelog →
  league/community teaser → JOIN / open-the-app CTA.
- Desktop must be FULL-WIDTH or hybrid with a massive overhaul to clear 9.5
  (the current centered-680px columns are NOT the answer for desktop).

## FOUNDATIONAL BUGS / ALIGNMENT (do FIRST — broken now, user-facing)
- **DECO/RING FLUSH-FIT (top frustration):** raster decorations (e.g. caddie
  companion) render the photo FLOATING in the middle of the frame instead of
  FILLING the hollow + sitting flush like Discord avatar decorations. The CSS
  ring flush-fix (v8.25.199) did NOT cover the raster decos. Photo must FILL the
  deco's hollow opening, frame hugs the photo edge.
- **NO ZOOM on mobile:** add viewport `maximum-scale=1, user-scalable=no` (Founder
  hypothesis: pinch/zoom is causing a lot of the alignment + scroll issues).
- **Pull-to-refresh:** app randomly refreshes when scrolling up to top; make it a
  deliberate pull-to-refresh (Twitter-style) clearly distinct from scroll-up.
- **CADDIE FLOAT** still wrong on Settings + Store (the will-change/clip issue) —
  proves I shipped code without checking the rendered result. FIX + VISUAL-VERIFY.
- **Calendar:** scheduled-rounds + range dots overflow off the page edge (sloppy).
- **Messages thread:** the message input bar + Send button are slightly cut off.
- **SVG nav icons** (Home/Play/Courses/Events/More) → level up to 9.5.

## BRAND IDENTITY (Founder: "extremely weak") + COSMETICS + MERCH
- Establish the rubber-hose country-club identity via RESEARCH (web-search real
  rubber-hose golfers/1930s art for inspiration) → brandify via image gen (don't
  copy). Lock it, then apply everywhere.
- **Rings/decorations:** REDESIGN all existing to ≥9.5 + flush-fit. (Still showing
  default-quality items on the Founder's phone at v8.25.206.)
- **P+rose mark:** must be re-styled RUBBER-HOSE (still a clean serif P).
- **Scorecards (shareable):** old colorway; cosmetics should SHINE here; hole-by-hole
  should be 9-on-top / 9-on-bottom (like the shareable card), NOT sideways-scroll.
  "By the numbers" duplicates the strokes-to-par/birdies/pars/bogeys/putts already
  above the hole-by-hole — consolidate it all INTO "by the numbers."
- **MERCH (page is confusing + unbranded + unrealistic AI slop):**
  - Photos must look like a REAL golfer + readable clothing articles; tour vs leisure
    lanes must be obvious. No obvious-AI artifacts (erodes trust).
  - Leather head covers SEPARATED by club type: Driver, fairway woods, hybrids,
    mallet putter, blade putter, 3-wood.
  - Yardage book = VERTICAL (like real pro yardage books).
  - Ball marker = tour-feel + on-brand (current not acceptable).
  - Parbaugh golf BALLS = rubber-hose logo ON the ball.
  - TEES = our branding on them.
  - "On the tee" photo = mimic a REAL golf swing (current is horrid vs other brands).
  - "First light first tee" + "made for the walk" photos = must show BRANDED clothing/
    gear we sell; right now you can't tell what merch is in them (pointless).
  - ADD: KIDS clothing (tees/hoodies w/ rubber-hose caddy/golf art = the youth brand);
    ADULT tour-branded clothing + leisure clothing w/ logo + rubber-hose art.
  - Merch + cosmetic store copy: "MR PARBAUGH will sound the horn" (NOT "the
    commissioner" — these pages are shared across all leagues).
- **Cosmetics in round-play (immersion):** ball marker = the icon shown on the
  animated hole map as the player moves; tee marker = shown at each tee box. Wire
  cosmetics INTO live round play (18/9/range) so buying them is enticing.

## UX / IA / CONTENT
- **Settings:** convoluted + overwhelming → consolidate, simplify.
- **More tab:** too many buttons/sections → consolidate; onboarding doesn't explain them.
- **Onboarding:** unacceptable — designs + the caddy art are "child's work"; rebuild
  to a real-app standard; explain the buttons/sections.
- **Bland vs overwhelming pages:** some pages have ~1 thing + no data + no animation
  (static) = boring; others are overwhelming. Add tasteful animation / animated pages;
  balance density.
- **Standings / league pages:** underwhelming — need a tour-level COMPETITIVE feel
  (Sunday-league trash-talk, not hyper-competitive, but tournament-oriented).
- **WHATS NEW = X.Y.Z changelog scheme:**
  - X = major version (massive lifts, feature additions)
  - Y = feature bug fixes + minor UI updates
  - Z = daily bugs + tailoring
  - Each Y bump adds a dated section (like the existing 8.23.0-style entries) with a
    short summary of what changed/improved since the last version. When an X bump
    happens, summarize that whole major version into one tab with a date-range +
    summary of the app's lifecycle for that version. Historical / progress-showcase.

## BACKEND / FEATURES (some pending days)
- **Resend email is set up + linked to the domain on Cloudflare** — but bug-reports
  + feature-requests are NOT wired to email like password resets are. WIRE THEM.
- **Location/GPS:** user location should update on sign-in + be statically tracked
  for yardage-from-hole. Founder Q: is there a FREE way for this + a slope/green-roll
  map? → RESEARCH + deliver a fully-visioned short+long-term proposal. Vision:
  ANIMATED golf-course hole maps — the player's ball-marker icon moves on the hole
  map relative to their real position as they play (already partially in 18/9); the
  tee marker shows at each tee box. This is store/immersion, not merch.
- **Community/notifications:** low notification volume (who's playing/posting/looking
  for tee times) is what stalls adoption — Founder asks if push/community is easier
  post-App-Store. (Note + plan; some gated on store.)

## TESTING MANDATE (the meta-fix)
Every change ships with VISUAL + regression + taste/branding evidence, not lint.
Build a visual-regression harness (composite avatars/decos/caddies on a REAL photo,
read, verify flush; capture each changed surface, read it, compare). Run a full
SERIES E2E (unblock + complete) — test user + real user, every function + button +
dropdown + game, screenshots as evidence, data integrity + cohesion.

## LOOP DISCIPLINE
Loop to near-perfection; don't stop early / don't need babysitting. Use web research
+ image gen + lab envs DEEPLY (the Founder has the same web access I do + expects me
to out-research). Reverse-engineer / learn from open-source + awwwards + successful
apps. Ultracode is ON — Workflows on substantive tasks, exhaustive over fast.

## SELF-SEQUENCED PHASE PLAN (loop order)
0. PROCESS: visual-regression harness (composite + read every avatar/deco/caddie).
1. FOUNDATIONAL BUGS (visual-verified): no-zoom viewport · deco/ring flush-fit ·
   caddie float (settings+store) · messages cutoff · calendar overflow ·
   pull-to-refresh · SVG nav icons → 9.5.
2. BACKEND quick win: Resend bug-report + feature-request email wiring.
3. BRAND IDENTITY (research→brandified gen): lock rubber-hose country-club look →
   rings/decorations redesign+flush · P+rose rubber-hose restyle · merch overhaul
   (all specifics above) · scorecard colorway+layout+cosmetics.
4. HQ DESKTOP immersive showcase (brand-immersion-first; awwwards-level).
5. UX/IA: settings consolidation · More declutter · onboarding rebuild · page
   animation · standings/league tournament feel · Whats-New X.Y.Z.
6. FEATURES: GPS/location + animated course-map + cosmetics-in-play (research+plan+build).
7. FULL SERIES E2E (visual + functional + branding evidence).
