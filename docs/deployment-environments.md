# PARBAUGHS Deployment Environments

**Authored:** 2026-05-21 (W1.I4 ship scaffolding).
**Status:** v1 — staging Firebase project creation pending Founder action.

## Environments

| Env | Firebase Project | Hosting | Purpose |
|---|---|---|---|
| **production** | `parbaughs` | `https://alrightlad.github.io/smoky-mountain-open/` | Founding 20 live |
| **staging** | `parbaughs-staging` (pending) | Firebase Hosting preview channels | Wave 2 reveal-moment staging + Wave 4 migrations + Wave 3 mobile pre-TestFlight |
| **emulator** | (local) | `http://localhost:5173/smoky-mountain-open/` | Dev + smoke + e2e |

## Switching environment in CLI

```bash
firebase use production   # default
firebase use staging
```

`.firebaserc` is the source-of-truth for project aliases.

## Deploy flow

| Step | Production | Staging |
|---|---|---|
| Pre-flight | smoke + lint + unit tests + bundle scan | smoke + lint |
| Approval gate | AMD-018 (Founder pre-auth in task-queue/founder/) | None (agent autonomous) |
| Build | `npm run build` | `npm run build` |
| Deploy hosting | (GitHub Pages auto via `git push origin main`) | `firebase deploy --only hosting --project staging` |
| Deploy functions | `firebase deploy --only functions --project production` (AMD-018 gate 1) | `firebase deploy --only functions --project staging` |
| Deploy rules | `firebase deploy --only firestore:rules --project production` (AMD-018 gate 2) | `firebase deploy --only firestore:rules --project staging` |
| Post-deploy | smoke against production URL | smoke against staging URL |

## Environment-aware Firebase config

The browser SDK reads project config from `window.__PB_FIREBASE_CONFIG__` injected at build time:

```js
// vite.config.js (planned)
define: {
  '__PB_ENV__': JSON.stringify(process.env.PB_ENV || 'production'),
  '__PB_FIREBASE_CONFIG__': JSON.stringify(getFirebaseConfig(process.env.PB_ENV))
}
```

Where `getFirebaseConfig(env)` returns project-specific apiKey + authDomain + etc.

**Status:** Not yet implemented — current `src/core/firebase.js` hardcodes production config. Implementation deferred to W1.I4 Phase 2.

## Wave 2 reveal-moment staging flow

Per design bot Wave 2A locked process:
1. Each Wave 2 ship's redesigned page builds in `src/pages/<name>.js`
2. Staging deploy receives the changes via `firebase deploy --only hosting --project staging`
3. Founder reviews the staged URL: `https://parbaughs-staging.web.app/`
4. On approval, the same build deploys to GitHub Pages (production)
5. Caddy Notes records the public-facing change

## Wave 4 migration testing

Per W4.I1-I5 plan:
1. Migration script authored in `scripts/migrations/`
2. Run against staging FIRST: `npm run migrate -- --project=staging --dry-run` then without `--dry-run`
3. Verify migration succeeded + no data corruption
4. Re-run against production with Founder approval

## Smoke automation environment switching

`tests/smoke/run.js` accepts `DEV_URL` env var:
```bash
# Smoke vs staging URL
DEV_URL=https://parbaughs-staging.web.app/ npm run smoke
```

## Cross-reference

- `.firebaserc` — project aliases
- `scripts/deploy.sh` — pre-deploy validation + deploy invocation (AMD-018 gated)
- `task-queue/founder/staging-firebase-project.md` — pending Founder action
- AMD-018 — 11-gate production-risk boundary
