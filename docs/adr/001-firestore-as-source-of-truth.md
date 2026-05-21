# ADR-001 — Firestore is single source of truth; localStorage is allowlist only

**Status:** Accepted
**Date:** 2026-04-01 (extracted from CLAUDE.md v8.0 era)
**Deciders:** Founder

## Context

Early PARBAUGHS versions (~v5) used localStorage extensively for player data, rounds, and league state. As the app grew and multiple members joined, localStorage divergence between devices became a source of bugs (same member's profile differing across phone + desktop, lost rounds, stale leaderboards).

## Decision

Firestore is the single source of truth for all member-facing data. localStorage is used ONLY for the explicitly allowlisted ephemeral state per CLAUDE.md:
- `pb_appearance` (theme preference)
- `pb_clubhouse_welcomed` (one-time onboarding flag)
- `pb_liveState` (live-round resume hint)
- `golfcourse_api_key` (Founder's API key for course lookup)
- `dm_read_*` (per-DM last-read timestamps)

sessionStorage allowlist (per-session only):
- `pb_weather_cache`
- `pb_location_staleness_checked`

## Rationale

- **Option A: Firestore-first with localStorage allowlist (chosen).** Single source eliminates divergence; allowlist captures legitimate ephemeral state.
- **Option B: Firestore-first with no localStorage.** Too restrictive — theme preference and welcome flags don't justify a Firestore round-trip.
- **Option C: Continue mixed.** Bug source; abandoned.

## Consequences

- Every member-facing read/write hits Firestore (network cost + latency). Mitigated by Firestore offline persistence — explicitly DISABLED (see src/core/firebase.js) per architectural choice to avoid stale-cache surprise during real-time community use.
- New features must follow the allowlist or extend it via CLAUDE.md amendment.
- Migration scripts for schema changes route through scripts/migrations/ (ADR-007 pending).

## Cross-reference

- `CLAUDE.md` operational principles section
- `firestore.rules` — Firestore security rules
- `src/core/firebase.js` — offline persistence disabled
- `src/core/data.js` — data layer
