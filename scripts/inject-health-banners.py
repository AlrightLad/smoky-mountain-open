#!/usr/bin/env python3
"""Idempotently insert Approvals Pipeline + Architecture Review health
banners into docs/reports/dashboard.html.

Background
----------
dashboard.html is gitignored (local desktop tooling, AMD-007). The
existing test/security banners + their detail panels + JS render calls
already live in the file. This script adds two siblings — Approvals
Pipeline (AMD-023) and Architecture Review (AMD-024) — without touching
the rest of the file.

Idempotent: skips any of the three inserts (button, detail panel, JS
render call) that's already present. Running twice produces no diff.

Same pattern as scripts/inject-page-nav.py.

Wired into the regen pipeline (regen-all.sh + regen-all.ps1) so it runs
before regen-dashboard.py — markup land first, then the data block
swap populates it.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "dashboard.html"

BANNER_HTML = '''                    <!-- AMD-023 + queue task approvals-pipeline-banner: derived locally
                         from scripts/cron/logs/*-downloads-watcher.log + marker +
                         proposals/{state}/ counts. No external aggregator file. -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="approvals" aria-controls="health-banner-approvals-detail" aria-expanded="false" title="Approvals pipeline (AMD-023). Reads downloads-watcher logs + proposals state. Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="approvals" aria-hidden="true">&bull;</span> Approvals pipeline</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="approvals" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="approvals">scanning watcher logs</span>
                    </button>
                    <!-- AMD-024 + queue task architecture-review-banner: reads
                         .claude/state/aggregates/architecture-review.json written by
                         the Architecture / AI Engineer agent (Terminal 6). Empty-state
                         when file absent until that agent dispatches. -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="architecture" aria-controls="health-banner-architecture-detail" aria-expanded="false" title="Architecture / AI Engineer agent (Terminal 6, AMD-024) writes architecture-review.json. Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="architecture" aria-hidden="true">&bull;</span> Architecture review</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="architecture" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="architecture">no aggregate yet</span>
                    </button>
'''

DETAIL_HTML = '''                <div id="health-banner-approvals-detail" class="pb-health-banner-detail" data-fq-banner-detail="approvals" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
                <div id="health-banner-architecture-detail" class="pb-health-banner-detail" data-fq-banner-detail="architecture" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
'''

RENDER_CALLS = '''            renderHealthBanner('approvals', hh.approvals_pipeline || null);
            renderHealthBanner('architecture', hh.architecture_review || null);
'''


def _insert_after(text: str, anchor: str, block: str, fingerprint: str):
    """Insert `block` immediately after the `anchor` occurrence, but only
    if `fingerprint` is not already present anywhere in text. Returns
    (new_text, changed_bool, status_str).
    """
    if fingerprint in text:
        return text, False, "already-present"
    idx = text.find(anchor)
    if idx < 0:
        return text, False, f"anchor-missing: {anchor[:60]!r}"
    insertion = idx + len(anchor)
    return text[:insertion] + block + text[insertion:], True, "inserted"


def inject(html: str):
    """Apply the three inserts. Returns (new_html, changes_list)."""
    changes = []

    # 1. Banner buttons. Insert after the security button's closing </button>
    # tag, before the closing </div> of pb-kpi-grid.
    sec_button_close = (
        '<span class="pb-kpi-sub" data-fq-banner-meta="security">no aggregate yet</span>\n'
        '                    </button>\n'
    )
    html, changed, status = _insert_after(
        html,
        sec_button_close,
        BANNER_HTML,
        'data-fq-banner="approvals"',
    )
    changes.append(("banner-buttons", changed, status))

    # 2. Detail panels. Insert after the security detail panel div.
    sec_detail = (
        '<div id="health-banner-security-detail" class="pb-health-banner-detail" '
        'data-fq-banner-detail="security" hidden style="margin-top: var(--space-3); '
        'padding: var(--space-3); border: 1px solid var(--border-subtle); '
        'border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>\n'
    )
    html, changed, status = _insert_after(
        html,
        sec_detail,
        DETAIL_HTML,
        'data-fq-banner-detail="approvals"',
    )
    changes.append(("detail-panels", changed, status))

    # 3. renderHealthBanner JS calls. Insert after the security render call.
    sec_render = "renderHealthBanner('security', hh.security_health || null);\n"
    html, changed, status = _insert_after(
        html,
        sec_render,
        RENDER_CALLS,
        "renderHealthBanner('approvals'",
    )
    changes.append(("render-calls", changed, status))

    return html, changes


def main():
    if not DASHBOARD.exists():
        print(f"[inject-health-banners] SKIP {DASHBOARD} not present (gitignored, "
              f"created by initial scaffold)", file=sys.stderr)
        return 0

    text = DASHBOARD.read_text(encoding="utf-8")
    new_text, changes = inject(text)
    any_inserted = any(c for _, c, _ in changes)
    any_anchor_missing = any(
        not c and s.startswith("anchor-missing") for _, c, s in changes
    )

    for name, changed, status in changes:
        print(f"[inject-health-banners] {name:18} {'INSERT' if changed else status}")

    if any_inserted:
        DASHBOARD.write_text(new_text, encoding="utf-8")
        print(f"[inject-health-banners] OK   {DASHBOARD.name}")

    if any_anchor_missing:
        print(
            "[inject-health-banners] WARN one or more anchors missing — "
            "dashboard.html may have drifted from canonical markup. "
            "Re-run inject-page-nav.py + scaffold if needed.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
