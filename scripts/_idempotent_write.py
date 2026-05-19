"""Shared idempotent JSON writer for aggregate + regen scripts.

Root-cause fix 2026-05-19 (session-3): every regen run was re-writing
aggregate JSON files with a NEW `generated_at` / `timestamp` even when
underlying data was unchanged. The post-commit hook fires ~18 regen
scripts on every commit, including its own auto-commit recursion — so
each commit produced a ~5-second dirty-tree window. The cron watcher
(5-min cadence) saw that window as "dirty" and surfaced
`dirty (13 files) · watcher cycling` on dashboard.html even when the
tree was actually clean by the time Founder loaded the page.

Initial fix (commit d496cdf): aggregator + cache writers compare the
NORMALIZED content (timestamps excluded) against the existing file.
When meaningful content is identical AND the existing file's timestamps
are still within the "fresh enough" grace window, skip the write entirely
— so the tree stays clean across post-commit hook fires.

DEEPER fix 2026-05-19 (session-4, phase-B root-cause part 2): the prior
fix MISSED that the grace-refresh path still rewrites the entire payload
when grace expires. Every 5-min cron cycle, grace expired and the
aggregator rewrote the file with a new head_sha (because every cron
commit rotates HEAD) AND new timestamps. The watcher saw the dirty
tree and auto-committed; HEAD rotated again; next cycle repeated.

Verified failure case (test-health.json before fix):
    timestamp: 20:12:15 → 20:17:15 (5 min apart — grace expired)
    head_sha: fabe21d → 1d867f9     (rotated by previous cron commit)
    Content otherwise identical. Cycle: write → commit → rotate → write.

Deeper fix has three parts:

  PART A (this file): extend `TIMESTAMP_KEYS_DEFAULT` with the volatile
  commit-identifier fields. They were partially included for head_sha but
  the founder spec calls out `commit_sha`, `head_ref`, `git_sha`,
  `current_commit` as additional drift sources. ALL of these are masked
  out of the content comparison so two payloads that differ only by these
  ids still compare equal.

  PART A.5 (this file): the grace-refresh path is now a NO-OP when
  normalized content is identical. Previously, grace expiry forced a
  full payload rewrite (which dropped a new head_sha into the file and
  triggered a downstream auto-commit chain). The founder's spec test
  step 8 explicitly verifies that when underlying data hasn't changed,
  the tree stays clean across grace expiry. Skipping the write achieves
  that.
    - Before (session-3 / d496cdf): grace-expired + content-identical →
      `write-grace-refresh-{age}s` (file rewritten with new timestamp +
      new head_sha → dirty tree → auto-commit loop)
    - After (session-4 / phase-B): grace-expired + content-identical →
      `skip-idempotent-grace-content-unchanged-{age}s` (no write, tree
      stays clean, loop broken)
  D40 trade-off: aggregate-self-tests.py asserts `generated_at` is
  within 300s of `now`. With the new behavior the timestamp will go
  stale if no real commit lands in 5+ minutes. But D40 only runs from
  the post-commit hook (which bails on cron(routine) commits), so it
  only fires after REAL commits. Real commits almost always change
  aggregator content (= "write-content-changed" path), which DOES
  refresh the timestamp. The narrow window where D40 fails — real
  commit lands, but aggregator's underlying data didn't change, and
  previous content-write was >300s ago — is a legitimate stale signal
  worth a yellow banner rather than masking with a synthetic refresh.

  PART B (separate audit): aggregator scripts already use this helper
  (see scripts/aggregate-*.py). New aggregators must opt in.

  PART C (separate test): synthetic cycle test verifies dirty-count
  stays 0 after grace expires when underlying data is unchanged.

Public API (UNCHANGED):
    idempotent_write_json(
        path: Path,
        new_data: dict,
        timestamp_keys: list[str] = TIMESTAMP_KEYS_DEFAULT,
        grace_seconds: float = 240.0,
        indent: int = 2,
        encoding: str = "utf-8",
        ensure_ascii: bool = True,
        default = None,
    ) -> tuple[bool, str]
        Returns (wrote, reason). wrote=True when file was rewritten,
        wrote=False when skipped. `reason` is a short diagnostic suitable
        for printing (e.g. "skip-idempotent-fresh",
        "skip-idempotent-grace-content-unchanged", "write-content-changed",
        "write-no-prior-file", "write-existing-unreadable",
        "write-no-existing-timestamp").

The default `timestamp_keys` covers every top-level + commonly-nested
timestamp/volatile field in current aggregates. Nested paths are dotted
strings (e.g. "quota_status.as_of"). When a key isn't present in the
data, it's silently ignored.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# Default normalized-out keys. Top-level + commonly-nested timestamps that
# drift on every aggregator run even when underlying data is identical.
# Also includes derivatives (age_hours, age_seconds) computed as `now - as_of`
# which drift continuously even when the source `as_of` doesn't change.
#
# session-4 phase-B extension: volatile commit-identifier fields (head_sha,
# commit_sha, head_ref, git_sha, current_commit) drift every time HEAD
# rotates. Every cron auto-commit rotates HEAD, so without masking these
# values out of the content comparison the aggregator would write a new
# file every cycle — even when underlying data is identical — and the
# auto-commit loop never breaks.
TIMESTAMP_KEYS_DEFAULT: list[str] = [
    # ----- Timestamp / staleness-derivative fields -----
    "timestamp",
    "generated_at",
    "as_of",
    "snapshot_at",
    "age_hours",                           # derived `now - as_of` drift
    "age_seconds",                         # derived `now - as_of` drift
    "age_minutes",                         # derived `now - as_of` drift (cron-status)
    "_age_seconds",                        # nested derivative variant
    "_meta.age_minutes",                   # nested in approvals-pipeline.json
    "_meta.age_seconds",
    "_meta.age_hours",
    "quota_status.as_of",                  # nested in current-snapshot.json + token-usage-snapshot.json
    "quota_status.age_seconds",            # derived from as_of; drifts proportionally
    "all_time.last_event_at",              # nested in token-usage-snapshot.json
    "session_transcripts.generated_at",    # nested in token-usage-snapshot.json
    # ----- Volatile commit-identifier fields (session-4 phase-B) -----
    # These rotate on every cron auto-commit. Mask them out of the
    # content comparison so head-rotation alone doesn't trigger a
    # re-write of an otherwise-unchanged payload.
    "head_sha",                            # short SHA (most common — used by test/security/fiq)
    "commit_sha",                          # full SHA (used by scan-shipped-proposals + audit-log)
    "head_ref",                            # symbolic ref (branch name) — rarely used but possible
    "git_sha",                             # used by regen-index.py (index.html data block)
    "current_commit",                      # alternate naming convention
]


# Subset of TIMESTAMP_KEYS_DEFAULT that holds VOLATILE NON-TIMESTAMP values
# (typically commit identifiers). Exposed for callers that want to know
# which mask-out keys are commit-id style vs timestamp-style. Within the
# helper itself, these are treated identically to timestamps for the
# normalized-comparison check.
VOLATILE_NON_TIMESTAMP_KEYS_DEFAULT: list[str] = [
    "head_sha",
    "commit_sha",
    "head_ref",
    "git_sha",
    "current_commit",
]


def _set_nested(d: dict, dotted: str, value: Any) -> bool:
    """Set d[a][b][c] = value for dotted="a.b.c". Returns True if any
    intermediate key existed AND the leaf was set/cleared; False if the
    path doesn't exist (key never present in data)."""
    parts = dotted.split(".")
    cur = d
    for p in parts[:-1]:
        if not isinstance(cur, dict) or p not in cur:
            return False
        cur = cur[p]
    if not isinstance(cur, dict):
        return False
    if parts[-1] not in cur:
        return False
    cur[parts[-1]] = value
    return True


def _normalize(data: Any, timestamp_keys: Iterable[str]) -> Any:
    """Deep-copy `data` and overwrite every entry in `timestamp_keys` with
    a fixed sentinel so two snapshots that differ ONLY by timestamps will
    compare equal. Returns the normalized copy; original is untouched.
    """
    if not isinstance(data, dict):
        # Lists / scalars: nothing to normalize at top level.
        return json.loads(json.dumps(data, default=str))
    normalized = json.loads(json.dumps(data, default=str))
    sentinel = "__NORMALIZED__"
    for key in timestamp_keys:
        _set_nested(normalized, key, sentinel)
    return normalized


def _latest_timestamp(data: dict, timestamp_keys: Iterable[str]) -> datetime | None:
    """Return the most-recent timestamp value found among `timestamp_keys`.
    Skips non-ISO entries (head_sha, age fields). Used to evaluate the
    grace window — when the file's existing timestamp is within grace,
    skipping the write is safe per D40's 300-sec freshness contract.
    """
    latest: datetime | None = None
    for key in timestamp_keys:
        parts = key.split(".")
        cur: Any = data
        for p in parts:
            if not isinstance(cur, dict) or p not in cur:
                cur = None
                break
            cur = cur[p]
        if not isinstance(cur, str):
            continue
        raw = cur.replace("Z", "+00:00") if cur.endswith("Z") else cur
        try:
            dt = datetime.fromisoformat(raw)
        except ValueError:
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        if latest is None or dt > latest:
            latest = dt
    return latest


def idempotent_write_json(
    path: Path,
    new_data: Any,
    *,
    timestamp_keys: Iterable[str] | None = None,
    grace_seconds: float = 240.0,
    indent: int = 2,
    encoding: str = "utf-8",
    ensure_ascii: bool = True,
    default: Any = None,
) -> tuple[bool, str]:
    """Write `new_data` to `path` ONLY when:
      - file doesn't exist yet, OR
      - normalized content (timestamps + commit-id fields masked) differs
        from existing.

    When normalized content matches the existing file, this function
    ALWAYS SKIPS THE WRITE — even when the existing file's latest
    timestamp is older than `grace_seconds`. The `grace_seconds`
    parameter is retained for API compatibility + the
    no-existing-timestamp edge case (see below), but it no longer
    triggers a synthetic refresh on content-identical payloads.
    Rationale: see module docstring (session-4 phase-B).

    Returns (wrote: bool, reason: str). The reason string is short + safe
    for logging.
    """
    keys = list(timestamp_keys or TIMESTAMP_KEYS_DEFAULT)
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.write_text(
            json.dumps(new_data, indent=indent, ensure_ascii=ensure_ascii, default=default),
            encoding=encoding,
        )
        return True, "write-no-prior-file"

    try:
        existing_raw = path.read_text(encoding="utf-8-sig")
        existing = json.loads(existing_raw)
    except (OSError, json.JSONDecodeError):
        # Existing file unreadable -> rewrite.
        path.write_text(
            json.dumps(new_data, indent=indent, ensure_ascii=ensure_ascii, default=default),
            encoding=encoding,
        )
        return True, "write-existing-unreadable"

    new_norm = _normalize(new_data, keys)
    old_norm = _normalize(existing, keys)
    content_changed = new_norm != old_norm

    if content_changed:
        path.write_text(
            json.dumps(new_data, indent=indent, ensure_ascii=ensure_ascii, default=default),
            encoding=encoding,
        )
        return True, "write-content-changed"

    # Content identical (timestamps excluded). Decide based on grace window.
    if isinstance(existing, dict):
        latest = _latest_timestamp(existing, keys)
    else:
        latest = None
    if latest is None:
        # No timestamp to compare. Behavior depends on grace_seconds:
        #   - grace_seconds == 0 means "only write on content change"
        #     (cursor-like files with no timestamp). Skip the write.
        #   - grace_seconds > 0 means timestamps were expected; treat
        #     missing-timestamp as stale and write defensively.
        if grace_seconds <= 0:
            return False, "skip-idempotent-no-timestamps"
        path.write_text(
            json.dumps(new_data, indent=indent, ensure_ascii=ensure_ascii, default=default),
            encoding=encoding,
        )
        return True, "write-no-existing-timestamp"
    age = (datetime.now(timezone.utc) - latest).total_seconds()
    if age > grace_seconds:
        # Stale-by-grace BUT content normalized-identical.
        #
        # Session-4 phase-B root-cause-part-2 fix: the prior behavior was
        # to rewrite the full payload here so D40 would see fresh
        # `generated_at`. That meant the file was dirty on every cron
        # cycle (5-min cadence ≈ grace_seconds), and the diff included
        # a NEW head_sha (rotated by the previous cron auto-commit).
        # The downstream cron auto-committed the dirty files, rotating
        # HEAD again, perpetuating the loop.
        #
        # New behavior: SKIP THE WRITE when content is normalized-
        # identical, regardless of grace. The founder's spec test step 8
        # explicitly verifies the tree stays clean after grace expires
        # when data hasn't changed. Trade-off: D40
        # (aggregate-self-tests.py) might flag aggregators stale if no
        # real commit lands within 300s — but D40 only fires from the
        # post-commit hook (which bails on cron(routine) commits), so it
        # only runs after REAL commits, and real commits typically
        # invalidate aggregator content (= "write-content-changed" path
        # above). The window where D40 fails is when a real commit
        # lands but the aggregator's underlying data didn't change AND
        # the previous content-change write was >300s ago — rare and
        # legitimately a stale signal worth surfacing on the dashboard
        # (yellow banner) rather than masking with a synthetic refresh.
        return False, f"skip-idempotent-grace-content-unchanged-{int(age)}s"

    # Content same + timestamp fresh → SKIP write. Tree stays clean.
    return False, f"skip-idempotent-fresh-{int(age)}s"
