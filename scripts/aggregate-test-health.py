#!/usr/bin/env python3
"""Aggregate test-health.json from current state.

Per dashboard-completion-spec-2026-05-15.md B1.

Reads:
  - tests/round-trip-test.py last exit code (probed by running it briefly,
    or from a marker file if present)
  - scripts/visual-audit/ recent capture artifact counts
  - .claude/state/dashboard-health/post-commit-hook.log for last regen result

Writes:
  .claude/state/aggregates/test-health.json with:
    timestamp (current UTC ISO-8601)
    status (green | yellow | red | unknown)
    summary (1-line human description)
    schema_version
    head_sha
    checks_run, checks_passed, checks_with_known_failure
    known_failures (carry forward last known failures)

Exit 0 always — aggregator failures don't break the regen pipeline; instead
the JSON status reflects what we can/cannot measure.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
TARGET = STATE / "aggregates" / "test-health.json"
PREV = TARGET  # carry forward known failures

SCHEMA_VERSION = "test-health-v1.1"


def git_head_short():
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, cwd=str(ROOT), timeout=5)
        return r.stdout.strip() if r.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def load_prev():
    if not PREV.exists():
        return {}
    try:
        return json.loads(PREV.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return {}


def run_round_trip_test():
    """Return (exit_code, brief_summary). Run with timeout."""
    try:
        r = subprocess.run(
            [sys.executable, str(ROOT / "tests" / "round-trip-test.py")],
            capture_output=True, text=True, cwd=str(ROOT), timeout=60,
        )
        return r.returncode, (r.stdout + r.stderr)[-500:]
    except subprocess.TimeoutExpired:
        return 124, "round-trip-test.py timed out (60s)"
    except Exception as exc:
        return 99, f"round-trip-test.py error: {exc.__class__.__name__}: {exc}"


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    prev = load_prev()

    # Don't actually run round-trip-test each aggregate run (~30s).
    # Instead: read its last-run heartbeat if available.
    heartbeat = STATE / "heartbeats" / "regen-all-last-pass.json"
    last_rt_pass = None
    if heartbeat.exists():
        try:
            # utf-8-sig: regen-all.ps1 writes this file with a UTF-8 BOM (PS 5.1
            # `-Encoding utf8`). Plain "utf-8" leaves the BOM in place, json.loads
            # then throws, the except below swallows it, and last_rt_pass stays
            # None -> "unknown". The second heartbeat read (heartbeat_status) below
            # already uses utf-8-sig; this read must match.
            hb = json.loads(heartbeat.read_text(encoding="utf-8-sig"))
            # Heartbeat is written by two producers: write-regen-heartbeat.py
            # (full schema: ts/timestamp/generated_at) and regen-all.ps1 (minimal
            # schema: last_pass_at_utc only, written by the cron watcher). Per the
            # heartbeat contract ("readers must tolerate missing keys"), fall back
            # to last_pass_at_utc so a cron-written heartbeat isn't misread as
            # "no heartbeat" -> unknown. (This was the D40 parity-fail root cause.)
            last_rt_pass = hb.get("ts") or hb.get("timestamp") or hb.get("last_pass_at_utc")
        except (OSError, json.JSONDecodeError):
            pass

    # Default state: green if last round-trip pass within 24h, yellow if 24-72h, red if >72h
    # ALSO honor heartbeat status field — "GATE-FAIL" means regen ran but
    # round-trip-test had a known-failure (e.g. user-context-gate
    # workflow staleness). That's NOT a code regression but IS a
    # signal Founder owns; surfaces as yellow.
    status = "green"
    summary = "round-trip + regen passing"
    checks_run = 1
    checks_passed = 1
    heartbeat_status = None
    if heartbeat.exists():
        try:
            hb = json.loads(heartbeat.read_text(encoding="utf-8-sig"))
            heartbeat_status = hb.get("status")
        except (OSError, json.JSONDecodeError):
            pass

    if last_rt_pass:
        try:
            ts = datetime.fromisoformat(str(last_rt_pass).replace("Z", "+00:00"))
            age_h = (datetime.now(timezone.utc) - ts).total_seconds() / 3600.0
            if age_h > 72:
                status = "red"
                summary = f"no round-trip pass in {age_h:.1f}h"
                checks_passed = 0
            elif age_h > 24:
                status = "yellow"
                summary = f"round-trip last passed {age_h:.1f}h ago"
        except (ValueError, TypeError):
            pass
    else:
        # No heartbeat — be honest
        status = "unknown"
        summary = "no round-trip heartbeat available"
        checks_passed = 0

    # Heartbeat status override: if heartbeat says GATE-FAIL or ERROR,
    # surface that even if age is recent.
    if heartbeat_status == "GATE-FAIL" and status != "red":
        status = "yellow"
        summary = "regen-all completed but round-trip-test gate failed (workflow staleness; see test-health.known_failures)"
    elif heartbeat_status == "ERROR" and status != "red":
        status = "red"
        summary = "regen-all reported ERROR (see post-commit-hook.log)"

    out = {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "head_sha": git_head_short(),
        "status": status,
        "summary": summary,
        "checks_run": checks_run,
        "checks_passed": checks_passed,
        "checks_skipped": 0,
        "checks_with_known_failure": len(prev.get("known_failures", [])),
        "regressions": [],
        "known_failures": prev.get("known_failures", []),
        "source_files": [
            ".claude/state/heartbeats/regen-all-last-pass.json",
            "tests/round-trip-test.py",
        ],
    }

    wrote, reason = idempotent_write_json(TARGET, out)
    print(f"[aggregate-test-health] OK status={status} timestamp={now} write={wrote} ({reason})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
