# Taste-Skill (Leonxlnx) — distilled reference

**Authored:** 2026-05-20
**Source:** `https://github.com/Leonxlnx/taste-skill` (MIT, 18.3k stars)
**Status:** REFERENCE-ONLY per PROP-014. Not installed as a skill (overlap with `anthropics/skills/frontend-design`); this doc captures the net-new value for ad-hoc consultation.
**Used by:** design-bot bubble during P7 deliberation; agents authoring new src/pages/* surfaces.

---

## Why distilled (not installed)

Taste-Skill ships 12 variant SKILL.md files (`taste-skill`, `gpt-tasteskill`, `image-to-code-skill`, `imagegen-frontend-mobile`, `imagegen-frontend-web`, `redesign-skill`, `soft-skill`, `minimalist-skill`, `brutalist-skill`, `brandkit`, `stitch-skill`, `output-skill`). Heavy overlap with Anthropic's `frontend-design` and Impeccable's 23-command surface. Net-new differentiators worth keeping:

1. **Three explicit tunable parameters** with 1-10 ranges per dimension.
2. **A specific anti-slop "banned" list** that names the AI-template tells more bluntly than `frontend-design`.
3. **Mobile-stability mandate** (`min-h-[100dvh]` vs `h-screen`) — directly applicable to our 44pt-touch-target discipline.

---

## The three parameter knobs

Set per surface. Default reference value in brackets matches Taste-Skill's `design-taste-frontend` SKILL.md. PARBAUGHS recommended values per surface noted on the right.

### 1. DESIGN_VARIANCE (1=Perfect Symmetry → 10=Artsy Chaos) [default: 8]

| Range | Tactical signals | PARBAUGHS surfaces |
|---|---|---|
| 1-3 | Centered layouts, symmetrical grids, equal padding | Settings, forms, profile edit |
| 4-7 | Overlapping margins, varied aspect ratios, offset headers | Dashboard, Activity feeds, League standings |
| 8-10 | Masonry, fractional CSS Grid, massive empty zones | Caddy Notes, marketing/onboarding, share cards |

**Rule:** at variance ≥ 4, "centered Hero/H1 sections are strictly banned." Translate: when we're showing identity-driven sections (Clubhouse welcome, season-end), break out of centered-hero templates.

### 2. MOTION_INTENSITY (1=Static → 10=Cinematic) [default: 6]

| Range | Tactical signals | PARBAUGHS surfaces |
|---|---|---|
| 1-3 | CSS hover/active states only | Settings, forms |
| 4-7 | `transition: all 0.3s` with transform/opacity | Most app pages, tab nav |
| 8-10 | Framer-Motion choreography, scroll-triggered reveals | Hole-by-hole replay, season-end recap |

**Hardware-acceleration discipline:** animate ONLY `transform` and `opacity`. Never `useState` for continuous animations (causes mobile collapse — known PARBAUGHS B.43 cousin).

### 3. VISUAL_DENSITY (1=Art Gallery → 10=Pilot Cockpit) [default: 4]

| Range | Tactical signals | PARBAUGHS surfaces |
|---|---|---|
| 1-3 | Generous white space, huge section gaps | Caddy Notes intro, share cards |
| 4-7 | Standard app spacing | Dashboard, scorecards |
| 8-10 | Minimal padding, 1px dividers, monospace numbers | Leaderboard table, hole-by-hole detail |

---

## The anti-slop "banned" list (verbatim from source, organized)

### Typography bans
- **"Inter font is strictly banned."** (Translate for PARBAUGHS: we already use the Clubhouse font stack — this rule keeps us from drifting toward Inter when adding new pages.)
- Serif fonts prohibited for dashboards/software UIs.
- No massive H1 typography as the primary visual anchor.

### Visual sins
- **"The 'AI Purple/Blue' aesthetic is strictly BANNED."** No purple-to-blue gradients on any surface.
- No neon outer glows; use inner borders instead.
- **No pure black (`#000000`).** Use Zinc-950 or Charcoal. (PARBAUGHS check: confirm `src/styles/base.css` neutral-darkest token doesn't hit `#000`.)
- No gradient text fills on large headers.

### Layout violations
- **Centered Hero/H1 banned** at variance ≥ 4.
- No 3-column equal card grids; use zig-zag or asymmetric layouts.
- **No `h-screen` for heroes.** Mandatory `min-h-[100dvh]` for mobile stability. ✅ DIRECT PARBAUGHS APPLICABILITY — fixes mobile-safari iOS toolbar collapse on full-height sections.

### Content red flags (matters for our 20 founding members + demo content)
- No generic names ("John Doe"); use creative, realistic alternatives.
- No fake uniform data ("99.99%"); use organic metrics ("47.2%").
- No startup clichés ("Nexus", "Acme", "SmartFlow") — already aligned with our Parbaughs identity.
- No filler copy ("Elevate", "Seamless", "Unleash") — already aligned with Caddy Notes voice.

---

## DO-guidance worth keeping

### Dependency discipline
*"Before importing ANY 3rd party library... you MUST check `package.json`. If the package is missing, you MUST output the installation command."*

PARBAUGHS apply: when introducing any new dep, the agent surfaces the install command + bundle-size estimate before adding it. Reinforces our zero-budget-beyond-Firebase-Blaze stance.

### State + components
- Client components required for interactivity (in vanilla-JS terms: anything that mutates DOM after first paint).
- Isolate magnetic/perpetual animations in leaf components — don't put them in parents that re-render.
- **Never use `useState` (React) / state-driven re-render for continuous animations.** vanilla-JS equivalent: never drive a CSS animation via `requestAnimationFrame` setState loop; use CSS keyframes or `transform`/`opacity` transitions instead.

### Responsiveness
- Asymmetric layouts (variance 4-10) MUST collapse to single-column on mobile (`< 768px`).
- `max-width: 1400px; margin-inline: auto` for top-level containers.
- No horizontal scroll on mobile; aggressive width containment.

### Interaction completeness
All interactive states are MANDATORY:
- **Loading** — skeletal loaders matching the eventual layout
- **Empty** — beautifully composed, not "no data yet"
- **Error** — inline reporting, not modal disruption
- **Tactile** — e.g., `transform: translateY(-1px)` on `:active`

---

## How to invoke during design work

Distilled-doc consultation pattern (paste into design-bot brainstorm prompt as needed):

```
Per .claude/state/design-research/taste-skill-distilled.md:
- Target variance: {1-10}
- Target motion: {1-10}
- Target density: {1-10}
Run the anti-slop banned-list check on this surface. Confirm:
  □ No Inter, no AI-purple gradient, no #000, no centered hero at variance >= 4
  □ min-h-[100dvh] for full-height (not h-screen)
  □ No 3-column equal grid
  □ All 4 interactive states present (loading/empty/error/tactile)
```

---

## Files NOT distilled

These Taste-Skill variants were skimmed but not captured here. Add separately if needed:

- `gpt-tasteskill/SKILL.md` — variant tuned for GPT/Codex; we use Claude, skip.
- `image-to-code-skill/SKILL.md` — image-first workflow; we have Playwright + multimodal Read.
- `redesign-skill/SKILL.md` — refactor-existing-UI variant; reuses same anti-slop list.
- `soft-skill/SKILL.md`, `minimalist-skill/SKILL.md`, `brutalist-skill/SKILL.md` — style-specific variants; consult `imagegen-frontend-web/SKILL.md` in the source if a future ship targets one of these styles deliberately.
- `brandkit/SKILL.md`, `stitch-skill/SKILL.md`, `output-skill/SKILL.md` — peripheral to our scope.

---

## License + attribution

Source: MIT License © 2026 Leonxlnx. This distilled doc is internal PARBAUGHS notes derived from public MIT-licensed content; attribution above.

Last verified: 2026-05-20 via `git clone --depth 1` of pbakaus/impeccable for PROP-014 audit (Taste-Skill SKILL.md content fetched separately via raw.githubusercontent.com).
