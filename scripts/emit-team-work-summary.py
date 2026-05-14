#!/usr/bin/env python3
"""
scripts/emit-team-work-summary.py

Emit a session.team-work.summary event with ship_id sourced from
.claude/state/current-ship.json per ESC-003 Approach A
(approved 2026-05-14).

This is the canonical helper for going-forward per-ship token
attribution. Manual session emits should call this instead of
hand-writing ndjson entries with raw ship_id strings — the helper
guarantees the ship_id matches whatever Agent 3 set at ship-plan
time.

Usage:
    python scripts/emit-team-work-summary.py \\
        --agent orchestrator \\
        --tokens 750000 \\
        --note "iter 11 + Recent 7 Days + cron banner + weekly_cost"

If .claude/state/current-ship.json has ship_id=null (no active ship),
the helper either:
  - reads --ship-id flag if provided (manual override)
  - falls back to a descriptive slug (operator-asserted)
  - or fails with a clear message asking to set current-ship.json

Pattern at ship boundaries (Agent 3 discipline):
  1. Ship-plan-author time:  set ship_id = "PROP-NNN" + started_at = now
  2. Mid-ship emits:         helper reads ship_id automatically
  3. Ship-close commit:      set ship_id = null
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_SHIP_PATH = ROOT / ".claude" / "state" / "current-ship.json"
EVENTS_DIR = ROOT / ".claude" / "state" / "telemetry" / "events"


def read_current_ship():
    if not CURRENT_SHIP_PATH.exists():
        return None
    try:
        return json.loads(CURRENT_SHIP_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--agent", required=True, help="emitter agent name (e.g. orchestrator, engineer)")
    parser.add_argument("--tokens", type=int, required=True, help="operator-asserted token estimate")
    parser.add_argument("--note", required=True, help="explanation of the estimate methodology")
    parser.add_argument("--ship-id", help="override ship_id (default: read from current-ship.json)")
    parser.add_argument("--dry-run", action="store_true", help="print the event without appending to ndjson")
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    iso = now.isoformat()

    # Ship ID resolution per ESC-003 Approach A
    ship_id = args.ship_id
    if not ship_id:
        current = read_current_ship()
        if current and current.get("ship_id"):
            ship_id = current["ship_id"]
        else:
            # Honest fallback per AMD-009 P5: name explicitly that this is
            # unattributed. Aggregator will surface "—" for any artifact
            # this event doesn't match.
            ship_id = f"manual-emit-{now.strftime('%Y%m%dT%H%M%SZ')}"
            print(f"warning: no ship_id in current-ship.json, no --ship-id flag; using fallback '{ship_id}'", file=sys.stderr)
            print("Per ESC-003: set ship_id in .claude/state/current-ship.json at ship-plan time, or pass --ship-id PROP-NNN explicitly.", file=sys.stderr)

    event = {
        "event_type": "session.team-work.summary",
        "timestamp": iso,
        "data": {
            "agent": args.agent,
            "ship_id": ship_id,
            "tokens_estimated": args.tokens,
            "note": args.note,
        },
        "agent": args.agent,
        "ship_id": ship_id,
        "cron_source": "manual-session",
    }

    if args.dry_run:
        print(json.dumps(event, indent=2))
        return 0

    # Append to today's ndjson
    today = now.strftime("%Y-%m-%d")
    out_path = EVENTS_DIR / f"{today}.ndjson"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")

    print(f"emitted ship_id={ship_id} tokens={args.tokens} agent={args.agent} → {out_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
