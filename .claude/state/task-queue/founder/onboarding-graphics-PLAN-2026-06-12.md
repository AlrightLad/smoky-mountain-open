# Onboarding graphics — tool decision + implementation plan (2026-06-12)

> Your ask: "the graphics suck, needs heavily altered... if you can't get it
> exactly how you need direct me towards tools I can sync you with... do deep
> research and plan how it would work after we implement said tool... pick the
> best one and give reasons and options. This is a HUGE part of the app and an
> INTRODUCTION to parbaughs as a brand so it needs be extremely good."

## TL;DR — one decision from you

The current sign-in swing + caddy are hand-built **SVG rigs** (`src/core/intro.js`,
`src/core/caddy-figure.js`). They're on-brand but motion-limited — that ceiling
is why they still read as "meh." The clean leap is **Lottie** (free, MIT, no
WASM, vanilla-JS friendly). I can wire the runtime + ship a first pass tonight/
next session **without you** — the ONE thing that needs you is the **asset**:
whether the hero swing animation is (A) a curated free Lottie, (B) a bespoke
branded Lottie you commission / I build from a free editor, or (C) we keep
polishing the SVG. Pick a lane and I run.

## Tool decision: Lottie (recommended) vs Rive

| | **Lottie (lottie-web / dotlottie)** ✅ | Rive |
|---|---|---|
| Cost / license | Free, MIT, no commercial tier | Free plan, but **full commercial use can need a paid tier** — risky as we scale toward thousands/App Store |
| Runtime weight | ~50–60KB (dotlottie) | **~200KB WASM** overhead |
| Fit for vanilla JS + Vite + PWA | Native, drop-in `<script>` or npm | Works, heavier integration |
| Asset authoring | JSON; huge free library (LottieFiles/IconScout); After Effects → Lottie | Needs the **Rive editor** (your account) to author/edit |
| Best at | Designer-made one-shot animations (our swing + caddy) | Interactive state-machine UI (overkill here) |
| Agent-producible | Yes (wire runtime + drop JSON) | No (needs the editor) |

**Pick: Lottie.** Our needs are one-shot hero moments (the tee-shot swing, the
caddy gestures), zero budget, vanilla JS, commercial-safe at scale. Rive's
state-machine strengths don't apply, and its WASM + paid-commercial risk are
real costs. (Sources in `.claude/state/research/` + the earlier chat brief.)

## The one input I need from you (asset lane)

- **Lane A — curated free asset (fastest, $0):** I pull a license-clear golf
  swing/golfer Lottie from LottieFiles/IconScout free tier, recolor to our
  palette, ship to staging. Risk: may read slightly generic, not bespoke.
- **Lane B — bespoke branded (best, needs a sync):** a Parbaughs-specific swing
  (our caddy silhouette, our dawn palette). Either you commission a quick
  designer asset, share a LottieFiles Pro asset, or I build one in a free
  editor (LottieLab/Haiku) and you sign off on the look. Highest brand bar.
- **Lane C — stay SVG, polish hard:** no new dependency; I push the existing
  rigs as far as SVG keyframes allow. Lowest ceiling, full brand control.

Default if you don't pick: **A first (to set the quality bar on staging), then
B for the final hero** — you approve the bespoke look before it goes to prod.

## Implementation plan (Lane A/B — Lottie)

1. **Runtime:** add `lottie-web` (or `@lottiefiles/dotlottie-web`) — vendored or
   npm; ~50KB, lazy-loaded only on the sign-in route so it never taxes the rest
   of the app. CSP already allows our own bundle; no new external origin.
2. **Swing:** replace `intro.js`'s SVG swing with a `lottie.loadAnimation` into
   `#pbIntro`, preserving the existing lifecycle (auto-play after sign-in,
   `setOnTeardown` → caddy bridge, reduced-motion guard → static frame).
3. **Caddy:** keep `caddy-figure.js` as the FTUE/coachmark bust (it works), OR
   swap to a small Lottie caddy with the 4-voice accent tint. Lower priority.
4. **Verify:** smoke S1 (auth/intro) stays green; add a smoke assertion that the
   Lottie canvas mounts; visual-capture the sign-in→intro on a clean emulator at
   iPhone + Pixel + desktop; hold to the 9.5 bar before prod.
5. **Fallback:** if the Lottie fails to load, render the current SVG rig (no
   blank hero). Bundle-size budget: keep the lazy chunk < 120KB.

## Why this was blocked tonight (honest)

The sign-in swing renders **after** auth, and the visual-capture path needs the
Firebase **auth emulator** (port 9099), which was down (firestore 8080 up).
Restarting the emulator suite unattended risked the smoke ship-gate, so I didn't
gamble on it while you slept. With a clean emulator next session this executes
end-to-end. Everything else you reported tonight is already shipped + live
(v8.25.5–.10).
