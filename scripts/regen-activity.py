#!/usr/bin/env python
"""
Regenerate docs/reports/activity.html via data-block swap.

BUG-3 fix (2026-05-16): activity.html had hand-written inline JSON with
1 handoff entry, never auto-updating. This script scans REAL activity
sources and rebuilds the data block:

  - .claude/state/handoffs/**/*.md          (formal handoff files)
  - git log (recent commits, last 14 days)  (real-world activity)
  - .claude/state/telemetry/events/*.ndjson (ship.complete, session
                                             summaries, cron telemetry)

Activity page schema (existing):

    {
      "handoffs": [{id, from_agent, to_agent, created_at, cycle_id,
                    ship_id, scope_completed[], scope_remaining[],
                    next_action, blockers, context_required[],
                    scenario}],
      "agents":  [list of distinct agents seen],
      "ships":   [list of distinct ships seen]
    }

Producer-side notes:
  - This script DOES NOT modify telemetry events or handoff files
    themselves — pure read-only aggregation into the activity HTML.
  - Wired into .husky/post-commit hook so the page stays fresh on
    every commit (alongside the dashboard regen pipeline).
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ACTIVITY_HTML = ROOT / "docs" / "reports" / "activity.html"
HANDOFFS_DIR = ROOT / ".claude" / "state" / "handoffs"
TELEMETRY_DIR = ROOT / ".claude" / "state" / "telemetry" / "events"

REPORT_DATA_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

# Activity from commits: keep last 14 days to support the page's "30d" filter.
COMMIT_WINDOW_DAYS = 14
# Telemetry events: same window. Newer events are more relevant.
TELEMETRY_WINDOW_DAYS = 14


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_handoff(md_path: Path):
    """A handoff file is markdown with a JSON-fenced frontmatter block
    delimited by `---` lines. Return the parsed JSON or None on parse
    failure."""
    try:
        text = md_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    m = re.match(r"---\s*\n(\{.*?\})\s*\n---", text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def scan_handoffs():
    """Walk the handoffs/ tree and parse every *.md handoff file."""
    out = []
    if not HANDOFFS_DIR.exists():
        return out
    for md in HANDOFFS_DIR.rglob("*.md"):
        h = parse_handoff(md)
        if not h:
            continue
        # Tolerate missing fields — handoff schema is fluid across scenarios.
        h.setdefault("blockers", "none")
        h.setdefault("scope_completed", [])
        h.setdefault("scope_remaining", [])
        h.setdefault("context_required", [])
        h.setdefault("next_action", "")
        if not h.get("created_at"):
            try:
                mtime = datetime.fromtimestamp(md.stat().st_mtime, tz=timezone.utc)
                h["created_at"] = iso_utc(mtime)
            except OSError:
                continue
        if not h.get("scenario"):
            h["scenario"] = md.parent.name or "uncategorized"
        out.append(h)
    return out


def scan_commits():
    """Recent commits → synthetic handoff entries. Commits ARE activity;
    the activity page is the natural place to see them on a timeline."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=COMMIT_WINDOW_DAYS)
    cutoff_iso = cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        proc = subprocess.run(
            [
                "git",
                "log",
                f"--since={cutoff_iso}",
                "--pretty=format:%H|%aI|%an|%s",
                "--no-merges",
            ],
            capture_output=True,
            text=True,
            check=True,
            cwd=str(ROOT),
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    out = []
    for line in proc.stdout.splitlines():
        parts = line.split("|", 3)
        if len(parts) != 4:
            continue
        sha, ts_iso, author, subject = parts
        # Map commit subject prefix → scenario for filter chips.
        subj_lower = subject.lower()
        if subj_lower.startswith("cron("):
            scenario = "cron-routine-regen"
            ship_id = "cron"
        elif subj_lower.startswith("amd-") or re.search(r"\bAMD-\d{3}", subject):
            scenario = "amendment-applied"
            m = re.search(r"\bAMD-\d{3,}", subject)
            ship_id = m.group(0) if m else "amendment"
        elif subj_lower.startswith("prop-") or re.search(r"\bPROP-\d{3}", subject):
            scenario = "proposal-applied"
            m = re.search(r"\bPROP-\d{3,}", subject)
            ship_id = m.group(0) if m else "proposal"
        elif subj_lower.startswith("feat(") or subj_lower.startswith("fix("):
            scenario = "code-ship"
            m = re.match(r"^(feat|fix)\(([^)]+)\)", subj_lower)
            ship_id = m.group(2) if m else "code"
        elif subj_lower.startswith("docs(") or subj_lower.startswith("chore("):
            scenario = "doc-or-chore"
            m = re.match(r"^(docs|chore)\(([^)]+)\)", subj_lower)
            ship_id = m.group(2) if m else "doc"
        elif "goal" in subj_lower or "closure" in subj_lower:
            scenario = "goal-event"
            ship_id = "goal"
        else:
            scenario = "commit"
            ship_id = "main"
        author_agent = "git-author/" + (author or "unknown")
        out.append(
            {
                "id": f"commit-{sha[:12]}",
                "from_agent": author_agent,
                "to_agent": "PARBAUGHS-main",
                "created_at": ts_iso,
                "cycle_id": "git-commit-stream",
                "ship_id": ship_id,
                "scope_completed": [subject[:280]],
                "scope_remaining": [],
                "next_action": "",
                "blockers": "none",
                "context_required": [f"git show {sha[:12]}"],
                "scenario": scenario,
            }
        )
    return out


def scan_telemetry_events():
    """Pull ship.complete + session.team-work.summary events from the last
    TELEMETRY_WINDOW_DAYS into handoff-shaped entries."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=TELEMETRY_WINDOW_DAYS)
    out = []
    if not TELEMETRY_DIR.exists():
        return out
    # Phase B (session 3, 2026-05-19 — Founder reported session 2's 31 ship
    # commits did NOT appear in activity feed). Root cause: 1722 cron
    # telemetry events flooded the 500-entry cap, crowding out 619 actual
    # commits. Per P10 (Actionable Surfacing): cron heartbeats are NOT
    # actionable — they belong on a cron-health surface, not the activity
    # feed. Filter out cron.*.end / cron.*.start events. Ship.complete +
    # session.team-work.summary are the actionable telemetry types.
    interesting_types = {
        "ship.complete",
        "session.team-work.summary",
        # cron.* heartbeats removed 2026-05-19 — they were 1722 of 2342
        # telemetry events, flooding the activity feed with no Founder
        # value. Re-add only if cron health needs its own surface AND a
        # dedicated cap.
    }
    for ndjson_file in sorted(TELEMETRY_DIR.glob("*.ndjson")):
        # Filename guard: filename includes date, skip files older than cutoff.
        try:
            file_date = datetime.strptime(ndjson_file.stem, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
            if file_date < cutoff - timedelta(days=1):
                continue
        except ValueError:
            pass
        try:
            for line in ndjson_file.read_text(encoding="utf-8", errors="replace").splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    ev = json.loads(line)
                except json.JSONDecodeError:
                    continue
                et = ev.get("event_type")
                if et not in interesting_types:
                    continue
                ts = ev.get("timestamp") or ev.get("ts") or ev.get("created_at")
                if not ts:
                    continue
                try:
                    ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    continue
                if ts_dt < cutoff:
                    continue
                data = ev.get("data") or {}
                ship_id = (
                    data.get("ship_id")
                    or data.get("cron_source")
                    or "telemetry"
                )
                agent = ev.get("agent") or data.get("agent") or "telemetry-emitter"
                summary_bits = []
                for k in ("scope_completed", "scope_summary", "result", "outcome", "data_source"):
                    v = data.get(k)
                    if v:
                        if isinstance(v, list):
                            summary_bits.extend([str(x) for x in v])
                        else:
                            summary_bits.append(str(v))
                if not summary_bits:
                    summary_bits.append(et)
                out.append(
                    {
                        "id": f"telem-{et}-{ts_dt.strftime('%Y%m%dT%H%M%S')}-{ship_id[:24]}",
                        "from_agent": agent,
                        "to_agent": "telemetry-stream",
                        "created_at": iso_utc(ts_dt),
                        "cycle_id": data.get("cycle_id") or "telemetry-cycle",
                        "ship_id": ship_id,
                        "scope_completed": summary_bits[:6],
                        "scope_remaining": [],
                        "next_action": "",
                        "blockers": "none",
                        "context_required": [],
                        "scenario": et,
                    }
                )
        except OSError:
            continue
    return out


def dedupe(entries):
    seen = set()
    out = []
    for e in entries:
        eid = e.get("id")
        if not eid or eid in seen:
            continue
        seen.add(eid)
        out.append(e)
    return out


def compose_payload():
    """Build the activity data block. Priority: handoffs (formal) >
    telemetry events (machine-emitted) > git commits (manual/cron). De-dup
    by id, sort by created_at desc, cap at 500 entries to keep the page
    snappy."""
    items = dedupe(scan_handoffs() + scan_telemetry_events() + scan_commits())
    # Phase B (session 3, 2026-05-19): mixed-timezone string sort was
    # ordering events incorrectly. Commits use `-04:00` offset (EDT) while
    # telemetry uses `Z` UTC. String comparison treats "2026-05-18T22:25-04:00"
    # < "2026-05-19T02:25Z" even though they're the SAME absolute moment —
    # the telemetry event sorted ABOVE today's commits, hiding session-3
    # ship commits below the top-of-feed. Normalize to UTC-aware datetimes
    # before comparing. Per AMD-026 P10: ship commits must be visible at
    # the top of the feed for Founder to verify session work AS IT LANDS.
    def _sort_key(e):
        ts = e.get("created_at", "")
        if not ts:
            return datetime.min.replace(tzinfo=timezone.utc)
        try:
            # Handle Z suffix
            iso = ts.replace("Z", "+00:00") if ts.endswith("Z") else ts
            return datetime.fromisoformat(iso).astimezone(timezone.utc)
        except (ValueError, TypeError):
            return datetime.min.replace(tzinfo=timezone.utc)
    items.sort(key=_sort_key, reverse=True)
    items = items[:500]

    agents = sorted({
        a
        for e in items
        for a in (e.get("from_agent"), e.get("to_agent"))
        if a
    })
    ships = sorted({e.get("ship_id") for e in items if e.get("ship_id")})
    return {
        "schema_version": 2,
        "generated_at": iso_utc(datetime.now(timezone.utc)),
        "generator": "scripts/regen-activity.py",
        "handoffs": items,
        "agents": agents,
        "ships": ships,
        "_counts": {
            "handoffs_total": len(items),
            "from_handoff_files": len(scan_handoffs()),
            "from_telemetry": len(scan_telemetry_events()),
            "from_commits": len(scan_commits()),
        },
    }


def regen():
    if not ACTIVITY_HTML.exists():
        print(f"[regen-activity] FATAL: {ACTIVITY_HTML} not found", file=sys.stderr)
        return 2
    payload = compose_payload()
    html = ACTIVITY_HTML.read_text(encoding="utf-8")
    new_block = json.dumps(payload, indent=2)
    new_html, n = REPORT_DATA_RE.subn(
        lambda m: m.group(1) + new_block + m.group(3),
        html,
        count=1,
    )
    if n != 1:
        print(
            "[regen-activity] FATAL: <script id=\"report-data\"> anchor not found",
            file=sys.stderr,
        )
        return 3
    ACTIVITY_HTML.write_text(new_html, encoding="utf-8")
    c = payload["_counts"]
    print(
        f"[regen-activity] OK   activity.html — total={c['handoffs_total']} "
        f"(handoffs={c['from_handoff_files']} telemetry={c['from_telemetry']} "
        f"commits={c['from_commits']})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(regen())
