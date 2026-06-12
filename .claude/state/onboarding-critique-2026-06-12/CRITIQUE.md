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

### The gap — the caddy FIGURE
A crude dark stick-figure (tipCap pose). It's the brand mascot/guide but reads as
a basic SVG, not a charming character — this is the "graphics suck" call. It also
floats in ~40% empty card space on the shorter beats. Two notes:
- The fix is the **graphics leap (#50)** — a polished Lottie caddy. Founder's lane
  pick A/B/C (plan: `task-queue/founder/onboarding-graphics-PLAN-2026-06-12.md`).
- The figure isn't built to recolor per-caddy (body is fixed `--cb-felt`; only the
  cap-button + clubs use the accent), so a per-caddy **visual** preview also rides
  the #50 rebuild rather than being a clean tweak.

### Bonus — P0 confirmed live
The home-screen background behind the FTUE shows "RIVALRY · You own Nick, 4-0" —
the dedup fix is live and the rivalry is correct (was 7-0).

## Conclusion
The onboarding **walkthrough** (engine, flow, copy, calibration, caddy-pick) is at
the 9.5 bar — #48's structural review is complete and passing. The remaining leap
is the caddy **figure** graphics (#50), gated on the Founder's Lottie lane pick.
