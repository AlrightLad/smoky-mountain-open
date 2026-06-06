---
status: open
severity: green
priority: LOW
founder_action_required: true
cost: "$0 (honest PNG set already generated + shipped to staging; no paid deps)"
gate: none (functional store blocker already cleared) — only an OPTIONAL brand-taste confirm/swap remains
execute_by: founder
verify_command: Test-Path public/icons/icon-512.png
verify_expected: "True"
---

# Founder decision — app-icon set (taste confirm, NOT a blocker)

**State change (2026-06-06):** the App Store / Play Store icon blocker is
**RESOLVED**. A real, honest, correctly-sized PNG icon set now exists, is wired
into the app, and is live on staging at **v8.23.85**. What remains is purely a
**taste confirmation** you can do at your leisure: keep what's there, or have me
swap the source art. Nothing here blocks staging or submission anymore.

## What I did (and why)

The old manifest pointed every icon slot at a single `watermark.jpg` (one JPEG
labelled as 48/72/.../512 *and* as a maskable icon). Stores reject that: a
maskable icon needs a real safe-zone, and a JPEG can't carry the format/sizes
stores validate. So I produced the real set:

- **Generated 22 honest per-size PNGs** from `public/watermark.jpg` with a
  Playwright/Chromium rasterizer (`scripts/generate-app-icons.mjs`, no new
  dependency). Each size is its own correctly-dimensioned PNG, not one image
  relabelled. Sizes climb honestly: 535 B at 20px up to 461 KB at 1024px.
- **Two maskable variants** (192, 512) rendered full-bleed. The watermark art
  already carries a ~22% margin around the centered mascot, so it sits inside
  the launcher safe-zone with no crop and no seam.
- **Rewired** `manifest.json` (9 honest entries: 7 any-purpose + 2 maskable),
  `index.html`, and `landing.html` off the old JPEG. Replaced
  `apple-touch-icon.png` with a clean 180px render (the legacy one had baked-in
  text). Bumped the version + service-worker cache so the new icon reaches
  anyone who's already added the app to their home screen.

**The one judgment call:** I rendered your **existing** watermark mark
faithfully. I did **not** apply the fancier treatment sketched in
`public/icons/README.md` (logo at ~70% with a gold gradient ring/glow), because
that would mean me inventing brand identity, and brand art is your call under
the three-agent workflow. What's on staging is your current mark, made
store-ready, nothing invented.

## What it looks like now

Gold line-art mascot (the golf-ball face in a bucket hat + aviators) centered on
the brand dark-navy `#0e1118`. Clean, premium, distinctive; reads as a
silhouette even at the 48px favicon size. See it on staging:

- App + home-screen icon: <https://alrightlad.github.io/smoky-mountain-open> (add to home screen)
- Or the raw files: `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`

## The remaining choice (OPTIONAL, your taste)

| Option | What happens | Cost |
|---|---|---|
| **Keep (recommended)** | Ship as-is. It's clean, on-brand, store-ready today. | $0, done |
| **Swap source art** | I re-run the same generator against `flag-logo.jpg` or `Logo.jpg` instead of `watermark.jpg`. ~5 min. | $0 |
| **Commission ring treatment** | I render the README's gold-gradient-ring/glow direction as 2-3 candidates for you to pick. | $0 |

**My recommendation: keep.** The watermark mascot is the most distinctive of
the three marks on disk and already looks like a finished app icon. The ring
treatment is a nice-to-have, not needed for a strong store listing.

## To resolve

- Reply **"keep"** (or just leave it) and I'll mark this closed.
- Reply **"swap to flag-logo"** / **"swap to Logo"** / **"show ring candidates"**
  and I'll regenerate and put the result on staging for you.

Verify (already passes — the real set exists):

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 store-app-icons
```
