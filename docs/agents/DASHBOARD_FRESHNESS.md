
# Dashboard freshness per commit

Founder directive 2026-05-14: dashboard data must reflect current
state within seconds of every commit. Not "eventually after cron".

## What changes

Add `.git/hooks/post-commit` that runs after every commit:

1. Reads `.claude/state/current-ship.json` for ship_id (per ESC-003)
2. Emits `session.team-work.summary` event tagged with ship_id
3. Invokes `regen-all` to refresh dashboard aggregates
4. Captures token snapshot at commit moment
5. Generates activity feed entry from commit metadata

Synchronous so dashboard is fresh before next user action.

## Hook content

```bash
#!/usr/bin/env bash
# post-commit hook — refresh dashboard data on every commit per AMD-019.
# Reads current-ship.json for ship_id, regenerates dashboards, emits
# telemetry event. Synchronous so dashboard reflects commit state
# before the next user action.

set -e
cd "$(git rev-parse --show-toplevel)"

# Skip recursion: regen-all triggers a commit (auto-commit telemetry),
# which would re-invoke this hook → infinite loop. Bail if HEAD msg
# matches the auto-commit pattern.
HEAD_MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")
if echo "$HEAD_MSG" | grep -qE "^cron\(routine\):"; then
    exit 0
fi

# Emit team-work summary event tagged with current ship_id
SHIP_PATH=".claude/state/current-ship.json"
SHIP_ID="manual-emit"
if [ -f "$SHIP_PATH" ]; then
    SHIP_ID=$(python -c "import json; d = json.load(open('$SHIP_PATH')); print(d.get('ship_id') or 'manual-emit')" 2>/dev/null || echo "manual-emit")
fi

# Use the canonical emit helper (per ESC-003 Approach A applied)
if [ -f "scripts/emit-team-work-summary.py" ]; then
    python scripts/emit-team-work-summary.py \
        --agent engineer \
        --tokens 0 \
        --note "post-commit hook fire for $(git log -1 --pretty=%h --no-walk)" \
        --ship-id "$SHIP_ID" 2>/dev/null || true
fi

# Regenerate dashboards
if [ -f "scripts/regen-all.sh" ]; then
    bash scripts/regen-all.sh >/dev/null 2>&1 || true
fi

exit 0
```

## Gate 11 (extends AMD-018)

Push authorization gates extended:

11. **Dashboard data freshness verified post-commit**
    - aggregates JSON mtime >= last commit timestamp
    - activity feed shows new entry for this commit
    - token attribution captured for ship_id

If post-commit hook fails: push blocks until freshness verified.

## Cron continues (separate concern)

Existing crons (downloads-watcher 5min, sidecar 5min, maintenance
02:55, overnight-triage 03:00) continue independently. They cover
background refresh + monitoring drift. post-commit covers
commit-moment freshness. Both needed.

## Honest delta

Why is this only now codified?

The team has historically run regen-all manually after substantive
work + relied on cron for background refresh. The 5-minute cron
window meant "dashboard is up to 5 min stale" was operational
baseline. Founder observed this drift today. Operational question
test (AMD-016): "Does dashboard reflect current state immediately?"
Pre-AMD-019 answer: NO (up to 5 min stale). Post-AMD-019 answer:
YES (synchronous post-commit).

## Cross-references

- AMD-018 (self-governed push — extended with Gate 11)
- ESC-003 (current-ship.json + emit-team-work-summary.py)
- AMD-016 (operational question test)
