# Completed task archive

Tasks that finished (either `completed` or `rejected`) live here
permanently. This is the audit trail.

## Lifecycle

When an agent completes a task:
1. Update frontmatter `status:` to `completed` or `rejected`.
2. Append `## Findings` section to the body.
3. Move the file here, preserving its original filename:
   ```bash
   mv .claude/state/task-queue/<source-agent>/<task-id>.md \
      .claude/state/task-queue/completed/<task-id>.md
   ```

Filenames preserve `task_id` so audit queries can grep by ID. Frontmatter
preserves `from_agent` + `to_agent` so the audit trail shows who
assigned what to whom.

## Querying

```bash
# What did dashboard agent complete this week?
grep -lE 'to_agent: dashboard' .claude/state/task-queue/completed/*.md | \
    xargs grep -lE 'status: completed' | \
    xargs grep -lE 'created_at: "?2026-05-' | head

# What got rejected, and why?
grep -lE 'status: rejected' .claude/state/task-queue/completed/*.md | \
    while read f; do
        echo "=== $f ==="
        sed -n '/^## Findings/,/^## /p' "$f"
    done
```

## Cleanup

Do NOT delete files from this directory except via Founder-authorized
cleanup (e.g., after a year, archive to a tarball). The audit trail is
load-bearing for retrospectives.
