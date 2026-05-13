# PARBAUGHS Aesthetic Brief

**Authored:** 2026-05-13 (Step 0 of Track B Phase 1 — Design System Foundation)
**Status:** Source of truth for every subsequent UI decision. Critic gates on drift back to this brief.
**Inputs:** Founder directive (north star), `docs/CLUBHOUSE_SPEC.md` (mobile spec, 2171 lines), `docs/agents/ships/W1.S1.md` (locked design-system Vision), existing `src/styles/base.css` (HQ tokens — coexist, do not break).

---

## One-sentence brand

PARBAUGHS is a **country club after hours, run by people who know the game**. Premium without being precious. Restrained without being austere. Data-rich without being techy.

## Brand voice in visual terms

- **Editorial, not corporate.** Type weights vary deliberately for hierarchy; we don't pack 6 grays into one screen.
- **Confident with whitespace.** Strava's density when there's something to say; Whoop's calm when there isn't.
- **Earned, not assigned.** Brass accents are scarce because earning matters — a leaderboard winner, an achievement, a personal best. If everything is highlighted, nothing is.
- **Member-built.** No corporate gradients, no FAANG-style overuse of accent color, no neon. The aesthetic is "the club has standards" — those standards are visible.

## Density philosophy

**Closer to Strava than to Linear.** Members have rich content (rounds, scores, FIR/GIR/putts, achievements, leagues, friends, wagers) and want it scannable on a phone with light glance. Linear's whitespace-heavy minimalism would feel empty on a Round History page. Whoop's data-density without color noise is the calibration: dense numerical content + restrained color = legible at glance + premium.

**Rules of thumb (calibration, not commandments):**
- Above the fold on a key screen: at least one piece of substantive content, not just chrome.
- Less than 3 distinct text sizes per screen on average. More than 4 = redesign.
- Numerical data displays at slightly tighter spacing than text content. Numbers are scannable; text needs breathing room.

## Color philosophy

The palette is **billiard green (felt) + chalk (ink) + brass (achievement)** — three colors doing real work, plus semantic statuses (moss/amber/claret/teal) used **only** for status semantics.

| Color | Role | Where it lives | Where it does NOT live |
|-------|------|----------------|------------------------|
| **Billiard green** (`--pb-billiard-green-*`) | Surface — the table felt | Page background, surfaces, raised panels, interactive containers | NEVER as text or accent. Greens are exclusively for surface structure. |
| **Chalk** (`--pb-chalk-*`) | Ink — the writing on the green | Primary text, secondary text, muted captions, hairline borders | NEVER as a fill color for emphasis. Chalk is structural ink. |
| **Brass** (`--pb-brass-*`) | Achievement accent | Earned badges, leaderboard champion, ParCoin amounts, milestone celebrations, ONE primary action when it's celebratory (e.g., "Claim wager winnings") | Primary CTAs that aren't achievement-related ("Log a round" is chalk-on-green; "Submit" buttons are chalk-on-green). Borders. Body text. Generic emphasis. |
| **Status palette** (moss / amber / claret / teal) | Semantic status only | Success state (moss), caution (amber), error (claret), neutral info (teal) | Decoration. Achievement (use brass). Generic emphasis. |
| **Leather** (`--pb-leather-*`) | Warmth — used rarely | Optional warm-earth element for content that wants depth without status implication (e.g., archival sections) | Common surfaces. Use sparingly. |

**Brass scarcity rule:** at most 2 brass elements on any single screen. If you find yourself reaching for brass to emphasize a third thing, the design is wrong — fix the hierarchy with weight/size before reaching for accent color. This is the test that separates "premium" from "loud."

## Typography philosophy

**Editorial weight, system stack.** We're NOT loading a custom display font (Maison Neue/Tiempos territory) in Phase 1 — performance + simplicity wins for ops dashboards. **System stack with intentional weight + size hierarchy** delivers 85% of the editorial feel.

- **Display + headings (`--font-display`):** system-ui (Apple SF Pro on Apple, Segoe UI on Windows, Roboto on Android). Bold weights only at the largest scales. Tight letter-spacing (-0.02em) on display.
- **Body (`--font-body`):** same family for visual coherence. Regular and medium weights only — semibold is reserved for emphasis within body, never as a default body weight.
- **Numeric (`--font-numeric`):** mono with tabular numerals. Every score, leaderboard position, ParCoin balance, handicap, percentage. Tabular numerals are non-negotiable on data displays — they make scanning sortable lists feel calm. Without them, columns of numbers visually wobble.

**Type hierarchy on a screen:** display → heading → body → caption. Most screens use only 3 of these 4. If you need 5 distinct sizes, the screen is doing too much.

## Motion philosophy

**Gestural, smooth, never decorative.** Every animation must communicate state change or affordance. Bouncing badges, parallax hero images, decorative entrances — all forbidden. Motion serves comprehension.

- Hover / focus transitions: `--duration-fast` (160ms) with `--ease-out`. Feels responsive without being twitchy.
- State changes (round submitted, badge earned): `--duration-medium` (240ms) — long enough to register, short enough not to block.
- Celebration (the rare achievement moment): `--ease-spring` may be used. Once per surface.
- Reduced-motion users get instant transitions everywhere except focus rings (which remain visible for accessibility).

## Composition patterns to repeat

Three patterns the team uses; novel layouts must justify themselves against these:

1. **Hairline rules + brass underlines.** Section dividers are 1px chalk-300 hairlines. Achievement section markers use a 2px brass underline that's shorter than the heading (3rem max). Visual rhythm without ornamentation.
2. **Chalk-on-felt.** Primary text on green surfaces is chalk; never inverted. Even in the dark theme, the metaphor (chalk on felt) is preserved — the dark theme deepens the green; chalk stays warm-white.
3. **Tabular data, hairline-separated rows.** Round history, leaderboards, member directories all use the same pattern: hairline-separated rows with consistent column widths, mono numerals for scores, ink for names, brass ONLY when ranking #1 or achievement-earned.

## Anti-patterns (what to NEVER do)

- **Brass for primary CTAs.** "Log a round" is chalk-on-green. Brass is for "you earned this." Confusing the two flattens the brand.
- **More than 2 accent colors per screen.** A red error + a brass champion + a moss success + a teal info = the screen is doing 4 things. Pick the one signal that matters most.
- **Decorative motion.** A heart pulse on the "like" button = OK (state change). A logo that breathes on the loading screen = NOT OK (decoration).
- **Generic shadows.** Don't use `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` because it "looks nice." Shadows communicate elevation; use the elevation tokens for the surface tier you're rendering.
- **System-fallback ✓ marks where SVG icons exist.** Per W1.S1 LB1 — no emojis. Period. SVG icon library only.

## Non-goals (Phase 1)

- Light theme — Phase 1 is dark theme (billiard-green-900 page). Light-theme support comes Phase 2 or later, contingent on Founder ratification.
- Custom-font loading (Maison Neue, Tiempos, etc.) — defer to a future phase if Founder ratifies; today system stack is the right tradeoff.
- Wordmark / logo treatment — out of scope; that's a brand decision that requires Founder direction separately.

## Cross-references

- North star: Strava mobile app, Whoop data displays, Oura ring app
- Internal source: `docs/CLUBHOUSE_SPEC.md` (mobile design system, locked palette `--cb-*` family)
- Locked Vision: `docs/agents/ships/W1.S1.md`
- This brief is the Founder-ratification baseline for `docs/reports/_assets/design-tokens.css`
