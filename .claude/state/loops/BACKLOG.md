# PARBAUGHS marathon backlog — Stop-hook source of truth

The Stop hook (`.claude/hooks/stop-continue.sh`) reads THIS file. In marathon
mode it blocks the agent's turn-end while any `- [ ]` item below is open, so the
agent keeps draining the queue without the Founder re-poking it. Mark items
`- [x]` as they ship; when all open items are done the hook allows stopping
("no backlog, no need to prompt" — Founder 2026-06-12).

## Control flags (in this dir)
- **CONTINUE** — present = unattended marathon mode ON (hook active). Absent =
  inert (interactive sessions stop normally). Agent creates it when the Founder
  says "go / marathon / keep working unattended"; removes it when the backlog is
  truly clear or the Founder returns.
- **STOP** — present = hard stop, always allowed (overrides everything). Founder
  or agent drops this file to halt immediately.
- Circuit breaker: if HEAD doesn't advance (no commit) for 30 consecutive
  blocked turns, the hook allows a stop anyway (logged to `cb.log`) so a stuck
  loop can't spin forever.

## ONLY list agent-actionable items as `- [ ]`
Founder-gated items (need a secret / his taste / a classifier-walled deploy) go
under "Blocked on Founder" so the hook never traps the agent on work it cannot
finish.

## Open (agent-actionable)
<!-- populate when a marathon begins; e.g.:
- [ ] #41 per-page 9.5 critique — next page: courses (capture via _cap-auth)
- [ ] #30 commissioner-kit completeness check + finish
-->

## Blocked on Founder (NOT counted by the hook)
- [~] #44 Resend email — needs Founder's Resend API key + a `firebase deploy --only functions`
- [~] #57 Figma onboarding — needs Founder's design intent from the Figma Make link
- [~] #32 store "designs not good enough" — needs Founder's specifics (which pieces)
- [~] #35 multi-league F10b/F10a — needs a classifier-walled functions deploy (code ready)
