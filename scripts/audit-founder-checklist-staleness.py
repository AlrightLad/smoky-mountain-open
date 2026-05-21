#!/usr/bin/env python3
"""Periodic staleness audit for .claude/state/task-queue/founder/ items.

Per INC-2026-05-21-002 action item #5: weekly classify each open item as
still-relevant / stale / agent-can-do.

4 heuristic checks per open item:
  1. AGE - first-touched > 30d ago via git log -> stale-age
  2. AGENT-AUTONOMY - keywords suggest the agent can self-resolve
  3. VERIFICATION-PACKET - keywords suggest it's a review packet not an action
  4. (future) UNDERLYING-CHANGE - related_files modified since item created

Writes findings to .claude/state/aggregates/founder-checklist-staleness.json
so the dashboard can flag stale items + the freshness sentinel can deduct.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOUNDER_DIR = ROOT / ".claude" / "state" / "task-queue" / "founder"
OUT = ROOT / ".claude" / "state" / "aggregates" / "founder-checklist-staleness.json"

AGENT_KW = [
    "audit findings", "agent-can-do", "proposal triage", "amd ratify",
    "regen", "scaffold", "rebuild",
]
VERIFICATION_KW = [
    "verification packet", "review packet", "founder review", "ratify",
]


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end < 0:
        return {}
    fm = {}
    for line in text[3:end].splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            fm[key] = val
    return fm


def get_file_age_days(path: Path) -> int:
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--diff-filter=A", "--format=%ai", "--", str(path)],
            capture_output=True, text=True, timeout=10, cwd=str(ROOT),
        )
        if not result.stdout.strip():
            return 0
        date_str = result.stdout.strip().split()[0]
        created = datetime.fromisoformat(date_str + "T00:00:00+00:00")
        return (datetime.now(timezone.utc) - created).days
    except Exception:
        return 0


def main() -> int:
    items_found = []
    flagged_count = 0
    audited = 0
    if FOUNDER_DIR.exists():
        for f in sorted(FOUNDER_DIR.glob("*.md")):
            if f.name.startswith("BLOCKERS-") or f.name == "README.md":
                continue
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            fm = parse_frontmatter(text)
            status = (fm.get("status") or "").lower()
            # Also detect status: closed when it's not in a proper --- frontmatter
            # (some legacy task-queue files have raw status: line at top without ---
            # wrapping; the regen-founder-checklist already handles this).
            if not status:
                m = re.search(r"^status:\s*(\S+)", text[:500], re.MULTILINE | re.IGNORECASE)
                if m:
                    status = m.group(1).lower()
            if status in ("closed", "verified-closed", "done", "complete"):
                continue
            audited += 1

            flags = []
            age_days = get_file_age_days(f)
            if age_days > 30:
                flags.append({"flag": "stale-age", "detail": f"{age_days}d since first-touched in git"})

            text_lower = text[:2000].lower()
            # Skip the agent-can-do heuristic if item has explicit Founder
            # markers (severity, priority, verify_command, walkthrough_doc) -
            # those signal it's a real Founder action even if keywords match.
            has_founder_markers = (
                fm.get("severity") or fm.get("priority") or
                fm.get("verify_command") or fm.get("walkthrough_doc")
            )
            if not has_founder_markers:
                agent_kw_hits = [kw for kw in AGENT_KW if kw in text_lower]
                if len(agent_kw_hits) >= 2:  # require 2+ to reduce false positives
                    flags.append({"flag": "agent-can-do", "detail": f"keywords: {', '.join(agent_kw_hits[:3])}"})
            for kw in VERIFICATION_KW:
                if kw in text_lower and not has_founder_markers:
                    flags.append({"flag": "verification-packet-not-action", "detail": f"keyword: {kw}"})
                    break

            if flags:
                flagged_count += 1
                title_m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
                items_found.append({
                    "slug": f.stem,
                    "title": title_m.group(1).strip() if title_m else f.stem,
                    "age_days": age_days,
                    "flags": flags,
                    "source_path": str(f.relative_to(ROOT)).replace("\\", "/"),
                })

    payload = {
        "schema_version": "founder-checklist-staleness-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "open_items_audited": audited,
        "flagged_count": flagged_count,
        "flagged_items": items_found,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[audit-founder-checklist-staleness] audited={audited} flagged={flagged_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
