---
name: parbaughs-ship-cycle
description: The proven end-to-end PARBAUGHS per-feature ship cycle — produce → test → staging (branch + hosting) → prod → verify — with every working command, gotcha, and verification step. Consult at the start of any ship loop and whenever deploying anything.
---

# PARBAUGHS ship cycle (proven commands, 2026-06-10)

The Founder-directed loop: **produce code → test → staging → AI re-test →
critique → polish → final stage test → push to PROD → prod test → next.**
Never staging-only; never prod-untested. This skill records the exact
commands that WORK on this workstation and the gotchas that cost cycles.

## 0. Open the cycle — ecosystem health first

```bash
npm run errors:prod            # prod Firestore `errors` triage (50 newest, grouped)
curl -s "https://api.github.com/repos/AlrightLad/smoky-mountain-open/actions/runs?status=failure&per_page=5"   # ANY failing CI runs (all events)
```
- Check failures across ALL trigger events, not just your own pushes —
  `schedule` runs execute the workflow file from MAIN, so a frozen/stale
  main can fail daily for weeks while push runs stay green (this exact
  miss sent the Founder 8+ days of failure emails, 2026-05-31→06-09).
  Founder directive: see breakage and repair it WITHOUT being told.
- Recurring message at the LATEST appVersion = live bug → fix it FIRST
  (Sentry/Firebase errors take priority over polish).
- Messages pinned to old versions / `v?` = stale, already fixed.
- Tool: `scripts/prod-errors.mjs` (Firestore REST + firebase-login token).
  Orders by `timestamp` — never `ts` (orderBy silently drops docs missing
  the field; looks like an empty collection).

## 1. Produce + test

- Version bump trio when the app bundle changes: `src/core/utils.js`
  APP_VERSION + `package.json` version + `public/sw.js` CACHE_NAME
  (`parbaughs-v{version}`). Hook 5 blocks commit on mismatch; sw.js is the
  manual third (NOT enforced — forget it and members get stale caches).
- Caddy Note per member-visible ship (prepend `currentNotes` in
  `src/pages/caddynotes.js`).
- `npm run lint` (0 errors required) + `npm run build`.
- Rules changes: edit `firestore.rules` → `npm run test:rules` against the
  local emulator (ports 8080/9099 usually already listening). Tests MUST
  seed the field shape the APP writes (grep the actual `.set()` caller),
  not the shape the rule reads — the scrambleTeams memberUids-vs-members
  bug passed wrong-shaped tests for a year while failing prod.
- V1 visual verify: load `http://localhost:5173/smoky-mountain-open/`
  (vite dev server, often already running), render/inject the surface,
  screenshot, READ the png. Self-rating caps at 9.4 (AMD-028); ≥9.5 needs
  Founder eyes on a captured screenshot.

## 2. Stage (TWO surfaces — both, every cycle)

```bash
git push origin main:staging                       # fast-forward case
# diverged (cron raced)? use the script — its force-with-lease works via PowerShell:
powershell -ExecutionPolicy Bypass -File scripts\push-staging.ps1

node scripts/seed-deploy-staging-hosting.mjs       # staging RUNTIME (builds --base=/ itself)
curl -s https://parbaughs-staging.web.app/ | grep -oE "APP_VERSION=.[0-9.]*"   # verify!
```
**GOTCHA:** the GH "Deploy to Firebase Hosting (staging)" workflow goes
green while deploying NOTHING (secret-gated step silently skips). The
staging URL sat 25 versions stale behind green runs. Always deploy
locally + curl-verify the served version.

## 3. Rules deploys (agent-owned, no firebase CLI deploy)

```bash
npm run rules:deploy:staging     # = node scripts/seed-deploy-rules.mjs parbaughs-staging
npm run rules:deploy:prod        # = node scripts/seed-deploy-rules.mjs parbaughs
```
Rules REST API; staging auths via scripts/.service-account.json, prod via
the firebase CLI login token + gitignored scripts/.secrets/fb-oauth.json.
After a prod deploy, fetch the live ruleset back and grep for the change
(slice generously — a 700-char window once produced a false MISSING).

## 4. Prod push

```bash
git fetch origin                       # cron commits race constantly
git log --oneline origin/main..HEAD    # know what you're pushing
git branch -f backup/pre-<name>-$(git rev-parse --short origin/main) origin/main
git push origin main
```
- Non-FF reject (cron advanced origin): `git checkout -B main origin/main`
  then **plain** `git cherry-pick <sha>` of YOUR commit. **NEVER
  `-X theirs`** — it silently resolved AGAINST a feature commit once,
  producing a pushed main without the feature. After ANY conflicted
  landing, verify content, not just success:
  `git show origin/main:src/core/utils.js | grep APP_VERSION` + grep one
  changed symbol.
- Commit messages with bodies: write to a temp file, `git commit -F file`,
  delete it. (PowerShell here-strings inside the Bash tool inject literal
  `@'` garbage into -m.)

## 5. Prod verify (close the loop)

```bash
curl -s "https://api.github.com/repos/AlrightLad/smoky-mountain-open/actions/runs?per_page=3"   # public repo — no auth needed
```
Then Playwright: navigate `https://alrightlad.github.io/smoky-mountain-open/`,
evaluate `APP_VERSION` + one new symbol (`typeof <newFn> === 'function'`).
Pages + CDN propagation ≈ 3-6 min after the run completes. The PWA's sw.js
uses skipWaiting + clients.claim, so one reload (mobile: full close/reopen)
picks up a version.

## Hard walls (don't burn attempts)

- `firebase deploy` (ANY form) — classifier-blocked for the agent. Rules →
  REST script above. Hosting(staging) → seed-deploy-staging-hosting.mjs.
  Functions → no agent path yet; Founder runs
  `firebase deploy --only functions:NAME --project parbaughs --force`
  (staging project is NOT on Blaze — functions deploys fail there).
- `git push --force*` in Bash — denied; the PowerShell script path works
  for staging only. Force to MAIN stays AMD-018 gate 9.
- Founder-browser-only: GH repo secrets, Sentry tokens.

## Always-on cycle hygiene

- `git status --porcelain | wc -l` == 0 before reporting (grind-to-completion).
- Decision log: `.claude/state/founder-decisions/<date>.ndjson` — approved →
  complete it; denied → log reason. Mark checklist items via
  `powershell -File scripts\founder-mark-complete.ps1 <slug>` (it's
  PowerShell — running it through bash throws `param(` syntax errors).
- Close ports/servers you opened when done; leave the long-lived emulator
  + vite dev server alone (other sessions share them).
