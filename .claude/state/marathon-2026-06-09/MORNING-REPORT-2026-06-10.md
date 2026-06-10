# Morning report — overnight run of 2026-06-10

**17 versioned ships, v8.24.14 → v8.24.30, all live on prod + staging.**
Smoke suite 26/26 green at end of run. App baseline score moved 6.0 → 6.8
(verified mid-run by the section review); the 30-item baseline backlog is now
substantially drained. Full E2E was running at time of writing.

## What you'll see in the app

| Area | What changed |
|---|---|
| **Invites** | Work for everyone again (25-invite floor — the old 3-cap silently removed every button), league-targeted links with 7-day expiry, "Invite a Friend" at the top of More → Community and on every league page. **The founding-code leak is fixed AND the leaked code rotated dead on prod.** |
| **Celebrations** | Confetti on personal bests (with a Caddy callout) + a gentle once-per-session sprinkle on league pages. Reduced-motion safe. |
| **Navigation** | More menu gained "The Season" wing (Standings/Feed/Records/Trophy Room/Awards/Recap/Aces) + Party Games; desktop sidebar gained the Club section (Chat finally has a desktop door); Play tab actually starts rounds now. |
| **Honesty fixes** | Nemesis label only when you're actually trailing (4–0 = "Rivalry"); Accept-wager shows true Nassau escrow cost; expired invites say EXPIRED; verify-email banner stopped claiming DMs are locked. |
| **One vocabulary** | Zero native browser pop-ups remain (24 replaced with the branded confirm card, claret for destructive). One toast system. One loading style. One stat-tile recipe. One segmented-control style. |
| **Renovations** | Trophy Room (Roll of Honor as hero), member profiles, Wagers book, Play Now setup, More tab + 8 redrawn icons, trip champion gets a felt celebration card. |
| **Themes** | All 6 palettes complete + the picker is open in Settings → Display (3 ready, 3 to earn). |
| **Quiet wins** | New-member onboarding no longer spams permission errors; usernames can't break their own login; skipped welcome tour is replayable; ~400 legacy toasts auto-upgraded. |

## Dark feature awaiting your eyes
**Tee-shot intro** (your spec: post-sign-in, accurate swing, clean cartoon) is
live but OFF. Preview: staging → sign in → console: `localStorage.pb_intro_enabled='1'`
→ reload. Swing follows researched Tour-Tempo keyframes (coil, transition beat,
3:1 downswing, lag, impact freeze + burst, wrapped finish). Say "enable the
intro" to ship it on.

## Infrastructure permanently fixed
- **GitHub Pages deploys**: root cause was GitHub's intermittent 401 + supersession
  noise → auto-retry + cancel-in-progress. Proven under rapid pushes.
- **Daily Ship Cycle / heartbeat / proactive workflows**: bare `git push` races
  → rebase+retry. Staging-deploy schedule failure (10 days of emails) fixed.
- **Staging hosting** now deploys locally every cycle (the green-but-skipping
  workflow gotcha is documented).

## Your checklist (everything left needs you — numbered)
1. **Org spend limit** (blocks agent fleets): claude.ai/admin-settings/usage → raise, or say "ride it out."
2. **Tee intro**: preview per above → approve/deny.
3. **Shop catalog**: checklist item `shop-cosmetics-catalog-proposal` → approve items (gates the store rebuild).
4. **Multi-league model**: `multi-league-architecture-decision` → sign off (gates the build).
5. **ParCoin best-award bug**: reply `approve parcoin-personal-best-award-bug` (one-line fix, gate 4).
6. **deleteMyAccount**: `! firebase deploy --only functions:deleteMyAccount --project parbaughs --force`
7. **Sentry token** (event:read + project:read) + **GH secret** `FIREBASE_SERVICE_ACCOUNT_STAGING` when at your browser.

Evidence: `.claude/state/research/` (fleet outputs, Ralph reviews, swing spec +
phase stills, critique screenshots). Decision log: `founder-decisions/2026-06-09.ndjson`.
