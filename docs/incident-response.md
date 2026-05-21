# PARBAUGHS Incident Response Playbook

**Authored:** 2026-05-21 by Goal 2 audit (A12 Operational +8 score).
**Status:** v1 draft — battle-test on the next real incident; revise.
**Lives:** here. Pinned via dashboard.html footer + app-health.html findings list.

## Severity ladder

| Level | Definition | Examples | Response | Notification |
|---|---|---|---|---|
| **SEV-1** | App down for all members OR data loss in progress OR security breach in progress | Firebase Auth offline; Firestore rules rolled back exposing PII; Cloud Function error rate 100% | **Founder paged immediately** + all hands; agent halts all non-incident work; comms to members ≤ 30 min | Email + SMS Founder; Discord PARBAUGHS channel if active |
| **SEV-2** | Major feature broken OR significant degradation OR security HIGH finding | Wager flow broken; scorecard share-card fails; Cloud Function error rate >10% | Founder notified within 1h; agent prioritizes fix as next ship; member comms only if user-visible >2h | Email Founder; Discord channel |
| **SEV-3** | Minor feature broken OR cosmetic OR security MEDIUM | One league's standings stale; calendar dot color wrong; missing aria-label on one button | Triage on next dashboard sweep; agent addresses in normal queue | Logged to dashboard; no proactive notification |

## On-call rotation

**Current:** PARBAUGHS has a 1-person team (Founder Zach) + autonomous agent substrate. There is no formal on-call rotation.

**De facto coverage:**
- SEV-1 detection: Cron watcher + dashboard regen run every 5 min. If those break, the dashboard `working_tree` card flips red within ~10 min.
- SEV-1 alerting: NOT YET WIRED — see A12 Operational improvement plan. Founder relies on visual dashboard check.

**Action item:** Wire Sentry (free tier) + alert to Founder email on `error.fatal` events from `src/core/firebase.js` + `functions/index.js`. Estimated 2-3h ship.

## Comms templates

### Member-facing (SEV-1 outage)

```
PARBAUGHS is experiencing an issue affecting [round logging / wagers / scorecard / etc.].
We're investigating right now. ETA for an update: 30 min.

If you have an unfinished round, your data is safe (Firestore is real-time durable).
We'll post an all-clear in the league chat as soon as we've confirmed the fix.

— Zach
```

### SEV-2 acknowledgment (Founder → member who reported)

```
Thanks for the report. I see the issue: [brief diagnosis]. Already on it — should
be resolved in the next [scoped] ship. I'll DM you when it's live.
```

### Postmortem template (within 48h of SEV-1)

```markdown
# Postmortem — [Incident name] — [Date]

## Summary
[1-2 sentences: what broke, how long, who was affected]

## Timeline (UTC)
- [HH:MM] First signal / member report
- [HH:MM] Acknowledged
- [HH:MM] Root cause identified
- [HH:MM] Fix shipped
- [HH:MM] All-clear posted

## Root cause
[The actual bug. Be specific. File:line if possible.]

## Why our process didn't catch it earlier
[Honest reflection: missing test? missing monitoring? assumption?]

## What we changed (or are changing)
- [Concrete commit / PR / ship that addresses the gap]
- [Monitoring or test added]

## Did we follow the playbook?
[Yes / no / partially — and what we'd do differently]
```

## Decision trees

### Discovery of a SEV-1

1. **Stop all non-incident agent work.** Halt active /goal if necessary.
2. **Confirm severity** — is data actively at risk? If yes, escalate within 5 min.
3. **Communicate** — post member-facing template to league chat / Discord.
4. **Diagnose** — read dashboard, recent commits, error logs, watcher state.
5. **Fix** — smallest possible change. AMD-018 11-gate still applies for deploys.
6. **Verify** — V1 the fix at desktop + mobile viewport.
7. **All-clear** — post to members.
8. **Postmortem** — within 48h, doc as `.claude/state/incidents/YYYY-MM-DD-{slug}.md`.

### Discovery of security HIGH/CRITICAL

1. **Do not deploy** until triaged. Hold any in-flight deploy.
2. **AgentShield scan** — confirm the finding + reproduce.
3. **Surface to Founder** if CRITICAL — `task-queue/founder/security-incident-{date}.md`.
4. **Patch** — agent applies fix following AMD-018 11-gate (rules deploy needs pre-auth).
5. **Re-scan** — confirm zero CRITICAL before resuming normal work.

## What we DON'T yet have (improvement plan)

These are A12 Operational gaps the audit surfaces:

- [ ] Sentry / error tracking wired (free tier, ~2-3h to set up)
- [ ] PagerDuty / Opsgenie / similar alerting (not needed at 1-person scale; revisit when team grows)
- [ ] Status page for members (parbaughs.com/status — needed once we have 50+ members)
- [ ] Runbook for each Cloud Function (joinLeague, validateInvite, etc. — one section each)
- [ ] Backup + restore drill (quarterly Firestore export + verified restore)

## Where to look during an incident

| Surface | URL | What it tells you |
|---|---|---|
| Dashboard | `docs/reports/dashboard.html` | System health row · approvals pipeline · recent ships · token meter |
| App Health | `docs/reports/app-health.html` | Brutal-honest grade across 12 dimensions + what needs attention |
| Activity feed | `docs/reports/activity.html` | Every commit + handoff with timestamps |
| Watcher last run | `.claude/state/heartbeats/watcher-last-run.json` | Was the cron alive in the last 5 min? |
| Approvals pipeline | `.claude/state/aggregates/approvals-pipeline.json` | Pipeline status + recent watcher errors |
| Smoke test output | `tests/e2e/test-results/` | Last Playwright run details |
| Firebase console | console.firebase.google.com/project/parbaughs | Production state if it's a prod issue |

## Cross-reference

- AMD-018 — 11-gate production-risk boundary (deploys, force pushes, App Store actions)
- AMD-019 — dashboard freshness per commit
- AMD-020 — auto-clean dirty tree protocol
- App Health A12 dimension findings — `task-queue/founder/app-audit-findings-*.md` (when authored)
