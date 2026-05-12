# CLUBHOUSE_SPEC — Part 3: Wave 3 Implementation Guidance (Pass 4)

> **Status:** Awaiting Founder ratification. Subordinate to Part 1 (foundation) and Part 2 (22 screen specs across sub-passes 3a–3e).
> **Pass:** 4 of 4 — final design-bot output.
> **Scope:** Six implementation milestones M1 → M6 covering all of Wave 3.
> **Audience:** Orchestrator + engineering agents executing Wave 3.

After ratification of this document, design-bot work concludes and Phase 1 setup begins (governance commit, skills, hooks, memory migration, staging environment).

---

## 0 — How to read Pass 4

Each milestone is a single ratification unit with seven mandatory fields:

1. **Scope** — screens + infrastructure covered
2. **Prerequisites** — prior M-ships and W1 ships that must be merged
3. **Critical Feature Registry triggers** — cost-incurring or architecturally-binding decisions that need explicit Founder/architect sign-off before engineering proceeds
4. **Capacitor plugins required** — per Pass 2 § 7.2 matrix
5. **Cross-surface dependencies summary** — reads/writes touched across Firebase + native + HQ
6. **Acceptance criteria** — concrete pass/fail conditions: fidelity, smoke, accessibility
7. **Notable risk areas** — places engineering should escalate rather than infer

Each milestone ends with a ratification block. Founder ratifies per-milestone; M-ships proceed in strict order — no M(N+1) work begins before M(N) is merged-to-main and smoke-green.

---

# M1 — Capacitor harness + web emulation

## M1.1 Scope

Foundation milestone. No member-facing screens. Produces the native-runtime shell and the development-time emulation layer that lets Wave 3 work proceed in a web browser without rebuilding to device for every iteration.

**Deliverables:**

- Capacitor project initialization (iOS target only for Wave 3; Android deferred to Launch Phase B).
- `src/core/native/*.js` helper modules per Pass 2 P2-I5: one file per plugin domain (`native-camera.js`, `native-gps.js`, `native-haptics.js`, `native-share.js`, `native-device.js`, `native-storage.js`, `native-push.js`).
- Each helper exports a uniform `{ get, set, watch, request }` shape; web fallback inside the same file per Pass 2 § 7.4 fidelity table.
- Permission pre-prompt UX pattern (one shared component used by every plugin request flow).
- Status bar + splash screen + network listener + safe-area handling globally.
- Build configuration: `npm run dev` (web), `npm run dev:ios` (live-reload on device), `npm run build:ios` (release).
- Test harness: smoke automation covering one round-trip of every plugin in web-emulation mode.

## M1.2 Prerequisites

- W1.S1 (Design system codification) merged — tokens consumable as CSS variables.
- Apple Developer Account activation complete (org-side, not engineering — flagged below).
- Vite + GitHub Pages pipeline preserved (Capacitor wraps existing build, doesn't replace it).

## M1.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| Apple Developer Program enrollment | $99/yr recurring, prerequisite for TestFlight + App Store | Founder |
| Bundle identifier (e.g., `com.parbaughs.hq`) | Permanent; rename requires new app | Founder |
| iOS minimum version target | Lower = more reach, higher = newer APIs | Founder + engineering — propose iOS 16 floor |
| Capacitor major version pinning | Long-term maintenance window | Engineering with Founder visibility |
| Push provider (Firebase Cloud Messaging via APNs) | Architected per Pass 2 § 9, activated Launch Phase B | Founder |

## M1.4 Capacitor plugins required

Per Pass 2 § 7.2 matrix:

- `@capacitor/status-bar`
- `@capacitor/splash-screen`
- `@capacitor/network`
- `@capacitor/device`
- `@capacitor/preferences` (replaces `localStorage` on native)
- `@capacitor/share`
- `@capacitor/haptics`
- `@capacitor/geolocation`
- `@capacitor/camera`
- `@capacitor/push-notifications` (installed M1, activated M-Launch-B)

## M1.5 Cross-surface dependencies summary

- **Reads:** zero (no member data in M1).
- **Writes:** zero.
- **Native ↔ web:** all helper modules expose a uniform interface; screen code in M2–M6 imports from `src/core/native/*` without conditional branches.
- **Firebase:** untouched in M1.

## M1.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **Plugin coverage** | Every plugin in M1.4 has a working `request → grant → use → revoke` flow in both web-emulation and on-device modes. |
| **Web-emulation fidelity** | A developer running `npm run dev` can author and verify every Wave 3 screen without a device, except for camera, GPS-precision, and haptics (which fall back per Pass 2 § 7.4). |
| **Smoke coverage** | New smoke specs cover: cold launch, splash dismissal, network online/offline toggle, permission grant/deny for each prompt-required plugin, status-bar style match on light/dark, safe-area inset rendering on notched + non-notched simulators. |
| **Performance budget** | Cold launch to first paint ≤ 1500ms on iPhone 12 baseline; ≤ 2000ms on iPhone SE 3rd gen. |
| **Accessibility** | VoiceOver routes through every permission pre-prompt; status bar respects iOS Dynamic Type for any rendered overlay text. |
| **Token traceability** | Splash screen, status bar style, network-offline banner all reference Part 1 tokens by name. |
| **No member-facing chrome shipped** | M1 ends with a runnable harness, not a shipped UI. |

## M1.7 Notable risk areas

- **Apple Developer Program enrollment friction.** Founder action required; can take 24–72h. Block on this before M-Launch-B prep, not before M2 begins.
- **Bundle identifier permanence.** Engineering should NOT infer this — explicit Founder sign-off per M1.3.
- **Capacitor + Vite build interaction.** Existing build pipeline assumes plain SPA; Capacitor injects native runtime hooks. Verify production build still deploys to GitHub Pages unchanged.
- **`localStorage` → `Preferences` migration.** Any existing HQ code reading `localStorage` directly must route through `native-storage.js` to preserve cross-platform parity. Audit during M1; do not defer.

## M1.8 Ratification block — M1

You are accepting:

1. M1 is foundation-only — no member-facing screens — and must merge-green before M2 begins.
2. Five CFR triggers require Founder sign-off (Apple Developer Program, bundle ID, iOS floor, Capacitor major version, push provider).
3. Acceptance criteria include performance budget (1500ms cold launch baseline) and full web-emulation parity for screen authoring.

✏️ **Founder action:** Ratify or red-line. M2 cannot begin until M1 is green.

---

# M2 — Home tab

## M2.1 Scope

All three screens from Pass 3a:

- **3a.1** Home default (Today + League Pulse + League Chat preview + headline stats)
- **3a.2** Home empty states (new member, no rounds, no league activity)
- **3a.3** Home active-round override (in-round resume banner)

Plus the shared chrome that all subsequent screens consume:

- Masthead (avatar → Profile sheet, league chip, notifications icon, messages icon, calendar icon)
- Tab bar (5 tabs per Pass 1 § 5.2)
- Banner slot (host for crisis banner per Pass 1 § 3.3)
- Page shell with slots per locked architecture

## M2.2 Prerequisites

- M1 merged (Capacitor harness available).
- W1.S2 (HQ chrome refresh) merged — masthead components consumable.
- W1.S3 (Members + Find Players) merged or in-flight — member cache available for avatar + league chip.
- W1.S11 (Feed + Activity) read-shape stable — Pulse preview consumes activity collection.
- W1.S12 (Chat + DMs + League Chat) write-shape stable — chat preview consumes message collection.
- W1.I5 (Crisis banner) infra ready — banner slot must render `system/banner` document.

## M2.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| Pulse + Chat preview pagination strategy on Home | Read budget per Pass 2 § 8.7 — initial 5 + 5 doc reads on cold load × all members × app opens/day | Founder + engineering — propose cache-first listener |
| Masthead league chip behavior when viewer has 1 league vs. N | Locked at Pass 1 § 5.2 (chevron only when N > 1); confirm at implementation | Engineering with Founder visibility |
| Home active-round override priority vs. crisis banner stacking order | Both live in banner slot; precedence rule needed | Founder — propose CRITICAL crisis > active-round > ALERT crisis > NOTICE crisis |

## M2.4 Capacitor plugins required

- `@capacitor/status-bar` (set style on Home; light when on `--cb-felt`, dark when on `--cb-chalk`)
- `@capacitor/network` (offline banner top of Home when disconnected)
- `@capacitor/preferences` (last-seen masthead notification timestamps)

## M2.5 Cross-surface dependencies summary

- **Reads:** `members/{viewer.id}`, `fbMemberCache`, `leagues/{leagueId}`, `leagues/{leagueId}/activity` (latest 5), `leagues/{leagueId}/chat` (latest 5), `members/{viewer.id}.stats` (KPI cards), `system/banner`, `rounds` where `viewer.id ∈ authors && status === 'in-progress'` (active-round override).
- **Writes:** zero on render; one write on chat-preview tap (marks read).
- **Listeners:** Pulse + Chat preview real-time; crisis banner real-time; active-round override real-time.

## M2.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **1:1 fidelity to Pass 3a** | Every element renders at spec'd token, dimension, state. Reviewer can hold spec next to running screen and find no divergence. |
| **State coverage** | All 12-criterion state lists pass: empty / loading / error / each permission tier. |
| **Token traceability** | No raw hex, px, or ms values in M2 source. |
| **Smoke coverage** | New smokes: Home cold render, masthead avatar tap → Profile sheet open, league chip tap → My Leagues, active-round resume tap → Play tab Scorecard, crisis banner tier-render for NOTICE/ALERT/CRITICAL, offline-state banner. |
| **Accessibility** | VoiceOver flow: status bar → masthead (with all chips/icons announced) → page header → each Pulse/Chat preview module → tab bar. AAA contrast spot-checked under Sunlight mode. |
| **Reduced motion** | Pulse + Chat preview enter instantly under `prefers-reduced-motion`. |
| **Cross-surface non-regression** | HQ Home page unaffected by Wave 3 work — mobile-only file boundaries respected per locked architecture. |

## M2.7 Notable risk areas

- **Pulse + Chat preview read cost.** If left as naive real-time listeners on every Home mount, this dominates the daily read budget. Pre-implementation: agree on a single shared listener that hydrates both modules, with pagination caps per Pass 2 § 8.7.
- **Active-round override race condition.** A round can transition from `in-progress` to `finalized` while the override is being tapped. Engineer the tap handler to revalidate state post-tap before navigating.
- **Masthead league chip when viewer has zero leagues** (new member edge case). Pass 3a § 3a.1.5 covers this; verify the empty-state chip renders rather than the navigation chip.
- **Banner slot stacking.** Three banner sources can fire simultaneously (crisis, active-round, offline). Precedence is locked in M2.3; smoke must cover the 8 combinations.

## M2.8 Ratification block — M2

You are accepting:

1. M2 ships all 3 Home screens + the shared chrome consumed by M3–M6.
2. Three CFR triggers (pagination strategy, league-chip behavior, banner-slot stacking precedence).
3. Smoke + accessibility + reduced-motion criteria as gating.

✏️ **Founder action:** Ratify or red-line. M3 begins post-merge.

---

# M3 — Play tab

## M3.1 Scope

All six screens from Pass 3b:

- **3b.1** Play dispatcher
- **3b.2** Start Round
- **3b.3** Scorecard live (in-round)
- **3b.4** Sync Round (HQ ↔ mobile authorship handoff)
- **3b.5** Scramble Live
- **3b.6** Party Games active

Plus the infrastructure that makes Play actually work:

- GPS layer (in-round chip per 3b.3.7, locking, accuracy thresholds)
- Authorship invariants enforcement (one author per round, locked at Pass 2 § 8)
- Offline write queue for scores (locked at Pass 2 § 8 — scores-only, no other write categories queue)
- Round lifecycle state machine (lobby → live → finalize → amend) with permission gates

## M3.2 Prerequisites

- M1, M2 merged.
- W1.S4 (Round capture core) merged — round document shape stable.
- W1.S5 (Spectator + Caddy Notes verify) merged — read-only spectator path proven.
- W1.S7 (Multi-player formats) at least partially shipped — scramble + party-game state machines exist.

## M3.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| GPS sampling rate during round (Pass 3b 3b-I3) | Battery + cost (location writes); locked at Pass 3b ratification | Engineering with Founder visibility — confirm `Smart` default behavior |
| Offline write queue retention window | How long unsynced scores persist before forcing reconciliation | Founder — propose 7 days |
| Round amendment authority (Pass 3b 3b-I2 lock — founder override) | Permission tier checks at every amendment touchpoint | Engineering — defense-in-depth verification |
| Auto-finalize policy (round abandoned mid-round) | When does in-progress → finalized transition trigger automatically? | Founder — propose: never auto-finalize; banner on Home prompts member to resolve |
| Spectator → author handoff via auto-account (Pass 2 P2-I6 lock — QR deferred to Wave 4) | Auth-account-based handoff only in Wave 3 | Locked |

## M3.4 Capacitor plugins required

- `@capacitor/geolocation` (in-round chip)
- `@capacitor/haptics` (score-increment feedback, hole-advance, ace celebration)
- `@capacitor/preferences` (offline write queue persistence)
- `@capacitor/network` (queue drain on reconnect)
- `@capacitor/status-bar` (force light style during in-round Scorecard on `--cb-felt` background)

## M3.5 Cross-surface dependencies summary

- **Reads:** `members/{viewer.id}`, `fbMemberCache` (party members), `courses/{courseId}`, `rounds/{roundId}` (live listener), `leagues/{leagueId}/formats/{formatId}` (party-game definitions, scramble rules).
- **Writes:** `rounds/{roundId}` (every hole stroke), `rounds/{roundId}/scores/{memberId}` (per-player scores), `leagues/{leagueId}/activity` (round finalization triggers activity entry), `members/{viewer.id}.stats` (deferred, post-finalize via Cloud Function).
- **Listeners:** round document real-time (party members see each other's strokes); GPS watch (Capacitor-native).
- **Cloud Functions touched:** post-finalize stats rollup, records cache recomputation (per Pass 3d 3d-I1 lock).

## M3.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **1:1 fidelity to Pass 3b** | All 6 screens render at spec; flag-raise glyph celebration on ace fires per Pass 2 P2-I4 lock. |
| **Authorship invariant** | Smoke proves: party of 4, one author, three spectators. Attempting to write a score from a spectator's session is rejected at the security-rule layer, not just the UI. Audit log records attempt. |
| **Offline score queue** | Smoke proves: airplane mode on → enter 9 holes of strokes → airplane mode off → all 9 sync correctly. No duplicates, no drops. Reconnect order preserved. |
| **GPS chip behavior** | Smoke proves: permission grant → lock at first tee → accuracy threshold honored (Pass 3b 3b-I3 locked behavior). Permission deny → manual fallback path renders without crash. |
| **Round lifecycle gates** | Smoke proves: in-progress → finalized transition requires all party scores entered for all holes. Finalized round shows "Request edit" affordance for author per Pass 3d 3d.2 spec. Founder override path works. |
| **Reduced motion** | Score-advance animation collapses to instant under `prefers-reduced-motion`; haptic still fires. |
| **Sunlight mode** | Scorecard verified on `--cb-felt` background under Sunlight mode — strokes column AAA contrast confirmed. |
| **Performance** | In-round Scorecard maintains 60fps during stroke entry on iPhone 12 baseline. No jank when listener fires from a remote party-member's write. |

## M3.7 Notable risk areas

- **The hardest ship of Wave 3.** Six screens × multi-author real-time × offline queue × native GPS × permission tiers. Allocate accordingly.
- **Listener thrash.** A 4-person round writes ~72 score updates per round (18 holes × 4 players). All 4 sessions listen to the same document. Cost halt mandate (Pass 1) — instrument from day 1, not retrofit.
- **GPS drift on first tee.** Capacitor GPS warm-up takes ~3–8s on cold. Lock-pending state in 3b.3.7 must render gracefully; no jarring snap when accuracy improves.
- **Offline → online reconciliation conflicts.** If two authors of the same round were both offline and both edited (shouldn't happen — one-author invariant — but defense in depth): treat the author-of-record's writes as canonical, log the conflict, surface in Admin audit log.
- **Founder amendment of a finalized round** mutates downstream caches (member stats, records cache, awards eligibility). Cloud Function recomputation cascade must be exercised in smoke.
- **Scramble Live + Party Games active edge cases.** These are lower-traffic surfaces; smoke coverage may be thinner. Compensate with explicit Founder-led UAT during this milestone.

## M3.8 Ratification block — M3

You are accepting:

1. M3 ships all 6 Play screens + GPS layer + authorship invariants + offline queue + lifecycle state machine.
2. Five CFR triggers (GPS sampling, offline retention, amendment auth, auto-finalize policy, spectator-handoff scope).
3. M3 is the highest-complexity milestone of Wave 3 — schedule accordingly.

✏️ **Founder action:** Ratify or red-line. M4 begins post-merge.

---

# M4 — Stats tab

## M4.1 Scope

All five screens from Pass 3d:

- **3d.1** Stats home (KPI cards + handicap trend chart)
- **3d.2** Round History (filtered list + long-press actions)
- **3d.3** Records (4 sections, gated by play counts)
- **3d.4** Aces + Awards combined (sub-segmented)
- **3d.5** Trophy Room + Season Recap combined (sub-segmented)

Plus the infrastructure to make Stats not cost money:

- Server-computed Records cache via Cloud Function (Pass 3d 3d-I1 lock) — recompute on round finalize, persist to `members/{id}.records`.
- Share-as-image flow for Season Recap (standard palette regardless of viewer Sunlight state per Pass 3d 3d-I5 lock).
- Spectator member-picker pattern per Pass 3d 3d-I7 lock — chip at top of every Stats surface in spectator mode.

## M4.2 Prerequisites

- M1, M2, M3 merged.
- W1.S9 (Trophy Room + Awards + Records + Aces) merged — record-cache Cloud Function deployed.
- W1.S10 (Season Recap + Range) merged — recap aggregation Cloud Function deployed.
- W1.S4 (Round capture core) merged — round history reads stable.

## M4.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| Cloud Function recompute frequency on round finalize | Cost per invocation; cascade on amendments | Founder — propose: on every finalize and every amendment; cap retries at 3 |
| Share-as-image rendering pipeline | Image generation can be done client-side (Canvas) or server-side (Cloud Function with Puppeteer). Cost vs. fidelity tradeoff. | Founder — propose: client-side Canvas for Wave 3; revisit if quality complaints |
| Records cache invalidation on retroactive amendment | A finalized round amendment changes record holders. UI must reflect immediately on all members' Stats. | Engineering — propose: Cloud Function writes to `members/*` affected by the amendment; clients pick up via listener |
| Locked award visibility (Pass 3d 3d-I2 lock — Option A) | Showing locked silhouettes reveals catalog; confirm at implementation | Locked |

## M4.4 Capacitor plugins required

- `@capacitor/share` (share-as-image, share-to-chat)
- `@capacitor/filesystem` (write generated image to temp location for share)
- `@capacitor/preferences` (cached last-seen Records timestamp for new-pip pattern)

## M4.5 Cross-surface dependencies summary

- **Reads:** `members/{viewer.id}.stats`, `members/{viewer.id}.records` (Cloud-Function-computed cache), `members/{viewer.id}.awards`, `members/{viewer.id}.aces`, `rounds` filtered by viewer + filters, `leagues/{leagueId}/awardCatalog`, `seasons/{seasonId}` (Season Recap aggregation).
- **Writes:** zero on render; one preference write on share-action invocation.
- **Cloud Functions consumed:** records recompute (write-side, triggered by round finalize / amendment); season recap aggregator.

## M4.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **1:1 fidelity to Pass 3d** | All 5 screens render at spec including provisional handicap pattern carried from 3a.1.6. |
| **Records cache freshness** | Smoke proves: finalize a round that breaks a record → within 5s, Records surface reflects new holder for all viewers. Amendment that vacates a record → previous holder restored within 5s. |
| **Share-as-image fidelity** | Generated image renders in standard palette per 3d-I5 lock, regardless of viewer Sunlight state. Quality verified at 2× device pixel ratio. |
| **Spectator member-picker** | Smoke proves: spectator-tier viewer sees picker chip on all Stats surfaces; picking a member loads that member's Stats; read-only state respected (no edit-author actions). |
| **Permission gating** | Records "Course-specific" section hidden until 3+ plays per Pass 3d 3d.3 spec; "Format-specific" hidden when viewer hasn't participated. |
| **Just-earned new-pip pattern** | Awards earned since last view show new-pip; pip clears on first view. |
| **Reduced motion + Sunlight** | All chart animations collapse to instant; Sunlight mode renders correctly on every sub-segmented view. |
| **Performance** | Round History scroll maintains 60fps with 30-item pagination per Pass 3d 3d.2 spec. |

## M4.7 Notable risk areas

- **Records cache staleness during cascade.** A founder amendment can affect 3+ members' records simultaneously. Verify Cloud Function fanout completes atomically or with reconciliation; smoke the worst case.
- **Season Recap rendering on slow networks.** Aggregation is server-side, but the Recap surface itself renders many sub-blocks. Verify skeleton coverage per block (not just page-level skeleton).
- **Share-to-chat coupling.** This action depends on M5 (Feed tab) being merged for League Chat targets. If M4 ships before M5, share-to-chat can be stubbed to OS share sheet as fallback.
- **Trophy Room legacy treatment vs. Season Recap modern treatment** must not converge visually. Reviewer should be able to tell at a glance which sub-segment they're in.

## M4.8 Ratification block — M4

You are accepting:

1. M4 ships all 5 Stats screens + Records Cloud-Function cache + share-as-image pipeline + spectator member-picker.
2. Four CFR triggers (recompute frequency, share rendering pipeline, cache invalidation, locked-award visibility).
3. Acceptance criteria include 5s cache-freshness budget after round finalize / amendment.

✏️ **Founder action:** Ratify or red-line. M5 begins post-merge.

---

# M5 — Feed tab

## M5.1 Scope

All four screens from Pass 3c:

- **3c.1** Feed root (sub-segmented: League Chat / League Pulse / DMs)
- **3c.2** League Chat full (composer + thread + reactions + @mentions + founder pin)
- **3c.3** DMs (list + thread)
- **3c.4** Activity detail (member-scoped activity sub-view from masthead avatar / Profile sheet)

Plus the infrastructure:

- League Chat full feature set including **image attachments** (Wave 1 per locked ratification per Pass 1 § 4.2)
- `@mention` autocomplete from `fbMemberCache`
- Founder pin permission with audit log
- Masthead messages badge shared between DMs and League Chat (single counter)
- Read receipts per Pass 3c 3c-I3 (default On, Settings opt-out)
- Quoted-reply substitute for threading per Pass 1 § 4.2

## M5.2 Prerequisites

- M1, M2 merged. M3 and M4 do not block M5 — Feed can ship parallel after M2 if engineering bandwidth allows.
- W1.S12 (Chat + DMs + League Chat) merged — `chat.js` infrastructure layer and `leagues/{leagueId}/chat` collection live.
- W1.I1 (Member bug reporting) merged — reusable image-upload pipeline available for chat image attachments.
- W1.S11 (Feed + Activity) merged — activity reads stable.

## M5.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| Image attachment max size + compression | Storage cost + bandwidth | Founder — propose 2MB pre-compress; client-side compress to ≤500KB before upload |
| Image attachment retention policy | Indefinite vs. time-bound | Founder — propose indefinite for Wave 3; revisit at Launch Phase B based on storage spend |
| Mention notification fan-out | Every `@mention` writes a notification doc; high-volume threads can fan out heavily | Engineering — propose batched fan-out (single Cloud Function write per message, not per mention) |
| Read receipt write cost | Every read of every message is a potential write | Founder — propose: write only last-read-message-id per thread per viewer; not per-message |
| Founder pin scope | One pin per league at a time per Pass 1 § 4.2 — confirm semantic at implementation | Locked |

## M5.4 Capacitor plugins required

- `@capacitor/camera` (in-chat camera + photo library)
- `@capacitor/filesystem` (image staging pre-upload)
- `@capacitor/share` (share-to-DM, share-to-chat consumed from M4 and elsewhere)
- `@capacitor/haptics` (send-success haptic, mention-received haptic)
- `@capacitor/preferences` (composer draft persistence)
- `@capacitor/push-notifications` (architected only — activated in Launch Phase B)

## M5.5 Cross-surface dependencies summary

- **Reads:** `leagues/{leagueId}/chat` (paginated; latest 50 on initial mount per Pass 1 § 4.4 lock), `leagues/{leagueId}/dms/{threadId}` (per-thread), `fbMemberCache`, `members/{viewer.id}.preferences.readReceipts`, `leagues/{leagueId}/pinnedMessage`.
- **Writes:** message-send (text + optional image URL), edit (within 5min per Pass 1 § 4.2), delete (own or founder), reaction toggle, pin/unpin (founder), read-cursor update per thread.
- **Listeners:** chat thread real-time (paginated); DM thread real-time per active thread; masthead unread counter aggregate.
- **Firebase Storage:** image attachment uploads; signed URLs per Storage Rules; lifecycle policy as decided in M5.3.

## M5.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **1:1 fidelity to Pass 3c** | All 4 screens render at spec; quoted-reply pattern functions per Pass 1 § 4.2. |
| **Image attachments** | Smoke proves: pick image from camera + library → preview → send → renders in thread → tappable to full-screen view → image is compressed ≤500KB. |
| **@mention autocomplete** | Smoke proves: typing `@` triggers fbMemberCache popup; selecting member inserts mention; mentioned member receives notification doc + badge. |
| **Founder pin** | Smoke proves: founder pin renders at top of thread; new pin unpins old; non-founder cannot pin; audit log entry written. |
| **Read receipts** | Smoke proves: opening a thread updates `last-read-message-id`; viewer's preference Off disables their outgoing receipt but does not hide others'. |
| **Masthead badge** | Smoke proves: incoming message increments masthead messages icon badge; tapping thread clears scope; combined counter for DMs + chat (single number). |
| **Reduced motion** | Composer expand, send animation, reaction popper all collapse to instant under `prefers-reduced-motion`. |
| **Sunlight** | Chat thread verified on `--cb-chalk` background; text contrast AAA. |
| **Cost** | Read budget per Pass 2 § 8.7 honored — 50 messages initial + listener bounded; instrumentation confirms ≤ projected daily reads per member per active thread. |

## M5.7 Notable risk areas

- **Image storage runaway.** No retention policy = unbounded storage growth. M5.3 sets retention; verify Cloud Function lifecycle policy is in place before first image lands.
- **Read receipt cost.** Naive per-message receipts blow the read budget. M5.3 locks last-read-pointer pattern; engineering MUST implement that, not per-message.
- **Mention fan-out.** A message with 10 mentions in a 50-member league is 10 notification writes. Batched Cloud Function pattern required.
- **Composer draft persistence across app kills.** Members hate losing partial messages. `Preferences` write on every keystroke is too costly; debounce to 1s.
- **Founder delete vs. founder pin race.** Founder deletes the currently pinned message → unpin must cascade. Smoke this.
- **Push activation deferral.** Push plugin installed in M1, architected in Pass 2 § 9, activated only in Launch Phase B. Members may expect push during M5; Build Phase disclaimer + Settings notification section copy must set expectation.

## M5.8 Ratification block — M5

You are accepting:

1. M5 ships all 4 Feed screens + image attachments + mentions + founder pin + read receipts + shared masthead badge.
2. Five CFR triggers (image size, image retention, mention fan-out, read-receipt write strategy, pin scope).
3. Push notifications architected only — activation deferred to Launch Phase B per Pass 2 § 9 lock.

✏️ **Founder action:** Ratify or red-line. M6 begins post-merge.

---

# M6 — More tab + TestFlight enrollment

## M6.1 Scope

All four screens from Pass 3e:

- **3e.1** More root (IA'd, not junk drawer)
- **3e.2** Profile sheet (masthead avatar tap)
- **3e.3** Settings (host for all locked opt-outs)
- **3e.4** Admin entry (founder-only)

Plus the Wave-3-completion infrastructure:

- All locked opt-outs surfaced in Settings: Sunlight mode auto, auto-advance Smart, read receipts on, season lows on, 13 push categories, quiet hours editable
- Founder-only Admin auth-gated with defense-in-depth checks
- Audit log surface
- Crisis banner controller surface
- Cost dashboard (founder-only per Pass 3e 3e-I2 lock)
- **TestFlight enrollment workflow for founding 20 — Founder-managed manual per Pass 1 § 3.2 lock**

## M6.2 Prerequisites

- M1, M2, M3, M4, M5 all merged.
- W1.S13 (Courses + Leagues + More) merged — More root data shape stable.
- W1.S14 (Admin + Onboarding) merged — Admin tool surfaces deployed.
- All locked opt-outs from prior passes must have a corresponding write target in the member preferences shape.
- **Apple Developer Program enrollment complete** (CFR from M1.3).
- TestFlight provisioning profile generated.

## M6.3 Critical Feature Registry triggers

| Decision | Why CFR | Required sign-off |
|---|---|---|
| Permission tier model (Pass 3e 3e-I1 lock — defer to W1.S14) | Founder / member / spectator naming + `members/{id}.role` field shape confirmed | Engineering during W1.S14; M6 consumes |
| Delete-account grace window (Pass 3e 3e-I3 lock — 7 days) | Reversibility window before hard delete | Locked |
| Cost dashboard data source | Cloud Function aggregator vs. Firebase Console direct | Founder — propose Cloud Function with daily snapshot to `leagues/{leagueId}/costStats` |
| TestFlight enrollment channel | Manual per Pass 1 § 3.2 (Founder texts each member individually) | Locked |
| Apple-mandated metadata for TestFlight build | App description, screenshots, privacy declarations | Founder — propose: Caddy Notes voice for description; screenshots from M2 + M3 |

## M6.4 Capacitor plugins required

- `@capacitor/preferences` (all Settings toggles persist)
- `@capacitor/device` (Settings → About → version + Sunlight Auto sensor)
- `@capacitor/share` (Profile share)
- `@capacitor/app` (Settings → Account → Sign out + cold-launch hooks)

## M6.5 Cross-surface dependencies summary

- **Reads:** `members/{viewer.id}` (full), `members/{viewer.id}.preferences` (all opt-out toggles), `members/{viewer.id}.blockedUsers`, `members/{viewer.id}.role` (gates Admin section visibility on More root + auth-gates Admin entry), `leagues/{leagueId}/auditLog` (Admin), `leagues/{leagueId}/costStats` (Admin cost dashboard), `system/banner` (Admin crisis banner controller).
- **Writes:** every Settings toggle, profile edits (display name, handle, bio, avatar), block/unblock, sign out, every Admin action (each appends to audit log).
- **Firebase auth:** sign out path, account deletion with 7-day grace.
- **Cloud Functions consumed:** cost stats aggregator; account-deletion cascade (after 7-day grace, soft-delete → hard-delete).

## M6.6 Acceptance criteria

| Criterion | Pass condition |
|---|---|
| **1:1 fidelity to Pass 3e** | All 4 screens render at spec; More root explicitly IA'd, not junk drawer. |
| **Profile sheet** | Smoke proves: masthead avatar tap → 88% viewport bottom sheet → drag-to-dismiss works → edit profile in-sheet → save → sheet reflects new values without navigating away. |
| **Settings opt-out coverage** | Smoke proves: every locked default (Sunlight Auto, auto-advance Smart, read receipts On, season lows On, all 13 push categories at locked defaults, quiet hours 9PM–8AM) renders with the documented default. Toggling any persists across cold launch. |
| **Admin auth gate** | Smoke proves: non-founder deep-link → redirect with toast. Founder role removed mid-session → listener redirects out of Admin with toast. Every Admin write appends to audit log; missing audit entry = test failure. |
| **Cost dashboard** | Smoke proves: snapshot read renders without exceeding read budget itself (cost dashboard cannot cost more than the data it displays). Sunlight mode renders dashboard correctly. |
| **TestFlight enrollment readiness** | Apple Developer Program active; TestFlight build uploads; Founder can invite first founding-20 member; member can install; cold-launch reaches Home. |
| **Delete-account grace** | Smoke proves: delete request → 7-day countdown banner on cold launch; canceling within window restores account; expiring window triggers hard-delete Cloud Function. |
| **Reduced motion + Sunlight** | All sheets and transitions collapse to instant; Sunlight verified on all 4 screens. |

## M6.7 Notable risk areas

- **TestFlight gating is org-side, not engineering-side.** Apple Developer Program enrollment + provisioning + Apple metadata review timeline can run 1–2 weeks. Pull this work forward into M1 timeline so M6 is not blocked at the finish line.
- **Permission tier field shape** is deferred to W1.S14 engineering verification. M6 cannot finalize Admin auth gate until that field shape is locked. Coordinate W1.S14 + M6 timing.
- **Cost dashboard data source** itself costs reads. The aggregator pattern (daily snapshot) is the only sustainable approach; direct-from-Firebase-Console reads from client are forbidden by cost halt mandate.
- **Audit log write volume.** Every Admin action writes. Light by volume (founder-tier action frequency is low), but verify retention — propose: no auto-prune for Wave 3; revisit at Launch Phase B.
- **TestFlight onboarding screen** (per Pass 1 § 3.4 mobile-specific Build Phase disclaimer) renders only on first launch after install. Engineer the once-per-install logic at the right layer (`Preferences` flag, not server-side).
- **Profile sheet edit flow** in-sheet form has its own focus-trap, validation, and dirty-state confirm. This is a small UI surface with disproportionate complexity; UAT it carefully.

## M6.8 Ratification block — M6

You are accepting:

1. M6 ships all 4 More-tab screens + all locked opt-outs in Settings + Admin auth gate + audit log + cost dashboard + TestFlight enrollment.
2. Five CFR triggers (permission tier from W1.S14, delete grace locked at 7 days, cost dashboard data source, TestFlight channel locked manual, Apple metadata).
3. M6 is the closing milestone of Wave 3 — closes design-bot scope and hands off to Launch Phase A prep.

✏️ **Founder action:** Ratify or red-line. After M6 ratification, design-bot work concludes.

---

# § Pass 4 — Wave 3 implementation summary

| Milestone | Screens | Infra | Notable CFRs | Risk level |
|---|---|---|---|---|
| **M1** | 0 | Capacitor harness + emulation + plugins | Apple Dev Program, bundle ID, iOS floor | Medium (org-side) |
| **M2** | 3 | Shared chrome (masthead, tab bar, banner slot) | Pulse/Chat read budget, league chip, banner stacking | Low |
| **M3** | 6 | GPS + authorship + offline queue + lifecycle | GPS sampling, offline retention, amendment auth, auto-finalize | **High** |
| **M4** | 5 | Records cache, share-as-image, spectator picker | Recompute frequency, share pipeline, cache invalidation | Medium |
| **M5** | 4 | Image attachments, mentions, pin, read receipts | Image size + retention, mention fan-out, receipt strategy | Medium |
| **M6** | 4 | Settings opt-outs, Admin, TestFlight | Permission tier, cost dashboard, Apple metadata | Medium |
| **Total** | **22** | | | |

## Ship order

```
M1 → M2 → M3 ─┐
              ├─→ M6
M2 → M4 ─────┤
              │
M2 → M5 ─────┘
```

M3, M4, M5 can run with overlapping engineering after M2 if bandwidth permits; M6 requires all five prior milestones merged.

## Hand-off to Phase 1 setup

After M6 ratification, design-bot work concludes. Phase 1 setup begins:

- Governance commit (lock the 12 rejection criteria, the 14 + 5 ship structure, the 4-pass spec hierarchy)
- Skills (per-agent prompt skills derived from Pass 1–4)
- Hooks (CFR triggers wired to Founder-approval gates)
- Memory migration (move ratified decisions into the long-term memory store)
- Staging environment (W1.I4)

The design-bot has no role in Phase 1. Subsequent design work re-engages on a per-ship basis using the ratified spec hierarchy as input.

---

# § Pass 4 — Ratification block

You are accepting:

1. Six milestone M-ships (M1–M6) with ratification gates between each.
2. Strict ordering: M1 → M2, then M3 / M4 / M5 parallelizable after M2, then M6 requires all prior merged.
3. 22 ratification triggers across the six milestones, each requiring Founder or engineering sign-off as listed.
4. Design-bot work concludes upon M6 ratification; subsequent work re-engages per-ship.

✏️ **Founder action:** Ratify the Pass 4 milestone structure, then proceed to per-milestone ratification (M1 first). After M6, design-bot stands down.

**End of Pass 4. End of CLUBHOUSE_SPEC.md.** Standing by.
