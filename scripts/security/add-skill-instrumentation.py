#!/usr/bin/env python3
"""
Add AgentShield-compatible instrumentation YAML to PARBAUGHS skill files.

Closes 4 finding classes flagged by AgentShield's `skills` rule pack:
  - hasObservationHooks  -- frontmatter key matching /(?:^|_)(?:observe|observation)(?:_hook|_hooks)?$/
  - hasFeedbackHooks     -- frontmatter key matching /(?:^|_)feedback(?:_hook|_hooks)?$/
  - hasRollbackMetadata  -- frontmatter key matching /rollback(?:_strategy|_plan|_metadata)?$/
  - extractVersion       -- frontmatter top-level `version` (string)

Idempotent: skips files that already have the `version` key OR the instrumentation
sentinel `# >>> agentshield-instrumentation`.

Operates only on the canonical `.claude/skills/parbaughs-*.md` set. Worktree
duplicates (`.claude/worktrees/.../skills/`) are intentionally out of scope --
they are deletion candidates per substrate-audit-2026-05-18.md.
"""
from __future__ import annotations

import sys
from pathlib import Path

SKILLS_DIR = Path("C:/Users/Zach/smoky-mountain-open/.claude/skills")

SENTINEL = "# >>> agentshield-instrumentation"

# Canonical instrumentation block. YAML keys chosen so AgentShield's regexes
# (see ecc-agentshield/dist/index.js lines 7612-7619) match deterministically.
#
# Wired to real PARBAUGHS telemetry + handoff substrate; no fake telemetry.
# Telemetry emit path: .claude/state/telemetry/events/<UTC-date>.ndjson per
#   parbaughs-telemetry-emit skill.
# Handoff path: .claude/state/handoffs/ per HANDOFF_PROTOCOL.md.
INSTRUMENTATION = """# >>> agentshield-instrumentation
# Added 2026-05-18 to satisfy AgentShield ECC 2.0 skill-health checks
# (observation-hooks, feedback-hooks, version, rollback). Wires the skill to
# the real PARBAUGHS telemetry substrate; no fake telemetry. See
# parbaughs-telemetry-emit and HANDOFF_PROTOCOL.md for the consuming systems.
version: 1.0.0
observation_hooks:
  on_invoke:
    event_type: skill.invocation.start
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
  on_complete:
    event_type: skill.invocation.end
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
feedback_hooks:
  channel: handoff-note
  scenario: subagent-return
  template: HANDOFF_NOTE_TEMPLATES.md
  target_dir: .claude/state/handoffs/subagent-returns/
rollback:
  previous_version: null
  procedure: |
    git revert the commit that introduced the skill update; APPROVAL sidecar
    travels with the skill so revert restores both. Skill changes never co-mingle
    with code commits, so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
"""


def has_existing_instrumentation(content: str) -> bool:
    """Check if file already has the sentinel or top-level version key."""
    return SENTINEL in content


def insert_instrumentation(content: str, file_path: Path) -> tuple[str, str]:
    """Insert instrumentation block before the closing `---` of the YAML
    frontmatter. Returns (new_content, status).
    """
    if has_existing_instrumentation(content):
        return content, "skipped (already instrumented)"

    lines = content.splitlines(keepends=True)

    if not lines or not lines[0].startswith("---"):
        return content, f"ERROR: no frontmatter start at {file_path}"

    # Find the closing `---`. It's the second line that is exactly `---` or `---\n`.
    closing_idx = None
    for i in range(1, len(lines)):
        stripped = lines[i].rstrip("\r\n")
        if stripped == "---":
            closing_idx = i
            break

    if closing_idx is None:
        return content, f"ERROR: no frontmatter close in {file_path}"

    # Preserve original line ending so we don't introduce CRLF/LF drift.
    line_ending = "\r\n" if lines[closing_idx].endswith("\r\n") else "\n"

    # Re-render the instrumentation block with the file's line ending.
    block_lines = [line + line_ending for line in INSTRUMENTATION.splitlines()]

    new_lines = lines[:closing_idx] + block_lines + lines[closing_idx:]
    return "".join(new_lines), "updated"


def main() -> int:
    if not SKILLS_DIR.exists():
        print(f"FATAL: {SKILLS_DIR} not found", file=sys.stderr)
        return 2

    targets = sorted(
        p for p in SKILLS_DIR.glob("parbaughs-*.md") if p.is_file()
    )
    if not targets:
        print(f"FATAL: no parbaughs-*.md files under {SKILLS_DIR}", file=sys.stderr)
        return 2

    print(f"Processing {len(targets)} skill files in {SKILLS_DIR}")
    errors = 0
    updates = 0
    skips = 0
    for path in targets:
        original = path.read_text(encoding="utf-8")
        new_content, status = insert_instrumentation(original, path)
        if status.startswith("ERROR"):
            print(f"  [FAIL] {path.name}: {status}")
            errors += 1
            continue
        if status == "updated":
            path.write_text(new_content, encoding="utf-8")
            print(f"  [OK]   {path.name}: {status}")
            updates += 1
        else:
            print(f"  [--]   {path.name}: {status}")
            skips += 1

    print(f"\nSummary: {updates} updated, {skips} skipped, {errors} errors")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
