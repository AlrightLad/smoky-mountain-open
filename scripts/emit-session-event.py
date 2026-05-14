#!/usr/bin/env python3
"""
emit-session-event.py — emit a telemetry event for orchestration-team work.

The aggregator's Source A (real-event path) consumes cycle.budget.checkpoint
+ cycle.paused events with explicit token fields. Without an emitter for these
events, the orchestration team's actual Claude consumption never reaches the
dashboard — dashboard shows zero even when the team has been working all day.

This emitter fills that gap. It writes a properly-formed event to
.claude/state/telemetry/events/<utc-date>.ndjson that the aggregator picks up
on next run.

USAGE
    # cycle.paused — most useful for retrospective session-summary
    python scripts/emit-session-event.py \\
        --event-type cycle.paused \\
        --agent orchestrator \\
        --tokens 3200000 \\
        --note "today's orchestration work, estimated from commit count + complexity"

    # cycle.start — when starting a fresh agent loop
    python scripts/emit-session-event.py \\
        --event-type cycle.start \\
        --cycle-id <uuid-or-slug> \\
        --agent orchestrator \\
        --ship-id W1.S1

    # cycle.budget.checkpoint — for mid-cycle accumulation
    python scripts/emit-session-event.py \\
        --event-type cycle.budget.checkpoint \\
        --cycle-id <uuid-or-slug> \\
        --weekly-tokens-consumed 1500000

HONESTY DISCIPLINE
    Token values emitted here are ESTIMATES (the only available signal).
    Source-of-truth would be Anthropic-side telemetry. Until that wires
    up (PROP-003 territory), the manual emit is the substrate's best
    honest signal. The aggregator labels these as 'real' because they
    use the cycle.* event path, but their UPSTREAM truthfulness is
    operator-asserted. Treat as "team's best estimate" not "measured."
"""
import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVENTS_DIR = ROOT / ".claude" / "state" / "telemetry" / "events"


def emit_event(event_type: str, data: dict, cycle_id: str = None, agent: str = None,
               ship_id: str = None, cron_source: str = None) -> Path:
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    # FILE NAME uses UTC date (not local). Emit-CronTelemetry uses local date,
    # which is a known bug; this Python emitter is correct.
    target = EVENTS_DIR / f"{now.date().isoformat()}.ndjson"

    payload = {
        "event_type": event_type,
        "timestamp": now.isoformat(),
        "data": data,
    }
    # Top-level conveniences the aggregator reads from either location.
    if cycle_id:
        payload["cycle_id"] = cycle_id
    if agent:
        payload["agent"] = agent
    if ship_id:
        payload["ship_id"] = ship_id
    if cron_source:
        payload["cron_source"] = cron_source

    with open(target, "a", encoding="utf-8", newline="") as f:
        f.write(json.dumps(payload) + "\n")

    return target


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--event-type", required=True, choices=[
        "cycle.start", "cycle.budget.checkpoint", "cycle.paused", "cycle.complete",
        "session.team-work.summary",
    ])
    p.add_argument("--cycle-id", default=None)
    p.add_argument("--agent", default=None)
    p.add_argument("--ship-id", default=None)
    p.add_argument("--cron-source", default="manual-session")
    p.add_argument("--tokens", type=int, default=None,
                   help="Token count; semantics depend on event type")
    p.add_argument("--weekly-tokens-consumed", type=int, default=None,
                   help="For cycle.budget.checkpoint")
    p.add_argument("--note", default="",
                   help="Free-text honest annotation about the source of the number")
    args = p.parse_args()

    if args.event_type == "cycle.start":
        if not args.cycle_id:
            args.cycle_id = uuid.uuid4().hex[:8]
        data = {
            "cycle_id": args.cycle_id,
            "agent": args.agent or "orchestrator",
            "ship_id": args.ship_id or "unattributed",
            "note": args.note,
        }
    elif args.event_type == "cycle.budget.checkpoint":
        if args.weekly_tokens_consumed is None:
            p.error("--weekly-tokens-consumed required for cycle.budget.checkpoint")
        data = {
            "cycle_id": args.cycle_id,
            "weekly_tokens_consumed": args.weekly_tokens_consumed,
            "note": args.note,
        }
    elif args.event_type == "cycle.paused":
        if args.tokens is None:
            p.error("--tokens required for cycle.paused (tokens_consumed_since_last_rest)")
        data = {
            "cycle_id": args.cycle_id,
            "agent": args.agent or "orchestrator",
            "tokens_consumed_since_last_rest": args.tokens,
            "note": args.note,
        }
    elif args.event_type == "session.team-work.summary":
        # Custom event: aggregator-extension reads this and attributes as
        # 'estimated' (operator-asserted) to the named agent.
        if args.tokens is None:
            p.error("--tokens required for session.team-work.summary")
        data = {
            "agent": args.agent or "orchestrator",
            "ship_id": args.ship_id or "unattributed",
            "tokens_estimated": args.tokens,
            "note": args.note,
        }
    else:  # cycle.complete
        data = {"cycle_id": args.cycle_id, "note": args.note}

    target = emit_event(
        args.event_type,
        data,
        cycle_id=args.cycle_id,
        agent=args.agent,
        ship_id=args.ship_id,
        cron_source=args.cron_source,
    )
    print(f"emit-session-event: wrote {args.event_type} to {target}")


if __name__ == "__main__":
    sys.exit(main() or 0)
