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
