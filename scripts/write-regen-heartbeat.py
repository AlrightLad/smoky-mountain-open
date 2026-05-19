#!/usr/bin/env python3
"""Write .claude/state/heartbeats/regen-all-last-pass.json on successful regen.

Per dashboard-completion-spec-2026-05-15.md PHASE I polish + 2026-05-19
post-commit redundancy expansion.

Called from:
  - scripts/regen-all.sh after all regen + round-trip-test (status=PASS/GATE-FAIL,
    source=regen-all.sh)
  - .husky/post-commit after the in-hook regen subset (source=post-commit-hook)
  - .husky/post-commit recursion-guard early-exit branch (source=
    post-commit-hook-fast, status=PASS-COMMIT, just records that a commit
    happened so the dashboard knows the team is alive even when full regen
    didn't fire)

Env vars (all optional):
  HEARTBEAT_STATUS   PASS (default) | GATE-FAIL | PASS-COMMIT | STALE
  HEARTBEAT_SOURCE   regen-all.sh (default) | post-commit-hook |
                     post-commit-hook-fast | watcher | manual
  HEARTBEAT_DURATION integer seconds (default 0)

The heartbeat is consumed by:
  - aggregate-test-health.py (computes status from heartbeat age)
  - regen-dashboard.last_regen_all_status() (round-trip last pass banner)

Schema (single source of truth; readers must tolerate missing keys):
  ts, timestamp, generated_at      ISO-8601 UTC (all three for back-compat)
  last_pass_at_utc                 ISO-8601 UTC (legacy key)
  last_pass_at_human               Human-readable
  status                           See HEARTBEAT_STATUS values above
  age_minutes                      0 at write
  duration_seconds                 Pipeline duration (0 for fast/commit-only)
  head_sha                         Short SHA at time of write
  source                           See HEARTBEAT_SOURCE values above

Exit 0 always (heartbeat write is best-effort; failure shouldn't block
regen).
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / ".claude" / "state" / "heartbeats" / "regen-all-last-pass.json"


def git_head_short() -> str:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
            timeout=5,
            check=False,
        )
        return r.stdout.strip() if r.returncode == 0 else "unknown"
    except (OSError, subprocess.SubprocessError):
        return "unknown"


def main() -> int:
    now_dt = datetime.now(timezone.utc).replace(microsecond=0)
    iso = now_dt.isoformat().replace("+00:00", "Z")
    human = now_dt.strftime("%Y-%m-%d %H:%M UTC")

    status = os.environ.get("HEARTBEAT_STATUS", "PASS")
    source = os.environ.get("HEARTBEAT_SOURCE", "regen-all.sh")
    duration_raw = os.environ.get("HEARTBEAT_DURATION", "0")
    try:
        duration_seconds = int(duration_raw)
    except ValueError:
        duration_seconds = 0

    out = {
        # Modern keys (used by current consumers)
        "ts": iso,
        "timestamp": iso,
        "generated_at": iso,
        # Legacy keys (preserved for schema parity with the PowerShell writer)
        "last_pass_at_utc": iso,
        "last_pass_at_human": human,
        "status": status,
        "age_minutes": 0,
        "duration_seconds": duration_seconds,
        "head_sha": git_head_short(),
        "source": source,
    }
    try:
        TARGET.parent.mkdir(parents=True, exist_ok=True)
        TARGET.write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"[write-regen-heartbeat] OK ts={iso} source={source} status={status}")
    except OSError as exc:
        print(f"[write-regen-heartbeat] WARN failed: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
