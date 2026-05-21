# Firestore Schema Migrations

Migration scripts go here. Each migration is a separate file with:
- Forward + reverse (up/down) operations
- `--dry-run` flag to preview without writing
- Audit log entry to `.claude/state/migrations-applied/<migration-name>.json`

## Naming convention

`YYYY-MM-DD-<slug>.js` — date prefix for chronological ordering.

## Template

See `_template.js` for the standard migration shape.

## Running

Local emulator:
```bash
node scripts/migrations/2026-MM-DD-slug.js --emulator --dry-run
node scripts/migrations/2026-MM-DD-slug.js --emulator
```

Production (AMD-018 gate — Founder pre-auth required):
```bash
FOUNDER_AUTH_TS=<ISO timestamp> \
  node scripts/migrations/2026-MM-DD-slug.js --production --dry-run
FOUNDER_AUTH_TS=<ISO timestamp> \
  node scripts/migrations/2026-MM-DD-slug.js --production
```

## Why this structure

Per Goal 2 A6 Architecture audit: schema changes need an audit trail. The
file structure itself + the per-migration `migrations-applied/` JSON gives
us that trail.
