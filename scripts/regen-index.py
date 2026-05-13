#!/usr/bin/env python3
"""
Regenerate docs/reports/index.html via data-block swap.

Reads:
  - .claude/state/telemetry/aggregates/current-snapshot.json
  - Dashboard file mtimes (5 dashboards)
  - git rev-parse HEAD for short sha
  - State directory counts (bubbles, proposals, halts, FIQ entries, cron runs)

Writes the status panel + dashboard card metadata into the index.html data block.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"
INDEX = REPORTS / "index.html"
SNAPSHOT = STATE / "telemetry" / "aggregates" / "current-snapshot.json"

DASHBOARDS = [
    "dashboard.html",
    "activity.html",
    "discussion-bubbles.html",
    "proposals.html",
    "main-flows.html",
]

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def short_git_sha():
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short=8", "HEAD"],
            capture_output=True, text=True, cwd=str(ROOT), timeout=5,
        )
        if r.returncode == 0:
            return r.stdout.strip()
    except Exception:
        pass
    return None


def file_mtime_iso(path: Path):
    if not path.exists():
        return None
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


def count_dir(path: Path, pattern: str = "*.md"):
    if not path.exists():
        return 0
    return sum(1 for _ in path.glob(pattern))


def count_proposals_pending():
    return count_dir(STATE / "proposals" / "pending", "*.md")


def count_discussion_bubbles():
    return count_dir(STATE / "discussion-bubbles", "*.md")


def count_open_bubbles():
    """Count bubbles whose status is 'open' (not closed)."""
    d = STATE / "discussion-bubbles"
    if not d.exists():
        return 0
    open_count = 0
    for f in d.glob("*.md"):
        body = f.read_text(encoding="utf-8")
        m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
        if not m:
            continue
        try:
            data = json.loads(m.group(1))
            if data.get("status") == "open":
                open_count += 1
        except Exception:
            continue
    return open_count


def fiq_grade_distribution():
    """Scan FIQ queue for grade letters; count A/B/C/D/F."""
    d = STATE / "founder-input-queue"
    dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    if not d.exists():
        return dist
    for f in d.glob("*.md"):
        body = f.read_text(encoding="utf-8")
        # Match either YAML-frontmatter rubric_grade.letter or JSON rubric_grade.letter
        m_yaml = re.search(r"\brubric_grade\b.*?\bletter:\s*([A-F])", body, re.DOTALL)
        m_json = re.search(r'"rubric_grade"\s*:\s*\{[^}]*"letter"\s*:\s*"([A-F])"', body, re.DOTALL)
        letter = (m_json.group(1) if m_json else (m_yaml.group(1) if m_yaml else None))
        if letter in dist:
            dist[letter] += 1
    return dist


def latest_halt():
    d = STATE / "halts"
    if not d.exists():
        return "none"
    halts = sorted(d.rglob("halt-*.json"))
    return halts[-1].stem if halts else "none"


def last_cron_run():
    d = STATE / "cron"
    if not d.exists():
        return None
    runs = sorted(d.glob("*-overnight-run.md"))
    return file_mtime_iso(runs[-1]) if runs else None


def last_orchestration_action():
    """Heuristic: most-recently-modified file across the state tree (excluding logs/tmp)."""
    latest_path, latest_ts = None, 0
    for p in STATE.rglob("*"):
        if p.is_file() and p.suffix in (".md", ".json"):
            mt = p.stat().st_mtime
            if mt > latest_ts:
                latest_ts = mt
                latest_path = p
    if latest_path is None:
        return None
    rel = latest_path.relative_to(ROOT)
    ts = datetime.fromtimestamp(latest_ts, tz=timezone.utc).isoformat()
    return f"{rel.as_posix()} at {ts}"


def build_dashboard_meta():
    out = {}
    for name in DASHBOARDS:
        p = REPORTS / name
        out[name] = {"mtime_utc": file_mtime_iso(p), "badge": ""}
    proposals_pending = count_proposals_pending()
    bubbles_total = count_discussion_bubbles()
    handoffs_total = 0
    handoffs_dir = STATE / "handoffs"
    if handoffs_dir.exists():
        for folder in handoffs_dir.iterdir():
            if folder.is_dir():
                handoffs_total += sum(1 for _ in folder.rglob("*.md"))
    if "proposals.html" in out:
        out["proposals.html"]["badge"] = f"{proposals_pending} pending" if proposals_pending else "0 pending"
    if "discussion-bubbles.html" in out:
        out["discussion-bubbles.html"]["badge"] = f"{bubbles_total} threads"
    if "activity.html" in out:
        out["activity.html"]["badge"] = f"{handoffs_total} handoffs"
    if "main-flows.html" in out:
        # Try to read the flow count from main-flows.html data block (if it exists)
        mfp = REPORTS / "main-flows.html"
        flow_count = 0
        if mfp.exists():
            html = mfp.read_text(encoding="utf-8")
            m = DATA_BLOCK_RE.search(html)
            if m:
                try:
                    data = json.loads(m.group(2))
                    flow_count = len(data.get("flows", []))
                except Exception:
                    pass
        out["main-flows.html"]["badge"] = f"{flow_count} flows" if flow_count else ""
    if "dashboard.html" in out:
        if SNAPSHOT.exists():
            try:
                s = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
                meter = s.get("_meter_status", "unknown")
                out["dashboard.html"]["badge"] = "meter " + meter
            except Exception:
                pass
    return out, proposals_pending, bubbles_total


def build_index_data():
    proposals_pending = count_proposals_pending()
    bubbles_total = count_discussion_bubbles()
    bubbles_open = count_open_bubbles()
    grade_dist = fiq_grade_distribution()
    fiq_depth_b_plus = grade_dist.get("A", 0) + grade_dist.get("B", 0)
    ships_this_week = 0
    if SNAPSHOT.exists():
        try:
            ships_this_week = json.loads(SNAPSHOT.read_text(encoding="utf-8")).get("ships_this_week", 0)
        except Exception:
            pass
    dashboards_meta, _, _ = build_dashboard_meta()
    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "git_sha": short_git_sha(),
        "status": {
            "ships_this_week": ships_this_week,
            "proposals_pending": proposals_pending,
            "fiq_depth_b_plus": fiq_depth_b_plus,
            "fiq_grade_distribution": grade_dist,
            "open_discussion_bubbles": bubbles_open if bubbles_open else bubbles_total,
            "open_bubbles_explicit": bubbles_open,
            "total_bubbles": bubbles_total,
            "last_cron_run": last_cron_run(),
            "halt_state": latest_halt(),
        },
        "dashboards": dashboards_meta,
        "last_orchestration_action": last_orchestration_action(),
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
    data = build_index_data()
    ok, err = swap_data_block(INDEX, data)
    if ok:
        print(f"[regen-index] OK   {INDEX.name}")
        s = data["status"]
        print(f"[regen-index] ships={s['ships_this_week']} proposals_pending={s['proposals_pending']} bubbles={s['open_discussion_bubbles']} halt={s['halt_state']} git={data['git_sha']}")
        return 0
    else:
        print(f"[regen-index] FAIL {INDEX.name}: {err}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
