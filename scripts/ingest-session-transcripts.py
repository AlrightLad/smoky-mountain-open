#!/usr/bin/env python3
"""
Session-transcript ingester — Phase T1 fix per
.claude/state/dashboard-audit-2026-05-18/TOKEN-METER-INVESTIGATION.md.

Reads Claude Code session JSONL files from
~/.claude/projects/C--Users-Zach-smoky-mountain-open/*.jsonl and emits
one summary record per session-day to
.claude/state/telemetry/aggregates/session-transcript-summary.json.

The aggregator (scripts/aggregate-token-usage.py) reads this summary on
its next run to populate `all_time.real` with the actual ground-truth
token spend from Claude Code's own usage blocks, instead of leaving the
meter mostly-empty when only PARBAUGHS-emitted telemetry events exist.

Each Claude Code assistant entry in the JSONL has shape:
    {
      "type": "assistant",
      "message": {
        "model": "claude-opus-4-7",
        "usage": {
          "input_tokens": int,
          "cache_creation_input_tokens": int,
          "cache_read_input_tokens": int,
          "output_tokens": int
        }
      },
      "sessionId": str,
      "timestamp": ISO8601 str
    }

Idempotent: a per-file cursor at
.claude/state/telemetry/aggregates/.session-transcript-cursor.json
tracks the last byte offset processed per JSONL file. Re-running with
no new content is a no-op.
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

logging.basicConfig(
    level=logging.INFO,
    format="[ingest-session-transcripts] %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
AGGREGATES_DIR = STATE / "telemetry" / "aggregates"
SUMMARY_PATH = AGGREGATES_DIR / "session-transcript-summary.json"
CURSOR_PATH = AGGREGATES_DIR / ".session-transcript-cursor.json"

# Claude Code transcripts for this project
PROJECT_SLUG = "C--Users-Zach-smoky-mountain-open"
TRANSCRIPTS_DIR = Path.home() / ".claude" / "projects" / PROJECT_SLUG


@dataclass
class UsageEntry:
    """Single assistant turn's token consumption."""
    timestamp: str
    session_id: str
    model: str
    input_tokens: int
    output_tokens: int
    cache_read_input_tokens: int
    cache_creation_input_tokens: int

    @property
    def total(self) -> int:
        return (
            self.input_tokens
            + self.output_tokens
            + self.cache_read_input_tokens
            + self.cache_creation_input_tokens
        )

    @property
    def day(self) -> str:
        try:
            ts = self.timestamp.replace("Z", "+00:00")
            return datetime.fromisoformat(ts).astimezone(timezone.utc).strftime("%Y-%m-%d")
        except Exception:
            return "unknown"


@dataclass
class DayBucket:
    """All assistant turns aggregated for one (session, day) pair."""
    session_id: str
    day: str
    model: str
    turn_count: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: int = 0
    cache_creation_input_tokens: int = 0
    first_ts: str = ""
    last_ts: str = ""

    def add(self, e: UsageEntry) -> None:
        self.turn_count += 1
        self.input_tokens += e.input_tokens
        self.output_tokens += e.output_tokens
        self.cache_read_input_tokens += e.cache_read_input_tokens
        self.cache_creation_input_tokens += e.cache_creation_input_tokens
        if not self.first_ts or e.timestamp < self.first_ts:
            self.first_ts = e.timestamp
        if not self.last_ts or e.timestamp > self.last_ts:
            self.last_ts = e.timestamp

    @property
    def total(self) -> int:
        return (
            self.input_tokens
            + self.output_tokens
            + self.cache_read_input_tokens
            + self.cache_creation_input_tokens
        )


def load_cursor() -> dict[str, int]:
    """Per-file byte offsets last processed. Missing file = process from 0."""
    if not CURSOR_PATH.exists():
        return {}
    try:
        return json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
    except Exception:
        log.warning("cursor file unreadable; treating as empty")
        return {}


def save_cursor(cursor: dict[str, int]) -> None:
    AGGREGATES_DIR.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cursor, indent=2), encoding="utf-8")


def parse_usage_entries(jsonl_path: Path, start_offset: int) -> tuple[list[UsageEntry], int]:
    """Read JSONL starting at start_offset. Return (entries, new_offset)."""
    entries: list[UsageEntry] = []
    try:
        with jsonl_path.open("rb") as fh:
            fh.seek(start_offset)
            content = fh.read()
    except OSError as exc:
        log.warning("cannot read %s: %s", jsonl_path.name, exc)
        return entries, start_offset

    new_offset = start_offset + len(content)
    text = content.decode("utf-8", errors="replace")

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue

        if obj.get("type") != "assistant":
            continue
        msg = obj.get("message") or {}
        usage = msg.get("usage") or {}
        if not usage:
            continue
        ts = obj.get("timestamp", "")
        sid = obj.get("sessionId", "")
        model = msg.get("model", "unknown")

        entries.append(
            UsageEntry(
                timestamp=ts,
                session_id=sid,
                model=model,
                input_tokens=int(usage.get("input_tokens", 0) or 0),
                output_tokens=int(usage.get("output_tokens", 0) or 0),
                cache_read_input_tokens=int(usage.get("cache_read_input_tokens", 0) or 0),
                cache_creation_input_tokens=int(usage.get("cache_creation_input_tokens", 0) or 0),
            )
        )

    return entries, new_offset


def aggregate_to_day_buckets(entries: Iterator[UsageEntry]) -> dict[str, DayBucket]:
    """Group entries by (session, day, model) and sum."""
    buckets: dict[str, DayBucket] = {}
    for e in entries:
        key = f"{e.session_id}|{e.day}|{e.model}"
        if key not in buckets:
            buckets[key] = DayBucket(session_id=e.session_id, day=e.day, model=e.model)
        buckets[key].add(e)
    return buckets


def merge_into_summary(new_buckets: dict[str, DayBucket]) -> dict:
    """Merge new buckets into existing summary. Existing keys overwrite old totals
    because we re-process the whole file on each run if its cursor is at 0; for
    incremental runs (cursor advanced), we re-add to existing totals.

    The merge strategy is: increment turn_count + token fields; update last_ts;
    keep earliest first_ts. New buckets that didn't exist are added fresh.
    """
    existing: dict = {}
    if SUMMARY_PATH.exists():
        try:
            existing = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
        except Exception:
            log.warning("summary file unreadable; treating as empty")

    summary_buckets = existing.get("buckets", {}) if isinstance(existing.get("buckets"), dict) else {}

    for key, b in new_buckets.items():
        prev = summary_buckets.get(key)
        if prev is None:
            summary_buckets[key] = {
                "session_id": b.session_id,
                "day": b.day,
                "model": b.model,
                "turn_count": b.turn_count,
                "input_tokens": b.input_tokens,
                "output_tokens": b.output_tokens,
                "cache_read_input_tokens": b.cache_read_input_tokens,
                "cache_creation_input_tokens": b.cache_creation_input_tokens,
                "total": b.total,
                "first_ts": b.first_ts,
                "last_ts": b.last_ts,
            }
        else:
            prev["turn_count"] = prev.get("turn_count", 0) + b.turn_count
            prev["input_tokens"] = prev.get("input_tokens", 0) + b.input_tokens
            prev["output_tokens"] = prev.get("output_tokens", 0) + b.output_tokens
            prev["cache_read_input_tokens"] = prev.get("cache_read_input_tokens", 0) + b.cache_read_input_tokens
            prev["cache_creation_input_tokens"] = prev.get("cache_creation_input_tokens", 0) + b.cache_creation_input_tokens
            prev["total"] = (
                prev["input_tokens"]
                + prev["output_tokens"]
                + prev["cache_read_input_tokens"]
                + prev["cache_creation_input_tokens"]
            )
            if not prev.get("first_ts") or (b.first_ts and b.first_ts < prev["first_ts"]):
                prev["first_ts"] = b.first_ts
            if b.last_ts and (not prev.get("last_ts") or b.last_ts > prev["last_ts"]):
                prev["last_ts"] = b.last_ts

    # Recompute roll-up totals
    grand_total = 0
    by_day_total: dict[str, int] = {}
    by_model_total: dict[str, int] = {}
    sessions_seen: set[str] = set()
    for k, b in summary_buckets.items():
        grand_total += int(b.get("total", 0))
        d = b.get("day", "unknown")
        m = b.get("model", "unknown")
        by_day_total[d] = by_day_total.get(d, 0) + int(b.get("total", 0))
        by_model_total[m] = by_model_total.get(m, 0) + int(b.get("total", 0))
        sessions_seen.add(b.get("session_id", ""))

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "schema_version": 1,
        "source": f"~/.claude/projects/{PROJECT_SLUG}/*.jsonl",
        "session_count": len(sessions_seen),
        "bucket_count": len(summary_buckets),
        "all_time_total_tokens": grand_total,
        "by_day_total": dict(sorted(by_day_total.items())),
        "by_model_total": by_model_total,
        "buckets": summary_buckets,
    }


def self_test(summary: dict) -> int:
    """Per P9.5: assert output non-zero where source is non-zero. Exit 0 on pass,
    non-zero on failure (used by post-commit hook).
    """
    n_jsonl = sum(1 for _ in TRANSCRIPTS_DIR.glob("*.jsonl"))
    grand = int(summary.get("all_time_total_tokens", 0))
    if n_jsonl > 0 and grand == 0:
        log.error("SELF-TEST FAIL: %d JSONL files present but all_time_total_tokens=0", n_jsonl)
        return 2
    if n_jsonl == 0 and grand == 0:
        log.info("SELF-TEST OK: no JSONLs present, zero is correct")
        return 0
    log.info("SELF-TEST OK: %d JSONLs → %d tokens across %d buckets",
             n_jsonl, grand, summary.get("bucket_count", 0))
    return 0


def main(argv: list[str]) -> int:
    if not TRANSCRIPTS_DIR.exists():
        log.error("transcripts dir not found: %s", TRANSCRIPTS_DIR)
        return 1

    do_self_test = "--self-test" in argv
    reset_cursor = "--reset" in argv

    cursor = {} if reset_cursor else load_cursor()
    all_new_entries: list[UsageEntry] = []
    files_scanned = 0

    for jsonl_path in sorted(TRANSCRIPTS_DIR.glob("*.jsonl")):
        files_scanned += 1
        prev_offset = int(cursor.get(jsonl_path.name, 0))
        try:
            file_size = jsonl_path.stat().st_size
        except OSError:
            continue
        if prev_offset >= file_size:
            continue
        entries, new_offset = parse_usage_entries(jsonl_path, prev_offset)
        all_new_entries.extend(entries)
        cursor[jsonl_path.name] = new_offset
        if entries:
            log.info("scanned %s: +%d new entries (offset %d→%d)",
                     jsonl_path.name, len(entries), prev_offset, new_offset)

    log.info("scanned %d JSONL file(s), found %d new assistant turns",
             files_scanned, len(all_new_entries))

    new_buckets = aggregate_to_day_buckets(iter(all_new_entries))
    summary = merge_into_summary(new_buckets)

    AGGREGATES_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    save_cursor(cursor)

    log.info("wrote %s (%d buckets, %d total tokens, %d sessions)",
             SUMMARY_PATH.name,
             summary["bucket_count"],
             summary["all_time_total_tokens"],
             summary["session_count"])

    if do_self_test:
        return self_test(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
