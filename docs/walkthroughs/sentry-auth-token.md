# Walkthrough — Generate Sentry Auth Token for sourcemap upload

**Founder time:** ~5 minutes — token generate, paste, mark complete.
**Status:** Founder must create token (Sentry account-scoped credential); agent wires `@sentry/vite-plugin` once token is captured.
**Severity:** green (enhancement). Runtime works without this; sourcemaps are an upgrade.

---

## Why this enables better error reports

Without the auth token, production stack traces look like:

```
TypeError: e is undefined
  at e(dist/index.html:1:84321)
  at t(dist/index.html:1:84190)
```

With the auth token + `@sentry/vite-plugin` uploading sourcemaps at build time, Sentry resolves the same trace to:

```
TypeError: e is undefined
  at handleClick (src/pages/playnow.js:142)
  at onTeeShotConfirm (src/pages/playnow.js:128)
```

Readable source filenames and line numbers. Saves ~30 minutes per debug cycle.

---

## Step 1 — Create the token (3 min)

1. Open <https://sentry.io/settings/account/api/auth-tokens/>
2. Click **Create New Token**
3. **Name:** `parbaughs-vite-sourcemap-upload`
4. **Scopes** — toggle these on, leave others off:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Click **Create Token**
6. Sentry shows the token **once**. Copy it immediately. Format looks like:
   ```
   sntrys_eyJpYXQiOj…<long base64>…
   ```
   (starts with `sntrys_` for user auth tokens. Older `sntryu_*` tokens also work.)

If you navigate away without copying, you'll need to delete and re-create.

---

## Step 2 — Paste the token into .env (1 min)

Open PowerShell at the repo root:

```powershell
Add-Content -Path .env -Value "`r`nSENTRY_AUTH_TOKEN=<paste-token-here>"
```

The `` `r`n `` is an explicit newline — prevents the variable from appending to the previous line if `.env` lacks a trailing newline.

Verify (FORMAT-validating per PROP-011):

```powershell
$line = Select-String -Path .env -Pattern '^SENTRY_AUTH_TOKEN=(.+)$' |
    Select-Object -First 1
if ($line) {
    $value = $line.Matches[0].Groups[1].Value
    if ($value -match '^sntr[ysu]_[A-Za-z0-9+/=._-]{40,}$') {
        Write-Host "PASS: token format matches Sentry auth token shape" -ForegroundColor Green
    } else {
        Write-Host "FAIL: token format mismatch. Got: $value" -ForegroundColor Red
    }
} else {
    Write-Host "FAIL: SENTRY_AUTH_TOKEN not found in .env" -ForegroundColor Red
}
```

Expected: `PASS: token format matches Sentry auth token shape`.

---

## Step 3 — Agent auto-wires @sentry/vite-plugin (runs in next session)

Once `SENTRY_AUTH_TOKEN` is present + format-validated, the agent will:

1. `npm install --save-dev @sentry/vite-plugin` (free, MIT)
2. Update `vite.config.js`:
   - Import `sentryVitePlugin`
   - Add to the `plugins:` array with `org: 'parbaughs'`, `project: 'parbaughs-web'`, `authToken: process.env.SENTRY_AUTH_TOKEN`
   - Set `sourcemap: true` in `build` config
3. Run `npm run build` and confirm:
   - `dist/` contains `.js.map` files
   - Sentry CLI uploads them (visible in build output)
4. Run smoke probe + V1 verify

After that, every production error in Sentry will show readable source line numbers.

---

## Step 4 — Verify (auto-runs when you Mark complete)

When you click "Mark complete" on the Founder Checklist, the verify command runs:

```powershell
$line = Select-String -Path .env -Pattern '^SENTRY_AUTH_TOKEN=(.+)$' |
    Select-Object -First 1
if ($line -and $line.Matches[0].Groups[1].Value -match '^sntr[ysu]_[A-Za-z0-9+/=._-]{40,}$') {
    'PASS'
} else {
    'FAIL'
}
```

Expected: `PASS` → dashboard flips item to verified-closed.

Per PROP-011 convention, this verifier checks FORMAT (regex match on the
Sentry auth-token shape), not just key presence. If you accidentally
paste a different secret type (e.g., a DSN or Firebase API key) into
`SENTRY_AUTH_TOKEN`, this verifier catches the mismatch before the
build-time plugin fails with a confusing error.

---

## Done conditions

- [ ] Token generated with the 3 required scopes (Founder — Step 1)
- [ ] Token pasted into `.env` (Founder — Step 2)
- [ ] FORMAT-validating verify command returns PASS (Founder — Step 2)
- [ ] Next session: agent installs `@sentry/vite-plugin` + wires it
- [ ] Next session: agent runs `npm run build` and confirms sourcemap upload

---

## Troubleshooting

**"Token doesn't show up in the verify command"** — make sure you used `Add-Content` (appends a new line) and not `Set-Content` (overwrites the whole file). If `.env` was overwritten, restore from the most recent git stash or re-create from `.env.example`.

**"Verify says FAIL: format mismatch"** — copy the token output from Sentry exactly. The token starts with `sntr[ysu]_` followed by ≥40 chars. If you accidentally captured a DSN (`https://…sentry.io/…`) instead of the auth token, regenerate via Step 1.

**"Lost the token, can I see it again?"** — no. Sentry shows the token only at creation. Delete the existing one in Settings → Auth Tokens and generate a new one with the same scopes.

---

## Rotation

If the token is leaked (e.g., accidentally committed to a public repo):

1. Sentry Settings → Auth Tokens → delete the leaked one
2. Repeat Step 1 with a new token
3. Replace `SENTRY_AUTH_TOKEN` in `.env`
4. The next `npm run build` uses the new token

No code change required.
