#!/usr/bin/env python3
"""Sync dashboard navigation order across all templates from a single source of truth.

Source: templates/dashboards/_assets/nav-links.json
Target: every templates/dashboards/*.template.html

Reads each template, finds the <div class="pb-page-nav-links">...</div> block,
rewrites the links in the canonical order from nav-links.json. The current
template's own link is marked class="is-active".

Per Founder directive 2026-05-21: "App Health should be in same position no
matter the tab you are on". The Founder Checklist + Sessions are new tabs;
Index is REPLACED by Founder Checklist.

Run: python scripts/sync-nav-links.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAV_SOURCE = ROOT / "templates" / "dashboards" / "_assets" / "nav-links.json"
TEMPLATES_DIR = ROOT / "templates" / "dashboards"

NAV_BLOCK_RE = re.compile(
    r'(<div class="pb-page-nav-links">)(.*?)(</div>)',
    re.DOTALL,
)


def build_nav_html(links: list[dict], active_href: str) -> str:
    """Render the canonical nav links HTML, marking active_href as is-active."""
    out = '\n'
    for link in links:
        is_active = link["href"] == active_href
        cls = ' class="is-active"' if is_active else ""
        out += f'                <a href="{link["href"]}"{cls}>{link["label"]}</a>\n'
    out += '            '
    return out


def main() -> int:
    if not NAV_SOURCE.exists():
        print(f"FATAL: {NAV_SOURCE} missing", file=sys.stderr)
        return 2

    nav = json.loads(NAV_SOURCE.read_text(encoding="utf-8"))
    links = nav["links"]

    updated = 0
    skipped = 0
    for tpl in sorted(TEMPLATES_DIR.glob("*.template.html")):
        base = tpl.stem.replace(".template", "")
        active_href = base + ".html"

        text = tpl.read_text(encoding="utf-8")
        new_nav = build_nav_html(links, active_href)
        new_text, count = NAV_BLOCK_RE.subn(
            lambda m: m.group(1) + new_nav + m.group(3),
            text,
            count=1,
        )
        if count == 0:
            print(f"  skip (no nav block): {tpl.name}")
            skipped += 1
            continue
        if new_text == text:
            print(f"  ok  (no change):    {tpl.name}")
            continue
        tpl.write_text(new_text, encoding="utf-8")
        print(f"  patched:           {tpl.name}")
        updated += 1

    print()
    print(f"Sync complete: {updated} patched, {skipped} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
