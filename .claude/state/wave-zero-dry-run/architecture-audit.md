# PARBAUGHS Architecture Audit — for main-flows.html

**Captured:** 2026-05-13 (Step 1 of new main-flows directive)
**Method:** Direct grep over `src/`, `functions/`, `firebase.json`, `capacitor.config.json`, `package.json`, `.github/workflows/`. No invented components. Cross-checked against repo state at HEAD = `feeb86d`.

---

## Columns — 6 real layers

PARBAUGHS architecture is 6 layers from member action → external integration. Each column below is a real layer in the codebase, evidenced by grep.

### Column 1 — Actors

| ID                  | Role                              | Evidence |
|---------------------|-----------------------------------|----------|
| `actor.member`      | Authenticated league member       | `src/core/firebase.js:225` (`auth.signInWithEmailAndPassword`); `members` collection (`grep collection("members")`) |
| `actor.commissioner`| Per-league admin / commissioner   | `functions/index.js:273` (`onMemberRoleChange`); leagues doc has `commissioner` field per `docs/agents/CLAUDE.md` |
| `actor.founder`     | Platform-level founder (Zach)      | `functions/index.js:667` (`onFounderAccessLog`); platformRoleOf helper |
| `actor.invitee`     | Pre-claim invitee (link recipient)| `functions/index.js:143` (`validateInvite`); `invites` collection |
| `actor.guest`       | Unauth visitor (limited surface)   | Pages render without `currentUser` for public profiles + landing |

### Column 2 — Client Surfaces

| ID                       | Surface                                       | Evidence |
|--------------------------|-----------------------------------------------|----------|
| `client.hq-home`         | HQ Home (`src/pages/home.js`)                  | Page exists |
| `client.hq-playnow`      | Play Now / Log a round (`src/pages/playnow.js`)| Page exists |
| `client.hq-roundhistory` | Round detail / history (`src/pages/round.js`, `roundhistory.js`) | Pages exist |
| `client.hq-leagues`      | Leagues + standings (`src/pages/leagues.js`, `standings.js`)| Pages exist |
| `client.hq-members`      | Members directory + Find players (`src/pages/members.js`, `findplayers.js`) | Pages exist |
| `client.hq-feed`         | Activity feed (`src/pages/feed.js`)             | Page exists |
| `client.hq-wagers`       | Wagers + bounties (`src/pages/wagers.js`, `bounties.js`) | Pages exist |
| `client.hq-teetimes`     | Calendar + tee times (`src/pages/calendar.js`, `teetimes.js`) | Pages exist |
| `client.hq-trophy`       | Trophy Room + records (`src/pages/trophyroom.js`, `records.js`, `awards.js`) | Pages exist |
| `client.hq-range`        | Range session log (`src/pages/range.js`, `drills.js`) | Pages exist |
| `client.hq-spectator`    | Spectator HUD (`src/pages/spectator.js`)        | Page exists |
| `client.hq-settings`     | Settings (`src/pages/settings.js`)              | Page exists |
| `client.hq-admin`        | Commissioner admin panel (`src/pages/admin.js`) | Page exists |
| `client.mobile-capacitor`| Capacitor wrapper → iOS/Android                 | `capacitor.config.json` (`com.parbaughs.app`) |

Total client pages in repo: 45 (from `ls src/pages/`). The grid shows the highest-traffic pages that participate in the 8 flows; full list lives in the source dir.

### Column 3 — Firebase Auth + Cloud Functions

| ID                              | Service / Function                                                  | Evidence |
|---------------------------------|----------------------------------------------------------------------|----------|
| `fn.auth`                       | Firebase Auth (email/password)                                       | `firebase.json`; `src/core/firebase.js:225,524` |
| `fn.search-courses`             | `searchCourses` (onRequest)                                          | `functions/index.js:120` |
| `fn.validate-invite`            | `validateInvite` (onRequest)                                         | `functions/index.js:143` |
| `fn.send-push`                  | `sendPushNotification` (onCreate pendingPush)                        | `functions/index.js:192` |
| `fn.on-member-role-change`      | `onMemberRoleChange` (onUpdate members)                              | `functions/index.js:273` |
| `fn.on-league-delete`           | `onLeagueDelete` (onDelete leagues)                                  | `functions/index.js:454` |
| `fn.join-league`                | `joinLeague` (onCall)                                                | `functions/index.js:535` |
| `fn.on-founder-access-log`      | `onFounderAccessLog` (onCreate founder_access_logs)                  | `functions/index.js:667` |
| `fn.expire-suspensions`         | `expireSuspensionsAndTransfers` (scheduled)                          | `functions/index.js:734` |

### Column 4 — Firestore (Data)

30 top-level collections. Grouped by responsibility:

| ID                        | Collection group                                              | Members |
|---------------------------|---------------------------------------------------------------|---------|
| `data.members`            | `members`                                                      | per-user profile + handicap + leagues array |
| `data.leagues`            | `leagues`                                                      | league docs + memberUids + commissioner |
| `data.rounds`             | `rounds`, `liverounds`, `syncrounds`, `scramble_rounds`, `tripscores` | round entries + in-progress + sync state |
| `data.dms`                | `dms`, `messages`, `chat`                                      | direct messages + thread state + league chat |
| `data.notifications`      | `notifications`, `pendingPush`                                 | per-user notifications + push queue |
| `data.parcoins`           | `parcoin_transactions`                                         | ledger entries (Wagers/Bounties/Shop) |
| `data.wagers-bounties`    | `bounties`, `partygames`                                       | wager + bounty state |
| `data.events`             | `calendar_events`, `teetimes`, `trips`, `scheduling_chat`      | scheduling + tee times |
| `data.courses`            | `courses`, `course_reviews`                                    | course directory + member reviews |
| `data.social`             | `social_actions`, `photos`                                     | social actions + photo gallery |
| `data.config`             | `config`, `attestations`, `feature_requests`, `errors`, `reports`, `pending_celebrations`, `presence` | misc config + sundry |
| `data.invites`            | `invites`                                                       | invite codes |

(30 collections collapsed into 12 groupings for grid clarity. Each group can drill into individual collections if a flow needs the precision.)

### Column 5 — Distribution

| ID                        | Distribution channel                          | Evidence |
|---------------------------|------------------------------------------------|----------|
| `dist.gh-pages`           | GitHub Pages static deploy                     | `.github/workflows/deploy.yml`; live at `alrightlad.github.io/smoky-mountain-open` |
| `dist.capacitor-ios`      | iOS app via Capacitor + Xcode (planned)        | `.github/workflows/ios-build.yml`; `capacitor.config.json` |
| `dist.capacitor-android`  | Android app via Capacitor (planned)            | `.github/workflows/android-build.yml`; `capacitor.config.json` |

### Column 6 — External Services

| ID                        | External service / API                                         | Evidence |
|---------------------------|----------------------------------------------------------------|----------|
| `ext.golfcourseapi`       | GolfCourseAPI (course search)                                  | `functions/index.js:131` (`https://api.golfcourseapi.com/v1/search`) |
| `ext.open-meteo`          | Open-Meteo (weather + geocoding)                               | `src/core/weather.js:35,38` (api.open-meteo.com); `geocoding-api.open-meteo.com` |
| `ext.fcm`                 | Firebase Cloud Messaging (push)                                | `sendPushNotification` function uses FCM admin SDK |
| `ext.anthropic`           | Anthropic API (Phase 4 — AI Caddie) — NOT YET WIRED            | Roadmap reference only; included as a planned column 6 entry |

---

## Verification: 6 columns, real evidence

| Column | Components named | All grep-evidenced |
|--------|------------------|--------------------|
| Actors | 5                | yes |
| Client Surfaces | 14    | yes |
| Auth + Functions | 9    | yes |
| Firestore | 12 groups   | yes (30 collections collapsed) |
| Distribution | 3        | yes |
| External Services | 4   | 3 wired + 1 planned (anthropic) explicitly flagged |

**Total active components in grid:** 47.

**Orphan check (components in grid but referenced by no flow):** documented in regen-main-flows.py as a warning, not error.

---

## Components NOT in grid (intentionally — these are infra, not member-facing flow stations)

- Firestore rules (`firestore.rules`) — security gate, not a node a flow "passes through"
- Service Worker (`public/sw.js`) — caching layer, also not a flow node
- Vite bundler / build pipeline — build-time, not runtime path
- GitHub Actions workflows beyond `deploy.yml`, `ios-build.yml`, `android-build.yml` (heartbeat, proactive-cycle, ship-cycle are orchestration-only, not flow nodes for the member surface)

These are real architecture pieces but they're not on the member's path through a flow. Adding them would clutter the grid without adding member-facing signal.
