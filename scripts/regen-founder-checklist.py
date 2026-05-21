#!/usr/bin/env python3
"""Regenerate docs/reports/founder-checklist.html data block from task-queue/founder/.

Each .md file in .claude/state/task-queue/founder/ that meets the criteria
"items the agent cannot complete due to software limitations" surfaces here.

Per Founder directive 2026-05-21: "Founder Checklist tab which needs to be made
and replace the index tab. The purpose of the founder checklist is to list the
queue of items that the FOUNDER MUST DO that the orchestrastion team cannot
complete due to software limitations."

Categorization heuristics:
  - "money" — credit card / paid signup / payment required
  - "account" — Google/Sentry/Apple sign-in or password manager
  - "physical" — biometric / MFA / hardware token / physical access

Closed items (the agent applied them) are pruned from the checklist via a
separate `status: closed` field OR removal from task-queue/founder/.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "founder-checklist.html"
FOUNDER_DIR = ROOT / ".claude" / "state" / "task-queue" / "founder"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def categorize(text: str, filename: str) -> str:
    """Categorize: money / account / physical."""
    lower = text.lower() + " " + filename.lower()
    if re.search(r'\b(credit card|payment|paid|billing|fees?|subscription|developer program)\b', lower):
        return "money"
    if re.search(r'\b(biometric|mfa|touch.?id|face.?id|otp|two.?factor|hardware token|physical|console.*key)\b', lower):
        return "physical"
    if re.search(r'\b(sign.up|create account|google account|apple id|sentry account|developer account)\b', lower):
        return "account"
    return "account"  # default


def extract_title(text: str, fallback: str) -> str:
    """First H1 or first non-empty line."""
    m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
    if m:
        title = m.group(1).strip()
        # Strip "Founder action — " prefix if present
        title = re.sub(r'^Founder action\s*[\-—:]\s*', '', title, flags=re.IGNORECASE)
        return title
    return fallback


def extract_blocker(text: str) -> str:
    """Find the 'why agent can't' explanation."""
    # Look for ## Why agent can't / Why this is blocked / Gate / Why the agent
    patterns = [
        r'##\s*Why\s+(?:the\s+)?agent.*?\n+(.+?)(?=\n##|\n#|\Z)',
        r'\*\*Gate:\*\*\s*(.+?)(?=\n\n|\n##|\Z)',
        r'##\s*Blocker\s*\n+(.+?)(?=\n##|\Z)',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.DOTALL | re.IGNORECASE)
        if m:
            return m.group(1).strip()[:300]
    return ""


def extract_howto(text: str) -> str:
    """Find the 'how to apply' steps."""
    patterns = [
        r'##\s*How\s+to\s+(?:apply|complete|do).*?\n+(.+?)(?=\n##|\n#|\Z)',
        r'##\s*Steps?\s*\n+(.+?)(?=\n##|\Z)',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.DOTALL | re.IGNORECASE)
        if m:
            steps = m.group(1).strip()
            # Compress whitespace
            steps = re.sub(r'\n+', ' ', steps)
            steps = re.sub(r'\s{2,}', ' ', steps)
            return steps[:400]
    return ""


def extract_time(text: str) -> str:
    m = re.search(r'(\d+)\s*(min|second|hour|hr|s|m)\b', text, re.IGNORECASE)
    if m:
        return m.group(0)
    if re.search(r'one[- ]time', text, re.IGNORECASE):
        return "one-time"
    return ""


def extract_unblocks(text: str) -> str:
    """What does completing this item unblock?"""
    m = re.search(r'##\s*Unblocks?\s*\n+(.+?)(?=\n##|\Z)', text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip().split('\n')[0][:200]
    m = re.search(r'\bunblocks?\s+([^\n.]+)', text, re.IGNORECASE)
    if m:
        return m.group(1).strip()[:120]
    return ""


def extract_impact_dim(text: str) -> str:
    """Dashboard dimension lift, e.g. 'A3 Security 56→64' or 'A12 60→75'."""
    m = re.search(r'\b(A\d{1,2}[A-Z_a-z]*)\s*(?:Security|Performance|Operational|Code Quality|UI/UX|Architecture|Testing|Mobile|Roadmap|FIQ|Data Integrity|Accessibility)?\s*(\d+\s*→\s*\d+)', text)
    if m:
        return m.group(1) + " " + m.group(2)
    return ""


def is_closed(text: str, filename: str) -> bool:
    """Skip items that explicitly say closed/done OR have been applied."""
    if re.search(r'\bstatus:\s*(closed|done|complete|applied)', text, re.IGNORECASE):
        return True
    if "DONE" in text[:200] or "CLOSED" in text[:200]:
        return True
    return False


def main() -> int:
    if not DASHBOARD.exists():
        template = ROOT / "templates" / "dashboards" / "founder-checklist.template.html"
        if template.exists():
            DASHBOARD.write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            print(f"[regen-founder-checklist] FATAL: {DASHBOARD} + template both missing", file=sys.stderr)
            return 2

    items = []
    if FOUNDER_DIR.exists():
        for f in sorted(FOUNDER_DIR.glob("*.md")):
            if f.name.startswith("BLOCKERS-"):
                continue  # consolidated index — skip
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if is_closed(text, f.name):
                continue
            items.append({
                "title": extract_title(text, f.stem),
                "category": categorize(text, f.name),
                "blocker": extract_blocker(text),
                "howto": extract_howto(text),
                "time_estimate": extract_time(text),
                "unblocks": extract_unblocks(text),
                "impact_dim": extract_impact_dim(text),
                "source_doc": str(f.relative_to(ROOT)).replace("\\", "/"),
            })

    now = datetime.now(timezone.utc)
    payload = {
        "schema_version": "founder-checklist-v1",
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "generated_at_pretty": now.strftime("%Y-%m-%d %H:%M UTC"),
        "items": items,
        "counts": {
            "open": len(items),
            "money": sum(1 for i in items if i["category"] == "money"),
            "account": sum(1 for i in items if i["category"] == "account"),
            "physical": sum(1 for i in items if i["category"] == "physical"),
        },
    }

    html = DASHBOARD.read_text(encoding="utf-8")
    new_block = json.dumps(payload, indent=2, ensure_ascii=False)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_block + m.group(3),
        html,
        count=1,
    )
    if count == 0:
        print("[regen-founder-checklist] FATAL: report-data block not found", file=sys.stderr)
        return 3
    DASHBOARD.write_text(new_html, encoding="utf-8")
    print(f"[regen-founder-checklist] OK   founder-checklist.html {len(items)} items "
          f"(money={payload['counts']['money']} account={payload['counts']['account']} physical={payload['counts']['physical']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
