# App Audit Findings — Security (A3)

**Authored:** 2026-05-20T23:55Z by Goal 2 audit (audit-spec-2026-05-19).
**Dimension:** A3 — Security posture.
**Source:** `.claude/state/security/baseline-20260519-031500/agentshield-post-cleanup.txt` (latest AgentShield baseline).
**Score:** 80 / 100 — Grade B.

## Headline

**0 CRITICAL · 20 HIGH · 7 MEDIUM · 1 LOW** at session-4 baseline. Re-scan 2026-05-20T07:01Z confirmed **0 CRITICAL** preserved (Grade B 77/100, +1 HIGH from session-4).

## Open findings (Founder triage)

### HIGH (carry-over from session-4)

1. **Overly permissive allow rules** — `Bash(curl *)` allows unrestricted HTTP requests in `settings.json` + `settings.local.json`.
   - WHERE: `settings.json` + `settings.local.json` `allowedTools` array
   - WHAT-ACTION: tighten to specific URLs / domains OR move to deny list. Decision document at `task-queue/founder/policy-overpermissiveness-ratification.md` already ratified the current state per Founder. Optional further tightening.

2. **Hook disables logging** — `>/dev/null 2>&1` in `hooks/gate-bash-edit.sh:57`.
   - WHERE: `.claude/hooks/gate-bash-edit.sh:57`
   - WHAT-ACTION: Redirect stderr to a log file instead of discarding. Documented as accepted in `task-queue/founder/d31-zero-critical-decision.md`.

### MEDIUM (6, accepted per substrate)

3. **Missing deny rules** — `settings.json` does not block `sudo`, `chmod 777`, `ssh`, `> /dev/`.
   - WHAT-ACTION: Founder decision — accepted per AMD-018 11-gate's existing protections.

### LOW (1)

4. **No Stop hooks** — `settings.json` lacks Stop-hook for session-end verification.
   - WHAT-ACTION: Add `Stop` hook to enforce session-end checks if desired (e.g., `git status --porcelain` non-empty WARN).

## Scope-cut

This audit captures **AgentShield static-scan** state only. The following deeper security checks are deferred to follow-on ships:

- OWASP Top 10 manual review of `src/core/data.js` + `functions/index.js`
- Firestore rules coverage matrix (per AMD-018 #2 deploy gate, audit possible but apply requires Founder pre-auth)
- Bundle-exposure scan for PII / secrets in `public/` and `dist/`
- Authentication flow audit (Google OAuth + invite-link claim flow)
- Rate-limit audit on the 8 Cloud Functions

Each deferred check has a corresponding "not-measured" treatment in the App Health tab.

## Status

**GREEN** — 0 CRITICAL preserved across multiple sessions; HIGH findings are policy choices, not credential leaks or RCE. Per AMD-028 Security bubble: no veto.
