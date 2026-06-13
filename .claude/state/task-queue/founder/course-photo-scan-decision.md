---
status: open
severity: green
priority: MEDIUM
founder_action_required: true
gate: Tier 3 only — AMD-018 #1 (Cloud Function deploy) + P4 paid-last (a new Anthropic API key + ~$3/yr billing)
execute_by: agent (T1+T2, no gate) ; founder decision (T3)
---
# Add a course by photo — feasibility + the one decision for you

**Founder ask (2026-06-13):** "Adding a course via a photo scan or upload I still
don't see that feature." Here's the honest map. Two tiers I can build with **no
gate**; one tier (true photo OCR) needs **one decision from you**.

## Tier 1 — "Chart it yourself" (CODE-NOW, no gate). The 80/20 win.
Replace the bare `prompt('State')` add-course stubs with a proper guided sheet:
name → tees → par-per-hole → optional yardage → submit. Photo is attached as a
**reference image** (Firebase Storage, same path scorecard.js uses) that the
member reads off while confirming the parsed fields. Marks the course
`source:'member-charted'` with an amber "Charted by {member} · unverified" badge
(reuses the existing trust UI), a dedupe guard, and the existing +50/+10 ParCoin
reward. **This ships the feature at $0 with zero gate** and is the real
member-facing capability. I can build this now.

## Tier 2 — free fallback data sources (CODE-NOW, one soft gate).
When GolfCourseAPI has no match, fall back to free OpenGolfData / OSM Overpass
for par/yardage. **Soft gate: Legal & Compliance** must bless the OSM/ODbL
attribution string before ship (I route it through the legal skill — not a
Founder gate). Estimated rating/slope shown explicitly (never a silent 72/113).

## Tier 3 — TRUE photo OCR (a camera photo of a scorecard → auto-filled). NEEDS YOU.
A Cloud Function (`extractScorecard`) sends the photo to a Claude vision model and
returns course name + par + yardage. This is the "magic" version. Three gates,
all yours:
1. **A new Anthropic API key + billing** (~$3/year at our scale) — a new paid
   external dependency. P4 (paid-last) is satisfied *because* T1+T2 already ship
   the feature free; T3 is the upgrade.
2. **Cloud Function deploy** (AMD-018 #1) — same pre-auth path as the
   deleteMyAccount deploy (#24). The key lives only in Functions secret config,
   never the app bundle (P8).
3. Accuracy is good-not-perfect (handwriting/glare); the member always confirms
   the parsed fields before save (so a bad read can't corrupt course data).

**Proposed (my recommendation):** I build **Tier 1 now** (the real win, $0, no
gate), add **Tier 2** behind the legal-attribution check, and **hold Tier 3** for
your single yes/no on the Anthropic key + a CF-deploy window — ideally bundled
with the next pending Cloud Function deploy. Want me to build T1+T2 now and queue
T3 for your decision? (Default if you don't answer: I build T1+T2.)
