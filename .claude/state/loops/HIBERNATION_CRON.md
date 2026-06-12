# Hibernation Coding cron

> Founder-requested 2026-06-11 (~23:33 EDT), before bed: "mainly just used
> for when I am sleeping to ensure you keep working." A silent safety-net
> loop that re-kicks the marathon every ~30 min if the main session stalls
> or is rate-limited.

## Toggle contract (Founder voice commands)

- **"queue hibernation coding cron job"** → create the recurring cron (below).
- **"stop hibernation coding cron job"** → CronDelete it (and any test crons).

## What it is

- **Job:** recurring CronCreate, schedule `17,47 * * * *` (every 30 min, off
  the :00/:30 marks). Session id this run: `2a64fe8d`.
- **Silent:** the fired prompt forbids PushNotification — it just makes Claude
  keep building/shipping. The Founder is never pinged.
- **Prompt:** re-engages the marathon — TaskList + memory, then drain the queue
  (his reported items, per-page 9.5 review, data-integrity), build → smoke
  (31/31) → version-trio bump → commit → push main → push-staging → staging
  hosting deploy → regen → next. Never stop except on explicit "stop" or a true
  all-fronts block.

## How it satisfies "retry every 30 min if rate-limited"

Claude Code rate limits *pause* the session (the REPL stays alive). The cron
fires only when the REPL is idle, so after a limit window clears, the next
:17/:47 fire re-kicks the work. If a fire is itself rate-limited, the following
fire (~30 min later) retries — exactly the requested behavior.

## Known limitation (honest)

CronCreate reported **session-only** here (durable:true did not persist to
`.claude/scheduled_tasks.json`). So the cron survives a rate-limit *pause* but
NOT a full process exit / machine shutdown. If true cross-restart resilience is
needed, the external `scripts/ralph-loop.ps1` (Windows Task Scheduler) is the
fallback — not armed here to avoid a second Claude instance editing the repo
concurrently with the live session.

## e2e test

One-shot test cron `ed367afe` scheduled 23:36 EDT to fire once and confirm the
wake-loop re-invokes Claude end-to-end. Confirmed: see LOOP_JOURNAL / this run.
