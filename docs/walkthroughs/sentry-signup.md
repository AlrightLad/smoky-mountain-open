# Walkthrough — Sign up for Sentry (free tier, no credit card required)

**Founder time:** ~6 minutes — account, project, DSN paste.
**Status:** Founder must create account (Sentry requires email + password); agent wires the SDK once DSN is captured.

---

## Why Sentry

Currently PARBAUGHS logs errors to Firestore via `analytics.js` → `error_logs` collection. Sentry adds:

- Stack traces with sourcemap support (your minified prod bundle → readable line numbers)
- Breadcrumbs (last N user actions + console logs before the error)
- Release tracking (which app version threw the error)
- Alert routing (email/Slack on first occurrence)
- Member identity (after consent) — see which member hit the bug

Free tier: **5K errors/month**, 1 user, unlimited projects. No credit card. Sentry won't auto-upgrade you to a paid plan.

---

## Step 1 — Create the account (3 min)

1. Open <https://sentry.io/signup/>
2. Choose **Sign up with Google** (fastest) OR enter email + password
3. After verifying email, you land on the org-creation flow
4. **Org name:** `parbaughs` (lowercase, will become your sentry.io/parbaughs URL)
5. **Project — JavaScript (Browser):** click **JavaScript (Browser)** in the platform list
6. **Project name:** `parbaughs-web`
7. **Alert frequency:** "Alert me on every new issue" (default)
8. Click **Create Project**

---

## Step 2 — Copy the DSN (1 min)

After project creation, Sentry shows a setup snippet that looks like:

```javascript
Sentry.init({
  dsn: "https://abc123def456@o1234567.ingest.us.sentry.io/789012",
  ...
});
```

The string between the quotes after `dsn:` IS your DSN. Copy it.

---

## Step 3 — Paste DSN into env files (2 min)

Open PowerShell at the repo root. Replace `<paste-your-dsn-here>` with the actual DSN from Step 2. The `` `r`n `` is an explicit newline prefix — without it, Add-Content can append to the previous line if the env file doesn't end with a newline.

```powershell
# Production .env
Add-Content -Path .env -Value "`r`nSENTRY_DSN=<paste-your-dsn-here>"

# Staging .env (only if you've activated the staging Firebase project)
if (Test-Path .env.staging) {
    Add-Content -Path .env.staging -Value "`r`nSENTRY_DSN=<paste-your-dsn-here>"
}
```

<details>
<summary>About Sentry DSNs — semi-public (click to expand)</summary>

A Sentry DSN identifies the project + grants permission to SEND events. It does NOT grant access to read events, manage settings, or delete data — those require an auth token (which IS a secret).

The DSN is intended to be embedded in client bundles. However, treating it as semi-private is still good hygiene:
- Anyone with the DSN can submit arbitrary events to your project (eats free-tier quota)
- Sentry supports DSN rotation if compromised (Settings → Client Keys → New Key)

The agent treats DSN as **rotatable secret-ish** — keeps it in `.env`/`.env.staging` (gitignored), surfaces a rotation walkthrough if leaked, but does not block on it.

</details>

Verify (PROP-011 FORMAT-validating per Sentry SDK DSN shape):

```powershell
$line = Select-String -Path .env -Pattern '^SENTRY_DSN=(.+)$' | Select-Object -First 1
if (-not $line) { Write-Host "FAIL: SENTRY_DSN not in .env" -ForegroundColor Red }
else {
    $value = $line.Matches[0].Groups[1].Value
    if ($value -match '^https://[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io/[0-9]+$') {
        Write-Host "PASS: DSN format matches @sentry/browser SDK shape" -ForegroundColor Green
    } else {
        Write-Host "FAIL: DSN format mismatch. Got: $value" -ForegroundColor Red
        Write-Host "Expected: https://<32-hex>@o<digits>.ingest.us.sentry.io/<digits>" -ForegroundColor Yellow
    }
}
```

Expected: `PASS: DSN format matches @sentry/browser SDK shape`.

**Watch out for:** the Sentry UI shows TWO setup methods — "Loader Script" (CDN-hosted, URL like `https://js.sentry-cdn.com/...min.js`) and "SDK" (the standard DSN we want). Make sure you copy the DSN from the **SDK** setup, not the loader script URL. The verifier above catches this exact mistake.

---

## Step 4 — Agent auto-wires the SDK (runs in next session)

Once `SENTRY_DSN` is present in `.env`, the agent will, in the next session:

1. `npm install @sentry/browser` (free, MIT)
2. Add `src/core/errorHandler.js` that calls `Sentry.init({ dsn, release: APP_VERSION })`
3. Wire it as the first import in `src/main.js`
4. Add a tracesSampleRate (default 0.1 — 10% performance traces, well within free tier)
5. Run smoke + Playwright to verify no regression

Agent will also:
- Set up sourcemap upload via Vite plugin so stack traces resolve to readable source
- Add a release tag to commit-time (Husky post-commit can mark the release)

---

## Step 5 — Verify (auto-runs when you Mark complete)

When you click "Mark complete" on the Founder Checklist, the verify command runs (PROP-011 FORMAT-validating):

```powershell
$envFile = if (Test-Path .env.staging) { '.env.staging' } else { '.env' }
$line = Select-String -Path $envFile -Pattern '^SENTRY_DSN=(.+)$' | Select-Object -First 1
if (-not $line) { 'FAIL: SENTRY_DSN not present'; exit }
$value = $line.Matches[0].Groups[1].Value
if ($value -match '^https://[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io/[0-9]+$') {
    'PASS'
} else {
    "FAIL: DSN format mismatch — $value"
}
```

Expected: `PASS` → dashboard flips item to verified-closed. If FAIL, the verifier prints the actual DSN value so you can see the format problem (e.g., loader URL vs SDK DSN).

---

## Done conditions

- [ ] Sentry account created (Founder — Step 1)
- [ ] DSN captured (Founder — Step 2)
- [ ] DSN pasted into `.env` (and `.env.staging` if applicable) (Founder — Step 3)
- [ ] Agent runs `@sentry/browser` install + wire (auto, next session)
- [ ] First error triggers in browser → appears in Sentry dashboard (agent verifies)

---

## What this unblocks

- **A3 Security** — observability lift, +5 to +8 points
- **A8 Monitoring** — moves from "logging only" to "alerted-on-error" stance
- **Incident triage** — minified prod bundle → readable line numbers via sourcemaps
- **Member-context bugs** — once consent is wired, errors carry member identity (initials)
