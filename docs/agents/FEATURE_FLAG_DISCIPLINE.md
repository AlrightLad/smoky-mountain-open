# Feature Flag Discipline

When feature flags are required vs optional, naming convention, lifecycle, member-visibility patterns, and removal discipline.

## Why this exists

Wave 2 reveal-moments require staged-but-not-revealed work (e.g., W2.S0 ships chrome on staging without going live). Wave 4 identity migration may need feature flags for graceful rollout. Without governance, flags accumulate as tech debt — never removed, drift in meaning, create code complexity over time.

## When feature flags are REQUIRED

Feature flag is mandatory when:

1. **Wave reveal-moment** — work ships incrementally to staging but reveal as cohesive whole. Per W2.S0 architecture: foundation ships first to staging, masthead + content reveal sequentially, all behind reveal flag until Wave 2 → Wave 3 transition.

2. **Member-cohort rollout** — feature rolls to subset of members before full rollout (e.g., founding 20 get feature, broader rollout follows). Cohort identification via feature flag check, not member ID list.

3. **Reversible production toggle** — feature ships live but Founder retains ability to disable without code revert (e.g., Parcoin pricing tier introduction, new social feature that may need pause).

4. **A/B testing** — two member groups see different feature variants for evaluation. Future post-Wave-1 scope.

5. **Migration safety** — feature flag gates downstream consumer activation until upstream migration completes (W4.I3 migration → W4.I5 profile redesign gated by migration-complete flag).

## When feature flags are OPTIONAL

Feature flag may be used (judgment call) when:

- Ship introduces new feature with conservative tone (Founder wants the ability to disable quickly if member feedback negative)
- Feature has edge case complexity that needs production verification before full activation
- Performance impact uncertain at scale

## When feature flags are FORBIDDEN

Do NOT use feature flags for:

- Bug fixes — bugs fix in place, not gated
- Architectural refactors — no member-visible behavior change to gate
- Internal tooling — admin tooling visible only to Founder doesn't need flags
- Token/CSS-only changes — design system changes don't gate

## Naming convention

Format: `flag.<scope>.<feature>`

Where:
- `<scope>` = `platform` | `wave2reveal` | `wave3reveal` | `wave4reveal` | `migration` | `cohort.<name>`
- `<feature>` = kebab-case feature identifier

Examples:
- `flag.wave2reveal.hq-foundation` — Wave 2 reveal gate
- `flag.wave2reveal.hq-home-banded-grid` — specific Wave 2 surface
- `flag.migration.identity-migration-complete` — W4.I3 migration gate
- `flag.cohort.founding-20.parcoin-shop` — cohort-scoped Parcoin shop early access
- `flag.platform.crisis-banner-dismissible` — production toggle for crisis banner behavior

## Storage location

Feature flags live in Firestore at `platform/flags/{flagName}` with shape:

```json
{
  "name": "flag.wave2reveal.hq-home-banded-grid",
  "value": false,
  "introduced": "<ISO timestamp>",
  "introduced_by_ship": "W2.S1",
  "scheduled_removal": "<ISO timestamp or 'pending'>",
  "removal_ship": "<ship-id or 'pending'>",
  "description": "Gates HQ Home banded grid layout reveal until Wave 2 → Wave 3 transition",
  "affected_files": ["<file paths>"]
}
```

Cohort-scoped flags additionally specify:
```json
{
  "cohort_member_ids": ["<memberId>", "<memberId>"],
  "cohort_description": "Founding 20"
}
```

## Read pattern

Client-side flag read via `PB.flags.isEnabled(flagName, memberId?)`:
- Loads flag state from Firestore on app boot
- Caches in memory for session
- Listener updates cache on remote flag state change
- For cohort flags: passes memberId for cohort membership check
- Returns boolean

Hard rule: NO production code reads flag state directly from Firestore. Always via `PB.flags.isEnabled()` helper for consistent caching + listener handling.

## Lifecycle

Every feature flag follows this lifecycle:

### 1. Introduction
- Flag introduced in ship plan, named per convention
- Created in Firestore with `value: false` by default
- Production code consumes flag via `PB.flags.isEnabled()`
- Documented in ship's caddy notes (member-visible if member-affecting)

### 2. Ramp
- Flag value changes from `false` → `true` (or per-cohort changes)
- Decision-bubble fires if ramp-up requires Founder approval (any flag affecting >10% of members)
- Crisis banner NOTICE may accompany if member-visible behavior changes

### 3. Fully on
- Flag value remains `true` for stable period (≥1 sprint)
- Verification: no member-visible regression, no Critic rejection of dependent ships
- Performance / cost / Data Integrity verification holds

### 4. Removal scheduled
- Flag removal ship added to backlog with severity-tag
- `scheduled_removal` timestamp set in Firestore flag doc
- `removal_ship` references target ship for code removal

### 5. Removed
- Flag-dependent code paths in production source: ONE path remaining (the flag-true path)
- `PB.flags.isEnabled()` call removed
- Firestore flag doc deleted
- Caddy Notes entry: "Behind-the-scenes cleanup complete"

## Removal discipline

Per locked governance: flags do NOT live indefinitely. Every flag has a removal ship.

### Removal triggers

- Flag has been `true` for ≥1 sprint with no regression
- Flag is no longer member-relevant (feature stable)
- Wave transition completes (Wave 2 reveal flags removed at Wave 2 → Wave 3 transition)
- Founder rules removal at retrospective

### Removal ship scope

Removal ships are LOW RISK:
- Pre-flight audit confirms no remaining `false`-path consumers in source
- Code removal is mechanical (delete `if (PB.flags.isEnabled(...))` wrapper, preserve inner block)
- Smoke verifies feature still works without flag wrapper
- Firestore flag doc deleted last (after code deploys clean)

### Stale flag detection

Per DOC_FRESHNESS_REVIEW.md cadence: every wave-close, audit all active flags. Flag stale (>2 sprints active, no scheduled removal) → surface to Founder, escalate removal ship.

## Member visibility via Settings

For flags introducing experimental features, member opt-in via Settings is acceptable pattern:

- Settings → "Try new things early" toggle
- Members who opt-in receive cohort flag enabling experimental features
- Default OFF for all members
- Founding 20 may have default ON during beta period per Founder direction

Hard rule: NEVER charge members for features hidden behind feature flags. Flags are operational not monetization.

## Cross-references

- Memory #28 (Monetization model — flag-gated features are not paid tier gating)
- W1.S14 Vision (Settings opt-out architecture)
- W1.I5 Vision (Crisis banner pattern complements feature flags)
- W4.I3 Vision (Migration-complete flag pattern)
- DOC_FRESHNESS_REVIEW.md (stale flag audit cadence)
- POST_PUSH_RETROSPECTIVE.md Component 1 (flag introductions captured)

## Activation

This protocol activates at Phase 1 commit. First feature flag under this protocol is whatever Wave 2 reveal flag W2.S0 introduces. All subsequent flags follow lifecycle.
