---
id: AMD-008
title: apply-amendments.sh edit-section substring-fallback must be bounded
target_canonical_path: .claude/scripts/apply-amendments.sh
source_draft_path: .claude/state/amendments/pending/AMD-008-edit-section-bounded-fallback.md
scope_summary: Bug fix for edit-section type. When section_anchor matches a non-heading line via substring fallback, current logic deletes from anchor to end-of-file (because end_idx defaults to len(lines) when start line isn't a heading). Result: AMD-002 application against CRON_CONFIGURATION.md deleted Section 12 + footer alongside the intended 3-line threshold prose. Fix bounds the substring-fallback splice to ONLY the matched line (most conservative), with future enhancement to detect a prose-paragraph boundary.
type: replace-existing
section_anchor: null
depends_on: []
authored_by: claude-code
authored_at: 2026-05-14T02:25:00Z
bubble_of_record: null
estimate_tokens_to_apply: 1200
rollback_strategy: git revert; apply-amendments.sh is a script, safe to roll back. The aftermath fix to CRON_CONFIGURATION.md (restoration of Section 12) is independent of this AMD and is already landed.
status: pending
---

# AMD-008 — apply-amendments.sh edit-section bounded-fallback

This is a SCRIPT FIX, not a governance protocol change. Type is
`replace-existing` because the entire script needs the corrected
edit-section function inlined; safer than `edit-section` against itself
(meta-amendment risk).

## What this fixes

In `apply-amendments.sh` (line ~339-358), the edit-section logic has
this flow:

1. Try regex match: anchor as a heading line.
2. Try substring match: anchor inside a heading.
3. **Fallback:** substring match in ANY line.
4. Find `end_idx`: scan forward for next same-or-higher heading.
5. Splice: replace lines[start_idx : end_idx] with body.

The bug: step 4 runs `if start_line.strip().startswith("#")`. When the
anchor matched via step 3 (non-heading line), `start_line` is NOT a
heading, so the `if` is False, `end_idx` stays at `len(lines)`, and
the splice deletes from anchor to end-of-file.

Concrete failure (2026-05-14): AMD-002's anchor `"For cron-specific
thresholds"` matched line 614 in CRON_CONFIGURATION.md (prose, not
heading). `end_idx` became `len(lines) = 656`. The splice replaced
lines 614-656 (including unintended Section 12 + footer).

## Fix (proposed)

When anchor is matched via prose-fallback (non-heading line), bound
the splice to ONLY the matched line. This is the most conservative
behavior — the AMD body REPLACES the one anchor line and nothing else.
If the AMD author wants multi-line replacement against a prose anchor,
they must use sentinel comments in the target file (e.g.,
`<!-- AMD-ANCHOR: id -->`) and the script will treat sentinel markers
as bounded spans.

```python
elif amd_type == "edit-section":
    # ... existing anchor-finding logic ...

    start_line = lines[start_idx]
    if start_line.strip().startswith("#"):
        # Heading match: replace from heading to next same-or-higher heading
        start_level = len(start_line) - len(start_line.lstrip("#"))
        end_idx = len(lines)
        for j in range(start_idx + 1, len(lines)):
            if lines[j].strip().startswith("#"):
                jlevel = len(lines[j]) - len(lines[j].lstrip("#"))
                if jlevel <= start_level:
                    end_idx = j
                    break
    else:
        # Prose-fallback match: replace ONLY the matched line.
        # If multi-line replacement is needed against prose, AMD author
        # must use sentinel comments (future enhancement: AMD-ANCHOR-BEGIN
        # / AMD-ANCHOR-END pairs).
        end_idx = start_idx + 1

    spliced = "".join(lines[:start_idx]) + body + ("\n" if not body.endswith("\n") else "") + "".join(lines[end_idx:])
```

## Also: Critic gate addition

Round-trip test should add a sanity check on edit-section AMDs:
- Before applying AMD-N (in test workspace), record sha-256 of target.
- After applying, sha-256 of target should differ ONLY in expected line
  ranges (compute via diff hunks).
- Flag if the change exceeds a reasonable budget (e.g., > 30 lines
  changed when AMD body is < 30 lines).

This is preventive. The AMD-002 case would have failed this check (3
lines of AMD intent vs 42 lines of net change in the target).

## Cross-references

- Aftermath fix in CRON_CONFIGURATION.md (Section 12 restored): commit
  immediately following AMD-002 application.
- AUTONOMOUS_FAILURE_RECOVERY v8.3 (locked via AMD-004): pattern for
  detect-and-fix when an apply succeeds-but-wrong.
- `tests/round-trip-test.py` [amendments] section: extension target for
  the size-budget Critic gate.
