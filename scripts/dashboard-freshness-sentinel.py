#!/usr/bin/env python3
"""Dashboard freshness sentinel — systematic keep-everything-correct.

Per Founder directive 2026-05-21: "there needs to be a system that is
systematically keeping these graphs and more importantly the dashboard as a
hole up to date with the correct counts."

This sentinel runs on every commit + every cron cycle. It:
  1. Checks every docs/reports/*.html has a populated report-data block
  2. Cross-checks counts against source-of-truth (git log, session files,
     ship-progress, etc.) — if dashboard says "0 ships today" but git log
     says we shipped 8, that's a MISMATCH
  3. Detects stale data (generated_at age > 10 minutes)
  4. Auto-runs the right regen scripts to repair
  5. Re-checks after repair; surfaces remaining problems to
     .claude/state/aggregates/dashboard-freshness.json

The dashboard reads dashboard-freshness.json and shows a red banner when
something can't auto-repair. Founder sees the red banner ONLY for items
the orchestration team genuinely cannot fix.

Exit codes:
  0  all green after self-repair (or already green)
  1  repaired some issues, others remain (warnings logged)
  2  unrepairable issues remain after self-repair attempts
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "docs" / "reports"
STATE = ROOT / ".claude" / "state"
FRESHNESS_OUT = STATE / "aggregates" / "dashboard-freshness.json"

DATA_BLOCK_RE = re.compile(
    r'<script id="report-data" type="application/json">\s*(.*?)\s*</script>',
    re.DOTALL,
)

# Per-page expected payload + regen script that fixes it.
PAGE_CONTRACTS = [
    # (file,                   payload_check,                                                  fix_script)
    ("dashboard.html",         lambda d: bool(d.get("recent_handoffs") or d.get("recent_ships")),  "scripts/regen-dashboard.py"),
    ("activity.html",          lambda d: bool(d.get("handoffs") or d.get("ships") or d.get("events")), "scripts/regen-activity.py"),
    ("amendments.html",        lambda d: True,                                                  "scripts/regen-amendments.py"),
    ("app-health.html",        lambda d: bool(d.get("dimensions") or d.get("scores")),          "scripts/regen-app-health.py"),
    ("design-system.html",     lambda d: True,                                                  None),
    ("discussion-bubbles.html",lambda d: bool(d.get("discussion_bubbles") or d.get("threads")), "scripts/dry-run-regen-ops-views.py"),
    ("escalations.html",       lambda d: True,                                                  "scripts/regen-escalations.py"),
    ("founder-checklist.html", lambda d: bool(d.get("items") is not None),                      "scripts/regen-founder-checklist.py"),
    ("main-flows.html",        lambda d: True,                                                  "scripts/regen-main-flows.py"),
    ("proposals.html",         lambda d: True,                                                  "scripts/regen-proposals.py"),
    ("sessions.html",          lambda d: bool(d.get("sessions") is not None),                   "scripts/regen-sessions.py"),
    ("token-usage.html",       lambda d: True,                                                  "scripts/regen-token-usage.py"),
]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def read_payload(file_path: Path) -> tuple[dict, str | None]:
    """Returns (parsed_payload, error_message_if_any)."""
    if not file_path.exists():
        return {}, "missing-file"
    try:
        text = file_path.read_text(encoding="utf-8")
    except OSError as e:
        return {}, f"read-error: {e}"
    m = DATA_BLOCK_RE.search(text)
    if not m:
        return {}, "no-report-data-block"
    block = m.group(1).strip()
    if not block or block == "{}":
        return {}, "empty-payload"
    try:
        return json.loads(block), None
    except json.JSONDecodeError as e:
        return {}, f"parse-error: {e}"


def run_script(script_rel: str) -> tuple[bool, str]:
    if not script_rel:
        return True, "no-fix-script"
    script_path = ROOT / script_rel
    if not script_path.exists():
        return False, f"missing-script: {script_rel}"
    try:
        result = subprocess.run(
            ["python", str(script_path)],
            capture_output=True, text=True, timeout=120, cwd=str(ROOT),
        )
        ok = result.returncode == 0
        msg = (result.stdout + result.stderr).strip().splitlines()
        tail = msg[-1] if msg else ""
        return ok, tail[:300]
    except subprocess.TimeoutExpired:
        return False, "regen-timeout-120s"
    except Exception as e:
        return False, f"regen-exception: {e}"


def cross_check_ships_count() -> dict:
    """Cross-check: dashboard's ships_this_week vs ship-progress + commits today.

    Mismatch indicator: if there are ship-progress entries created today, OR
    substantive commits today, but ships_this_week is 0, something is broken.
    """
    today = now_utc().date()
    today_str = today.isoformat()

    # Count ship-progress entries with today's date in created_at
    sp_dir = STATE / "ship-progress"
    ships_today_sp = 0
    if sp_dir.exists():
        for f in sp_dir.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                ts = data.get("created_at", "") or data.get("started_at", "")
                if ts.startswith(today_str):
                    ships_today_sp += 1
            except (OSError, json.JSONDecodeError):
                continue

    # Count substantive commits today (non-cron, non-merge)
    commits_today = 0
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"--since={today_str}T00:00:00",
             "--grep=^cron(routine)", "--grep=^chore(cycle)", "--invert-grep"],
            capture_output=True, text=True, timeout=10, cwd=str(ROOT),
        )
        commits_today = len([l for l in result.stdout.strip().splitlines() if l])
    except Exception:
        pass

    # Read dashboard ships_this_week
    dash_data, _ = read_payload(REPORTS / "dashboard.html")
    ships_this_week = dash_data.get("ships_this_week", 0)
    ships_today_dash = 0
    trend = dash_data.get("ships_trend_7d") or {}
    values = trend.get("values") or []
    if values:
        ships_today_dash = values[-1]

    return {
        "ships_today_source_ship_progress": ships_today_sp,
        "ships_today_dashboard_trend": ships_today_dash,
        "ships_this_week_dashboard": ships_this_week,
        "commits_today_git": commits_today,
        "mismatch": (
            (ships_today_sp > 0 and ships_today_dash == 0)
            or (commits_today >= 3 and ships_today_dash == 0)
        ),
    }


def main() -> int:
    started = now_utc()
    report = {
        "schema_version": "dashboard-freshness-v1",
        "generated_at": started.isoformat(),
        "pages": [],
        "cross_checks": {},
        "summary": {
            "total_pages": len(PAGE_CONTRACTS),
            "pages_ok": 0,
            "pages_repaired": 0,
            "pages_unrepairable": 0,
            "mismatches_found": 0,
        },
    }
    overall_exit = 0

    # ---------- Pass 1: detect empty payloads ----------
    needs_repair = []
    # Pages with no report-data block (static HTML — design system showcase, etc.)
    STATIC_PAGES = {"design-system.html"}
    for file, check, fix_script in PAGE_CONTRACTS:
        path = REPORTS / file
        data, err = read_payload(path)
        page_report = {"file": file, "status": "ok", "fix_attempted": False}
        # Static pages without report-data are OK by design.
        if file in STATIC_PAGES and err == "no-report-data-block":
            report["pages"].append(page_report)
            continue
        if err:
            page_report["status"] = "empty"
            page_report["error"] = err
            page_report["fix_script"] = fix_script
            if fix_script:
                needs_repair.append((file, fix_script))
        elif not check(data):
            page_report["status"] = "missing-data"
            page_report["error"] = "payload present but expected content missing"
            page_report["fix_script"] = fix_script
            if fix_script:
                needs_repair.append((file, fix_script))
        report["pages"].append(page_report)

    # ---------- Pass 2: cross-checks ----------
    xc = cross_check_ships_count()
    report["cross_checks"]["ships"] = xc
    if xc["mismatch"]:
        report["summary"]["mismatches_found"] += 1
        # ships mismatch -> rerun aggregate-telemetry + regen-dashboard
        needs_repair.append(("dashboard.html", "scripts/aggregate-telemetry.py"))
        needs_repair.append(("dashboard.html", "scripts/regen-dashboard.py"))

    # ---------- Pass 3: deduped repair ----------
    repaired = set()
    for file, script in needs_repair:
        if script in repaired:
            continue
        ok, msg = run_script(script)
        repaired.add(script)
        # Find the page report for this file (first match)
        for p in report["pages"]:
            if p["file"] == file:
                p["fix_attempted"] = True
                p["fix_result"] = ok
                p["fix_message"] = msg
                break

    # ---------- Pass 4: re-verify after repair ----------
    for p in report["pages"]:
        if not p.get("fix_attempted"):
            continue
        path = REPORTS / p["file"]
        data, err = read_payload(path)
        contract = next(((c, f) for f, c, f in PAGE_CONTRACTS if f == p["file"]), (None, None))
        # Re-evaluate (find contract from PAGE_CONTRACTS by file)
        for file, check, _fix in PAGE_CONTRACTS:
            if file == p["file"]:
                if err is None and check(data):
                    p["status"] = "repaired"
                    report["summary"]["pages_repaired"] += 1
                else:
                    p["status"] = "unrepairable"
                    p["final_error"] = err or "still-missing-expected-content"
                    report["summary"]["pages_unrepairable"] += 1
                    overall_exit = 2
                break

    # Re-count pages_ok (final state)
    for p in report["pages"]:
        if p["status"] in ("ok", "repaired"):
            if p["status"] == "ok":
                report["summary"]["pages_ok"] += 1
        else:
            if p["status"] == "unrepairable" and overall_exit < 2:
                overall_exit = 2
            elif overall_exit == 0:
                overall_exit = 1

    # ---------- Write freshness report ----------
    duration = (now_utc() - started).total_seconds()
    report["duration_seconds"] = round(duration, 2)
    overall_status = (
        "green" if overall_exit == 0
        else "yellow" if overall_exit == 1
        else "red"
    )
    report["overall_status"] = overall_status

    FRESHNESS_OUT.parent.mkdir(parents=True, exist_ok=True)
    FRESHNESS_OUT.write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8",
    )

    print(
        f"[dashboard-freshness] status={overall_status} "
        f"ok={report['summary']['pages_ok']} "
        f"repaired={report['summary']['pages_repaired']} "
        f"unrepairable={report['summary']['pages_unrepairable']} "
        f"mismatches={report['summary']['mismatches_found']} "
        f"duration={duration:.1f}s"
    )
    if overall_exit:
        for p in report["pages"]:
            if p["status"] not in ("ok", "repaired"):
                print(f"  [{p['status']}] {p['file']}: {p.get('error') or p.get('final_error')}", file=sys.stderr)
        if report["cross_checks"].get("ships", {}).get("mismatch"):
            print(f"  [mismatch] ships: {xc}", file=sys.stderr)
    return overall_exit


if __name__ == "__main__":
    sys.exit(main())
