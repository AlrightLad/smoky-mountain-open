# Huashu Design (花叔 / @AlchainHust) — distilled reference

**Authored:** 2026-05-20
**Source:** `https://github.com/alchaincyf/huashu-design` (MIT relicensed 2026-05-14, 14.4k stars)
**Status:** REFERENCE-ONLY (deferred) per PROP-014. Not installed as a skill — Huashu Design generates HTML-native prototypes / decks / motion-design / MP4 export, aimed at prototype + marketing deliverables rather than the production Vite-bundled SPA pages we ship today. This doc captures the philosophical frame + critique system for ad-hoc consultation; revisit for full install when launching parbaughs.com marketing or producing season-end Caddy Notes decks.
**Used by:** design-bot deliberation on bubble #1 (visual hierarchy) and bubble #8 (taste); future marketing-site work.

---

## Why distilled (not installed)

Source ships:
- 1 SKILL.md (Chinese-primary, English-supported)
- 5 schools of design philosophy → ~20 philosophies total
- 5-dimension expert critique system
- 7 executable scripts: `render-video.js`, `convert-formats.sh`, `add-music.sh`, `export_deck_pdf.mjs`, `export_deck_pptx.mjs`, `html2pptx.js`, `verify.py`
- ffmpeg dependency (undocumented in README)

**Mismatch:** PARBAUGHS is at v8.1.3 in production with a Vite-bundled SPA + 44pt-touch-target mobile-first orientation. Huashu's "ship a launch animation / clickable App prototype / editable PPT deck in 3-30 minutes" framing targets a different problem space — prototyping for early-stage product validation or one-off marketing assets.

**Net-new value worth keeping:** the 5-school philosophy frame (different from Anthropic's `frontend-design` and Impeccable's anti-pattern approach) + the 5-dimension critique system (sharper than our existing taste-scoring RUBRIC.md).

---

## The 5 schools (~20 philosophies total)

Each school is a coherent worldview. Pick ONE per surface; mixing schools in one surface produces what Huashu's anti-pattern list calls "PowerPoint-style scene cuts" — visual incoherence.

### 1. Information Architecture School — Pentagram tradition
**Tone:** rational, data-driven, restrained.
**Visual signals:** generous whitespace, structured grids, restrained color, hierarchy via scale.
**Use for:** dashboards, leaderboards, statistics surfaces, scorecard renders.
**PARBAUGHS fit:** dashboard ecosystem (active /goal), Members directory, league standings.

### 2. Motion Poetics School — Field.io tradition
**Tone:** kinetic, immersive, technical aesthetics.
**Visual signals:** scroll-triggered choreography, perpetual micro-motion, dark backgrounds with bright accents.
**Use for:** marketing hero sections, product launch animations.
**PARBAUGHS fit:** future parbaughs.com landing page; season-end "looking back" recap animations. NOT day-to-day app pages.

### 3. Minimalist School — Kenya Hara tradition
**Tone:** order, whitespace, refinement.
**Visual signals:** large negative space, single accent, tight typography, restrained palette.
**Use for:** brand-defining moments, hero pages, founding-member welcome surfaces.
**PARBAUGHS fit:** Clubhouse welcome card, profile completion surfaces, "joined the league" moments.

### 4. Experimental Vanguard School — Sagmeister tradition
**Tone:** pioneering, generative-art, visual-impact.
**Visual signals:** bold typography, unexpected color combinations, generative patterns.
**Use for:** brand moments where memorability > clarity (limited scope).
**PARBAUGHS fit:** share cards (each round produces a unique visual artifact), season-end recap "moments". The share-card system already partially leans this direction.

### 5. Eastern Philosophy School
**Tone:** warm, poetic, meditative.
**Visual signals:** soft tones, generous breathing room, gentle motion, considered typography.
**Use for:** reflective surfaces, year-end / season-end retrospectives, member-anniversary moments.
**PARBAUGHS fit:** Caddy Notes (could match this register).

---

## The 5-dimension critique system

Score each surface 0-10 across all five dimensions. Output: total + "Keep" list + "Fix" list (severity-ranked) + top-3 quick wins.

| # | Dimension | What it measures | Failure signal | PARBAUGHS overlap |
|---|---|---|---|---|
| 1 | **Philosophical Consistency** | Alignment with the school chosen for the surface | Mixing schools (e.g., minimalist hero with vanguard typography) | New dimension — we don't currently score this |
| 2 | **Visual Hierarchy** | Information prioritization, scanning flow | Eye doesn't know where to start | Direct overlap with our taste-scoring RUBRIC.md dimension #1 |
| 3 | **Execution Detail** | Craft quality, spacing precision, typography precision | Sloppy padding, off-grid alignment, inconsistent leading | Direct overlap with RUBRIC.md dimension #2 |
| 4 | **Functionality** | Interaction integrity, user task completion | User can't actually complete the task; tactile feedback missing | New dimension — our RUBRIC is purely visual |
| 5 | **Innovation** | Originality, differentiation, memorability | Looks like every other SaaS template | Direct overlap with RUBRIC.md dimension #7 (overall taste) |

**Worth integrating:** dimensions 1 (Philosophical Consistency) and 4 (Functionality) are net-new vs our existing 7-dimension RUBRIC. Consider augmenting RUBRIC.md to 9 dimensions if a future ship wants this.

---

## Anti-pattern rules worth keeping

From Huashu's source (excerpted):

| Category | Anti-pattern | PARBAUGHS direct applicability |
|---|---|---|
| **Product imagery** | "Never use CSS silhouettes to replace real product photos." | Share cards: when showing a hole layout, use the real course rendering — not CSS-shape stand-ins. |
| **Copy** | "Never add filler content — leave honest placeholders instead." | Empty states must say what the user does to fill them; never use lorem-ipsum-equivalent. |
| **Slide architecture** | "Never mix multi-file + single-file deck patterns in one project." | Maps to: don't mix bundled-core + lazy-loaded-page patterns ad-hoc; follow vite.config.js CORE_FILES discipline. |
| **Animation narrative** | "Never use PowerPoint-style scene cuts with voiceover — maintain continuous motion." | Hole-by-hole replay: continuous motion between holes, not cut-and-pause. |
| **Brand assets** | "Never skip logo — it's mandatory for any brand." | Every Caddy Notes header should carry the Parbaughs mark (Visual Reference rule). |
| **AI slop** | Avoid: purple gradients, emoji-as-icons, SVG hand-drawn people, unconstrained new colors. | Aligned with CLAUDE.md "No emojis in place of SVG icons" rule (exception: ⛳ for The Caddy bot). |

---

## Core Principle #0 — Fact verification before assumption (worth adopting)

*"Any claim regarding product existence, release status, version numbers, or specifications must trigger immediate `WebSearch` verification BEFORE proceeding with design decisions."*

PARBAUGHS apply: when the design-bot is about to make a claim like "Stripe uses Inter at 16px for body" or "Linear's hover state uses opacity 0.7" — verify by reading the actual surface (we have Playwright MCP) or WebSearching the canonical reference, not by recalling a probabilistic guess. Aligns with P1 (depth-of-research over speed-of-closure).

---

## When to revisit for full install

Trigger conditions for re-evaluating Huashu Design as INSTALLED (not just REFERENCE-ONLY):

1. **Launching `parbaughs.com` marketing site** — Huashu's HTML-native prototype generation maps directly to a static landing-page deliverable.
2. **Producing season-end Caddy Notes recap decks (PPTX / PDF)** — Huashu's `export_deck_pptx.mjs` + `html2pptx.js` give us editable PowerPoint output.
3. **Designing onboarding decks for new members** — same export pipeline.
4. **A specific motion-design need that Framer-Motion + CSS keyframes can't satisfy** — `render-video.js` would render HTML animations to MP4 for share-worthy moments.

If any of those trigger: re-run the PROP-014-style audit, install scripts/ after `verify.py` check, document ffmpeg dependency, then promote to `~/.claude/skills/huashu-design/`.

---

## License + attribution

Source: MIT License (relicensed 2026-05-14) © 花叔 / @AlchainHust. This distilled doc is internal PARBAUGHS notes derived from public MIT-licensed content; attribution above.

Last verified: 2026-05-20 via WebFetch of `https://raw.githubusercontent.com/alchaincyf/huashu-design/master/SKILL.md` for PROP-014 audit.
