"""Shared idempotent JSON writer for aggregate + regen scripts.

Root-cause fix 2026-05-19: every regen run was re-writing aggregate JSON
files with a NEW `generated_at` / `timestamp` even when underlying data
was unchanged. The post-commit hook fires ~18 regen scripts on every
commit, including its own auto-commit recursion — so each commit produced
a ~5-second dirty-tree window. The cron watcher (5-min cadence) saw
that window as "dirty" and surfaced `dirty (13 files) · watcher cycling`
on dashboard.html even when the tree was actually clean by the time
Founder loaded the page.

Fix: aggregator + cache writers compare the NORMALIZED content (timestamps
excluded) against the existing file. When meaningful content is identical
AND the existing file's timestamps are still within the "fresh enough"
grace window, skip the write entirely — so the tree stays clean across
post-commit hook fires.

D40 freshness contract: aggregate-self-tests.py asserts each aggregator's
`generated_at` is within 300 seconds of `now`. Our grace window is 240s
(under the D40 threshold) so the aggregator WILL refresh the timestamp
just before D40 would flag it stale.

Public API:
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
        for printing (e.g. "skip-idempotent-fresh", "write-content-changed",
        "write-no-prior-file", "write-grace-refresh", "write-content-changed-and-grace").

The default `timestamp_keys` covers every top-level + commonly-nested
timestamp field in current aggregates. Nested paths are dotted strings
(e.g. "quota_status.as_of"). When a key isn't present in the data, it's
silently ignored.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# Default normalized-out keys. Top-level + commonly-nested timestamps that
# drift on every aggregator run even when underlying data is identical.
# Also includes derivatives (age_hours, age_seconds) computed as `now - as_of`
# which drift continuously even when the source `as_of` doesn't change.
TIMESTAMP_KEYS_DEFAULT: list[str] = [
    "timestamp",
    "generated_at",
    "as_of",
    "snapshot_at",
    "head_sha",                            # also drifts on every commit
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
      - normalized content (timestamps masked) differs from existing, OR
      - normalized content matches but existing latest-timestamp is older
        than `grace_seconds` (so D40 freshness threshold doesn't trip).

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
        # Stale: refresh timestamp so D40 doesn't flag.
        path.write_text(
            json.dumps(new_data, indent=indent, ensure_ascii=ensure_ascii, default=default),
            encoding=encoding,
        )
        return True, f"write-grace-refresh-{int(age)}s"

    # Content same + timestamp fresh → SKIP write. Tree stays clean.
    return False, f"skip-idempotent-fresh-{int(age)}s"
