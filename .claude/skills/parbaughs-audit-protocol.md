---
name: parbaughs-audit-protocol
description: Engineer audit-first protocol (P1). Read Ship Plan + design spec + affected code in full; grep cross-surface consumers; verify version state; baseline smoke. Memory reflects a point in time — current code is canonical.
trigger: Before any consequential code/schema/deploy action under PARBAUGHS orchestration
owner: Engineer
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-audit-protocol

Encodes P1 (Audit-first protocol per PROTOCOLS.md). Engineer fires this before writing any code. Catches coupled bugs that memory wouldn't have flagged.

## When to invoke

- Starting a new ship's Engineering phase
- Before modifying any file referenced by 2+ surfaces (member docs, round docs, league docs, etc.)
- Before any Firestore write that touches shared schema
- Before any version-bump ship (verify triple-bump targets first)

## When NOT to invoke

- Caddy Notes copy edits (no code, no schema)
- Skill or proposed-skills file edits (governance, not code)
- Pure markdown updates to docs/agents/ (governance — covered by Hook 4 governance protection)

## Procedure

1. **Ship Plan in full.** Read `docs/agents/ships/<ship-id>.md` end-to-end. Vision section first; acceptance criteria last. Don't skim. Don't work from session memory of the plan.

2. **Design spec by ID.** If the Ship Plan references CLUBHOUSE_SPEC sections (e.g., § 6.3.2), read those sections in `docs/CLUBHOUSE_SPEC.md` / `-3a..3e` / `-4` directly. Memory of the spec is unreliable.

3. **Code files in full.** Not snippets. Not grep results. The 2,105-line `src/pages/members.js` gets read whole if it's in scope. Coupled bugs hide outside the visible window.

4. **Cross-surface grep.** For every data structure being modified:
   - `Grep` for `fbMemberCache`, `PB.getPlayer*`, `leagueQuery("<collection>")`, `db.collection("<collection>")` across `src/`
   - Document the actual consumer count for this ship (don't reuse a stale "30-file fanout" figure)
   - Update consumers in same ship if write shape changes

5. **Version state.**
   - `Grep -n "APP_VERSION" src/core/utils.js`
   - `Grep -n "version" package.json | head -3`
   - `Grep -n "CACHE_NAME" public/sw.js`
   - All three must agree pre-ship and at ship close (post version-bump)
   - Hook 5 (pre-commit-version-sync) enforces utils.js ↔ package.json at commit time

6. **Smoke baseline.** Run `npm run smoke` (chromium-only by default) against current main. Confirm green or document the existing flakes before any code change. Don't make changes against an unverified baseline.

7. **Gap identification.** If audit surfaces:
   - Underspecified Ship Plan detail → escalate to Orchestrator
   - CFR trigger missed at plan time → escalate to Founder per P2
   - Sanity Halt risk → halt, escalate per P3
   - Inferable gap (within Tier 1 scope) → document inference + proceed

## Anti-patterns

- "I remember this pattern from Ship 5+5" — verify current state, don't trust memory
- Reading first 100 + last 50 lines of a 2,000-line file — read the middle too
- Skipping cross-surface grep because "it's just a fix" — every fix shape changes; consumers may break
- Running smoke after writing code, treating green as proof of pre-existing health — baseline FIRST

## References

- `docs/agents/PROTOCOLS.md` § P1
- `docs/agents/ENGINEER.md` "Audit-first protocol"
- `feedback_p5_diagnostic_first.md` (Founder memory P5)
- `feedback_p6_verify_design_data_sources.md` (Founder memory P6)
- Audit DRIFT-9 (PHASE_1_CODEBASE_AUDIT.md) — fanout figure verify-per-ship
