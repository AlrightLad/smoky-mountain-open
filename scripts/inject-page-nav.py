#!/usr/bin/env python3
"""
Inject the shared `.pb-page-header` nav into every dashboard.

After the Dashboard Consolidation (Phase 3, 2026-05-13):
- Writes the canonical .pb-page-header / .pb-page-nav / .pb-page-brand /
  .pb-page-nav-links markup. CSS lives in _assets/dashboard-shell.css.
- Force-removes the legacy <style> nav block (8x duplicated rule set) and
  the legacy <header class="page-header"> markup.
- Force-adds <link rel="stylesheet" href="_assets/dashboard-shell.css"> to
  the <head> if not present.
- main-flows.html opts into the wider variant via .is-wide modifier on the
  header (matching .pb-page-main.is-wide on the content container).

Idempotent: running twice over a canonical file produces no diff.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "docs" / "reports"

# Pages that opt into the wider 1480px max-width variant. main-flows is the
# sole consumer today (architecture grid needs the extra horizontal room).
WIDE_PAGES = {"main-flows.html"}

# Pages this script manages, with the link basename that should be is-active.
TARGETS = [
    ("dashboard.html",         "dashboard.html"),
    ("activity.html",          "activity.html"),
    ("proposals.html",         "proposals.html"),
    ("amendments.html",        "amendments.html"),
    ("discussion-bubbles.html","discussion-bubbles.html"),
    ("main-flows.html",        "main-flows.html"),
    ("design-system.html",     "design-system.html"),
    ("token-usage.html",       "token-usage.html"),
    ("index.html",             "index.html"),
]

NAV_LINKS = [
    ("dashboard.html",         "Dashboard"),
    ("activity.html",          "Activity"),
    ("discussion-bubbles.html","Discussion Bubbles"),
    ("proposals.html",         "Proposals"),
    ("amendments.html",        "Amendments"),
    ("main-flows.html",        "Main Flows"),
    ("design-system.html",     "Design System"),
    ("token-usage.html",       "Tokens"),
    ("index.html",             "Index"),
]

SHELL_LINK = '    <link rel="stylesheet" href="_assets/dashboard-shell.css">\n'

# Legacy nav <style> rules that lived inside each dashboard's head until
# Phase 3. Strip wholesale on first migration; no-op on subsequent runs
# (idempotent).
#
# Two patterns to strip:
#   1. The "Cross-dashboard nav" comment marker line (if present)
#   2. The seven canonical legacy rule lines (.page-header / .page-nav /
#      .nav-brand / .nav-links / .nav-links a / .nav-links a:hover /
#      .nav-links a.is-active), in any order, possibly with intervening
#      whitespace.
LEGACY_NAV_COMMENT_RE = re.compile(
    r"\s*/\* === Cross-dashboard nav \(injected by scripts/inject-page-nav\.py\) === \*/\s*\n"
)

LEGACY_NAV_RULES = [
    r"\.page-header\s*\{[^}]*\}",
    r"\.page-nav\s*\{[^}]*\}",
    r"\.nav-brand\s*\{[^}]*\}",
    r"\.nav-links\s*\{[^}]*\}",
    r"\.nav-links a\s*\{[^}]*\}",
    r"\.nav-links a:hover\s*\{[^}]*\}",
    r"\.nav-links a\.is-active\s*\{[^}]*\}",
]
LEGACY_NAV_RULE_RES = [re.compile(r"\s*" + p, re.DOTALL) for p in LEGACY_NAV_RULES]


def build_nav_html(active: str, is_wide: bool) -> str:
    links_html = "\n                ".join(
        f'<a href="{href}"{(" class=\"is-active\"" if href == active else "")}>{label}</a>'
        for href, label in NAV_LINKS
    )
    header_class = "pb-page-header is-wide" if is_wide else "pb-page-header"
    return (
        f'    <header class="{header_class}">\n'
        '        <nav class="pb-page-nav">\n'
        '            <a href="index.html" class="pb-page-brand">PARBAUGHS Orchestration</a>\n'
        '            <div class="pb-page-nav-links">\n'
        f'                {links_html}\n'
        '            </div>\n'
        '        </nav>\n'
        '    </header>\n'
    )


def has_canonical_pb_nav(html: str, active: str) -> bool:
    """Detect whether the file already has the canonical .pb-page-nav."""
    if 'class="pb-page-nav"' not in html:
        return False
    m = re.search(r'<nav class="pb-page-nav">(.*?)</nav>', html, re.DOTALL)
    if not m:
        return False
    inside = m.group(1)
    # All NAV_LINKS present?
    for href, _ in NAV_LINKS:
        if f'href="{href}"' not in inside:
            return False
    # Correct is-active?
    active_match = re.search(r'href="([^"]+)"[^>]*\bclass="is-active"', inside)
    if not active_match or active_match.group(1) != active:
        return False
    return True


def ensure_shell_import(html: str) -> str:
    """Make sure <link href="_assets/dashboard-shell.css"> is in <head>."""
    if "_assets/dashboard-shell.css" in html:
        return html
    # Insert after the existing dashboard.css link if present (keeps ordering
    # stable), else immediately before </head>.
    if 'href="_assets/dashboard.css"' in html:
        return html.replace(
            '<link rel="stylesheet" href="_assets/dashboard.css">',
            '<link rel="stylesheet" href="_assets/dashboard.css">\n' + SHELL_LINK.rstrip("\n"),
            1,
        )
    return html.replace("</head>", SHELL_LINK + "</head>", 1)


def strip_legacy_nav_style(html: str) -> str:
    """Remove the legacy inline nav <style> rules + comment marker."""
    html = LEGACY_NAV_COMMENT_RE.sub("", html)
    for rule_re in LEGACY_NAV_RULE_RES:
        html = rule_re.sub("", html)
    return html


def inject(file_path: Path, active: str) -> str:
    html = file_path.read_text(encoding="utf-8")
    original = html

    is_wide = file_path.name in WIDE_PAGES

    # 1. Ensure dashboard-shell.css is imported.
    html = ensure_shell_import(html)

    # 2. Strip the legacy inline nav <style> block (no-op if already gone).
    html = strip_legacy_nav_style(html)

    # 3. Replace existing <header class="..."> nav block, or inject a new one
    #    right after <body>.
    new_nav = build_nav_html(active, is_wide).rstrip("\n")

    # Match either the legacy .page-header or the new .pb-page-header,
    # consuming any leading whitespace so re-runs don't accumulate indent.
    header_re = re.compile(
        r'[ \t]*<header class="(?:pb-)?page-header(?:\s+is-wide)?">.*?</header>\n?',
        re.DOTALL,
    )
    if header_re.search(html):
        html = header_re.sub(new_nav + "\n", html, count=1)
    else:
        # No existing <header>: inject after <body>. The lambda already
        # consumes the body tag + its trailing whitespace via the regex,
        # so new_nav contributes its own indent and we don't double-up.
        body_re = re.compile(r'(<body[^>]*>)[ \t]*\n[ \t]*')
        m = body_re.search(html)
        if not m:
            return "fail-could-not-find-body-tag"
        html = body_re.sub(lambda mm: mm.group(1) + "\n", html, count=1)
        html = re.sub(r'(<body[^>]*>\n)', lambda mm: mm.group(1) + new_nav + "\n", html, count=1)

    if html == original:
        return "skipped-already-canonical"

    file_path.write_text(html, encoding="utf-8")
    if has_canonical_pb_nav(html, active):
        return "updated-canonical"
    return "fail-canonical-check-after-write"


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
