#!/usr/bin/env python3
"""
Token Usage Aggregator — Source A (telemetry-real) + Source B (cron-log
estimated) + Source C (Founder-paste manual). Per the ingestion audit at
.claude/state/telemetry/ingestion-audit.md and the token-usage build spec.

Output: .claude/state/telemetry/aggregates/token-usage-snapshot.json with
schema { by_agent, by_cron, by_ship, all_time, generated_at }.

Idempotent — cursor at .token-usage-cursor.json. Re-running with no new
events is a no-op (and just re-emits the snapshot from existing data).
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
EVENTS_DIR = STATE / "telemetry" / "events"
AGGREGATES_DIR = STATE / "telemetry" / "aggregates"
SNAPSHOT_PATH = AGGREGATES_DIR / "token-usage-snapshot.json"
CURSOR_PATH = AGGREGATES_DIR / ".token-usage-cursor.json"
MANUAL_LOG = STATE / "telemetry" / "manual-quota-log.ndjson"
CRON_LOG_DIR = ROOT / "scripts" / "cron" / "logs"

# =============================================================================
# CONSTANTS (calibratable — see token-usage-build-summary.md "Open question")
# =============================================================================
# Estimation rates for Source B (cron-log heuristic). Tuned for Claude Opus
# reading + writing in an interactive session. Recalibrate against the first
# manual paste if needed.
INPUT_RATE_TOKENS_PER_SEC = 100      # reading rate (input tokens / second of session)
OUTPUT_RATE_TOKENS_PER_SEC = 30      # writing rate (output tokens / second)

# Anthropic quota caps for percentage -> tokens conversion in manual pastes.
# Adjust if Founder's plan tier changes.
QUOTA_CAPS = {
    "weekly-tokens":  3_500_000,
    "weekly-all":     3_500_000,
    "weekly-sonnet":  3_500_000,    # placeholder; Founder confirms cap on first paste
    "claude-design":  1_000_000,    # placeholder; Founder confirms
    "session":        200_000,      # placeholder; cap depends on plan
    "all-time":       None,         # unbounded, tokens_used is the value directly
}

# Cron names that DO invoke Claude API (Source B estimation applies).
# Cron names that do NOT invoke Claude get token=0 even when their session
# duration is recorded.
CRON_INVOKES_CLAUDE = {
    "overnight-triage": True,
    "downloads-watcher": False,
    "maintenance": False,
}


# ---------- helpers ----------
def iso_now():
    return datetime.now(timezone.utc).isoformat()


def parse_iso(s):
    if not s:
        return None
    try:
        # Handle both "2026-05-13T21:07:18Z" and "2026-05-13T21:07:18+00:00"
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except Exception:
        return None


def day_str(dt):
    if dt is None:
        return "unknown"
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")


def empty_buckets():
    return {
        "real": 0, "estimated": 0, "manual": 0,
        "total_real_plus_estimated": 0,
        "by_day": defaultdict(lambda: {"real": 0, "estimated": 0}),
    }


def add_to_bucket(b, real=0, estimated=0, manual=0, day=None):
    b["real"] += real
    b["estimated"] += estimated
    b["manual"] += manual
    b["total_real_plus_estimated"] = b["real"] + b["estimated"]
    if day:
        b["by_day"][day]["real"] += real
        b["by_day"][day]["estimated"] += estimated


# ---------- Source A: telemetry events ----------
def scan_telemetry_events(cursor_ts):
    """Yield (ts, agent, ship_id, cron_source, tokens_in, tokens_out, source_type='real').
    For each cycle.budget.checkpoint sequence, derive delta consumption and attribute
    to the cycle's agent + ship from the bracketing cycle.start.
    """
    if not EVENTS_DIR.exists():
        return []
    events = []
    for f in sorted(EVENTS_DIR.glob("*.ndjson")):
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    events.sort(key=lambda e: e.get("timestamp", ""))
    if cursor_ts:
        cursor_dt = parse_iso(cursor_ts)
        if cursor_dt:
            events = [e for e in events if (parse_iso(e.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc)) > cursor_dt]

    # Track cycle context to attribute checkpoint deltas
    cycle_ctx = {}  # cycle_id -> {"agent", "ship_id", "cron_source", "start_consumed", "started_at"}
    last_checkpoint_consumed = None
    last_checkpoint_dt = None
    derived = []

    for ev in events:
        et = ev.get("event_type", "")
        ts = ev.get("timestamp", "")
        dt = parse_iso(ts)
        data = ev.get("data", {}) if isinstance(ev.get("data"), dict) else {}

        if et == "cycle.start":
            cid = data.get("cycle_id") or ev.get("cycle_id")
            cycle_ctx[cid] = {
                "agent": data.get("agent") or ev.get("agent") or "unknown",
                "ship_id": data.get("ship_id") or ev.get("ship_id") or "unattributed",
                "cron_source": ev.get("cron_source", "manual-session"),
                "started_at": dt,
                "started_consumed": last_checkpoint_consumed,
            }

        elif et == "cycle.budget.checkpoint":
            consumed = data.get("weekly_tokens_consumed")
            if consumed is not None and last_checkpoint_consumed is not None:
                delta = consumed - last_checkpoint_consumed
                if delta > 0:
                    # Attribute to most-recent open cycle
                    cid = data.get("cycle_id") or ev.get("cycle_id")
                    ctx = cycle_ctx.get(cid) or {
                        "agent": "unknown", "ship_id": "unattributed", "cron_source": "unattributed"
                    }
                    derived.append({
                        "ts": ts, "dt": dt, "agent": ctx["agent"], "ship_id": ctx["ship_id"],
                        "cron_source": ctx["cron_source"], "tokens": delta, "source_type": "real",
                    })
            if consumed is not None:
                last_checkpoint_consumed = consumed
                last_checkpoint_dt = dt

        elif et == "cycle.paused":
            tokens = data.get("tokens_consumed_since_last_rest")
            agent = data.get("agent") or ev.get("agent") or "unknown"
            if tokens is not None:
                cid = data.get("cycle_id") or ev.get("cycle_id")
                ctx = cycle_ctx.get(cid, {"ship_id": "unattributed", "cron_source": "manual-session"})
                derived.append({
                    "ts": ts, "dt": dt, "agent": agent, "ship_id": ctx.get("ship_id", "unattributed"),
                    "cron_source": ctx.get("cron_source", "manual-session"),
                    "tokens": tokens, "source_type": "real",
                })

    return derived


# ---------- Source B: cron-log session boundaries ----------
def scan_cron_logs(cursor_ts):
    """Look at scripts/cron/logs/*-overnight-triage.log files for START + DONE
    timestamps. Estimate tokens from session duration * rates. downloads-watcher
    and maintenance get duration tracked but tokens=0 (no Claude invocation).
    """
    if not CRON_LOG_DIR.exists():
        return []
    cursor_dt = parse_iso(cursor_ts) if cursor_ts else None
    derived = []
    for f in sorted(CRON_LOG_DIR.glob("*.log")):
        name = f.name
        # Identify the cron from the filename: <ts>-<cron-name>.log
        m = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-(.+)\.log$", name)
        if not m:
            continue
        ts_part, cron_name = m.group(1), m.group(2)
        # Convert ts_part to ISO
        log_dt = datetime.strptime(ts_part, "%Y-%m-%dT%H-%M-%SZ").replace(tzinfo=timezone.utc)
        if cursor_dt and log_dt <= cursor_dt:
            continue
        # Read first + last line to find duration
        try:
            lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
        except Exception:
            continue
        if len(lines) < 2:
            continue
        # Pull the [HH:MM:SS] prefix from first and last meaningful lines
        def line_time(line):
            mm = re.match(r"\s*[﻿]*\[(\d{2}):(\d{2}):(\d{2})\]", line)
            if not mm:
                return None
            h, mn, s = int(mm.group(1)), int(mm.group(2)), int(mm.group(3))
            return log_dt.replace(hour=h, minute=mn, second=s)
        starts = [line_time(l) for l in lines if line_time(l)]
        if len(starts) < 2:
            continue
        duration_seconds = (starts[-1] - starts[0]).total_seconds()
        invokes = CRON_INVOKES_CLAUDE.get(cron_name, False)
        if invokes and duration_seconds > 0:
            est_in = int(duration_seconds * INPUT_RATE_TOKENS_PER_SEC)
            est_out = int(duration_seconds * OUTPUT_RATE_TOKENS_PER_SEC)
            est = est_in + est_out
        else:
            est = 0
        derived.append({
            "ts": starts[-1].isoformat(), "dt": starts[-1],
            "agent": "orchestrator" if cron_name == "overnight-triage" else "cron-runner",
            "ship_id": "unattributed",
            "cron_source": cron_name, "tokens": est,
            "source_type": "estimated", "duration_seconds": duration_seconds,
        })
    return derived


# ---------- Source C: manual paste log ----------
def scan_manual_log():
    if not MANUAL_LOG.exists():
        return []
    out = []
    for line in MANUAL_LOG.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        out.append({
            "ts": entry.get("timestamp"),
            "dt": parse_iso(entry.get("timestamp")),
            "scope": entry.get("scope", "unknown"),
            "tokens_used": int(entry.get("tokens_used", 0)),
            "source_type": "manual",
            "note": entry.get("note", ""),
        })
    return out


# ---------- merge into snapshot ----------
def merge_to_snapshot(real_events, estimated_events, manual_entries):
    by_agent = defaultdict(empty_buckets)
    by_cron = defaultdict(empty_buckets)
    by_ship = defaultdict(empty_buckets)
    all_time = {"real": 0, "estimated": 0, "manual": 0, "first_event_at": None, "last_event_at": None}

    def update_first_last(dt):
        if dt is None:
            return
        ts = dt.isoformat()
        if all_time["first_event_at"] is None or ts < all_time["first_event_at"]:
            all_time["first_event_at"] = ts
        if all_time["last_event_at"] is None or ts > all_time["last_event_at"]:
            all_time["last_event_at"] = ts

    for ev in real_events:
        d = day_str(ev["dt"])
        add_to_bucket(by_agent[ev["agent"]], real=ev["tokens"], day=d)
        add_to_bucket(by_cron[ev["cron_source"]], real=ev["tokens"], day=d)
        add_to_bucket(by_ship[ev["ship_id"]], real=ev["tokens"], day=d)
        all_time["real"] += ev["tokens"]
        update_first_last(ev["dt"])

    for ev in estimated_events:
        d = day_str(ev["dt"])
        add_to_bucket(by_agent[ev["agent"]], estimated=ev["tokens"], day=d)
        add_to_bucket(by_cron[ev["cron_source"]], estimated=ev["tokens"], day=d)
        add_to_bucket(by_ship[ev["ship_id"]], estimated=ev["tokens"], day=d)
        all_time["estimated"] += ev["tokens"]
        update_first_last(ev["dt"])

    for m in manual_entries:
        # Manual entries don't have agent/cron/ship attribution — track under "manual-anchored"
        d = day_str(m["dt"]) if m["dt"] else "unknown"
        add_to_bucket(by_agent["(manual-anchored)"], manual=m["tokens_used"], day=d)
        add_to_bucket(by_cron["(manual-anchored)"], manual=m["tokens_used"], day=d)
        all_time["manual"] += m["tokens_used"]
        if m["dt"]:
            update_first_last(m["dt"])

    def serialize_buckets(buckets):
        out = {}
        for k, b in buckets.items():
            out[k] = {
                "real": b["real"], "estimated": b["estimated"], "manual": b["manual"],
                "total_real_plus_estimated": b["total_real_plus_estimated"],
                "by_day": dict(b["by_day"]),
            }
        return out

    return {
        "generated_at": iso_now(),
        "constants": {
            "INPUT_RATE_TOKENS_PER_SEC": INPUT_RATE_TOKENS_PER_SEC,
            "OUTPUT_RATE_TOKENS_PER_SEC": OUTPUT_RATE_TOKENS_PER_SEC,
        },
        "by_agent": serialize_buckets(by_agent),
        "by_cron": serialize_buckets(by_cron),
        "by_ship": serialize_buckets(by_ship),
        "all_time": all_time,
        "_counts": {
            "real_events": len(real_events),
            "estimated_events": len(estimated_events),
            "manual_entries": len(manual_entries),
        },
    }


def main():
    AGGREGATES_DIR.mkdir(parents=True, exist_ok=True)

    cursor_ts = None
    if CURSOR_PATH.exists():
        try:
            cursor_ts = json.loads(CURSOR_PATH.read_text(encoding="utf-8")).get("last_processed_event_ts")
        except Exception:
            pass

    real = scan_telemetry_events(cursor_ts)
    estimated = scan_cron_logs(cursor_ts)
    manual = scan_manual_log()

    snapshot = merge_to_snapshot(real, estimated, manual)
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2, default=str), encoding="utf-8")

    # Update cursor to the most-recent event timestamp seen
    latest = None
    for ev in real + estimated:
        if ev.get("ts") and (latest is None or ev["ts"] > latest):
            latest = ev["ts"]
    if latest:
        CURSOR_PATH.write_text(json.dumps({"last_processed_event_ts": latest}, indent=2), encoding="utf-8")

    c = snapshot["_counts"]
    a = snapshot["all_time"]
    print(f"[aggregate-token] real_events={c['real_events']} estimated_events={c['estimated_events']} manual_entries={c['manual_entries']}")
    print(f"[aggregate-token] all-time: real={a['real']} estimated={a['estimated']} manual={a['manual']}")
    print(f"[aggregate-token] wrote {SNAPSHOT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
