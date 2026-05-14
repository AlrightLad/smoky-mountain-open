---
paid_service: Applitools (visual testing platform)
paid_cost: per-test-run subscription ($)
free_replacement: Playwright MCP + custom diff scripts (in-repo)
status: in-progress
replicated_at: 2026-05-14 (foundation laid; refinements ongoing)
---

## The paid service offered

Applitools provides:
- Capture screenshots from headless browsers
- AI-powered diff detection (ignores antialiasing noise, font hinting,
  cross-platform render differences)
- Baseline management UI
- CI integration

## The free path

`scripts/visual-audit/*` already provides the capture half via
Playwright MCP. The diff half is built incrementally:

- `enumerate-interactives.mjs` — DOM coverage enumeration (button
  coverage gate per PROP-013)
- `click-every-interactive.mjs` — interactive surface walk
- `capture-*.mjs` — surface-specific captures
- Round-trip-test `[user-context-gate]` — freshness enforcement
- Future: pixel-diff script comparing fresh captures vs baseline
  with HSL-perceptual collision detection (per iter 12)

Free tooling that can wire into the diff half without paid service:

- `pixelmatch` (open-source, MIT) for raw pixel diff
- `image-ssim-js` for structural similarity (better than pixel diff
  for antialiasing noise)
- Custom HSL-distance check (already used iter 12 for perceptual
  color collision detection)

## Capability gap

Applitools' "AI-powered diff that ignores noise" is the main delta.
Pixel-diff + SSIM approximates it; perfect parity not necessary for
this project's scale (5 dashboards + ~10 app surfaces).

Where Applitools is genuinely cheaper-per-effort: cross-platform
matrix testing (multiple OS + browser + viewport combos). PARBAUGHS
ships to iOS/Android via Capacitor + desktop dashboards; only the
desktop dashboards need automated visual regression. The Capacitor
app is QA'd via TestFlight + manual Founder testing (per CLAUDE.md
"Tier 3 — Manual QA on device").

So the capability gap that matters for THIS project is small.

## Implementation cost

In-flight. Foundation already in place:

- Capture scripts: done
- Round-trip enforcement: done
- Pixel diff: not yet — recommendation pending

One-time cost to complete: ~4-6 hours to author + integrate
pixelmatch-based diff script into round-trip-test.

Ongoing: baseline maintenance lives in repo (PNG files committed);
diff script handles automatic update on intentional design change.

## Maintenance burden

Low. The Anthropic Playwright MCP receives updates automatically.
pixelmatch is stable + well-maintained. SSIM is mature.

## Outcome (to date)

Capture half: solid. Diff half: present but ad-hoc (Founder visually
compares iter PNGs). Recommendation REC-XXX (to be authored by
architecture agent post-boot) will propose closing the diff-half gap
with pixelmatch integration.

## Sources + community references

- `@playwright/mcp` MCP server
- pixelmatch: https://github.com/mapbox/pixelmatch
- image-ssim-js: https://github.com/darosh/image-ssim-js
- This project's PROP-008, PROP-012, PROP-013
- iter 12 perceptual color collision detection (HSL distance):
  `.claude/state/main-flows-v2/iter-12-*.md`
