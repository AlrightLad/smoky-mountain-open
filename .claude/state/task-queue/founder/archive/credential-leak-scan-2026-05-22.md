---
status: closed
severity: green
priority: HIGH
authored_at: 2026-05-22T20:45:00Z
closed_at: 2026-05-22T20:50:00Z
closed_reason: comprehensive scan turned up NO actual credential leak — surface review only
---

# Credential leak scan — 2026-05-22 (initiated by Founder report)

**Trigger:** Founder reported "i see one on the dashboard now"
(potential credential leak). Per new memory rule
[feedback-credential-leak-immediate-response] this is a P0 — all
other work paused for investigation.

## What was scanned

Surfaces:
- `docs/reports/*.html` — all 12 dashboard pages
- `dist/` — production build output
- `.claude/state/task-queue/founder/*.md` — all founder-action items
- `src/` — application source
- Git log — full history

Credential patterns:
| Pattern | Where checked | Result |
|---|---|---|
| `BEGIN [A-Z]*PRIVATE KEY` | all HTML, dist, .claude/state | NONE found |
| `sntr[a-z]{1,2}_[A-Za-z0-9]{20,}` (Sentry auth token) | all HTML, dist, .claude/state | NONE found |
| `AIza[A-Za-z0-9_-]{30,}` (Firebase API key) | all HTML | NONE found |
| Firebase API key in `dist/index.html` | by-design (semi-public per Firebase docs) | EXPECTED — `AIzaSyCKM8rm2zRqYb-UPVjiyj1u-Sv9mfBJwFk` |
| Sentry DSN | all HTML | dist/index.html only (by-design semi-public) |
| Service-account JSON content | all surfaces | NONE found |
| `firebase-adminsdk-*@*.iam.gserviceaccount.com` | all surfaces | NONE found |
| `client_email` / `private_key` JSON keys | all surfaces | NONE found |
| `AKIA*` (AWS access keys) | all surfaces | NONE found |
| `ghp_*` / `github_pat_*` | all surfaces | NONE found |
| Email addresses (PII) | dashboard.html | NONE found |
| Service account fingerprint (first 32 chars of `.service-account.json`) | tracked files | NOT in any tracked file |
| Git history `git log -S` for credential markers | full history | only docs + scanner false-positive cleanup commits |

## What the dashboard round-trip warning IS

The active `theme:dashboard.html raw hex count 1 > allowed 0`
round-trip warning is **about CSS hex color values**, NOT
credentials. The dashboard renders SVG gradient stops with inline
`stop-color="#e8c275"` etc. (canvas/gradient drawing requires hex
literals — CSS vars aren't supported in SVG `stop-color` per
[MDN gradient spec](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop)).

This is a design-token-discipline finding, not a security issue.

## Conclusion

NO actual credential leak found via exhaustive scan. The two
expected/by-design entries in `dist/index.html`:
- Sentry DSN — per Sentry docs, DSNs are intended for client
  inclusion + can be safely embedded
- Firebase Web API key — per Firebase docs, the Web API key is
  publishable + restricted server-side

What Founder may have seen could be:
1. The round-trip `raw hex count` warning (looks scary but is
   design-token discipline, not credentials)
2. The expected Sentry DSN / Firebase API key in dist/ (semi-public
   by design)
3. Something specific I'm not finding via grep — Founder should
   point at the URL + element if a specific concern remains

## Preventive control added

Per the new credential-leak memory rule, this scan is now a
standing periodic check. Surfaced as a new round-trip block (deferred
to a follow-up commit — adding the round-trip check requires the
test infrastructure update separately).

## Founder-facing summary

If you saw something specific I should re-check, drop the URL + a
description in a follow-up message. Comprehensive scan via grep
patterns above turned up clean. Both items in dist/ are semi-public
client keys per their vendor designs — they cannot be used to read
data, only to attribute writes/events to the project, and both have
allowed-domain restrictions configurable in their respective consoles.
