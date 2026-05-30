#!/usr/bin/env python3
"""Regenerate docs/reports/founder-checklist.html data block from task-queue/founder/.

Each .md file in .claude/state/task-queue/founder/ surfaces here UNLESS it's
explicitly closed (front-matter `status: closed`) or stale (legacy filenames).

Per Founder directive 2026-05-21:
- "items the FOUNDER MUST DO that the orchestrastion team cannot complete due
  to software limitations"
- "if orchestration team can do it they should be doing it and not pushing it
  off to the founder"
- "rated as red (urgent) yellow (would benefit app but not necessary) and
  green (good to have, increase quality rating, increasing app health grade)"
- "there should be a button I click to review the agents walkthrough of what
  I need to complete"
- "how do I know when the founder checklist item is completed... we need to
  add" mark-complete + verification

Front-matter fields (YAML, in --- block at top of each .md):
  status: open | closed | marked-complete-by-founder | verified-closed | verification-failed
  severity: red | yellow | green
  verify_command: optional PowerShell or bash command to confirm completion
  verify_expected: optional regex/substring the command output should match
  walkthrough_doc: optional path to a separate detailed walkthrough .md

Severity defaults derived from priority+keywords if not declared:
  red    -- production-safety / security / blocks downstream work
  yellow -- would benefit app but not blocking
  green  -- quality-of-life / nice-to-have

Categorization (money/account/physical) is computed from text keywords.
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
STATE_PATH = ROOT / ".claude" / "state" / "founder-checklist-state.json"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)
FRONTMATTER_RE = re.compile(r'\A---\s*\n(.*?)\n---\s*\n', re.DOTALL)


def parse_frontmatter(text: str) -> dict:
    """Parse simple YAML front-matter (flat key: value).

    Contract (must match scripts/founder-mark-complete.ps1 parser exactly):
      - Front-matter is the YAML block between two `---` lines at file start
      - Flat key:value pairs only -- no multi-line values, no nested objects
      - Values are stripped of one layer of surrounding double or single quotes
      - Colon-followed-by-letters INSIDE a quoted value is preserved (don't
        write `verify_command: foo: bar` -- wrap in quotes: `"foo: bar"`)
      - Lines starting with `#` are comments
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    fm = {}
    block = m.group(1)
    for line in block.splitlines():
        line = line.rstrip()
        if not line or line.startswith('#'):
            continue
        km = re.match(r'^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$', line)
        if km:
            key, val = km.group(1), km.group(2).strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            fm[key] = val
    return fm


def categorize(text: str, filename: str) -> str:
    lower = text.lower() + " " + filename.lower()
    if re.search(r'\b(credit card|payment|paid|billing|fees?|subscription|developer program)\b', lower):
        return "money"
    if re.search(r'\b(biometric|mfa|touch.?id|face.?id|otp|two.?factor|hardware token|physical|console.*key|UAC|elevation|admin.*right)\b', lower):
        return "physical"
    if re.search(r'\b(sign.?up|create account|google account|apple id|sentry account|developer account|firebase console)\b', lower):
        return "account"
    return "account"


def severity_default(text: str, fm: dict) -> str:
    """Derive severity from text if not declared in front-matter."""
    declared = (fm.get("severity") or "").lower()
    if declared in ("red", "yellow", "green"):
        return declared
    priority = (fm.get("priority") or "").upper()
    lower = text[:1000].lower()
    if priority in ("CRITICAL", "URGENT") or re.search(r'\b(production|critical|blocking|urgent|security)\b', lower):
        return "red"
    if re.search(r'\b(staging|testing|quality|monitor)\b', lower):
        return "yellow"
    return "green"


def extract_title(text: str, fallback: str) -> str:
    m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
    if m:
        title = m.group(1).strip()
        title = re.sub(r'^Founder action\s*[-:]\s*', '', title, flags=re.IGNORECASE)
        return title
    return fallback


def extract_section(text: str, *patterns: str) -> str:
    for pat in patterns:
        m = re.search(pat, text, re.DOTALL | re.IGNORECASE)
        if m:
            content = m.group(1).strip()
            content = re.sub(r'\n+', '\n', content)
            return content[:600]
    return ""


def extract_blocker(text: str) -> str:
    return extract_section(
        text,
        r'##\s*Why\s+(?:the\s+)?agent.*?\n+(.+?)(?=\n##|\n#|\Z)',
        r'\*\*Gate:\*\*\s*(.+?)(?=\n\n|\n##|\Z)',
        r'##\s*Blocker\s*\n+(.+?)(?=\n##|\Z)',
    )


def extract_howto(text: str) -> str:
    s = extract_section(
        text,
        r'##\s*How\s+to\s+(?:apply|complete|do).*?\n+(.+?)(?=\n##|\n#|\Z)',
        r'##\s*Steps?\s*\n+(.+?)(?=\n##|\Z)',
        # Common Founder-item convention: "## What you need to do" (also
        # "What Founder needs to do" / "(when you choose to)"). Leads with
        # the dev-agnostic "Who can do this" line, so surface it on the card.
        r'##\s*What[^\n]*?needs?\s+to\s+do[^\n]*\n+(.+?)(?=\n##|\n#|\Z)',
    )
    # Compress
    s = re.sub(r'\s{2,}', ' ', s)
    return s[:400]


def extract_walkthrough(text: str, fm: dict) -> str:
    """Multi-step walkthrough Founder reviews before doing the work.

    Returns the inline summary (short — shown in card). For the FULL walkthrough
    rendered as HTML, see load_walkthrough_html which reads walkthrough_doc.
    """
    # 1. Explicit walkthrough section
    s = extract_section(
        text,
        r'##\s*Walkthrough\s*\n+(.+?)(?=\n##|\n#|\Z)',
    )
    if s:
        return s
    # 2. Fall back to howto (extended length for walkthrough)
    s = extract_section(
        text,
        r'##\s*How\s+to\s+(?:apply|complete|do).*?\n+(.+?)(?=\n##|\n#|\Z)',
        # Common Founder-item convention: "## What you need to do" carries the
        # dev-facing step-by-step (incl. the "Who can do this" line).
        r'##\s*What[^\n]*?needs?\s+to\s+do[^\n]*\n+(.+?)(?=\n##|\n#|\Z)',
    )
    return s[:1500]


def load_walkthrough_html(fm: dict) -> str:
    """Load the full walkthrough_doc file, render markdown -> HTML.

    Per Founder directive 2026-05-21: "walkthroughs should not open source doc
    but just show the full doc in a way I can easily review and read it...
    can even show an image if needed. This makes the dashboard more of a hq".

    Returns sanitized-ish HTML (markdown library output). Empty string if no
    walkthrough_doc declared or file missing.
    """
    rel_path = fm.get("walkthrough_doc")
    if not rel_path:
        return ""
    full_path = ROOT / rel_path
    if not full_path.exists():
        return f"<p><em>walkthrough_doc not found: {rel_path}</em></p>"
    try:
        md_text = full_path.read_text(encoding="utf-8")
    except OSError:
        return f"<p><em>walkthrough_doc unreadable: {rel_path}</em></p>"
    try:
        import markdown
        html = markdown.markdown(
            md_text,
            extensions=["fenced_code", "tables", "nl2br"],
            output_format="html5",
        )
        return html
    except ImportError:
        # Fallback: emit pre-wrapped raw markdown if package missing
        from html import escape
        return f"<pre>{escape(md_text)}</pre>"


def extract_time(text: str) -> str:
    m = re.search(r'(\d+)\s*(min|second|hour|hr|s|m)\b', text, re.IGNORECASE)
    if m:
        return m.group(0)
    if re.search(r'one[- ]time', text, re.IGNORECASE):
        return "one-time"
    return ""


def extract_unblocks(text: str) -> str:
    m = re.search(r'##\s*Unblocks?\s*\n+(.+?)(?=\n##|\Z)', text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip().split('\n')[0][:200]
    m = re.search(r'\bunblocks?\s+([^\n.]+)', text, re.IGNORECASE)
    if m:
        return m.group(1).strip()[:120]
    return ""


def extract_impact_dim(text: str) -> str:
    m = re.search(r'\b(A\d{1,2}[A-Z_a-z]*)\s*(?:Security|Performance|Operational|Code Quality|UI/UX|Architecture|Testing|Mobile|Roadmap|FIQ|Data Integrity|Accessibility)?\s*(\d+\s*->\s*\d+)', text)
    if m:
        return m.group(1) + " " + m.group(2)
    return ""


def is_closed(text: str, filename: str, fm: dict) -> bool:
    """Item is hidden from the dashboard."""
    status = (fm.get("status") or "").lower().strip()
    if status in ("closed", "done", "complete", "applied", "verified-closed"):
        return True
    if re.search(r'\bstatus:\s*(closed|done|complete|applied|verified-closed)', text[:500], re.IGNORECASE):
        return True
    if "DONE" in text[:200] or "CLOSED" in text[:200]:
        return True
    return False


def load_state() -> dict:
    """Load founder-mark-complete state -- sidecar JSON.

    Critique F5: utf-8-sig handles legacy state files written by earlier
    Out-File -Encoding utf8 (which writes UTF-8 WITH BOM on PowerShell 5.1).
    New writes from founder-mark-complete.ps1 use the no-BOM encoder, but
    utf-8-sig stays for defense-in-depth on legacy files.
    """
    if not STATE_PATH.exists():
        return {"items": {}}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return {"items": {}}


def main() -> int:
    if not DASHBOARD.exists():
        template = ROOT / "templates" / "dashboards" / "founder-checklist.template.html"
        if template.exists():
            DASHBOARD.write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            print(f"[regen-founder-checklist] FATAL: {DASHBOARD} + template both missing", file=sys.stderr)
            return 2

    state = load_state()
    state_items = state.get("items") or {}

    items = []
    closed = []
    if FOUNDER_DIR.exists():
        for f in sorted(FOUNDER_DIR.glob("*.md")):
            if f.name.startswith("BLOCKERS-") or f.name == "README.md":
                continue
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            fm = parse_frontmatter(text)
            slug = f.stem

            # Sidecar state overrides front-matter for completion lifecycle
            sidecar = state_items.get(slug) or {}
            sidecar_status = (sidecar.get("status") or "").lower()

            if is_closed(text, f.name, fm) or sidecar_status in ("verified-closed", "marked-complete-by-founder"):
                closed.append({
                    "slug": slug,
                    "title": extract_title(text, slug),
                    "status": sidecar_status or "closed",
                    "verified_at": sidecar.get("verified_at"),
                })
                continue

            item = {
                "slug": slug,
                "title": extract_title(text, slug),
                "category": categorize(text, f.name),
                "severity": severity_default(text, fm),
                "blocker": extract_blocker(text),
                "howto": extract_howto(text),
                "walkthrough": extract_walkthrough(text, fm),
                "walkthrough_html": load_walkthrough_html(fm),
                "verify_command": fm.get("verify_command", ""),
                "verify_expected": fm.get("verify_expected", ""),
                "time_estimate": extract_time(text),
                "unblocks": extract_unblocks(text),
                "impact_dim": extract_impact_dim(text),
                "source_doc": str(f.relative_to(ROOT)).replace("\\", "/"),
                "lifecycle": sidecar_status or "open",
                "lifecycle_meta": {
                    "marked_at": sidecar.get("marked_at"),
                    "verified_at": sidecar.get("verified_at"),
                    "verification_status": sidecar.get("verification_status"),
                    "verify_output_excerpt": sidecar.get("verify_output_excerpt"),
                },
            }
            items.append(item)

    # Sort: red urgency first, then yellow, then green
    sev_order = {"red": 0, "yellow": 1, "green": 2}
    items.sort(key=lambda i: (sev_order.get(i["severity"], 9), i["title"]))

    now = datetime.now(timezone.utc)
    payload = {
        "schema_version": "founder-checklist-v2",
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "generated_at_pretty": now.strftime("%Y-%m-%d %H:%M UTC"),
        "items": items,
        "closed_recently": closed[-10:],  # last 10 closed for spot history
        "counts": {
            "open": len(items),
            "money": sum(1 for i in items if i["category"] == "money"),
            "account": sum(1 for i in items if i["category"] == "account"),
            "physical": sum(1 for i in items if i["category"] == "physical"),
            "red": sum(1 for i in items if i["severity"] == "red"),
            "yellow": sum(1 for i in items if i["severity"] == "yellow"),
            "green": sum(1 for i in items if i["severity"] == "green"),
            "closed_total": len(closed),
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
    c = payload["counts"]
    print(f"[regen-founder-checklist] OK   founder-checklist.html "
          f"open={c['open']} (red={c['red']} yellow={c['yellow']} green={c['green']}) "
          f"closed_total={c['closed_total']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
