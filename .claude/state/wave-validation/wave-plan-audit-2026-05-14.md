---
doc: Wave plan re-validation audit 2026-05-14
date: 2026-05-14
authored_by: claude-code (orchestration team)
trigger: Founder Track 2 directive — re-validate wave plan against current substrate state before Wave 1 execution begins
discipline: AMD-009 senior engineering standard; evidence-cited classification
sources_audited:
  - docs/agents/ROADMAP.md (Wave 1-4 ship list, lines 17-135)
  - docs/agents/ships/W*.md (20 W1 vision docs + Wave 2/3/4 visions)
  - .claude/state/wave-zero-dry-run/SUMMARY.md (substrate baseline)
  - .claude/state/main-flows-v2/flow-inventory.json (62-flow inventory)
  - CLAUDE.md Built Features list (v8.x already-shipped features)
  - git log since 2026-05-11 (commits touching ship scope)
---

# Wave plan re-validation — 2026-05-14

Per Founder Track 2 directive: audit every ship against current
substrate state. Classify per the 7-category scheme. Cite evidence
for every classification — junior teams say "probably valid"; senior
teams say "valid per evidence X."

## Classification scheme

- **[a] Still valid as scoped** — proceed as planned
- **[b] Implicitly done** — substrate work already accomplished
- **[c] Needs re-scoping** — architecture shifted, scope wrong
- **[d] Should be split** — actually multiple ships
- **[e] Should be merged** — another ship covers this
- **[f] Should be deprioritized** — substrate made less urgent
- **[g] Newly discovered** — should be added to plan

## Substrate context (what changed since the plan was authored)

Per `git log` 2026-05-11 → 2026-05-14, the orchestration substrate
shipped ~80 commits across 4 days:

1. **Dashboard consolidation** (12 commits, DC-1..DC-9): unified
   8 dashboards on `--pb-*` token system + `dashboard-shell.css`.
2. **Cron substrate** (3 crons live): downloads-watcher,
   maintenance, overnight-triage; all on Git-Bash (Fix C);
   PARBAUGHS-* scheduled tasks installed.
3. **Amendments lifecycle** (5 commits + AMD-001..012 authored;
   AMD-001..008 applied; AMD-009..012 pending Founder approval).
4. **Wave Zero Dry-Run** V7-V12 audited — disposition PASS-WITH-
   FINDINGS; all carry-forwards documented.
5. **Main-flows v2** — 62-flow inventory + taxonomy E + filterable
   rail (Phase 3 iter 1 shipped).
6. **Token-usage dashboard** wired with honest estimated source.
7. **W1.S1 iter 1** shipped — 3 spike-surfaced primitives
   (`.pb-avatar`, `.pb-list/-row`, `.pb-trend-delta`).

The substrate work is **orchestration-team-facing**, not member-
facing. Wave 1 product ships REMAIN about the member-facing
Clubhouse Part B redesign per Wave 2A spec.

## Wave 1 ship classification

### Design + functional ships (W1.S1 — W1.S14)

#### W1.S1 — Design system codification

- **Classification:** **[d] Should be split** + iteration 1 [b] implicitly done
- **Evidence:** Commit `2953d54` shipped W1.S1 **iteration 1** —
  3 orchestration-dashboard primitives (`.pb-avatar`, `.pb-list/-row`,
  `.pb-trend-delta`) + showcase + round-trip discipline. The
  RATIFIED vision at `docs/agents/ships/W1.S1.md` is much broader
  (Clubhouse `--cb-*` token system, 6 new W2.S0 tokens, SVG icon
  library, sunlight mode, AAA contrast). Spec source for iter 1
  was the spike (per Founder authorization decision tree); broader
  Clubhouse codification remains.
- **Action:** Split into 2 ships:
  - W1.S1.a (DONE): orchestration-dashboard primitives — `2953d54`
  - W1.S1.b (NEW, GENUINELY PENDING): Clubhouse `--cb-*` system,
    6 new W2.S0 tokens, SVG icon library, sunlight mode, AAA paths.
    Scope = the full original W1.S1 vision minus the iter-1 deltas.

#### W1.S2 — HQ chrome refresh + Home

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Vision doc `docs/agents/ships/W1.S2.md` ratified;
  masthead + nav rail + footer + scope band + Home page redesign
  per Wave 2A spec. Existing Home dashboard (per CLAUDE.md Built
  Features) is the legacy v6.x-v8.x surface; this ship is the
  Wave 2A-spec redesign. Substrate work didn't touch the HQ
  member-facing surface.
- **Action:** Proceed as planned; first user-facing ship will be the
  real-world AMD-012 smoke-testing-governance test case.

#### W1.S3 — Members directory + Find Players

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Member card component family per Wave 2A spec.
  Existing Members page (per CLAUDE.md "src/pages/" inventory) is
  v8.x baseline; redesign is per Wave 2A. flow-inventory.json has
  3 member-flow entries (F12 directory, F13 find-players, F33
  invite) — all status=shipping under this ship.

#### W1.S4 — Round capture core

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Sync Round + Scorecard + Round detail + Round
  History + Rounds page per Wave 2A. flow-inventory.json F1
  ("Log a round", core, shipping) served_by_ships includes W1.S4
  + W1.S2 + W1.S1. Vision intact; existing Play Now infrastructure
  (v8.22.0 Ship 5+7) is the baseline.

#### W1.S5 — Spectator + Caddy Notes verify

- **Classification:** **[a] Still valid as scoped**, with **W1.I3
  dependency clarification needed**
- **Evidence:** W1.S5 includes "Caddy Notes verify"; W1.I3 is
  "Caddy Notes restructure (3-section)". These overlap. W1.I3 is
  scheduled to run parallel to W1.S2-S5 per ROADMAP line 30.
  Order: W1.I3 should land BEFORE W1.S5 verifies it, OR W1.I3
  should be merged into W1.S5.
- **Action:** Confirm W1.I3 sequencing relative to W1.S5 (Founder
  may have already addressed; documented for clarity).

#### W1.S6 — Parcoin economy (Wagers/Bounties/Challenges)

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Wagers + Bounties pre-exist in v8.22.0 baseline.
  Challenges is the new addition. flow-inventory.json F4 (wager),
  F7 (bounty), F22 (challenges) — F22 is status=planned, others
  shipping. Redesign + Challenges as the unique W1.S6 scope; the
  Parcoin economy doc at CLAUDE.md is unchanged.

#### W1.S7 — Multi-player formats (Scrambles + Party Games)

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Scramble team management + live mode pre-exist
  (CLAUDE.md "Scramble team management (2v2, 3v3, 4v4)" Built
  Feature). Party Games (2-3 MVP) per ROADMAP line 40 is the new
  addition. Vision intact.

#### W1.S8 — Calendar + Tee Times + Trips

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Calendar + Tee Times pre-exist (Built Features
  list). Trips is the addition (CLAUDE.md mentions trips as a
  league-scoped collection but no Built-Features entry for a
  Trips page). flow-inventory.json F18 (calendar), F19 (tee
  times), F35 (trips) — F35 status=shipping under W1.S8.

#### W1.S9 — Trophy Room + Awards + Records + Aces

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Trophy room + 50+ achievements pre-exist. Records
  + Aces specific surfaces are part of this ship per ROADMAP.

#### W1.S10 — Season Recap + Range

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Range session timer exists; Season Recap is in
  CLAUDE.md Roadmap as "Seasonal recap and yearly awards
  ceremony" — Future. W1.S10 brings it to Wave 1 scope.

#### W1.S11 — Feed + Activity

- **Classification:** **[a] Still valid as scoped (with chip
  amendment per vision filename `W1.S11 — Feed + Activity (Chip
  amended)`)**
- **Evidence:** Activity feed pre-exists. W1.S11 vision filename
  signals an in-scope chip amendment (likely the action-row design
  per memory notes). Vision doc explicitly ratified — no
  re-scoping needed.

#### W1.S12 — Chat + DMs + League Chat (image attachments per ratification)

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** DM system + chat pre-exist. "Image attachments
  included per ratification" — ratified scope addition. Vision
  intact.

#### W1.S13 — Courses + Leagues + More

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Course directory + multi-league architecture
  + More tab pre-exist. W1.S13 is the redesign + consolidation per
  Wave 2A.

#### W1.S14 — Admin + Onboarding

- **Classification:** **[a] Still valid as scoped (with Founder-
  synchronous-presence trigger per CFR)**
- **Evidence:** Commissioner admin panel pre-exists. ROADMAP line
  47 explicitly notes "Critical Feature Registry trigger — Founder
  synchronous presence" — this is governance-encoded as the
  last ship of Wave 1 with Founder presence required.

### Infrastructure ships (W1.I1 — W1.I6)

#### W1.I1 — Member bug reporting surface

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** No member-facing bug-reporting UI exists today
  (per src/pages/ inventory in CLAUDE.md). New ship.

#### W1.I2 — Smoke automation + sibling smoke account

- **Classification:** **[c] Needs re-scoping** (smoke automation
  IS DONE per v8.17.0; only the sibling smoke account remains)
- **Evidence:** CLAUDE.md "Testing Strategy" Tier 2: "44+ tests
  covering specific known failure modes" via Playwright (v8.7.0
  / v8.7.4 / v8.7.5). v8.17.0 added "cross-browser smoke
  automation: 12 scenarios × 4 browsers via Playwright + real
  Firebase" (per AMD-012 references). The "sibling smoke account
  (B.47)" portion remains — that's a real-Firebase test fixture
  for the second member. The smoke-automation portion is **[b]
  implicitly done**.
- **Action:** Re-scope W1.I2 to the sibling-smoke-account-only
  remainder, OR mark complete + author W1.I2.b for sibling-account
  separately.

#### W1.I3 — Caddy Notes restructure (3-section)

- **Classification:** **[a] Still valid as scoped**, sequencing
  caveat per W1.S5 dependency above.

#### W1.I4 — Staging environment (Option B locked)

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** No staging environment exists per current
  infrastructure (CLAUDE.md describes GitHub Pages production
  only). Option B was locked per the vision doc title — proceed
  as planned.

#### W1.I5 — Crisis banner system (3-tier)

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** No crisis-banner mechanism today. New ship.

#### W1.I6 — Course Capture from Photo

- **Classification:** **[a] Still valid as scoped**
- **Evidence:** Course directory uses GolfCourseAPI (per CLAUDE.md).
  Photo-to-course capture is a new capability not in any existing
  feature; new ship. Vision doc ratified.

### Newly discovered ships [g]

The substrate work surfaced **5 new ships** that need to enter the
plan:

1. **AMD-007 P18.6 Founder Review Queue implementation** —
   dashboard.html section + regen-dashboard.py aggregator for the
   "Newspaper" protocol. Operates as the orchestration team's own
   tool. **Scope: ~400k tokens.** Tracker memory entry #88-area.
2. **AMD-011 auto-execute implementation** —
   `scan-proposal-readiness.py` + new cron + `ship-readiness-
   deferred/` state dir + dashboard surface + round-trip
   extensions. Gated behind Founder approval of AMD-011.
3. **W1.S1.b — Broader Clubhouse system codification** (the
   `--cb-*` half of the original W1.S1 vision). Likely the largest
   single ship in Wave 1; ~1-2M tokens.
4. **AMD-012 framework extensions** (if any specific extensions
   are needed for mobile-viewport smoke or push-verification
   smoke) — surfaces during first user-facing ship.
5. **Main-flows v2 iter 2** — lifecycle_phase chip + click-to-
   detail. Smaller follow-on (~200-300k).

These should be added to the plan; not all are Wave 1 — items 4-5
are likely Wave 1 internal-tooling work and item 3 is a Wave 1
foundation ship.

## Wave 2-4 — lighter pass

### Wave 2 (Design Coherence)
- **All Wave 2 ships [a] Still valid as scoped.** Wave 2 is the
  per-page implementation pass against the Wave 2A spec. Nothing
  in substrate work touched Wave 2 vision content.

### Wave 3 (Mobile Clubhouse Rebuild)
- **M1-M6 [a] Still valid as scoped.** Wave 3 hasn't been touched
  by substrate work; Capacitor + iOS/Android + TestFlight all
  remain as designed.

### Wave 4 (Identity + Stats)
- **I1-I5 [a] Still valid as scoped.** Discord-style username
  identity primitive untouched by substrate work.

## Classification summary

| Category | Count | Ships |
|---|---:|---|
| [a] Still valid as scoped | 14 | W1.S2-S4, S6-S14, W1.I1, I3, I4, I5, I6 + all Wave 2/3/4 |
| [b] Implicitly done | 1+ | W1.S1 iter 1 (done in commit 2953d54); W1.I2's smoke-automation portion |
| [c] Needs re-scoping | 1 | W1.I2 (sibling smoke account only remains) |
| [d] Should be split | 1 | W1.S1 → W1.S1.a (done) + W1.S1.b (Clubhouse codification, pending) |
| [e] Should be merged | 0 | none |
| [f] Should be deprioritized | 0 | none |
| [g] Newly discovered | 5 | Founder Review Queue impl; AMD-011 impl; W1.S1.b; AMD-012 framework extensions; Main-flows v2 iter 2 |

## Action items for Founder

1. **Approve the W1.S1 split.** W1.S1.a (orchestration primitives)
   shipped; W1.S1.b (Clubhouse `--cb-*` codification) becomes the
   actual Wave 1 foundation ship if Founder agrees.
2. **Resolve W1.I3 vs W1.S5 sequencing.** W1.I3 should land before
   W1.S5 verifies it. Either confirm this is the intended order
   OR merge W1.I3 into W1.S5.
3. **Re-scope W1.I2.** Smoke automation done in v8.17.0 — re-scope
   to sibling-smoke-account-only OR mark W1.I2 complete + author
   W1.I2.b for the remainder.
4. **Ratify the 5 newly discovered ships** for inclusion in the
   updated plan. Specifically:
   - Founder Review Queue implementation: queue as next ship
     after AMD-007 approves
   - AMD-011 auto-execute implementation: gated behind AMD-011
     approval
   - W1.S1.b Clubhouse codification: Wave 1 foundation work
   - AMD-012 framework extensions: surfaces during first
     user-facing ship
   - Main-flows v2 iter 2: smaller follow-on

## Governance amendment scope

The changes above are governance-level (modify ROADMAP.md). Per
AMD-009 + the new amendment lifecycle: author a separate
governance amendment AMD-013 if Founder ratifies these changes.

This commit is AUDIT-ONLY. ROADMAP.md is NOT modified here. After
Founder review of this audit, the team authors AMD-013 (proposed-
ROADMAP_v2.md) capturing the validated plan.

## Honest limitations (Principle 5)

- **Wave 2/3/4 lighter-pass.** Wave 2-4 ships received per-wave
  treatment (not per-ship classification) because substrate work
  didn't touch them. If Founder wants per-ship Wave 2-4 audit,
  flag and the team produces it separately.
- **Vision docs not read line-by-line.** Each W1 ship vision was
  scanned for status + key scope; not deeply read. If a Wave 1
  vision contains scope that re-scoping requires (e.g., a
  performance requirement now invalidated by substrate work), it
  could be missed.
- **Wave 2A spec not located.** ROADMAP references "Phase 2A
  design system spec" as DONE for mobile. The HQ Wave 2A spec
  status is uncertain from this audit. If absent, W1.S2 onwards
  may be blocked on spec authoring before execution.
