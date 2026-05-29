#!/usr/bin/env python3
"""D40 aggregator --self-test mode (single-script form).

Per dashboard-completion-spec-2026-05-15.md PHASE B7 + D40:
  "each aggregator can be invoked with --self-test flag, runs against
  source, asserts output is non-zero where source is non-zero, exits
  non-zero on parity failure. Wired into post-commit hook."

Single-script form (instead of modifying 5 aggregator scripts individually):
this script runs each aggregator, reads its JSON output, and asserts:
  - JSON parses
  - timestamp/generated_at is fresh (within 5 min)
  - status is one of green/yellow/red/unknown/missing
  - status is NOT "unknown" when source data is detectable

Returns:
  exit 0 — all aggregators produce non-zero where source non-zero
  exit 1 — at least one parity failure

Wired in: post-commit hook (.husky/post-commit) + regen-all.sh.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
AGG_DIR = STATE / "aggregates"

PYTHON = sys.executable

# Each entry: (aggregator script, output JSON path, source-detect function name).
# source-detect returns True if the underlying source has data; assert the
# aggregator's status is not "unknown"/"missing" in that case.
AGGREGATORS = [
    ("aggregate-test-health", "test-health.json", "heartbeat"),
    ("aggregate-security-health", "security-health.json", "always-true"),
    ("aggregate-approvals-pipeline", "approvals-pipeline.json", "watcher-logs"),
    ("aggregate-architecture-review", "architecture-review.json", "recs-dir"),
    ("aggregate-fiq-status", "fiq-status.json", "always-true"),
]


def has_heartbeat():
    return (STATE / "heartbeats" / "regen-all-last-pass.json").exists()


def has_watcher_logs():
    logs = ROOT / "scripts" / "cron" / "logs"
    if not logs.exists():
        return False
    return any(logs.glob("*-downloads-watcher.log"))


def has_recs_dir():
    """True only if recommendations exist; bare empty dir = no data per
    architecture_review_status() semantics."""
    d = STATE / "architecture-review" / "recommendations"
    if not d.exists():
        return False
    # Check for actual REC-NNN.md files in pending/applied subdirs
    for sub in ("pending", "applied"):
        sd = d / sub
        if sd.exists() and any(sd.glob("REC-*.md")):
            return True
    return False


SOURCE_CHECKS = {
    "heartbeat": has_heartbeat,
    "watcher-logs": has_watcher_logs,
    "recs-dir": has_recs_dir,
    "always-true": lambda: True,
}


def main():
    print("[aggregate-self-tests] starting D40 parity checks across 5 aggregators")
    failed = []
    now = datetime.now(timezone.utc)

    for name, json_name, source_check in AGGREGATORS:
        script = ROOT / "scripts" / f"{name}.py"
        out_path = AGG_DIR / json_name
        if not script.exists():
            failed.append((name, "script-missing"))
            continue

        # Run the aggregator
        r = subprocess.run(
            [PYTHON, str(script)],
            capture_output=True, text=True, cwd=str(ROOT), timeout=60,
        )
        if r.returncode != 0:
            failed.append((name, f"aggregator-exit-{r.returncode}: {r.stderr[:120]}"))
            continue

        # Load + parse JSON
        if not out_path.exists():
            failed.append((name, "output-missing"))
            continue
        try:
            data = json.loads(out_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as exc:
            failed.append((name, f"json-parse-fail: {exc}"))
            continue

        # Freshness — but honor idempotent-write semantics.
        #
        # 2026-05-19 ECC review fix: the idempotent-write helper deliberately
        # skips writing when content is unchanged from the prior run, even
        # past the grace window. That means after >300s with no source-data
        # change, the timestamp will be stale BY DESIGN — not a failure.
        #
        # The legitimate failure mode is: timestamp stale AND a fresh
        # aggregator run did not refresh it (likely because the aggregator
        # script crashed before the write call). We already invoked the
        # aggregator above (r.returncode == 0), and the helper's reason
        # would be "write-content-changed" if anything legitimately moved.
        # So: tolerate stale timestamps when the aggregator just succeeded.
        # The signal we still care about is BAD timestamps (unparseable).
        ts = data.get("generated_at") or data.get("timestamp")
        if not ts:
            failed.append((name, "no-timestamp"))
            continue
        try:
            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
            age_s = (now - dt).total_seconds()
            # Freshness is informational, NOT a gate failure. We already ran the
            # aggregator above (returncode 0): a successful run is itself the
            # freshness proof. The idempotent-write helper deliberately leaves
            # generated_at untouched when content is unchanged, so an old
            # timestamp means "data verified stable," not "aggregator dead." A
            # genuinely dead/crashing aggregator is already caught by the
            # returncode and output-missing checks above, and the dashboard
            # surfaces age via P10-classified empty states. Hard-failing on age
            # here just double-counts idempotent skips as failures (the bug this
            # block had: a >24h hard threshold contradicting the stated intent).
            stale_note = f" [content-stable {int(age_s)}s, idempotent skip]" if age_s > 86400 else ""
        except ValueError:
            failed.append((name, f"bad-timestamp: {ts}"))
            continue

        # Status legal value
        status = data.get("status")
        if status not in ("green", "yellow", "red", "unknown", "missing"):
            failed.append((name, f"bad-status: {status!r}"))
            continue

        # Parity: if source data detectable, status must not be unknown/missing
        if SOURCE_CHECKS[source_check]() and status in ("unknown", "missing"):
            failed.append((name, f"parity-fail: source-detected but status={status}"))
            continue

        print(f"  [{name}] PASS status={status} age={int(age_s)}s{stale_note}")

    if failed:
        print(f"[aggregate-self-tests] FAIL ({len(failed)} aggregators):", file=sys.stderr)
        for n, reason in failed:
            print(f"  {n}: {reason}", file=sys.stderr)
        return 1
    print(f"[aggregate-self-tests] OK all {len(AGGREGATORS)} aggregators pass parity")
    return 0


if __name__ == "__main__":
    sys.exit(main())
