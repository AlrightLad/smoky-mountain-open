---
status: closed
severity: yellow
priority: MEDIUM
authored_at: 2026-05-30T15:10:00Z
authored_by: agent
founder_action_required: true
gate: AMD-018 gate 10 (domain/DNS) — only if the Cloudflare Access path is chosen
---

# Decide how the dev-HQ dashboard reaches other developers (remote hosting + access control)

## What

This dashboard ("dev HQ") is regenerated on every commit and is accurate on
your machine right now. The open question is how it should reach **other
developers** once it is not just you. Hosting it on a URL anyone can reach is a
decision only you should make, because the HQ shows internal operations and
security posture (the pentest workflow, the AMD-018 deploy gates, the Sentry
wiring, app-health and session views). That is fine for the team; it should not
be on the open internet.

There is nothing broken here and nothing blocking other work. This is the
"eventually it won't be just me working on the app" case you flagged.

## Current state (works today, no exposure)

- Every commit regenerates all HQ pages (`.husky/post-commit`) and re-commits
  the output, so the files on disk always match the latest commit. This is the
  "active and accurate at all times" guarantee, and it already holds.
- New: `npm run hq` serves the HQ at `http://127.0.0.1:8099` (local only). Use
  this instead of opening the long `file:///` path — it also makes the live
  panels work (the browser blocks data-fetches over `file://`, so some panels
  look empty there; over localhost they load).
- No HQ page contains a live secret (verified by repo secret-scan). The
  sensitivity is *internal posture*, not credentials.

## The constraint that rules out the obvious path

The HQ must **not** be published via GitHub Pages. GitHub Pages deploys from a
push to `main` (`.github/workflows/deploy.yml` runs `npm run build` and
publishes `dist/`). That pipeline rebuilds and re-publishes the **frozen member
app**. Pushing the dashboard through `main` would therefore re-deploy the
member app, which we are deliberately holding. So a remote HQ has to live on a
**separate host**, never on the member app's `main` -> Pages path.

## What you need to do

**Who can do this:** you (Founder) make the access-control call; any maintainer
can then execute the chosen path. The decision is yours because it is a privacy
and scope call (who may see internal security posture), and the strong option
touches a domain (AMD-018 gate 10).

Pick one:

**Option A (recommended) — stay local now, gate it when a second dev joins.**
Keep using `npm run hq` while it is just you (zero exposure, already current).
When you add a developer, put the HQ behind **Cloudflare Access** (free for
small teams): it checks the visitor's email against an allow-list *before* any
page is served, so the content is never exposed pre-login. Steps when you are
ready:
1. Tell the agent the allow-list emails and confirm "use Cloudflare Access."
2. The agent builds the static-deploy config (a separate Firebase Hosting site
   serving `docs/reports/`, isolated from the member app) and a one-command
   deploy script.
3. You create the Cloudflare Access application + email policy (this is the
   gate-10 domain step; a `*.pages.dev` host can also carry an Access policy if
   you prefer not to wire a custom domain yet).
4. The agent deploys the HQ behind it and verifies the gate blocks a
   non-allow-listed email.

**Option B — Firebase Hosting separate site with a Firebase-Auth client gate.**
Faster to stand up, but weaker: the page HTML is delivered before the gate
runs, so a determined visitor with the URL could read it. Acceptable only if you
decide the posture data is low-sensitivity. The agent can build this on request.

**Option C — defer.** Confirm local-only (`npm run hq`) is enough for now. This
item closes and re-opens when a second dev is actually onboarding.

## What the agent already did (no remote exposure, reversible)

- Added `npm run hq` — a path-traversal-guarded local static server for
  `docs/reports/` (`scripts/serve-hq.mjs`). Local only; no data leaves the
  machine.
- Confirmed the always-current mechanism end to end (post-commit regen +
  freshness sentinel + visual-gate).
- Did **not** build the remote-deploy machinery yet: it depends on which option
  you pick (Cloudflare vs Firebase site). The agent will build it the moment
  you choose, so this stays one decision away, not a half-built thing.

## Closure criteria

- You pick Option A or B and the agent builds + deploys the chosen path and
  verifies the access gate works, OR
- You pick Option C (local-only is sufficient for now) and the item is marked
  complete with that note.

## Decision (2026-05-30, Founder-approved "I approve all")

**Chosen: Option C / Option A-deferred — local-only is sufficient for now.**

It is still just the Founder working on the app, so the dev-HQ dashboard is
served via `npm run hq` (`http://127.0.0.1:8099`, path-traversal-guarded, local
only, zero internet exposure) and stays current on every commit via the
post-commit regen. No remote host is stood up, so no internal security posture
ever reaches the open internet.

When a second developer actually onboards, this item re-opens and the agent
builds the Option A path (a separate Firebase Hosting site serving
`docs/reports/`, isolated from the member app's `main` -> Pages pipeline, placed
behind **Cloudflare Access** with an email allow-list that gates the content
*before* any page is served). The remote-deploy machinery is intentionally not
built yet because it depends on the allow-list emails + the Cloudflare Access
application, which are the 2nd-dev-onboarding inputs.

No gate-10 (domain/DNS) action is taken now. Nothing is deployed. Reversible:
re-opens the moment a second dev needs access.


---
**CLOSED 2026-06-11:** Superseded — the ratified pattern is local serving (npm run hq); dashboards are always-current via post-commit regen. Reopen only if remote access is ever wanted.
