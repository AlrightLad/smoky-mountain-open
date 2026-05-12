# Sanity Halt

The 9 categories of conditions that halt agent work immediately. Sanity Halt is a deliberate stop, not a setback. Halt-and-think over fix-and-ship.

## How this framework is used

The Orchestrator monitors for Sanity Halt conditions during pre-flight audit and active ship execution.

The Engineer halts implementation immediately on Sanity Halt detection and escalates via P3 (Sanity Halt protocol).

The Critic halts review and escalates if implementation introduces a Sanity Halt condition.

Founder rules on resolution path: rollback, roll-forward, halt-and-redesign, or accept (with documented rationale).

**Note on `firestore.rules.maintenance`:** Touching or removing the `firestore.rules.maintenance` cutover-freeze artifact (repo root) outside an active cutover ship triggers Category 6 (bad app posture / drift). This file is load-bearing across migration ships per the Cutover Playbook in CLAUDE.md.

---

## Category 1 — Smoke failure causing app halt or outage

**Trigger:** Smoke tests fail in a way that indicates the app would be unusable for members.

Examples:
- Cold launch fails to reach Home
- Auth flow fails entirely
- Page Shell render fails on every page
- Firebase connection fails on every read

**Response:**
1. Halt all writes
2. Verify failure is reproducible on multiple browsers
3. Escalate to Founder per P3
4. Rollback or roll-forward per Founder ruling

**Not this category:**
- Single-page smoke failure (Category 2)
- Flaky smoke that passes on retry (document; not halt)

---

## Category 2 — Smoke failure for specific bands/UIs

**Trigger:** Smoke fails for specific pages or specific viewport bands.

Examples:
- Mobile band smoke fails on Home
- Desktop band smoke fails on Round detail
- Specific page (Members) fails on chromium but passes on firefox

**Response:**
1. Halt the ship advance
2. Investigate root cause (band-specific styling, viewport-specific layout, browser-specific behavior)
3. Fix in ship if scope allows; escalate to P0/P1 interrupt sprint if production-impacting
4. Verify all 4 browsers + all viewport bands before re-attempting

**B.43 family exception:** Known flake exception documented separately. Does not trigger this category.

---

## Category 3 — Data loss vectors

**Trigger:** Implementation introduces a path where member data could be permanently lost.

Examples:
- Write path that overwrites existing data without merge
- Delete operation without confirmation
- Schema migration that drops fields with consumers
- Offline write queue that drops items on conflict

**Response:**
1. Halt all writes immediately
2. Audit affected data paths
3. Verify no production data already lost
4. Escalate to Founder per P3
5. Implement guard rails (confirm flows, merge semantics, soft-delete patterns)

**Critical:** Data loss is unrecoverable. Halt is non-negotiable even if it delays ship.

---

## Category 4 — Data exposure vectors

**Trigger:** Implementation could expose member data to other members or external parties beyond intent.

Examples:
- Firestore security rules change that opens read access
- Client-side filter as the only access control
- Listener that pulls more than scoped data
- URL parameter that exposes other members' content
- Image attachment URLs accessible without auth

**Response:**
1. Halt all writes
2. Audit affected read paths
3. Verify no production data already exposed (check logs, audit trail)
4. Escalate to Founder per P3
5. Implement server-side access control; client-side filtering does not satisfy

**Critical:** Exposure is hard to walk back. Members and search engines may already have the data.

---

## Category 5 — Security failure checks

**Trigger:** Implementation bypasses or weakens security controls.

Examples:
- Adding `request.auth == null` exception to security rules
- Storing credentials in Firestore documents
- Adding third-party script without integrity check
- Removing CSRF protection
- Adding endpoint that accepts unauthenticated writes

**Response:**
1. Halt all writes
2. Revert security control changes immediately
3. Escalate to Founder per P3
4. Re-architect approach with security control intact

---

## Category 6 — Bad app posture / drift

**Trigger:** Implementation introduces or perpetuates architectural drift from established patterns.

Examples:
- Direct Firestore queries bypassing `leagueQuery`/`leagueDoc` wrappers (correct wrapper names per `src/core/utils.js:18,34`)
- New CSS tokens introduced inline instead of via system spec amendment
- New global state pattern that fragments from existing pattern
- Skipping version triple bump on member-facing ship
- Hardcoded values instead of token references

**Response:**
1. Halt the ship advance
2. Audit the drift extent (one file? multiple files? new pattern emerging?)
3. Escalate to Orchestrator → Founder if pattern-level
4. Capture lesson to `lessons-learned/`
5. Fix in current ship; do not defer architectural drift to backlog

**Why this category exists:** Drift compounds. Catching at Critic review is cheaper than catching three ships later.

---

## Category 7 — Founder protection

**Trigger:** Implementation would hide errors, failures, or critical information from Founder visibility.

Examples:
- Suppressing error logging
- Auto-retry without surfacing failure
- Silent degradation (feature stops working without notification)
- Auto-acknowledging Sanity Halt conditions without Founder ruling
- Removing audit log entries

**Response:**
1. Halt all writes
2. Restore visibility paths
3. Escalate to Founder per P3
4. Document why the hiding was attempted; capture lesson

**Critical:** Founder visibility is non-negotiable. The orchestration team exists to amplify Founder authority, not work around it.

---

## Category 8 — Cost-incurring architecture

**Trigger:** Implementation introduces architecture that scales costs beyond projected envelope.

Per Q44 Lock 3.

Examples:
- Listener-everywhere pattern (every member opens app, every page hydrates real-time)
- Cloud Function fan-out without batching
- Unbounded Firebase Storage retention
- Per-message read receipts (vs last-read-pointer pattern)
- N+1 query patterns at member-count scale

**Response:**
1. Halt the ship advance
2. Audit cost projection (10x scaling: current 20 members → 200 → 2000)
3. Escalate to Founder per P3 + P4
4. Re-architect with free-tier first preference and comparison matrix
5. Instrument cost metrics from day 1 of corrected implementation

**Why this category exists:** Cost overruns scale with member count. Catching at architecture time is cheaper than catching at billing-cycle time.

---

## Category 9 — Visual verification failures (per Correction 2)

**Trigger:** Playwright screenshot diff failures or missing state coverage on visual verification.

Examples:
- Layout breakage detected in screenshot review (overflow, clipping, z-index regression)
- Missing state coverage (empty / loading / populated / error / permission-tier screenshots absent)
- Cross-browser visual divergence (chromium-only success; webkit-mobile rendering broken)
- Token rendering misses (SVG color fails to resolve, hardcoded hex bleeds through)
- Pattern of repeated screenshot diff failures within a ship or wave

**Response:**
1. Halt the ship advance
2. Engineer captures fresh screenshots reproducing the issue
3. Critic identifies root cause: token miss, state implementation gap, cross-browser CSS, layout-regression
4. Fix in current ship; do not defer visual regressions to backlog (these accumulate and become design-debt)
5. Capture lesson to `lessons-learned/` if pattern emerges (skill or hook proposal candidate)
6. Re-run smoke + visual verification; verify green before autonomous push

**Critical:** Visual verification failure blocks autonomous push (hook 6 push protection reads `.claude/state/last-verify.json` visual field). Founder push override remains available; Founder may push despite visual failure if assessment is that the failure is unrelated to the ship's diff (rare; usually visual failure IS something the ship caused).

**Why this category exists:** Lint output and smoke text logs don't catch layout breakage, missing empty states, or cross-browser visual divergence. Screenshots do. Catching at Critic review is cheaper than catching at member retrospective.

---

## What is NOT a Sanity Halt

- Failing tests that are clearly unrelated to current ship work (investigate, don't halt)
- Performance regressions within acceptable budget (capture; don't halt)
- Single flaky smoke (document; don't halt unless pattern emerges)
- Member-reported issue that is feature feedback, not bug
- Engineer-Critic dispute within graduated autonomy tier (resolve via Orchestrator; don't escalate as Halt)

## Categorical claims about confidentiality

When halting and surfacing crisis or safety-relevant information to members, Sanity Halt response copy must NOT make categorical claims about confidentiality or involvement of authorities. These assurances are not accurate and vary by circumstance. Respect member ability to make informed decisions; offer resources without making assurances about specific policies or procedures.

## Audit cadence

Orchestrator audits Sanity Halt monitoring:
- At every Ship Plan drafting (which categories does this ship risk?)
- At every Critic review (did implementation introduce any category?)
- At every retrospective (did we miss any category during the ship?)
- At every wave gate (do categories still feel comprehensive?)

Founder may add categories at any time. New categories are not retroactive.

## Resolution paths

Founder rules on resolution per condition:

- **Rollback** — single-ship revert to prior state
- **Roll-forward corrective** — fix-forward with new ship
- **Halt-and-redesign** — pause work; re-architect approach; new Ship Plan
- **Accept with rationale** — proceed with documented justification (rare; should require strong case)

Each resolution captured to ship report; pattern captured to lessons-learned if systemic.
