# Animated course map + cosmetics-in-play — research + proposal (pick a lane)

**Your ask (2026-06-15):** an animated hole/course map shown during a round, with
the player's position moving on it, the equipped **ball-marker** cosmetic at the
player and the **tee-marker** cosmetic at the tee box — so buying those cosmetics
is enticing. Plus: *"research free slope/green-roll options + propose."*

**Bottom line up front:** the map is buildable **for free and on-brand**, but
**green slope / green-roll data does not exist for free** — every source that has
it is paid. My recommendation is **Lane A** (a stylized illustrated hole map from
free OpenStreetMap geometry), with **Lane C** (wire the cosmetics into live play
*now*, no map) as an immediate quick win we can ship this week while the map is
built. Slope/green-roll = a separate, optional, paid add-on you decide on later.

---

## What I researched (evidence)

**1. Hole geometry (fairway / green / tee / bunker outlines) — FREE via OpenStreetMap.**
OSM has a rich golf vocabulary (`golf=hole`, `golf=fairway`, `golf=green`,
`golf=tee`, `golf=bunker`, `golf=rough`, `golf=water_hazard`) — the actual shapes
of each hole, drawn by volunteers. You query it through the **Overpass API**,
which returns the polygons as JSON. License is ODbL (free; requires attribution +
share-alike on the geometry).
- **The catch:** coverage is volunteer-dependent. Big/famous courses are mapped
  in detail; small rural munis (some of our York-PA home courses) may be
  partially mapped or not at all. We handle that with a graceful fallback (below).
- **Rate limits:** the public Overpass servers are fair-use. At our scale we fetch
  a course's geometry **once**, cache it on `courses/{id}.geo` in Firestore (the
  exact pattern the crowdsourced green-edges already use), and never query again.

**2. Aerial / satellite photo backdrop — effectively PAID + off-brand.**
Mapbox Satellite and Esri World Imagery are the real options, but production /
commercial use is **paid** (Mapbox needs a commercial license for derived/commercial
use; Esri bills per tile or per session). OSM's own tile servers forbid bulk use
and aren't satellite anyway. Beyond cost, a raw satellite photo **fights our
illustrated brand** — the same lesson as the swing scene (illustrated > photo for
brand fit). So a photo backdrop is a no for both P4 (free-first) and brand.

**3. Green slope / contour / "green-roll" — NO free source exists.**
The only providers are **paid**: GolfIntelligence (3D slope maps, rendered
fall-lines; a free 200-credit *test* tier only), iGolf (green heat maps), GolfLogix.
There is no free slope/green-roll feed. Our free substitute for the green is what
we already ship: the **crowdsourced front/back green-edge pins** in `distance.js`
(v8.25.55). Full contour/slope would be a paid integration — a separate decision,
and frankly a pro-grade feature most casual leagues never use.

---

## The three lanes

### ▶ Lane A — Stylized illustrated hole map from OSM (RECOMMENDED)
On first view of a hole, Overpass-fetch the course's golf polygons → cache to
`courses/{id}.geo`. Render the hole **top-down as a clean illustrated vector** on
canvas/SVG using our Clubhouse tokens (fairway felt-green, green a darker shade,
bunkers sand, water blue, tee box) — the same hand as the rest of the app, NOT a
satellite photo. Overlay:
- the player's **live GPS dot** (read on-tap, transient, **never stored** — same
  privacy model as distance.js),
- the equipped **ball-marker cosmetic** drawn at the player position,
- the equipped **tee-marker cosmetic** at the tee box,
- distance-to-green (already computed by distance.js).
- **Fallback when a hole isn't in OSM:** show today's distance strip (what we have
  now) plus a quiet "this hole isn't mapped yet" note — never a broken/empty map.
- **Cost:** $0. **Brand:** cohesive illustrated. **Privacy:** clean. **Effort:**
  medium build (Overpass fetch + cache + a vector hole renderer + the overlay).

### ▶ Lane B — Satellite-photo hole map (NOT recommended)
Mapbox/Esri satellite backdrop + OSM overlay. Looks "real," but costs money at any
scale, adds licensing complexity, and is off-brand (photo vs illustrated). Only
worth revisiting if you specifically want the realistic-aerial look and accept a
paid map bill.

### ▶ Lane C — Cosmetics-in-play NOW, map later (immediate quick win)
Decouple the *cosmetic enticement* from the big map build: wire the equipped
ball-marker + tee-marker cosmetics into the **existing** live-play hole header /
distance strip right away (e.g. the tee-marker badges the hole's tee row, the
ball-marker rides the distance strip), so buying them pays off immediately. Then
build the Lane-A map as the richer payoff. This ships visible value this week.

---

## My recommendation
**Lane C now + Lane A next.** Ship cosmetics-in-play on the existing live-play
surface this week (quick, visible, makes the shop cosmetics matter), then build the
free illustrated OSM hole map (Lane A) as the showcase. **Skip slope/green-roll**
for now (no free source; revisit as a paid add-on only if you want pin-sheet-grade
green reads later).

**What I need from you:** just pick the lane(s). Default if you say nothing: I'll
start **Lane C** (cosmetics-in-play, no new data/cost, no risk) and prototype
**Lane A** against one mapped home course to prove OSM coverage before committing.

---

### Sources
- [OSM Tag:leisure=golf_course](https://wiki.openstreetmap.org/wiki/Tag:leisure=golf_course) · [Tag:golf=hole](https://wiki.openstreetmap.org/wiki/Tag:golf%3Dhole) · [Tag:golf=fairway](https://wiki.openstreetmap.org/wiki/Tag:golf%3Dfairway)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) · [Overpass by Example](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example)
- [Mapbox Satellite tilesets](https://docs.mapbox.com/data/tilesets/reference/mapbox-satellite/) · [Esri Leaflet basemaps](https://developers.arcgis.com/esri-leaflet/maps/) (paid usage models)
- Slope/green data (paid): [GolfIntelligence 3D green slope](https://golfintelligence.com/3d-green-slope-data/) · [iGolf green heat maps](https://igolf.com/solutions/golf-course-data/) · [GolfLogix map server](https://www.golflogix.com/page/map-licensing-inquiries/) · [Golfbert geodata](https://golfbert.com/)
- Free course/scorecard data we already use: [GolfCourseAPI](https://golfcourseapi.com/)
