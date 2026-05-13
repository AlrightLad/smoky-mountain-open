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
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"
SNAPSHOT = STATE / "telemetry" / "aggregates" / "current-snapshot.json"
DASHBOARD = REPORTS / "dashboard.html"

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


def build_dashboard_data():
    if not SNAPSHOT.exists():
        sys.stderr.write(f"[regen-dashboard] FATAL snapshot missing: {SNAPSHOT}\n"
                         f"  Run: python scripts/aggregate-telemetry.py\n")
        sys.exit(2)
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    pc = proposals_state_counts()
    return {
        "weekly_tokens": snap.get("weekly_tokens", 0),
        "weekly_cost": snap.get("weekly_cost", 0.0),
        "ships_this_week": snap.get("ships_this_week", 0),
        "proposals_pending": pc["pending"],
        "proposals_counts": pc,
        "halts_this_week": snap.get("halts_this_week", 0),
        "fiq_depth": snap.get("fiq_depth", 0),
        "budget_pct": snap.get("budget_pct", 0.0),
        "tokens_by_role": snap.get("tokens_by_role", {"labels": [], "values": []}),
        "token_trend_7d": snap.get("token_trend_7d", {"labels": [], "values": []}),
        "cycle_outcomes_7d": snap.get("cycle_outcomes_7d", {"labels": [], "datasets": []}),
        "recent_handoffs": recent_handoffs(),
        "recent_ships": snap.get("recent_ships", []),
        "_meter_status": snap.get("_meter_status", "unknown"),
        "_meter_note": snap.get("_meter_note", ""),
        "_aggregate_counts": snap.get("_aggregate_counts", {}),
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
