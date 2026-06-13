---
status: open
severity: green
priority: MEDIUM
founder_action_required: true
gate: feature scope + product decision (planning only — no code written per Founder 2026-06-13)
execute_by: founder (decision), then agent (build) once greenlit
---
# Planning — "See yourself on the hole diagram/map" + yardage (no code yet)

**Founder ask (2026-06-13):** "Seeing yourself on hole diagram/map — if this
isn't possible or needs more, add it to the founder checklist and continue
without writing code, just do planning. OK to wrap yardage into this one."

This is a **product + scope decision** for you, not an engineering blocker.
Here's the honest feasibility map and the three ways we could do it, so you can
pick the lane before I build anything.

## What exists today
- Live scoring (`playnow`) tracks hole-by-hole strokes/putts, but there is **no
  hole map/diagram** surface — we render scorecards + stat tiles, not a graphical
  hole. Course/par data comes from GolfCourseAPI; it gives par/yardage/handicap
  per hole but **not hole shape geometry or tee/green GPS coordinates**.
- So "see yourself on the hole" needs (a) a hole graphic and (b) your position on it.

## The honest constraint
A true "blue dot on the hole, distance to the pin" (like GolfLogix / 18Birdies / Arccos)
requires **per-hole green + tee GPS coordinates** for every course. GolfCourseAPI
does **not** provide hole geometry/GPS. The mapping datasets that do (e.g. the ones
those apps license) are **paid + heavy** — that violates our zero-budget / OSS-first
rule and is a per-course data problem (our members play dozens of random courses).

## Three lanes (pick one)

**Lane A — "Distance to the pin" (GPS yardage, no hole art). LOW effort, high value.**
Use the phone's GPS + a single green-center coordinate per hole to show **"142 yds
to center"** while you play. No hole diagram needed. The blocker is the green-center
coordinate source. Cheapest path: let the member **drop the pin once** (stand on/near
the green, tap "set pin here") and we cache it on the course doc — crowdsourced, $0,
gets better as the league plays. This is the 80/20 of what golfers actually want
(distance), without licensing map data. **Recommended.**

**Lane B — Schematic hole diagram + your position (no real map). MEDIUM effort.**
Draw a stylized hole (tee box → dogleg fairway → green) from par + yardage (par 3/4/5
templates), and place a "you" marker proportionally along it based on shots taken /
GPS distance-to-green. It LOOKS like a hole map but is schematic, not satellite-true.
On-brand (we can draw it in the Clubhouse style). Risk: it's representative, not
accurate to the actual hole shape — could read as "fake" to a golfer who knows the hole.

**Lane C — Real satellite hole map + GPS dot. HIGH effort + cost. NOT recommended now.**
Licensed hole-geometry data or a maps SDK with per-hole overlays. Violates zero-budget,
heavy per-course data, ongoing cost. Defer unless we monetize enough to justify it.

## Yardage (wrapped in, per your note)
Yardage is the easy, high-value half and rides on **Lane A**: GolfCourseAPI already
gives **per-hole yardage** by tee, so we can show "Hole 4 · Par 4 · 410 yds (Blue)"
on the scorecard/playnow today with **no GPS at all** — that's a quick standalone win
even if you defer the live "distance to pin." Live distance-to-pin needs the GPS +
green-center coordinate (Lane A).

## My recommendation
1. **Now (small, $0):** show static per-hole yardage from GolfCourseAPI on the
   scorecard + playnow (no GPS). Pure win, no scope risk.
2. **Next (Lane A):** GPS "distance to green center" with a one-time crowdsourced
   pin-drop per hole. Real golfer value, $0, gets better with play.
3. **Defer:** the graphical hole diagram (Lane B schematic, or Lane C real map) until
   you decide it's worth the effort — Lane A delivers most of the value without it.

**Decision needed from you:** which lane(s) to greenlight. Once you pick, I build it.
No code written yet (per your instruction).

---

## ✅ FOUNDER DECISION (2026-06-13): Lane A — distance to pin, with FRONT/CENTER/BACK.
Greenlit: GPS "distance to the green," shown as **Front / Center / Back** (the classic
rangefinder read), not just center. Build approach:
- **Coordinates:** crowdsourced per hole, $0. The member taps "set the green" while
  standing on it and drops **front-edge + back-edge** pins (2 taps) → center = midpoint,
  and F/C/B distances are all exact. (Fallback if only one tap: center ± ~half a typical
  green depth.) Cached on the course doc, gets better as the league plays.
- **Live read:** during a `playnow` round, `navigator.geolocation` → Haversine to the
  three points → "Front 138 · Center 147 · Back 156" (yds). Permission-gated, graceful
  if GPS denied/unavailable (P10: explain, don't silently show 0).
- **Yardage (wrapped in):** static per-hole yardage from GolfCourseAPI shows regardless
  of GPS — a free win even without a green pin set.
- No graphical hole map (Lane B/C deferred) — distance is the value.
**Status:** ✅ BUILT + LIVE on prod (v8.25.55, 2026-06-13). `src/core/distance.js`
renders Front/Center/Back in the live-play hole header: tap "Distance to green" for a
one-shot GPS read (battery-safe), or "Set the green" to crowdsource the front+back
edges (2 taps, midpoint = center) onto `courses/{id}.greens[holeIdx]`. Member course
writes were already permitted — no rules change. Static per-hole yardage was already
shown. P10-graceful on every denied/timeout/no-green/unsupported state. PRIVACY: the
member's location is never stored (transient client-side compute); `privacy.html`
updated to disclose precise-GPS-on-tap. V1-verified on staging (globals resolve live,
all 3 strip states render, Haversine exact: 122/182/243 yds vs hand-calc). Smoke 33/33.
NO credential/gate was needed (client GPS + existing course doc), as predicted.

## Note on the OCR / credential items (Founder 2026-06-13)
Founder is on mobile / away from his PC and will set up the gated bits (the Anthropic
key for course photo→auto-fill OCR, any `gh` auth) next time he's at his command center.
Until then: the FREE versions ship without them (course photo-as-reference already
live v8.25.51; distance-to-pin needs no key). T3 OCR waits for the PC session.
