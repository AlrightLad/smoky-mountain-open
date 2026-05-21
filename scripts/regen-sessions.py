#!/usr/bin/env python3
"""Regenerate docs/reports/sessions.html data block from .claude/state/session-summary-*.md.

Each session-summary file becomes a session card on the sessions tab. The card
shows date, title, quality grade, score, summary excerpt, ships count, commits.

Click → opens the source markdown file at .claude/state/session-summary-DATE.md
(via file:// from the Founder's local browser).

Per Founder directive 2026-05-21: "I would like session summarys to be a tab on
the dashboard that I can click and review."
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "sessions.html"
STATE = ROOT / ".claude" / "state"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

# Match grade pattern in summary, e.g. "B+ (80.1)" or "A (92.4)"
GRADE_RE = re.compile(r'\b([A-F][+-]?)\s*\((\d+(?:\.\d+)?)\)')
DELTA_RE = re.compile(r'([+-]\d+(?:\.\d+)?)\s*points?')
SHIPS_RE = re.compile(r'(\d+)\s*ships?\s*(tracked|shipped|complete)?', re.IGNORECASE)
COMMITS_RE = re.compile(r'(\d+)[+]?\s*commits?\s*(pushed|today|substantive)?', re.IGNORECASE)


def parse_summary(path: Path) -> dict:
    """Extract grade, score, delta, ships, commits, title, summary from a session-summary doc."""
    text = path.read_text(encoding="utf-8", errors="replace")
    # First H1 = title
    title_match = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else path.stem

    # Date from filename: session-summary-YYYY-MM-DD.md
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', path.stem)
    date = date_match.group(1) if date_match else "—"

    # Grade + score
    grade_match = GRADE_RE.search(text)
    grade = grade_match.group(1) if grade_match else "—"
    score = grade_match.group(2) if grade_match else ""

    # Delta
    delta_match = DELTA_RE.search(text)
    delta = delta_match.group(0) if delta_match else ""

    # Ships
    ships_match = SHIPS_RE.search(text)
    ships_shipped = ships_match.group(1) if ships_match else "—"

    # Commits
    commits_match = COMMITS_RE.search(text)
    commits = commits_match.group(1) if commits_match else "—"

    # Summary excerpt — first non-heading paragraph after TL;DR or first 400 chars
    summary = ""
    tldr_match = re.search(r'TL;DR\s*\n+(.+?)(?=\n##|\n#|\Z)', text, re.DOTALL)
    if tldr_match:
        summary = tldr_match.group(1).strip()
        # Strip leading bullets/dashes
        summary = re.sub(r'^[-*\s]+', '', summary)
    if not summary:
        # First paragraph after first H1
        for para in text.split('\n\n')[1:5]:
            p = para.strip()
            if p and not p.startswith('#') and not p.startswith('---'):
                summary = p
                break
    summary = summary[:400]

    # Critique applied?
    critique_applied = bool(re.search(r'critique\s+loop|critique.*applied', text, re.IGNORECASE))

    # Runtime — e.g., "overnight" / "5h" — extract from title or first lines
    runtime = ""
    if "overnight" in text.lower()[:200]:
        runtime = "overnight"

    return {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "detail_path": "../../" + str(path.relative_to(ROOT)).replace("\\", "/"),
        "date": date,
        "title": title,
        "grade": grade,
        "score": ("score " + score) if score else "",
        "delta": delta,
        "ships_shipped": ships_shipped,
        "commits": commits,
        "summary": summary,
        "critique_applied": critique_applied,
        "runtime": runtime,
    }


def main() -> int:
    if not DASHBOARD.exists():
        # Bootstrap from template
        template = ROOT / "templates" / "dashboards" / "sessions.template.html"
        if template.exists():
            DASHBOARD.write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            print(f"[regen-sessions] FATAL: {DASHBOARD} + template both missing", file=sys.stderr)
            return 2

    # Collect session summaries
    sessions = []
    for f in sorted(STATE.glob("session-summary-*.md"), reverse=True):
        try:
            sessions.append(parse_summary(f))
        except Exception as e:
            print(f"[regen-sessions] WARN failed to parse {f.name}: {e}", file=sys.stderr)
            continue

    payload = {
        "schema_version": "sessions-v1",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sessions": sessions,
    }

    html = DASHBOARD.read_text(encoding="utf-8")
    new_block = json.dumps(payload, indent=2, ensure_ascii=False)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_block + m.group(3),
        html,
        count=1,
    )
    if count == 0:
        print("[regen-sessions] FATAL: report-data block not found", file=sys.stderr)
        return 3
    DASHBOARD.write_text(new_html, encoding="utf-8")
    print(f"[regen-sessions] OK   sessions.html {len(sessions)} sessions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
