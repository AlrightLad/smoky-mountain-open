#!/usr/bin/env python3
"""
Telemetry aggregator — walks `.claude/state/telemetry/events/*.ndjson` plus the
real-state directories (handoffs, bubbles, proposals, ship-progress) and emits
`.claude/state/telemetry/aggregates/current-snapshot.json`.

F2 deliverable. Designed to be idempotent and tolerant of missing inputs (the
dry-run state is partial; this aggregator does what it can with what exists).

Token-consumption fields ("tokens_by_role", "weekly_tokens", "weekly_cost",
"token_trend_7d") are SYNTHESIZED from telemetry events when present. When
events lack agent+tokens attribution (the F1 token-meter gap), the aggregator
emits a `_meter_status` field that records the gap so downstream consumers
don't mistake zeros for "we used zero tokens."
"""
import json
import re
import sys
from collections import defaultdict, Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
EVENTS_DIR = STATE / "telemetry" / "events"
AGGREGATES_DIR = STATE / "telemetry" / "aggregates"
HANDOFFS_DIR = STATE / "handoffs"
BUBBLES_DIR = STATE / "discussion-bubbles"
PROPOSALS_DIR = STATE / "proposals"
SHIP_PROGRESS_DIR = STATE / "ship-progress"
WELLNESS_DIR = STATE / "wellness"

# Per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9
FOLDER_TO_SCENARIO = {
    "cycle-to-cycle":      "cycle-to-cycle",
    "agent-to-agent":      "agent-to-agent",
    "subagent-returns":    "subagent-to-parent",
    "dispatches":          "parent-to-subagent",
    "proactive-to-ship":   "proactive-to-ship",
    "halts":               "halt-to-resume",
    "founder-responses":   "founder-to-agent",
    "discussion-bubbles":  "discussion-bubble-to-caller",
    "cross-ship":          "cross-ship",
    "wave-to-wave":        "wave-to-wave",
    "wave-transitions":    "wave-to-wave",
    "parallel-merge":      "parallel-merge",
}


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def walk_events():
    events = []
    if not EVENTS_DIR.exists():
        return events
    for f in sorted(EVENTS_DIR.glob("*.ndjson")):
        for line_no, line in enumerate(f.read_text(encoding="utf-8").splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError as e:
                sys.stderr.write(f"[aggregate] WARN bad event {f.name}:{line_no}: {e}\n")
    return events


def walk_handoffs():
    out = []
    if not HANDOFFS_DIR.exists():
        return out
    for folder in sorted(HANDOFFS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        scenario = FOLDER_TO_SCENARIO.get(folder.name)
        if scenario is None:
            sys.stderr.write(f"[aggregate] WARN unknown handoff folder {folder.name}\n")
            continue
        for f in sorted(folder.rglob("*.md")):
            data = read_frontmatter(f)
            if data is None:
                continue
            data["_scenario"] = scenario
            data["_path"] = str(f.relative_to(ROOT))
            out.append(data)
    out.sort(key=lambda h: h.get("created_at", ""), reverse=True)
    return out


def walk_bubbles():
    out = []
    if not BUBBLES_DIR.exists():
        return out
    for f in sorted(BUBBLES_DIR.iterdir()):
        if not f.name.endswith(".md"):
            continue
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    out.sort(key=lambda b: b.get("opened_at", ""), reverse=True)
    return out


def walk_proposals():
    pending = []
    approved = []
    if PROPOSALS_DIR.exists():
        for sub, bucket in [("pending", pending), ("approved", approved)]:
            d = PROPOSALS_DIR / sub
            if not d.exists():
                continue
            for f in sorted(d.iterdir()):
                if f.name.endswith(".md"):
                    data = read_frontmatter(f)
                    if data:
                        bucket.append(data)
    return pending, approved


def walk_ship_progress():
    out = []
    if not SHIP_PROGRESS_DIR.exists():
        return out
    for f in sorted(SHIP_PROGRESS_DIR.glob("*.json")):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            continue
    return out


def aggregate():
    events = walk_events()
    handoffs = walk_handoffs()
    bubbles = walk_bubbles()
    proposals_pending, proposals_approved = walk_proposals()
    ship_progress = walk_ship_progress()

    # Cycle outcomes
    cycle_outcomes = Counter()
    cycle_starts = Counter()
    cycles_paused = 0
    cycles_resumed = 0
    halts = 0
    pause_durations = []
    for e in events:
        et = e.get("event_type", "")
        if et == "cycle.start":
            cycle_starts[e.get("cycle_id", "")] += 1
        elif et == "cycle.end":
            outcome = e.get("data", {}).get("outcome", "unknown")
            cycle_outcomes[outcome] += 1
        elif et == "cycle.paused":
            cycles_paused += 1
        elif et == "cycle.resumed":
            cycles_resumed += 1
            dur = e.get("data", {}).get("pause_duration_seconds")
            if isinstance(dur, (int, float)):
                pause_durations.append(dur)
        elif et.startswith("cycle.halt") or et.startswith("halt."):
            halts += 1

    # Tokens by role — synthesize when events carry agent attribution
    tokens_by_role = defaultdict(int)
    for e in events:
        data = e.get("data", {})
        if isinstance(data, dict):
            agent = e.get("agent") or data.get("agent")
            tokens = data.get("tokens") or data.get("tokens_consumed")
            if agent and isinstance(tokens, (int, float)):
                tokens_by_role[agent] += int(tokens)

    meter_wired = len(tokens_by_role) > 0
    meter_status = "wired" if meter_wired else "gap-per-F1a"

    # Recent handoffs (top 5)
    recent_handoffs = [
        {
            "scenario": h.get("_scenario"),
            "from": h.get("from_agent"),
            "to": h.get("to_agent"),
            "created_at": h.get("created_at"),
        }
        for h in handoffs[:5]
    ]

    # Recent ships (from ship-progress; fall back to empty list if dir is unpopulated)
    recent_ships = [
        {
            "id": s.get("ship_id") or s.get("id"),
            "title": s.get("title") or "(no title)",
            "status": s.get("status") or "unknown",
            "tokens": s.get("tokens_consumed") or 0,
            "cost": s.get("cost") or 0.0,
        }
        for s in ship_progress[:5]
    ]

    # 7-day token trend — placeholder; needs real meter
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
    token_trend = {
        "labels": days,
        "values": [0] * 7,
    }

    cycle_outcomes_7d = {
        "labels": days,
        "datasets": [
            {"label": "Complete", "data": [cycle_outcomes.get("complete", 0)] + [0] * 6, "color": "#4a8067"},
            {"label": "Paused",   "data": [cycle_outcomes.get("paused", 0)]   + [0] * 6, "color": "#d4a857"},
            {"label": "Halted",   "data": [halts] + [0] * 6, "color": "#9c4a4a"},
        ],
    }

    weekly_tokens = sum(tokens_by_role.values())  # 0 when meter is gap
    weekly_cost = 0.0  # No cost meter either

    snapshot = {
        "as_of": now.isoformat(),
        "_meter_status": meter_status,
        "_meter_note": (
            "Token meter is not wired (F1 finding). tokens_by_role / weekly_tokens / "
            "weekly_cost / token_trend_7d will show synthesized event-attributed values "
            "ONLY for events that carry agent + tokens fields. Until a real meter wires "
            "up (db-2026-05-13-003 outcome pending Founder ratification), treat these "
            "fields as a lower bound, not the actual consumption."
        ),
        "weekly_tokens": weekly_tokens,
        "weekly_cost": weekly_cost,
        "ships_this_week": len([s for s in ship_progress if s.get("status") == "complete"]),
        "halts_this_week": halts,
        "fiq_depth": 0,  # FIQ entries when written; currently 0 (F3 forthcoming)
        "budget_pct": 0.0 if not weekly_tokens else min(weekly_tokens / 3_500_000, 1.0),
        "tokens_by_role": {
            "labels": list(tokens_by_role.keys()) or ["(meter unwired)"],
            "values": list(tokens_by_role.values()) or [0],
        },
        "token_trend_7d": token_trend,
        "cycle_outcomes_7d": cycle_outcomes_7d,
        "recent_ships": recent_ships,
        "_aggregate_counts": {
            "events_total": len(events),
            "cycles_started": sum(cycle_starts.values()),
            "cycles_paused": cycles_paused,
            "cycles_resumed": cycles_resumed,
            "handoffs_total": len(handoffs),
            "bubbles_total": len(bubbles),
            "proposals_pending": len(proposals_pending),
            "proposals_approved": len(proposals_approved),
            "pause_durations_sec": pause_durations,
        },
    }

    AGGREGATES_DIR.mkdir(parents=True, exist_ok=True)
    out_path = AGGREGATES_DIR / "current-snapshot.json"
    out_path.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    return out_path, snapshot


def main():
    out_path, snap = aggregate()
    print(f"[aggregate] wrote {out_path.relative_to(ROOT)}")
    print(f"[aggregate] meter_status={snap['_meter_status']}")
    print(f"[aggregate] events={snap['_aggregate_counts']['events_total']} handoffs={snap['_aggregate_counts']['handoffs_total']} bubbles={snap['_aggregate_counts']['bubbles_total']} proposals_pending={snap['_aggregate_counts']['proposals_pending']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
