# Onboarding (FTUE) 9.5 visual critique — 2026-06-12 (#48)

Captured via `pbWalk.runFtue(n)` at iPhone 393×852 against the dev server.
`runFtue` mounts its own overlay and does NOT gate on auth, so the FTUE beats +
caddy figure are visually critiquable **without the Firebase emulator** — this is
how the onboarding 9.5 review got unblocked overnight while the rest of the
authed app stayed gated. Screenshots: `ftue-1-welcome.png`, `ftue-2-calibrate.png`,
`ftue-7-caddy-pick.png` (this dir).

## Verdict
**Structure / flow / copy = at the 9.5 bar. The one gap is the caddy FIGURE art → #50 (Lottie).**

### Beats reviewed
- **Welcome (0):** "Welcome to the Clubhouse" eyebrow + warm one-line pitch +
  "Show me around". Clean type, on-brand. Caddy figure floats with whitespace.
- **Calibrate (1):** "Quick question" + "Just me" / "With my crew" — two clean
  choice buttons, tailors the first week. Clear, good.
- **Caddy-pick (7, LAST):** "Meet your caddy" — explains what a caddy IS, a 2×2
  grid of all four (The Caddy / Old Tom / Birdie selectable, Bag Room Guy dimmed
  "Earned later"), a preview line, "you can change it any time", "Start playing".
  Hits **every** Founder concern: last beat ✓, explains what it is ✓, previewable
  ✓, changeable ✓, four caddies ✓.

### The caddy FIGURE — corrected assessment (close-up: ftue-figure-closeup.png)
**Correction:** an earlier note called it a "crude stick figure" — that was an
over-harsh read from a small mobile shot. The close-up shows a **competent,
deliberate filled caddy silhouette**: tapered torso (real mass, not a stick),
billed cap with a brass button, legs with a slight stance, a 2-segment gesturing
arm, and a **golf bag with three brass club-heads fanned up + a chest strap**.
It IS on-brand and reads as a caddy.

**The one genuine, objective issue** (not subjective taste): in the `tipCap`
pose the raised gesturing arm crosses up-left and **clusters/overlaps with the
bag body + the fanned club-heads**, so that corner of the silhouette reads as a
tangle rather than a clean "tipping the cap." It floats with some whitespace on
the shorter beats. This is a **pose-geometry refinement** (adjust tipCap's
armDeg/lagDeg so the arm clears the bag) — deliberately NOT attempted
autonomously overnight: tuning the rig coordinates blind to Founder taste, in a
long session, risks making it worse over several iterations. Best done in a
visual-iteration session.

**Implication for the lane decision (#50):** because the SVG figure is already
competent, **Lane C (polish the SVG)** is more viable than my first note implied
— a focused pose declutter + the per-caddy accent may get it to the bar without
a full Lottie rebuild. The figure isn't currently built to recolor per-caddy
(body fixed `--cb-felt`; only cap-button + clubs use the accent), so a per-caddy
visual preview needs either that rig change (Lane C+) or the Lottie path (A/B).
NOTE: the Founder's "graphics suck" likely also targets the **sign-in tee-shot
swing** (`intro.js`), which plays POST-AUTH and was NOT capturable here — that's
the unseen piece, reviewable only with the emulator/clean-session.

### Bonus — P0 confirmed live
The home-screen background behind the FTUE shows "RIVALRY · You own Nick, 4-0" —
the dedup fix is live and the rivalry is correct (was 7-0).

## Conclusion
The onboarding **walkthrough** (engine, flow, copy, calibration, caddy-pick) is at
the 9.5 bar — #48's structural review is complete and passing. The remaining leap
is the caddy **figure** graphics (#50), gated on the Founder's Lottie lane pick.
