# B.32 — Custom scrollbar treatment for HQ activity feed

**Status:** Design spec, ready for implementation reference
**Owner:** Design (consultation) → Engineering (HQ holistic polish ship)
**Scope:** `.hq-activity-feed` inside `.hq-activity-feed-shell`
**Tier:** Lands after Phase 1+2 roadmap (no urgency)
**Tokens used:** existing palette only — no new tokens introduced

---

## TL;DR

**Direction:** **D1(a) Editorial-clean.** A 6px brass-tinted thin strip with a chalk-3 track, claret accent on active drag, hover-revealed at rest. No golf motif.

**Why not golf-themed:** the activity feed is a high-frequency surface — users glance at it many times per session. A flag-stick or pencil scrollbar reads cute on first encounter and becomes visual noise on the hundredth. Editorial chrome stays out of the way and inherits the masthead vocabulary. Save the golf motifs for one-time-encounter surfaces (empty states, completion screens, achievement unlocks) where the novelty earns its keep.

**Scoping:** Ship 1 — scoped to `.hq-activity-feed` only. Promote to platform-wide via a `.cb-scroll` utility class in a follow-up ship once the treatment is proven.

---

## D1 — Conceptual direction

**RECOMMENDATION: (a) Editorial-clean.**

Rationale:
1. **Frequency mismatch with novelty.** Golf-themed scrollbar = single-encounter delight, repeat-encounter friction. League Pulse is a back-to-it-every-session surface.
2. **Already-loud neighbors.** The feed sits next to the live round card (cb-green hero), the standings card, and the avatar masthead. Adding a flag-stick rail makes the right rail a circus.
3. **Editorial vocabulary alignment.** Parbaughs editorial = thin rules, brass accents, mono eyebrows, restrained chrome. Default browser gray scrollbar violates this; brass-tinted thin strip honors it without inventing a new visual idiom.
4. **Hybrid (c) is worse than (a).** Hover-reveal already gives us "quiet at rest, present on use." Layering a golf motif on hover is two ideas where one will do.

**ALTERNATIVES rejected:**
- (b) Golf-themed — see TL;DR.
- (c) Hybrid — over-engineered; the editorial treatment already has rest/hover/active states doing distinct work.

**RISK FLAGS:**
- Restrained = easy to miss. Mitigation: chalk-fade gradient at bottom already cues scrollability (existing). Thumb visible at rest at low opacity (not hover-only) so affordance survives even when gradient is hidden by short content.

---

## D2 — Golf motif (declined, but logged for posterity)

If a future ship reverses this call, the strongest motif is **flag stick**:
- Pole = vertical track (1px claret line)
- Cup = bottom anchor (small open circle in chalk-3)
- Ball = thumb (4px white dot with cb-brass ring, draggable)

Rejected here. Documented so a future revisit doesn't redo the comparison.

Other motifs ranked: tee-and-ball (cute, doesn't scale to thumb height), club shaft (illegible at 6px wide), pencil (off-brand — Parbaughs is editorial, not playful-stationery).

---

## D3 — Cross-browser + accessibility

**Chromium/Safari** (primary target — full styling via `::-webkit-scrollbar`):
- Track: `var(--cb-chalk-3)` at 30% opacity (rgba via color-mix)
- Thumb: `var(--cb-brass)` at 50% opacity rest, 80% hover, 100% + claret ring active
- Width: 6px (thumb min-height 32px enforced via `background-clip: padding-box` + min sizing)

**Firefox** (graceful degradation via `scrollbar-width` + `scrollbar-color`):
- `scrollbar-width: thin;`
- `scrollbar-color: color-mix(in oklab, var(--cb-brass) 50%, transparent) color-mix(in oklab, var(--cb-chalk-3) 30%, transparent);`
- No hover/active state distinction (Firefox doesn't expose pseudo-states on scrollbar parts) — accept this; it's a 5% browser share and the rest state is already legible.

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .hq-activity-feed::-webkit-scrollbar-thumb {
    transition: none;
  }
}
```
The opacity transition between rest/hover/active is the only motion; killing it satisfies the constraint without changing the visual.

**Contrast (AA):**
- Thumb at rest: cb-brass 50% over cb-chalk surface → ~3:1 against chalk. Below AA text minimum (4.5:1) but **scrollbar thumbs are non-text UI**; WCAG 1.4.11 requires 3:1 for non-text UI components — passes.
- Thumb on hover: cb-brass 80% → ~5.5:1, well above.
- Thumb active: cb-brass 100% with claret 1px ring → high contrast both states.

**Click target:** Thumb min-height 32px (exceeds 24px floor). On feeds with very long content, browser may shrink thumb below 32px; the `min-height` declaration on `::-webkit-scrollbar-thumb` enforces it for Chromium/Safari.

---

## D4 — Interaction states

| State | Thumb | Track | Notes |
|---|---|---|---|
| **Resting** | cb-brass @ 50% opacity, 6px wide, 32px min-height, 3px radius | cb-chalk-3 @ 30% opacity, 6px wide | Visible but quiet. Not hover-only — affordance survives short content. |
| **Hover (on scrollable area)** | cb-brass @ 80% opacity, same dims | cb-chalk-3 @ 50% opacity | Triggers via `:hover` on `.hq-activity-feed`, not on the scrollbar element itself (which has flaky hover detection across browsers). |
| **Hover (on thumb)** | cb-brass @ 90% opacity | unchanged | Subtle thumb-specific feedback. |
| **Active (during drag)** | cb-brass @ 100% opacity + 1px cb-claret inset ring | cb-chalk-3 @ 50% | Claret ring is the only place claret appears in this component. Signals "you're driving." |
| **Disabled (content fits)** | hidden (browser default — thumb collapses when scrollHeight ≤ clientHeight) | hidden | No CSS needed. |

Transitions: `opacity 120ms var(--ease-default)` on thumb. Reduced-motion strips this.

---

## D5 — Scalability strategy

**RECOMMENDATION: Scoped first, promote to utility second.**

**Phase 1 (this ship):** Scope to `.hq-activity-feed` only. Validates the treatment in production on one surface before rolling out.

**Phase 2 (follow-up ship, separate B-tier item):** Extract to a `.cb-scroll` utility class. Apply to:
- `.sphud-card-full` (scorecard horizontal scroll)
- `.bottomsheet-content` (vertical scroll inside sheets)
- Any future `overflow: auto` surface

**Phase 3 (optional, much later):** Promote to root-level `*` selector with `:where()` to keep specificity at 0. Only after Phase 2 proves no surface-specific conflicts.

**Why not platform-wide on day one:** Custom scrollbars subtly change scroll feel (hit area, momentum-scroll interaction on trackpads). Scoping limits blast radius. If something feels off, it's one surface to fix, not the whole app.

**RISK FLAG:** macOS users with "Show scroll bars: When scrolling" preference will see brief flashes of the styled bar instead of the system overlay. This is correct behavior — the user opted in to scrollbar-on-scroll — but worth noting in QA.

---

## D6 — Gradient + scrollbar coexistence

**Current state (`components.css:1145`):**
```css
.hq-activity-feed-shell::after {
  /* 24px transparent → cb-chalk fade at bottom */
  background: linear-gradient(to bottom, transparent, var(--cb-chalk));
}
```

**Recommendation: gradient stops short of the scrollbar gutter.**

The gradient hints at "more content below" — the scrollbar communicates the same thing more precisely. Overlapping them is redundant *and* the gradient washes out the thumb's lower portion at exactly the moment the user is reaching for it.

**Implementation:**
```css
.hq-activity-feed-shell::after {
  /* existing positioning unchanged */
  right: 8px; /* was 0 — pull off the scrollbar gutter */
  /* the 8px matches the existing padding-right gutter on .hq-activity-feed */
}
```

This leaves a clean 8px column on the right edge for the scrollbar, with the gradient only covering the content column.

**ALTERNATIVE considered:** Mask the gradient with the scrollbar via `mask-image`. Rejected — fragile across browsers, no real upside vs. just narrowing the gradient.

---

## Implementation spec (Chromium/Safari)

```css
/* B.32 — HQ activity feed custom scrollbar
   Scoped to .hq-activity-feed; do not promote to a global selector
   without explicit follow-up ship. */

.hq-activity-feed {
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color:
    color-mix(in oklab, var(--cb-brass) 50%, transparent)
    color-mix(in oklab, var(--cb-chalk-3) 30%, transparent);
}

/* Chromium/Safari */
.hq-activity-feed::-webkit-scrollbar {
  width: 6px;
}

.hq-activity-feed::-webkit-scrollbar-track {
  background: color-mix(in oklab, var(--cb-chalk-3) 30%, transparent);
  border-radius: 3px;
  transition: background 120ms var(--ease-default);
}

.hq-activity-feed::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--cb-brass) 50%, transparent);
  border-radius: 3px;
  min-height: 32px;
  transition: background 120ms var(--ease-default), box-shadow 120ms var(--ease-default);
}

/* Hover on the scrollable area (not the bar itself — more reliable detection) */
.hq-activity-feed:hover::-webkit-scrollbar-track {
  background: color-mix(in oklab, var(--cb-chalk-3) 50%, transparent);
}

.hq-activity-feed:hover::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--cb-brass) 80%, transparent);
}

/* Hover directly on thumb */
.hq-activity-feed::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--cb-brass) 90%, transparent);
}

/* Active drag */
.hq-activity-feed::-webkit-scrollbar-thumb:active {
  background: var(--cb-brass);
  box-shadow: inset 0 0 0 1px var(--cb-claret);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hq-activity-feed::-webkit-scrollbar-track,
  .hq-activity-feed::-webkit-scrollbar-thumb {
    transition: none;
  }
}

/* Gradient adjustment — pull off the scrollbar gutter */
.hq-activity-feed-shell::after {
  right: 8px; /* was 0 */
}
```

---

## QA checklist (for engineering ship)

- [ ] Chrome/Edge: thumb visible at rest, brightens on area hover, claret ring on drag
- [ ] Safari: same as above
- [ ] Firefox: thin brass thumb on chalk track at rest; no hover/active distinction (expected)
- [ ] Reduced motion: opacity transitions disabled, visual unchanged at rest
- [ ] Short content (no overflow): scrollbar not rendered, no visual residue
- [ ] Long content: thumb honors 32px min-height
- [ ] Gradient stops 8px short of right edge, doesn't wash thumb
- [ ] macOS "always show scrollbars" preference: styled bar renders correctly (no system overlay leak-through)
- [ ] Dark theme variants (cb-chalk-3 changes per theme — verify thumb still hits 3:1 against thumb's local chalk surface in each theme: blueprint, claret, fairway, dusk, etc.)

---

## Theme variant notes

The 7 theme overrides in `base.css` (lines 359–441) all redefine `--cb-chalk-3` and `--cb-brass`. Because the spec uses `color-mix` against tokens (not hex), it inherits each theme's palette automatically. **Do not hardcode hex** — keep all references to tokens.

One flag: in the highest-contrast theme (line 423, `#F0E4CC` chalk / `#C9B689` chalk-3), the thumb-against-track contrast at 50% brass opacity may dip below 3:1. Verify in QA; if it fails, bump rest opacity to 60% globally — the change is imperceptible on lighter themes.

---

## Out of scope (for future B-tier items)

- Horizontal scrollbar treatment (sphud-card-full, etc.) — Phase 2
- Scroll-position indicator beyond the bar (e.g. "12 of 47 events")
- Pull-to-refresh / loading affordance integrated with bar
- Mobile (touch) behavior — iOS/Android use native momentum scrollers; this spec is desktop-pointer only

---

*End of B.32 spec. Ready to attach to backlog.*
