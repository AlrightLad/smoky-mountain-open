#!/usr/bin/env python3
"""
Regenerate docs/reports/token-usage.html via data-block swap + server-side
agent_role pie slice bake.

Reads .claude/state/telemetry/aggregates/token-usage-snapshot.json and:
  1. Swaps the <script id="report-data"> JSON block (interactive hydration).
  2. Bakes the agent_role pie slices directly into the SVG + legend so the
     chart renders without JS (Phase T6 / D19 graceful-fallback contract).
Runs the aggregator first if the snapshot doesn't exist.
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / ".claude" / "state" / "telemetry" / "aggregates" / "token-usage-snapshot.json"
TARGET = ROOT / "docs" / "reports" / "token-usage.html"
AGGREGATOR = ROOT / "scripts" / "aggregate-token-usage.py"
PYTHON = sys.executable

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

# Phase T6: match the JS palette in templates/dashboards/token-usage.template.html
# Used by server-side bake so JS-disabled clients see the same slices/colors.
PIE_PALETTE = [
    "var(--pb-brass-500)",
    "var(--pb-billiard-green-500)",
    "var(--pb-info)",
    "var(--chart-violet)",
    "var(--pb-error)",
    "var(--pb-success)",
    "var(--chart-rose)",
    "var(--pb-warning)",
    "var(--pb-chalk-300)",
    "var(--pb-chalk-500)",
]

PIE_DONUT_RE = re.compile(
    r'(<svg class="tu-pie-donut" id="tu-pie-donut"[^>]*>)(.*?)(</svg>)',
    re.DOTALL,
)
PIE_LEGEND_RE = re.compile(
    r'(<div class="tu-pie-legend" id="tu-pie-legend"[^>]*>)(.*?)(</div>\s*</div>)',
    re.DOTALL,
)


def _fmt_tokens(n: int) -> str:
    """Mirror the JS fmtTokens helper for parity in server-side bake."""
    if n is None:
        return "-"
    if n == 0:
        return "0"
    if abs(n) >= 1_000_000_000:
        return f"{n / 1_000_000_000:.2f}B"
    if abs(n) >= 1_000_000:
        return f"{n / 1_000_000:.2f}M"
    if abs(n) >= 1_000:
        return f"{n / 1_000:.1f}k"
    return str(n)


def _fmt_usd(n: float) -> str:
    if n is None:
        return "$0.00"
    if abs(n) >= 1000:
        return f"${n / 1000:.2f}k"
    if 0 < abs(n) < 0.01:
        return "<$0.01"
    return f"${n:.2f}"


def _bake_pie(html: str, slices: list[dict]) -> str:
    """Write the agent_role slices into the SVG donut + legend so the chart
    renders without JS.
    """
    total_tokens = sum(int(s.get("tokens", 0)) for s in slices)
    total_cost = sum(float(s.get("usd_cost", 0)) for s in slices)
    r = 80
    circumference = 2 * math.pi * r

    # Build arc <circle> elements.
    arcs = []
    offset = 0.0
    for idx, sl in enumerate(slices):
        tokens = int(sl.get("tokens", 0))
        if tokens <= 0 or total_tokens <= 0:
            continue
        length = (tokens / total_tokens) * circumference
        color = PIE_PALETTE[idx % len(PIE_PALETTE)]
        arcs.append(
            '<circle class="tu-pie-arc" cx="100" cy="100" r="80" fill="none" '
            f'stroke="{color}" stroke-width="22" '
            f'stroke-dasharray="{length:.4f} {circumference - length:.4f}" '
            f'stroke-dashoffset="{-offset:.4f}" '
            'transform="rotate(-90 100 100)" />'
        )
        offset += length

    new_svg_body = (
        '\n                    <circle cx="100" cy="100" r="80" fill="none" '
        'stroke="var(--pb-billiard-green-700)" stroke-width="22" />\n                    '
        + "\n                    ".join(arcs)
        + (f'\n                    <text class="tu-donut-total" x="100" y="88" '
           f'text-anchor="middle" dominant-baseline="central" data-pie-donut="total">'
           f'{_fmt_tokens(total_tokens)}</text>')
        + (f'\n                    <text class="tu-donut-total-sub" x="100" y="115" '
           f'text-anchor="middle" data-pie-donut="cost">{_fmt_usd(total_cost)}</text>')
        + ('\n                    <text class="tu-donut-total-label" x="100" y="132" '
           'text-anchor="middle" data-pie-donut="label">by agent role</text>\n                ')
    )

    html, svg_count = PIE_DONUT_RE.subn(
        lambda m: m.group(1) + new_svg_body + m.group(3), html, count=1
    )
    if svg_count != 1:
        print("[regen-token-usage] WARN pie donut block not found; skipping bake", file=sys.stderr)
        return html

    # Build legend rows.
    if not slices:
        legend_body = '\n                <div class="tu-pie-empty">No tokens recorded for this view yet.</div>\n            '
    else:
        rows = []
        for idx, sl in enumerate(slices):
            color = PIE_PALETTE[idx % len(PIE_PALETTE)]
            label = str(sl.get("label", "")).replace("<", "&lt;").replace(">", "&gt;")
            tokens = int(sl.get("tokens", 0))
            cost = float(sl.get("usd_cost", 0))
            rows.append(
                '\n                <div class="tu-pie-legend-row" role="listitem">'
                f'<span class="tu-pie-legend-swatch" style="background:{color};" aria-hidden="true"></span>'
                f'<span class="tu-pie-legend-label" title="{label}">{label}</span>'
                '<span class="tu-pie-legend-numbers">'
                f'<span class="tu-pie-legend-tokens">{_fmt_tokens(tokens)}</span>'
                f'<span class="tu-pie-legend-cost">{_fmt_usd(cost)}</span>'
                "</span></div>"
            )
        legend_body = "".join(rows) + "\n            "

    html, legend_count = PIE_LEGEND_RE.subn(
        lambda m: m.group(1) + legend_body + m.group(3), html, count=1
    )
    if legend_count != 1:
        print("[regen-token-usage] WARN pie legend block not found; JS will hydrate", file=sys.stderr)

    return html


def main():
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if target missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(TARGET)
    if not SNAPSHOT.exists():
        print(f"[regen-token-usage] snapshot missing; running aggregator first")
        try:
            subprocess.run([PYTHON, str(AGGREGATOR)], cwd=str(ROOT), check=False, timeout=30,
                           env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
        except Exception as e:
            print(f"[regen-token-usage] WARN aggregator failed: {e}", file=sys.stderr)
    if not SNAPSHOT.exists():
        print(f"[regen-token-usage] FATAL snapshot still missing after aggregator", file=sys.stderr)
        return 2
    if not TARGET.exists():
        print(f"[regen-token-usage] FATAL target missing: {TARGET}", file=sys.stderr)
        return 2

    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    html = TARGET.read_text(encoding="utf-8")
    new_json = json.dumps(data, indent=2, default=str)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        print(f"[regen-token-usage] FAIL data-block match count = {count}", file=sys.stderr)
        return 1

    # Phase T6 (D19): server-side bake of agent_role pie so the chart works
    # without JS — matches the JS default view.
    pie = (data.get("pie_views") or {}).get("agent_role") or []
    new_html = _bake_pie(new_html, pie)

    TARGET.write_text(new_html, encoding="utf-8")
    a = data.get("all_time", {})
    print(f"[regen-token-usage] OK   {TARGET.name}")
    print(f"[regen-token-usage] all-time: real={a.get('real')} estimated={a.get('estimated')} manual={a.get('manual')}")
    pv = data.get("pie_views") or {}
    print(f"[regen-token-usage] pie_views slices: agent={len(pv.get('agent_role') or [])} "
          f"work={len(pv.get('work_category') or [])} session_top10={len(pv.get('session_top10') or [])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
