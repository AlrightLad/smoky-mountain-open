# PARBAUGHS Ralph Loop — Next Prompt

This file is the controlling prompt for the prolonged-loop controller
(`scripts/ralph-loop.ps1`). The controller re-invokes Claude Code with
this prompt each cycle. Update this file to redirect the agent without
restarting the loop.

**Default directive (per Founder mandate 2026-05-23):**

You are running in a prolonged Ralph loop. Per
`feedback-prolonged-loop-until-waves-complete` memory:

1. Read `.claude/state/loops/LOOP_JOURNAL.md` to know what the prior
   cycle did.
2. Pull the next concrete item from this priority stack:
   - **a. Roadmap execution** — `docs/agents/ROADMAP.md` +
     `docs/SHIP_INDEX.md` + `docs/agents/ships/*.md`. Wave 1 → 4.
     Don't wait for design-bot; implement directly.
   - **b. Peer-critique loop** — score each surface against Linear /
     Stripe / Vercel / Datadog / Sentry / Plausible / Cloudflare /
     Supabase / PostHog + 18Birdies / Hole19 / TheGrint. Diagnose
     shortfalls. Implement fixes.
   - **c. Enterprise-grade brutal critique** — compete at enterprise
     SaaS level. Where short, diagnose how to compete at this level
     + fund level. Implement.
   - **d. App Health "how to improve"** — any partial / planned row
     in `docs/reports/app-health.html` becomes the next ship.
   - **e. Health-score lift** — push toward A (90) / A+ (95).
3. Execute the chosen item end-to-end:
   - Code change + tests + visual regression bless + commit + deploy
     to staging.
   - Always-green guardrails: tree clean, approval pipeline GREEN,
     0 credential leaks, App Health ≥ A-.
4. Append a one-line entry to `LOOP_JOURNAL.md` describing what
   you did + the commit SHA.
5. End your message with continuing language so the loop fires
   again. Do not pause.

**Hard limits (still respected even in autonomous loop):**

- AMD-018 11-gate (deploys, credentials, force-push to main, etc.)
  still requires Founder pre-authorization. Surface those to
  `task-queue/founder/` and continue with non-gated work.
- If a session-level limit is hit (context, tokens, account quota):
  the controller's outer loop survives — just commit + exit with
  status, next cycle fires fresh.

**Resume context after compaction:**

The Ralph controller is at `scripts/ralph-loop.ps1`. It expects:
- Claude Code CLI installed + authenticated
- `cmd_template`: `claude --print --resume "$prompt"`
- Cycle delay: 30s between iterations (tunable)
- Journal: `.claude/state/loops/LOOP_JOURNAL.md`
- Exit-on-failure: false (loop survives a single bad cycle)
