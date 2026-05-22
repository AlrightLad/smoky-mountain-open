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

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
EVENTS_DIR = STATE / "telemetry" / "events"
AGGREGATES_DIR = STATE / "telemetry" / "aggregates"
SNAPSHOT_PATH = AGGREGATES_DIR / "token-usage-snapshot.json"
CURSOR_PATH = AGGREGATES_DIR / ".token-usage-cursor.json"
MANUAL_LOG = STATE / "telemetry" / "manual-quota-log.ndjson"
CRON_LOG_DIR = ROOT / "scripts" / "cron" / "logs"
QUOTA_STATUS = STATE / "quota-status.json"  # PROP-003.a sidecar output
SESSION_TRANSCRIPT_SUMMARY = AGGREGATES_DIR / "session-transcript-summary.json"  # Phase T1 wire

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

# =============================================================================
# Phase T6 (D19) — Anthropic Opus 4.7 pricing per million tokens, USD.
# Used by build_pie_views() to compute USD cost as a SECONDARY display under
# the primary RAW token count. RAW tokens stay visually-big; cost line provides
# honest cache-read context (cache_read is 10x cheaper than input).
# Reference: ~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/hooks/cost-tracker.js
# =============================================================================
OPUS_PRICE_PER_MTOK = {
    "input": 15.00,
    "output": 75.00,
    "cache_creation": 18.75,
    "cache_read": 1.50,
}
PIE_TOP_SESSIONS = 10


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

        elif et == "session.team-work.summary":
            # Operator-asserted estimate for orchestration-team session work.
            # Surfaced as 'estimated' (NOT 'real') in the dashboard to maintain
            # the real/estimated/manual honesty distinction — operator-asserted
            # values are not measurements. See scripts/emit-session-event.py
            # HONESTY DISCIPLINE docstring.
            tokens = data.get("tokens_estimated")
            agent = data.get("agent") or ev.get("agent") or "orchestrator"
            ship_id = data.get("ship_id") or ev.get("ship_id") or "unattributed"
            cron_source = ev.get("cron_source") or "manual-session"
            if tokens is not None and tokens > 0:
                derived.append({
                    "ts": ts, "dt": dt, "agent": agent, "ship_id": ship_id,
                    "cron_source": cron_source, "tokens": tokens,
                    "source_type": "estimated",
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


# ---------- PROP-003.b: Source D — quota-status.json sidecar ----------
def read_quota_status(max_age_seconds: int = 6 * 3600):
    """
    Read .claude/state/quota-status.json (PROP-003.a sidecar output) and
    return a dict with `_state` ∈ {"fresh","empty","stale","absent"}.
    Used at snapshot-merge time to set `_meter_status` and surface the
    sidecar's canonical totals (NOT folded into per-source buckets — that
    would double-count against the event-derived attribution).
    """
    if not QUOTA_STATUS.exists():
        return {"_state": "absent"}
    try:
        obj = json.loads(QUOTA_STATUS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"_state": "absent"}
    as_of_raw = obj.get("as_of", "") or ""
    try:
        if as_of_raw.endswith("Z"):
            as_of_raw = as_of_raw[:-1] + "+00:00"
        as_of_dt = datetime.fromisoformat(as_of_raw)
    except Exception:
        return {**obj, "_state": "absent"}
    age = (datetime.now(timezone.utc) - as_of_dt).total_seconds()
    obj["_age_seconds"] = int(age)
    if age > max_age_seconds:
        obj["_state"] = "stale"
        return obj
    if obj.get("data_source") in (None, "none") or not (obj.get("weekly_tokens") or 0):
        obj["_state"] = "empty"
        return obj
    obj["_state"] = "fresh"
    return obj


# ---------- Source E: session-transcript summary (Phase T1 wire) ----------
def scan_session_transcripts():
    """Read scripts/ingest-session-transcripts.py output. Yield one event per
    (session_id, day, model) bucket so the aggregator's existing real-event
    machinery can attribute. All session-transcript spend is currently tagged
    agent='main' + ship_id='unattributed' + cron_source='manual-session';
    future work refines tagging via git log correlation.
    """
    if not SESSION_TRANSCRIPT_SUMMARY.exists():
        return [], None
    try:
        data = json.loads(SESSION_TRANSCRIPT_SUMMARY.read_text(encoding="utf-8"))
    except Exception:
        return [], None
    buckets = data.get("buckets") or {}
    out = []
    for key, b in buckets.items():
        last_ts = b.get("last_ts") or b.get("first_ts") or ""
        dt = parse_iso(last_ts) or datetime.now(timezone.utc)
        out.append({
            "ts": last_ts,
            "dt": dt,
            "agent": "main",
            "ship_id": "unattributed",
            "cron_source": "manual-session",
            "tokens": int(b.get("total", 0)),
            "source_type": "real",
            "session_id": b.get("session_id"),
            "model": b.get("model"),
            "_breakdown": {
                "input_tokens": int(b.get("input_tokens", 0)),
                "output_tokens": int(b.get("output_tokens", 0)),
                "cache_read_input_tokens": int(b.get("cache_read_input_tokens", 0)),
                "cache_creation_input_tokens": int(b.get("cache_creation_input_tokens", 0)),
            },
        })
    return out, data


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


# ---------- Phase T6 (D19): three-view pie chart payload ----------
def _bucket_cost_usd(b):
    """USD cost of a single session-transcript bucket using per-input/output/
    cache rates. Returns dollars (float).
    """
    rates = OPUS_PRICE_PER_MTOK
    cost = (
        b.get("input_tokens", 0) * rates["input"]
        + b.get("output_tokens", 0) * rates["output"]
        + b.get("cache_creation_input_tokens", 0) * rates["cache_creation"]
        + b.get("cache_read_input_tokens", 0) * rates["cache_read"]
    ) / 1_000_000
    return cost


def _effective_rate_per_mtok(session_summary):
    """Average $/Mtok across all session-transcript buckets — derived from the
    real input/output/cache mix observed in practice. Applied to by_agent /
    by_cron rows that lack per-input/output split (approximate but honest).
    """
    if not session_summary:
        return 0.0
    buckets = session_summary.get("buckets") or {}
    total_cost = 0.0
    total_tokens = 0
    for b in buckets.values():
        total_cost += _bucket_cost_usd(b)
        total_tokens += int(b.get("total", 0))
    if total_tokens <= 0:
        return 0.0
    return total_cost / (total_tokens / 1_000_000)


def build_pie_views(real_events, estimated_events, by_agent, by_cron, session_summary):
    """Produce the pie_views block consumed by token-usage.html.

    Three views: agent_role / work_category / session_top10. Each slice carries
    raw tokens (primary) + usd_cost (secondary). Methodology documented in
    `_methodology` for P9 traceability.
    """
    effective_rate = _effective_rate_per_mtok(session_summary)

    def agg_total(b):
        return int((b.get("real") or 0) + (b.get("estimated") or 0) + (b.get("manual") or 0))

    # View 1: agent_role — slices from by_agent (main / orchestrator / engineer / cron-runner).
    agent_slices = []
    for label, b in (by_agent or {}).items():
        tokens = agg_total(b)
        if tokens <= 0:
            continue
        agent_slices.append({
            "label": label,
            "tokens": tokens,
            "usd_cost": round(tokens * effective_rate / 1_000_000, 4),
        })
    agent_slices.sort(key=lambda s: s["tokens"], reverse=True)

    # View 2: work_category — slices from by_cron (manual-session / overnight-triage / downloads-watcher / maintenance / proposal-readiness / sidecar).
    cron_slices = []
    for label, b in (by_cron or {}).items():
        tokens = agg_total(b)
        if tokens <= 0:
            continue
        cron_slices.append({
            "label": label,
            "tokens": tokens,
            "usd_cost": round(tokens * effective_rate / 1_000_000, 4),
        })
    cron_slices.sort(key=lambda s: s["tokens"], reverse=True)

    # View 3: session_top10 — group session-transcript buckets by session_id,
    # sum total tokens + compute USD with the per-input/output/cache rates.
    # Slice label = first 8 chars of session_id + earliest day in window.
    session_top = []
    if session_summary:
        by_session = {}
        for b in (session_summary.get("buckets") or {}).values():
            sid = b.get("session_id")
            if not sid:
                continue
            agg = by_session.setdefault(sid, {
                "session_id": sid, "tokens": 0, "usd_cost": 0.0,
                "first_day": b.get("day") or "",
            })
            agg["tokens"] += int(b.get("total", 0))
            agg["usd_cost"] += _bucket_cost_usd(b)
            day = b.get("day") or ""
            if day and (not agg["first_day"] or day < agg["first_day"]):
                agg["first_day"] = day
        sorted_sessions = sorted(by_session.values(), key=lambda s: s["tokens"], reverse=True)
        for s in sorted_sessions[:PIE_TOP_SESSIONS]:
            prefix = (s["session_id"] or "")[:8]
            session_top.append({
                "label": f"{prefix} · {s['first_day']}" if s["first_day"] else prefix,
                "tokens": s["tokens"],
                "usd_cost": round(s["usd_cost"], 4),
                "session_id_prefix": prefix,
                "day": s["first_day"],
            })

    return {
        "agent_role": agent_slices,
        "work_category": cron_slices,
        "session_top10": session_top,
        "_methodology": {
            "rates_per_mtok": OPUS_PRICE_PER_MTOK,
            "model": "claude-opus-4-7",
            "effective_rate_per_mtok": round(effective_rate, 4),
            "session_breakdown_source": "session-transcript-summary.json buckets (per-input/output/cache-split)",
            "agent_work_category_breakdown_source": (
                "by_agent and by_cron aggregates (no per-input/output split — "
                "cost computed as tokens × effective_avg_rate derived from "
                "session_transcripts overall mix)"
            ),
            "top_session_count": PIE_TOP_SESSIONS,
        },
    }


# ---------- merge into snapshot ----------
def merge_to_snapshot(real_events, estimated_events, manual_entries, session_transcript_meta=None, session_transcript_raw=None):
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

    # PROP-003.b: Source D — quota-status.json sidecar snapshot.
    # Not folded into buckets (would double-count vs Source A event
    # attribution). Surfaced at top level so token-usage.html can show
    # the canonical weekly total alongside the per-agent breakdown.
    qs = read_quota_status()
    qs_state = qs.get("_state", "absent")
    if qs_state == "fresh":
        meter_status = "wired-real"
    elif qs_state == "empty":
        meter_status = "wired-estimated-sidecar-empty"
    elif qs_state == "stale":
        meter_status = "wired-estimated-sidecar-stale"
    else:
        meter_status = "wired-estimated"
    # Phase T1 wire: surface session-transcript ground truth at top level
    # so the dashboard can distinguish cache reads (90% cheaper) from output
    # tokens. Without this, all_time.real conflates everything.
    #
    # Phase T5: also compute weekly_real_7d so the Weekly card stops showing
    # the stale sidecar 102k value when session transcripts have orders-of-
    # magnitude more recent data.
    session_transcripts_block = None
    if session_transcript_meta:
        st = session_transcript_meta
        by_day = st.get("by_day_total", {}) or {}
        weekly_real_7d = 0
        # 2026-05-21 fix: bucket by Founder-local date (America/New_York),
        # not UTC. At 23:00 EDT it's already 03:00 UTC of next day; bucketing
        # by UTC would put tonight under tomorrow.
        try:
            from zoneinfo import ZoneInfo
            _founder_tz = ZoneInfo("America/New_York")
        except Exception:
            _founder_tz = timezone.utc
        today = datetime.now(timezone.utc).astimezone(_founder_tz).date()
        for day_str_key, total in by_day.items():
            try:
                d = datetime.strptime(day_str_key, "%Y-%m-%d").date()
            except Exception:
                continue
            age_days = (today - d).days
            if 0 <= age_days <= 7:
                weekly_real_7d += int(total)
        session_transcripts_block = {
            "generated_at": st.get("generated_at"),
            "source": st.get("source"),
            "session_count": st.get("session_count", 0),
            "bucket_count": st.get("bucket_count", 0),
            "all_time_total_tokens": st.get("all_time_total_tokens", 0),
            "weekly_real_7d": weekly_real_7d,
            "by_day_total": by_day,
            "by_model_total": st.get("by_model_total", {}),
        }

    # Phase T6 (D19): three-view pie chart payload. Reads from completed
    # by_agent + by_cron + session-transcript raw buckets — must be computed
    # AFTER bucket merging but BEFORE return.
    pie_views = build_pie_views(
        real_events, estimated_events, by_agent, by_cron, session_transcript_raw
    )

    return {
        "generated_at": iso_now(),
        "_meter_status": meter_status,
        "session_transcripts": session_transcripts_block,
        "pie_views": pie_views,
        "quota_status": {
            "state": qs_state,
            "as_of": qs.get("as_of") if qs_state != "absent" else None,
            "age_seconds": qs.get("_age_seconds"),
            "weekly_tokens": qs.get("weekly_tokens"),
            "weekly_cap": qs.get("weekly_cap"),
            "weekly_pct": qs.get("weekly_pct"),
            "org_monthly_tokens": qs.get("org_monthly_tokens"),
            "org_monthly_cap": qs.get("org_monthly_cap"),
            "org_monthly_pct": qs.get("org_monthly_pct"),
            "data_source": qs.get("data_source"),
            "_warning": qs.get("_warning"),
        },
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

    # Full rescan every run. The cursor was an attempted incremental
    # optimization but the merge_to_snapshot rebuilds state from scratch,
    # so cursor-filtered runs DISCARDED accumulated data on each invocation
    # (concrete repro 2026-05-14: first run produced orchestrator=4.2M;
    # second run advanced cursor past my session event; third run filtered
    # everything older than cursor + built empty snapshot). At our scale
    # (small ndjsons), full rescan is fast and correct.
    cursor_ts = None

    source_a_events = scan_telemetry_events(cursor_ts)
    source_b_events = scan_cron_logs(cursor_ts)
    manual = scan_manual_log()
    source_e_events, source_e_meta = scan_session_transcripts()

    # Partition by inner source_type. Source A (telemetry events) can now emit
    # both 'real' (cycle.budget.checkpoint, cycle.paused) AND 'estimated'
    # (session.team-work.summary, operator-asserted). Source B (cron logs) is
    # always 'estimated'. Source E (session transcripts, Phase T1) is always
    # 'real' — the ground truth from Claude Code's own usage blocks. Group
    # properly so the dashboard's real/estimated/manual columns reflect
    # honesty discipline.
    real = [e for e in source_a_events if e.get("source_type") == "real"] + source_e_events
    estimated = [e for e in source_a_events if e.get("source_type") == "estimated"] + source_b_events

    snapshot = merge_to_snapshot(
        real, estimated, manual,
        session_transcript_meta=source_e_meta,
        session_transcript_raw=source_e_meta,
    )
    # token-usage-snapshot.json is NOT in D40's freshness gate. token-usage.html
    # (the consumer) reads content not timestamps. Long grace (4h) minimizes
    # the timestamp-only drift that was dirtying the tree on every post-commit
    # hook fire (root-cause fix 2026-05-19).
    snap_wrote, snap_reason = idempotent_write_json(
        SNAPSHOT_PATH, snapshot, default=str, grace_seconds=4 * 3600,
    )

    # Update cursor to the most-recent event timestamp seen
    latest = None
    for ev in real + estimated:
        if ev.get("ts") and (latest is None or ev["ts"] > latest):
            latest = ev["ts"]
    cursor_wrote = False
    cursor_reason = "n/a"
    if latest:
        # Cursor has no inherent "fresh enough" gate — its value IS the data,
        # so use grace_seconds=0 and only-write-on-change semantics (the
        # helper skips when normalized content matches; for this file
        # "last_processed_event_ts" IS the only field so content drift ==
        # cursor advance == legitimate write).
        cursor_wrote, cursor_reason = idempotent_write_json(
            CURSOR_PATH,
            {"last_processed_event_ts": latest},
            timestamp_keys=[],  # no timestamps to normalize away
            grace_seconds=0,
        )

    c = snapshot["_counts"]
    a = snapshot["all_time"]
    print(f"[aggregate-token] real_events={c['real_events']} estimated_events={c['estimated_events']} manual_entries={c['manual_entries']}")
    print(f"[aggregate-token] all-time: real={a['real']} estimated={a['estimated']} manual={a['manual']}")
    print(f"[aggregate-token] snapshot write={snap_wrote} ({snap_reason}) -> {SNAPSHOT_PATH.relative_to(ROOT)}")
    print(f"[aggregate-token] cursor   write={cursor_wrote} ({cursor_reason}) -> {CURSOR_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
