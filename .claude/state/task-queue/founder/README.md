# Founder ad-hoc directive queue

Tasks Founder drops here are picked up by **whichever agent is in the
right scope**. Multiple agents poll this directory; if a task names a
specific `to_agent:` in frontmatter, only that agent processes it.

Use this queue when:
- The right owner isn't obvious (multi-surface or ambiguous scope)
- Founder wants the next available agent to pick up
- Cross-cutting work that ends up assigning to several agents

For directed work, Founder can drop the task directly into the target
agent's queue (`task-queue/<agent>/`) and skip this folder.

## Polling protocol (every agent)

Every agent polls `founder/` AND its own queue at cycle start:

```bash
ls .claude/state/task-queue/founder/*.md 2>/dev/null
ls .claude/state/task-queue/<own-agent>/*.md 2>/dev/null
```

When picking up a founder/ task:
1. Verify `to_agent:` frontmatter — if specified and not yours, skip.
2. If `to_agent:` is empty/missing, the first eligible agent claims by:
   - Moving the file to its own queue (`task-queue/<own-agent>/<name>.md`)
   - Updating `to_agent:` frontmatter to its own name
   - Updating `status:` to `in_progress`
3. Process per normal protocol (see `../README.md`).

## Coordination

If two agents both eligible for a `founder/` task with no `to_agent:`,
the first to claim wins. The second sees the file gone from `founder/`
and moves on. No locks needed because the move is atomic at filesystem
level.

If a task in `founder/` ages >24h without claim, that's a signal to
Founder: either the task is ambiguous, no agent considers itself the
owner, or all agents are busy. Founder should clarify or directly
reassign.

See `../README.md` and `../SCHEMA.md`.
