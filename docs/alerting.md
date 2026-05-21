# PARBAUGHS Alerting Configuration

**Authored:** 2026-05-21 (Goal 2 A12 Operational +8 score).
**Status:** v1 — defines the alerting routes for SEV-1/2/3 events. Some channels are placeholders pending Founder activation (Sentry DSN, Firebase Cloud Messaging admin emails).

## Severity → channel routing

| Severity | Channel | Destination | Response SLA |
|---|---|---|---|
| **SEV-1** (app down / data loss / breach) | Email + SMS | Founder direct (zach@) | < 15 min ack |
| **SEV-2** (major feature broken / sec HIGH) | Email | Founder direct (zach@) | < 1 hour ack |
| **SEV-3** (cosmetic / minor) | Dashboard | `docs/reports/dashboard.html` | Next sweep |

## Alert sources

### 1. Sentry (error tracking)

**Status:** Package installed, runtime initialization gated on `SENTRY_DSN` env var. DSN must be set in production environment to activate. Free tier covers PARBAUGHS scale (5K errors/month limit).

**What triggers an alert:**
- `error.fatal` events from `src/core/firebase.js` (Auth failure, Firestore offline)
- Unhandled promise rejection in any page
- Cloud Function exception with non-2xx response

**Activation steps (Founder):**
1. Sign up at sentry.io with zach@ email
2. Create project "parbaughs-web" (browser SDK) + "parbaughs-functions" (Node SDK)
3. Add the two DSNs to GitHub repository secrets: `SENTRY_DSN_WEB` + `SENTRY_DSN_FUNCTIONS`
4. Vite + functions deploy scripts pick them up automatically via env

### 2. Firebase Crashlytics (mobile crash reporting)

**Status:** Not yet wired (depends on Wave 3 mobile app). Placeholder for future activation.

**What triggers an alert:**
- App crash in TestFlight builds (Wave 3+)
- Native module exception

### 3. Cloud Function 5xx rate (Google Cloud Monitoring)

**Status:** Not yet wired. Requires GCP Monitoring console setup.

**What triggers an alert:**
- 5xx rate > 5% over 5-minute window on any Cloud Function

**Activation steps (Founder):**
1. Open console.cloud.google.com/monitoring for project parbaughs
2. Create alerting policy: metric `cloudfunctions.googleapis.com/function/execution_count`, filter `status="error"`
3. Threshold: rate > 0.05 over 5min
4. Notification channel: zach@ email

### 4. Watcher heartbeat (operational health)

**Status:** Wired via `.claude/state/heartbeats/watcher-last-run.json`. Dashboard renders RED if last run > 10 min ago.

**Where to check:** `docs/reports/dashboard.html` — system health row.

## Snooze / silence policy

| Channel | Snooze | Notes |
|---|---|---|
| Sentry | 1 hour per alert | Re-pages if not resolved |
| Email | n/a | All alerts deliver |
| Dashboard | n/a | Always visible; no snooze |

## On-call

**Current:** Founder is sole on-call. No rotation (1-person team).
**De facto coverage hours:** Founder's waking hours, ~9am ET to ~midnight ET.
**After-hours acceptable response time:** 8 hours (next morning).

## Test alerts

To verify alerting works end-to-end:
1. **Sentry:** call `Sentry.captureException(new Error('Test alert ' + new Date().toISOString()))` from browser console
2. **Email route:** send a test from Sentry's "Issues" view
3. **Watcher heartbeat:** stop the PARBAUGHS-Downloads-Watcher scheduled task for >10 min and verify dashboard flips red

## Cross-reference

- `docs/incident-response.md` — what to do once an alert fires
- `.claude/state/heartbeats/watcher-last-run.json` — operational heartbeat
- `.claude/state/task-queue/founder/silence-cron-tasks.md` — cron task setup
