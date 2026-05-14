#!/usr/bin/env python3
"""
PROP-003.b acceptance verifier: end-to-end check that quota-status.json
flows through the aggregators into the snapshots with correct freshness
gating + state transitions.

Tests four states:
  1. ABSENT — quota-status.json missing → meter_status="wired-estimated"
  2. EMPTY  — file present, data_source="none" or weekly_tokens=0
             → meter_status="wired-estimated-sidecar-empty"
  3. STALE  — file present, fresh data, but as_of > 6h ago
             → meter_status="wired-estimated-sidecar-stale"
  4. FRESH  — file present, fresh data, real source
             → meter_status="wired-real"

For each test: rename/synthesize the quota-status.json, run both
aggregators, parse snapshots, assert state. Restores original file at end.

Exits 0 on full pass, non-zero on any failure.

Usage:
  python scripts/verify-meter-wiring.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
QS = STATE / "quota-status.json"
SNAP = STATE / "telemetry" / "aggregates" / "current-snapshot.json"
TU = STATE / "telemetry" / "aggregates" / "token-usage-snapshot.json"

PYTHON = sys.executable

failures = []

def run_aggregators():
    """Run both aggregators; raise if either fails."""
    subprocess.run([PYTHON, str(ROOT / "scripts" / "aggregate-telemetry.py")],
                   check=True, capture_output=True)
    subprocess.run([PYTHON, str(ROOT / "scripts" / "aggregate-token-usage.py")],
                   check=True, capture_output=True)

def read_snap():
    return json.loads(SNAP.read_text(encoding="utf-8"))

def read_tu():
    return json.loads(TU.read_text(encoding="utf-8"))

def assert_state(label, expected_state):
    snap = read_snap()
    tu = read_tu()
    snap_ms = snap.get("_meter_status")
    tu_ms = tu.get("_meter_status")
    snap_qs_state = (snap.get("quota_status") or {}).get("state")
    tu_qs_state = (tu.get("quota_status") or {}).get("state")
    ok_ms = snap_ms == expected_state == tu_ms
    print(f"  [{label}] snap._meter_status={snap_ms} tu._meter_status={tu_ms}  expected={expected_state}  {'PASS' if ok_ms else 'FAIL'}")
    if not ok_ms:
        failures.append((label, f"meter_status mismatch: snap={snap_ms} tu={tu_ms} expected={expected_state}"))
    return ok_ms

def main():
    print("[verify-meter-wiring] testing 4 states; restores original at end\n")
    # Snapshot the original file (if it exists)
    original_qs = None
    if QS.exists():
        original_qs = QS.read_text(encoding="utf-8")
        print(f"[setup] original quota-status.json backed up ({len(original_qs)} bytes)")
    try:
        # State 1: ABSENT
        if QS.exists():
            QS.unlink()
        run_aggregators()
        snap = read_snap()
        ms = snap.get("_meter_status")
        # "wired-estimated" if any tokens_by_role events; "gap-per-F1a" otherwise
        ok = ms in ("wired-estimated", "gap-per-F1a")
        print(f"  [absent] snap._meter_status={ms}  expected={{wired-estimated, gap-per-F1a}}  {'PASS' if ok else 'FAIL'}")
        if not ok:
            failures.append(("absent", f"_meter_status={ms} not in expected set"))

        # State 2: EMPTY
        empty_obj = {
            "schema_version": 1,
            "as_of": datetime.now(timezone.utc).isoformat(),
            "data_source": "none",
            "weekly_tokens": 0,
            "weekly_cap": 3_500_000,
            "weekly_pct": None,
            "org_monthly_tokens": 0,
            "org_monthly_cap": None,
            "org_monthly_pct": None,
        }
        QS.write_text(json.dumps(empty_obj, indent=2), encoding="utf-8")
        run_aggregators()
        assert_state("empty", "wired-estimated-sidecar-empty")

        # State 3: STALE
        stale_obj = {
            "schema_version": 1,
            "as_of": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
            "data_source": "scraped",
            "weekly_tokens": 1_234_000,
            "weekly_cap": 3_500_000,
            "weekly_pct": 35.3,
            "org_monthly_tokens": 14_000_000,
            "org_monthly_cap": 100_000_000,
            "org_monthly_pct": 14.0,
        }
        QS.write_text(json.dumps(stale_obj, indent=2), encoding="utf-8")
        run_aggregators()
        assert_state("stale", "wired-estimated-sidecar-stale")

        # State 4: FRESH
        fresh_obj = {
            "schema_version": 1,
            "as_of": datetime.now(timezone.utc).isoformat(),
            "data_source": "scraped",
            "weekly_tokens": 1_234_000,
            "weekly_cap": 3_500_000,
            "weekly_pct": 35.3,
            "org_monthly_tokens": 14_000_000,
            "org_monthly_cap": 100_000_000,
            "org_monthly_pct": 14.0,
        }
        QS.write_text(json.dumps(fresh_obj, indent=2), encoding="utf-8")
        run_aggregators()
        if assert_state("fresh", "wired-real"):
            # Additional fresh-state asserts: snapshot's weekly_tokens should match
            snap = read_snap()
            wt = snap.get("weekly_tokens")
            if wt == 1_234_000:
                print(f"  [fresh] snapshot weekly_tokens={wt} matches sidecar  PASS")
            else:
                print(f"  [fresh] snapshot weekly_tokens={wt} expected=1234000  FAIL")
                failures.append(("fresh", f"weekly_tokens passthrough mismatch: got {wt}"))
    finally:
        # Restore
        if original_qs is not None:
            QS.write_text(original_qs, encoding="utf-8")
            print(f"\n[restore] original quota-status.json restored")
        elif QS.exists():
            QS.unlink()
            print(f"\n[restore] synthesized quota-status.json deleted (original was absent)")
        # Re-run aggregators so the snapshots reflect actual state, not test state
        run_aggregators()
        print(f"[restore] aggregators re-run; snapshots reflect real state")

    if failures:
        print(f"\nverify-meter-wiring: FAIL ({len(failures)} failures)")
        for label, msg in failures:
            print(f"  - {label}: {msg}")
        return 1
    print(f"\nverify-meter-wiring: PASS (4/4 states correct)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
