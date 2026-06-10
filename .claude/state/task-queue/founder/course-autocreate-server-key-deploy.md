# Course auto-create — one env var + one deploy (joins the deleteMyAccount deploy)

**Status:** WAITING ON FOUNDER · written 2026-06-10 (v8.24.42)
**Gate:** AMD-018 gate 1 (Cloud Functions deploy) + session classifier walls `firebase deploy`

## What shipped already (no action needed)

v8.24.42 made every "add a course" path in the app try GolfCourseAPI FIRST —
real rating/slope/par/tee data instead of guessed 72/113/72 — falling back to
an honestly-labeled provisional stub only when the API has no match. This
works TODAY on any device that has a personal API key saved (yours). For the
other 19 members it silently falls back to the stub, because the deployed
`searchCourses` function still REQUIRES a key from the caller.

The function code in the repo (functions/index.js + functions/lib/validators.js)
already accepts key-less calls and falls back to a server-held key. It just
needs YOUR key in the function's environment and one deploy.

## Why this is safe

- The key never appears in the app bundle or any client code — it lives in
  the Cloud Function's environment only.
- The function already rate-limits by IP (60/min) and rejects foreign origins,
  so the platform key can't be farmed from outside the app.
- GolfCourseAPI free tier is generous; 20 members adding courses is nowhere
  near it.

## Your steps (PowerShell, in the repo folder)

1. Put the key into a gitignored env file the deploy reads
   (REPLACE `YOUR_KEY_HERE` with the GolfCourseAPI key — the same one in
   your device's Settings → it shows under localStorage `golfcourse_api_key`):

   ```powershell
   Set-Content -Path functions\.env -Value "GOLFCOURSE_API_KEY=YOUR_KEY_HERE" -Encoding ascii
   ```

   (`functions/.env` is the standard Gen1 env-file mechanism and is already
   gitignored — verify with `git check-ignore functions/.env` → it should
   print the path.)

2. Deploy BOTH waiting functions in one shot:

   ```powershell
   firebase deploy --only functions:searchCourses,functions:deleteMyAccount --project parbaughs --force
   ```

3. Tell the agent "searchCourses deployed" (or just leave this file's status
   line edited to DONE) — the agent will then verify with a key-less curl and
   close task #26, and #24 (deleteMyAccount) closes with it.

## What happens after

Every member's "Add course" gets real course data automatically. The
provisional-stub path remains only for courses GolfCourseAPI doesn't know.
