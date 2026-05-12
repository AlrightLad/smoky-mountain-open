---
name: parbaughs-firestore-writer-audit
description: Verify Firestore writes use the correct wrapper. `leagueQuery` + `leagueDoc` for league-scoped collections (LEAGUE_SCOPED at utils.js:13); direct db.collection() for global. Grep for v8.0 P4 rule-damage suspects.
trigger: Any ship that writes Firestore documents; any audit pass on writer surfaces (Bounties / Wagers / Scrambles / Trips per V12-style audits)
owner: Engineer (writes), Critic (audits)
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-firestore-writer-audit

Wrapper-name reference + audit pattern for Firestore writes. The wrapper names are `leagueQuery` and `leagueDoc` (NOT `leagueCollection` — that's a stale governance-doc artifact corrected at Phase 1).

## When to invoke

- Engineer writes any Firestore document — verify wrapper choice
- Critic reviews Firestore-write surface (sweep for direct `db.collection()` bypasses on league-scoped collections)
- V12-style audit of suspect surfaces (Bounties, Wagers, Scrambles, Trips — flagged for v8.0 author-only rule damage)

## When NOT to invoke

- Read-only audits (different skill — namespace-collision-check or cross-surface-dependency-audit)
- Caddy Notes / governance edits (no Firestore involvement)

## The wrappers

Defined in `src/core/utils.js`:

```js
// utils.js:13 — Enumerates league-scoped collections
var LEAGUE_SCOPED = ["rounds","chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions","partygames"];

// utils.js:18 — Read wrapper
function leagueQuery(name) { /* returns db.collection(name).where("leagueId", "==", activeLeague) */ }

// utils.js:34 — Write wrapper
function leagueDoc(name, data) { /* injects leagueId into data for league-scoped collections */ }
```

## Decision tree

**Is the collection in `LEAGUE_SCOPED`?**

- YES → READ: `leagueQuery(name).get()` / `.onSnapshot(...)`. WRITE: `db.collection(name).add(leagueDoc(name, data))` (or `.doc(id).set(leagueDoc(name, data), {merge:true})`).
- NO → READ: `db.collection(name).get()`. WRITE: `db.collection(name).add(data)` directly. No wrapper.

Global (non-LEAGUE_SCOPED) collections: members, courses, course_reviews, photos, parcoin_transactions, notifications, pendingPush, config, errors, presence, attestations, partygames (NOTE: partygames IS in LEAGUE_SCOPED — verify), pending_celebrations, feature_requests, reports.

## Audit procedure (Critic / Engineer V12-style)

1. `Grep -rn "db.collection(\"<collection>\")"` across src/
2. For each match in LEAGUE_SCOPED collection:
   - Read context: is it followed by `.where("leagueId" ...)` (manual filter)? Pass.
   - Followed by `.get()` or `.onSnapshot(...)` without `.where("leagueId")` → potential isolation leak; verify with Critic.
   - Write path: `.add(...)` or `.set(...)`. Verify the data arg is wrapped in `leagueDoc(name, data)` or includes `leagueId` field manually.
3. Document findings in V12 audit report (per Wave 1 / Ship 5+9+ V12 audits)

## P4 v8.0 rule-damage suspects

These surfaces are flagged for V12 audit per `project_hq_completion_sequence.md` memory:

- Bounties (`src/pages/bounties.js`) — Ship 5+9
- Wagers (`src/pages/wagers.js`) — Ship 5+10
- Scrambles (`src/pages/scramble.js` + `scramblelive.js`) — Ship 5+11
- Trips (`src/pages/trips.js`) — Ship 5+12

Pattern to look for: `db.collection("bounties").doc(id).update({...})` without verifying current `request.auth.uid == resource.data.author` server-side rule alignment. v8.0.0-rc1 rules tightened author-only writes; surfaces written pre-rule-tightening may still attempt updates that rules now reject silently.

## Anti-patterns

- Using `leagueCollection` (does not exist; was a governance-doc typo corrected at Phase 1)
- Mixing direct `db.collection()` writes with later `leagueDoc()` wrapping (the wrapper mutates the data object in place; ordering matters)
- Assuming a global collection is league-scoped (or vice versa) without checking `LEAGUE_SCOPED` array
- Auditing without grep — visual scan of a 2,000-line file misses uses

## References

- `src/core/utils.js:13-39` (canonical wrapper definitions)
- `firestore.rules` (server-side enforcement; verify ALL audited writes pass server-side check)
- `docs/agents/SANITY_HALT.md` Category 6 (bad app posture / drift)
- PHASE_1_CODEBASE_AUDIT.md DRIFT-1 (wrapper-name correction history)
- `project_hq_completion_sequence.md` memory (Wave 1 V12 audit order)
