---
doc: main-flows v2 Phase 2 — taxonomy proposals
date: 2026-05-14
authored_by: claude-code
trigger: Founder SHIP — main-flows v2 Phase 2
inventory_basis: 62 flows at .claude/state/main-flows-v2/flow-inventory.json
status: AWAITING FOUNDER GATE (escalation criterion #5 — cross-cutting architecture decision)
---

# Phase 2 — Taxonomy + Visual Approach Proposals

Phase 1 discovered **62 flows** across 17 sources. That count sits in
the "30-60 flows → filterable + searchable rail with category chips"
band per the Founder spec's scale guidance. This doc proposes 3
taxonomies + a recommended visual approach, with team's lean and
explicit Founder-gate ask.

## Distribution of the 62 flows

To inform taxonomy choice, here is the inventory broken out four ways:

### By actor (5 buckets)

| Actor | Count | Examples |
|---|---:|---|
| member | 38 | F1 Log a round, F2 League Pulse, F14 Activity feed, F44-48 mobile tabs |
| commissioner | 6 | F32 Send invite, F37-40 admin actions |
| founder | 4 | F41 Platform admin, F43 Crisis banner, F50 Identity migration, F62 Token observability |
| system | 11 | F55-56 crons, F61 Heartbeat, F58-60 lifecycles |
| agent | 3 | F57 Overnight triage, F58-59 proactive/amendments orchestrators (overlap with system) |

### By tier (4 buckets)

| Tier | Count | Note |
|---|---:|---|
| core | 18 | Member-facing, frequent, high-value |
| supplementary | 19 | Member-facing, optional / lower-frequency |
| admin | 14 | Commissioner / founder operational |
| system | 11 | Substrate / cron / agent / cloud-function |

### By status (4 buckets)

| Status | Count | Note |
|---|---:|---|
| shipped | 22 | Legacy / pre-Wave-1 operational |
| shipping | 14 | Wave 1 ship targets it (W1.S1..S14) |
| planned | 21 | Wave 2-4 + Launch Phase A/B/C |
| speculative | 5 | Implied; flagged for inclusion decision |

### By ship/wave (rough grouping for Taxonomy D evaluation)

| Wave / Phase | Count | Flow IDs |
|---|---:|---|
| Pre-Wave-1 (legacy shipped) | 22 | F10, F11, F17, F22-23, F26-29, F31-35, F41 + 7 system/agent |
| Wave 1 in-flight | 14 | F1-F8 plus W1-ship-driven: F12-13, F15-16, F18-21, F24-25, F37-40 |
| Wave 2 (design coherence) | 0 net new flows | Wave 2 refines Wave 1 flows; no new flows by design |
| Wave 3 mobile | 5 | F44 Mobile Home, F45 Mobile Play, F46 Mobile Stats, F47 Mobile Feed, F48 Mobile More |
| Wave 4 identity | 2 | F49 New-member signup, F50 Founder migration |
| Launch Phase A/B/C | 5 | F51-54 + 1 (subscription, swing, drills, grandfather) |
| Wave 0 substrate | (overlaps system tier) | F55-62 |

## Taxonomy proposals

### TAXONOMY A — By actor

**Categories (5):**
1. Member flows (38) — the product surface members touch
2. Commissioner flows (6) — per-league admin
3. Founder flows (4) — platform-level admin
4. System flows (11) — crons, regen-all, lifecycle pipelines
5. Agent flows (3) — overnight-triage, proactive/amendments/bubble orchestrators

**Pros:**
- Matches the mental model of "who experiences this flow"
- Maps cleanly to the existing roles vocabulary (member / commissioner / founder per CLAUDE.md v8.0 terminology)
- Easy to read for any audience — Founder, future agents, new contributors

**Cons:**
- Member category (38 flows) is still large; needs sub-grouping for usable rail
- Agent vs system distinction is fuzzy at the boundary (F58 proposal lifecycle is both)

**Visual fit:** good for grouped accordion with category headers.

### TAXONOMY B — By tier (importance/visibility)

**Categories (4):**
1. Core member experience (18) — F1-F8, F12-15, F24, F26, F33, F44-47
2. Supplementary member experience (19) — F9-11, F16-23, F25, F27-31, F34-36, F48, F52
3. Admin (14) — F37-43, F50, F54, F62 + a few overlapping flows
4. Background system (11) — F55-61

**Pros:**
- Signals which flows are product-facing vs invisible
- Aligns with the F5 Metric Integrity filter rule ("does this serve a Main Flow") — Core is the strongest member-of-MAIN-FLOWS signal
- Matches the existing MAIN_FLOWS.md MF-01..MF-08 ranking philosophy (those are all Core)

**Cons:**
- "Core vs supplementary" is judgment-call; same flow could fit either
- Admin tier mixes commissioner + founder operations under one umbrella

**Visual fit:** good for a single-page rail with tier-tinted category chips; Core flows at the top.

### TAXONOMY C — By lifecycle phase (mental model of "what part of the product")

**Categories (6-7):**
1. Onboarding (F9, F32, F49)
2. Active play (F1, F18-19, F24-26, F44-45)
3. Social (F2, F3, F12-14, F33-34, F47)
4. Achievements + records (F6, F16, F28-30, F46)
5. Economy (F4, F7, F20-23, F53-54)
6. Settings + Admin (F10, F37-43, F48, F50, F62)
7. System (F55-62)

**Pros:**
- Matches the way a product surface map reads: "here's how you onboard, here's how you play, here's how you socialize"
- Cross-cuts wave/ship — doesn't lock into roadmap order
- Useful for visitors trying to understand the product holistically

**Cons:**
- 7 categories is more than B's 4 — visual density increases
- A flow can fit multiple categories (F4 wager is Economy + Social; F6 achievement is both Active Play and Achievements)

**Visual fit:** good for a 7-column "PARBAUGHS product surface map" multi-page or large single-page architecture diagram.

### TAXONOMY D — By ship/wave (roadmap state)

**Categories (4-5):**
1. Pre-Wave-1 shipped (22)
2. Wave 1 in-flight (14)
3. Wave 2-4 planned (28: 5 mobile + 2 identity + 5 launch + 16 misc planned)
4. Speculative (5) — flagged for inclusion decision

**Pros:**
- Shows roadmap state visually
- Aligns with ROADMAP.md gate criteria
- Useful for "where are we in the build" audience (orchestration team retros)

**Cons:**
- Time-bound; needs re-categorization at every wave gate
- Doesn't help Founder think about product surface vs implementation state
- A status field on each flow already conveys this; doesn't need to be the primary axis

**Visual fit:** weak as the PRIMARY axis; better as a secondary filter or color-coding over Taxonomy B.

### TAXONOMY E — Hybrid (team's recommended)

**Primary axis: by tier (Taxonomy B), with status (Taxonomy D) as secondary filter + lifecycle-phase (Taxonomy C) as tertiary hint.**

**Layout idea:**
- 4 tier-buckets across the top: Core / Supplementary / Admin / System
- Within each, sub-grouped by status: shipped / shipping / planned / speculative
- Each card shows lifecycle-phase as a small chip (Onboarding / Active Play / Social / Achievements / Economy / Settings / System) — color-coded
- Filter pills at top: actor (5), wave (4), search box

**Pros:**
- Primary axis (tier) is stable and clarifies the F5 Main Flow filter
- Secondary status grouping visibly tracks roadmap progress
- Tertiary phase chip helps Founder navigate by mental model
- Single-page rail viable at 62 flows with filters

**Cons:**
- More complexity than a single axis
- Requires explicit category-membership decisions per flow (which we've done in the inventory; only edge cases need adjudication)

**Visual fit:** filterable + searchable rail with category chips, recommended visual approach per the Founder spec's scale-guidance (30-60 flows band).

## Visual approach proposals

Per Founder spec scale guidance for 30-60 flows: **filterable + searchable rail with category chips.**

### Option 1 — Single-page rail with filter chips (recommended)

- Left rail: 62 flow cards, sortable + filterable
- Top chip bar: actor (5) + wave (4) + status (4) + search box
- Right pane: selected-flow detail view (steps, components touched, source citations)
- Architecture grid stays (page is also reference for components)
- Tier-tinted card borders (Core brass, Supplementary chalk, Admin amber, System teal)

**Implementation cost**: ~600-1000k tokens. Mostly schema + HTML/CSS extension of existing main-flows.html.

### Option 2 — Grouped accordion (per Taxonomy B tier)

- 4 accordion sections (Core / Supplementary / Admin / System), default-expanded for Core, collapsed for others
- Each section has its own rail of flow cards
- Single-page; no filter chips
- Architecture grid above

**Pros:** more legible at a glance for Founder's "what's in product" reads.
**Cons:** harder to find a specific flow without expanding everything.

### Option 3 — Paginated by category (multi-page)

- 4 pages: `main-flows-core.html`, `main-flows-supplementary.html`, `main-flows-admin.html`, `main-flows-system.html`
- Each page is its own architecture diagram
- Nav between pages from chrome

**Pros:** each page can be deeply detailed without cramping.
**Cons:** breaks the unified "main flows" mental model; nav overhead.

## Team's recommendation

**Taxonomy E (hybrid: tier primary + status secondary + lifecycle chip)** + **Option 1 visual (single-page rail with filter chips)**.

Reasoning:
- Tier as primary preserves the F5 Main Flow filter rule clarity
- Status secondary surfaces roadmap progress without dominating
- Lifecycle chip gives Founder a "what part of the product" reading lane
- Single-page rail at 62 flows is tight but viable with filters; doesn't fragment context across pages
- Architecture grid stays (protected layout per Phase 6.5)

## Speculative-flows decision (Founder gate)

5 flows have status=speculative (F51 swing analyzer, F52 drills, F53 subscription, F54 grandfather, plus 1 misc). Three options:

- **(a) Include in inventory + render in diagram with `speculative` visual treatment** (dashed border or muted color)
- **(b) Include in inventory + EXCLUDE from rendered diagram** (data block has them, UI doesn't)
- **(c) Remove from inventory entirely** until source-of-truth doc exists

Team's lean: **(a)**. The 5 are documented enough in ROADMAP Launch Phase C / A to be cited; rendering them with explicit `speculative` styling signals "team flagged but not yet ratified" which is more honest than hiding them.

## Founder gate — escalation per criterion #5

Three decisions required:
- **Decision (a) — Taxonomy:** A / B / C / D / **E (recommended hybrid)**
- **Decision (b) — Visual:** Option 1 single-page filtered rail (recommended) / Option 2 accordion / Option 3 multi-page
- **Decision (c) — Speculative flows:** **(a) Include + render with treatment** (recommended) / (b) include data, hide UI / (c) remove

**Default if no response within reasonable window:** team proceeds with **Taxonomy E + Option 1 + Speculative (a)**. The inventory at `.claude/state/main-flows-v2/flow-inventory.json` is permanent regardless of taxonomy choice; only the visual organization is gated.

## What stays out of scope for Founder gate

- The 62-flow inventory itself (Phase 1 deliverable — not subject to re-vote)
- Stability invariant on F<N> IDs (locked)
- Protected-layout discipline for the architecture grid (locked per Phase 6.5)
- Mobile/responsive considerations (architecture grid is desktop reference per Founder ratification)

## Cross-references

- Phase 1 inventory: `.claude/state/main-flows-v2/flow-inventory.json`
- Source audit: `.claude/state/main-flows-v2/flow-inventory-sources.md`
- Existing MAIN_FLOWS.md baseline (8 of 62): `docs/agents/MAIN_FLOWS.md`
- Visual reference (current state to redesign): `docs/reports/main-flows.html` (PROTECTED LAYOUT 2)
- F5 Metric Integrity filter rule: `docs/agents/METRIC_INTEGRITY_PROTOCOL.md`
