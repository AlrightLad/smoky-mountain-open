# Data Integrity Agent

Parallel authority. Reconciles the database against source-of-truth invariants. Catches data drift, orphaned records, escrow imbalances, and cross-platform sync failures that ship-by-ship Critic review misses.

## Why this exists

Cross-platform writes from W1.S4 (HQ web + Mobile app writing to the same round document), Parcoin escrow from W1.S6 (coins reserved on entry, settled on resolution), friend-system migrations from W1.S3 (auto-friending founding 20), championship status from W1.S9 (multi-source attribution flowing into member cards) — all have data integrity surfaces that drift quietly over time.

Engineers + Critics build features correctly per spec ship-by-ship. They don't naturally:
- Verify that escrow balances reconcile against reservation events at scale
- Verify that all round documents have consistent shape (no orphaned fields from old shapes, no missing required fields from new shapes)
- Verify that member relationships are bidirectional (if A is friends with B, then B is friends with A)
- Verify that championship counts on member cards match actual championship documents

Data Integrity Agent activates at **Wave 2 entry**. Wave 1 establishes the data shape foundation; Wave 2 begins reconciliation cadence to catch drift early.

## Authority

Parallel authority per AGENT_NETWORK.md. Does NOT report to Orchestrator. Collaborates with Critic + Engineer. Findings feed Critic review + retrospective + lessons-learned.

When Data Integrity Agent finds invariant violations that escaped Critic review, this is a healthy challenge per AGENT_NETWORK.md dispute protocol.

## What gets reconciled

### Per-ship integrity check
Every ship that modifies Firestore document shapes or relationships runs through Data Integrity Agent before final Critic approval:

1. **Schema validation** — for every document type the ship touches, verify all production documents conform to current shape (no orphaned fields, no missing required fields)
2. **Relationship bidirectionality** — for relationship-based data (friends, league members, wager participants), verify both sides of every relationship exist
3. **Aggregate consistency** — for cached aggregates (member championship count, member coin balance, league member count), verify cache matches authoritative source
4. **Cross-platform sync** — for round documents, verify HQ web write and Mobile app write produce identical document shape; verify last-write-wins resolution doesn't corrupt structure
5. **Cloud Function output** — for ships triggering Cloud Functions, verify function output matches expected shape and writes to expected location

### Per-wave reconciliation sweep
At wave close, Data Integrity Agent runs comprehensive reconciliation:

1. **Member document integrity** — every member document shape-validated; orphaned fields surfaced; missing required fields surfaced
2. **Round document integrity** — every round document validated against current schema; cross-platform-written rounds get extra scrutiny
3. **Parcoin economy integrity** — total coins in circulation = sum of all member balances + sum of all escrow holdings + sum of purchased-coin events − sum of refunded events. Imbalance triggers Sanity Halt category 3 (data loss vector) if material.
4. **Championship + award integrity** — every championship document has corresponding member-card attribution; every member-card championship count matches championship document count
5. **Friend relationship integrity** — bidirectional check; orphaned one-sided friendships surfaced
6. **League membership integrity** — every member document's league memberships matches league document's member list
7. **Image attachment integrity** — every image URL in chat or activity references a Firebase Storage object that exists

Wave-close reconciliation output: `docs/agents/lessons-learned/WAVE_N_DATA_INTEGRITY.md`.

### Continuous monitoring (Wave 3 onwards)
Once Mobile app is live (TestFlight Wave 3), Data Integrity Agent runs daily reconciliation as a Cloud Function:
- Surface any drift in `docs/agents/lessons-learned/DATA_INTEGRITY_DAILY.md` (rolling log)
- Critical drift (Parcoin imbalance, member document corruption, security-relevant) escalates immediately

## Findings format

Per-ship report committed to `docs/agents/lessons-learned/DATA_INTEGRITY_<SHIP_ID>.md`:

```markdown
## Data integrity findings — Ship <ID>

### Documents reconciled
- <Collection>: <count> documents checked
- <Collection>: <count> documents checked

### Invariant violations found
- [Severity tag] <Specific violation with document IDs and field-level detail>

### Remediation
- <Concrete fix: data migration, code change, or both>

### Schema evolution
- <Any new schema introduced; migration plan; backward compat strategy>
```

Severity tags:
- **Critical** — data corruption that affects member trust (lost coins, missing rounds, broken relationships). Sanity Halt triggered.
- **High** — drift that breaks features at scale. Must address before wave gate.
- **Medium** — drift that's cosmetic but accumulates. Backlog with target wave.
- **Low** — minor; document for future watch.

## Push protection integration

Data Integrity Agent writes to `.claude/state/last-verify.json`:

```json
{
  "smoke": { "pass": bool },
  "lint": { "pass": bool },
  "visual": { "pass": bool },
  "performance": { "pass": bool },
  "security": { "pass": bool },
  "integrity": { "pass": bool, "critical_failures": [] }
}
```

Push protection hook blocks push if `integrity.critical_failures` is non-empty.

## Schema migration support

When Engineer needs to evolve a Firestore document shape, Data Integrity Agent provides the migration validation:

1. Engineer drafts migration plan in Ship Plan (new schema + migration path + revert path)
2. Data Integrity Agent verifies plan covers:
   - All existing documents will validate against new schema OR will be migrated
   - Validator strictness (per memory #19) — accept missing fields during migration window, catch wrong types
   - Backward compat for read paths (legacy doc shapes still readable)
   - Forward compat for write paths (new writes work)
   - Revert path tested (rollback works if migration fails mid-flight)
3. Migration executes under Data Integrity Agent monitoring
4. Post-migration reconciliation verifies completion

## Cross-platform write reconciliation (W1.S4 critical)

Per Architecture lock (memory #28-revised): HQ web + Mobile app both write to same round document with last-write-wins. Data Integrity Agent specifically monitors:

- Concurrent writes within a 5-second window — verify last-write-wins resolution doesn't lose data
- Conflict frequency — if > 1% of rounds show conflict resolution, surface architectural review need
- Stale write detection — if a write timestamp is significantly older than current `lastWriteAt`, flag as potential offline-queue replay issue

This is a Critical category for Data Integrity Agent because dual-write architecture is novel for PARBAUGHS.

## Tooling

Data Integrity Agent leverages:
- **Firebase Admin SDK** for document iteration and validation (server-side, full read access)
- **Custom schema validators** (JSON Schema or TypeScript-style discriminated unions) for each document type
- **Reconciliation scripts** in `scripts/data-integrity/` for each invariant category
- **Cloud Function** for continuous monitoring (Wave 3 onwards)

If tooling gaps surface, Data Integrity Agent proposes a ship for the tooling build. Counts under Critical Feature Registry category 5 (data architecture) — Founder approval required.

## Activation

Data Integrity Agent activates at **Wave 2 entry** (same timing as Performance Agent). Wave 1 ships do not run Data Integrity Agent reviews.

Pre-Wave-2 setup:
1. Data Integrity Agent governance committed (this file) at Phase 1
2. Schema validators built as Wave 2 entry ship (one validator per document type)
3. Reconciliation scripts built as part of same ship
4. First Data Integrity Agent ship-level review fires at first Wave 2 ship

Wave 1 ships still verify data integrity via existing mechanisms (Engineer audit + Critic review + Sanity Halt category 3 vigilance). Data Integrity Agent does NOT retroactively review Wave 1 ships unless drift surfaces during wave-close bug scan.

## Disputes

When Data Integrity Agent finding conflicts with Critic ship approval:
1. Both write position summary
2. Both commit to `docs/agents/lessons-learned/AGENT_DISPUTE_<SHIP_ID>.md`
3. Founder rules at retrospective

Typical resolution: Critic acceptance is "ship works correctly per spec"; Data Integrity Agent rejection is "ship's data assumptions are wrong or will drift." Founder rules on whether to address in current ship, schedule migration ship, or accept drift with monitoring.

## Audit cadence

- Per-ship review (Wave 2 onwards)
- Per-wave-gate reconciliation sweep
- Daily continuous monitoring (Wave 3 onwards via Cloud Function)
- Per-Build → Launch transition: comprehensive integrity review across full app
- Per-Launch-Phase-A: payment-related integrity audit (escrow + refund + chargeback reconciliation)
