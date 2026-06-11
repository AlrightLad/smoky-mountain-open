# League-Formation Campaign — Feb–April window (planning draft)

**Status:** Working draft · authored 2026-06-11 (strategy brief action #9:
"plan the Feb–April league-formation campaign now").
**Owner:** Founder decides timing + voice; the team builds the surfaces.

## Why this window

League formation is seasonal: golf groups organize in late winter as
courses reopen. The brief's growth math is pods — one converted
commissioner brings a whole friend group. Everything below rides on
infrastructure that is ALREADY LIVE as of v8.24.45: public share pages,
Parbaughs Wrapped, the Commissioner's Kit, league-targeted personal
invite links.

## The motion (three beats)

**Beat 1 — Wrapped season-end push (Sep–Oct 2026).**
Every member's Wrapped finale already cuts a public link. At founding-season
close, prompt each member once to share theirs. Goal: every member's group
chat sees one Parbaughs artifact. Cost: one gentle in-app prompt (build:
~1 ship). Measure: shares created (count docs in the shares collection).

**Beat 2 — Winter warm-up (Jan 2027).**
"Bring your crew" — members who never used their 25 invites get one
in-app nudge pairing the invite link with the share page of their league's
board. No email, no spam; one Clubhouse notice. Measure: invites generated
vs redeemed (invites collection already tracks status).

**Beat 3 — Formation window (Feb–Apr 2027).**
The Commissioner's Kit is the landing experience. Add ONE public-facing
artifact: a "Start your league" share-style page (same public/share.html
pattern — static, no auth) explaining what a commissioner gets, ending in
"ask a Parbaughs member for an invite" (preserves invite-only). Members
post it where their golf groups live. Measure: leagues created with
founded dates in the window + kit completion rates (memberCount > 3 within
14 days of founding).

## What this campaign is NOT

- No paid acquisition, no app-store dependency, no email list. The brand
  is invite-only word-of-mouth; the campaign just times the word-of-mouth.
- No new tracking surface. Counts come from collections that already exist
  (shares, invites, leagues). No analytics SDK gets added for this.

## Founder decisions needed (when ready, not now)

1. Tone of the three nudges (the team drafts copy; you approve voice).
2. Whether Beat 3's public "Start your league" page ships at all
   (it is the closest the platform gets to a public front door).
3. Timing overrides if the founding league's season runs long.
