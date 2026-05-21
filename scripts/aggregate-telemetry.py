#!/usr/bin/env python3
"""
Telemetry aggregator — walks `.claude/state/telemetry/events/*.ndjson` plus the
real-state directories (handoffs, bubbles, proposals, ship-progress) and emits
`.claude/state/telemetry/aggregates/current-snapshot.json`.

F2 deliverable. Designed to be idempotent and tolerant of missing inputs (the
dry-run state is partial; this aggregator does what it can with what exists).

Token-consumption fields ("tokens_by_role", "weekly_tokens", "weekly_cost",
"token_trend_7d") are SYNTHESIZED from telemetry events when present. When
events lack agent+tokens attribution (the F1 token-meter gap), the aggregator
emits a `_meter_status` field that records the gap so downstream consumers
don't mistake zeros for "we used zero tokens."
"""
import json
import re
import sys
from collections import defaultdict, Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
EVENTS_DIR = STATE / "telemetry" / "events"
AGGREGATES_DIR = STATE / "telemetry" / "aggregates"
HANDOFFS_DIR = STATE / "handoffs"
BUBBLES_DIR = STATE / "discussion-bubbles"
PROPOSALS_DIR = STATE / "proposals"
SHIP_PROGRESS_DIR = STATE / "ship-progress"
WELLNESS_DIR = STATE / "wellness"

# Per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9
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


def walk_events():
    events = []
    if not EVENTS_DIR.exists():
        return events
    for f in sorted(EVENTS_DIR.glob("*.ndjson")):
        for line_no, line in enumerate(f.read_text(encoding="utf-8").splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError as e:
                sys.stderr.write(f"[aggregate] WARN bad event {f.name}:{line_no}: {e}\n")
    return events


def walk_handoffs():
    out = []
    if not HANDOFFS_DIR.exists():
        return out
    for folder in sorted(HANDOFFS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        scenario = FOLDER_TO_SCENARIO.get(folder.name)
        if scenario is None:
            sys.stderr.write(f"[aggregate] WARN unknown handoff folder {folder.name}\n")
            continue
        for f in sorted(folder.rglob("*.md")):
            data = read_frontmatter(f)
            if data is None:
                continue
            data["_scenario"] = scenario
            data["_path"] = str(f.relative_to(ROOT))
            out.append(data)
    out.sort(key=lambda h: h.get("created_at", ""), reverse=True)
    return out


def walk_bubbles():
    out = []
    if not BUBBLES_DIR.exists():
        return out
    for f in sorted(BUBBLES_DIR.iterdir()):
        if not f.name.endswith(".md"):
            continue
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    out.sort(key=lambda b: b.get("opened_at", ""), reverse=True)
    return out


def walk_proposals():
    pending = []
    approved = []
    if PROPOSALS_DIR.exists():
        for sub, bucket in [("pending", pending), ("approved", approved)]:
            d = PROPOSALS_DIR / sub
            if not d.exists():
                continue
            for f in sorted(d.iterdir()):
                if f.name.endswith(".md"):
                    data = read_frontmatter(f)
                    if data:
                        bucket.append(data)
    return pending, approved


def walk_ship_progress():
    out = []
    if not SHIP_PROGRESS_DIR.exists():
        return out
    for f in sorted(SHIP_PROGRESS_DIR.glob("*.json")):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            continue
    return out


def _read_yaml_or_json_frontmatter(path: Path):
    """Tolerates both PROP-style JSON frontmatter and AMD/ESC-style YAML
    frontmatter between '---' markers. Returns dict of top-level keys; for
    YAML it handles simple scalars + inline lists (sufficient for the id /
    title / *_at fields we need)."""
    if not path.exists():
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    m = re.search(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return None
    raw = m.group(1)
    # JSON first (PROP format)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # YAML simple-scalar fallback (AMD + ESC format)
    out = {}
    for line in raw.split("\n"):
        if not line.strip() or line.lstrip().startswith("#") or line.startswith(" "):
            # Skip blank / comment / continuation lines (block scalars handled below)
            continue
        m2 = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if not m2:
            continue
        key, val = m2.group(1), m2.group(2)
        v = val.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        if v.lower() == "true": v = True
        elif v.lower() == "false": v = False
        elif v.lower() in ("null", "none", "~"): v = None
        elif re.match(r"^-?\d+$", v): v = int(v)
        elif v == "|" or v == "":
            v = None  # multiline block; skip for simplicity (fields we need are inline)
        out[key] = v
    return out


def _load_anthropic_pricing():
    """Load .claude/scripts/lib/anthropic-pricing.json — Anthropic per-
    million-token pricing per model. Returns dict or empty fallback.
    Founder directive 2026-05-14 PER-SHIP TOKEN ATTRIBUTION."""
    pricing_path = ROOT / "scripts" / "lib" / "anthropic-pricing.json"
    if not pricing_path.exists():
        return {}
    try:
        return json.loads(pricing_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _compute_ship_cost_usd(tokens, pricing):
    """Best-effort cost calc using default-model input/output split.
    Returns USD float or None. Honest gap (AMD-009 P5): without real
    per-call input/output breakdown, this uses operator-asserted ratios
    (85/15 from anthropic-pricing.json). Per-call data lands when
    instrumentation is enabled."""
    if not tokens or not pricing:
        return None
    models = pricing.get("models") or {}
    default = pricing.get("default_model_for_estimation", "")
    model_info = models.get(default) or {}
    split = pricing.get("input_output_split_assumption") or {}
    input_ratio = split.get("input_ratio", 0.85)
    output_ratio = split.get("output_ratio", 0.15)
    in_price = model_info.get("input_per_million_usd")
    out_price = model_info.get("output_per_million_usd")
    if in_price is None or out_price is None:
        return None
    return round(
        (tokens * input_ratio * in_price + tokens * output_ratio * out_price) / 1_000_000,
        2,
    )


def _ship_id_aliases(artifact_id):
    """Founder directive PER-SHIP TOKEN ATTRIBUTION: session.team-work.summary
    events carry ship_id values that may differ from the canonical PROP-NNN /
    AMD-NNN / ESC-NNN ID. Return a list of ship_id strings that should be
    matched against events for this artifact (case-insensitive contains)."""
    if not artifact_id:
        return []
    aliases = [artifact_id]
    # PROP-003.a → also match "PROP-003-a", "PROP-003.A", etc.
    norm = artifact_id.replace(".", "-").upper()
    if norm != artifact_id:
        aliases.append(norm)
    return aliases


def walk_completed_artifacts():
    """Founder directive 2026-05-14 "DASHBOARD DATA PIPELINE BROKEN":
    real shipped artifacts live in proposals/shipped/, amendments/applied/,
    and escalations/applied/ — NOT in ship-progress/ (which is empty for
    the orchestration substrate). Returns a unified list of completed
    artifacts (proposals + amendments + escalations) with normalized
    fields for dashboard recent_ships render + ships_this_week count.
    Each item: {kind, id, title, status, completed_at, completed_at_iso,
    source_path}. Sorted newest-first.

    Uses _read_yaml_or_json_frontmatter() to tolerate both PROP-style JSON
    frontmatter and AMD/ESC-style YAML frontmatter."""
    out = []

    # Shipped proposals
    shipped_props_dir = ROOT / ".claude" / "state" / "proposals" / "shipped"
    if shipped_props_dir.exists():
        for f in sorted(shipped_props_dir.glob("PROP-*.md")):
            fm = _read_yaml_or_json_frontmatter(f)
            if not fm:
                continue
            ts = fm.get("shipped_at") or fm.get("applied_at") or fm.get("approved_at") or fm.get("authored_at") or ""
            out.append({
                "kind": "proposal",
                "id": fm.get("id") or f.stem,
                "title": fm.get("title") or fm.get("scope_summary") or f.stem,
                "status": "shipped",
                "completed_at": ts,
                "completed_at_iso": ts,
                "source_path": str(f.relative_to(ROOT)).replace("\\", "/"),
            })

    # Applied amendments
    applied_amds_dir = ROOT / ".claude" / "state" / "amendments" / "applied"
    if applied_amds_dir.exists():
        for f in sorted(applied_amds_dir.glob("AMD-*.md")):
            fm = _read_yaml_or_json_frontmatter(f)
            if not fm:
                continue
            ts = fm.get("applied_at") or fm.get("approved_at") or fm.get("authored_at") or ""
            out.append({
                "kind": "amendment",
                "id": fm.get("id") or f.stem,
                "title": fm.get("title") or fm.get("scope_summary") or f.stem,
                "status": "applied",
                "completed_at": ts,
                "completed_at_iso": ts,
                "source_path": str(f.relative_to(ROOT)).replace("\\", "/"),
            })

    # Applied escalations
    applied_escs_dir = ROOT / ".claude" / "state" / "escalations" / "applied"
    if applied_escs_dir.exists():
        for f in sorted(applied_escs_dir.glob("ESC-*.md")):
            fm = _read_yaml_or_json_frontmatter(f)
            if not fm:
                continue
            ts = fm.get("applied_at") or fm.get("approved_at") or fm.get("authored_at") or ""
            out.append({
                "kind": "escalation",
                "id": fm.get("id") or f.stem,
                "title": fm.get("title") or f.stem,
                "status": "applied",
                "completed_at": ts,
                "completed_at_iso": ts,
                "source_path": str(f.relative_to(ROOT)).replace("\\", "/"),
            })

    # 2026-05-21 Founder feedback: "Activity count graph showing no ship or
    # commits today" — ship-progress JSON entries (engineering ships authored
    # by the agent each day) are real ships and need to count in ships_this_week.
    # Walk them and add to the unified list.
    ship_progress_dir = ROOT / ".claude" / "state" / "ship-progress"
    if ship_progress_dir.exists():
        for f in sorted(ship_progress_dir.glob("*.json")):
            try:
                import json as _json
                sp = _json.loads(f.read_text(encoding="utf-8"))
            except (OSError, _json.JSONDecodeError):
                continue
            ts = sp.get("created_at") or sp.get("completed_at") or sp.get("started_at") or ""
            if not ts:
                continue
            out.append({
                "kind": "ship",
                "id": sp.get("ship_id") or f.stem,
                "title": sp.get("title") or f.stem,
                "status": sp.get("status") or "tracked",
                "completed_at": ts,
                "completed_at_iso": ts,
                "source_path": str(f.relative_to(ROOT)).replace("\\", "/"),
            })

    # If no shipped artifacts found, fall back to mining ship-close commits
    # from git history so recent_ships still surfaces something useful
    # during transitional state (e.g., before any proposals/escalations move
    # through the new lifecycle).
    if not out:
        import subprocess
        try:
            r = subprocess.run(
                ["git", "log", "--pretty=%H%x09%cI%x09%s", "--since=14.days"],
                cwd=str(ROOT), capture_output=True, text=True, timeout=15, check=False,
            )
            ship_close_re = re.compile(r"(W\d+\.[SIMm][0-9a-z]+ ship (close|complete)|Shipped (PROP|AMD)-\d+(\.[a-z])?|[Ss]hip (close|complete):)")
            for line in (r.stdout or "").splitlines():
                parts = line.split("\t")
                if len(parts) < 3:
                    continue
                sha, cdate, subject = parts[0], parts[1], parts[2]
                if ship_close_re.search(subject):
                    out.append({
                        "kind": "commit",
                        "id": sha[:7],
                        "title": subject,
                        "status": "committed",
                        "completed_at": cdate,
                        "completed_at_iso": cdate,
                        "source_path": f"commit:{sha[:12]}",
                    })
        except (OSError, subprocess.SubprocessError):
            pass

    # Sort newest first
    out.sort(key=lambda x: x.get("completed_at_iso") or "", reverse=True)
    return out


def _count_fiq_entries(repo_root: Path):
    """Count entries in .claude/state/founder-input-queue/ — Founder Input Queue.
    Per Issue-2 (2026-05-14): replaces the hardcoded 0 stub. Returns 0 honestly
    when the FIQ dir does not exist OR is empty; non-zero when entries exist.
    F3 substrate (FIQ build pipeline) is still forthcoming; this function reads
    whatever already lives in the dir so the dashboard signal is honest as
    soon as entries appear (won't wait for F3)."""
    fiq_dir = repo_root / ".claude" / "state" / "founder-input-queue"
    if not fiq_dir.exists():
        return 0
    # Count *.md entries (the canonical FIQ entry format)
    return sum(1 for p in fiq_dir.glob("*.md") if p.is_file())


def _read_quota_status(repo_root: Path, max_age_seconds: int = 6 * 3600):
    """
    PROP-003.b: Read .claude/state/quota-status.json (PROP-003.a sidecar
    output) and gate it on freshness + data presence. Returns a dict with
    `_state` ∈ {"fresh", "empty", "stale", "absent"} so callers can flip
    `_meter_status` and downstream dashboards can render accordingly.

    Freshness gate: `as_of` must be within `max_age_seconds` (default 6h).
    Data gate: `data_source != "none"` AND `weekly_tokens > 0` (sidecar
    can produce an empty file when the underlying manual log doesn't exist
    yet — that's "empty", not "fresh real data").
    """
    path = repo_root / ".claude" / "state" / "quota-status.json"
    if not path.exists():
        return {"_state": "absent"}
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"_state": "absent"}
    # Parse as_of
    as_of_raw = obj.get("as_of", "") or ""
    try:
        # Handle Z + microseconds
        if as_of_raw.endswith("Z"):
            as_of_raw = as_of_raw[:-1] + "+00:00"
        as_of_dt = datetime.fromisoformat(as_of_raw)
    except Exception:
        return {**obj, "_state": "absent"}
    age_sec = (datetime.now(timezone.utc) - as_of_dt).total_seconds()
    obj["_age_seconds"] = int(age_sec)
    if age_sec > max_age_seconds:
        obj["_state"] = "stale"
        return obj
    # Data gate: data_source "none" + weekly_tokens 0 means sidecar ran but
    # has no underlying log to read. Treat as "empty" so the meter says
    # "sidecar running, no data" rather than misleadingly claiming wired-real
    # with zero tokens.
    if obj.get("data_source") in (None, "none") or not (obj.get("weekly_tokens") or 0):
        obj["_state"] = "empty"
        return obj
    obj["_state"] = "fresh"
    return obj


def _read_latest_manual_quota(repo_root: Path):
    """
    Phase 6.6: Surface the most recent Founder manual-quota-paste entry from
    `.claude/state/telemetry/manual-quota-log.ndjson` so dashboards can show
    a REAL percentage-against-quota (instead of dividing by a fictional cap).

    Aggregates the latest entry per scope; returns shape:
      {
        "anchored_at": "<ISO-8601 of most recent paste>",
        "weekly_all_pct": <0..100 or None>,
        "weekly_sonnet_pct": <0..100 or None>,
        "session_pct": <0..100 or None>,
        "claude_design_pct": <0..100 or None>
      }

    Returns None when no entries exist.
    """
    log_path = repo_root / ".claude" / "state" / "telemetry" / "manual-quota-log.ndjson"
    if not log_path.exists():
        return None
    by_scope = {}
    try:
        for line in log_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            scope = obj.get("scope")
            ts = obj.get("timestamp")
            if not scope or not ts:
                continue
            prior = by_scope.get(scope)
            if prior is None or ts > prior.get("timestamp", ""):
                by_scope[scope] = obj
    except OSError:
        return None
    if not by_scope:
        return None
    # Derive percentages from tokens_used + the note containing "% of <cap>".
    def _pct(entry):
        note = entry.get("note", "") or ""
        m = re.search(r"(\d+(?:\.\d+)?)%", note)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                return None
        return None
    latest_ts = max(e.get("timestamp", "") for e in by_scope.values())
    return {
        "anchored_at": latest_ts,
        "weekly_all_pct":      _pct(by_scope.get("weekly-all", {}))      if "weekly-all"      in by_scope else None,
        "weekly_sonnet_pct":   _pct(by_scope.get("weekly-sonnet", {}))   if "weekly-sonnet"   in by_scope else None,
        "session_pct":         _pct(by_scope.get("session", {}))         if "session"         in by_scope else None,
        "claude_design_pct":   _pct(by_scope.get("claude-design", {}))   if "claude-design"   in by_scope else None,
    }


def aggregate():
    events = walk_events()
    handoffs = walk_handoffs()
    bubbles = walk_bubbles()
    proposals_pending, proposals_approved = walk_proposals()
    ship_progress = walk_ship_progress()

    # Cycle outcomes
    cycle_outcomes = Counter()
    cycle_starts = Counter()
    cycles_paused = 0
    cycles_resumed = 0
    halts = 0
    pause_durations = []
    for e in events:
        et = e.get("event_type", "")
        if et == "cycle.start":
            cycle_starts[e.get("cycle_id", "")] += 1
        elif et == "cycle.end":
            outcome = e.get("data", {}).get("outcome", "unknown")
            cycle_outcomes[outcome] += 1
        elif et == "cycle.paused":
            cycles_paused += 1
        elif et == "cycle.resumed":
            cycles_resumed += 1
            dur = e.get("data", {}).get("pause_duration_seconds")
            if isinstance(dur, (int, float)):
                pause_durations.append(dur)
        elif et.startswith("cycle.halt") or et.startswith("halt."):
            halts += 1

    # Tokens by role — synthesize from event types that carry token attribution.
    # Covers: legacy generic 'tokens'/'tokens_consumed' fields + session.team-work.summary
    # (operator-asserted estimate for orchestration sessions) + cycle.paused
    # (tokens_consumed_since_last_rest) + cycle.budget.checkpoint deltas.
    #
    # BUG-7 fix (2026-05-16): operator-asserted estimates (session.team-work.summary
    # tokens_estimated) are NOT measurements. The two May 14 entries (4.2M + 3.0M)
    # were heuristic guesses ("74 commits × ~150k tokens/substantial-commit") that
    # the dashboard was conflating with measured data and labeling "this week".
    # Now: tokens_by_role tracks REAL measured tokens only. Operator-asserted
    # estimates are surfaced separately so the displayed "this week" number is
    # honest. Founder paste from claude.ai (via refresh-quota-manual.ps1) remains
    # the ground-truth calibration source.
    #
    # ALSO filtering to past 7 days — the previous "weekly_tokens" was actually
    # all-time tokens-since-records-began.
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    tokens_by_role = defaultdict(int)            # REAL measured only, last 7 days
    tokens_estimated_by_role = defaultdict(int)  # operator-asserted, last 7 days
    last_checkpoint = None

    def _event_dt(ev):
        ts = ev.get("timestamp") or ev.get("ts")
        if not ts:
            return None
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None

    for e in events:
        data = e.get("data") or {}
        if not isinstance(data, dict):
            continue
        et = e.get("event_type", "")
        agent = e.get("agent") or data.get("agent")
        ev_dt = _event_dt(e)
        in_week = ev_dt is not None and ev_dt >= seven_days_ago

        # Legacy generic field — measured if present (REAL)
        legacy_tokens = data.get("tokens") or data.get("tokens_consumed")
        if in_week and agent and isinstance(legacy_tokens, (int, float)) and legacy_tokens > 0:
            tokens_by_role[agent] += int(legacy_tokens)

        # session.team-work.summary — operator-asserted ESTIMATE only.
        # Tracked in a separate bucket so the displayed "this week" number
        # contains only measured data.
        if et == "session.team-work.summary":
            t = data.get("tokens_estimated")
            a = agent or "orchestrator"
            if in_week and isinstance(t, (int, float)) and t > 0:
                tokens_estimated_by_role[a] += int(t)

        # cycle.paused — REAL (measured at pause boundary)
        elif et == "cycle.paused":
            t = data.get("tokens_consumed_since_last_rest")
            a = agent or "unknown"
            if in_week and isinstance(t, (int, float)) and t > 0:
                tokens_by_role[a] += int(t)

        # cycle.budget.checkpoint — REAL (Anthropic-side counter delta)
        elif et == "cycle.budget.checkpoint":
            consumed = data.get("weekly_tokens_consumed")
            if isinstance(consumed, (int, float)):
                if last_checkpoint is not None and in_week:
                    delta = int(consumed) - last_checkpoint
                    if delta > 0:
                        a = agent or "unknown"
                        tokens_by_role[a] += delta
                last_checkpoint = int(consumed)

    meter_wired = (len(tokens_by_role) + len(tokens_estimated_by_role)) > 0

    # PROP-003.b: prefer quota-status.json (PROP-003.a sidecar) when fresh.
    # Cascading status determination:
    #   - quota-status fresh           → "wired-real"
    #   - quota-status empty (no data) → "wired-estimated-sidecar-empty"
    #   - quota-status stale (> 6h)    → "wired-estimated-sidecar-stale"
    #   - quota-status absent + events → "wired-estimated"
    #   - nothing at all               → "gap-per-F1a"
    quota_status = _read_quota_status(ROOT)
    qs_state = quota_status.get("_state", "absent")
    if qs_state == "fresh":
        meter_status = "wired-real"
    elif qs_state == "empty":
        meter_status = "wired-estimated-sidecar-empty"
    elif qs_state == "stale":
        meter_status = "wired-estimated-sidecar-stale"
    else:
        meter_status = "wired-estimated" if meter_wired else "gap-per-F1a"

    # Recent handoffs (top 5) — Founder directive 2026-05-14 fix: extend
    # legacy handoff markdown source with git-commit mining so the table
    # surfaces recent substrate activity (cron auto-commits, ship-close
    # commits, etc.) instead of only formal handoff markdown files.
    # Markdown handoffs first (preserves legacy semantics), then commits.
    recent_handoffs = [
        {
            "scenario": h.get("_scenario"),
            "from": h.get("from_agent"),
            "to": h.get("to_agent"),
            "created_at": h.get("created_at"),
            "_source": "handoff-md",
        }
        for h in handoffs[:3]
    ]
    # Mine git history for recent activity (last 48h, capped at 10 commits)
    try:
        import subprocess
        gres = subprocess.run(
            ["git", "log", "--pretty=%cI%x09%s%x09%an", "--since=2.days"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=15, check=False,
        )
        commit_lines = (gres.stdout or "").splitlines()[:10]
        for line in commit_lines:
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            cdate, subject, author = parts[0], parts[1], parts[2]
            # Classify the commit by subject pattern
            if re.search(r"^cron\(routine\)|^Apply governance amendments|^Apply escalation", subject):
                scenario = "cron-auto-commit"
                from_agent = "cron"
                to_agent = author
            elif re.search(r"Shipped (PROP|AMD)-|^W\d+\.[SIMm]", subject):
                scenario = "ship-close"
                from_agent = "engineer"
                to_agent = "founder"
            elif re.search(r"^Apply ", subject):
                scenario = "watcher-apply"
                from_agent = "watcher"
                to_agent = "team"
            else:
                scenario = "team-commit"
                from_agent = "engineer"
                to_agent = "main"
            recent_handoffs.append({
                "scenario": scenario,
                "from": from_agent,
                "to": to_agent,
                "created_at": cdate,
                "_subject": subject[:80],
                "_source": "git-commit",
            })
    except (OSError, subprocess.SubprocessError):
        pass
    # Cap and sort by created_at desc
    recent_handoffs.sort(key=lambda h: h.get("created_at") or "", reverse=True)
    recent_handoffs = recent_handoffs[:10]

    # Recent ships — Founder directive 2026-05-14 fix: source from real
    # shipped artifacts (proposals/shipped/ + amendments/applied/ +
    # escalations/applied/), not the empty ship-progress/ directory.
    # Falls back to git-history ship-close commit mining if all state
    # buckets are empty (transitional state).
    completed = walk_completed_artifacts()

    # PER-SHIP TOKEN ATTRIBUTION (Founder directive 2026-05-14): sum
    # session.team-work.summary events whose ship_id matches the artifact's
    # canonical id (with aliases). Display "—" (None) for unknowns per
    # AMD-009 P5 honest language — never fabricate 0 when it means "no data".
    pricing = _load_anthropic_pricing()
    recent_ships = []
    for c in completed[:10]:
        artifact_id = c.get("id") or ""
        aliases = [a.lower() for a in _ship_id_aliases(artifact_id)]
        tokens_attributed = 0
        events_matched = 0
        for ev in events:
            if ev.get("event_type") != "session.team-work.summary":
                continue
            data = ev.get("data") or {}
            event_ship_id = (data.get("ship_id") or ev.get("ship_id") or "").lower()
            if not event_ship_id:
                continue
            if any(a == event_ship_id for a in aliases):
                t = data.get("tokens_estimated")
                if isinstance(t, (int, float)) and t > 0:
                    tokens_attributed += int(t)
                    events_matched += 1
        cost = _compute_ship_cost_usd(tokens_attributed, pricing) if tokens_attributed > 0 else None
        recent_ships.append({
            "id": artifact_id,
            "title": c.get("title") or "(no title)",
            "kind": c.get("kind"),
            "status": c.get("status") or "unknown",
            "completed_at": c.get("completed_at"),
            # tokens=None means "unknown" → dashboard displays "—".
            # tokens=int means "attributed via matching ship_id events".
            "tokens": tokens_attributed if tokens_attributed > 0 else None,
            "tokens_source": "events" if tokens_attributed > 0 else "unknown",
            "tokens_events_matched": events_matched,
            "cost_usd": cost,
            "source_path": c.get("source_path"),
        })

    # 7-day per-day buckets — Founder directive 2026-05-14: was hardcoded
    # [0]*7 placeholder. Now buckets real events by their timestamp date.
    now = datetime.now(timezone.utc)
    today = now.date()
    days = [(now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
    day_dates = [(now - timedelta(days=i)).date() for i in range(6, -1, -1)]
    date_to_idx = {d: i for i, d in enumerate(day_dates)}

    def _event_date(e):
        ts = e.get("timestamp") or ""
        if not ts:
            return None
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            return None

    # Token trend per day — sum every event's per-event token contribution.
    # Mirror the same fields tokens_by_role aggregation uses (legacy generic +
    # session.team-work.summary + cycle.paused.tokens_consumed_since_last_rest
    # + cycle.budget.checkpoint deltas).
    token_per_day = [0] * 7
    last_checkpoint_for_trend = None
    for e in events:
        d = _event_date(e)
        if d is None or d not in date_to_idx:
            # Still process for checkpoint state continuity across dates
            data = e.get("data") or {}
            et = e.get("event_type", "")
            if et == "cycle.budget.checkpoint" and isinstance(data, dict):
                v = data.get("weekly_tokens_consumed")
                if isinstance(v, (int, float)):
                    last_checkpoint_for_trend = int(v)
            continue
        idx = date_to_idx[d]
        data = e.get("data") or {}
        if not isinstance(data, dict):
            continue
        et = e.get("event_type", "")
        legacy_tokens = data.get("tokens") or data.get("tokens_consumed")
        if isinstance(legacy_tokens, (int, float)) and legacy_tokens > 0:
            token_per_day[idx] += int(legacy_tokens)
        if et == "session.team-work.summary":
            t = data.get("tokens_estimated")
            if isinstance(t, (int, float)) and t > 0:
                token_per_day[idx] += int(t)
        elif et == "cycle.paused":
            t = data.get("tokens_consumed_since_last_rest")
            if isinstance(t, (int, float)) and t > 0:
                token_per_day[idx] += int(t)
        elif et == "cycle.budget.checkpoint":
            consumed = data.get("weekly_tokens_consumed")
            if isinstance(consumed, (int, float)):
                if last_checkpoint_for_trend is not None:
                    delta = int(consumed) - last_checkpoint_for_trend
                    if delta > 0:
                        token_per_day[idx] += delta
                last_checkpoint_for_trend = int(consumed)

    token_trend = {
        "labels": days,
        "values": token_per_day,
    }

    # Cycle outcomes per day — Founder directive 2026-05-14 fix: was
    # putting every outcome at index 0 (oldest day). Now buckets by
    # event date.
    cycle_complete_per_day = [0] * 7
    cycle_paused_per_day = [0] * 7
    cycle_halted_per_day = [0] * 7
    for e in events:
        d = _event_date(e)
        if d is None or d not in date_to_idx:
            continue
        idx = date_to_idx[d]
        et = e.get("event_type", "")
        if et == "cycle.end":
            outcome = (e.get("data") or {}).get("outcome", "unknown")
            if outcome == "complete":
                cycle_complete_per_day[idx] += 1
            elif outcome == "paused":
                cycle_paused_per_day[idx] += 1
        elif et == "cycle.paused":
            cycle_paused_per_day[idx] += 1
        elif et.startswith("cycle.halt") or et.startswith("halt."):
            cycle_halted_per_day[idx] += 1

    cycle_outcomes_7d = {
        "labels": days,
        "datasets": [
            {"label": "Complete", "data": cycle_complete_per_day, "color": "#4a8067"},
            {"label": "Paused",   "data": cycle_paused_per_day,   "color": "#d4a857"},
            {"label": "Halted",   "data": cycle_halted_per_day,   "color": "#9c4a4a"},
        ],
    }

    # Ships per day — same bucketing for completed_at; surfaces in dashboard
    # 7-day table even when token meter is empty.
    ships_per_day = [0] * 7
    for c in completed:
        ts = c.get("completed_at_iso") or ""
        if not ts:
            continue
        try:
            d = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            continue
        if d in date_to_idx:
            ships_per_day[date_to_idx[d]] += 1

    # Handoffs per day — bucket walked-handoff markdown frontmatter entries
    # (created_at) by event date. Per Founder directive 2026-05-14 DASHBOARD
    # VIZ: ships/handoffs/bubbles 7-day table columns were hardcoded null
    # in dashboard.html; now wire real per-day counts.
    handoffs_per_day = [0] * 7
    for h in handoffs:
        ts = h.get("created_at") or ""
        if not ts:
            continue
        try:
            d = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            continue
        if d in date_to_idx:
            handoffs_per_day[date_to_idx[d]] += 1

    # Bubbles per day — count discussion bubble activity. Each bubble has
    # opened_at (and possibly closed_at + flagged_for_founder). For the
    # 7-day rollup we count opened-this-day events. (Closed/flagged events
    # could be a separate column in future expansion.)
    bubbles_per_day = [0] * 7
    for b in bubbles:
        ts = b.get("opened_at") or ""
        if not ts:
            continue
        try:
            d = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            continue
        if d in date_to_idx:
            bubbles_per_day[date_to_idx[d]] += 1

    # BUG-7 fix (2026-05-16): weekly_tokens now reflects MEASURED-only sum
    # from the past 7 days (no operator-asserted estimates conflated).
    # weekly_tokens_estimated is the operator-asserted bucket, surfaced
    # separately for transparency.
    weekly_tokens = sum(tokens_by_role.values())              # measured only
    weekly_tokens_estimated = sum(tokens_estimated_by_role.values())

    # PROP-003.b: when sidecar fresh (Founder pasted from claude.ai), prefer
    # its weekly_tokens as the most accurate ground-truth.
    if qs_state == "fresh":
        real_weekly = quota_status.get("weekly_tokens")
        if isinstance(real_weekly, (int, float)) and real_weekly > 0:
            weekly_tokens = int(real_weekly)

    # Iter 11 (2026-05-14, user-context audit): weekly_cost was hardcoded
    # 0.0 with a TODO comment. Per AMD-009 P5 (honest language): a non-zero
    # weekly_tokens with a $0.00 spend label is misleading even if "no
    # cost meter" is in the small print. Use the existing pricing model +
    # _compute_ship_cost_usd() to produce an estimate from operator-asserted
    # 85/15 input/output split per anthropic-pricing.json. Honest deltas
    # already exist in _meter_note explaining that estimates use the default
    # model and split.
    weekly_pricing = _load_anthropic_pricing()
    weekly_cost_estimate = _compute_ship_cost_usd(weekly_tokens, weekly_pricing)
    weekly_cost = weekly_cost_estimate if weekly_cost_estimate is not None else 0.0

    # PROP-003.b: meter note adapts to current state so dashboards can
    # show users why the value is what it is.
    if meter_status == "wired-real":
        meter_note = (
            "Token meter is wired to real data via PROP-003.a sidecar "
            "(.claude/state/quota-status.json). weekly_tokens reflects the "
            "most recent meter reading. See quota_status block for org-monthly "
            "percentage + freshness."
        )
    elif meter_status == "wired-estimated-sidecar-empty":
        meter_note = (
            "Sidecar (PROP-003.a) is running and writing quota-status.json, but "
            "the underlying manual-quota-log.ndjson does not yet exist. "
            "Falling back to event-aggregated estimates. Run "
            "scripts/refresh-quota-manual.ps1 to populate, or install the "
            "sidecar Scheduled Task for automatic refresh."
        )
    elif meter_status == "wired-estimated-sidecar-stale":
        meter_note = (
            "Sidecar (PROP-003.a) output quota-status.json is older than 6h "
            "(staleness threshold). Falling back to event-aggregated estimates. "
            "Re-run sidecar manually or check the Scheduled Task health."
        )
    else:
        meter_note = (
            "Token meter is not wired (F1 finding). tokens_by_role / weekly_tokens / "
            "weekly_cost / token_trend_7d will show synthesized event-attributed values "
            "ONLY for events that carry agent + tokens fields. Until a real meter wires "
            "up (db-2026-05-13-003 outcome pending Founder ratification), treat these "
            "fields as a lower bound, not the actual consumption."
        )

    # PROP-003.b: quota_status block — every aggregator run records the
    # current state of the PROP-003.a sidecar so dashboards can render
    # appropriately + downstream PAUSE_DISCIPLINE (AMD-014) can gate.
    quota_status_block = {
        "state": qs_state,
        "as_of": quota_status.get("as_of") if qs_state != "absent" else None,
        "age_seconds": quota_status.get("_age_seconds"),
        "weekly_tokens": quota_status.get("weekly_tokens"),
        "weekly_cap": quota_status.get("weekly_cap"),
        "weekly_pct": quota_status.get("weekly_pct"),
        "org_monthly_tokens": quota_status.get("org_monthly_tokens"),
        "org_monthly_cap": quota_status.get("org_monthly_cap"),
        "org_monthly_pct": quota_status.get("org_monthly_pct"),
        "data_source": quota_status.get("data_source"),
        "_warning": quota_status.get("_warning"),
    }

    snapshot = {
        # generated_at mirrors as_of for cross-aggregator freshness audits
        # (D9 schema gap fix 2026-05-20). Same value, conventional field name.
        "generated_at": now.isoformat(),
        "as_of": now.isoformat(),
        "_meter_status": meter_status,
        "_meter_note": meter_note,
        "quota_status": quota_status_block,
        "weekly_tokens": weekly_tokens,
        "weekly_tokens_estimated": weekly_tokens_estimated,
        "weekly_tokens_methodology": (
            "measured: cycle.budget.checkpoint deltas + cycle.paused tokens + legacy 'tokens' field. "
            "estimated: session.team-work.summary tokens_estimated (operator-asserted, NOT measurements). "
            "Both filtered to past 7 days. For ground truth, paste from claude.ai via "
            "scripts/refresh-quota-manual.ps1."
        ),
        "weekly_cost": weekly_cost,
        "ships_this_week": sum(ships_per_day),
        "ships_trend_7d": {"labels": days, "values": ships_per_day},
        "handoffs_trend_7d": {"labels": days, "values": handoffs_per_day},
        "bubbles_trend_7d": {"labels": days, "values": bubbles_per_day},
        "halts_this_week": halts,
        "fiq_depth": _count_fiq_entries(ROOT),  # was hardcoded 0 (F3-era stub); now reads .claude/state/founder-input-queue/ entries per Issue-2 unstub 2026-05-14
        # Phase 6.6: no fictional cap. Real quota % comes from manual paste
        # (see manual_quota_latest below). Field intentionally omitted; dashboards
        # consume manual_quota_latest instead.
        "manual_quota_latest": _read_latest_manual_quota(ROOT),
        "tokens_by_role": {
            "labels": list(tokens_by_role.keys()) or ["(meter unwired)"],
            "values": list(tokens_by_role.values()) or [0],
        },
        "token_trend_7d": token_trend,
        "cycle_outcomes_7d": cycle_outcomes_7d,
        "recent_ships": recent_ships,
        "_aggregate_counts": {
            "events_total": len(events),
            "cycles_started": sum(cycle_starts.values()),
            "cycles_paused": cycles_paused,
            "cycles_resumed": cycles_resumed,
            "handoffs_total": len(handoffs),
            "bubbles_total": len(bubbles),
            "proposals_pending": len(proposals_pending),
            "proposals_approved": len(proposals_approved),
            "pause_durations_sec": pause_durations,
        },
    }

    AGGREGATES_DIR.mkdir(parents=True, exist_ok=True)
    out_path = AGGREGATES_DIR / "current-snapshot.json"
    # Idempotent write: skip the file rewrite when normalized content matches
    # the existing snapshot and timestamps are still fresh. Prevents pure
    # timestamp drift from dirtying the working tree across post-commit
    # hook fires (root-cause fix 2026-05-19).
    #
    # current-snapshot.json is NOT in aggregate-self-tests' D40 freshness
    # gate (only test/security/approvals/arch-review/fiq are). regen-dashboard
    # reads content (weekly_tokens, etc.) not the `as_of` timestamp for
    # freshness. So a long grace (4h) is safe and minimizes drift.
    wrote, reason = idempotent_write_json(out_path, snapshot, grace_seconds=4 * 3600)
    snapshot["_idempotent_write"] = {"wrote": wrote, "reason": reason}
    return out_path, snapshot


def main():
    out_path, snap = aggregate()
    iw = snap.get("_idempotent_write") or {}
    write_label = "wrote" if iw.get("wrote") else "skipped"
    print(f"[aggregate] {write_label} {out_path.relative_to(ROOT)} ({iw.get('reason', 'n/a')})")
    print(f"[aggregate] meter_status={snap['_meter_status']}")
    print(f"[aggregate] events={snap['_aggregate_counts']['events_total']} handoffs={snap['_aggregate_counts']['handoffs_total']} bubbles={snap['_aggregate_counts']['bubbles_total']} proposals_pending={snap['_aggregate_counts']['proposals_pending']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
