---
name: parbaughs-cross-surface-dependency-audit
description: Criterion 12 enforcement. Every Firestore write surfaces downstream consumers. Member / round / league / coin / event shapes have wide fanout. Grep before write; update consumers in same ship.
trigger: Any ship modifying shared data shape; Critic implementation review verifying consumers updated
owner: Engineer (writes), Critic (verifies)
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-cross-surface-dependency-audit

Encodes Criterion 12 from `docs/agents/CRITIC.md`. Shared data has wide consumer fanout. Audit BEFORE write, update consumers in SAME ship.

## When to invoke

- Adding, removing, or renaming a field on `members/{id}` doc
- Adding, removing, or renaming a field on `rounds/{id}` doc
- Changing the shape of any league-scoped doc (chat, trips, teetimes, wagers, bounties, etc.)
- Restructuring `parcoin_transactions` or any economy-affecting collection

## When NOT to invoke

- Adding new collections (no existing consumers)
- Adding optional fields with null-safe consumers (additive-only schema)
- Read-only work (no shape change)

## Procedure

### Step 1 — Identify the shape change

Concrete write: which doc, which field, what shape change (add / remove / rename / type-change).

### Step 2 — Grep direct cache reads

For member-data: `Grep -rn "fbMemberCache" src/`. Phase 1 audit found 13 files; verify current count per-ship.

For round-data: `Grep -rn "PB.getPlayerRounds\|PB.getRounds\|PB.getRoundsForCourse" src/`

For league-data: `Grep -rn "PB.getLeague\|currentProfile.leagues\|getActiveLeague" src/`

For coin-data: `Grep -rn "PB.getParCoinBalance\|getParCoinLifetime\|parcoin_transactions" src/`

### Step 3 — Grep field-specific consumers

If renaming `members.equippedTitle` → `members.activeTitle`:
- `Grep -rn "equippedTitle" src/` → ALL must update
- `Grep -rn "activeTitle" src/` → none yet (post-rename target)
- Migration write: writes both fields during a window; reads prefer new, fall back to old

### Step 4 — Document the consumer list in Ship Plan

| Consumer file | Use site (line range) | Read or write | Risk if not updated |
|---|---|---|---|
| `src/pages/members.js:1228` | edit form | write | save fails or writes wrong field |
| `src/core/router.js:283` | sidebar avatar | read | display falls back to "Member" default |
| ... | ... | ... | ... |

### Step 5 — Update consumers in SAME ship

Either:
- Synchronously: every consumer updated; old field deleted; one atomic ship
- Migration-window: both fields written during window, reads prefer new, fallback to old; cleanup ship N later

Migration-window pattern is mandatory for non-additive shape changes per CFR category 5.

### Step 6 — Verify rules layer

For any field used in Firestore rules: read `firestore.rules` and confirm the rule still evaluates correctly after the shape change. Rules use field paths literally; field renames break rules silently.

### Step 7 — Critic verification

Critic checks each consumer in the diff is updated. Missing consumer = rejection.

## Worked example: members.equippedTitle rename

A rename touches:
- `src/pages/members.js` (edit form, detail-view display, title-picker dead UI)
- `src/core/data.js` (achievement awards setting title via `equippedTitle`)
- `src/core/router.js` (avatar ring + title display in sidebar)
- `src/core/firebase.js` (claimedFrom merge during member auth load)
- `src/pages/home.js` (engagement / spotlight cards using member title)
- 5-10 other surfaces (feed.js, scorecard.js, scramble.js, etc. — depending on title display sites)

Per Phase 1 audit, member-data fanout is ~13 direct `fbMemberCache` consumers + the broader `PB.getPlayer*` API (extends fanout). A title rename is high-risk; migration-window approach mandatory.

## Anti-patterns

- "I'll grep tomorrow" — write goes in today; consumers break in production
- Citing the "30-file fanout" figure verbatim — verify CURRENT count via grep, don't reuse memorized number
- Updating only the obvious consumers (edit form + display) — feed cards, scoreboards, achievements all touch member data
- Skipping rules verification — server-side rejection is silent (read empty, write reject)

## References

- `docs/agents/CRITIC.md` Criterion 12
- `docs/agents/CRITICAL_FEATURE_REGISTRY.md` Category 5 (data architecture changes)
- `firestore.rules` (read alongside any rules-touching ship)
- PHASE_1_CODEBASE_AUDIT.md DRIFT-9 (member-data fanout actual count)
