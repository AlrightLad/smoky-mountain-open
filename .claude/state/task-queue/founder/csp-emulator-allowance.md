---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-05-22T16:25:00Z
authored_by: claude-code
related_findings: .claude/state/task-queue/founder/app-audit-findings-testing.md
---

# Founder action — Approve CSP allowance for Firebase emulator + Firebase Auth iframe

**Surfaced:** 2026-05-22 by A11 smoke diagnostic (Goal 2 finding follow-on).

## What I found

Smoke test 54-failure pattern (`auth/network-request-failed`) has been
investigated to ground-truth root cause. The earlier-suspected
"localhost vs 127.0.0.1" issue was a real but **secondary** problem; I
fixed it in this session (3 test files updated). The **primary** load-
bearing root cause is CSP:

The current `index.html` `connect-src` directive does NOT include the
local Firebase emulator endpoints. When Playwright tests load the app
at `http://localhost:5173/?emulator=1`, the page-side Firebase SDK
calls `auth.useEmulator("http://127.0.0.1:9099")` followed by
`signInWithCustomToken(token)`. The browser rejects the resulting
fetch with:

```
Connecting to 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/...'
violates the following Content Security Policy directive:
"connect-src 'self' https://*.googleapis.com https://*.gstatic.com
https://*.firebaseapp.com https://*.firebasestorage.app
https://*.firebaseio.com https://*.cloudfunctions.net
https://api.golfcourseapi.com https://*.open-meteo.com
https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io
https://*.ingest.sentry.io wss://*.firebaseio.com"
```

The fetch never reaches the network — the browser blocks at CSP-enforce
time. That's why Playwright traces show ZERO requests to `:9099`.

Secondary CSP violation also observed (does not block smoke today but
worth fixing alongside): the Firebase Auth compat SDK loads an iframe
helper from `https://apis.google.com/js/api.js`. This is blocked under
the current `script-src` directive because `apis.google.com` is not in
the allowlist (the directive currently allows `*.googleapis.com` + a
few others). Production app likely tolerates this because the OAuth /
popup flows fall back to alternative methods; smoke runs land in the
same failure surface.

## Proposed change (1-line edit to index.html)

Append the following entries to the CSP directives in the
`<meta http-equiv="Content-Security-Policy" content="...">` tag in
`index.html`:

| Directive | Add | Reason |
|---|---|---|
| `connect-src` | `http://127.0.0.1:8080 http://127.0.0.1:9099 http://127.0.0.1:5001 http://localhost:8080 http://localhost:9099 http://localhost:5001` | Allow page to fetch Firebase emulator (Firestore 8080, Auth 9099, Functions 5001) under loopback. Production app never connects to these because emulator only runs locally during `npm run test:e2e`. |
| `script-src` | `https://apis.google.com` | Firebase Auth compat SDK loads `apis.google.com/js/api.js` for iframe helper. Production app already uses Firebase Auth — this script gets loaded today and fails silently; the production fallback works but ideally CSP should allow it. |

## Risk analysis

### connect-src additions (loopback)

| Concern | Assessment |
|---|---|
| Attacker exploitation in production | Loopback (127.0.0.1 / localhost) is non-routable from the internet. An XSS attacker who injects script CAN attempt fetches to local services, but only on the user's own machine. Members are 20 friends on phones — they don't run dev services on 8080/9099 — so the practical risk is near-zero. |
| Internal-network attacks | Loopback only, NOT private network ranges (no 10.x, 192.168.x, 172.16.x). Cannot reach the user's router or office network from CSP. |
| Production attack surface | Unchanged — production deployment has no service on 127.0.0.1:9099/8080/5001. |
| Smoke restoration value | HIGH — without this, full smoke suite stays at 54 failing tests. With it, smoke suite likely restores to GREEN. |

### script-src addition (apis.google.com)

| Concern | Assessment |
|---|---|
| Attacker compromise of apis.google.com | Google-owned, S-tier trust target. If apis.google.com is compromised, the wider internet is already compromised. |
| Specific subdomain | `apis.google.com` is the OAuth iframe origin; it's a stable Google service that hasn't changed in 10+ years. |
| Already in active use today | The app already DEPENDS on this script silently (Firebase Auth iframe helper). CSP is currently blocking a feature that production users may not have noticed. |

## Why I'm surfacing, not committing

Per audit-spec change-authority section: "Most app-behavior changes
will surface to task-queue/founder/ because they fail the 'would I let
this commit land?' Security bubble check on first audit." CSP changes
are explicitly security-posture changes; recursion-breaker says agent
does not self-approve security expansion even when justifiable.

The earlier Sentry CSP change (this session, commit 7a417d0b) added
`*.ingest.us.sentry.io` etc. without surfacing because it was part of
the Phase 2 ship Founder pre-authorized. This change is for a
different purpose (development/test affordance + Auth iframe helper)
and is NOT in a Founder-pre-authorized walkthrough — so it surfaces.

## How to approve (~30 seconds)

Either:

**(A) Approve via in-this-file write.** Add a line below this section:

```
APPROVED-CSP-EMULATOR-2026-05-XXTXX:XX:XXZ
```

The next session reads the approval and applies the 2-directive change
+ runs smoke to confirm restoration.

**(B) Approve verbally** in next Claude Code session — same outcome.

**(C) Hold + iterate** if you'd prefer different directive shape (e.g.,
restrict to `http://localhost:*` instead of broad loopback, or fold
into a separate dev-only CSP swap):

```
HOLD: <reason>
```

## Outcome if approved

- Next session: apply CSP edit to `index.html` (1 line, additive)
- Run `npm run test:e2e` — expect 54-failure pattern to resolve
- Update `task-queue/founder/app-audit-findings-testing.md` —
  CRITICAL row #1 closes
- Goal 1 D5 YELLOW → GREEN
- Goal 2 A11 score moves from ~50 toward 75+
- Caddy Notes: "Behind-the-scenes: test suite runs cleanly again."
  (INFRA tag)

## What's NOT blocked by this surface

- This session's Phase 2 Sentry ship (already landed)
- PROP-011 (already authored)
- The firebase-admin localhost→127.0.0.1 cleanup (committed
  separately in this session as a principled fix even though not
  load-bearing for smoke restoration)
- Any other audit work that doesn't touch smoke
