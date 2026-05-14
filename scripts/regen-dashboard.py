#!/usr/bin/env python3
"""
Regenerate docs/reports/dashboard.html via data-block swap (P18 operational
view discipline). Reads `.claude/state/telemetry/aggregates/current-snapshot.json`
plus the real-state directories.

F2 deliverable. Mirrors scripts/dry-run-regen-ops-views.py pattern.

Usage:
    # Run aggregator first (or pass --no-aggregate if snapshot is already current)
    python scripts/aggregate-telemetry.py
    python scripts/regen-dashboard.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"
SNAPSHOT = STATE / "telemetry" / "aggregates" / "current-snapshot.json"
DASHBOARD = REPORTS / "dashboard.html"
LAST_VISIT = STATE / "founder" / "last-visit.json"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

FOLDER_TO_SCENARIO = {
    "cycle-to-cycle":      "cycle-to-cycle",
    "agent-to-agent":      "agent-to-agent",
    "subagent-returns":    "subagent-to-parent",
    "dispatches":          "parent-to-subagent",
    "proactive-to-ship":   "proactive-to-ship",
    "halts":               "halt-to-resume",
    "founder-responses":   "founder-to-agent",
    "discussion-bubbles":  "discussion-bubble-to-caller",
    "cross-ship":          "cross-ship",
    "wave-to-wave":        "wave-to-wave",
    "wave-transitions":    "wave-to-wave",
    "parallel-merge":      "parallel-merge",
}


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def recent_handoffs():
    """Founder directive 2026-05-14 "DASHBOARD DATA PIPELINE BROKEN":
    legacy source (.claude/state/handoffs/<scenario>/*.md) is sparsely
    written — only 1 entry surfaced despite 2 days of active substrate
    work. Extended to also mine git history for substrate activity
    (ship-close commits, cron auto-commits, watcher applies). Markdown
    handoffs preserved when present; commits surface the rest of the
    activity."""
    out = []
    handoffs_dir = STATE / "handoffs"
    if handoffs_dir.exists():
        for folder in sorted(handoffs_dir.iterdir()):
            if not folder.is_dir():
                continue
            scenario = FOLDER_TO_SCENARIO.get(folder.name)
            if scenario is None:
                continue
            for f in sorted(folder.rglob("*.md")):
                data = read_frontmatter(f)
                if data is None:
                    continue
                out.append({
                    "scenario": scenario,
                    "from": data.get("from_agent"),
                    "to": data.get("to_agent"),
                    "created_at": data.get("created_at"),
                })

    # Mine git history for recent substrate activity (last 48h, cap 10)
    try:
        import subprocess
        r = subprocess.run(
            ["git", "log", "--pretty=%cI%x09%s%x09%an", "--since=2.days"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=15, check=False,
        )
        for line in (r.stdout or "").splitlines()[:15]:
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            cdate, subject, author = parts[0], parts[1], parts[2]
            if re.search(r"^cron\(routine\)|^Apply governance amendments|^Apply escalation|^Apply ", subject):
                scenario = "cron-auto-commit"
                from_agent = "cron"
                to_agent = author
            elif re.search(r"Shipped (PROP|AMD)-|^W\d+\.[SIMm]", subject):
                scenario = "ship-close"
                from_agent = "engineer"
                to_agent = "founder"
            else:
                scenario = "team-commit"
                from_agent = author
                to_agent = "main"
            out.append({
                "scenario": scenario,
                "from": from_agent,
                "to": to_agent,
                "created_at": cdate,
                "subject": subject[:80],
            })
    except (OSError, subprocess.SubprocessError):
        pass

    out.sort(key=lambda h: h.get("created_at") or "", reverse=True)
    return out[:10]


def proposals_pending_count():
    d = STATE / "proposals" / "pending"
    if not d.exists():
        return 0
    return sum(1 for f in d.iterdir() if f.name.endswith(".md"))


def proposals_state_counts():
    """Return counts across all 5 proposal states (per PROPOSAL_LIFECYCLE_v8.2)."""
    out = {"pending": 0, "approved": 0, "deferred": 0, "shipped": 0, "rejected": 0}
    for k in out:
        d = STATE / "proposals" / k
        if d.exists():
            out[k] = sum(1 for f in d.iterdir() if f.name.endswith(".md"))
    out["shipped_total"]  = out["shipped"]
    out["rejected_total"] = out["rejected"]
    return out


def amendments_state_counts():
    """Return counts across all 5 amendment states (mirror proposals lifecycle)."""
    out = {"pending": 0, "approved": 0, "deferred": 0, "applied": 0, "rejected": 0}
    for k in out:
        d = STATE / "amendments" / k
        if d.exists():
            out[k] = sum(1 for f in d.iterdir() if f.name.startswith("AMD-") and f.name.endswith(".md"))
    out["applied_total"]  = out["applied"]
    out["rejected_total"] = out["rejected"]
    return out


def count_bubbles_flagged_for_founder():
    """AMD-007 P18.6: count discussion bubbles where frontmatter says
    flagged_for_founder=true OR status='open' AND quorum-met."""
    d = STATE / "discussion-bubbles"
    if not d.exists():
        return 0
    n = 0
    for f in d.glob("*.md"):
        fm = read_frontmatter(f)
        if fm and fm.get("flagged_for_founder"):
            n += 1
    return n


_PROPOSED_ANSWER_HEADINGS = re.compile(
    r"^##\s+(?:Team's recommendation|Recommendation|Team recommendation|Proposed answer)\b",
    re.IGNORECASE | re.MULTILINE,
)
_NEXT_H2 = re.compile(r"^##\s+", re.MULTILINE)
_DECISION_FORM = re.compile(
    r"^##\s+(?:Founder gate|Decisions? required|Open questions for Founder)\b",
    re.IGNORECASE | re.MULTILINE,
)


def _extract_section(text: str, start_match):
    """Return the body of a markdown section that starts at start_match,
    truncated at the next H2 (or end-of-file). Strip leading/trailing
    whitespace. Cap at 1500 chars so the dashboard payload stays bounded."""
    if not start_match:
        return ""
    body_start = start_match.end()
    next_match = _NEXT_H2.search(text, body_start)
    body_end = next_match.start() if next_match else len(text)
    body = text[body_start:body_end].strip()
    if len(body) > 1500:
        body = body[:1500].rstrip() + "…"
    return body


def _read_proposed_answer(source_path: Path):
    """Read a markdown file and extract the team's proposed answer +
    decision form. Returns dict with 'proposed_answer' (text) +
    'decision_form' (text) keys; empty strings when sections absent.
    Returns the full file's first 1500 chars as 'proposed_answer' fallback
    if no recognized heading found (so something useful surfaces)."""
    if not source_path.exists():
        return {"proposed_answer": "", "decision_form": "", "source_missing": True}
    try:
        text = source_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return {"proposed_answer": "", "decision_form": "", "source_missing": True}

    proposed = _extract_section(text, _PROPOSED_ANSWER_HEADINGS.search(text))
    form = _extract_section(text, _DECISION_FORM.search(text))

    if not proposed:
        # No recognized heading; fall back to the first H2 section body
        # (post-frontmatter) so something useful surfaces. Cap at 1500.
        body_only = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.DOTALL)
        first_h2 = _NEXT_H2.search(body_only)
        if first_h2:
            after = body_only[first_h2.end():]
            next_h2 = _NEXT_H2.search(after)
            proposed = after[:next_h2.start()].strip() if next_h2 else after.strip()
            if len(proposed) > 1500:
                proposed = proposed[:1500].rstrip() + "…"

    return {"proposed_answer": proposed, "decision_form": form, "source_missing": False}


def _read_yaml_frontmatter(path: Path):
    """Parse YAML frontmatter from a markdown file. Returns dict or None.
    Lightweight pyyaml-free parser sufficient for the escalations schema
    (top-level scalars, lists, and simple nested objects)."""
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
    # Try pyyaml if available; fall back to a tiny ad-hoc parser otherwise.
    try:
        import yaml  # type: ignore
        return yaml.safe_load(raw)
    except ImportError:
        pass

    out = {}
    lines = raw.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            i += 1
            continue
        # key: value | OR | key: |
        m2 = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if m2:
            key, val = m2.group(1), m2.group(2)
            if val == "|" or val == "":
                # Multiline block scalar or empty -> consume indented lines
                i += 1
                buf = []
                while i < len(lines) and (lines[i].startswith("  ") or lines[i].strip() == ""):
                    if lines[i].startswith("  "):
                        buf.append(lines[i][2:])
                    elif lines[i].strip() == "":
                        buf.append("")
                    i += 1
                # If this looks like a list (lines starting with "- ")
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
                            # Parse item — if it has key: value form, dict; else scalar
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
                continue
            else:
                # Inline value
                v = val.strip()
                # Strip quotes
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1]
                # Bool / null / number
                if v.lower() == "true": v = True
                elif v.lower() == "false": v = False
                elif v.lower() in ("null", "none", "~"): v = None
                elif re.match(r"^-?\d+$", v): v = int(v)
                out[key] = v
        i += 1
    return out


def list_open_phase_escalations():
    """Founder directive 2026-05-14 (escalations lifecycle): canonical source
    is now .claude/state/escalations/pending/ — frontmatter per ESC-NNN schema.
    Each pending escalation surfaces on dashboard.html with the team's
    proposed answer + decision options.

    Back-compat: also reads any lingering entries in
    .claude/state/founder/review-queue.json's open_escalations (kept empty
    going forward but preserved for tooling that hasn't migrated yet).
    """
    out = []
    now_utc = datetime.now(timezone.utc)

    # Canonical source: state directory
    esc_dir = STATE / "escalations" / "pending"
    if esc_dir.exists():
        for f in sorted(esc_dir.glob("ESC-*.md")):
            fm = _read_yaml_frontmatter(f)
            if not fm:
                continue
            try:
                authored_iso = fm.get("authored_at") or ""
                authored_dt = datetime.fromisoformat(authored_iso.replace("Z", "+00:00")) if authored_iso else None
                age_days = round((now_utc - authored_dt).total_seconds() / 86400.0, 2) if authored_dt else None
            except (ValueError, TypeError):
                age_days = None
            window_hours = fm.get("default_window_hours") or 24
            stale_threshold_days = (float(window_hours) if isinstance(window_hours, (int, float)) else 24.0) / 24.0
            out.append({
                "id": fm.get("id"),
                "title": fm.get("title"),
                "type": fm.get("type"),
                "question": fm.get("question"),
                "summary": fm.get("context_summary"),
                "proposed_answer": fm.get("proposed_answer"),
                "rationale": fm.get("rationale"),
                "options": fm.get("options") or [],
                "default_if_no_response": fm.get("default_if_no_response"),
                "default_window_hours": fm.get("default_window_hours"),
                "blocks_ship": bool(fm.get("blocks_ship")),
                "estimated_decision_complexity": fm.get("estimated_decision_complexity"),
                "source_artifact_paths": fm.get("source_artifact_paths") or [],
                "authored_at": fm.get("authored_at"),
                "authored_by": fm.get("authored_by"),
                "link": f"escalations.html#{fm.get('id')}",
                "source_file": str(f.relative_to(ROOT)).replace("\\", "/"),
                "age_days": age_days,
                "stale": (age_days is not None and age_days > stale_threshold_days),
            })

    # Back-compat: legacy stub entries (kept empty going forward)
    p = STATE / "founder" / "review-queue.json"
    if p.exists():
        try:
            stub = json.loads(p.read_text(encoding="utf-8"))
            gov = stub.get("governance_gates", {}) or {}
            raw = gov.get("open_escalations", []) or []
            for e in raw:
                # Skip entries already covered by state-dir
                if any(o.get("id") == e.get("id") for o in out):
                    continue
                out.append({
                    "id": e.get("id"),
                    "type": e.get("type"),
                    "summary": e.get("summary"),
                    "link": e.get("link") or "",
                    "_source": "legacy-stub",
                })
        except (OSError, json.JSONDecodeError):
            pass

    return out


def read_health_banner(name: str):
    """Read .claude/state/aggregates/<name>-health.json (written by
    specialist agents — Test/QA at Terminal 4, Security/Compliance at
    Terminal 5). Returns a normalized dict for dashboard rendering.

    Tolerant by design: missing file → status="missing"; malformed JSON
    → status="error"; stale (as_of >24h) → status="unknown" with stale
    flag. Never raises — dashboard renders gracefully no matter what
    state the source agents are in.

    See .claude/state/aggregates/README.md for the schema.
    """
    path = STATE / "aggregates" / f"{name}-health.json"
    if not path.exists():
        return {
            "available": False,
            "status": "missing",
            "summary": f"no {name}-health.json — source agent not yet writing",
            "as_of": None,
            "stale": False,
            "age_hours": None,
            "counts": {},
            "details": [],
            "links": [],
            "source_path": str(path.relative_to(ROOT)).replace("\\", "/"),
        }
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as exc:
        return {
            "available": False,
            "status": "error",
            "summary": f"failed to read {path.name}: {exc.__class__.__name__}",
            "as_of": None,
            "stale": False,
            "age_hours": None,
            "counts": {},
            "details": [],
            "links": [],
            "source_path": str(path.relative_to(ROOT)).replace("\\", "/"),
        }
    if not isinstance(data, dict):
        return {
            "available": False,
            "status": "error",
            "summary": f"{path.name} did not contain a JSON object",
            "as_of": None,
            "stale": False,
            "age_hours": None,
            "counts": {},
            "details": [],
            "links": [],
            "source_path": str(path.relative_to(ROOT)).replace("\\", "/"),
        }

    now_utc = datetime.now(timezone.utc)
    # Accept either `as_of` (my spec) or `timestamp` (Test/QA + Security
    # agents' own convention). Both are ISO-8601 UTC.
    as_of_raw = data.get("as_of") or data.get("timestamp")
    age_hours = None
    stale = False
    if as_of_raw:
        try:
            as_of_dt = datetime.fromisoformat(str(as_of_raw).replace("Z", "+00:00"))
            age_hours = round((now_utc - as_of_dt).total_seconds() / 3600.0, 2)
            stale = age_hours > 24
        except (ValueError, TypeError):
            pass

    status_raw = data.get("status") or "unknown"
    # Override status to "unknown" when stale so a long-dead green banner doesn't
    # silently misrepresent the system.
    effective_status = "unknown" if stale else status_raw

    # Summary — accept `summary` (my spec) OR `status_reason` (Security agent)
    # OR build a synthetic summary from check counts (Test/QA agent has no
    # single summary string but has descriptive count fields).
    summary = data.get("summary") or data.get("status_reason") or ""
    if not summary:
        # Synthesize from known shapes
        if "checks_run" in data:
            parts = []
            passed = data.get("checks_passed")
            run = data.get("checks_run")
            if isinstance(run, int) and isinstance(passed, int):
                parts.append(f"{passed}/{run} checks passing")
            skipped = data.get("checks_skipped")
            if isinstance(skipped, int) and skipped > 0:
                parts.append(f"{skipped} skipped")
            known_fail = data.get("checks_with_known_failure")
            if isinstance(known_fail, int) and known_fail > 0:
                parts.append(f"{known_fail} known failure" + ("s" if known_fail != 1 else ""))
            regressions = data.get("regressions") or []
            if isinstance(regressions, list) and regressions:
                parts.append(f"{len(regressions)} regression" + ("s" if len(regressions) != 1 else ""))
            summary = " · ".join(parts) if parts else ""

    # Counts — prefer `counts` dict; fall back to `active_findings` (Security)
    # or build from individual `checks_*` numeric fields (Test/QA).
    counts = data.get("counts") or {}
    if not counts:
        if isinstance(data.get("active_findings"), dict):
            counts = {k: v for k, v in data["active_findings"].items() if isinstance(v, (int, float))}
        else:
            # Test/QA convention: top-level checks_* integers
            for k in ("checks_run", "checks_passed", "checks_failed",
                      "checks_skipped", "checks_with_known_failure"):
                v = data.get(k)
                if isinstance(v, (int, float)):
                    label = k.replace("checks_", "")
                    counts[label] = v

    # Details — prefer explicit `details` array; otherwise combine known
    # category arrays (known_failures + regressions for Test/QA, vulnerable_deps
    # + credential_leaks for Security). Each item is preserved with a `category`
    # tag so the dashboard can render heterogeneous rows cleanly.
    details = list(data.get("details") or [])
    if not details:
        for key in ("known_failures", "regressions", "vulnerable_deps",
                    "credential_leaks", "findings", "issues"):
            arr = data.get(key)
            if not isinstance(arr, list):
                continue
            for item in arr:
                if isinstance(item, dict):
                    row = dict(item)
                    row.setdefault("category", key)
                    details.append(row)
                elif item is not None:
                    details.append({"category": key, "name": str(item)})

    return {
        "available": True,
        "status": effective_status,
        "raw_status": status_raw,
        "summary": summary,
        "as_of": as_of_raw,
        "stale": stale,
        "age_hours": age_hours,
        "counts": counts,
        "details": details,
        "links": data.get("links") or [],
        "schema_version": data.get("schema_version"),
        "head_sha": data.get("head_sha") or data.get("head_short"),
        "source_path": str(path.relative_to(ROOT)).replace("\\", "/"),
    }


def cron_last_fire_map():
    """AMD-007 P18.6: most-recent log per cron name. Filename pattern
    `<isoZ>-<cron-name>.log` per scripts/cron/logs/."""
    d = ROOT / "scripts" / "cron" / "logs"
    if not d.exists():
        return {}
    out = {}
    for f in sorted(d.glob("*.log")):
        m = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-(.+)\.log$", f.name)
        if not m:
            continue
        ts, name = m.group(1), m.group(2)
        if name not in out or ts > out[name]["last_run"]:
            out[name] = {"last_run": ts, "last_log": f.name}
    return out


def last_regen_all_status():
    """Founder directive 2026-05-14 "DASHBOARD FIDELITY" item 1: real
    timestamp from regen-all heartbeat file written at every successful
    pass. Falls back to maintenance log marker only if heartbeat absent
    (transitional). Returns structured dict for dashboard surfacing:
        - ts: human-readable timestamp
        - ts_iso: ISO-8601 UTC
        - status: PASS / STALE / UNKNOWN
        - age_minutes: minutes since last pass
        - source: heartbeat / maintenance-log / none
    """
    heartbeat = STATE / "heartbeats" / "regen-all-last-pass.json"
    now_utc = datetime.now(timezone.utc)
    if heartbeat.exists():
        try:
            # utf-8-sig strips the BOM that PowerShell Set-Content -Encoding utf8
            # writes; without this, json.loads fails on the BOM byte and we
            # silently fall through to the legacy maintenance-log path.
            data = json.loads(heartbeat.read_text(encoding="utf-8-sig"))
            iso = data.get("last_pass_at_utc") or ""
            ts_dt = datetime.fromisoformat(iso.replace("Z", "+00:00")) if iso else None
            age_min = round((now_utc - ts_dt).total_seconds() / 60.0, 1) if ts_dt else None
            # Stale threshold: 60 minutes (regen-all should run at least hourly
            # via maintenance cron + ad-hoc on ship-close commits).
            stale = age_min is not None and age_min > 60
            return {
                "ts": data.get("last_pass_at_human") or iso,
                "ts_iso": iso,
                "status": "STALE" if stale else "PASS",
                "age_minutes": age_min,
                "source": "heartbeat",
            }
        except (OSError, json.JSONDecodeError):
            pass

    # Legacy fallback: maintenance log marker (date-only precision)
    d = STATE / "cron"
    if d.exists():
        files = sorted(d.glob("maintenance-*.md"))
        if files:
            latest = files[-1]
            m = re.match(r"maintenance-(\d{4}-\d{2}-\d{2})", latest.name)
            return {
                "ts": m.group(1) if m else None,
                "ts_iso": None,
                "status": "PASS",
                "age_minutes": None,
                "source": "maintenance-log",
            }

    return {
        "ts": None,
        "ts_iso": None,
        "status": "UNKNOWN",
        "age_minutes": None,
        "source": "none",
    }


def working_tree_status():
    """Founder directive 2026-05-14 "DASHBOARD FIDELITY" item 2: actionable
    working-tree state. Combines git porcelain + watcher cadence telemetry.

    States:
      clean              - tree clean, autonomous work can proceed (green)
      dirty-cycling      - tree dirty but watcher firing within cadence (yellow)
      dirty-blocked      - tree dirty AND watcher silent/stale (red)
      watcher-silent     - watcher hasn't fired in >2x cadence (red)
      clean-no-watcher   - tree clean but watcher silent (yellow info)
    """
    import subprocess
    now_utc = datetime.now(timezone.utc)

    # Tree state
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        dirty_lines = [ln for ln in (result.stdout or "").splitlines() if ln.strip()]
        is_dirty = len(dirty_lines) > 0
        dirty_count = len(dirty_lines)
    except (OSError, subprocess.SubprocessError):
        return {
            "state": "unknown",
            "label": "unknown · git probe failed",
            "color": "var(--pb-warning)",
            "dirty_count": 0,
            "watcher_last_fire": None,
            "watcher_minutes_ago": None,
        }

    # Watcher cadence: scan today's telemetry for last cron.downloads-watcher.end
    last_watcher_dt = None
    events_dir = STATE / "telemetry" / "events"
    if events_dir.exists():
        for ndj in sorted(events_dir.glob("*.ndjson"), reverse=True)[:3]:
            try:
                with ndj.open("r", encoding="utf-8") as f:
                    for line in f:
                        if "cron.downloads-watcher.end" in line:
                            try:
                                evt = json.loads(line)
                                ts_str = evt.get("timestamp") or ""
                                if ts_str:
                                    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                                    if last_watcher_dt is None or dt > last_watcher_dt:
                                        last_watcher_dt = dt
                            except (json.JSONDecodeError, ValueError):
                                continue
            except OSError:
                continue
            if last_watcher_dt:
                break

    watcher_minutes_ago = None
    if last_watcher_dt:
        watcher_minutes_ago = round((now_utc - last_watcher_dt).total_seconds() / 60.0, 1)

    # Watcher cadence is 5 min; consider silent if >12 min (allowing one missed cycle + a beat)
    watcher_silent = (watcher_minutes_ago is None) or (watcher_minutes_ago > 12)

    if is_dirty and watcher_silent:
        state = "dirty-blocked"
        label = f"dirty ({dirty_count} files) · watcher silent · autonomous blocked"
        color = "var(--pb-error)"
    elif is_dirty:
        state = "dirty-cycling"
        label = f"dirty ({dirty_count} files) · watcher cycling"
        color = "var(--pb-warning)"
    elif watcher_silent:
        state = "clean-no-watcher"
        label = f"clean · watcher silent ({watcher_minutes_ago}min ago)" if watcher_minutes_ago is not None else "clean · watcher never fired"
        color = "var(--pb-warning)"
    else:
        state = "clean"
        label = f"clean · ready · watcher {watcher_minutes_ago}min ago"
        color = "var(--pb-success)"

    return {
        "state": state,
        "label": label,
        "color": color,
        "dirty_count": dirty_count,
        "watcher_last_fire": last_watcher_dt.isoformat() if last_watcher_dt else None,
        "watcher_minutes_ago": watcher_minutes_ago,
    }


def _query_scheduled_tasks_state():
    """Shell out to Get-ScheduledTask on Windows to discover which
    PARBAUGHS-* tasks are actually installed + their State. Returns
    a dict of {task_name: state_string}. Empty dict on non-Windows
    or if PowerShell is unavailable.

    Iter 11 (2026-05-14, Founder directive "CRON BANNER STALE STATE"):
    earlier implementation inferred install state from telemetry events
    alone, conflating "installed but unfired" (new install) with "not
    installed". This explicit OS query distinguishes the four real states:
    missing / installed-but-unfired / firing / stale.
    """
    import subprocess
    try:
        proc = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command",
             "Get-ScheduledTask | Where-Object TaskName -Like 'PARBAUGHS-*' | "
             "ForEach-Object { '{0}|{1}' -f $_.TaskName, $_.State }"],
            capture_output=True, text=True, timeout=10
        )
        if proc.returncode != 0:
            return {}
        out = {}
        for ln in (proc.stdout or "").splitlines():
            ln = ln.strip()
            if not ln or "|" not in ln:
                continue
            name, state = ln.split("|", 1)
            out[name.strip()] = state.strip()
        return out
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return {}


def cron_install_status():
    """Founder directive 2026-05-14 "DASHBOARD FIDELITY" + "CRON BANNER
    STALE STATE": detect which PARBAUGHS scheduled tasks are missing,
    newly-installed-but-unfired, firing normally, or stale.

    Iter 11 fix: shell out to Get-ScheduledTask to distinguish installed-
    but-unfired (benign, just-registered) from missing (real install
    needed). Falls back to telemetry-only inference if PowerShell is
    unavailable (e.g. CI environment).

    Four states:
      - missing: not installed (Get-ScheduledTask returned nothing)
        AND no recent telemetry events. SURFACE: requires install.
      - installed-but-unfired: Get-ScheduledTask shows it BUT no recent
        telemetry events yet. SURFACE: newly-installed benign label.
      - firing: telemetry event within 3× cadence.
      - stale: telemetry event but >3× cadence ago. SURFACE: stale warning.
    """
    crons = [
        {"name": "downloads-watcher",   "task_name": "PARBAUGHS-Downloads-Watcher",            "cadence_minutes": 5,       "install_script": "scripts/cron/install-downloads-watcher.ps1"},
        {"name": "maintenance",         "task_name": "PARBAUGHS-Daily-Maintenance",            "cadence_minutes": 1440,    "install_script": "scripts/cron/install-maintenance.ps1"},
        {"name": "overnight-triage",    "task_name": "PARBAUGHS-Overnight-Triage",             "cadence_minutes": 1440,    "install_script": "scripts/cron/install-overnight-triage.ps1"},
        {"name": "proposal-readiness",  "task_name": "PARBAUGHS-Proposal-Readiness-Scanner",   "cadence_minutes": 120,     "install_script": "scripts/cron/install-proposal-readiness-scanner.ps1"},
        {"name": "token-sidecar",       "task_name": "PARBAUGHS-Token-Sidecar",                "cadence_minutes": 5,       "install_script": "scripts/cron/install-sidecar.ps1"},
    ]

    os_state = _query_scheduled_tasks_state()

    now_utc = datetime.now(timezone.utc)
    events_dir = STATE / "telemetry" / "events"
    events_today = {}
    if events_dir.exists():
        for ndj in sorted(events_dir.glob("*.ndjson"), reverse=True)[:2]:
            try:
                with ndj.open("r", encoding="utf-8") as f:
                    for line in f:
                        for c in crons:
                            evt_marker = f'"cron.{c["name"]}.end"'
                            if evt_marker in line:
                                try:
                                    evt = json.loads(line)
                                    ts_str = evt.get("timestamp") or ""
                                    if ts_str:
                                        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                                        prev = events_today.get(c["name"])
                                        if prev is None or dt > prev:
                                            events_today[c["name"]] = dt
                                except (json.JSONDecodeError, ValueError):
                                    continue
            except OSError:
                continue

    out = []
    for c in crons:
        last_fire = events_today.get(c["name"])
        age_minutes = round((now_utc - last_fire).total_seconds() / 60.0, 1) if last_fire else None
        silent_threshold = c["cadence_minutes"] * 3
        is_installed = c["task_name"] in os_state
        os_task_state = os_state.get(c["task_name"], "")

        if age_minutes is None:
            # No telemetry events yet. Distinguish missing vs newly-installed.
            if is_installed:
                status = "installed-but-unfired"
                label = f"installed · State={os_task_state} · awaiting first fire (cadence {c['cadence_minutes']}min)"
            elif not os_state:
                # OS query returned nothing (probably non-Windows or PowerShell unavailable).
                # Fall back to telemetry-only inference: surface as missing-or-silent
                # since we cannot distinguish here.
                status = "missing-or-silent"
                label = "missing — no telemetry events found (OS query unavailable)"
            else:
                # OS query worked AND returned some tasks but not this one.
                status = "missing"
                label = "missing — not installed on this machine"
        elif age_minutes > silent_threshold:
            status = "stale"
            label = f"stale · last fire {age_minutes}min ago (cadence {c['cadence_minutes']}min)"
        else:
            status = "firing"
            label = f"firing · last fire {age_minutes}min ago"

        out.append({
            "name": c["name"],
            "task_name": c["task_name"],
            "cadence_minutes": c["cadence_minutes"],
            "install_script": c["install_script"],
            "last_fire_iso": last_fire.isoformat() if last_fire else None,
            "age_minutes": age_minutes,
            "status": status,
            "label": label,
            "os_state": os_task_state,
            "is_installed": is_installed,
        })
    return out


def working_tree_status_legacy():
    """Pre-2026-05-14 placeholder kept for any external readers; the live
    surface uses working_tree_status() (dict) defined below."""
    return "auto-clean (substrate-watcher managed)"


def active_halts():
    """AMD-007 P18.6: read .claude/state/halts/*.md. Each entry surfaces
    as {id, file} for the dashboard."""
    d = STATE / "halts"
    if not d.exists():
        return []
    return [
        {"id": f.stem, "file": str(f.relative_to(ROOT)).replace("\\", "/")}
        for f in sorted(d.glob("*.md"))
        if f.is_file()
    ]


def round_trip_last_pass_ts():
    """Founder directive 2026-05-14 DASHBOARD FIDELITY item 1: surface the
    ISO timestamp + human-readable form of the last round-trip pass."""
    info = last_regen_all_status()
    if not info:
        return None
    # Prefer ISO if present; fall back to human label
    return info.get("ts_iso") or info.get("ts")


def get_last_founder_visit():
    """AMD-007 P18.6: read founder/last-visit.json if present. Updated by
    the dashboard rendering when Founder explicitly marks reviewed."""
    if not LAST_VISIT.exists():
        return None
    try:
        return json.loads(LAST_VISIT.read_text(encoding="utf-8")).get("last_visit_ts")
    except (OSError, json.JSONDecodeError):
        return None


def _frontmatter_ts(fm: dict):
    """Pick the most-relevant timestamp from a frontmatter dict."""
    for k in ("shipped_at", "applied_at", "approved_at", "closed_at",
              "rejected_at", "created_at"):
        v = fm.get(k)
        if v:
            return v
    return ""


def _walk_state_dir_since(subdir: str, glob: str, since_ts):
    """Walk .claude/state/<subdir>/<glob>; return frontmatter entries with
    timestamp > since_ts (or all when since_ts is None)."""
    d = STATE / subdir
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob(glob)):
        fm = read_frontmatter(f)
        if not fm:
            continue
        ts = _frontmatter_ts(fm)
        if since_ts is None or (ts and ts > since_ts):
            out.append({
                "id": fm.get("id"),
                "title": fm.get("title") or fm.get("scope_summary", "(no title)")[:80],
                "ts": ts,
            })
    return out


def build_founder_queue():
    """AMD-007 P18.6 Founder Review Queue — surfaces governance gates +
    system health + activity-since-last-visit + exceptions in one block.
    Dashboard renders this at the top of the page; Critic asserts updates
    on every commit that creates a Founder-eyes item."""
    last_visit = get_last_founder_visit()
    cron_map = cron_last_fire_map()
    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "last_founder_visit": last_visit,
        "governance_gates": {
            "amendments_pending": amendments_state_counts().get("pending", 0),
            "amendments_link": "amendments.html",
            "bubbles_flagged": count_bubbles_flagged_for_founder(),
            "bubbles_link": "discussion-bubbles.html",
            "proposals_pending": proposals_pending_count(),
            "proposals_link": "proposals.html",
            "open_escalations": list_open_phase_escalations(),
        },
        "system_health": {
            "crons": cron_map,
            "cron_install_status": cron_install_status(),
            "last_regen_all": last_regen_all_status(),
            "working_tree": working_tree_status(),
            "halts": active_halts(),
            "round_trip_last_pass": round_trip_last_pass_ts(),
            # Cross-agent health banners (Founder directive 2026-05-14
            # "TWO NEW SESSIONS"). Files written by specialist agents
            # at .claude/state/aggregates/{test,security}-health.json.
            # Dashboard health agent reads + renders; does not write.
            "test_health": read_health_banner("test"),
            "security_health": read_health_banner("security"),
        },
        "activity_since_last_visit": {
            "_note": "Counts since last_founder_visit (null = since-forever)",
            "ships_closed": _walk_state_dir_since("proposals/shipped", "PROP-*.md", last_visit)[:20],
            "amendments_applied": _walk_state_dir_since("amendments/applied", "AMD-*.md", last_visit)[:20],
            "proposals_pending_new": _walk_state_dir_since("proposals/pending", "PROP-*.md", last_visit),
        },
        "exceptions": [],
    }


def build_dashboard_data():
    if not SNAPSHOT.exists():
        sys.stderr.write(f"[regen-dashboard] FATAL snapshot missing: {SNAPSHOT}\n"
                         f"  Run: python scripts/aggregate-telemetry.py\n")
        sys.exit(2)
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    pc = proposals_state_counts()
    ac = amendments_state_counts()
    return {
        "weekly_tokens": snap.get("weekly_tokens", 0),
        "weekly_cost": snap.get("weekly_cost", 0.0),
        "ships_this_week": snap.get("ships_this_week", 0),
        "proposals_pending": pc["pending"],
        "proposals_counts": pc,
        "amendments_counts": ac,
        "halts_this_week": snap.get("halts_this_week", 0),
        "fiq_depth": snap.get("fiq_depth", 0),
        # Phase 6.6: no fictional cap. Real quota % comes from manual paste.
        "manual_quota_latest": snap.get("manual_quota_latest"),
        "tokens_by_role": snap.get("tokens_by_role", {"labels": [], "values": []}),
        "token_trend_7d": snap.get("token_trend_7d", {"labels": [], "values": []}),
        "cycle_outcomes_7d": snap.get("cycle_outcomes_7d", {"labels": [], "datasets": []}),
        # Founder directive 2026-05-14 DASHBOARD VIZ — wire these trend
        # arrays into the dashboard data block so the 7-day table renders
        # real handoffs/ships/bubbles per-day counts instead of dashes.
        "ships_trend_7d":    snap.get("ships_trend_7d",    {"labels": [], "values": []}),
        "handoffs_trend_7d": snap.get("handoffs_trend_7d", {"labels": [], "values": []}),
        "bubbles_trend_7d":  snap.get("bubbles_trend_7d",  {"labels": [], "values": []}),
        "recent_handoffs": recent_handoffs(),
        "recent_ships": snap.get("recent_ships", []),
        "_meter_status": snap.get("_meter_status", "unknown"),
        "_meter_note": snap.get("_meter_note", ""),
        "_aggregate_counts": snap.get("_aggregate_counts", {}),
        # PROP-003.b: surface the quota_status block so dashboard.html can
        # render live/stale/empty/absent state for the meter widget.
        "quota_status": snap.get("quota_status"),
        # AMD-007 P18.6: Founder Review Queue.
        "founder_queue": build_founder_queue(),
    }


def swap_data_block(html_path: Path, new_data: dict):
    if not html_path.exists():
        return False, f"file missing: {html_path}"
    html = html_path.read_text(encoding="utf-8")
    new_json = json.dumps(new_data, indent=2)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        return False, f"data block match count = {count}"
    html_path.write_text(new_html, encoding="utf-8")
    return True, None


def main():
    data = build_dashboard_data()
    ok, err = swap_data_block(DASHBOARD, data)
    if ok:
        print(f"[regen-dashboard] OK   {DASHBOARD.name}")
        print(f"[regen-dashboard] meter_status={data['_meter_status']}")
        ac = data["_aggregate_counts"]
        print(f"[regen-dashboard] handoffs={len(data['recent_handoffs'])} ships={len(data['recent_ships'])} proposals_pending={data['proposals_pending']} bubbles={ac.get('bubbles_total','?')} events={ac.get('events_total','?')}")
        return 0
    else:
        print(f"[regen-dashboard] FAIL {DASHBOARD.name}: {err}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
