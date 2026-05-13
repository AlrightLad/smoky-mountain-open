#!/usr/bin/env python3
"""
Inject the shared `page-nav` header into dashboards that lack it.

Dashboards in scope: dashboard.html, activity.html, proposals.html,
discussion-bubbles.html (already has nav but missing main-flows + index links).

Idempotent: if a dashboard already has the full nav (all 6 links), the script
leaves it alone. If it has a partial nav, the script rewrites it to match the
canonical structure.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "docs" / "reports"

PAGE_NAV_CSS = """
        /* === Cross-dashboard nav (injected by scripts/inject-page-nav.py) === */
        .page-header { background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
        .page-nav { max-width: 1280px; margin: 0 auto; padding: var(--space-3) var(--space-4); display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
        .nav-brand { font-family: var(--font-mono); font-size: 0.875rem; font-weight: 600; color: var(--accent-brass); text-decoration: none; letter-spacing: 0.04em; }
        .nav-links { display: flex; gap: var(--space-3); font-size: 0.875rem; flex-wrap: wrap; }
        .nav-links a { color: var(--text-secondary); text-decoration: none; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); transition: color var(--duration-default) var(--ease-default), background var(--duration-default) var(--ease-default); }
        .nav-links a:hover { color: var(--text-primary); background: var(--bg-card); }
        .nav-links a.is-active { color: var(--accent-brass); background: rgba(201,169,97,0.10); border: 1px solid rgba(201,169,97,0.30); }
"""

# (file basename, is-active link basename)
TARGETS = [
    ("dashboard.html",         "dashboard.html"),
    ("activity.html",          "activity.html"),
    ("proposals.html",         "proposals.html"),
    ("discussion-bubbles.html","discussion-bubbles.html"),
]

NAV_LINKS = [
    ("dashboard.html",         "Dashboard"),
    ("activity.html",          "Activity"),
    ("discussion-bubbles.html","Discussion Bubbles"),
    ("proposals.html",         "Proposals"),
    ("main-flows.html",        "Main Flows"),
    ("index.html",             "Index"),
]


def build_nav_html(active: str) -> str:
    links_html = "\n            ".join(
        f'<a href="{href}"{(" class=\"is-active\"" if href == active else "")}>{label}</a>'
        for href, label in NAV_LINKS
    )
    return (
        '    <header class="page-header">\n'
        '        <nav class="page-nav">\n'
        '            <a href="index.html" class="nav-brand">PARBAUGHS Orchestration</a>\n'
        '            <div class="nav-links">\n'
        f'            {links_html}\n'
        '            </div>\n'
        '        </nav>\n'
        '    </header>\n'
    )


def has_canonical_nav(html: str) -> bool:
    """Detect whether the file's nav already has all 6 canonical links."""
    if 'class="page-nav"' not in html:
        return False
    # Look in the page-nav block for all 6 hrefs
    m = re.search(r'<nav class="page-nav">(.*?)</nav>', html, re.DOTALL)
    if not m:
        return False
    inside = m.group(1)
    for href, _ in NAV_LINKS:
        if f'href="{href}"' not in inside:
            return False
    return True


def inject(file_path: Path, active: str) -> str:
    html = file_path.read_text(encoding="utf-8")
    if has_canonical_nav(html):
        return "skipped-already-canonical"

    # Strategy A: file has existing <nav class="page-nav">...</nav> — replace it whole
    if 'class="page-nav"' in html:
        new_nav = build_nav_html(active).strip()
        # Strip the existing surrounding <header class="page-header">...</header>
        html, n = re.subn(
            r'<header class="page-header">.*?</header>',
            new_nav,
            html, count=1, flags=re.DOTALL,
        )
        if n != 1:
            return "fail-could-not-replace-existing-nav"
        file_path.write_text(html, encoding="utf-8")
        return "updated-existing-nav"

    # Strategy B: no nav at all — inject CSS + nav HTML

    # CSS injection: try before existing </style>, else create new <style> block
    if "</style>" in html:
        html = html.replace("</style>", PAGE_NAV_CSS + "    </style>", 1)
    else:
        # Inject style block immediately before </head>
        style_block = f"    <style>{PAGE_NAV_CSS}    </style>\n"
        html = html.replace("</head>", style_block + "</head>", 1)

    # Nav HTML: insert right after <body> or <body...>
    nav_html = build_nav_html(active)
    new_html, count = re.subn(
        r'(<body[^>]*>\s*)',
        lambda m: m.group(1) + nav_html,
        html, count=1,
    )
    if count != 1:
        return "fail-could-not-find-body-tag"
    file_path.write_text(new_html, encoding="utf-8")
    return "injected-fresh-nav"


def main():
    print(f"[inject-page-nav] processing {len(TARGETS)} dashboards")
    results = {}
    for fname, active in TARGETS:
        p = REPORTS / fname
        if not p.exists():
            results[fname] = "skipped-missing"
            print(f"  {fname}: skipped (missing)")
            continue
        r = inject(p, active)
        results[fname] = r
        print(f"  {fname}: {r}")
    failed = [f for f, r in results.items() if r.startswith("fail")]
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
