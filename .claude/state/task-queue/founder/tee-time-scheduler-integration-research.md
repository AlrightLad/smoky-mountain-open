---
status: open
severity: green
priority: STRATEGIC (deferred build — Founder said "after all other work")
authored_at: 2026-06-11T15:00:00Z
authored_by: agent
founder_action_required: decision (scope/product direction)
gate: none (research only; no code shipped)
---

# Tee-time scheduler integration — research + recommendation

Founder asked (2026-06-11): can we integrate GolfNow / Tee It Up / Supreme
Golf / TeeOff so commissioners link their course's existing scheduler and
members book tee times inside Parbaughs without bouncing to a website?
Worries: link breakage, course-maintenance headache, bad/no sync, multi-
course leagues, solo scheduling, "how does it update the course's schedule."
Likes: book-in-app, league notified, app stays the center of community.

## What I verified (evidence)

1. **GolfNow Affiliate & Partner API exists** — REST/JSON, OAuth2 — but it is
   **application-gated**: "Before granting access… GolfNow wants to understand
   what developers are trying to accomplish." It's built to *distribute and
   sell GolfNow's tee-time inventory* (affiliate/revenue-share), not to write
   into an arbitrary course's tee sheet. (affiliate.gnsvc.com returned 403 to
   an unauthenticated fetch — confirms it's gated.)
2. **TeeOff** (same NBC Sports Next family as GolfNow) — same model: list/
   affiliate API, partner-gated, ~9,000 courses.
3. **Supreme Golf** is an **aggregator** — it READS listings from GolfNow,
   TeeOff, Golf18, Groupon, etc. and compares prices. Its course-side write
   product (Revenue365) integrates specifically to a **foreUP** tee sheet.
   PGA-of-America partnership.
4. **Writing into a course's tee sheet** is done by the course's **tee-sheet
   vendor** (foreUP, Lightspeed/Chronogolf, Teesnap, Golfmanager, Club
   Prophet, EZLinks…) via THAT vendor's partner API, **and the course controls
   inventory, fees, cancellation rules**. A third party can't write to a
   course's sheet without (a) that specific vendor's partner program AND (b)
   the course's consent.
5. Courses are **fragmented across many vendors**; a league's home course
   could be on any of them, or on none (small munis still take phone calls).

**Bottom line:** the founder's worries are well-founded. A true "link your
scheduler and we sync bookings both ways" feature would be a per-vendor, per-
course, contract-heavy, fragile build (GolfNow approval + each tee-sheet
vendor's partner API + each course opting in). That is a massive BD+eng effort
and exactly the breakage/sync nightmare he fears. **Not recommended now.**

## Recommendation — the "Coordination-first" model (build on existing Tee Times)

Don't own the booking. Own the **coordination + notification** — the part that
"brings players who haven't met together." Parbaughs already has a Tee Times
surface (`src/pages/teetimes.js`, post + RSVP). Enhance it into a first-class
"tee-time intent" object with two states:

- **Proposed / "attempting"** → a member posts: course + date + time-window +
  N open spots (+ optional note). Fires a push + feed card: *"Marcus wants to
  play Honey Run Sat 8:10 — 2 spots open."* Members tap **I'm in**.
- **Locked / "scheduled"** → organizer confirms; everyone gets the final
  details + a **"Book your spot on [course] ↗"** button that **deep-links out**
  to the course's GolfNow/booking page (or the course website) so each player
  reserves their own slot externally. Parbaughs never touches the tee sheet.

This delivers ALL of his stated upside (book-flow starts in-app, league gets
notified the instant someone proposes OR locks a time, app is the community
hub) with **none** of the sync risk (we don't write to anyone's tee sheet, so
nothing breaks, nothing for the course to maintain).

### Directly answers his questions
- **Multi-course leagues:** trivial — the proposer picks the course (we already
  have course data via GolfCourseAPI). Intent is attached to whatever course
  they chose. No one-course constraint. (A direct-integration model could NOT
  do this cleanly.)
- **Solo / non-league:** a solo member posts an **open tee time** visible to
  their league(s) and/or nearby members (Find Players radius). This is a
  *growth* feature — open tee times surface players who haven't met. Booking
  still happens on the course system; Parbaughs handles "who's in" + notify.
- **"How does it update the course's schedule?"** It doesn't — *by design*.
  That's what makes it robust. The member books on the course system as they do
  today; we record the intent + coordinate the group + notify.
- **His explicit ask** ("if I can't link directly, how do players get notified
  when someone is attempting / has scheduled?") → the proposed/locked two-state
  intent object above. "Attempting" and "scheduled" are exactly the two pushes.

### Phasing (optional later tiers, only if scale justifies)
- **Tier 0 (recommended, ~1 focused ship-series):** the coordination model
  above. Pure Parbaughs + deep-link-out. No partnerships, no sync risk.
- **Tier 1 (later):** apply for **GolfNow/TeeOff Affiliate API (read-only)** to
  show LIVE availability + price for a course in-app, then hand off to GolfNow
  to book (affiliate link → possible small commission). Still no write-back.
- **Tier 2 (far future, real scale only):** true write-back via ONE tee-sheet
  vendor partnership (e.g. foreUP) for courses on that vendor. Only worth the
  BD effort with a large user base.

## Decision for Founder
Approve **Tier 0 coordination model** as a future build (after current UI/taste
marathon)? Reply e.g. "build tee-time coordination" to queue it, or redirect.
No code has shipped for this — research only.

Sources: GolfNow Affiliate & Partner API (affiliate.gnsvc.com), GolfNow/TeeOff
business-partnership pages, Supreme Golf (App Store / PGA partnership), foreUP
& Lightspeed/Chronogolf partner docs, teetimego.com platform guide,
sportsfirst.net tee-time-API overview.
