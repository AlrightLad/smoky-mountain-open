---
status: closed
severity: green
priority: LOW
authored_at: 2026-05-30T00:00:00Z
authored_by: agent
founder_action_required: true
decision_type: copy-approval
cost: $0
execute_by: agent
gate: none
---

# Spectator HUD masthead — live-state copy templates (CLUBHOUSE_SPEC-HQ-3b)

## The one decision you need to make

Approve (or edit) the **headline copy** that appears when you watch
another member's live round. Everything else on this screen is already
built and looks the way it should. This is a copy / taste call, which
is yours, not mine. **Approve** and I'll wire it in; **deny with a
reason** and I'll use your wording instead.

## What this screen is

When a friend is mid-round and you tap their live round, you land on a
"Spectator HUD": a read-only view that updates in real time as they
score each hole. It already has the full editorial treatment the rest
of the app got:

- A dark felt masthead card with a brass `● VIEWING · LIVE` eyebrow
- Their name in the serif display face (e.g. "Nick *Burdge*")
- A course / hole / elapsed line
- A big to-par number, a "ON PACE FOR 72" projection, and "THRU 11"
- A color-coded 18-hole strip, a Front/Back/Total + GIR/Putts/FIR
  stats block, a course panel, and a running "recent shots" feed
  written in plain golf voice ("Stuck it close. One-putt birdie.")

It reflows cleanly on phone and desktop. Screenshots of the current
state are saved next to this note at
`.claude/state/design-pass-2026-05-22/w1-3b-spectator-hud-2026-05-30/`
(desktop + iphone).

So there is **no broken or unstyled surface here** — this is the last
of the redesigned HQ screens, and it already reads as same-genre as
the others.

## The only gap vs the design spec

The 3b spec asked for one extra editorial flourish the current build
doesn't have yet: the name headline should carry a **changing italic
tail** that narrates where they are in the round, instead of their
last name. The spec literally flagged this line as
"[INFERENCE] Founder approves the copy templates" — i.e. it was always
meant to be your call, not the engineer's.

### My recommended copy (this is what "approve" ships)

Headline = first name + a brass-italic clause that changes with the
round state:

| When | Headline shows |
|---|---|
| Just teed off (no holes done) | Nick, *on the first.* |
| Mid-round (1-17 holes done) | Nick, *thru eleven.* (number spelled out) |
| Standing on the 18th tee/green | Nick, *on the eighteenth.* |
| Round finished | Nick, *signed for 76.* |

Their handicap (currently shown after the name) moves down into the
course line, so nothing is lost: `HERITAGE HILLS · 12.4 HCP · HOLE 12`.

### What I recommend NOT doing (and why)

- **Keep the `VIEWING · LIVE` eyebrow as-is.** It also flips to
  "VIEWING · OFFLINE" / "PLAYER NOT CONNECTED" when their phone drops
  signal, so its wording is load-bearing, not decorative.
- **Keep the factual course/hole/elapsed line** rather than an
  auto-written narrative sentence. A machine-written "story" line on a
  live screen tends to read generic; the factual line is honest and
  dense.
- **Skip the Live / Stats / Course jump-links** the spec sketched. The
  page is short enough that you can see everything in a couple of
  scrolls, so the jump-links add clutter for little gain.

If you'd rather have any of those three, say so in your deny reason and
I'll build them.

## What happens on each choice

- **Approve** → I implement the changing italic headline exactly as in
  the table above, verify it on desktop + phone against a synthetic
  live round, and ship it to staging on the next version bump. No cost,
  no production gate (member-facing front-end only).
- **Deny** → tell me what you want the headline to say instead (or that
  you want the eyebrow / narrative line / jump-links too) and I'll
  build to your wording and re-surface for a look.

## Why I didn't just build it

The spec marked the copy as your approval, the headline is the single
most-read line on the screen, and wiring the changing clause means
touching the real-time live-round render path. Per our workflow, copy
and taste are your call and live-scoring code is changed carefully, so
I'm surfacing the wording first rather than guessing it. The screen is
fully functional and on-brand in the meantime.


---
**CLOSED 2026-06-11:** Default-approved per AMD-015 after 12 days without objection (LOW, copy-only, $0). The proposed copy is what ships; say the word and it changes.
