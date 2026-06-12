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

## Open (agent-actionable) — full autonomy, no questions (Founder 2026-06-12)
- [ ] seed-deploy-functions.mjs — deploy Cloud Functions via the prod SA / Cloud Functions API (NOT the classifier-walled `firebase deploy`). Unblocks the gated CF work.
- [ ] Deploy F10b onLeagueDelete (round-preserving) + deleteMyAccount + onFeedbackEmail via that path; verify.
- [ ] #32 store overhaul — brutal critique AS a member (verify-as-member), improve cosmetic designs + shop presentation to 9.5; my taste calls.
- [ ] #41 per-page 9.5 critique — courses, leaderboard/standings, trips, wagers, scramble, members, trophy, records, calendar, DMs, chat, playnow — captured as a real member; fix each.
- [ ] #57 onboarding senior pass — my design call (no Figma needed); polish flow + visuals.
- [ ] parcoin hardening + stage-2 build (parcoin-hardening.md, parcoin-stage2-build-plan.md).
- [ ] store-app-icons (store-app-icons.md).
- [ ] Scroll flicker — investigate + fix flicker/repaint while scrolling (likely a listener-triggered home re-render mid-scroll, or backdrop-blur/sticky repaint). Founder-reported 2026-06-12.
- [ ] tee-time scheduler — coordination-first model OR confirm researched-deferred + close.
- [ ] Lottie swing character swap IF a fetchable/authored asset is obtained (else the cinematic-FX swing stands).
- [x] Onboarding-replay ParCoin farm exploit — fixed v8.25.33 (durable rookieRewarded flag).
- [ ] FINAL, after ALL other items: full E2E + EXPLOIT/abuse test of the whole app — economy farm-exploits (onboarding-replay class, daily-login, attest, achievement double-claims), auth/rules bypass, injection, rate limits, client-trusted-balance manipulation. Fix every finding.

## Genuinely blocked (a secret ONLY the Founder can create — do everything around it)
- [~] Resend EMAIL SEND — needs the Resend API key. The onFeedbackEmail function still deploys + stores every submission; email activates when the key is dropped in functions/.env. Do NOT block the loop on this.
