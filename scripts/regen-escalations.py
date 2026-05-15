#!/usr/bin/env python3
"""
Regenerate docs/reports/escalations.html via data-block swap with the
5-state escalations lifecycle schema:

    {
      "escalations": {
        "pending":   [...],
        "approved":  [...],
        "applied":   [...],
        "deferred":  [...],
        "rejected":  [...]
      },
      "counts": {
        "pending":         N,
        "approved":        N,
        "applied_total":   N,
        "deferred":        N,
        "rejected_total":  N
      }
    }

Mirrors regen-amendments.py + regen-proposals.py structure. Reads
ESC-NNN frontmatter from .claude/state/escalations/<state>/ directories
per Founder directive 2026-05-14 (escalations lifecycle).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
ESCALATIONS = STATE / "escalations"
TARGET = ROOT / "docs" / "reports" / "escalations.html"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def read_frontmatter(path: Path):
    """Parse YAML frontmatter from an ESC-*.md file. Lightweight parser
    sufficient for the schema (scalars, inline lists, multiline scalars,
    and lists of key:value dicts for the `options` field). Falls back to
    pyyaml if available."""
    if not path.exists():
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return None
    raw = m.group(1)
    try:
        import yaml  # type: ignore
        fm = yaml.safe_load(raw) or {}
    except ImportError:
        fm = _parse_yaml_basic(raw)

    # Inject filename for UI link
    fm["_filename"] = path.name
    # First 400 chars of body for card preview
    body_after = text[m.end():].lstrip()
    fm["_body_preview"] = body_after[:400]
    return fm


def _parse_yaml_basic(raw: str):
    """Minimal YAML parser sufficient for ESC frontmatter."""
    out = {}
    lines = raw.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        m2 = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if not m2:
            i += 1
            continue
        key, val = m2.group(1), m2.group(2)
        if val == "|" or val == "":
            i += 1
            buf = []
            while i < len(lines) and (lines[i].startswith("  ") or lines[i].strip() == ""):
                if lines[i].startswith("  "):
                    buf.append(lines[i][2:])
                else:
                    buf.append("")
                i += 1
            if buf and buf[0].lstrip().startswith("- "):
                items = []
                j = 0
                while j < len(buf):
                    b = buf[j]
                    if b.lstrip().startswith("- "):
                        item_buf = [b.lstrip()[2:]]
                        j += 1
                        while j < len(buf) and (buf[j].startswith("  ") or buf[j].strip() == ""):
                            if buf[j].startswith("  "):
                                item_buf.append(buf[j][2:])
                            else:
                                item_buf.append("")
                            j += 1
                        if any(re.match(r"^[A-Za-z_][A-Za-z0-9_]*:", x) for x in item_buf):
                            obj = {}
                            for x in item_buf:
                                mx = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", x)
                                if mx:
                                    obj[mx.group(1)] = mx.group(2).strip()
                            items.append(obj)
                        else:
                            items.append("\n".join(item_buf).strip())
                    else:
                        j += 1
                out[key] = items
            else:
                out[key] = "\n".join(buf).rstrip()
        else:
            v = val.strip()
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            if v.lower() == "true": v = True
            elif v.lower() == "false": v = False
            elif v.lower() in ("null", "none", "~"): v = None
            elif re.match(r"^-?\d+$", v): v = int(v)
            elif v.startswith("[") and v.endswith("]"):
                inner = v[1:-1].strip()
                v = [] if not inner else [x.strip().strip('"').strip("'") for x in inner.split(",")]
            out[key] = v
            i += 1
            continue
    return out


def read_bucket(name: str):
    d = ESCALATIONS / name
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob("ESC-*.md")):
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    return out


def swap_data_block(html_path: Path, new_data: dict):
    if not html_path.exists():
        return False, f"file missing: {html_path}"
    html = html_path.read_text(encoding="utf-8")
    new_json = json.dumps(new_data, indent=2, default=str)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        return False, f"data block match count = {count}"
    html_path.write_text(new_html, encoding="utf-8")
    return True, None


def main():
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if target missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(TARGET)
    pending = read_bucket("pending")
    approved = read_bucket("approved")
    applied = read_bucket("applied")
    deferred = read_bucket("deferred")
    rejected = read_bucket("rejected")

    data = {
        "escalations": {
            "pending":  pending,
            "approved": approved,
            "applied":  applied,
            "deferred": deferred,
            "rejected": rejected,
        },
        "counts": {
            "pending":        len(pending),
            "approved":       len(approved),
            "applied_total":  len(applied),
            "deferred":       len(deferred),
            "rejected_total": len(rejected),
        },
    }

    if not TARGET.exists():
        print(f"[regen-escalations] WARN target missing: {TARGET}; skipping data-block swap. Counts:")
        print(f"  pending={len(pending)} approved={len(approved)} applied={len(applied)} deferred={len(deferred)} rejected={len(rejected)}")
        return 0

    ok, err = swap_data_block(TARGET, data)
    if not ok:
        print(f"[regen-escalations] FAIL {TARGET.name}: {err}", file=sys.stderr)
        return 1
    print(f"[regen-escalations] OK   {TARGET.name}")
    print(f"[regen-escalations] pending={len(pending)} approved={len(approved)} applied={len(applied)} deferred={len(deferred)} rejected={len(rejected)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
