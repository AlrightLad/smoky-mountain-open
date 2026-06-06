---
status: open
severity: yellow
priority: MEDIUM
founder_action_required: true
cost: "$0 (agent generates candidates with the tools already installed; no paid deps)"
gate: none (brand-taste decision, Founder-only) — manifest wiring is a normal staging change
execute_by: founder
verify_command: Test-Path public/icons/icon-512.png
verify_expected: "True"
---

# Founder decision — Approve the real app-icon set (taste call)

**Who can do this:** Founder approves the look. This is a **brand-taste**
decision, and per the three-agent workflow taste is your call — I must not
unilaterally invent the brand mark. I CAN generate candidates for you to
choose from; I cannot decide which one is "Parbaughs."

**This does NOT block the staging product.** It is needed before App Store /
Play Store submission. Both stores require a real, correctly-sized PNG icon
set, and the current placeholder will be rejected. Surfacing now so it is not
a surprise at submission time.

## Why this matters

`public/manifest.json` currently points every icon slot at
**`watermark.jpg`** — a 1024x1024 JPEG used as a placeholder at all sizes
(`public/icons/README.md` says so explicitly). Two problems for store
submission:

1. **Dishonest sizes + wrong format.** The manifest declares the same JPEG as
   48/72/96/144/192/512 and as a 512 *maskable* icon. A maskable icon needs
   real padding (a safe zone) or the store crops the logo; a JPEG also can't
   carry transparency. Stores validate this.
2. **No PNG icon set exists.** `public/icons/` contains only `README.md` — no
   `icon-*.png` files yet. The README lays out the intended spec; nobody has
   produced the assets.

Brand assets already on disk to work from: `public/watermark.jpg` (1024x1024),
`public/Logo.jpg`, `public/flag-logo.jpg`.

## The design direction (already written, for reference)

`public/icons/README.md` specifies:

- Background `#0e1118` (Classic theme dark)
- Logo centered at ~70% of canvas
- Subtle gold gradient ring / glow around the logo
- NO text, NO rounded corners (stores add their own)
- Sizes: iOS 20/29/40/58/60/76/80/87/120/152/167/180/1024,
  Android+PWA 48/72/96/144/192/512

## The trade-off (how the set gets made)

| | I generate candidates | You DIY |
|---|---|---|
| Cost | $0 (Playwright + Chromium already installed; no new deps) | $0 (free web tools) |
| Your effort | review 2-3 options on staging, pick one | drive the whole design + export |
| Tools | I render the README spec to PNG and export every size | <https://maskable.app/editor>, <https://realfavicongenerator.net> |
| Good when | you want options fast and will judge taste | you have a specific look in mind already |

## Steps to resolve

1. **Decide:** reply in chat with one of:
   - **"generate candidates"** — I will render 2-3 icon options to the
     README spec (dark bg, logo ~70%, gold ring, proper maskable safe-zone)
     using Chromium, export the full PNG size set, and put them on staging for
     you to look at. You pick one; I then wire `manifest.json` to the real
     files as a normal staging change for your review.
   - **"I'll make them"** — produce the PNG set per
     `public/icons/README.md` and drop them in `public/icons/`; I'll wire the
     manifest once they're there.
   - **"defer"** — leave the placeholder; this item stays open as a known
     pre-submission gap.
2. The verify below passes once a real `public/icons/icon-512.png` exists.

## Mark complete

Resolves automatically once the icon set is in place. To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 store-app-icons
```
