#!/usr/bin/env python3
"""
Regenerate docs/reports/main-flows.html via data-block swap.

Reads the source-of-truth doc (currently the dry-run draft at
`.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md`;
will become `docs/agents/MAIN_FLOWS.md` once Founder ratifies) and parses
each "### MF-NN — <name>" section into a structured flow record.

Generator-driven, per binding caveat from db-2026-05-13-004: single source
of truth is the markdown doc. HTML is rebuilt from it; never hand-edit.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "main-flows.html"
PROPOSED_DOC = ROOT / ".claude" / "state" / "wave-zero-dry-run" / "remediation" / "proposed-MAIN_FLOWS.md"
RATIFIED_DOC = ROOT / "docs" / "agents" / "MAIN_FLOWS.md"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)
# Heading shape (line begins at column 0): ### MF-NN — <name>
FLOW_HEAD_RE = re.compile(r'^### (MF-\d+) [—\-:] (.+?)\s*$', re.MULTILINE)


def pick_source():
    if RATIFIED_DOC.exists():
        return RATIFIED_DOC, "ratified"
    if PROPOSED_DOC.exists():
        return PROPOSED_DOC, "proposed-draft"
    return None, None


def parse_main_flows(doc_text: str):
    """Parse one flow per `### MF-NN — <name>` heading."""
    flows = []
    matches = list(FLOW_HEAD_RE.finditer(doc_text))
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(doc_text)
        section = doc_text[start:end]
        flow = {
            "id": m.group(1),
            "name": m.group(2).strip(),
            "primary_user_goal": "",
            "screens": [],
            "edge_cases": [],
            "served_by_ships": [],
            "served_by_primary": None,
            "status_served": "",
        }
        # Primary user goal
        pg = re.search(r'\*\*Primary user goal:\*\*\s*(.+?)(?:\n\n|\n\*\*)', section, re.DOTALL)
        if pg:
            flow["primary_user_goal"] = " ".join(pg.group(1).split())
        # Screens / states (numbered list)
        sc = re.search(r'\*\*Screens / states[^*]*\*\*\s*\n((?:\d+\..+\n?)+)', section)
        if sc:
            for line in sc.group(1).splitlines():
                line = line.strip()
                m_li = re.match(r'^\d+\.\s+(.+)$', line)
                if m_li:
                    flow["screens"].append(m_li.group(1).strip())
        # Edge cases (bulleted list under "Known edge cases" or "Edge cases")
        ec = re.search(r'\*\*(?:Known edge cases|Edge cases)[^*]*\*\*\s*\n((?:[\-\*] .+\n?)+)', section)
        if ec:
            for line in ec.group(1).splitlines():
                line = line.strip()
                m_li = re.match(r'^[\-\*]\s+(.+)$', line)
                if m_li:
                    flow["edge_cases"].append(m_li.group(1).strip())
        # Served by ships — pull all "W1.SN" / "M-N" / "W1.IN" tokens
        sb = re.search(r'\*\*Served by ships:\*\*\s*(.+?)(?:\n\n|\n\*\*)', section, re.DOTALL)
        if sb:
            text = sb.group(1)
            ships = sorted(set(re.findall(r'\b(W\d+\.[SIM]\d+|M\d+\.?\d*)\b', text)))
            flow["served_by_ships"] = ships
            if ships:
                # Primary = first one mentioned in source order, not sorted
                first = re.search(r'\b(W\d+\.[SIM]\d+|M\d+\.?\d*)\b', text)
                if first:
                    flow["served_by_primary"] = first.group(1)
        # Status served
        ss = re.search(r'\*\*Status served:\*\*\s*(.+?)(?:\n\n|\n###|\Z|\n---)', section, re.DOTALL)
        if ss:
            flow["status_served"] = " ".join(ss.group(1).split())
        flows.append(flow)
    return flows


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
    src, kind = pick_source()
    if not src:
        print("[regen-main-flows] FATAL: no source doc found", file=sys.stderr)
        print(f"  expected one of: {RATIFIED_DOC.relative_to(ROOT)} OR {PROPOSED_DOC.relative_to(ROOT)}", file=sys.stderr)
        return 2
    print(f"[regen-main-flows] source: {src.relative_to(ROOT)} ({kind})")
    flows = parse_main_flows(src.read_text(encoding="utf-8"))
    print(f"[regen-main-flows] parsed {len(flows)} flows: {[f['id'] for f in flows]}")
    data = {
        "flows": flows,
        "last_amended": datetime.now(timezone.utc).isoformat(),
        "doc_source": str(src.relative_to(ROOT)).replace("\\", "/"),
        "doc_kind": kind,
    }
    ok, err = swap_data_block(DASHBOARD, data)
    if ok:
        print(f"[regen-main-flows] OK   {DASHBOARD.name}")
        return 0
    else:
        print(f"[regen-main-flows] FAIL {DASHBOARD.name}: {err}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
