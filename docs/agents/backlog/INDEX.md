# Backlog Index

Open backlog items for PARBAUGHS. Hybrid structure: this index file lists all open items; per-item files in this directory provide full context for each. Closed items archive to `closed/`.

## Severity tags

- **P0** — production-affecting; interrupt sprint required
- **P1** — significant impact; sprint or fast-follow
- **P2** — degraded but functional; inter-wave sprint
- **P3** — minor; opportunistic batching with future ship

## Open items

| ID | Title | Severity | Wave / Phase | Status | File |
|---|---|---|---|---|---|
| BL-001 | Play Now: hole par/yardage adjustment during live play | P2 | Wave 2 | Open | [BL-001.md](./BL-001.md) |
| BL-002 | Delete legacy loading system (.skeleton/.spinner CSS + helpers) | P3 | Wave 2 | Open | [BL-002.md](./BL-002.md) |
| BL-003 | Extract shared helpers from home.js → src/core/page-helpers.js | P3 | Wave 2 | Open | [BL-003.md](./BL-003.md) |
| BL-004 | Live round card LEAD column (re-introduce when leaderboard infra reliable) | P3 | Wave 2 | Open | [BL-004.md](./BL-004.md) |
| BL-005 | HQ live round card group leaderboard (requires sync-round + tee-time pairing infrastructure) | P3 | Wave 2 | Open | [BL-005.md](./BL-005.md) |
| BL-006 | Remove Play Now from desktop sidebar nav (part of Scorecard/Live HUD redesign Ship 2) | P3 | Wave 2 | Open | [BL-006.md](./BL-006.md) |
| BL-007 | League edit page + masthead showing current league name | P3 | Wave 2 | Open | [BL-007.md](./BL-007.md) |
| BL-008 | a11y: drawer aria-modal/role="dialog" toggling at Band A | P3 | Wave 2 | Open | [BL-008.md](./BL-008.md) |
| BL-009 | Design system rationalization (consolidate --el-0/--el-4/--ease-standard, --duration-*/--dur-* drift) | P3 | Wave 2 | Open | [BL-009.md](./BL-009.md) |
| BL-010 | Handicap trend chart performance cliff at 1000+ rounds | P3 | Post-Wave-4 | Open | [BL-010.md](./BL-010.md) |
| BL-011 | HQ sidebar: duplicate .rr-sidebar__footer rules + stranded v8.5.x–v8.6.x CSS artifacts | P3 | Wave 2 | Open | [BL-011.md](./BL-011.md) |

## Backlog discipline

Per Q34 lock:
- Hybrid structure (index file + per-item files + closed archive)
- Structured per item: ID, title, severity at capture + retrospective, files affected, dependencies, last activity
- Severity tags reviewed at retrospective; can be re-tagged
- Never purged except by Founder clearance or design obsolescence
- Closed items archived to `closed/` with closure reason + ship that resolved them

## Closed items

See [`closed/`](./closed/) directory.

## Capture protocol

New items added during ship execution or retrospective:

1. Engineer/Orchestrator identifies item
2. Assigns provisional severity tag
3. Creates per-item file `BL-NNN.md` using template (next sequential ID)
4. Adds row to this INDEX.md
5. At next retrospective, Founder confirms or re-tags severity

## Resolution protocol

When a ship resolves a backlog item:
1. Ship Plan references the BL-NNN ID in scope section
2. On ship close, item file moves to `closed/BL-NNN-<ship-id>-CLOSED.md`
3. INDEX.md row removed
4. Closure reason + resolving ship captured in moved file

## Per-item file template

```markdown
# BL-NNN: <Title>

**Severity:** <P0 | P1 | P2 | P3>
**Captured:** <date, ship context>
**Wave/Phase target:** <when this is expected to ship>
**Status:** <Open | In Progress | Closed>

## Description

<What is the problem? Concrete details.>

## Files affected

- `<path>` — <what's relevant>

## Dependencies

- <Other backlog items, ships, or external factors that must resolve first>

## Acceptance criteria for closure

- <Concrete pass conditions>

## Last activity

<Date + brief note on most recent attention to this item>

## Notes

<Historical context, prior attempts, related lessons>
```
