# PARBAUGHS Design Tooling Kit — Free, Agent-Drivable, Stack-Fit

Synthesized from a 6-agent research workflow (2026-06-15) for raising design quality to
the 9.5 bar on a vanilla-JS + Vite + Firebase PWA, using FREE + autonomously-drivable
resources. Companion to BRAND-BRIEF.md + TOOLING-RECOMMENDATION.md. **Brief every
generator on `.claude/state/design/BRAND-BRIEF.md` FIRST.**

DROPPED (don't re-research): v0.dev/bolt.new (React, login-gated, thin quotas),
Pollinations (watermarked/paywalled), Rive authoring (editor login; runtime-only).

## TOP 10 (free + agent-drivable + value for our stack/brand)
1. **@axe-core/playwright** — deterministic WCAG-AA contrast pass/fail + exact selector. Ends manual contrast marathons.
2. **Gemini API free tier (vision→self-contained HTML)** — autonomy engine behind every OSS UI generator; standalone screenshot→redesign lane.
3. **Material Design 3 easing/duration tokens** — exact portable cubic-beziers + duration ladder; kills ad-hoc 0.3s.
4. **Phosphor Icons (duotone)** — H&B-understated icon move; deterministic CDN per glyph, recolor to brass/felt, zero runtime.
5. **fffuel grain/gradient SVG filters** — real felt/paper/kraft texture, ZERO raster/Imagen credit; kills flat-card blandness.
6. **VLM-as-judge rubric (own orchestration)** — the 9.5-self-score-before-human mechanism, scoped to static visual dims.
7. **odiff + ssim.js** — fast numeric pixel-diff gate + perceptual second stage that suppresses false-fails.
8. **Stylelint declaration-strict-value + Wallace css-analyzer** — "no hardcoded colors" as hard pre-commit fail + token-budget audit.
9. **Carbon spacing/type scale + Apple HIG metrics** — documented density ladder + iOS-native metrics for our PWA.
10. **tldraw make-real (`prompt.ts`) / screenshot-to-code (html_css)** — Stitch backups emitting VANILLA HTML on our Gemini key.

## (1) Visual-QA self-scoring loop (run per page × themes BEFORE the Founder sees it)
render → **axe** (hard contrast gate, selector-precise) → **odiff + ssim.js** (numeric + perceptual regression gate; ssim>0.95 = ok, <0.9 = real regression) → **VLM-judge** (Playwright fullPage PNG → structured rubric: typography/hierarchy/density/contrast/motion/brand-distinctiveness/focal-peak; 2-3 bubble quorum; **cap 9.4 per AMD-028**; NOT for interaction/error states) → **Lighthouse** (a11y/best-practices/44pt-target → App Health number) → **ARIA snapshots** (`toMatchAriaSnapshot` catches broken heading/landmark/name) → Founder screenshot for ≥9.5.

## (2) Free assets
- **Phosphor duotone** (jsDelivr `@phosphor-icons/core/assets/<weight>/<name>-<weight>.svg`; inline, currentColor, map two duotone paths to brass+green).
- **fffuel (gggrain/nnnoise/ffflux)** — hand-author the `feTurbulence`/`feComponentTransfer` filter inline; one shared `<svg>` def; nnnoise `mix-blend:overlay` ~8-15% over token surfaces.
- **CSS/SVG brass-foil** `.foil-brass` — conic/linear brass-token gradient + low-opacity feTurbulence patina + optional feSpecularLighting glint; animate background-position on hover (reduced-motion safe).
- **ambientCG + Poly Haven (CC0 PBR maps)** — brushed-brass/kraft/foil when a hero needs photographic depth (CC0, no attribution).
- **LottieFiles free (Simple License)** — supporting micro-motion only (spinners/confetti/empty-state); recolor JSON to tokens; log license URL for LEGAL block. Hand-built rubber-hose caddies stay the brand peaks.
- **unDraw + Open Peeps (CC0)** — empty/zero states only, single accent-recolor to a token; NEVER substitute for canonical rubber-hose caddies; log license.

## (3) Design-system SPECS to port (read-only, no dep — port VALUES into base.css/components.css)
- **Material 3 easing+duration** (~14 vars: emphasized/decel/accel + dur ladder 150-450ms; enters=decel+long, exits=accel+short, taps=standard+short3).
- **Open Props springs / easings.net** (`easeOutBack cubic-bezier(.34,1.56,.64,1)` for rubber-hose bounce on chips/buttons/confetti; cite curve name+value).
- **Carbon 2/4/8 spacing + type scale** (`--pb-space-01..10`; sweep components.css off magic numbers).
- **Apple HIG metrics** (8pt grid; 44pt targets; letter-spacing tighten >20px / loosen ≤19px; `-apple-system,'Segoe UI',Inter` so iPhones get SF metrics free).
- **Style Dictionary** (one `tokens.json` → CSS vars + `tokens.js` for share-card/charts; kills CSS-vs-JS drift; commit generated files).
- **Polaris shadow/radius/z-index SHAPE** (port the scale shape tinted claret/brass; checklist for depth gaps).
- **Every Layout primitives** (Cluster/Switcher/Sidebar/Stack as token-driven utilities → fixes overflow without a framework).

## (4) UI generators (Stitch backups — all on our Gemini key, vanilla HTML, never down)
- **Gemini free tier** (gemini-2.5-flash generateContent; inline screenshot + BRAND-BRIEF + "self-contained HTML, no React"; ~10 RPM/250 day).
- **tldraw make-real `prompt.ts`** (copy the hardened screenshot→HTML system prompt; call Gemini, no server).
- **screenshot-to-code html_css mode** (docker-compose + GEMINI_API_KEY; pixel-faithful then re-skin to brand).
- **OpenUI + Ollama** (local, unthrottled, zero data-share — describe-in-words for greenfield surfaces).
- **Components.ai** (export CSS custom-property ramps; token refresh, not per-page).

## (5) Process guardrails (define→enforce→audit→review→catalog)
- **Stylelint + declaration-strict-value** (raw hex = pre-commit FAIL, with the CLAUDE.md exception allowlist; into Husky lint-staged).
- **Wallace css-analyzer + css-code-quality** (prove the ~90-token budget held; attack the 458KB components.css).
- **reg-actions** (free PR-comment side-by-side visual diff → the Founder reviews on his phone = the ≥9.5 sign-off mechanism).
- **jscpd on src/styles** (already installed — find copy-pasted CSS to extract into shared classes; split components.css under the 800-line budget).
- **Custom Elements Manifest + static `public/catalog.html`** (Storybook-free gallery: every button/card/chip × 6 themes on one page; the FIRST screenshot in any taste critique; data-free regression target).
- **Lost Pixel OSS-mode** (upgrade over bespoke pixelmatch; built-in stabilization kills webkit flakes; mask clock/weather/confetti).

## STANDING HABIT — free-resource sweep at every design/UI workstream + wave close (P4 OSS-first)
(1) Define the gap precisely (contrast/density/motion/blandness/material/overflow/icon). (2) Search OSS/registries + documented design-system specs first; port VALUES over guessing. (3) License + autonomy + ship-safe gate (CC0 > MIT/no-attr > attribution; log source+license for the LEGAL block). (4) Brief the brand before generating. (5) Prove it landed via the self-scoring loop + the catalog page (verify on the consuming surface). (6) Record the find (tooling doc + memory). Re-run discovery whenever a tool goes paywalled; never let a dead tool idle the loop.
