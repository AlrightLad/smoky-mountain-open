# Green slope & green-roll — options, yearly fees, recommendation

*(You asked for this when greenlighting Lane A: "plan for green slope and roll later
— provide options, yearly fees, costs, and what's best for our brand/app." Researched
via 5 parallel agents 2026-06-15.)*

## 1. Bottom line
There is **no free source** for real green slope/roll data, and **every paid option is
the wrong product** for a casual illustrated 20-friend league — so **skip the licensed
pro data**, and if "green roll" is ever wanted, build it as a **free crowdsourced /
illustrated cosmetic**, not survey-grade tooling.

## 2. The options

| Provider | Has slope/roll | Pricing model | Est. yearly fee | Free trial | Brand fit | Confidence |
|---|---|---|---|---|---|---|
| **GolfLogix** (Revelyst) | Partial (consumer app yes; dev API unclear) | Quote-only OEM/B2B, no public rates | Quote-only — likely **4–5 figures/yr** + minimums | None public | Poor — pro laser-scanned rangefinder | High capability / pricing opaque |
| **iGolf** (iGolf Connect) | **Yes** (Green Heat Maps + terrain) | Quote-only, NDA partner license | **~$5,000/yr floor** (heat maps cost more on top) | None public | Poor — enterprise OEM data | Med-High |
| **GolfIntelligence** | **Yes** (Green-Slope render API → images) | Credit subscription, **public tiers**, 1-yr term | **~$4,788/yr floor** ($399/mo Starter) | **Yes — $0 Test tier, 200 credits one-time** | Poor — pro caddie posture | Med-High |
| **Golfbert** | **No** (green polygons + scorecard slope only) | Quote-only | low-hundreds–$1k+/yr (inferred) | None | Poor — redundant w/ our GolfCourseAPI | Med |
| **Free / DIY** (USGS LIDAR + OSM + BreakMaster/ACE) | **No** (usable break data unattainable free) | $0 licensing | **$0/yr** (optional ~$150 device) | Free | Ethos fits; deliverable doesn't | High |

## 3. Recommendation — **don't license it; defer or do it as a cosmetic**
- **Brand:** centimeter-accurate 3D putt-break tooling is the "serious pro rangefinder"
  posture Parbaughs deliberately is **not** — it reads over-serious / cheating-adjacent
  for a money-free, community-over-competition friend league, and clashes with the
  cream/felt-green illustrated identity.
- **Budget (P4):** every capable option is quote-only B2B or **~$4,800–$5,000+/yr** with
  1-yr lock-in + NDAs — ~$240–250/yr **per friend** just for putt data. Wildly
  disproportionate at 20 members. Any paid adoption would need your explicit approval.
- **Verdict:** **Defer entirely** unless Parbaughs scales to thousands of paying users
  (then revisit GolfIntelligence — the only public-tiered, free-trial option).

## 4. The on-brand alternative (recommended if you ever want "green roll")
Ship it as a **$0 crowdsourced cosmetic**, extending the v8.25.55 distance-to-pin
pattern: a member taps a rough uphill / downhill / L-R read per green → store in
Firestore → render as an **illustrated felt-green "feel the break" arrow/tint**.
Qualitative and fun, not survey-grade — matches P4, the brand, and the existing
crowdsourced-greens precedent. No vendor, no fee.

*If you ever want to prototype the real thing:* GolfIntelligence's $0 Test tier (200
one-time renders) — but verify it covers our actual York/PA munis (Cool Creek, etc.)
first, since championship coverage ≠ local tracks, and production still means the
$4,788/yr Starter tier.

## 5. Sources
GolfLogix map-licensing-inquiries · iGolf golf-course-data + developers · GolfIntelligence
api-pricing + 3d-green-slope-data · Golfbert.com + GitHub clients · USGS 3DEP + OSM
golf=green + BreakMaster/ACE. (4 of 5 are quote-only B2B — non-GolfIntelligence yearly
figures are inferences for scale, not quotes; a real number needs emailing their bizdev.)
