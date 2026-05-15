#!/usr/bin/env python3
"""
Wave Zero Dry-Run helper — regenerate the three operational views
(discussion-bubbles.html, activity.html, proposals.html) by reading live
`.claude/state/` and swapping their <script id="report-data"> blocks.

This is the same data-block-swap mechanism that the round-trip-test exercises
against a synthetic workspace; here we run it against the real state tree.

Usage: python3 scripts/dry-run-regen-ops-views.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"

# Per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9
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

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
    if not m:
        return None
    return json.loads(m.group(1))


def read_handoffs():
    out = []
    handoffs = STATE / "handoffs"
    if not handoffs.exists():
        return out
    for folder in sorted(handoffs.iterdir()):
        if not folder.is_dir():
            continue
        scenario = FOLDER_TO_SCENARIO.get(folder.name)
        if scenario is None:
            sys.stderr.write(f"[regen] WARN unknown folder {folder.name}\n")
            continue
        for f in sorted(folder.rglob("*.md")):
            data = read_frontmatter(f)
            if data is None:
                continue
            data["scenario"] = scenario
            out.append(data)
    out.sort(key=lambda h: h.get("created_at", ""), reverse=True)
    return out


def read_bubbles():
    out = []
    d = STATE / "discussion-bubbles"
    if not d.exists():
        return out
    for f in sorted(d.iterdir()):
        if not f.name.endswith(".md"):
            continue
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    out.sort(key=lambda b: b.get("opened_at", ""), reverse=True)
    return out


def read_proposals():
    out = []
    d = STATE / "proposals" / "pending"
    if not d.exists():
        return out
    for f in sorted(d.iterdir()):
        if not f.name.endswith(".md"):
            continue
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    return out


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
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if targets missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(REPORTS / "discussion-bubbles.html")
    ensure_scaffold(REPORTS / "activity.html")
    bubbles = read_bubbles()
    handoffs = read_handoffs()
    proposals = read_proposals()

    agents = sorted({h.get("from_agent","") for h in handoffs} | {h.get("to_agent","") for h in handoffs})
    ships = sorted({h.get("ship_id","") for h in handoffs if h.get("ship_id")})

    # PROPOSAL_LIFECYCLE_v8.2: proposals.html now owned by scripts/regen-proposals.py
    # (which handles the 5-state schema). This script handles bubbles + activity only.
    targets = [
        (REPORTS / "discussion-bubbles.html", {"discussion_bubbles": bubbles}),
        (REPORTS / "activity.html",           {"handoffs": handoffs, "agents": agents, "ships": ships}),
    ]

    print(f"[regen] {len(bubbles)} bubbles, {len(handoffs)} handoffs (proposals.html owned by regen-proposals.py)")
    failed = 0
    for path, data in targets:
        ok, err = swap_data_block(path, data)
        if ok:
            print(f"[regen] OK   {path.name}")
        else:
            print(f"[regen] FAIL {path.name}: {err}")
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
