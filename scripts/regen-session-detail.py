#!/usr/bin/env python3
"""Regenerate docs/reports/sessions/<date>.html per session-summary md.

Per Founder directive 2026-05-21:
- "I don't like how the session takes me to a MD it should be another html
  or something that is cleaner and has graphs and shows grade on session
  overall and the grading needs to be severely brutal and honest compared
  to industry standard"
- "I know I am a small business so take that into account and not at the
  same size but I should have the standards that fit and set me up for
  success long term"

For each .claude/state/session-summary-YYYY-MM-DD.md, this script:
  1. Parses the MD (TL;DR, dimension table, critique-applied block, full body)
  2. Renders markdown -> HTML5
  3. Computes brutal per-dimension grades vs solo-SaaS industry bars
  4. Emits docs/reports/sessions/<date>.html with structured payload + body_html
  5. The sessions index (regen-sessions.py) links to these HTML pages instead
     of the raw MD files.

Industry bars are calibrated for a single-founder + AI-team product with ~20
members on free-tier infra (not Linear / Stripe scale). They represent what
production SaaS at this size SHOULD hit to stay viable long-term.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
TEMPLATE = ROOT / "templates" / "dashboards" / "session-detail.template.html"
OUT_DIR = ROOT / "docs" / "reports" / "sessions"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)
GRADE_RE = re.compile(r'\b([A-F][+-]?)\s*\((\d+(?:\.\d+)?)\)')

# Industry bars for a solo founder + AI team product at ~20 members.
# These are not Linear/Stripe bars — they are "what does production SaaS at
# this size need to hit to NOT collapse under tech debt long-term."
INDUSTRY_BARS = {
    "A1 Roadmap":         {"bar": 75, "honest_bad": "No roadmap = no compounding focus. Solo teams die from drift.", "honest_meh": "Drift risk; weekly review needed.", "honest_good": "Clear next 4 weeks; healthy."},
    "A2 FIQ":             {"bar": 85, "honest_bad": "Founder-In-Queue items rotting = compound trust damage.", "honest_meh": "Some FIQs aging > 7 days.", "honest_good": "FIQ flows; nothing rotting."},
    "A3 Security":        {"bar": 85, "honest_bad": "One leaked credential = league-wide trust damage. 56 means CRITICAL gaps still open.", "honest_meh": "Hardening incomplete; gaps known.", "honest_good": "Hardened against OWASP basics."},
    "A4 UI/UX":           {"bar": 80, "honest_bad": "Looks AI-generated. Friends will notice + lose interest.", "honest_meh": "Functional but unmemorable.", "honest_good": "Craft above competence; members feel it."},
    "A5 Code Quality":    {"bar": 80, "honest_bad": "Files > 800 lines = AI agents lose context = bug surface explodes.", "honest_meh": "Some giants need splitting (home.js 2738).", "honest_good": "Modules sized for AI + human reading."},
    "A6 Architecture":    {"bar": 80, "honest_bad": "Architectural drift = unmaintainable in 6 months.", "honest_meh": "Pattern compliance partial; ADRs not all landed.", "honest_good": "ADRs + tier discipline holding."},
    "A7 Data Integrity":  {"bar": 95, "honest_bad": "Bad data = members lose handicap trust = abandon platform.", "honest_meh": "Validation gaps in some flows.", "honest_good": "Schema + rules + audits aligned."},
    "A8 Performance":     {"bar": 85, "honest_bad": "Slow app on iPhone = members stop opening it. Period.", "honest_meh": "Bundle bloat, lighthouse < 90.", "honest_good": "Sub-second TTI; lighthouse holding."},
    "A9 Accessibility":   {"bar": 90, "honest_bad": "Legal risk + members with vision issues locked out.", "honest_meh": "WCAG AA gaps known.", "honest_good": "AA across surfaces; axe-core gates."},
    "A10 Mobile-first":   {"bar": 90, "honest_bad": "20 members on iPhones — mobile broken = product broken.", "honest_meh": "Some surfaces desktop-first.", "honest_good": "Mobile-Safari verified end-to-end."},
    "A11 Testing":        {"bar": 75, "honest_bad": "No tests = every refactor is roulette. AI agents need green tests to ship.", "honest_meh": "Smoke present, unit thin.", "honest_good": "Smoke + E2E + unit; honest reporting."},
    "A12 Operational":    {"bar": 85, "honest_bad": "Dashboard rotting = no signal = no recovery from outages.", "honest_meh": "Dirty-tree cycles + watcher skips persist.", "honest_good": "Cron + watcher + dashboards green."},
}


def slugify_date(stem: str) -> str:
    m = re.search(r'(\d{4}-\d{2}-\d{2})', stem)
    return m.group(1) if m else stem


def parse_session(md_path: Path) -> dict:
    text = md_path.read_text(encoding="utf-8", errors="replace")

    # Title (first H1)
    title_m = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
    title = title_m.group(1).strip() if title_m else md_path.stem

    date = slugify_date(md_path.stem)

    # Grade — prefer "Final" / arrow / first match
    grade, score = "—", ""
    final_m = re.search(
        r'(?:Final(?:\s+(?:grade|score))?|Ship grade)[:\s]+\*?\*?([A-F][+-]?)\s*\((\d+(?:\.\d+)?)\)',
        text, re.IGNORECASE,
    )
    if final_m:
        grade, score = final_m.group(1), final_m.group(2)
    else:
        arrow_m = re.search(
            r'[A-F][+-]?\s*\(\d+(?:\.\d+)?\)\s*[→\->]>?\s*([A-F][+-]?)\s*\((\d+(?:\.\d+)?)\)',
            text,
        )
        if arrow_m:
            grade, score = arrow_m.group(1), arrow_m.group(2)
        else:
            g = GRADE_RE.search(text)
            if g:
                grade, score = g.group(1), g.group(2)

    delta_m = re.search(r'([+\-]\d+(?:\.\d+)?)\s*points?', text)
    delta = delta_m.group(0) if delta_m else ""

    ships_m = re.search(r'(\d+)\s*ships?\s*(tracked|shipped|complete)?', text, re.IGNORECASE)
    ships = ships_m.group(1) if ships_m else "—"

    commits_m = re.search(r'(\d+)[+]?\s*commits?\s*(pushed|today|substantive)?', text, re.IGNORECASE)
    commits = commits_m.group(1) if commits_m else "—"

    runtime = "overnight" if "overnight" in text.lower()[:300] else ""

    # Parse dimension table — extract per-dimension score
    dimensions = []
    table_m = re.search(
        r'## Final dimension scores.*?\n(\|.+?\n(?:\|.+?\n)+)',
        text, re.DOTALL,
    )
    if table_m:
        for row in table_m.group(1).splitlines():
            row = row.strip()
            if not row.startswith("|"):
                continue
            cells = [c.strip() for c in row.strip("|").split("|")]
            if len(cells) < 2:
                continue
            # Skip header / separator rows
            if "Dim" in cells[0] or "---" in cells[0] or "Score" in cells[1]:
                continue
            dim_label = re.sub(r'\*\*', '', cells[0]).strip()
            score_str = re.sub(r'[^\d.]', '', cells[1])
            try:
                dim_score = int(float(score_str))
            except ValueError:
                continue
            bar_entry = INDUSTRY_BARS.get(dim_label, {"bar": 80, "honest_bad": "", "honest_meh": "", "honest_good": ""})
            if dim_score >= 85:
                honest = bar_entry["honest_good"]
            elif dim_score >= 65:
                honest = bar_entry["honest_meh"]
            else:
                honest = bar_entry["honest_bad"]
            dimensions.append({
                "name": dim_label,
                "score": dim_score,
                "industry_bar": bar_entry["bar"],
                "honest": honest,
            })

    # Critique-applied block
    critique = None
    critique_m = re.search(r'## Critique applied.*?(?=\n## |\Z)', text, re.DOTALL)
    if critique_m:
        block = critique_m.group(0)
        findings_raw = re.findall(
            r'-\s*(?:F\d+\s*)?\(?(critical|high|medium|low)\)?\s*[\-—]\s*([^\n]+)',
            block, re.IGNORECASE,
        )
        findings = []
        for sev, summary in findings_raw[:10]:
            findings.append({
                "id": "",
                "severity": sev.lower(),
                "summary": summary.strip()[:300],
            })
        if findings:
            critique = {"findings": findings}

    # Brutal verdict — derive from grade + RED count + critique
    red_count = sum(1 for d in dimensions if d["score"] < 65)
    yellow_count = sum(1 for d in dimensions if 65 <= d["score"] < 85)
    green_count = sum(1 for d in dimensions if d["score"] >= 85)

    if grade.startswith("A"):
        headline = f"Solid ship — {grade}. But solid means continue investing where the yellow dimensions sit; the gap between A and A+ is whatever's still yellow."
    elif grade.startswith("B"):
        headline = f"Acceptable for a solo founder with AI help — {grade}. But {yellow_count} yellow dimensions are sitting on technical debt the next refactor will compound on. Don't celebrate B+; treat it as a starting line."
    elif grade.startswith("C"):
        headline = f"Below the bar for production-ready SaaS — {grade}. {red_count} RED dimensions block shipping with confidence. Solo founders die here if they don't course-correct."
    else:
        headline = f"Major rework needed — {grade}. {red_count} RED + {yellow_count} yellow dimensions. The compounding cost of leaving this is higher than the cost of fixing now."

    verdict_points = []
    for d in dimensions:
        if d["score"] < 65:
            verdict_points.append(f"RED ({d['name']}, {d['score']}): {d['honest']}")
    for d in dimensions:
        if 65 <= d["score"] < 75 and len(verdict_points) < 5:
            verdict_points.append(f"yellow ({d['name']}, {d['score']}): {d['honest']}")

    findings_count = len(critique["findings"]) if critique else 0
    if critique:
        sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in critique["findings"]:
            sev_counts[f["severity"]] = sev_counts.get(f["severity"], 0) + 1
        findings_breakdown = f"{sev_counts['critical']}c / {sev_counts['high']}h / {sev_counts['medium']}m / {sev_counts['low']}l"
    else:
        findings_breakdown = "no critique recorded"

    # Render markdown body to HTML
    body_html = ""
    try:
        import markdown
        body_html = markdown.markdown(
            text,
            extensions=["fenced_code", "tables", "nl2br"],
            output_format="html5",
        )
    except ImportError:
        from html import escape
        body_html = f"<pre>{escape(text)}</pre>"

    return {
        "date": date,
        "title": title,
        "grade": grade,
        "score": score,
        "delta": delta,
        "ships_shipped": ships,
        "commits": commits,
        "runtime": runtime,
        "source_file": str(md_path.relative_to(ROOT)).replace("\\", "/"),
        "dimensions": dimensions,
        "critique": critique,
        "findings_count": findings_count,
        "findings_breakdown": findings_breakdown,
        "verdict": {
            "headline": headline,
            "points": verdict_points,
        },
        "summary_counts": {
            "green": green_count,
            "yellow": yellow_count,
            "red": red_count,
        },
        "body_html": body_html,
    }


def emit_detail_page(slug: str, payload: dict) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{slug}.html"

    if not TEMPLATE.exists():
        print(f"[regen-session-detail] FATAL: template missing: {TEMPLATE}", file=sys.stderr)
        return out_path

    template_html = TEMPLATE.read_text(encoding="utf-8")
    new_block = json.dumps(payload, indent=2, ensure_ascii=False)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_block + m.group(3),
        template_html,
        count=1,
    )
    if count == 0:
        print(f"[regen-session-detail] FATAL: report-data block not found in template", file=sys.stderr)
        return out_path
    out_path.write_text(new_html, encoding="utf-8")
    return out_path


def main() -> int:
    summaries = sorted(STATE.glob("session-summary-*.md"))
    if not summaries:
        print("[regen-session-detail] no session summaries found")
        return 0

    written = 0
    for md_path in summaries:
        try:
            payload = parse_session(md_path)
            slug = slugify_date(md_path.stem)
            out_path = emit_detail_page(slug, payload)
            written += 1
            print(f"[regen-session-detail] OK   {out_path.name} grade={payload['grade']} dims={len(payload['dimensions'])}")
        except Exception as e:
            print(f"[regen-session-detail] FAIL {md_path.name}: {e}", file=sys.stderr)
    print(f"[regen-session-detail] wrote {written} detail pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
