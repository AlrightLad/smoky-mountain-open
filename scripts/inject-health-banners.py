#!/usr/bin/env python3
"""Idempotently scaffold health banners (test, security, approvals,
architecture) into docs/reports/dashboard.html.

Background
----------
dashboard.html is gitignored (local desktop tooling, AMD-007). Pre-2026-05-15
this script assumed test/security banner markup already existed on disk
(authored ad-hoc at some point that was never committed). When the on-disk
file vanished and was restored from git history, the assumption was wrong —
git history never contained the test/security banner markup either. See
audit-report-2026-05-15.md section "Root-cause finding."

Post-2026-05-15 (R3 remediation): this script now scaffolds ALL four
banners — test + security as the original baseline, then approvals
(AMD-023) + architecture (AMD-024) as the later siblings. Anchors used
for insertion are stable structural points (system-health section opening
+ closing), not previously-injected markup. That makes the script
durable: it produces correct output regardless of whether the file is
fresh-from-template, already-half-scaffolded, or fully-rendered.

Idempotent: each banner / detail / render-call has a fingerprint check;
already-present items are skipped. Running N times produces no diff.

Wired into regen pipeline (regen-all.sh + regen-all.ps1) before
regen-dashboard.py so markup lands first, then data block swap
populates it.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "dashboard.html"


# ── Four banner buttons in render order: test, security, approvals, architecture.
# Each is a separate self-contained block; emitted only if its fingerprint
# (the data-fq-banner-meta="X" attribute) is absent from the file.
BANNER_TEST = '''                    <!-- R3 2026-05-15: test-health banner. Reads .claude/state/aggregates/test-health.json
                         (status: green | yellow | red). Renders without JS by injecting status text inline; will gain
                         click-to-expand interaction when renderHealthBanner is wired (separate ship). -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="test" aria-controls="health-banner-test-detail" aria-expanded="false" title="Test health (test-health.json aggregate). Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="test" aria-hidden="true">&bull;</span> Test health</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="test" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="test">no aggregate yet</span>
                    </button>
'''

BANNER_SECURITY = '''                    <!-- R3 2026-05-15: security-health banner. Reads .claude/state/aggregates/security-health.json
                         (status: green | yellow | red). Yellow = open dependency CVEs (non-blocking). Red = active leak / rules drift / AMD-018 violation. -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="security" aria-controls="health-banner-security-detail" aria-expanded="false" title="Security health (security-health.json aggregate). Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="security" aria-hidden="true">&bull;</span> Security health</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="security" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="security">no aggregate yet</span>
                    </button>
'''

BANNER_APPROVALS = '''                    <!-- AMD-023 + queue task approvals-pipeline-banner: derived locally
                         from scripts/cron/logs/*-downloads-watcher.log + marker +
                         proposals/{state}/ counts. No external aggregator file. -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="approvals" aria-controls="health-banner-approvals-detail" aria-expanded="false" title="Approvals pipeline (AMD-023). Reads downloads-watcher logs + proposals state. Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="approvals" aria-hidden="true">&bull;</span> Approvals pipeline</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="approvals" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="approvals">scanning watcher logs</span>
                    </button>
'''

BANNER_ARCHITECTURE = '''                    <!-- AMD-024 + queue task architecture-review-banner: reads
                         .claude/state/aggregates/architecture-review.json written by
                         the Architecture / AI Engineer agent (Terminal 6). Empty-state
                         when file absent until that agent dispatches. -->
                    <button type="button" class="pb-kpi-card pb-health-banner" data-fq-banner="architecture" aria-controls="health-banner-architecture-detail" aria-expanded="false" title="Architecture / AI Engineer agent (Terminal 6, AMD-024) writes architecture-review.json. Click for details.">
                        <span class="pb-kpi-label"><span class="pb-health-banner-dot" data-fq-banner-dot="architecture" aria-hidden="true">&bull;</span> Architecture review</span>
                        <span class="pb-kpi-value is-small" data-fq-banner-summary="architecture" style="white-space: normal; word-break: break-word; line-height: 1.3;">awaiting data&hellip;</span>
                        <span class="pb-kpi-sub" data-fq-banner-meta="architecture">no aggregate yet</span>
                    </button>
'''

# Detail panels: one per banner, hidden by default.
DETAIL_TEST = '''                <div id="health-banner-test-detail" class="pb-health-banner-detail" data-fq-banner-detail="test" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
'''
DETAIL_SECURITY = '''                <div id="health-banner-security-detail" class="pb-health-banner-detail" data-fq-banner-detail="security" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
'''
DETAIL_APPROVALS = '''                <div id="health-banner-approvals-detail" class="pb-health-banner-detail" data-fq-banner-detail="approvals" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
'''
DETAIL_ARCHITECTURE = '''                <div id="health-banner-architecture-detail" class="pb-health-banner-detail" data-fq-banner-detail="architecture" hidden style="margin-top: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--surface-secondary);"></div>
'''

# Structural anchors used for FIRST insertion when no prior banners exist.
# These point to stable DOM structure that won't drift between regen runs.
KPI_GRID_OPEN = '<div class="pb-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">'
HEALTH_SECTION_END = '<!-- Cron install status'


def _insert_after(text: str, anchor: str, block: str, fingerprint: str):
    """Insert `block` immediately after the FIRST `anchor` occurrence, only
    if `fingerprint` not already present in text. Returns
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
    """Scaffold all four banners + four detail panels into the dashboard.

    Insertion order matters: banners are inserted RIGHT-AFTER the kpi-grid
    opening tag in REVERSE order (architecture → approvals → security → test)
    so the rendered order reads test, security, approvals, architecture.
    Each insert is idempotent (fingerprint check).
    """
    changes = []

    # ── Banner buttons. Insert just after the system-health kpi-grid opens.
    # Reverse render order so all four end up before round-trip card in
    # the same kpi-grid.
    for label, block, fingerprint in [
        ("banner-architecture", BANNER_ARCHITECTURE, 'data-fq-banner="architecture"'),
        ("banner-approvals", BANNER_APPROVALS, 'data-fq-banner="approvals"'),
        ("banner-security", BANNER_SECURITY, 'data-fq-banner="security"'),
        ("banner-test", BANNER_TEST, 'data-fq-banner="test"'),
    ]:
        html, changed, status = _insert_after(
            html,
            KPI_GRID_OPEN + "\n",
            block,
            fingerprint,
        )
        changes.append((label, changed, status))

    # ── Detail panels. Insert just before the cron install status comment
    # (stable structural end-of-system-health anchor).
    for label, block, fingerprint in [
        ("detail-architecture", DETAIL_ARCHITECTURE, 'data-fq-banner-detail="architecture"'),
        ("detail-approvals", DETAIL_APPROVALS, 'data-fq-banner-detail="approvals"'),
        ("detail-security", DETAIL_SECURITY, 'data-fq-banner-detail="security"'),
        ("detail-test", DETAIL_TEST, 'data-fq-banner-detail="test"'),
    ]:
        # Insert BEFORE the cron install status comment by anchoring on the
        # whitespace+content that immediately precedes it.
        if fingerprint in html:
            changes.append((label, False, "already-present"))
            continue
        idx = html.find(HEALTH_SECTION_END)
        if idx < 0:
            changes.append((label, False, f"anchor-missing: {HEALTH_SECTION_END[:60]!r}"))
            continue
        # Find start of the line containing the anchor (back to last newline+indent).
        line_start = html.rfind("\n", 0, idx) + 1
        html = html[:line_start] + block + html[line_start:]
        changes.append((label, True, "inserted"))

    return html, changes


def main():
    if not DASHBOARD.exists():
        print(
            f"[inject-health-banners] FAIL {DASHBOARD} not present. "
            f"Run scripts/scaffold-from-templates.sh first to create the scaffold.",
            file=sys.stderr,
        )
        return 1

    text = DASHBOARD.read_text(encoding="utf-8")
    new_text, changes = inject(text)
    any_inserted = any(c for _, c, _ in changes)
    any_anchor_missing = any(
        not c and s.startswith("anchor-missing") for _, c, s in changes
    )

    for name, changed, status in changes:
        print(f"[inject-health-banners] {name:24} {'INSERT' if changed else status}")

    if any_inserted:
        DASHBOARD.write_text(new_text, encoding="utf-8")
        print(f"[inject-health-banners] OK   {DASHBOARD.name}")

    if any_anchor_missing:
        print(
            "[inject-health-banners] FAIL one or more structural anchors missing. "
            "dashboard.html drifted from canonical scaffold; re-scaffold via "
            "scripts/scaffold-from-templates.sh.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
