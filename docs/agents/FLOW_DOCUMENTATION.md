# Flow Documentation

The Flow Documenter agent maintains a living architectural visualization at `docs/flows/`. Single-page HTML driven by JSON data file. Members of the orchestration team click an action button (e.g., "invite a new user", "log a round") and the visualization highlights the packages and components involved in that flow, annotating how data passes between them.

## Why this exists

Architecture documentation goes stale fast. Static markdown explaining "how rounds get logged" is correct on the day it's written and slightly wrong a week later. The Flow Documenter solves this by:

1. **Living documentation:** JSON updates ship-by-ship; HTML re-renders automatically
2. **Interactive reference:** orchestration team explores flows visually, not by reading prose
3. **Drift catcher:** Critic verifies flow doc matches actual code at end-of-wave bug scan; drift surfaces architectural decisions the team made without updating their own source-of-truth

## Output specification

Two files at `docs/flows/`:

### `flows.html`
Single-page HTML with:
- Sidebar listing all documented flows (action buttons)
- Main canvas rendering the package/component network
- Click an action → canvas highlights flow path; annotation panel shows data passing between nodes
- No build step required; vanilla HTML + CSS + JS reading `flows.json` directly
- Works opened locally OR deployed to GitHub Pages (no server needed)

### `flows.json`
Source of truth. Schema:

```json
{
  "schemaVersion": "1.0",
  "lastUpdated": "ISO-8601 timestamp",
  "packages": [
    {
      "id": "pages-members",
      "label": "members.js",
      "path": "src/pages/members.js",
      "category": "page"
    },
    {
      "id": "core-firestore",
      "label": "Firestore wrappers",
      "path": "src/core/utils.js",
      "category": "core"
    }
  ],
  "flows": [
    {
      "id": "invite-new-user",
      "label": "Invite a new user",
      "description": "League commissioner invites a new member to their league",
      "steps": [
        {
          "from": "pages-members",
          "to": "core-firestore",
          "action": "Create invitation document",
          "data": "{ leagueId, inviteeEmail, inviterUid, role }"
        },
        {
          "from": "core-firestore",
          "to": "functions-onInvite",
          "action": "Trigger Cloud Function on document create",
          "data": "Invitation document"
        }
      ]
    }
  ]
}
```

## Maintenance protocol

Per Option D (Engineer maintains + Critic verifies):

### Engineer responsibility per ship

Engineer reads current `flows.json` before Ship Plan implementation. If the ship changes a flow OR introduces a new flow:

1. Update `flows.json` as part of the ship's diff
2. Verify `flows.html` renders correctly with new JSON (smoke check)
3. Critic confirms flow doc accuracy as part of acceptance criteria

Engineer self-audit checklist includes:
- [ ] Did this ship change any documented flow? → If yes, JSON updated.
- [ ] Did this ship introduce a new user-facing action? → If yes, new flow added to JSON.
- [ ] Did this ship rename a package/file? → If yes, package list in JSON updated.

### Critic verification at end-of-wave bug scan

Per END_OF_WAVE_BUG_SCAN.md, Critic runs flow doc accuracy verification:

1. For each documented flow, trace through current codebase
2. Verify the JSON's `steps` array matches actual code paths
3. Flag drift: flows that exist in code but not in JSON, flows that exist in JSON but not in code, data shape mismatches
4. Drift findings committed to wave bug scan report

Drift detected at wave gate is a blocking issue — wave does not advance until flow doc reconciled.

### On-demand updates

When orchestration team realizes flow doc is wrong mid-wave (not at gate), Engineer files an update immediately. Cheap fix; do it now rather than wait for wave close.

## Flow coverage scope

What flows get documented:

**In scope (must be documented):**
- Every member-facing action that touches multiple packages
- Every Cloud Function trigger
- Every Firestore write that fans out to multiple consumers
- Every authentication / authorization decision point
- Every cross-platform sync (HQ ↔ Mobile per CLUBHOUSE_SPEC § 8)
- Every cost-incurring API call (per Critical Feature Registry category 11)

**Out of scope (don't document):**
- Pure UI rendering with no data flow
- One-file utility helpers with no cross-package interaction
- Build pipeline / dev tooling flows
- Smoke test internal mechanics

If unclear, document. Better to over-document than miss a flow.

## Flow categories

Group flows in `flows.json` for UI navigation:

- **Member lifecycle:** signup, onboarding, invite, profile edit, deletion
- **Round capture:** start round, score input, sync round, finalize, retroactive log
- **Social:** post activity, kudos, comment, friend request, DM, league chat
- **Recognition:** award earned, championship locked in, ace attested, record set
- **Economy:** earn parcoins, purchase parcoins, place wager, claim bounty, gift cosmetic
- **Scheduling:** create tee time, RSVP, trip planning, calendar sync
- **Multi-player:** start scramble, scramble live update, party game claim
- **Cross-platform:** HQ → Mobile sync, Mobile → HQ sync, single-author resolution
- **Admin:** Founder pin, founder delete, commissioner role assignment, league settings

Categories evolve as flows are added.

## Authority + collaboration

Flow Documenter is a parallel authority per AGENT_NETWORK.md. Does NOT report to Orchestrator. Collaborates and challenges.

When Flow Documenter discovers architectural coupling that should have been caught at Ship Plan pre-flight:

1. Commits the finding to `docs/agents/lessons-learned/FLOW_FINDING_<DATE>.md`
2. Surfaces at next retrospective
3. Orchestrator + Critic review and decide if skill/hook amendment is warranted to catch this pattern earlier

This is healthy challenge — Flow Documenter sees the architecture at a different angle than Critic and may catch what Critic missed.

## Initial bootstrap

At Flow Documenter activation (Ship 5+8 first ship under new orchestration):

1. Engineer audits current codebase per Phase 1 codebase audit findings
2. Initial `flows.json` populated with at least the 10 most-common member-facing flows
3. `flows.html` rendered + verified working
4. Committed to `docs/flows/` with message `chore(flows): bootstrap flow documentation`
5. Critic verifies initial JSON against current code; reconciles any gaps before commit

Initial 10 flows for bootstrap (suggestion; Engineer may amend based on actual member-facing patterns):

1. Member signup + onboarding
2. Log a round (HQ web)
3. Log a round (Mobile, when available)
4. Sync round + finalize
5. League chat message send
6. DM send
7. Kudos on activity
8. Place a wager
9. Set a bounty
10. RSVP to tee time

After bootstrap, JSON grows organically per Engineer per-ship updates.

## What this does NOT do

- Not a substitute for code reading. Engineer still reads files in full per audit-first protocol.
- Not a substitute for design specs. CLUBHOUSE_SPEC and wave-2a-ratification remain design authority.
- Not a substitute for Ship Plan cross-surface dependency declaration per Criterion 12. Flow doc complements but doesn't replace.
- Not an architecture-design tool. Flow Documenter documents what exists, not what should exist. Architecture decisions are Founder + Orchestrator authority.

## Audit cadence

- Per-ship Engineer updates (continuous)
- Per-wave Critic verification at end-of-wave bug scan
- Per-wave-close: flow doc accuracy is a wave gate criterion
- Build → Launch transition: comprehensive flow doc review
