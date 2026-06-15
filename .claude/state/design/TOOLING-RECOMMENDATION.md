# PARBAUGHS design-tooling recommendation (researched 2026-06-15)

Founder need: not just image gen — "complete application design + UI templates/
workflows to reference and use to enhance the existing app," driven autonomously
(via his computer + logins). Extensive research below; decisive picks at top.

## Decisive picks (for OUR stack: vanilla JS + Vite + Firebase — NOT React)
| Need | Pick | Why for us | Cost | Autonomy |
|---|---|---|---|---|
| **Generate full UI screens + flows** | **Google Stitch** (stitch.withgoogle.com) | Gemini-powered; exports **HTML/CSS** (adapt straight into vanilla JS — no React port) + editable Figma layers; multi-screen consistency; same Google account as our Imagen/Firebase | **Free (beta)** | Drive via his logged-in browser |
| **Taste + workflow REFERENCE** | **Mobbin** | 608K+ real app screens + 323K+ **user flows**; the library to lift UI + onboarding to top-app caliber; I design against captured refs | **$10/mo** | Drive via browser |
| **Cosmetic ASSETS (rings/frames)** | **Imagen 4 Ultra** (have it) + optional **Recraft** (brand vectors) | Ultra = brand-critical tier (max prompt-adherence); Recraft = best brand-consistent vectors/icons | Ultra ~$0.06/img (staging SA, autonomous now); Recraft ~$10/mo | Imagen autonomous now; Recraft = API key |

## Why NOT the obvious "best UI generator" picks first
- **v0 (Vercel) / Lovable / Bolt** — excellent, but output **React/Next + full-stack scaffolds**. Porting to our vanilla-JS app = friction; they're for greenfield React. Use only for *visual reference*, not code.
- **Figma Make** — genuinely good (AI design inside Figma), but more interactive/human-in-loop + React-ecosystem-leaning. Secondary for autonomous use vs Stitch's free HTML/CSS export. **If the Founder prefers/already pays for Figma, drive Figma Make instead — equivalent quality, his call.**

## How the autonomous loop uses these (no briefs, no hand-offs)
1. Drive Stitch (his login, his browser) → prompt with `.claude/state/design/BRAND-BRIEF.md`
   → generate the page/flow → export HTML/CSS → adapt the markup/styles into the
   vanilla-JS page (keep our tokens) → V1 → ship per page.
2. Drive Mobbin → capture top-app references for the surface → design against them.
3. Imagen Ultra for cosmetic raster assets → finish (_finish-art.py) → wire.
4. Optional: OpenRouter Fusion / a Workflow critic-panel judges brand-fit pre-ship.

## What the Founder logs into (one-time, then I'm autonomous)
- **Google Stitch** (free) — the main generator. ← highest value
- **Mobbin** ($10/mo) — the reference library.
- (optional) **Recraft** API key (gitignored) — brand vector assets.
- (optional) **OpenRouter** API key — Fusion multi-model critique/synthesis.

Cross-refs: [[reference_openrouter_fusion_development]],
[[feedback_brief_the_brand_before_generating]], [[feedback_design_is_generator_first]],
`.claude/state/design/BRAND-BRIEF.md`.
