# Phase 2 Migration Plan — Ops Dashboards → `--pb-*` Token System

**Status:** Plan only — DO NOT execute as part of Phase 1.
**Phase 1 (this build):** Foundation tokens + components + reference page + design-bot v2 skill ship. Existing ops dashboards continue to use their legacy inline tokens and dashboard.css palette.
**Phase 2 (this plan):** Re-skin the 6 ops dashboards onto the canonical `--pb-*` token system, file by file, with screenshot-based regression checks.

Round-trip test's `[design-tokens]` informational scan (Phase 1 baseline as of 2026-05-13):

| Dashboard               | raw-hex | raw-px | raw-ms |
|-------------------------|--------:|-------:|-------:|
| dashboard.html          | 0       | 5      | 0      |
| activity.html           | 0       | 13     | 0      |
| proposals.html          | 0       | 17     | 0      |
| discussion-bubbles.html | 0       | 45     | 0      |
| main-flows.html         | 6       | 48     | 1      |
| index.html              | 0       | 20     | 0      |

These are the violations Phase 2 must eliminate.

---

## Token-by-token mapping (legacy → canonical)

The existing dashboard.css uses `--bg-page`, `--accent-brass`, `--accent-moss`, etc. with cooler-cyan hex values (`#0f1419`, `#c9a961`). The canonical `--pb-*` palette uses warmer billiard-green values. Migration aliases the old names to new tokens to minimize per-file edits.

### Stage 2A — Alias layer (drop-in compatibility)

Add to `docs/reports/_assets/dashboard.css` near the top:

```css
/*
 * Phase 2 migration alias layer.
 * Old --bg-* and --accent-* names redirect to canonical --pb-* tokens.
 * This file is the CONSUMER of design-tokens.css; design-tokens.css must
 * be loaded first (already true via <link order in HTML).
 */
:root {
  --bg-page:           var(--pb-billiard-green-900);   /* was #0f1419 */
  --bg-card:           var(--pb-billiard-green-800);   /* was #1a1f2e */
  --bg-elevated:       var(--pb-billiard-green-700);   /* was #232838 */
  --bg-input:          var(--pb-billiard-green-700);   /* was #14181f */
  --border-subtle:     rgba(216, 208, 192, 0.08);      /* was #2a3142 */
  --border-strong:     rgba(216, 208, 192, 0.16);      /* was #3a4256 */
  --text-primary:      var(--pb-chalk-50);             /* was #e8ebf0 */
  --text-secondary:    var(--pb-chalk-200);            /* was #9ba4b5 */
  --text-tertiary:     var(--pb-chalk-400);            /* was #5a6478 */
  --text-inverse:      var(--pb-billiard-green-900);   /* was #0f1419 */
  --accent-brass:      var(--pb-brass-500);            /* was #c9a961 (same hex actually) */
  --accent-moss:       var(--pb-success);              /* was #4a8067 (same hex) */
  --accent-claret:     var(--pb-error);                /* was #9c4a4a (same hex) */
  --accent-teal:       var(--pb-info);                 /* was #4a8a9c (same hex) */
  --accent-amber:      var(--pb-warning);              /* was #d4a857 (same hex) */
  /* Spacing scale ALREADY uses --space-N — that family carries over */
  --duration-default:  var(--duration-fast);
  --ease-default:      var(--ease-out);
}
```

Effect: every existing `var(--bg-page)` reference in dashboard.html starts rendering the canonical `--pb-billiard-green-900` instead of the legacy `#0f1419`. **Zero per-page edits needed for the alias layer to take effect.** The visual change: the cooler navy palette warms up to the canonical billiard green.

### Stage 2B — Token migration (per file, file-by-file)

For each dashboard, find and replace:

| Legacy in HTML | Canonical replacement |
|----------------|-----------------------|
| `var(--bg-page)` → `var(--bg-page)` (resolved via alias — no edit) | (no change after Stage 2A) |
| Raw `#0f1419`, `#1a1f2e`, etc. literal hex | `var(--pb-billiard-green-NNN)` |
| Raw `12px`, `16px` literal px on `padding`/`margin` | `var(--space-N)` token |
| Raw `200ms` literal duration | `var(--duration-fast)` or `var(--duration-medium)` |
| Inline-defined `.page-nav` / `.nav-brand` CSS in each HTML | Move to `dashboard.css` once, import everywhere |

The page-nav CSS currently lives inline in every dashboard's `<style>` block (45 lines each). Moving it to dashboard.css and removing the inline copy is a no-visual-change edit that eliminates ~270 lines of duplication.

---

## Order of file migration

Migrate in this order — small / simple first, to validate the mapping before the heavier files:

1. **index.html** (20 raw-px) — smallest violation count, no Chart.js coupling, no complex JS. Migration proves the alias layer + token discovery + manual touch-ups. Visual diff easy to evaluate.
2. **dashboard.html** (5 raw-px, has Chart.js charts) — moderate. Charts read `var(--accent-brass)` etc. via dashboard.js getComputedStyle; aliases should carry through transparently.
3. **activity.html** (13 raw-px) — handoff timeline; scenario-CSS-class color rules need to map to canonical tokens.
4. **proposals.html** (17 raw-px) — heaviest dashboard; lots of decision-bar buttons + section styling. Migrate AFTER the simpler ones validate the approach.
5. **discussion-bubbles.html** (45 raw-px, the rail+thread layout) — most violations because the layout is custom. Migrate last to take advantage of patterns learned upstream.
6. **main-flows.html** (6 raw-hex, 48 raw-px, 1 raw-ms) — note: the 6 raw-hex are in the SVG arrow styling + column-color tokens defined inline. Those column colors (--col-actor, --col-client, etc.) should themselves become `--pb-*` tokens added to design-tokens.css, then referenced.

### Stage 2C — Inline page-nav CSS consolidation

After per-file token migration, delete the duplicated inline `<style>` blocks for page-nav from each dashboard and consolidate into `dashboard.css`. ~270 lines removed. Single source of truth for nav styling. `scripts/inject-page-nav.py` deprecated (the nav CSS lives in the shared stylesheet by then, and the HTML markup is stable across all 7 dashboards).

---

## Visual regression check approach

Before any per-file edit:

1. Open the dashboard in a headed browser; capture a full-page screenshot at three viewports (1440 desktop, 1024 tablet, 375 phone).
2. Save baseline screenshots to `.claude/state/design-system/visual-baseline/<dashboard>-<viewport>.png`.

After migration:

3. Re-capture screenshots at the same viewports.
4. Visual diff (eyeball OR `pixelmatch` if Founder wants automation).
5. Differences SHOULD be limited to:
   - Background color shift from cool navy `#0f1419` → warm billiard `#0a2820`
   - Mild warming of card backgrounds
   - Otherwise identical layout, type, spacing

6. Any unexpected diff (text moved, alignment broke, hover state lost) is a migration bug — root-cause and fix BEFORE proceeding to the next file.

---

## Rollback path

`git revert <migration-commit>` is the primary path. Stage 2A is a single commit (alias layer added). Each per-file migration is its own commit. If migration N causes visual regression, `git revert HEAD` returns to pre-N state. Round-trip test re-runs to confirm the revert is clean.

For each per-file migration, the commit message is:

```
Phase 2 design-system migration: <file>.html — token migration

- <N> raw-px values replaced with --space-* tokens
- <N> raw-hex (if any) replaced with --pb-* tokens
- <N> raw-ms (if any) replaced with --duration-* tokens
- Inline page-nav CSS retained (Stage 2C consolidates)

Visual diff at viewports 1440/1024/375 captured in
.claude/state/design-system/visual-baseline/.
```

---

## Stage 2D — Enforce on commit (tighten the round-trip test)

Once all 6 dashboards are migrated, change the round-trip test's `[design-tokens]` section from "informational" to "enforcing":

```python
# Before (Phase 1 baseline):
print(cyan("  Phase 2 migration scope (informational, not a failure):"))

# After (Phase 2 complete):
for name, (h, px, ms) in legacy_violations.items():
    if h or px or ms:
        failures.append((f"design-tokens:legacy:{name}", f"hex={h} px={px} ms={ms}"))
```

After this change, any future PR that introduces a raw value into the dashboards fails the round-trip test → blocks regen-all → blocks the commit.

---

## Open questions for Founder (deferred until Phase 2 kickoff)

1. **Visual diff tolerance.** Is a 5% pixel diff acceptable (palette warming), or does Founder want pixel-identical layouts and only color shifts? The former is easier to execute; the latter requires Stage 2C inline-CSS consolidation to be deferred to a separate phase.

2. **`--col-actor`, `--col-client`, etc.** (main-flows.html column tokens) — are these promoted to `design-tokens.css` as canonical (since they're brand-defining for the architecture view), or kept as page-local since they don't apply elsewhere?

3. **Phase 2 scheduling.** Is this a single bundled ship (all 6 dashboards in one PR) or per-file PRs spread across cycles? Per-file PRs are safer (smaller blast radius, easier visual diff) but stretch the migration over 2-3 weeks.

---

## Cross-references

- Phase 1 deliverables: `docs/reports/_assets/design-tokens.css`, `docs/reports/_assets/design-system-components.css`, `docs/reports/design-system.html`
- Aesthetic source: `.claude/state/design-system/aesthetic-brief.md`
- Design-bot enforcer: `.claude/state/wave-zero-dry-run/remediation/proposed-design-bot-skill-v2.md`
- Round-trip enforcement section: `tests/round-trip-test.py [design-tokens]`

---

*Plan authored 2026-05-13 by orchestration-team. NOT executed. Phase 2 kickoff is a separate ship cycle gated on Founder ratification of the open questions above.*
