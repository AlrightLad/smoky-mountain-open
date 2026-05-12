---
name: parbaughs-caddy-notes-classifier
description: Universal content rules for Caddy Notes per CLAUDE.md "Caddy Notes Writing Standard". Member-facing only — no implementation jargon. Three sections: Recent updates / Roadmap / What's in the bag. Universal content for all members (no tiered differentiation per locked Q-decision).
trigger: Ship close (per ship) or wave gate (per wave); drafting Caddy Notes entry in Ship Plan; reviewing existing entries for compliance
owner: Orchestrator (drafts + publishes)
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-caddy-notes-classifier

Filter every Caddy Notes entry through this skill before commit. Member-facing voice; universal content.

## When to invoke

- Drafting a new Caddy Notes entry in a Ship Plan
- Reviewing an existing entry for leak / jargon compliance
- Cleaning up `src/pages/caddynotes.js` `currentNotes` → `archiveNotes` transition at version bump
- Wave gate — drafting wave-cadence Roadmap section update

## When NOT to invoke

- Internal lessons-learned (different audience — agent + Founder, not members)
- Ship Plan body (Ship Plans are internal — technical detail OK there)
- Architectural design docs (CLUBHOUSE_SPEC, technical-design files)

## The 3 sections

Per ROADMAP.md governance summary:
1. **Recent updates** — last 3 member-relevant ships (universal content)
2. **Roadmap** — wave-transition cadence (universal content)
3. **What's in the bag** — per-ship cumulative (universal content)

Universal content for ALL members. No "founding crew sees X, others see Y." No "Pro tier members see Z." Per locked Q-decision, NO tiered differentiation EVER.

## Universal content rules

### What members see / experience differently

Yes → Caddy Notes entry. Examples:
- "Fixed handicap not refreshing after logging a new round" ✓
- "Added Edit button to your own rounds" ✓
- "Range sessions now appear in the activity feed within 5 seconds" ✓

### Implementation terms / banned vocabulary

Never use:
- matcher, pre-commit, hook
- Firestore, refactor, state, cache, async, helper, persisted
- live, session, listener, payload
- "tech debt", "regression", "architectural"

These leak internal language and reveal stack details that members shouldn't need to care about.

### Meta references / banned

Never write:
- "completed the fix from v8.21"
- "fixed a regression in Ship 5+6"
- "continued from previous version"

Members don't know ship numbers or prior-version state. Each entry stands alone.

### Format

- Start with a verb in plain English: "Fixed", "Added", "Updated", "Improved", "Cleaned up"
- Max 25 words per entry. If you can't describe it in 25 words, it wasn't member-visible
- Past tense (we just shipped this; it's done)

## Pure infrastructure ships

Sometimes a ship doesn't change what members see (new hooks, tests, dev tools). Still write ONE honest short entry:

> "Behind-the-scenes improvements to reliability. Nothing new you can see, but the app is more stable."

Don't pretend infra is a feature. Don't hide it silently.

## Leak protection

- No unshipped pricing
- No internal feature names ("Sanity Halt", "CFR trigger", "Wave 2A spec")
- No architectural detail ("now uses leagueQuery wrapper")
- No competitive intel ("matches what 18Birdies does")

## Worked examples

### REJECT
> "Refactored playnow.js state machine to use a unified liveState pattern; fixed regression from v8.5.x re-assignment bug."

Problems: 4 implementation terms (refactored, state machine, liveState, re-assignment); 1 meta reference (regression from v8.5.x); leaks internal pattern names.

### REWRITE
> "Live round entry is steadier — fewer edge cases where the round wouldn't save."

What members see; plain English; no jargon; under 25 words.

### REJECT
> "Updated firestore.rules to allow commissioners to edit member profiles via the rules-layer amIFounder helper."

Problems: leaks Firestore (security infra) + amIFounder helper name (internal symbol) + commissioner mechanic (might not be member-visible).

### REWRITE
> "Founder can now edit any member's profile from the Members page — useful for fixing typos before someone signs in."

What members see; explains the use case; no jargon.

## Caddy Notes Lifecycle (mechanical)

At every member-visible ship:
1. Move all entries currently in `currentNotes` to top of `archiveNotes`, tagged with the version they shipped under
2. Clear `currentNotes`
3. Add the new version's entries to `currentNotes`
4. Update the tagline under "What's New · v{VERSION}" to reflect current theme

Infrastructure-only ships still get a Caddy Note (the honest one-liner above). Never ship a version bump with no Caddy Note entry.

## Before publishing

Ask: if a member who only uses the app to log golf rounds reads this, would they know what it means? Would they care? If either answer is NO, rewrite.

## References

- CLAUDE.md "Caddy Notes Writing Standard" (canonical)
- CLAUDE.md "Caddy Notes Lifecycle" (mechanical process)
- `docs/agents/PROTOCOLS.md` § P7 (publication protocol)
- `docs/agents/ORCHESTRATOR.md` "Caddy Notes publication" (Orchestrator authority — no Founder approval required)
- `src/pages/caddynotes.js` (the surface; `currentNotes` + `archiveNotes` data structures)
