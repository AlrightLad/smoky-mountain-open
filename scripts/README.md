# scripts/

One-off and operational Node scripts that support PARBAUGHS. Reference docs live alongside the code.

## migrate-to-v8.js

The v7.x → v8.0.0 schema migration. Translates the 34 governance decisions in `docs/v8.0-governance-design.md` into Firestore writes per `docs/v8.0-technical-design.md` Section 6.

### What it does

- **Members.** Derives `platformRole` from legacy `role`: `commissioner` on Zach's uid → `founder`; any other `commissioner` → `user` (stray-commissioner safety); `suspended` → `suspended` (with composed `suspension` object); `removed` → `banned` (with composed `ban` object); anything else → `user`. Legacy `role` field stays through the v8.0–v8.1 transition window per decision 7.1.c.1.
- **Leagues.** Adds `bans: []`, `pendingCommissionerTransfer: null`, `customBranding: null`. No semantic changes.
- **platformConfig/singleton** (new). Creates `{ founderUid, founderTransfer: null, platformVersion: "8.0.0", lockedAt: <server timestamp> }`.

### Safety posture

- **Dry-run by default.** `--execute` required to write.
- **Staged writes.** Members are written to `members_v8_staging/{uid}` first, then verified, then atomically swapped into `members/{uid}`. Mid-run failure leaves originals untouched; staging collection remains for inspection or re-run.
- **Idempotent.** A second `--execute` run finds nothing to change and exits cleanly.
- **Verification phase.** After every `--execute`, the five assertions from Section 6.1.d run; script exits non-zero on any failure.
- **Production guardrails.** `--execute` against production (non-emulator) requires `--project parbaughs` AND `--founder-uid <uid>` explicitly. Auto-detection of the founder uid is only permitted in dry-run / emulator mode.

### Usage

Dry-run against the emulator (read-only, reports planned changes):

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=parbaughs \
  node scripts/migrate-to-v8.js --dry-run --verbose
```

Execute against the emulator (actually writes, for end-to-end testing):

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=parbaughs \
  node scripts/migrate-to-v8.js --execute --verbose
```

Execute against production (during the v8.0.0 maintenance window — read the whole README before running):

```bash
# Requires GOOGLE_APPLICATION_CREDENTIALS pointing at a service account
# with Firestore read/write. Exports founder uid and project explicitly.
node scripts/migrate-to-v8.js \
  --execute \
  --project parbaughs \
  --founder-uid <ZACH_UID>
```

### Flags

| Flag | Default | Notes |
|------|---------|-------|
| `--dry-run` | on | Reports planned changes. No writes. |
| `--execute` | off | Actually writes. Exits non-zero on any failure. |
| `--verbose`, `-v` | off | Per-doc reasoning in the plan output. |
| `--project <id>` | auto from env / `parbaughs` default | Firebase project id. Required for production `--execute`. |
| `--founder-uid <uid>` | auto-detected from the single `role=commissioner` member | Required for production `--execute`. Auto-detection is emulator/dry-run only. |
| `--help`, `-h` | — | Print help. |

### Prerequisites

- **Emulator dry-run or execute:** `npm run emulator:start` in another terminal. Emulator binds to `localhost:8080` and `localhost:9099`.
- **Production execute:** Firebase Admin credentials via `GOOGLE_APPLICATION_CREDENTIALS`. Recommended: a service account scoped to `datastore.viewer` + `datastore.user` on the `parbaughs` project, not Firebase owner.
- Node 20 (matches the project baseline).

### Expected runtime

At current data volume (~20 members, 2 leagues), the full `--execute` path completes in well under 60 seconds. Staging-and-swap is the dominant cost; one Firestore write per member plus the league backfills plus the platformConfig creation — roughly 25–30 writes total. The verification phase adds ~5 reads.

### Rollback

If `--execute` fails mid-run:

1. **Before Phase C (atomic swap) fails:** originals in `members/{uid}` are untouched. `members_v8_staging/` contains the partially-prepared data. Investigate, fix, re-run.
2. **Phase C fails partway:** some members have new schema, some still have legacy-only. Re-run the script — the idempotency check skips anyone already migrated and completes the remaining members.
3. **Phase D (league backfill) fails:** re-run is safe — the script checks whether each league already has the new fields before writing.
4. **Phase E (platformConfig) fails:** re-run is safe.
5. **Post-migration verification fails:** production is in a half-migrated state. The specific failing assertion tells you which invariant is broken. Do NOT deploy the v8.0.0 rules until verification passes.

For a full rollback (undo everything) the safe move is:
- Re-deploy v7.9.x `firestore.rules` to restore old auth semantics.
- Leave the `platformRole` field and other new fields on member docs — they're additive, and v7.9.x clients ignore them.
- Remove `platformConfig/singleton` only if v9+ needs the doc id free.

### Limitations

- The script does not handle Firebase Auth state. If v8.0.0 needs to revoke tokens for banned users, that's a Cloud Function responsibility, not this script's.
- The script does not touch subcollections (moderation_log, joinRequests, etc.) — those are greenfield in v8 and don't need migration.
- The script does not modify the legacy `role` field. That cleanup is a separate v8.2.0 script (`scripts/migrate-v8.2-role-cleanup.js`, not yet written).

### Related files

- `docs/v8.0-governance-design.md` — product decisions this script implements.
- `docs/v8.0-technical-design.md` Section 6 — full migration plan.
- `firestore.rules` — v8.0.0 rules expect the schema this script produces.
- `tests/firestore-rules/v8-rules.spec.js` — scaffolding; v8.0.0 populates with rule tests that assume post-migration schema.

## Other scripts in this directory

Brief inventory so future sessions can find the right file without re-reading each one:

- `lint.js` — acorn-based JS syntax check for `src/`, `tests/`, `scripts/`. Wired into `npm run lint`.
- `verify.js` — production data integrity checks (handicap drift, display-layer consistency). `npm run verify:*` variants for scoped checks.
- `ship-gate.js` — full pre-ship pipeline: lint + emulator check + rules tests + e2e + verify.
- `diagnose.js`, `diagnose-handicaps.js` — one-off diagnostic scripts for historical bug investigations.
- `backfill-handicaps.js` — one-off; backfilled computedHandicap when handicap formula changed.
- `restore-nick-achievements.js` — one-off; restored 18 lost achievements to Nick's account from backup (v7.4.x incident).
