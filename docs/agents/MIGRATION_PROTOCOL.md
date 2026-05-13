# Migration Protocol

Formal protocol for any ship modifying existing Firestore document shape, evolving schema, or transitioning members between data states. Applies to W4.I3 (founding 20 → Discord identity) and any future migration ship.

## Why this exists

Per memory #18 (audit-discipline locked v8.11.8→v8.11.9): strict validators on legacy docs require enumerating "universe of existing docs that will encounter this validator," not just write-side guarantees. Migration is the highest-risk class of ship — direct production data modification. Without explicit protocol, migrations risk leaving Firestore in inconsistent state, breaking active rounds, or producing irreversible data loss.

This protocol applies whenever:
- MemberDoc, RoundDoc, CourseDoc, ChipDoc, or any production document shape evolves
- Members or content transition between states (W4.I3 identity migration, future status-field additions)
- Validator strictness changes on a field across pre/post boundary
- Field renames, type changes, structural restructuring of any production document

## Pre-migration requirements

### Required artifacts before migration script runs

1. **Migration plan document** at `docs/agents/migrations/<YYYY-MM-DD>-<short-id>.md`
   - Migration intent (what changes)
   - Source state (what docs look like today)
   - Target state (what docs look like after)
   - Affected document count (run `getDocs` count query on production read-only mode FIRST)
   - Atomic per-doc write strategy (batched writes preserve consistency)
   - Rollback path (inverse script, tested before execution)

2. **Staging environment verification** (per W1.I4)
   - Migration script run against staging environment first
   - All states verified post-migration in staging
   - Rollback script run in staging to confirm reversibility
   - No production execution until staging fully clean

3. **Validator strictness discipline**
   - Validator accepts MISSING fields during migration window (between schema introduction ship and migration completion ship)
   - Validator catches WRONG TYPES on existing data
   - Pre-migration audit enumerates universe of existing docs that will encounter the new validator
   - Self-healing migration window: hours-to-days max

4. **Audit log infrastructure ready**
   - Per-doc migration entry written to audit log
   - Captures: doc ID, source state hash, target state hash, timestamp, script execution ID
   - Audit log visible only in Founder admin tooling

5. **Crisis banner notice queued** (per W1.I5)
   - NOTICE-tier banner 24+ hours in advance of planned migration
   - ALERT-tier banner during migration execution window
   - CRITICAL-tier banner if migration triggers rollback

### Decision bubble before execution

Migration ships ALWAYS fire decision bubble before execution:
- Voting agents: Engineer + Critic + Performance/Load Testing + Data Integrity (active W2+) + Security/Auditor (active Launch A+)
- Contributing agents per AGENT_NETWORK research-from-multiple-angles mandate
- Bubble produces Plain English summary for Founder approval
- Founder ratifies migration execution explicitly (decision-bubble approval insufficient — Founder synchronous ratification required for production migration)

## During migration execution

### Atomic per-doc writes

- Firestore batched writes preserve consistency
- Each batch wraps related changes (e.g., MemberDoc + associated FriendDoc updates)
- Failure mid-batch rolls back batch automatically (Firestore atomic batch semantics)
- Script logs every batch result + error

### Progress reporting

- Migration script logs progress to console + audit log
- Progress format: "Migrated X of Y docs (Z%)"
- Halt-on-error default: script stops on first batch failure, does not continue silently

### Halt criteria during migration

If during migration:
- Batch failure rate exceeds 5%: HALT, surface to Founder
- Validator rejection unexpected: HALT, surface to Founder
- Production read-mode shows inconsistent state: HALT, surface to Founder
- Crisis banner tier escalation needed: Founder approval before banner escalates to CRITICAL

## Post-migration verification

### Required verifications before declaring complete

1. **Doc count audit**: source-state count = target-state count (no docs lost)
2. **Sample verification**: spot-check 10 random docs from each member-cohort (founding 20, joined-during-Wave-1, etc.)
3. **Validator round-trip**: run validator against migrated docs to confirm all pass
4. **Downstream consumer audit**: pages that read the migrated docs render correctly (member profiles load, friend system works, round history accessible)
5. **Audit log completeness**: every migrated doc has audit entry; count matches doc count
6. **Crisis banner cleared**: NOTICE/ALERT banners removed after successful migration

### parbaughs-goal-completion-verify skill fires

Per P10 (PROTOCOLS.md): migration ship cannot declare complete without `parbaughs-goal-completion-verify` skill output covering:
- Pre-migration doc count vs post-migration doc count
- Sample verification results per member cohort
- Validator round-trip results
- Downstream consumer audit results
- Audit log completeness
- Crisis banner state

## Rollback protocol

### When rollback fires

- Migration verification fails post-execution
- Critical downstream consumer breaks (member profiles don't load, rounds inaccessible)
- Founder rules rollback at retrospective
- Cost halt triggered by post-migration write volume

### Rollback execution

1. Inverse migration script runs (pre-tested in staging per pre-migration requirements)
2. Source state restored doc-by-doc from migration audit log
3. Each rollback write written to audit log with `rollback: true` flag
4. Crisis banner escalates to CRITICAL during rollback
5. Post-rollback verification: source-state restoration confirmed via sample check

### Rollback completion

- Crisis banner restored to NOTICE explaining rollback
- Member-visible communication via Caddy Notes describing maintenance window outcome
- Migration ship status: rolled-back; ship doesn't close; retrospective fires for lessons-learned; re-plan for next attempt

## Communication protocol

### Before migration

- Crisis banner NOTICE tier: "Planned maintenance [DATE] at [TIME] for system improvements. Brief interruption expected."
- Caddy Notes entry queued for post-completion
- Founder reviews member-visible communication before banner posts

### During migration

- Crisis banner ALERT tier: "Maintenance in progress. Some features temporarily unavailable."
- Round-in-progress members get banner override warning if migration would affect their session

### After successful migration

- Crisis banner cleared
- Caddy Notes entry published: "Behind-the-scenes improvements complete" OR member-visible description per ship intent
- Founder admin tooling reflects migration audit log for ongoing reference

### After rollback (if applicable)

- Crisis banner downgraded from CRITICAL to NOTICE
- Caddy Notes entry: "We hit a snag during maintenance and rolled everything back. Your data is safe. Trying again soon."
- Retrospective fires for governance lessons

## Cross-references

- Memory #18 (validator strictness discipline)
- W4.I3 Vision (founding 20 identity migration)
- W1.I4 (staging environment)
- W1.I5 (crisis banner system)
- PROTOCOLS.md P10 (loop-and-verify discipline)
- POST_PUSH_RETROSPECTIVE.md (migration ships generate retrospective per protocol)

## Activation

This protocol activates at Phase 1 commit. First migration ship under this protocol is W4.I3 (founding 20 identity migration). Future migrations (TBD ships) follow same protocol.
