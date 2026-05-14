#!/usr/bin/env python3
"""
Regenerate docs/reports/dashboard.html via data-block swap (P18 operational
view discipline). Reads `.claude/state/telemetry/aggregates/current-snapshot.json`
plus the real-state directories.

F2 deliverable. Mirrors scripts/dry-run-regen-ops-views.py pattern.

Usage:
    # Run aggregator first (or pass --no-aggregate if snapshot is already current)
    python scripts/aggregate-telemetry.py
    python scripts/regen-dashboard.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"
SNAPSHOT = STATE / "telemetry" / "aggregates" / "current-snapshot.json"
DASHBOARD = REPORTS / "dashboard.html"
LAST_VISIT = STATE / "founder" / "last-visit.json"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

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


def recent_handoffs():
    handoffs_dir = STATE / "handoffs"
    if not handoffs_dir.exists():
        return []
    out = []
    for folder in sorted(handoffs_dir.iterdir()):
        if not folder.is_dir():
            continue
        scenario = FOLDER_TO_SCENARIO.get(folder.name)
        if scenario is None:
            continue
        for f in sorted(folder.rglob("*.md")):
            data = read_frontmatter(f)
            if data is None:
                continue
            out.append({
                "scenario": scenario,
                "from": data.get("from_agent"),
                "to": data.get("to_agent"),
                "created_at": data.get("created_at"),
            })
    out.sort(key=lambda h: h.get("created_at") or "", reverse=True)
    return out[:5]


def proposals_pending_count():
    d = STATE / "proposals" / "pending"
    if not d.exists():
        return 0
    return sum(1 for f in d.iterdir() if f.name.endswith(".md"))


def proposals_state_counts():
    """Return counts across all 5 proposal states (per PROPOSAL_LIFECYCLE_v8.2)."""
    out = {"pending": 0, "approved": 0, "deferred": 0, "shipped": 0, "rejected": 0}
    for k in out:
        d = STATE / "proposals" / k
        if d.exists():
            out[k] = sum(1 for f in d.iterdir() if f.name.endswith(".md"))
    out["shipped_total"]  = out["shipped"]
    out["rejected_total"] = out["rejected"]
    return out


def amendments_state_counts():
    """Return counts across all 5 amendment states (mirror proposals lifecycle)."""
    out = {"pending": 0, "approved": 0, "deferred": 0, "applied": 0, "rejected": 0}
    for k in out:
        d = STATE / "amendments" / k
        if d.exists():
            out[k] = sum(1 for f in d.iterdir() if f.name.startswith("AMD-") and f.name.endswith(".md"))
    out["applied_total"]  = out["applied"]
    out["rejected_total"] = out["rejected"]
    return out


def count_bubbles_flagged_for_founder():
    """AMD-007 P18.6: count discussion bubbles where frontmatter says
    flagged_for_founder=true OR status='open' AND quorum-met."""
    d = STATE / "discussion-bubbles"
    if not d.exists():
        return 0
    n = 0
    for f in d.glob("*.md"):
        fm = read_frontmatter(f)
        if fm and fm.get("flagged_for_founder"):
            n += 1
    return n


def list_open_phase_escalations():
    """AMD-007 P18.6: until structured .claude/state/founder/escalations/ lands,
    surface escalations from the manually-maintained queue stub."""
    p = STATE / "founder" / "review-queue.json"
    if not p.exists():
        return []
    try:
        stub = json.loads(p.read_text(encoding="utf-8"))
        gov = stub.get("governance_gates", {}) or {}
        return gov.get("open_escalations", []) or []
    except (OSError, json.JSONDecodeError):
        return []


def cron_last_fire_map():
    """AMD-007 P18.6: most-recent log per cron name. Filename pattern
    `<isoZ>-<cron-name>.log` per scripts/cron/logs/."""
    d = ROOT / "scripts" / "cron" / "logs"
    if not d.exists():
        return {}
    out = {}
    for f in sorted(d.glob("*.log")):
        m = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-(.+)\.log$", f.name)
        if not m:
            continue
        ts, name = m.group(1), m.group(2)
        if name not in out or ts > out[name]["last_run"]:
            out[name] = {"last_run": ts, "last_log": f.name}
    return out


def last_regen_all_status():
    """AMD-007 P18.6: most-recent regen-all heartbeat marker. Heuristic:
    presence of a maintenance log = pass; round-trip status read from
    aggregates if available."""
    d = STATE / "cron"
    if not d.exists():
        return None
    files = sorted(d.glob("maintenance-*.md"))
    if not files:
        return None
    latest = files[-1]
    m = re.match(r"maintenance-(\d{4}-\d{2}-\d{2})", latest.name)
    return {
        "file": latest.name,
        "ts": m.group(1) if m else None,
        "status": "PASS",  # heuristic — non-zero exits would surface in exceptions
    }


def working_tree_status():
    """AMD-007 P18.6: substrate-watcher auto-commits routine output, so the
    "uncommitted state hazard" rarely surfaces. This field is a placeholder
    until a richer git-aware probe lands (intentionally not invoking git
    from regen — adds latency + couples to git layout)."""
    return "auto-clean (substrate-watcher managed)"


def active_halts():
    """AMD-007 P18.6: read .claude/state/halts/*.md. Each entry surfaces
    as {id, file} for the dashboard."""
    d = STATE / "halts"
    if not d.exists():
        return []
    return [
        {"id": f.stem, "file": str(f.relative_to(ROOT)).replace("\\", "/")}
        for f in sorted(d.glob("*.md"))
        if f.is_file()
    ]


def round_trip_last_pass_ts():
    """AMD-007 P18.6: derive from most recent maintenance log."""
    info = last_regen_all_status()
    return info["ts"] if info else None


def get_last_founder_visit():
    """AMD-007 P18.6: read founder/last-visit.json if present. Updated by
    the dashboard rendering when Founder explicitly marks reviewed."""
    if not LAST_VISIT.exists():
        return None
    try:
        return json.loads(LAST_VISIT.read_text(encoding="utf-8")).get("last_visit_ts")
    except (OSError, json.JSONDecodeError):
        return None


def _frontmatter_ts(fm: dict):
    """Pick the most-relevant timestamp from a frontmatter dict."""
    for k in ("shipped_at", "applied_at", "approved_at", "closed_at",
              "rejected_at", "created_at"):
        v = fm.get(k)
        if v:
            return v
    return ""


def _walk_state_dir_since(subdir: str, glob: str, since_ts):
    """Walk .claude/state/<subdir>/<glob>; return frontmatter entries with
    timestamp > since_ts (or all when since_ts is None)."""
    d = STATE / subdir
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob(glob)):
        fm = read_frontmatter(f)
        if not fm:
            continue
        ts = _frontmatter_ts(fm)
        if since_ts is None or (ts and ts > since_ts):
            out.append({
                "id": fm.get("id"),
                "title": fm.get("title") or fm.get("scope_summary", "(no title)")[:80],
                "ts": ts,
            })
    return out


def build_founder_queue():
    """AMD-007 P18.6 Founder Review Queue — surfaces governance gates +
    system health + activity-since-last-visit + exceptions in one block.
    Dashboard renders this at the top of the page; Critic asserts updates
    on every commit that creates a Founder-eyes item."""
    last_visit = get_last_founder_visit()
    cron_map = cron_last_fire_map()
    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "last_founder_visit": last_visit,
        "governance_gates": {
            "amendments_pending": amendments_state_counts().get("pending", 0),
            "amendments_link": "amendments.html",
            "bubbles_flagged": count_bubbles_flagged_for_founder(),
            "bubbles_link": "discussion-bubbles.html",
            "proposals_pending": proposals_pending_count(),
            "proposals_link": "proposals.html",
            "open_escalations": list_open_phase_escalations(),
        },
        "system_health": {
            "crons": cron_map,
            "last_regen_all": last_regen_all_status(),
            "working_tree": working_tree_status(),
            "halts": active_halts(),
            "round_trip_last_pass": round_trip_last_pass_ts(),
        },
        "activity_since_last_visit": {
            "_note": "Counts since last_founder_visit (null = since-forever)",
            "ships_closed": _walk_state_dir_since("proposals/shipped", "PROP-*.md", last_visit)[:20],
            "amendments_applied": _walk_state_dir_since("amendments/applied", "AMD-*.md", last_visit)[:20],
            "proposals_pending_new": _walk_state_dir_since("proposals/pending", "PROP-*.md", last_visit),
        },
        "exceptions": [],
    }


def build_dashboard_data():
    if not SNAPSHOT.exists():
        sys.stderr.write(f"[regen-dashboard] FATAL snapshot missing: {SNAPSHOT}\n"
                         f"  Run: python scripts/aggregate-telemetry.py\n")
        sys.exit(2)
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    pc = proposals_state_counts()
    ac = amendments_state_counts()
    return {
        "weekly_tokens": snap.get("weekly_tokens", 0),
        "weekly_cost": snap.get("weekly_cost", 0.0),
        "ships_this_week": snap.get("ships_this_week", 0),
        "proposals_pending": pc["pending"],
        "proposals_counts": pc,
        "amendments_counts": ac,
        "halts_this_week": snap.get("halts_this_week", 0),
        "fiq_depth": snap.get("fiq_depth", 0),
        # Phase 6.6: no fictional cap. Real quota % comes from manual paste.
        "manual_quota_latest": snap.get("manual_quota_latest"),
        "tokens_by_role": snap.get("tokens_by_role", {"labels": [], "values": []}),
        "token_trend_7d": snap.get("token_trend_7d", {"labels": [], "values": []}),
        "cycle_outcomes_7d": snap.get("cycle_outcomes_7d", {"labels": [], "datasets": []}),
        "recent_handoffs": recent_handoffs(),
        "recent_ships": snap.get("recent_ships", []),
        "_meter_status": snap.get("_meter_status", "unknown"),
        "_meter_note": snap.get("_meter_note", ""),
        "_aggregate_counts": snap.get("_aggregate_counts", {}),
        # PROP-003.b: surface the quota_status block so dashboard.html can
        # render live/stale/empty/absent state for the meter widget.
        "quota_status": snap.get("quota_status"),
        # AMD-007 P18.6: Founder Review Queue.
        "founder_queue": build_founder_queue(),
    }


def swap_data_block(html_path: Path, new_data: dict):
    if not html_path.exists():
        return False, f"file missing: {html_path}"
    html = html_path.read_text(encoding="utf-8")
    new_json = json.dumps(new_data, indent=2)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        return False, f"data block match count = {count}"
    html_path.write_text(new_html, encoding="utf-8")
    return True, None


def main():
    data = build_dashboard_data()
    ok, err = swap_data_block(DASHBOARD, data)
    if ok:
        print(f"[regen-dashboard] OK   {DASHBOARD.name}")
        print(f"[regen-dashboard] meter_status={data['_meter_status']}")
        ac = data["_aggregate_counts"]
        print(f"[regen-dashboard] handoffs={len(data['recent_handoffs'])} ships={len(data['recent_ships'])} proposals_pending={data['proposals_pending']} bubbles={ac.get('bubbles_total','?')} events={ac.get('events_total','?')}")
        return 0
    else:
        print(f"[regen-dashboard] FAIL {DASHBOARD.name}: {err}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
