# Parbaughs — Golf League Platform

## Brand

- **Platform name:** Parbaughs (not PlayThru — that name is taken by PlayThru LLC at playthru.golf)
- **The founding league:** "The Parbaughs" — the original 20-member crew from York, PA
- **At scale:** Other users create their own leagues inside Parbaughs. "Start a league on Parbaughs." "Download Parbaughs and join my crew."
- **Merch/branding:** PARBAUGHS
- **Social handles:** @PlayThru_ was claimed but may conflict. Commissioner decision needed: switch to @Parbaughs or @ParbaughsGolf
- **Domain:** Need to secure parbaughs.com or parbaughs.golf (flagged for commissioner)

## The Vision

Parbaughs is an invite-only golf league app for a tight friend group of 20 members based in York, PA. It's not trying to be 18Birdies or GHIN — it's trying to be the app that makes this group of friends play more golf, talk more trash, and build memories together. Every feature should strengthen community over competition. Think country club meets group chat meets fantasy sports.

This app is a labor of love. Treat it with extreme care and pride. It's a core piece of who the commissioner (Zach) is. Quality is non-negotiable.

## Project State

- **Version:** v8.1.3 (as of 2026-04-22) — Clubhouse Part A foundation complete
- **Architecture:** Multi-league, Vite multi-file, vanilla JS
- **Stack:** Firebase Auth + Firestore + Cloud Functions (Node 22, Gen1), GitHub Pages static deploy
- **Design system:** Clubhouse (light default / dark opt-in). See Appearance + Design System sections.
- **Budget:** Zero. No paid services beyond Firebase Blaze plan.
- **Users:** 20 members, mixed iPhone/Android
- **Repo:** `AlrightLad/smoky-mountain-open`
- **Live:** https://alrightlad.github.io/smoky-mountain-open
- **Positioning (approved v8.0, 2026-04-17):** PARBAUGHS is a solo-first golf tracking app with an optional league layer for competitive and social play. Leagues are additive, not required. Marketing copy, App Store framing, and Phase 4 monetization all follow from this framing.
- **Role terminology (approved v8.0, 2026-04-17):** "Founder" is the platform-level role (held by Zach). "Commissioner" is the per-league role. These terms are NOT interchangeable starting v8.0. Legacy copy referring to "The Commissioner" for Zach is migrated to "Founder" during v8.0.1 Visibility Polish.

### Clubhouse Part A shipped (v8.1.0 — v8.1.3, April 2026)
- **v8.1.0** — Foundation. ~90 Clubhouse tokens, legacy 8-theme system removed (themes.css/masters.css/textures.css/theme.js deleted, 16 texture assets removed), Fraunces replaces Playfair, dual-mode light/dark architecture, welcome toast
- **v8.1.1** — Component states. :focus-visible ring (WCAG 2.1 AA), hover/active/disabled coverage, 100% transition token adoption (42 transitions), standardized 3-tier active-scale (.95 / .97 / .985)
- **v8.1.2** — Motion + accessibility. `src/core/animate.js` module, semantic motion tokens, jank-risk fixes (trophy-bar + bottom-nav ripple → transform), prefers-reduced-motion architecture, aria-live on toasts + counts
- **v8.1.3** — Final polish. Reduced-motion ach-celebrate visibility fix, handicap decimal instrumentation, header icon aria-labels, dead code cleanup (nameRainbow keyframe, OLD NAV rules)

Part A bundle delta: **−19 KB net** (legacy CSS deletion > new token expansion). Clubhouse is leaner than the 8-theme system it replaced.

Part B (weeks 8-10): screen restructuring on the new design system — home, profile, feed, scorecard, round detail.

## Three-Agent Workflow

PARBAUGHS development uses a three-agent model:

**Agent 1 — Zach (Founder / Commissioner / Product Owner)**
- Final decision authority on product and architecture
- Reviews specs before execution, verifies ships on device
- Makes judgment calls on scope, energy, and timing
- Does NOT write code directly

**Agent 2 — Claude.ai (CTO / Strategic Planner)**
- Writes specs, design documents, and reviews Agent 3's work
- Pushes back on Zach when scope, timing, or approach is off
- Makes recommendations; Zach makes decisions
- Does NOT write code directly — produces specs that Agent 3 executes

**Agent 3 — Claude Code (Engineer / QA)**
- Executes specs autonomously
- Investigates, diagnoses, implements, and tests
- Reports findings back to Zach for review before shipping
- Is trusted to make small judgment calls within spec scope, flagged transparently in reports

Each agent has defined authority. Agent 3 does NOT write specs. Agent 2 does NOT write code. Agent 1 does NOT execute tests. Violations of this boundary are treated as a process failure to be named and corrected.

This three-agent model is distinct from the multi-subagent "Agent Team Configuration" block later in this document. That block describes how Agent 3 (Claude Code) can fan out internally via subagents to parallelize work; the three-agent model describes the outer authority structure between Zach, Claude.ai, and Claude Code.

## Fresh Session Rule

**Every distinct task gets a fresh Claude Code session.**

"Distinct task" means:
- A different ship (new version)
- A different code area from the last session
- After signing off for any period of time
- When prior session context has become irrelevant or stale

Why: Accumulated context from prior sessions causes Agent 3 to carry stale assumptions, conflate unrelated code paths, and make worse judgment calls. Fresh session = maximum focus and minimum drift.

Multi-phase work on the **same ship** (e.g., Phase 1 → Phase 2 → ship) stays in the same session. Switching to a different ship means starting fresh.

## Design Before Implementation

For non-trivial features (especially product-level changes like governance, role systems, or cross-cutting UX work), development follows a three-stage cadence:

**Stage 1 — Product Design Document**
- Written to `docs/`
- Covers product decisions: capabilities, visibility, edge cases, user experience
- Presents options for decisions, doesn't make them unilaterally
- No code, no schema, no implementation details

**Stage 2 — Technical Design Document**
- Written to `docs/`
- Maps product decisions to system changes: data model, Firestore rules, migrations, API surface
- References the Stage 1 doc for product intent

**Stage 3 — Implementation Ships**
- Multiple small ships, each implementing a slice of the technical design
- Each ship is independently shippable and reversible
- Scope is inherited from Stage 2, not invented at ship time

Bug fixes and small feature additions skip Stages 1-2 and go directly to implementation. The cadence applies to substantive design work.

## Testing Strategy

Three-tier model:

**Tier 1 — Pre-push smoke test**
Status: **PLANNED for v7.9.1**

A minimal test suite (8-12 tests, 30-60 second runtime) that verifies the app boots, core auth works, home page renders, and the critical user path (logging a round) completes. Runs on every `git push`, blocks the push on failure. Catches catastrophic regressions before they leave the local machine.

**Tier 2 — Full regression suite**
Status: **IMPLEMENTED (v7.8.0, v7.8.4, v7.8.5)**

The Playwright test suite in `tests/e2e/flows/` (see the E2E Testing section below for setup and mechanics). Currently 44+ tests covering specific known failure modes. Grows incrementally: every bug discovered adds a regression test.

Explicitly invoked by Agent 3 during ship execution per spec instructions. Not currently wired to run automatically on every commit.

**Tier 3 — Manual QA on device**
Status: **ONGOING (Zach's responsibility)**

Zach verifies every ship on his phone against the live site (GitHub Pages). Catches visual issues, layout regressions, and feel/UX problems that automated tests cannot.

For major releases (v8.x and App Store submission), consider adding structured manual QA: a checklist of scenarios walked through by Zach plus 1-2 founding members before the release.

### Testing principles

- **Tests grow with bugs, not with features.** Every bug that slips to production or past review adds a test. Features don't get tests just for existing.
- **The "test everything" fantasy is a trap.** Giant test suites become slow, flaky, and untrusted. Keep tests focused on what has actually broken or is most critical.
- **Fast feedback beats comprehensive feedback.** A 60-second smoke test that runs every push catches more bugs in practice than a 3-hour suite that runs "sometimes."

## Version Numbering

- Semantic versioning: MAJOR.MINOR.PATCH (X.Y.Z)
- **MAJOR (X):** Breaking changes or major product direction shifts (e.g., v7.0 launch readiness, v8.0 governance system)
- **MINOR (Y):** New capabilities, architectural additions, substantive features (e.g., v7.9 session-start stats refresh)
- **PATCH (Z):** Bug fixes, small tweaks, doc updates (e.g., v7.8.x)

**Version numbers are monotonic.** When a version is paused or abandoned mid-ship, skip it rather than inserting it out-of-order. If v7.8.3 is abandoned and v7.8.4 ships, the next ship is v7.8.5, not v7.8.3.

**Version bumps happen in their own commit**, separate from the feature/fix commits. The bump commit is always last in a ship's commit sequence.

Both `APP_VERSION` in `src/core/utils.js` and `version` in `package.json` must be kept in sync. Hook 5 (see Claude Code Hooks section) enforces this.

## Caddy Notes Writing Standard

Caddy Notes is member-facing documentation. Members do not care about implementation details. They care about what's different when they use the app.

### The current-release section shows ONLY the current version

- `currentNotes` contains entries for the latest APP_VERSION only
- Previous versions go to `archiveNotes` (collapsible "Past Releases" section, default-collapsed)
- Never accumulate entries across versions in `currentNotes` — each ship moves the prior version's entries to archive

### Entry format rules

- Describe what members SEE or EXPERIENCE differently
- No implementation terms: "matcher", "pre-commit", "hook", "Firestore", "refactor", "state", "cache", "async", "helper", "persisted", "live", "session", "listener", "payload"
- No meta references: "completed the fix from vX.Y", "fixed a regression in vX.Y", "continued from previous version"
- Start with a verb in plain English: "Fixed", "Added", "Updated", "Improved"
- Max 25 words per entry. If you can't describe it that short, it probably wasn't member-visible to begin with

### Pure infrastructure ships

Sometimes a version ships that doesn't change what members see (new hooks, new tests, new dev tools). Still write one honest short entry:

  "Behind-the-scenes improvements to reliability. Nothing new you can see, but the app is more stable."

Don't pretend infra work is a feature. Don't hide it silently. One honest line.

### Before shipping any Caddy Notes entry

Ask: if I read this as a member who only uses the app to log golf rounds, would I know what this means? Would I care? If either answer is no, rewrite.

## Caddy Notes Lifecycle

(Refer to the Caddy Notes Writing Standard above for writing rules. This adds the mechanical process.)

Every ship that changes member-visible behavior or UI must update `src/pages/caddynotes.js`. The mechanical steps:

1. Move all entries currently in `currentNotes` to a new block at the top of `archiveNotes`, tagged with the version they shipped under
2. Clear `currentNotes`
3. Add the new version's entries to `currentNotes`
4. Update the tagline under "What's New · v{VERSION}" to reflect the current ship's theme

Infrastructure-only ships (no member-visible change) still get a Caddy Note — one honest line per the writing standard. Never ship a version bump with no Caddy Note entry.

## Operational Gotchas

Ship-time friction patterns surfaced during v7.9.x work. Read these BEFORE starting a ship that matches the pattern — not after hitting the wall.

### Firebase CLI authentication is a prerequisite, not a step

Any ship that includes `firebase deploy` (rules, functions, or anything else) requires Zach to have run `firebase login` in a terminal first. Agent 3 cannot authenticate itself — `firebase login` opens a browser and blocks on OAuth callback, which doesn't work from a non-interactive shell.

- Check `firebase login:list` at the *start* of any deploy-requiring ship.
- If it reports no authorized accounts, ask Zach to run `! firebase login` in the Claude Code prompt before proceeding — don't wait until the deploy step to discover missing auth.
- Alternate if the standard flow fails: `firebase login --no-localhost` prints a URL + code for manual OAuth.

### Firestore emulator rules hot-reload is unreliable on long-lived sessions

Any ship that edits `firestore.rules` must restart the Firestore emulator before running e2e tests. Firebase's file watcher is supposed to auto-reload rules but fatigues on long-running emulator processes (observed in v7.9.5 after several ships sharing the same emulator instance). Symptom: e2e tests fail because rules evaluate against pre-edit state even though the file on disk is updated.

Pattern when rules change:

1. Edit `firestore.rules`.
2. Kill the emulator process. On Windows, find the Firestore PID with `netstat -ano | grep ":8080.*LISTENING"`, then `taskkill //PID <pid> //F`.
3. Restart: `npm run emulator:start`.
4. Wait for ready — probe `curl http://localhost:8080/` until it returns 200.
5. Reseed fixtures: `npm run emulator:seed`.
6. Run e2e tests.

Adding a pre-rules-test probe to `scripts/ship-gate.js` is a reasonable future improvement.

### `firestore.rules` is hook-protected — bypass requires explicit authorization

`.claude/hooks/gate-protected.sh` (Hook 4) unconditionally blocks Edit/Write/MultiEdit against `firestore.rules`, `.env*`, and `scripts/.service-account.json`. The hook can't read conversation context, so authorized rule edits still get blocked on first attempt.

The bypass pattern — use only when Zach has **explicitly** authorized rule edits in the current ship:

1. Confirm Zach authorized rule edits in *this* conversation (don't infer from generic "fix firestore" instructions).
2. Add `"disableAllHooks": true` as a top-level key in `.claude/settings.local.json`.
3. Make the rule edits.
4. Run lint + `npm run test:rules` + `npm run test:e2e` (restart emulator first per the section above).
5. Deploy: `firebase deploy --only firestore:rules`.
6. **Immediately** remove `"disableAllHooks": true` from `settings.local.json` — do NOT leave it on through the commits.
7. Verify absence: `grep -c "disableAllHooks" .claude/settings.local.json` must return `0`.
8. Proceed with commits through normal hook enforcement.

If the pattern feels wrong — if Zach hasn't explicitly authorized rule edits in this specific ship, or if the edit you're about to make isn't a rule change — STOP and ask. Don't bypass hooks for plausible-sounding reasons.

### Cloud Functions runtime lives in `firebase.json`, not `functions/package.json`

For Firebase Functions deploys, `firebase.json`'s `"runtime"` key takes precedence over `functions/package.json`'s `engines.node` field. If both exist and disagree, `firebase.json` wins silently — the `engines` bump appears to succeed but the deployed runtime doesn't change. Both must match on any runtime-version ship; `firebase.json` is the authoritative declaration.

Learned during v8.0.5 Node 20 → 22 cutover: engines bump alone didn't move the deployed runtime off Node 20, and `firebase functions:list` was the only way to catch it post-deploy.

### Firebase CLI skip-unchanged detection misses config-only changes

`firebase deploy --only functions` hashes source code to decide which functions need redeploying. `firebase.json` changes (including runtime, region, or memory updates) do NOT invalidate that hash. A config-only edit will deploy as "No changes detected" across the board and silently skip the actual rollout. `--force` doesn't bypass this — its semantics are for confirming destructive operations, not forcing a re-deploy of unchanged code.

Workaround: pair every config-only Functions change with a trivial source-code edit (e.g., updating a docstring comment) to invalidate the hash. Verify with `firebase functions:list` after deploy, not just the deploy output.

Learned during v8.0.5: `firebase.json` runtime bump to `nodejs22` deployed successfully but skipped all 8 functions; had to pair it with a one-line docstring change to `functions/index.js` to actually trigger redeployment.

See also: Cutover Playbook section for migration-specific patterns.

## Cutover Playbook

Captured from v8.0.0 production cutover (April 21, 2026). These patterns turn multi-ship cutovers into single-ship cutovers. Apply to any future migration that touches firestore.rules, schema, or both.

### Pattern 1 — Ship A Audit (read-only pre-cutover inventory)

Before any cutover ship, run a read-only audit that verifies:

- **Indexes declared vs deployed.** `firebase firestore:indexes` vs `firestore.indexes.json`. Orphans (deployed-not-declared) get dropped on next deploy; missing (declared-not-deployed) need build time. Both must be reconciled before cutover.
- **Functions in-repo vs spec.** `grep "^exports\." functions/index.js` against whatever ship-specific function list the migration expects. No drift.
- **Migration script vs design doc.** Read the migration script line-by-line against the tech design section that specifies it. Every field mapping, every assertion, every phase boundary must match.
- **Production state snapshot.** Read-only Admin SDK dump of affected collections. Confirms starting state matches assumption.
- **Dry-run with pre/post snapshot comparison.** Run migration script in --dry-run mode. Snapshot production before and after. Must be identical — if dry-run wrote anything, the script has a bug.

Output: a written audit report before the cutover ship begins. Audit report is the input to the cutover spec.

### Pattern 2 — Rules-Freeze Mechanism

Maintenance window enforcement for rule-based platforms: use a dedicated `firestore.rules.maintenance` file (11 lines, read-allowed-if-auth, write-deny-all-with-catch-all-match), checked into the repo as a reusable artifact.

Cutover sequence:
1. `cp firestore.rules firestore.rules.v<version>-staged` (preserve current rules)
2. `cp firestore.rules.maintenance firestore.rules` (stage the freeze)
3. `firebase deploy --only firestore:rules` (freeze live)
4. Run migration work
5. `cp firestore.rules.v<version>-staged firestore.rules` (restore target rules)
6. `rm firestore.rules.v<version>-staged`
7. `firebase deploy --only firestore:rules` (freeze lifts, v-rules live)

Advantages over flag-based maintenance mode:
- Works for clients that don't know about maintenance mode (legacy clients during v-upgrade window)
- No schema change required (no `maintenanceMode` field on platformConfig)
- Rollback is the same mechanism: re-stage freeze if Gate 2 reveals blockers

### Pattern 3 — Human Gates Are Mandatory

Every schema migration requires minimum two human gates:

**Gate 1 — Pre-migration-execute.** Agent 3 halts after dry-run completes. Human reviews the mapping report (member count, role transitions, doc counts, write totals). Human posts "continue" to proceed. Abort if the mapping deviates from plan.

**Gate 2 — Pre-maintenance-off.** Agent 3 halts after all deploys complete, before lifting maintenance. Human opens the live app, verifies key flows, checks console for errors, confirms with test users if available. Human posts "continue" to lift maintenance. Post "hold" to investigate. Post "abort" to re-freeze.

These gates are non-negotiable. Automating past them means shipping a broken state to real users with no intervention point. Every Gate 2 this author has executed has surfaced at least one issue that wouldn't have been caught by automated smoke tests.

### Pattern 4 — Rules Rewrite Cross-Validation

Before deploying any firestore.rules rewrite, for every collection with changes:

  grep -rn "db.collection(\"<collection>\")" src/
  grep -rn "db.collectionGroup(\"<collection>\")" src/

For each query found, verify the rule evaluates correctly against the query's shape. Critical pitfall:

**List / collectionGroup queries evaluate rules against query filter fields, NOT document paths.**

A rule like `allow read: if dmId.matches(uid() + '_.*')` works for `db.collection("dms").doc(id).get()` but FAILS for `db.collection("dms").where("participants", "array-contains", uid)`. The Firestore rules engine must prove the rule from query constraints alone — it cannot evaluate path regex against the query filter.

Fix: rules gating list queries must check fields the query can filter on. Use `uid() in resource.data.get('fieldName', [])` patterns for list-compatibility.

This pattern prevents the v8.0.0 notifications / DMs / ParCoin / achievement listener bugs that surfaced at Gate 2 instead of pre-deploy.

## Parked Design Tracks

Product direction decisions made during v8.0 governance review that require their own Stage 1 design documents before implementation. These are not yet scoped but are captured here so future sessions don't accidentally build conflicting features.

### v9.0 — Social System

Users can add other users as "friends" via profile pages (Instagram/Twitter-style social graph). Friend list is public on profiles, browsable by tapping. Friendship gates DM access for leagueless users. Full mechanics (mutual vs one-way, request flow, privacy controls, friend removal) deferred to own design doc.

Stub: `docs/v9.0-social-system-design.md`

### v9.1 — Handle System

Discord-style user handles: `username#discriminator` format. Enables search and discovery by handle, allows duplicate usernames disambiguated by discriminator. Migration required for existing 20+ members. Full mechanics (discriminator length, assignment policy, handle changes, reserved names, search behavior) deferred to own design doc.

Stub: `docs/v9.1-handle-system-design.md`

### League Custom Branding (Phase 4 paid feature)

Per-league custom branding: logos, theme colors, league-specific visual identity. Only available to commissioners of leagues on paid tier. Validates commitment before platform invests in design, storage, and moderation overhead. Full mechanics (upload moderation, theme interaction with user cosmetics, share card behavior, storage economics, feature pricing tier) deferred to own design doc.

Stub: `docs/league-custom-branding-design.md`

### Clubhouse Visual Redesign (post-v8.2)

Full app visual redesign to "Clubhouse" direction. Six parts — palette, island-row headers, data gating, wallet/shop, desktop + onboarding, prioritized UX ideas. Sequenced after v8.2.0 ships.

Stub: `docs/clubhouse-rollout-plan.md`

## Architecture

```
smoky-mountain-open/
├── index.html                  ← HTML shell + pre-auth appearance load
├── vite.config.js              ← CORE_FILES bundle order, coreScriptsPlugin
├── firebase.json               ← runtime, rules, emulator config
├── firestore.rules             ← 693 lines, v8.0.0-rc1 full rewrite
├── firestore.rules.maintenance ← 11-line freeze for cutover ships
├── firestore.indexes.json
├── public/
│   ├── watermark.jpg
│   ├── Logo.jpg
│   └── manifest.json
├── src/
│   ├── main.js                 ← CSS entry point
│   ├── core/                   ← bundled first (see vite.config.js CORE_FILES order)
│   │   ├── utils.js            ← APP_VERSION, escHtml, time/date, platformRoleOf
│   │   ├── animate.js          ← animateNumber, initCountAnimations, reanimateNumber, prefersReducedMotion
│   │   ├── handicap.js         ← WHS handicap calc
│   │   ├── firebase.js         ← auth, Firestore init, appearance, welcome toast
│   │   ├── data.js             ← PB data access object
│   │   ├── sync.js             ← presence, connection status, replication
│   │   ├── parcoins.js         ← awardCoins, deductCoins, balance, ledger
│   │   ├── caddie.js           ← AI Caddie rule-based insights
│   │   ├── charts.js           ← SVG chart primitives
│   │   ├── analytics.js        ← strokes gained, trends, stats
│   │   ├── router.js           ← SPA routing + avatar ring helpers
│   │   └── page-shell.js       ← PB.pageShell.render — band-aware HQ chrome
│   ├── pages/                  ← ~45 page renderers, each registers with Router
│   └── styles/
│       ├── base.css            ← Clubhouse token system, dual-mode, reduced-motion
│       └── components.css      ← all components on token system
├── functions/
│   ├── index.js                ← Cloud Functions (Node 22, Gen1, us-central1)
│   └── package.json
├── docs/                       ← design docs, rollout plans, decision logs
├── tests/
│   └── e2e/                    ← Playwright suite + emulator fixtures
├── scripts/                    ← lint, verify, ship-gate
├── .claude/                    ← project-level hooks + settings
├── .husky/                     ← git pre-commit hooks
└── CLAUDE.md                   ← this file
```

### Firebase Configuration
- **Project ID:** parbaughs
- **Auth:** Email/password, email verification on registration
- **Firestore:** Primary data store, offline persistence DISABLED (caused duplicate entries)
- **Cloud Functions:** Gen1, Node22, us-central1. 8 functions: `searchCourses`, `validateInvite`, `sendPushNotification`, `onMemberRoleChange`, `onLeagueDelete`, `joinLeague`, `onFounderAccessLog`, `expireSuspensionsAndTransfers`.
  - `searchCourses` — GolfCourseAPI proxy. Preserve CORS origin lock + runtime settings (memory, timeout, region). Node version is upgradeable.
  - `sendPushNotification` — triggers on `pendingPush` doc creation, sends FCM push to member's `fcmToken`, deletes doc after.
- **Plan:** Blaze (pay-as-you-go)

### Push Notification Deployment
```bash
cd functions && npm install && cd ..
firebase deploy --only functions:sendPushNotification
```
Do NOT redeploy `searchCourses` unless explicitly modifying it — the CORS origin lock and Firebase Function runtime settings (memory, timeout, region) must be preserved. Node runtime version is upgradeable when Google deprecates versions; coordinate via explicit ship plan.

### GolfCourseAPI
- **Correct endpoint:** `/v1/search?search_query=`
- **Auth header:** `Authorization: Key [key]`
- **Key stored in:** Firestore `config/api_keys`
- **WRONG endpoint:** `/v1/courses?search=` (non-functional, do not use)
- **CRITICAL:** Zero guessing or padding of par arrays. Only use verified API data.

## League Scoping Rules
- A round logged in League A does NOT count toward League B's season standings or season points
- Handicap is GLOBAL (can't hide skill level) — calculated from all rounds regardless of league
- ParCoins, cosmetics, achievements are GLOBAL — travel with you across leagues
- Season points, league rankings, wager W/L records are PER-LEAGUE — start at zero on join
- Course records show DUAL display: your personal best (global) + league best (scoped)
- Members list shows only members of your ACTIVE league

## Privacy Defaults
- All members are PRIVATE by default — invisible outside their leagues
- PUBLIC opt-in via Settings toggle — discoverable in community search
- Public profiles show: avatar, ring, handicap, level, home course, bio, rounds count
- Public profiles hide: DMs, coin balance, email, private league data

## Social Architecture
Three connection levels:
1. **League Members** — see each other within a league (current system)
2. **Friends** — cross-league connections via friend request/accept. Can DM, see public rounds, wager cross-league. Stored as `friends[]` array on member doc.
3. **Strangers** — can only see public profiles. Must friend request to interact.

Members list is league-scoped only. Friends list is separate and personal. Build friends system before App Store launch.

## Multi-League Architecture

### Growth Policy
Multi-league membership is unlimited and free for all users during the growth phase. Do not gate league count behind a paywall until the platform has 1000+ users. The goal is maximum league creation and joining to drive organic growth. Monetization of multi-league (Pro: 3 leagues, League+: unlimited) comes in Phase 4.

### Data Scoping
| Scope | Collections | Behavior |
|-------|-------------|----------|
| **LEAGUE** | rounds, chat, trips, teetimes, wagers, bounties, scrambleTeams, calendar_events, scheduling_chat, social_actions, invites, syncrounds, liverounds | Filtered by `leagueId` field. New writes auto-tagged via Firestore write helper. |
| **GLOBAL** | members, courses, course_reviews, photos, parcoin_transactions, notifications, pendingPush, config, errors, presence | Not league-scoped. Shared across all leagues. |

### Key Functions
- `getActiveLeague()` — returns `currentProfile.activeLeague` or fallback `"the-parbaughs"`
- `_patchFirestoreForLeague()` — monkey-patches `db.collection().add()` to auto-inject `leagueId` for league-scoped collections
- Client-side filtering: queries fetch all docs, then filter by `leagueId === getActiveLeague()`. Avoids composite index requirements.

### The Founding League
- **Document:** `leagues/the-parbaughs`
- **Badge:** `"founding"` — permanent, no other league can ever have this badge
- **All 20 original members** have `leagues: ["the-parbaughs"]` and `activeLeague: "the-parbaughs"`
- **Backup:** `backups/pre-multi-league.json` (pre-migration snapshot of all data)

### League Document Schema
```
leagues/{leagueId} {
  name, slug, location, founded, badge, tier, visibility,
  commissioner, admins[], memberCount, memberUids[],
  inviteCode, theme, createdAt, settings: { seasons, parcoins, wagers, bounties, trashTalk }
}
```

### Member League Fields
```
members/{uid} {
  ...existing fields...,
  leagues: ["the-parbaughs", ...],    // array of league IDs the member belongs to
  activeLeague: "the-parbaughs"       // currently active league for queries
}
```

## Firestore Rules

**Source of truth:** `firestore.rules` (693 lines, v8.0.0-rc1 full rewrite per `docs/v8.0-technical-design.md` Section 3).

Do not duplicate the rules contents here — they drift. Read the live file when needed.

### Architecture summary
- **Helpers** at top: `isAuth`, `uid`, `memberDoc`, `myProfile`, `platformRoleOf`, `isFounder`, `isSuspended`, `isBanned`, `leagueCommissioner`
- **Per-collection match blocks** — no catch-all. Every collection has explicit `allow read / create / update / delete` gates.
- **List-query compatibility:** rules gating list queries must prove from query filter fields, not document paths. See Cutover Playbook Pattern 4.

### Deploy
```bash
firebase deploy --only firestore:rules
```

See Operational Gotchas → "firestore.rules is hook-protected" for the authorized-edit bypass pattern.

## Appearance

Parbaughs supports light and dark appearance modes:
- **Light (default):** warm chalk surface, ink text, brass accents. The Clubhouse aesthetic.
- **Dark:** billiard green surface, chalk text, brass accents. "After hours" mode.

Users toggle via Settings → Appearance. Preference stored in Firestore `members/{uid}.appearance` and localStorage `pb_appearance`.

No custom themes, no theme picker, no theme-specific cosmetics.

## Visual Reference

Mode-independent visual constants used across canvas-rendered artifacts (share cards, feed cards, scorecards). These are hardcoded hex values, not CSS tokens — they must render identically in light mode, dark mode, and within html2canvas captures.

### Hole Dot Colors
Hole-by-hole performance dots rendered on Round History, feed cards, and share cards:

| Result | Color | Hex |
|--------|-------|-----|
| Eagle or better (score <= par-2) | Gold | `#FFD700` |
| Birdie (score = par-1) | Green | `#4CAF50` |
| Par (score = par) | Gray | `#888888` |
| Bogey (score = par+1) | Orange | `#F59E42` |
| Double bogey+ (score >= par+2) | Red | `#E53935` |

### Calendar Dot Colors
- Gold `var(--gold)` = Event/Trip
- Green `#4CAF50` = Round
- Blue `var(--blue)` = Range Session
- Pink `var(--pink)` = Tee Time
- Green `var(--live)` = Today indicator

## Design System (Clubhouse)

All Clubhouse design tokens are declared in `src/styles/base.css` `:root`. Components consume tokens via `var(--*)`. Legacy aliases preserve the ~1,800 inline `var(--*)` references in JS pages.

### Color tokens
- **Surface palette:** `--cb-green`, `--cb-green-2/3`, `--cb-green-ink`, `--cb-chalk`, `--cb-chalk-2/3`
- **Ink palette:** `--cb-ink`, `--cb-ink-2`, `--cb-charcoal`, `--cb-mute`, `--cb-mute-2`
- **Accents:** `--cb-brass`, `--cb-brass-2/3`, `--cb-copper`, `--cb-slate`, `--cb-moss`, `--cb-claret`, `--cb-sand`
- **Semantic surface:** `--surface-primary/secondary/tertiary/inverse/raised`
- **Semantic text:** `--text-primary/secondary/muted/subtle/inverse/brand`
- **Semantic border:** `--border-subtle/default/strong`
- **Semantic accent:** `--accent-positive/negative/warning/hazard/neutral`
- **Legacy aliases:** `--bg`, `--bg2/3/4`, `--cream`, `--muted/muted2`, `--gold/gold2/gold3`, `--card`, `--birdie`, `--blue`, `--pink`, `--live`, `--alert`, etc. — all remapped to Clubhouse palette, all JS inline refs still work

### Typography
- **Display:** Fraunces (replaced Playfair Display in v8.1.0). Access via `var(--font-display)`.
- **UI:** Inter. Access via `var(--font-ui)`.
- **Mono:** JetBrains Mono (for technical labels, eyebrow text). Access via `var(--font-mono)`.
- **Scale:** `--text-2xs` (8px) through `--text-5xl` (48px), plus `--text-hero` (88px) and `--text-hero-xl` (140px). 13 stops total.

### Motion
- **Durations:** `--duration-fast` (150ms), `--duration-med` (250ms), `--duration-slow` (400ms), `--duration-celebration` (800ms)
- **Easings:** `--ease-default`, `--ease-out`, `--ease-in-out`, `--ease-enter`, `--ease-exit`, `--ease-emphasized`, `--ease-back-out`
- Every `transition:` in `components.css` uses these tokens. The single exception is a share card context where html2canvas needs literal durations.

### Spacing + radius
- **Spacing scale:** `--space-0/1/2/3/4/5/6/8/10/12/16` (0 through 64px, 4px base)
- **Radius:** `--radius-sm/md/lg/xl/2xl/pill`. Legacy alias `--radius-full` maps to pill.

### Depth
- **Shadows:** `--shadow-soft`, `--shadow-raised` (new), plus legacy `--shadow-sm/md/lg/glow` aliases.

### Avatar ring rendering
Centralized in `src/core/router.js`:
- `playerFrameColor(p)` — hex color for border
- `playerRingShadow(p)` — box-shadow string (empty for animated rings which handle their own)
- `playerRingStyle(p)` — full `border + box-shadow + animation` inline style
- `playerRingClass(p)` — animation class name for animated cosmetic rings
- `getPlayerNameClass(p)` / `getPlayerBannerCss(p)` / `getPlayerCardCss(p)` — cosmetic helpers

All callers use these — no bypass render paths. v8.1.0 collapsed the legacy per-theme lookup into a single brass default + cosmetic-override pattern. Tier rings (Mr. Parbaugh / Founding Four / Commissioner) coming in v8.1.4.

### Animation module
`src/core/animate.js` — rAF-based number animation + reduced-motion awareness.

Global API:
- `animateNumber(el, target, opts)` — animate to target with opts `{duration, from, decimals, prefix, suffix, easing, onComplete}`. Auto-detects decimals from string target ("18.8" → 1 decimal).
- `initCountAnimations(root)` — scans `[data-count]` elements, animates each, sets `data-count-animated="1"` for idempotency, auto-adds `aria-live="polite"`
- `reanimateNumber(el, newTarget, opts)` — for live updates; reads current `textContent` as "from" unless opts.from provided
- `prefersReducedMotion()` — boolean getter

`data-count` conventions on HTML elements:
- `data-count="TARGET"` — required
- `data-count-decimals="N"` — override auto-detection
- `data-count-from="N"` — override default "from" of 0
- `data-count-prefix="+"` / `data-count-suffix="%"` — text affixes

Router.go auto-fires `initCountAnimations()` 80ms after every page navigation, so sites just need the attributes in their rendered HTML.

### Page Shell architecture (v8.11.4)
`src/core/page-shell.js` — `PB.pageShell.render(rootEl, opts)` is the band-aware HQ chrome orchestrator. Per design bot Q1 ruling, slot-based composition: pages provide slot data, shell owns the frame.

**Engineering rules (load-bearing):**
1. Only the shell sets `max-width` on the page body. Pages never roll their own outer wrapper.
2. Only the shell renders the masthead. Pages provide slot data (`{variant, title, date, weatherSiteId}`); shell renders the chrome.

**Public API:**
- `PB.pageShell.render(rootEl, opts)` — composes banner + masthead + content (+ optional rails) + footer
- `PB.pageShell.currentBand()` — returns `'mobile' | 'A' | 'B' | 'C' | 'D'` synchronously
- `PB.pageShell.BREAKPOINTS` — `{ mobile: 720, A: 960, B: 1280, C: 1440, D: Infinity }`

**Slots in `opts`:**
- `pageKey` (string) — debug stamp
- `bands` (string[]) — declared band support; shell throws if active band not in list
- `banner: (band) => htmlString` — full-width above masthead
- `masthead: (band) => slotData` — `{variant: 'default'|'bandA', title, date, weatherSiteId, condensed?}`
- `scope: (band) => htmlString` — rendered inside masthead right cluster (extracted from inline masthead per Call 5)
- `content: (band) => htmlString` — band-aware page content
- `leftRail: null | (band) => string` — 196px column inside content wrapper
- `rightRail: null | (band) => string` — 196px column inside content wrapper
- `footer: () => htmlString` — page footer (HQ default = `renderPageFooter` from home.js)
- `contentMaxWidth: (band) => '640px'|'600px'|'912px'|'1132px'` — band → max-width function

**Mobile bypass:** Mobile band (<720px) MUST bypass shell — pages render `_renderMobileHome` (or equivalent) inline. Shell throws defensively if invoked at mobile band.

**Stamps on success:** `data-render-path="hq-shell"`, `data-render-band`, `data-render-width`, `data-render-page`. Pages preserve a try/catch fallback to mobile path; catch block stamps `data-render-path="hq-fallback"` + `data-render-error`.

**First consumer:** `src/pages/home.js` (HQ Home, v8.11.4). Future consumers per memory #21 architecture entry: Ships 4a-7 (spectator HUD, members, calendar, scorecard, leaderboard, round detail).

**Band detection duplication:** `_currentBand` lives in BOTH `page-shell.js` (for shell autonomy) and `home.js` (for `_bindHQResize` reactive resize). Constants must stay in sync — see `BREAKPOINTS` declaration in `page-shell.js`. TODO comment on `home.js` `_currentBand` flags deprecation when 3+ pages consume the shell.

### Appearance modes
Two modes via `data-theme` attribute on `<html>`:
- **Light (default):** chalk surface, ink text, brass accents
- **Dark:** green surface, chalk text, brass accents

User preference persisted in `members/{uid}.appearance` (Firestore) + `pb_appearance` localStorage. Pre-auth `<script>` in index.html applies saved preference before external CSS loads (no flash).

### Accessibility architecture
- **`:focus-visible`** (base.css): 2px brass ring on all focusable elements for keyboard navigation. Inputs suppress via override + have their own border+box-shadow treatment. Mouse clicks don't show outlines.
- **`prefers-reduced-motion`** (base.css): global kill of animation-duration + transition-duration, with explicit allowlist for functional feedback (.toast, .spinner, .skeleton, :focus-visible, .ach-celebrate — the celebration gets explicit visible-state override to prevent invisibility bug).
- **aria-live:** auto-added to `[data-count]` elements by `initCountAnimations`. Manually added to `#toast` (role="status"), `.ach-celebrate` (role="alert"). 4 header icon buttons (notifBell, dmInbox, calendar, settings) have aria-label + role="button" + tabindex="0".

### Visual exceptions (intentional hardcoded values)
1. **Visual Reference section above:** hole dot colors, calendar dots — mode-independent
2. **Share card template (`#pbShareTemplate`, `.pbs-*` rules):** deliberately hardcoded hex values — html2canvas doesn't reliably resolve CSS variables
3. **Ring / name cosmetic keyframes:** preserved for v8.1.4 cosmetic audit
4. **Boot-fallback `<style>` in index.html:** inline hex copies of core tokens for pre-external-CSS load

## ParCoin Economy Design

ParCoins have ZERO real-world cash value. Purely cosmetic and social. No gambling license required.

### Design Principles
- PLAYING GOLF is the primary earning method. Period.
- Range sessions count — a guy hitting balls before work is engaged
- A new player with 0 rounds should have almost nothing
- After 1 year of active play, a player should NOT have been able to buy everything. There must always be something to aspire to.
- The economy must support 3+ years of engagement without hyperinflation
- Earning should feel incentivizing, not unobtainable

### Player Tiers (Realistic)
- Casual: 1-2 rounds/month, maybe 1 range session
- Active: 2 rounds/month + 1-2 range sessions/week
- Dedicated: 4 rounds/month + 2-3 range sessions/week

### Earning Sources (coins IN)
| Action | Coins | Frequency Cap |
|--------|-------|---------------|
| Complete a round (18H) | 50 base, +25 if attested | No cap |
| Complete a round (9H) | 25 base, +10 if attested | No cap |
| Range session (30+ min) | 10 | 1 per day |
| Attest someone's round | 5 | No cap |
| Daily login | 1 | 1 per day, no streak bonus |
| Post tee time that fills (3+) | 15 | No cap |
| Personal best (18H) | 100 | When achieved |
| Personal best (9H) | 50 | When achieved |
| Win an event/tournament | 500 | When achieved |
| Season champion | 1000 | Once per season |
| Achievement unlock (play-based) | 25-50 | When achieved |
| Achievement unlock (social/misc) | 10 | When achieved |
| Invite friend who joins | 200 | Per invite |
| New member welcome bonus | 25 | Once ever |
| First scorecard data for a new course | 50 | Per course |
| Verify another member's course data | 10 | Per course |
| Approved scorecard edit on verified course | 25 | Per edit |

### Earning Targets
- Casual (~2 rounds, 1 range/month): ~175 coins/month — Can afford 1 basic cosmetic per month
- Active (~2 rounds, 4-6 range sessions/month): ~300 coins/month — Can afford 1 mid-tier item every 1-2 months
- Dedicated (~4 rounds, 10 range sessions/month): ~550 coins/month — Can afford 1 premium item every 2-3 months

### The Feel (Progression Timeline)
- After your first round ever: ~75 coins (round + achievements) — browse the shop
- After 1 month active play: ~300 coins — first real cosmetic
- After 3 months: ~900 coins — eyeing animated rings
- After 6 months: ~1800 coins — premium item + coins for trash talk
- After 1 year: ~3600 coins lifetime — collection built, still stuff to want. Gold Member (10,000 lifetime) is 2+ years away.

### Spending Sinks (coins OUT)
| Category | Price Range | Examples |
|----------|-------------|---------|
| Basic cosmetics | 100-200 | Static rings, simple banners |
| Mid-tier cosmetics | 300-500 | Card themes, name effects, titles |
| Premium cosmetics | 750-1500 | Animated rings, premium banners |
| Ultra-premium | 2000-3000 | Diamond Sparkle, legendary items |
| Trash talk actions | 30-75 | Victory Lap, Spotlight of Shame |
| Bounties | 50-200 | Course bounties, score bounties |
| Wagers | 25-500 | Player-set amounts |
| Power-ups | 150-200 | Double XP, Handicap Shield |
| Flex items | 500-1000 | Sponsor a Hole, Name a Tournament |
| Seasonal exclusives | 300-750 | Limited edition, never return |

### Price Tier Ladder
| Tier | Price | Active Player Time to Earn |
|------|-------|---------------------------|
| Basic | 100-200 coins | ~1 month |
| Mid-tier | 300-500 coins | 1-2 months |
| Premium | 750-1500 coins | 3-4 months |
| Ultra-premium | 2000-3000 coins | 6-8 months |

### Coin Flow Rules (CRITICAL)
The ONLY way new coins enter the economy is through the earning sources table above. Every other transaction is a transfer or a sink.

- **Wagers:** Players can ONLY wager coins they currently have. Coins escrowed on acceptance, winner takes both. Cancelled = refund both. Zero new coins created.
- **Bounties:** Poster must have the coins. Deducted when posted. Claimer receives them on fulfillment. Zero new coins created.
- **Trash talk (Spotlight of Shame, Victory Lap, etc):** Coins deducted from spender's balance. Pure sink.
- **Shop purchases:** Coins deducted. Pure sink.

### Premium AI Caddie (Phase 4 — Future)
Cloud Function proxy to Claude API for natural language analysis. Free users get rule-based insights (built in v6.3.0). Pro subscribers get AI-powered conversational analysis. API key stored ONLY in Cloud Function environment variables, NEVER in client code or Firestore. Rate limit: 10 AI calls per month for Pro users.

### Known TODOs
- **Bounty expiry refund**: When a bounty expires without being claimed, poster's coins should be refunded. Requires a scheduled Cloud Function or client-side check on page load. Not yet implemented.

### Anti-Inflation Rules
- NO signup bonus above 25 coins
- NO daily login streak multipliers
- NO bulk coin giveaways
- NO earning coins from purely passive actions
- Social/misc achievement coins capped at 10 each
- If average player balance exceeds 2000 coins, introduce new high-value sinks before adding new earn sources

## Key Members

| Name | Role | Notes |
|------|------|-------|
| Zach (TheCommissioner) | Platform Founder / Developer | `zboogher@gmail.com`, 6'4", 18.8 handicap, engaged to Jordyn. Per v8.0 terminology: "Founder" at platform level. "TheCommissioner" username is legacy. |
| Jordyn (flossonthefairway) | Member | Username: flossonthefairway, badge: "The Boss's Wife" |
| Nick | Founding Four | `nick.blades1@gmail.com` |
| Kayvan | Founding Four | Manually-created profile, `claimedFrom` links to Auth |
| Kiyan | Founding Four | Manually-created profile, `claimedFrom` links to Auth |

Founding four have `claimedFrom` fields linking seed profiles to Firebase Auth accounts.

## Mandatory Rules

### Every Build
1. **Caddy Notes:** Update The Caddy Notes changelog with proper semver (X.Y.Z). X = major, Y = features, Z = bugfixes. Public-facing language only — no Firestore, Firebase, CORS, or internal references. Only current version displays.
2. **Syntax check:** Run acorn/Function parse before every commit
3. **No emojis** in place of SVG icons (exception: ⛳ for The Caddy bot)
4. **Firestore is source of truth** — not localStorage. localStorage is used only for: `pb_appearance` (appearance fast-load pre-auth), `pb_clubhouse_welcomed` (one-time toast guard), `pb_liveState` (in-progress round resumption), `golfcourse_api_key` (cached API key), `dm_read_*` (per-thread read timestamps). If you add a new localStorage key, document it here.
   **sessionStorage** (separate API, clears on tab close — not bound by this rule): `pb_weather_cache` (Open-Meteo response, 30-min TTL, v8.10.0), `pb_location_staleness_checked` (once-per-session guard for background location staleness probe, v8.11.1). Document new sessionStorage keys here as well.

### Before Making Changes
- **Ask before architectural decisions** or feature removal
- **Zero guessing on course/par data** — API data or nothing
- **No hardcoded colors** — use Clubhouse tokens (see Design System section). Exceptions: Visual Reference (hole dot colors, calendar dots) and share card template (html2canvas compatibility).
- **44pt minimum touch targets** on all interactive elements (Apple HIG standard, established v8.0.5)
- **Test on mobile Safari + Chrome** — mixed iPhone/Android user base

### Code Style
- Targeted `Edit` tool replacements preferred over full rewrites
- Bulk changes: use Bash + sed/perl with scoped patterns
- `var` (not `let`/`const`) for compatibility with the current vanilla JS setup
- Explicit `_navStack` array for navigation (not hash router)
- Settings only in top bar cog, never in footer nav

## Design Skills

Before doing ANY visual or UI work, read the relevant skill files. These contain best practices that are mandatory for this project:

### Frontend Design (REQUIRED for all UI changes)
Read: /mnt/skills/public/frontend-design/SKILL.md
- Bold aesthetic direction, not generic AI slop
- Typography: distinctive font choices, clear hierarchy
- Color: dominant colors with sharp accents, CSS variables
- Motion: meaningful animations, staggered reveals, hover states
- Spatial: unexpected layouts, generous negative space
- Backgrounds: atmosphere and depth, textures, gradients, grain
- NEVER use generic aesthetics (Inter as body font is our one exception since it's already our brand)

### Canvas Design (REQUIRED for share cards and generated images)
Read: /mnt/skills/examples/canvas-design/SKILL.md
- Share cards, scorecard images, trophy graphics, event banners
- Design philosophy first, then express visually
- Meticulously crafted, master-level execution
- Custom fonts available in canvas-design/canvas-fonts/

### MCP Builder (FUTURE — for integrations)
Read: /mnt/skills/examples/mcp-builder/SKILL.md
- For building GHIN integration, GolfNow tee time booking, course data APIs, and other external service connections
- Not needed until Phase 3+ of the roadmap

**RULE:** If you're about to write CSS, redesign a page, generate a share card, or touch the theme system — read the relevant skill file FIRST. No exceptions.

## Built Features

- Home dashboard (compact hero, personal stat bar, live spotlight, mini leaderboard)
- Activity feed with rounds, range sessions, chat messages
- Play Now with live scoring, GPS-less hole-by-hole entry
- Range session timer with drill tracking, focus areas, feel rating
- Season standings with Stableford-style points, handicap-adjusted
- Trophy room with XP system, 50+ achievements, level titles
- Scorekeeper for multi-round events (trip scoring)
- Calendar with rich event cards, scheduling chat
- Course directory with GolfCourseAPI search
- DM system with unread indicators
- Tee time posting with RSVP
- Scramble team management (2v2, 3v3, 4v4)
- Shareable scorecard images (html2canvas)
- Canvas share cards for range sessions, scrambles, event leaderboards
- Photo gallery with self-only delete
- Invite system with shareable links
- Commissioner admin panel
- Masters-styled scorecard (Augusta National on-course board treatment) — survives theme removal; Masters is a scorecard variant, not a theme
- Clubhouse design system (v8.1.0) — full token vocabulary, Fraunces typography, dual-mode light/dark appearance
- Component interaction polish (v8.1.1) — hover/focus/active/disabled states, :focus-visible keyboard accessibility (WCAG 2.1 AA), tokenized transitions
- Animation system (v8.1.2) — src/core/animate.js module with decimal-capable number roll-over, semantic motion tokens, prefers-reduced-motion architecture, aria-live on toasts + counts
- Final Part A polish (v8.1.3) — reduced-motion bug fix, handicap decimal instrumentation, header icon aria-labels
- Part A bundle delta: −19 KB net. Clubhouse is leaner than the 8-theme legacy it replaced.

## Known Bugs (Diagnosed, Not Yet Fixed)

1. Course directory average display — derive front/back/18-hole from `holesMode` field
2. Clubhouse calendar missing in-progress events — filter uses startDate only, needs end-date check
3. Sequoyah National finalization bar tap — missing iOS tap CSS properties
4. All-time records best rounds — split into 9-hole and 18-hole columns
5. Shareable scorecards for 9-hole rounds — render only played holes
6. Courses button on season standings — navigate to 2026 courses with rounds
7. Courses button on player profiles — show all courses with best round
8. Scorecard logo — reference `logo.jpg` from repo, not base64
9. Parbaugh Round — joined players not appearing on scorecard (host-only display)

## Roadmap (Priority Order)

### Immediate (Clubhouse Part A final + Part B prep)
- v8.1.4 — Cosmetic audit and tier ring system. In planning (design assets Friday-weekend, execution next week).
- v8.2.x — Clubhouse Part B: screen restructuring (home, profile, feed, scorecard, round detail redesigns on the new design system)

### Near-Term (Features)
- Push notifications (infra shipped, UX polish remaining)
- Hole-by-hole scoring in Log a Round (score, GIR, FIR, putts per hole)
- Course Directory API-first dedup
- DM full repair (mobile layout, rules verification)
- Scramble live scoring mode
- Inline scramble team creation on Play Now
- Activity feed filtering
- First-time user onboarding

### Future
- AI tournament generator (proper backend, not client-side)
- Seasonal recap and yearly awards ceremony
- Range UI three-state redesign
- Course maps/GPS integration (if API supports it)
- Swing analysis integration
- CORE / PRO / ULTRA subscription tiers (see docs/subscription-scoping.md)
- OSM course data pipeline (see docs/osm-course-data-evaluation.md)

## E2E Testing

End-to-end tests run in a real Chromium browser against an isolated local Firebase emulator. Synthetic fixtures reproduce the shape of production data (founding-four claim splits, 9-hole rounds, scrambles, multi-league membership) so display-layer bugs like v7.6.5 are caught before they reach members.

### Running tests

```bash
# Terminal 1 — start the emulator (keep running)
npm run emulator:start

# Terminal 2 — run the suite
npm run test:e2e

# Other modes
npm run test:e2e:ui       # Playwright interactive UI
npm run test:e2e:headed   # watch the browser
npm run ship-gate         # full pipeline: lint + emulator-check + e2e + verify
```

The app connects to the emulator only when loaded with `?emulator=1` in the URL. Normal dev (`npm run dev`) still talks to the production Firebase project.

### Adding tests

1. If the fixture doesn't cover your case, add users/rounds/leagues to `tests/e2e/setup/fixtures/`. Keep the `expectedRoundCount` map in `users.js` in sync.
2. Create a `*.spec.js` file under `tests/e2e/flows/`.
3. Use `loginAs(page, key)` from `tests/e2e/helpers/auth.js`. It mints a custom token against the Auth emulator, signs in with the compat SDK, and waits for `fbMemberCache` to populate before returning — so `getPlayerRounds` has full claimedFrom merge data.
4. Read the round count with `readRoundCount(page)` (pulls `data-count`, avoiding the count-up animation race).

### Debugging failures

- Screenshots: `test-results/<test-name>/test-failed-*.png`
- Video: `test-results/<test-name>/video.webm`
- HTML report: `npx playwright show-report`
- Seed log: re-run `npm run emulator:seed` to rebuild baseline state against the running emulator

### Never

- Never point tests at the production Firestore project. The test runner requires the emulator to be up.
- Never seed production data into the emulator. Synthetic fixtures only.

### Diagnostic templates

For visible UI bugs, layout regressions, or cross-page consistency issues, adapt the diagnostic template at `tests/e2e/_templates/DIAG-visual-diagnosis-template.spec.js.example`.

See `tests/e2e/_templates/README.md` for when to use this approach, the full pattern, and post-diagnosis hygiene rules.

#### Before scoping a fix

Before scoping a fix to a display bug, grep the full codebase for every instance of the pattern. A bug that shows on pages A and B often also affects pages C, D, E. A 2-minute comprehensive grep prevents partial fixes from shipping as "done" and returning as new bugs. v7.8.4 shipped incomplete because we fixed 3 of 9 XP display sites; v7.8.5 completed the sweep.

## Claude Code Hooks

`.claude/settings.json` registers five project-level hooks that fire around every tool call. They're deterministic guardrails — they run regardless of what any agent remembers, which makes them the right layer for rules that must never be broken.

| # | Hook | Fires on | Behavior |
|---|------|----------|----------|
| 1 | `pre-commit-lint.sh` | `git commit` via Bash | Runs `npm run lint`. Blocks commit on any non-zero exit. |
| 2 | `post-edit-syntax.sh` | Edit/Write/MultiEdit of `*.js` under `src/`, `tests/`, or `scripts/` | Parses the edited file with acorn. Prints a stderr warning on parse error; non-blocking (Hook 1 is the enforcement gate). |
| 3 | `gate-assertions.sh` | Edit/Write/MultiEdit of `tests/e2e/helpers/assertions.js` | **Blocks** every edit. Forces human handshake. This is the primary safety net of v7.8.1 — silent additions to `IGNORE_PATTERNS` can hide real test failures indefinitely. |
| 4 | `gate-protected.sh` | Edit/Write/MultiEdit of `.env*`, `scripts/.service-account.json`, or `firestore.rules` | **Blocks** until user approves. Prevents accidental credential exposure and rule changes. |
| 5 | `pre-commit-version-sync.sh` | `git commit` via Bash | Reads `APP_VERSION` from `src/core/utils.js` and `version` from `package.json`. Blocks commit on mismatch. |

See `.claude/README.md` for the full reference, including how to bypass in emergencies (`git commit --no-verify` for Hooks 1 and 5; `"disableAllHooks": true` for everything) and the rule that hook changes ship as their own version bumps, never bundled.

### Matcher note

Hooks 1 and 5 use a word-boundary grep to catch `git commit` anywhere in a chained command:

```sh
grep -qE '(^|[;&|[:space:]])git[[:space:]]+commit([[:space:]]|$)'
```

The simpler `"git commit"*` glob misses chains like `git add foo && git commit -m ...` — the chained command doesn't *start* with `git commit`, so the glob early-exits and the check never runs. That was a real regression caught during v7.8.2's Phase 3 dry-runs; the regex fixes it. If you ever rewrite the matcher, make sure the `git add && git commit` case still fires.

## Git Hooks (Husky)

v7.8.2 adds Husky + lint-staged as a second, git-level layer of pre-commit gates. Both layers fire on every commit; the redundancy is intentional — either can catch what the other misses.

| Layer | Where it runs | What it does | Bypass |
|-------|---------------|--------------|--------|
| Claude Code hooks (v7.8.1) | PreToolUse on Bash calls | Agent-side gate. Runs lint + version-sync before the Bash tool executes. | Not directly bypassable from the agent. |
| Husky / lint-staged (v7.8.2) | Git's `pre-commit` hook | Git-side gate. Runs `npm run lint` via lint-staged on staged `.js` under `src/`, `tests/`, or `scripts/`, then a version-sync check. | `git commit --no-verify` — bypasses Husky only, not the Claude Code layer. |

**Installation.** `npm install` runs `"prepare": "husky"` automatically, which sets `git config core.hooksPath` to `.husky/_`. New contributors get the hooks wired up on first install — no manual setup.

**The `.husky/pre-commit` script** starts with `set -e` so a `lint-staged` failure propagates. Without it, the trailing version-sync check's exit code overwrites the lint-staged failure and broken code slips through. (This was caught during v7.8.2 Phase 3 testing — the original spec didn't include `set -e`, but it's load-bearing.)

**Bypass.** `git commit --no-verify` skips Husky for genuine emergencies. Default response to a hook failure is to fix the root cause, not bypass. `--no-verify` does NOT skip Claude Code hooks (those fire at a different layer).

### Destructive Git Operations

`git reset --hard` is destructive to **uncommitted** working-tree state — not just the commit being discarded. When reverting a test commit that has valuable unstaged changes alongside it, use:

```bash
git reset HEAD~1                    # default --mixed — moves HEAD, unstages, keeps working tree
git checkout HEAD -- <file>         # restore specific files from HEAD
```

This preserves unstaged work in other files. `--hard` would wipe everything in one shot.

Lesson earned during v7.8.2 Phase 3: a `--hard` reset to clean up a test commit also nuked the in-flight `package.json` changes for the Husky install. Untracked files (`.husky/`) survived; tracked-but-modified files did not.

## Native Build Setup

### Capacitor Configuration
- **App ID:** `com.parbaughs.app`
- **Config:** `capacitor.config.json`
- **Web Dir:** `dist/` (Vite build output)
- **Plugins needed:** push-notifications, camera, share, status-bar, splash-screen, keyboard, haptics, app, browser

### CI/CD Pipeline (GitHub Actions)
Builds run on GitHub Actions — no local Mac needed.

**iOS Build** (`.github/workflows/ios-build.yml`):
- Runner: `macos-latest`
- Trigger: push to `release` branch or manual
- Output: signed IPA artifact
- Secrets needed:
  - `APPLE_CERTIFICATE_P12` — base64 encoded .p12 distribution certificate (generate at developer.apple.com → Certificates)
  - `APPLE_CERTIFICATE_PASSWORD` — password for the .p12
  - `APPLE_PROVISIONING_PROFILE` — base64 encoded .mobileprovision (generate at developer.apple.com → Profiles)
  - `APPLE_TEAM_ID` — 10-character team ID from Apple Developer portal

**Android Build** (`.github/workflows/android-build.yml`):
- Runner: `ubuntu-latest`
- Output: signed APK + AAB artifacts
- Secrets needed:
  - `ANDROID_KEYSTORE` — base64 encoded .keystore file. Generate: `keytool -genkey -v -keystore parbaughs.keystore -alias parbaughs -keyalg RSA -keysize 2048 -validity 10000`
  - `ANDROID_KEYSTORE_PASSWORD` — password used during keytool generation
  - `ANDROID_KEY_ALIAS` — alias name (e.g., "parbaughs")
  - `ANDROID_KEY_PASSWORD` — key password

### App Store Submission Checklist
- [ ] Apple Developer account ($99/yr) — developer.apple.com
- [ ] Google Play Developer account ($25 one-time) — play.google.com/console
- [ ] Generate iOS certificate + provisioning profile → store as GitHub Secrets
- [ ] Generate Android keystore → store as GitHub Secret
- [ ] Push to `release` branch → CI builds IPA + APK/AAB
- [ ] Download artifacts from GitHub Actions
- [ ] Upload IPA to App Store Connect → TestFlight → App Review
- [ ] Upload AAB to Google Play Console → Internal Testing → Production
- [ ] App Store assets: 1024x1024 icon, screenshots, description, keywords
- [ ] Legal: privacy.html, terms.html, support.html (all in public/)

## Security Notes
- Firebase API key in client code is **normal and expected** — Firebase keys are restricted by Firestore rules, not secrecy
- GolfCourseAPI key stored in Firestore `config/api_keys` (not in client code) — accessed server-side via Cloud Function
- FCM VAPID key loaded from Firestore config at runtime
- `escHtml()` used on 265+ user content insertion points
- Registration has rate limiting (3 attempts per 10 min), password validation, username length/format checks
- Social actions have cooldown timers (12-48 hours per action type)
- Firestore rules rewritten in v8.0.0-rc1 to explicit per-collection gates — no catch-all remains

## Launch Checklist
- [ ] Apple Developer account purchased ($99/yr)
- [ ] Google Play Developer account purchased ($25 one-time)
- [ ] iOS signing certificate generated and in GitHub Secrets
- [ ] Android keystore generated and in GitHub Secrets
- [ ] Domain secured (parbaughs.com or parbaughs.golf)
- [ ] Firebase Hosting configured with custom domain
- [x] Firestore catch-all rule replaced with explicit per-collection rules (done v8.0.0-rc1)
- [ ] Repo visibility changed to private
- [ ] iOS build passing in GitHub Actions
- [ ] Android build passing in GitHub Actions
- [ ] App submitted to App Store (TestFlight first)
- [ ] App submitted to Google Play (Internal Testing first)
- [ ] Landing page live at domain
- [ ] Social accounts posting content (@Parbaughs)
- [ ] Beta testers invited (target: 100 golfers)
- [ ] App icon generated at all required sizes (public/icons/)
- [ ] App Store screenshots created (5-6 per platform)
- [ ] Analytics tracking verified (Firestore usage, active users)
- [ ] Support email monitored (support@parbaughs.golf)
- [ ] Privacy policy and terms accessible from app + stores

## Ground Rules for All Agents

The authoritative agent structure is the **Three-Agent Workflow** at the top of this file (Zach / Claude.ai / Claude Code). The earlier multi-subagent "Team: Full Stack Polish" / "Team: Feature Build" blocks have been retired — they conflicted with the Three-Agent Workflow and referenced dead work (the 8-theme system).

- Read CLAUDE.md before starting any work
- Never remove features without commissioner approval
- Never guess course/par data
- Always update Caddy Notes on every build
- Always syntax check before committing
- Use Clubhouse tokens, never hardcoded colors (exceptions: Visual Reference + share cards)
- Firestore is source of truth
- The app should feel premium — country club, not startup
- Community over competition in every design decision
