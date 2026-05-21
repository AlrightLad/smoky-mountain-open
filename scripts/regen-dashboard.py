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
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

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


def approvals_pipeline_status():
    """Approvals Pipeline health banner (AMD-023, queue task
    approvals-pipeline-banner). Synthesizes:

      - latest downloads-watcher cron log (exit reason, timestamp)
      - .claude/state/proposals/.last-processed-decisions.json marker
      - .claude/state/proposals/{pending,approved,deferred,rejected,inbox}/ counts
      - .claude/state/amendments/inbox/, escalations/inbox/ queue depth
      - last 10 watcher runs -> SKIP-consecutive detection
      - approved-count delta vs prior dashboard regen (cached in
        .claude/state/dashboard-health/approvals-pipeline-prev.json)

    Status colors (per task acceptance):
      - green:  most recent run within 10 min AND exit_reason in
                {applied, no-op, no-new-files}
      - yellow: last 2 runs both 'SKIP working tree dirty'
      - red:    last run errored OR 4+ consecutive SKIPs

    Returns the normalized read_health_banner() shape so the existing
    renderHealthBanner('approvals', ...) JS path can render it without
    a special case.
    """
    now_utc = datetime.now(timezone.utc)
    logs_dir = ROOT / "scripts" / "cron" / "logs"
    source_path = ".claude/state/proposals/ + scripts/cron/logs/"

    # --- 1. Parse watcher logs (most recent N) ---
    # Filename: <YYYY-MM-DDTHH-MM-SSZ>-downloads-watcher.log
    watcher_runs = []
    if logs_dir.exists():
        files = sorted(
            logs_dir.glob("*-downloads-watcher.log"),
            key=lambda p: p.name,
            reverse=True,
        )[:10]
        for f in files:
            m = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-", f.name)
            ts_dt = None
            ts_iso = None
            if m:
                raw = m.group(1)
                date_part, time_part = raw.split("T", 1)
                time_part = time_part.replace("-", ":")
                ts_iso = f"{date_part}T{time_part}"
                try:
                    ts_dt = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
                except ValueError:
                    pass
            try:
                lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
            except OSError:
                continue
            exit_reason = None
            raw_last = ""
            for ln in reversed(lines):
                s = ln.strip()
                if not s:
                    continue
                if "DONE applied=" in s:
                    exit_reason = "applied" if "applied=True" in s else "no-op"
                    raw_last = s
                    break
                if "DONE no new decisions" in s:
                    exit_reason = "no-new-files"
                    raw_last = s
                    break
                if "SKIP working tree dirty" in s:
                    exit_reason = "skip-dirty"
                    raw_last = s
                    break
                if "SKIP cron-paused" in s:
                    exit_reason = "skip-paused"
                    raw_last = s
                    break
                if "SKIP last-verify" in s:
                    exit_reason = "skip-verify-window"
                    raw_last = s
                    break
                if s.startswith("[") and ("FAIL " in s or "ERROR" in s):
                    exit_reason = "error"
                    raw_last = s
                    break
            if exit_reason is None and lines:
                exit_reason = "incomplete"
                raw_last = lines[-1].strip()
            watcher_runs.append({
                "ts_iso": ts_iso,
                "ts_dt": ts_dt,
                "exit_reason": exit_reason or "unknown",
                "raw_last_line": raw_last[:200],
                "log_name": f.name,
            })

    # --- 2. Last marker ---
    marker_path = STATE / "proposals" / ".last-processed-decisions.json"
    marker = None
    if marker_path.exists():
        try:
            marker = json.loads(marker_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            marker = None

    # --- 3. Counts ---
    counts = {}
    for state_name in ("pending", "approved", "deferred", "rejected", "shipped"):
        d = STATE / "proposals" / state_name
        counts[f"proposals_{state_name}"] = (
            sum(1 for f in d.iterdir() if f.name.endswith(".md")) if d.exists() else 0
        )
    for inbox in ("proposals", "amendments", "escalations"):
        d = STATE / inbox / "inbox"
        counts[f"{inbox}_inbox"] = (
            sum(1 for f in d.iterdir() if f.is_file() and f.name.endswith(".json"))
            if d.exists() else 0
        )

    # --- 4. Delta vs prior cycle (approved count) ---
    cache_path = STATE / "dashboard-health" / "approvals-pipeline-prev.json"
    prev_approved = None
    if cache_path.exists():
        try:
            prev = json.loads(cache_path.read_text(encoding="utf-8-sig"))
            prev_approved = prev.get("approved_count")
        except (OSError, json.JSONDecodeError):
            pass
    approved_delta = None
    if isinstance(prev_approved, int):
        approved_delta = counts["proposals_approved"] - prev_approved
    try:
        # Idempotent: only re-write when approved_count actually changed.
        # The cache's `snapshot_at` is treated as a timestamp field (normalized
        # away from the comparison) so a no-op run doesn't dirty the tree.
        # Root-cause fix 2026-05-19 dirty-tree cycle.
        idempotent_write_json(
            cache_path,
            {
                "approved_count": counts["proposals_approved"],
                "snapshot_at": now_utc.isoformat(),
            },
            timestamp_keys=["snapshot_at"],
            grace_seconds=24 * 3600,  # cache is per-cycle; refresh daily even if quiet
        )
    except OSError:
        pass

    # --- 5. Status classification ---
    most_recent = watcher_runs[0] if watcher_runs else None
    age_minutes = None
    if most_recent and most_recent["ts_dt"]:
        age_minutes = round(
            (now_utc - most_recent["ts_dt"]).total_seconds() / 60.0, 1
        )

    consecutive_skips = 0
    for run in watcher_runs:
        if run["exit_reason"] and run["exit_reason"].startswith("skip"):
            consecutive_skips += 1
        else:
            break

    last_two_dirty = (
        len(watcher_runs) >= 2
        and watcher_runs[0]["exit_reason"] == "skip-dirty"
        and watcher_runs[1]["exit_reason"] == "skip-dirty"
    )

    last_errored = bool(most_recent) and most_recent["exit_reason"] in (
        "error", "incomplete"
    )

    fresh_success_reasons = {"applied", "no-op", "no-new-files"}
    if most_recent is None:
        status = "missing"
        summary = "no downloads-watcher logs found"
    elif last_errored or consecutive_skips >= 4:
        status = "red"
        # BUG-4 fix (2026-05-16): "N consecutive SKIPs" reads to operators as
        # "cron didn't run", but SKIP means the watcher DID run and chose not
        # to apply (dirty tree). Reword so the running-vs-not state is clear.
        summary = (
            "watcher errored"
            if last_errored
            else f"watcher cycling · applies blocked ({consecutive_skips} skips on dirty tree)"
        )
    elif last_two_dirty:
        status = "yellow"
        summary = "watcher cycling · last 2 runs skipped on dirty tree"
    elif (
        age_minutes is not None
        and age_minutes <= 10
        and most_recent["exit_reason"] in fresh_success_reasons
    ):
        status = "green"
        summary = f"watcher {most_recent['exit_reason']} {age_minutes}min ago"
    elif age_minutes is not None and age_minutes > 10:
        status = "yellow"
        summary = f"watcher last fired {age_minutes}min ago (>10min cadence)"
    else:
        status = "yellow"
        summary = f"watcher last run: {most_recent['exit_reason']}"

    inbox_total = (
        counts["proposals_inbox"]
        + counts["amendments_inbox"]
        + counts["escalations_inbox"]
    )
    if inbox_total > 0 and status != "missing":
        summary += f" · {inbox_total} in inbox"

    # --- 6. Details: last 3 stall events + marker + delta ---
    stalls = []
    for run in watcher_runs:
        if run["exit_reason"] and (
            run["exit_reason"].startswith("skip")
            or run["exit_reason"] in ("error", "incomplete")
        ):
            stalls.append({
                "category": "stall",
                "status": run["exit_reason"],
                "name": run["log_name"],
                "note": run["raw_last_line"],
                "when": run["ts_iso"],
            })
        if len(stalls) >= 3:
            break

    if marker:
        stalls.insert(0, {
            "category": "marker",
            "status": "info",
            "name": "last-processed-decisions",
            "note": (
                f"file={marker.get('last_processed_filename', '?')} "
                f"kind={marker.get('last_processed_kind', '?')}"
            ),
            "when": marker.get("last_processed_at"),
        })

    if approved_delta is not None and approved_delta != 0:
        sign = "+" if approved_delta > 0 else ""
        stalls.insert(0, {
            "category": "delta",
            "status": "info",
            "name": "approved delta",
            "note": f"{sign}{approved_delta} since last regen",
            "when": now_utc.isoformat(),
        })

    # --- 7. Normalized banner shape ---
    as_of_iso = (
        most_recent["ts_iso"]
        if most_recent and most_recent["ts_iso"]
        else now_utc.isoformat()
    )
    age_hours = (age_minutes / 60.0) if age_minutes is not None else None

    return {
        "available": most_recent is not None,
        "status": status,
        "raw_status": status,
        "summary": summary,
        "as_of": as_of_iso,
        "stale": False,
        "age_hours": age_hours,
        "counts": counts,
        "details": stalls,
        "links": [
            {
                "label": "Approvals pipeline trace",
                "href": "../../.claude/state/approval-pipeline-trace-2026-05-14.md",
            },
            {
                "label": "AMD-023",
                "href": "../../.claude/state/amendments/pending/AMD-023-approval-pipeline-reliability.md",
            },
        ],
        "source_path": source_path,
        "_meta": {
            "watcher_runs_inspected": len(watcher_runs),
            "consecutive_skips": consecutive_skips,
            "age_minutes": age_minutes,
        },
    }


def architecture_review_status():
    """Architecture Review health banner (AMD-024 + AMD-026).

    Reads the autonomous-v1 aggregator output written by
    `scripts/aggregate-architecture-review.py` on every commit
    (post-commit hook + scripts/regen-all.sh). The aggregator performs a
    cheap file-system scan (src/core size, functions/index.js inventory,
    pending REC-*.md sweep) and is the single source of truth for this
    banner — no "agent · awaiting dispatch" gating per the
    2026-05-19 mandate.

    Output schema (architecture-review-v2.0):
      schema_version, updated_at, status, summary, counts,
      top_3_priorities, details, recommendations, scan, links

    Status colours (computed by the aggregator):
      - green : 0 findings (scan clean)
      - yellow: 1-5 findings
      - red   : >5 findings OR any CRITICAL finding
    """
    path = STATE / "aggregates" / "architecture-review.json"
    source_path = str(path.relative_to(ROOT)).replace("\\", "/")
    now_utc = datetime.now(timezone.utc)

    if not path.exists():
        # Aggregator hasn't run yet — surface as "cron will produce this
        # on the next commit" rather than "agent awaiting dispatch".
        return {
            "available": False,
            "status": "unknown",
            "summary": (
                "0 architectural concerns · scan runs on next commit"
            ),
            "as_of": None,
            "stale": False,
            "age_hours": None,
            "counts": {
                "pending_recommendations": 0,
                "ratification_rate_pct": 100,
                "total_findings": 0,
            },
            "details": [{
                "category": "scan-pending",
                "status": "info",
                "name": "Autonomous scan",
                "note": (
                    "scripts/aggregate-architecture-review.py runs on every commit "
                    "via .husky/post-commit. The dashboard regen on the next commit "
                    "will populate findings (if any) from the file-system scan."
                ),
                "when": now_utc.isoformat(),
            }],
            "links": [
                {
                    "label": "AMD-024",
                    "href": "../../.claude/state/amendments/applied/AMD-024-architecture-ai-engineer-agent.md",
                },
                {
                    "label": "Architecture review dir",
                    "href": "../../.claude/state/architecture-review/",
                },
            ],
            "source_path": source_path,
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
            "source_path": source_path,
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
            "source_path": source_path,
        }

    daily = data.get("latest_daily_health") or {}
    weekly = data.get("latest_weekly_summary") or {}
    monthly = data.get("latest_monthly_strategic") or {}
    daily_color = (daily.get("color") or "unknown").lower()
    recs_count = data.get("pending_recommendations_count")
    if not isinstance(recs_count, int):
        recs_count = 0
    rat_rate = data.get("ratification_rate")
    try:
        rat_rate_f = float(rat_rate) if rat_rate is not None else None
    except (TypeError, ValueError):
        rat_rate_f = None

    # Autonomous-v1 aggregator (schema architecture-review-v2.0) already
    # computes a definitive status from the file-system scan. Honor it as
    # the primary source so the banner reflects the actual finding count
    # rather than re-deriving from legacy fields. Falls back to the
    # legacy derivation when the new field is absent (older snapshots).
    aggregator_status = (data.get("status") or "").lower()
    if aggregator_status in ("green", "yellow", "red"):
        status = aggregator_status
    elif daily_color == "red" or recs_count > 15:
        status = "red"
    elif (
        daily_color == "yellow"
        or 6 <= recs_count <= 15
        or (rat_rate_f is not None and rat_rate_f < 0.5)
    ):
        status = "yellow"
    elif daily_color == "green" and recs_count <= 5:
        status = "green"
    else:
        # No findings + no daily color set = legitimate empty (scan clean).
        # Per Founder mandate 2026-05-19, default to "green" rather than
        # "unknown" so the banner doesn't surface "AGENT · AWAITING" text.
        total_findings = (
            data.get("counts", {}).get("total_findings")
            if isinstance(data.get("counts"), dict)
            else None
        )
        if total_findings == 0 and recs_count == 0:
            status = "green"
        else:
            status = "unknown"

    summary = (
        data.get("summary")
        or daily.get("summary")
        or (
            f"{recs_count} pending recommendation"
            + ("s" if recs_count != 1 else "")
        )
    )

    updated_at = data.get("updated_at")
    age_hours = None
    stale = False
    if updated_at:
        try:
            updated_dt = datetime.fromisoformat(
                str(updated_at).replace("Z", "+00:00")
            )
            age_hours = round((now_utc - updated_dt).total_seconds() / 3600.0, 2)
            stale = age_hours > 48
        except (ValueError, TypeError):
            pass

    # Merge aggregator-emitted counts (autonomous-v1 surfaces extra
    # categories like file_size_findings + total_findings) with the legacy
    # pending_recommendations + ratification fields.
    raw_counts = data.get("counts") if isinstance(data.get("counts"), dict) else {}
    counts = {
        "pending_recommendations": recs_count,
        "ratification_rate_pct": (
            round(rat_rate_f * 100) if rat_rate_f is not None else 0
        ),
    }
    for k in ("file_size_findings", "function_count_findings", "total_findings"):
        if k in raw_counts:
            counts[k] = raw_counts[k]

    details = []
    # Surface aggregator details first (file-system findings + pending recs)
    # so Founder sees the actual scan output without clicking through.
    agg_details = data.get("details") if isinstance(data.get("details"), list) else []
    for d in agg_details[:5]:
        if isinstance(d, dict):
            details.append(d)
    top_priorities = data.get("top_3_priorities") or []
    if isinstance(top_priorities, list):
        for p in top_priorities[:3]:
            if not isinstance(p, dict):
                continue
            details.append({
                "category": "priority",
                "status": (p.get("priority") or "").lower(),
                "name": p.get("title") or "(untitled)",
                "note": f"owner: {p.get('owning_agent') or '?'}",
            })
    if weekly.get("summary"):
        details.append({
            "category": "weekly",
            "status": "info",
            "name": f"Week {weekly.get('week') or '?'}",
            "note": weekly.get("summary"),
        })
    if monthly.get("summary"):
        details.append({
            "category": "monthly",
            "status": "info",
            "name": f"Month {monthly.get('month') or '?'}",
            "note": monthly.get("summary"),
        })

    links = []
    if weekly.get("link"):
        links.append({"label": "Latest weekly", "href": weekly.get("link")})
    if monthly.get("link"):
        links.append({"label": "Latest monthly", "href": monthly.get("link")})
    links.append({
        "label": "Pending recommendations",
        "href": "../../.claude/state/architecture-review/recommendations/pending/",
    })

    return {
        "available": True,
        "status": "unknown" if stale else status,
        "raw_status": status,
        "summary": summary,
        "as_of": updated_at,
        "stale": stale,
        "age_hours": age_hours,
        "counts": counts,
        "details": details,
        "links": links,
        "schema_version": data.get("schema_version"),
        "source_path": source_path,
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
            # Phase B fix 2026-05-18 (GAP-4 schema parity): heartbeat writer
            # uses {ts, timestamp, generated_at, status, age_minutes, head_sha}.
            # Consumer was reading {last_pass_at_utc, last_pass_at_human}, which
            # never matched — every read silently fell through and the upper
            # round-trip-last-pass anchor displayed "unknown". Read all common
            # variants so consumer matches producer.
            iso = (
                data.get("ts")
                or data.get("timestamp")
                or data.get("generated_at")
                or data.get("last_pass_at_utc")
                or ""
            )
            ts_dt = datetime.fromisoformat(iso.replace("Z", "+00:00")) if iso else None
            age_min = round((now_utc - ts_dt).total_seconds() / 60.0, 1) if ts_dt else None
            # Stale threshold: 60 minutes (regen-all should run at least hourly
            # via maintenance cron + ad-hoc on ship-close commits).
            stale = age_min is not None and age_min > 60
            # Honor heartbeat's reported status (PASS / GATE-FAIL / STALE) so
            # the dashboard surfaces "GATE-FAIL — regen ran but round-trip
            # gate failed" honestly rather than masquerading as plain PASS.
            hb_status = data.get("status")
            if hb_status == "GATE-FAIL":
                display_status = "GATE-FAIL"
            elif stale:
                display_status = "STALE"
            else:
                display_status = "PASS"
            return {
                "ts": data.get("last_pass_at_human") or iso,
                "ts_iso": iso,
                "status": display_status,
                "age_minutes": age_min,
                "source": "heartbeat",
                "head_sha": data.get("head_sha"),
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


def last_watcher_heartbeat():
    """2026-05-19 Path 2 (heartbeat redundancy): read the downloads-watcher
    heartbeat written every 5 min by scripts/cron/downloads-watcher.ps1.

    Returns a structured dict identical in shape to last_regen_all_status()
    so the dashboard can surface either signal as proof-of-life:
        - ts, ts_iso, status, age_minutes, source, exit_reason
    Status thresholds:
      PASS    age_minutes <= 12     (one missed cycle + a beat)
      STALE   age_minutes > 12      (watcher misfiring)
      UNKNOWN heartbeat file absent (watcher never ran)
    """
    heartbeat = STATE / "heartbeats" / "watcher-last-run.json"
    now_utc = datetime.now(timezone.utc)
    if heartbeat.exists():
        try:
            data = json.loads(heartbeat.read_text(encoding="utf-8-sig"))
            iso = (
                data.get("ts")
                or data.get("timestamp")
                or data.get("generated_at")
                or data.get("last_run_at_utc")
                or ""
            )
            ts_dt = datetime.fromisoformat(iso.replace("Z", "+00:00")) if iso else None
            age_min = round((now_utc - ts_dt).total_seconds() / 60.0, 1) if ts_dt else None
            # Watcher cadence is 5 min; >12 min indicates a missed cycle.
            stale = age_min is not None and age_min > 12
            hb_status = data.get("status")
            if hb_status == "FAIL":
                display_status = "FAIL"
            elif stale:
                display_status = "STALE"
            else:
                display_status = "PASS"
            return {
                "ts": data.get("last_run_at_human") or iso,
                "ts_iso": iso,
                "status": display_status,
                "age_minutes": age_min,
                "source": "watcher-heartbeat",
                "exit_reason": data.get("exit_reason"),
            }
        except (OSError, json.JSONDecodeError):
            pass

    return {
        "ts": None,
        "ts_iso": None,
        "status": "UNKNOWN",
        "age_minutes": None,
        "source": "none",
        "exit_reason": None,
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

    # Tree state — filter out AMD-020 Class A cron-managed files (heartbeats,
    # telemetry aggregates, approvals-pipeline aggregate). These are auto-
    # generated every regen and auto-committed every cron cycle; they're
    # "dirty" in the technical sense but the cron is the OWNER and they
    # don't represent Founder-actionable state. 2026-05-20 iter4 (Founder
    # "watcher still dirty on dashboard main page") — the dashboard was
    # counting these as Founder-state-dirty, contradicting the watcher
    # GREEN status next to it.
    CRON_MANAGED_ROUTINE_PREFIXES = (
        ".claude/state/heartbeats/",
        ".claude/state/telemetry/",
        ".claude/state/aggregates/approvals-pipeline.json",
        ".claude/state/aggregates/architecture-review.json",
        ".claude/state/aggregates/proposal-pipeline.json",
        ".claude/state/aggregates/test-health.json",
        ".claude/state/aggregates/security-health.json",
        ".claude/state/aggregates/fiq-status.json",
        ".claude/state/aggregates/allow-list-audit.json",
        ".claude/state/main-flows-v2/flow-inventory.json",
    )
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        all_dirty_lines = [ln for ln in (result.stdout or "").splitlines() if ln.strip()]
        # Strip the 2-char status prefix + space, normalize Windows backslash
        def _routine(ln: str) -> bool:
            path = ln[3:].strip().replace("\\", "/")
            return any(path.startswith(p) for p in CRON_MANAGED_ROUTINE_PREFIXES)
        dirty_lines = [ln for ln in all_dirty_lines if not _routine(ln)]
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
                label = f"installed · State={os_task_state} · auto-fires on next cadence (every {c['cadence_minutes']}min)"
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
            # 2026-05-19 Path 2 (heartbeat redundancy): secondary freshness
            # signal from the 5-min downloads-watcher cron. If EITHER this
            # OR last_regen_all is fresh, the system is alive. Closes the
            # single-point-of-failure where the daily-maintenance task's
            # misses left the dashboard reporting STALE despite the watcher
            # cron firing normally.
            "last_watcher_heartbeat": last_watcher_heartbeat(),
            "working_tree": working_tree_status(),
            "halts": active_halts(),
            "round_trip_last_pass": round_trip_last_pass_ts(),
            # Cross-agent health banners (Founder directive 2026-05-14
            # "TWO NEW SESSIONS"). Files written by specialist agents
            # at .claude/state/aggregates/{test,security}-health.json.
            # Dashboard health agent reads + renders; does not write.
            "test_health": read_health_banner("test"),
            "security_health": read_health_banner("security"),
            # AMD-023 + queue task approvals-pipeline-banner: derived
            # locally from scripts/cron/logs/*-downloads-watcher.log +
            # marker + proposals/{state}/ counts. No external aggregator.
            "approvals_pipeline": approvals_pipeline_status(),
            # AMD-024 + queue task architecture-review-banner: reads the
            # aggregator JSON the Architecture / AI Engineer agent emits.
            # Empty-state when file absent.
            "architecture_review": architecture_review_status(),
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
    # Phase B fix 2026-05-18 (session 2, dashboard-completion-spec GAP-1/2/3):
    # token-usage-snapshot.json is the cross-surface source-of-truth for token
    # spend (post-T1+T5). current-snapshot.json's weekly_tokens has never been
    # wired to session transcripts and remains stuck at 102k (vs ~4.05B truth).
    # Pull weekly_tokens + the 7-day trend + override quota_status.weekly_tokens
    # from token-usage-snapshot.json to close the P9 gap.
    weekly_real = None
    daily_tokens = 0
    trend_labels: list[str] = []
    trend_values: list[int] = []
    try:
        token_snap_path = STATE / "telemetry" / "aggregates" / "token-usage-snapshot.json"
        if token_snap_path.exists():
            ts_data = json.loads(token_snap_path.read_text(encoding="utf-8"))
            today_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            for agent_data in (ts_data.get("by_agent") or {}).values():
                day_bucket = (agent_data.get("by_day") or {}).get(today_iso) or {}
                daily_tokens += int(day_bucket.get("real", 0)) + int(day_bucket.get("estimated", 0))
            session_block = ts_data.get("session_transcripts") or {}
            wr = session_block.get("weekly_real_7d")
            if isinstance(wr, (int, float)) and wr > 0:
                weekly_real = int(wr)
            by_day_total = session_block.get("by_day_total") or {}
            if by_day_total:
                today = datetime.now(timezone.utc).date()
                for offset in range(6, -1, -1):
                    iso = (today - timedelta(days=offset)).strftime("%Y-%m-%d")
                    trend_labels.append(iso[5:])
                    trend_values.append(int(by_day_total.get(iso, 0)))
    except (OSError, json.JSONDecodeError, ValueError, TypeError):
        weekly_real = None
        daily_tokens = 0
        trend_labels = []
        trend_values = []

    weekly_tokens = weekly_real if weekly_real is not None else snap.get("weekly_tokens", 0)
    token_trend_7d = (
        {"labels": trend_labels, "values": trend_values}
        if trend_values
        else snap.get("token_trend_7d", {"labels": [], "values": []})
    )
    quota_status_override = snap.get("quota_status")
    if isinstance(quota_status_override, dict) and weekly_real is not None:
        quota_status_override = dict(quota_status_override)
        quota_status_override["weekly_tokens"] = weekly_real
        quota_status_override["data_source"] = "session-transcripts (real, cross-surface unified)"

    return {
        "weekly_tokens": weekly_tokens,
        "weekly_tokens_estimated": snap.get("weekly_tokens_estimated", 0),
        "weekly_tokens_methodology": snap.get("weekly_tokens_methodology", ""),
        "daily_tokens": daily_tokens,
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
        "token_trend_7d": token_trend_7d,
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
        # GAP-2 fix: override weekly_tokens with session-transcript truth.
        "quota_status": quota_status_override,
        # AMD-007 P18.6: Founder Review Queue.
        "founder_queue": build_founder_queue(),
        # 2026-05-21 Goal-2 follow-up: embed App Health summary INLINE so the
        # main dashboard renders the A-F grade + top attention items without
        # fetching cross-directory (HTTP server scope is docs/reports/ only).
        "app_health_summary": _load_app_health_summary(),
        # 2026-05-21 Founder data-accuracy directive: surface git commit
        # counts alongside ship counts. They are NOT the same — the dashboard
        # was misleading by showing only ship-progress count.
        "git_activity_7d": _count_commits_window(7),
        "git_activity_24h": _count_commits_window(1),
    }


def _count_commits_window(days: int) -> dict:
    """Return {'total', 'cron_routine', 'non_routine'} commits in last N days."""
    try:
        import subprocess
        r = subprocess.run(
            ["git", "log", "--pretty=%s", f"--since={days}.days"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=20, check=False,
        )
        lines = [ln for ln in (r.stdout or "").splitlines() if ln.strip()]
        cron_count = sum(1 for ln in lines if ln.startswith("cron(routine)"))
        return {
            "total": len(lines),
            "cron_routine": cron_count,
            "non_routine": len(lines) - cron_count,
            "window_days": days,
        }
    except (OSError, subprocess.SubprocessError):
        return {"total": 0, "cron_routine": 0, "non_routine": 0, "window_days": days}


def _load_app_health_summary() -> dict:
    """Read .claude/state/aggregates/app-health.json + slim down to dashboard-
    summary shape (grade, score, top 3 attention items)."""
    try:
        path = STATE / "aggregates" / "app-health.json"
        if not path.exists():
            return {}
        d = json.loads(path.read_text(encoding="utf-8"))
        return {
            "overall_grade": d.get("overall_grade"),
            "overall_score": d.get("overall_score"),
            "generated_at": d.get("generated_at"),
            "attention_items": (d.get("attention_items") or [])[:3],
        }
    except (OSError, json.JSONDecodeError):
        return {}


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
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if dashboard.html missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(DASHBOARD)
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
