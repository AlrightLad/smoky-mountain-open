# Parbaughs — OSM Course-Data Pipeline Evaluation

**Status:** Final (Draft 3). For Zach's review.
**Captured:** 2026-04-22 (Wednesday evening strategic session, final rewrite).
**Supersedes:** Draft 2 (earlier 2026-04-22 session).
**Author:** Claude (CTO role) with Zach (Founder) review.
**Purpose:** Evaluate and scope the OpenStreetMap-based course-data pipeline, including baseline map features (free tier) and advanced course features (PRO tier). Companion doc to subscription-scoping.md.

---

## Executive summary and recommendation

**Recommendation: Full-go. Ship a complete OSM course-data pipeline. Baseline features (course maps, GPS distance-to-green, hazard distances, static hole preview) are CORE tier / free for all users. Advanced features (front/back green distances, elevation-adjusted Plays Like Distances, wind-adjusted distances, animated hole preview flyovers, distance arcs) are PRO tier ($6/mo).**

This tier split reflects two strategic decisions made in the Wednesday evening session:

1. **CORE must beat 18Birdies free tier** so new users don't bounce on day 1. 18Birdies free gives distance to center of green; Parbaughs CORE adds hazard distances as a concrete advantage.

2. **PRO must match 18Birdies paid tier** on course data so there's no feature-based reason to choose a competitor. Zach's stated position: *"I want to be what the competition is AND THEN SOME so there is no argument as to why users don't feel comfortable switching over."*

The net: CORE is strictly better than 18Birdies free, PRO matches 18Birdies paid on course data + adds commissioner capability + AI Scorecard Parser, ULTRA adds AI Swing Analyzer. Parbaughs never has a feature gap with competitors at equivalent price points.

Three findings drive the recommendation:

1. **Baseline user expectations for 2026 golf apps include map + GPS distances + hazard awareness.** Free users expect to see their course with real-time location. Parbaughs without this reads as incomplete on day 1.

2. **Course data as differentiator is a losing strategic battle, but course data as tiered feature is achievable.** Parbaughs won't beat 18Birdies on data depth of rare courses, but Parbaughs can meet 18Birdies paid tier at a lower price point on the data that matters.

3. **The paid-tier value prop lives elsewhere.** AI Scorecard Parser at PRO, AI Swing Analyzer at ULTRA, and commissioner capability at PRO are what justify the subscription. Course data is part of the package, not the entire pitch.

The detailed reasoning follows.

---

## Section 1 — What OSM actually contains for golf

### 1.1 The tag taxonomy

OSM's golf schema is well-documented. Key elements:

- `leisure=golf_course` — outer boundary of a facility
- `golf=hole` — line (way), standard playing path from tee to green, node count = par - 1
- `golf=fairway` — polygon, mown area between tee and green
- `golf=green` — polygon, putting surface
- `golf=tee` — polygon or node, teeing area (often multiple per hole for different tee boxes)
- `golf=bunker` — polygon, sand traps
- `golf=rough` — polygon, unmanaged grass
- `golf=pin` — node, flag location (rarely mapped; pins move daily)
- `golf:par`, `golf:handicap`, `golf:par:men`, `golf:par:women` — attribute tags on `golf=hole` way

### 1.2 What OSM delivers at best

For a fully-mapped course:
- Course outline (polygon)
- 18 hole paths (center-line per hole)
- Per-hole par
- Green polygons (approximate distance-to-green target)
- Fairway polygons
- Bunker locations and shapes
- Tee polygons

### 1.3 What OSM does NOT provide

Even at best case:
- Actual pin positions (they move daily; nobody maps them reliably)
- Hole-by-hole yardage per tee color (Blue vs White length)
- Elevation / slope data at high resolution
- Hazard carry distances (requires tee-to-hazard calculation)
- Course rating / slope (USGA numbers for handicap math)
- Wind patterns, prevailing direction

These gaps are filled by other sources (see Section 3.3).

### 1.4 The coverage reality

Per Taginfo US-specific data (early 2026):
- **~16,000 courses exist in the US** per National Golf Foundation
- **~10,000–12,000 courses** have a `leisure=golf_course` outline in OSM
- **~1,500–2,000 courses** have detailed hole geometry
- **<500 courses** have commercial-grade completeness

**85% of US courses have NO hole-level OSM data.** Parbaughs handles this with graceful fallbacks, multi-source supplementation, and commissioner-driven corrections.

### 1.5 Commercial alternatives for comparison

- **18Birdies:** 43,000+ courses worldwide
- **GolfShot:** 45,000+ courses
- **GolfPad:** 40,000+ courses
- **golfapi.io:** 42,000+ courses with scorecards, tees, slope/rating, green coordinates (paid)
- **Golfbert, SportsFirst, Golfintelligence:** paid API providers

### 1.6 The multi-source strategy

Parbaughs does NOT rely on OSM alone:

- **GolfCourseAPI.com (existing)** — baseline scorecard data (par, yardage, slope, rating). Free, 30,000+ courses.
- **OSM via Overpass** — geographic data (course outlines, hole paths, green polygons, bunkers). Free.
- **AI Scorecard Parser (PRO)** — commissioner-sourced authoritative data from scorecard photos.
- **Community corrections (free)** — crowd-verified accuracy layer over all sources.
- **Derived calculations** — Parbaughs computes distances, Plays Like, elevation from geometry + GPS + open elevation data.

---

## Section 2 — Overpass API access

### 2.1 What Overpass is

Read-only query service for OSM data. You send a query (e.g., "give me all golf holes within this bounding box"), it returns JSON/XML with tagged geometries. Standard way to consume OSM data beyond simple map tiles.

### 2.2 Public Overpass — rate limits and suitability

Public endpoints (overpass-api.de, overpass.private.coffee, overpass.kumi.systems) are free but rate-limited:
- ~10,000 requests/day per IP
- Automatic load shedding during heavy use
- HTTP 429 on rate-limit exceeded
- 15-second request queue before rejection
- 180s timeout per query, 512 MiB memory per query

**Adequate for launch.** Single round = ~10 requests. Aggressive caching keeps daily queries well under cap even at 1,000 concurrent users.

No SLA. Historical downtime ~hours during maintenance. Mitigated via aggressive Firestore caching — first time any league plays Course X, Cloud Function queries Overpass, parses, stores in `courses_geo/{courseId}`. Subsequent rounds read cache. Course geometry changes rarely (new bunker ~once/year), so 30-90 day TTL fine.

### 2.3 Self-hosted Overpass — when needed

If Parbaughs outgrows public Overpass:
- Install on VM (AWS EC2, DigitalOcean, Hetzner)
- Download planet.osm (~130 GB compressed, ~1.5 TB uncompressed)
- Index (~24 hours)
- Apply hourly diffs

Cost: ~$40-$100/month. **Not needed at launch, not needed year 1. Re-evaluate at 10,000+ active users.**

### 2.4 Commercial use under ODbL

OSM data is ODbL-licensed. Parbaughs can:
- Use data in commercial product (paid subscription app: yes)
- Display OSM-derived maps
- Cache data in own database

Parbaughs must:
- Attribute OSM on every map screen ("© OpenStreetMap contributors")
- If distributing derivative databases (not Parbaughs' case), release under ODbL

No licensing blocker.

---

## Section 3 — The build (15 weeks total)

### 3.1 Baseline pipeline (Weeks 20-26, 7 weeks total)

v8.6.x ships as **CORE tier features — free for all users.**

**Core geometry ingestion:**
- Cloud Function `fetchCourseGeometry` queries Overpass for any course by name + location
- GeoJSON FeatureCollection cached in Firestore `courses_geo/{courseId}` with 30-day TTL
- Client map module renders course outline, hole paths, green polygons, bunkers via MapLibre GL JS (free, no API key)

**GPS integration:**
- Capacitor Geolocation plugin for iOS + Android
- Background location permission flow
- Real-time GPS smoothing
- User position overlay on course map

**Distance-to-center-of-green calculation:**
- From user GPS position to green polygon centroid
- Updated continuously during round
- Target accuracy: 5-10 yards (18Birdies free tier parity)

**Hazard distances (CORE feature — beats 18Birdies free):**
- Water hazards, bunkers, OB markers rendered on map
- Distance from user position to each hazard displayed as labels
- No "carry distance" calculation (that's PRO)
- Just: "water at 185y", "bunker at 220y"

**Privacy + permissions:**
- iOS "while using app" location permission flow
- Android equivalent
- Privacy policy updates covering location data
- Battery optimization (GPS batched ~5-second intervals during rounds)

**Empty state handling:**
- 85% of US courses lack detailed OSM data
- Show course outline + "Course map coming soon" for missing detail
- Allow manual course-outline correction via commissioner
- Graceful degradation when Overpass unavailable

**Task breakdown (Weeks 20-26):**

| Component | Time |
|---|---|
| Thin OSM pipeline (course outline + hole paths) | 1 week |
| GPS integration + distance-to-green calc | 2 weeks |
| Hazard distance rendering + labels (CORE feature) | 1 week |
| Battery optimization for GPS during round | 1 week |
| iOS + Android location permission UX | 0.5 week |
| Privacy policy + location data compliance | 0.5 week |
| Empty states + fallbacks for OSM gaps | 0.5 week |
| Testing with real GPS on 5-10 PA courses | 0.5 week |

### 3.2 Advanced features (Weeks 27-34, 8 weeks total)

v8.7.x ships as **PRO tier features — $6/mo subscription gated.**

**Precision green distances:**
- Front of green distance
- Middle of green distance (available at CORE; re-used here)
- Back of green distance
- Calculated from user GPS position to polygon edges

**Elevation-adjusted yardages:**
- Integration with open elevation data (USGS 1-meter DEM for US; open global elevation as fallback)
- "Plays Like Distance" calculation factoring uphill/downhill
- Per-hole elevation delta cached in `courses_elevation/{courseId}`

**Wind-adjusted distances:**
- Real-time wind data from NOAA or similar free weather API
- Wind-adjusted carry/target distances
- Cached 30 minutes per course location

**Hazard carry distances (PRO upgrade over CORE):**
- "210 to carry the water" (not just "water at 185y")
- Layup vs go-for-it reasoning
- Calculated from user position through hazard to safe zone

**Hole preview flyovers:**
- Animated camera sweep from tee to green on hole selection
- Static overhead view fallback (which CORE users get)
- Bunker, water, tree visualization

**Distance arcs overlay:**
- Rings at 100, 150, 200 yards from user position
- Club recommendation (static table at launch, AI-enhanced potentially via swing-coach.js in v9.x)

**Task breakdown (Weeks 27-34):**

| Component | Time |
|---|---|
| Front/back green distance calculation | 1 week |
| Hazard carry distance calculation (PRO upgrade) | 1 week |
| Elevation data integration (USGS DEM + open global) | 2 weeks |
| Plays Like Distance calculation + display | 1 week |
| Weather/wind API integration | 1 week |
| Wind-adjusted distance calculation + display | 1 week |
| Animated hole preview flyover rendering | 1 week |

### 3.3 Multi-source hybrid architecture — locked

The complete course-data picture:

- **GolfCourseAPI.com** = scorecard data (par, yardage per tee, slope, rating) — drives scoring and handicap
- **OSM via Overpass** = geographic data (course outline, hole paths, green polygons, bunkers) — drives map rendering
- **AI Scorecard Parser (PRO)** = authoritative commissioner-sourced corrections
- **Community corrections** = crowd-verified accuracy layer
- **Derived calculations** = distances, Plays Like, elevation adjustments — computed from other sources

These are complementary. No single source provides everything; combined they match or exceed competitor offerings.

### 3.4 No commissioner-traced overlays at launch

Design spec proposed commissioner-editing tools for course geometry. **Out of scope for v1.**

At 20 users, commissioner tracing is a hobby project. At 10,000 commissioners, it becomes valuable collaborative mapping. Ship post-launch when the scale exists.

---

## Section 4 — Strategic positioning

### 4.1 Zach's stated moat revisited

Original Draft 1 framing: *"Parbaughs' moat is crew and community, not data accuracy."*

**Revised framing (Wednesday evening):** Parbaughs meets baseline data expectations so users have no reason NOT to try it, then wins on the social + AI layer. Course data is table stakes; social + AI features are the differentiators.

### 4.2 User-facing framing

When a user opens Parbaughs on their phone at Heritage Hills:

**Scorecard tab** (primary, 90% of user time):
- Driven by GolfCourseAPI data + community corrections
- Works regardless of OSM coverage
- Scoring, handicap, stats

**Map tab** (secondary, mid-round reference):
- OSM-sourced course geometry
- Real-time GPS position
- Distance to green (CORE)
- Hazard distances (CORE)
- Front/back green distances (PRO)
- Elevation-adjusted distances (PRO)
- Wind-adjusted distances (PRO)
- Hole preview flyovers (PRO)

### 4.3 Subscription pitch DOES NOT lead with course data

Subscription value proposition at launch:
- **PRO tier ($6/mo):** Commissioner capability + AI Scorecard Parser + advanced course features
- **ULTRA tier ($9/mo):** PRO + AI Swing Analyzer

Course features are part of the PRO package but not the headline. The headline is commissioner capability + AI Scorecard Parser. Course features are "oh and you also get better yardages" — nice but not the pitch.

### 4.4 Competitive positioning

**At download (App Store / Play Store):**
"The social golf app with AI that knows your game. All the baseline maps + hazards free. Host your crew, analyze your swing."

**At first-time use:**
Full CORE feature set visible. No "upgrade to see map" popups. Course map + hazards work immediately.

**At commissioner gate (creating a league):**
"Host your crew on Parbaughs. $6/month. First week free."

**At ULTRA upgrade moment (opening Swing Analyzer):**
"Analyze your swing with MediaPipe AI. $9/month."

Subscription prompts appear at specific moments tied to specific value.

### 4.5 Competitive feature matrix

| Feature | Parbaughs CORE | 18Birdies Free | Parbaughs PRO | 18Birdies Paid |
|---|---|---|---|---|
| Course maps | ✅ | ✅ | ✅ | ✅ |
| Distance to center of green | ✅ | ✅ | ✅ | ✅ |
| **Hazard distance labels** | ✅ | ❌ | ✅ | ✅ |
| Front/back green distances | ❌ | ❌ | ✅ | ✅ |
| Elevation-adjusted (Plays Like) | ❌ | ❌ | ✅ | ✅ |
| Wind-adjusted | ❌ | ❌ | ✅ | ✅ |
| Hole preview flyovers | Static | Static | Animated | Animated |
| Hazard carry distances | ❌ | ❌ | ✅ | ✅ |
| Distance arcs overlay | ❌ | ❌ | ✅ | ✅ |
| **Commissioner capability** | ❌ | ❌ | ✅ | ❌ |
| **AI Scorecard Parser** | ❌ | ❌ | ✅ | ❌ |
| Monthly price | Free | Free | $6 | ~$5.83 (annual) |

**Parbaughs CORE beats 18Birdies free** (hazard distance labels). **Parbaughs PRO matches 18Birdies paid on course data** + adds commissioner capability and AI Scorecard Parser at similar price point. Clean competitive ladder.

---

## Section 5 — Risks and mitigations

### 5.1 Risk: OSM data is wrong for a course

Mitigation:
- Subtle attribution so users understand source
- Trust-first correction system applies to geometry as well as scorecards
- Commissioner can report issues with link to OSM
- Cache invalidation on correction
- Never block scoring on OSM data correctness

### 5.2 Risk: Public Overpass goes down

Mitigation:
- Aggressive Firestore caching means historical rounds work even if Overpass down
- Display clear offline state if live query fails
- Don't treat Overpass uptime as launch dependency

### 5.3 Risk: 85% of US courses lack hole-level OSM detail

The big one. Most courses Parbaughs users play show course outline only, not detailed hole geometry.

Mitigation:
- AI Scorecard Parser (PRO) populates course records from photos — can seed detailed geometry where OSM lacks
- Community corrections fill gaps over time
- Commissioner can upload course map assets where OSM absent
- Clear empty states: "Detailed map not available for this course. Scoring, stats, and distance-to-green still work."
- Post-launch feature roadmap includes commissioner-traced overlays

### 5.4 Risk: GPS accuracy on Android

Android GPS quality varies across manufacturers. Cheap devices: 20+ yard accuracy. Flagship: 2-5 yard accuracy.

Mitigation:
- Target 5-10 yard accuracy as baseline
- Display uncertainty indicator when GPS signal weak
- Allow manual location tap on map if GPS drifting
- Multi-band GPS tuning deferred to v9.x

### 5.5 Risk: Battery drain from continuous GPS

Mitigation:
- GPS samples batched at ~5-second intervals during active scoring
- GPS off between holes when walking/cart-driving
- Aggressive caching of last-known position
- User-controllable "battery saver mode"

### 5.6 Risk: Apple App Store reviewer questions data sources

Unlikely. OSM widely used.

Mitigation:
- Conspicuous attribution on every map screen
- Link to OSM on About page
- "Data sources" section in Privacy Policy

### 5.7 Risk: OSM community objects to commercial use

Mitigation:
- Conspicuous attribution on every map screen
- "Edit on OSM" link for commissioners improving their home course (contributes back to commons)
- Consider pushing commissioner-traced overlay edits back to OSM in v9.x

### 5.8 Risk: Weather/elevation API costs unexpected

At launch scale, NOAA weather and USGS DEM are free. If paid provider needed:

Mitigation:
- Budget line item for weather/elevation APIs (~$50/month at 1,000 users)
- Cache aggressively (30-min weather TTL, permanent elevation TTL since elevation doesn't change)
- Fall back to cached data if API quota exhausted

---

## Section 6 — Implementation sketch

Not a complete build spec — Agent 3's job — but enough structure to show the work is scoped.

### 6.1 Cloud Functions

**`fetchCourseGeometry`** (Week 20 ship)
- Input: courseName, lat/lng, radius
- Output: GeoJSON FeatureCollection with course outline, hole paths, green polygons, bunkers
- Caching: Firestore `courses_geo/{courseId}` with 30-day TTL
- Error handling: graceful fallback to empty state

**`calculateHoleDistances`** (Week 27 ship)
- Input: user position (lat/lng), courseId, holeNumber
- Output: { green_center, green_front, green_back, hazards: [...], plays_like, wind_adjusted }
- Computes from cached course geometry + real-time user position
- Returns distances in yards
- Tier-gated: CORE gets green_center + hazards; PRO gets full result

**`fetchElevationAdjustment`** (Week 29 ship)
- Input: lat/lng path (tee to green)
- Output: elevation delta, Plays Like factor
- Integrates USGS DEM API for US, fallback to open global elevation
- Cached per hole

**`fetchWindData`** (Week 30 ship)
- Input: lat/lng, timestamp
- Output: wind speed, direction
- Integrates NOAA or similar free weather API
- Cached 30 minutes

### 6.2 Client-side modules

**`course-map.js`** (Week 20)
- MapLibre GL JS renderer
- Course outline, hole paths, greens, bunkers
- User position overlay from GPS

**`distance-overlay.js`** (Week 22 for CORE, Week 27 for PRO)
- CORE: distance to center of green + hazard distance labels
- PRO: front/middle/back green, hazard carry, distance arc rings, Plays Like, wind

**`hole-preview.jsx`** (Week 33)
- PRO-gated animated camera sweep from tee to green
- Static overhead view fallback (CORE)

### 6.3 Firestore schema additions

```
courses_geo/{courseId}:
  osm_geojson: FeatureCollection
  source: 'osm' | 'manual' | 'photo_parse'
  fetchedAt: Timestamp
  sourceUrl: string
  corrections: subcollection with correction history

courses_elevation/{courseId}:
  hole_elevations: [{ hole: 1, tee_elev: 450, green_elev: 435, delta: -15, plays_like_factor: 0.96 }]
  source: 'usgs' | 'open_global'
  fetchedAt: Timestamp
```

No impact on existing collections.

### 6.4 UI additions

- New "Map" sub-tab on scorecard (Week 20)
- CORE: map with position + distance-to-center-of-green + hazard distances (Week 22)
- PRO: "Advanced" toggle on map tab showing front/back + Plays Like + wind + arcs (Week 27-30)
- PRO: "Hole Preview" button per hole (Week 33)
- New About page section: "Data sources"
- Attribution footer on map: "© OpenStreetMap contributors"

### 6.5 Total effort estimate

| Phase | Duration | Ships |
|---|---|---|
| Week 20 | 1 week | v8.6.0 — Thin pipeline, course outline rendering |
| Weeks 21-22 | 2 weeks | v8.6.1 — GPS integration + distance-to-center-of-green |
| Week 23 | 1 week | v8.6.2 — Hazard distance labels (CORE feature) |
| Week 24 | 1 week | v8.6.3 — Battery optimization |
| Week 25 | 1 week | v8.6.4 — Permission flows + privacy |
| Week 26 | 1 week | v8.6.5 — Empty states + real-world testing |
| Week 27 | 1 week | v8.7.0 — Front/back green + hazard carry (PRO) |
| Week 28 | 1 week | v8.7.1 — Distance arcs overlay (PRO) |
| Weeks 29-30 | 2 weeks | v8.7.2 — Elevation + Plays Like (PRO) |
| Week 31 | 1 week | v8.7.3 — Weather/wind integration (PRO) |
| Week 32 | 1 week | v8.7.4 — Wind-adjusted distances (PRO) |
| Weeks 33-34 | 2 weeks | v8.7.5 — Hole preview flyovers (PRO) |
| **Total** | **15 weeks** | **v8.6.x through v8.7.5** |

---

## Section 7 — Decision

### 7.1 What's locked

**LOCK:** Full OSM pipeline with CORE tier baseline (beats 18Birdies free) + PRO tier advanced features (matches 18Birdies paid).

**LOCK:** 15-week build (Weeks 20-34 of 44-week launch timeline).

**LOCK:** Multi-source hybrid architecture. OSM for geometry, GolfCourseAPI for scorecards, AI Scorecard Parser for authoritative corrections, community for accuracy.

**LOCK:** Public Overpass at launch with aggressive Firestore caching. No self-hosted Overpass.

**LOCK:** Target 5-10 yard GPS accuracy at launch. Multi-band precision tuning deferred to v9.x.

**LOCK:** No commissioner-traced course overlays at launch.

**LOCK:** CORE tier includes: course maps, distance to center of green, hazard distance labels, static hole preview.

**LOCK:** PRO tier adds: front/back green distances, hazard carry distances, Plays Like Distances (elevation-adjusted), wind-adjusted distances, distance arcs overlay, animated hole preview flyovers.

**LOCK:** ULTRA tier adds no additional course data features over PRO (ULTRA's differentiator is AI Swing Analyzer, not more course data).

### 7.2 What's deferred to v9.x

- Self-hosted Overpass infrastructure (re-evaluate at 10K+ DAU)
- Commissioner-traced course overlay editor (re-evaluate at 1K+ commissioners)
- Multi-band GPS precision tuning (2-5 yard accuracy vs baseline 5-10)
- Contribution back to OSM from commissioner corrections
- 3D terrain models / AR hole preview
- Shot tracking integration with course geometry
- Course data supplementation from paid API providers

### 7.3 Alignment with subscription-scoping.md

Course data splits across CORE and PRO tiers per strategic decisions:
- CORE baseline course data removes competitive objections from free users
- PRO advanced course data matches 18Birdies paid at a similar price point
- ULTRA does NOT add course data features — swing analysis is ULTRA's differentiator

See subscription-scoping.md Section 1.3 for full strategic rationale.

---

## Section 8 — Open questions (parked)

- Should commissioners be able to manually correct OSM data for their home course? (Simple v1: link to OSM edit-on-openstreetmap.org flow. Commissioner-traced editor is v9.x.)
- How often to cache-invalidate OSM data? (30-day TTL at launch; adjust based on user reports.)
- Flag when OSM data seems suspicious (e.g., 18 holes missing geometry)? (Nice-to-have; v9.x.)
- Future Apple Watch / WearOS companion apps? (Out of scope for launch; probably yes eventually.)
- When to evaluate paid course-data API providers? (At ~200 active commissioners per subscription-scoping.md Section 5.9.)
- Commissioner-traced overlay edits contributed back to OSM? (v9.x consideration; aligns with OSM ethos.)
- Courses redesigned mid-year and OSM data lags? (Manual commissioner correction + cache invalidation; v9.x may add automated detection.)

---

## Section 9 — Living doc

Revisit this doc before:
- Shipping v8.6.0 (baseline pipeline start, Week 20)
- Shipping v8.7.0 (advanced features start, Week 27)
- Any commissioner or user reports course-data as a material blocker
- Scaling past 1,000 commissioners (commissioner-traced overlays worth considering)
- Scaling past 10,000 DAU (self-hosted Overpass worth considering)
- Post-launch 90-day review (first real data on course-data feature usage)

---

*End of doc.*
