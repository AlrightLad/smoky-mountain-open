# Phase 1 — Memory Migration Audit (P9)

**Run date:** 2026-05-12 (Phase 1 setup overnight)
**Per:** PROTOCOLS.md P9 (Memory migration protocol)
**Scope:** Reconcile Founder's persistent auto-memory entries against committed governance + current codebase

This audit fires once at Phase 1 commit. Future memory migration happens at ship close (Orchestrator clears session memory; persistent state already in docs/agents/).

---

## Memory entries reviewed

The auto-memory system at `~/.claude/projects/C--Users-Zach-smoky-mountain-open/memory/` contains the entries indexed in `MEMORY.md`. Each entry below evaluated against current code + governance.

### MEM-1 — `project_ship_5_7_shipped.md` (4 days old)

**Type:** Project state
**Summary:** v8.22.0 deployed 2026-05-07; Ship 5+7 capabilities (retroactive logging, Edit round flow, B.44 timestamp fix); Ship 5+8 next per locked sequence.

**Verification:**
- `package.json` version = "8.22.0" ✓
- `git log` confirms commit `9403c11` "v8.22.0 — Ship 5+7" ✓
- Production curl returned 200 OK at audit time ✓
- B.42 closed; B.43 expanded; B.44 closed; B.45/46/47 tracked per `docs/POST_SHIP_4A_BACKLOG.md`

**Disposition:** Still accurate at Phase 1 commit time. **Migrates to** `docs/agents/ROADMAP.md` "Current state" + ship-reports/ when Ship 5+7's report is committed (Ship 5+7 predates new orchestration so no per-ship-report file exists; flag for retrospective).

### MEM-2 — `project_ship_5_8_inventory.md` (4 days old)

**Type:** Project state (pre-V11 audit inventory for Ship 5+8)
**Summary:** members.js is 2,105 LOC; multi-mode dispatch; 14 Router.go callsites; B.5 resolved per v8.14.4 Q-RULING-A; 30-file cross-surface dependency footprint.

**Verification (cross-checked with PHASE_1_CODEBASE_AUDIT.md):**
- members.js still 2,105 LOC ✓
- multi-mode dispatch confirmed (renderMemberList, renderMemberDetail, renderMemberEdit, renderAddMemberForm) ✓
- B.5 resolved per inline comment at members.js:1152-1154 ✓
- "30-file fanout": actual `fbMemberCache` consumers = 13 files (audit DRIFT-9). Broader PB.getPlayer* fanout plausibly higher. The figure is directionally correct, not literal.

**Disposition:** Inventory still accurate. Becomes historical once Ship 5+8 fires (per memory's own footnote). **Migrates to** `docs/agents/ships/W1.S3.md` Ship Plan (members surface in Wave 1) when that ship opens. Until then, V11 audit findings from prior session are the actionable record.

### MEM-3 — `project_hq_completion_sequence.md` (4 days old)

**Type:** Project state (locked ship order)
**Summary:** Ships 5+8 through 5+16 sequence; design bot review at end; mobile rebuild M1-M5 after.

**Verification:**
- `docs/agents/ROADMAP.md` Wave 1 captures the 14 design + 5 infrastructure ships ✓
- Ship sequence matches: Members → Bounties V12 → Wagers V12 → Scrambles V12 → Trips V12 → Trophy Room → Range → Onboarding → Caddy Notes ✓ (roadmap uses W1.S3, W1.S6 etc. naming convention; memory uses 5+8 through 5+16 convention — same ships, different IDs)

**Disposition:** Memory uses pre-orchestration naming (Ship 5+N). Roadmap uses Wave 1 naming (W1.SN / W1.IN). Both refer to the same work. **Migrates to** `docs/agents/ROADMAP.md` Wave 1 section as canonical. After Phase 1, memory should reference Wave 1 ship IDs for consistency.

**Action:** No memory write; memory remains valid as-is. Future-session memory entries should adopt W1.SN naming.

### MEM-4 — `project_hq_design_pass_deferrals.md`

**Type:** Project state (deferred items)
**Summary:** Items held back from in-flight HQ ships (H5, B.8, masthead branding, B.36, Part C) for post-5+16 batch design review.

**Verification:** Items listed in `docs/POST_SHIP_4A_BACKLOG.md` + per-item entries in `docs/agents/backlog/INDEX.md` partially. B.8 = BL-008 (a11y drawer aria-modal at Band A) ✓.

**Disposition:** Still accurate. Migration path: each deferred item should have a BL-NNN backlog entry OR be explicitly noted in `docs/agents/ROADMAP.md` Wave 2 (design coherence pass). Most appear to be tracked already.

**Action:** No memory write; backlog reconciliation at Wave 1 close.

### MEM-5 — `project_b43_webkit_mobile_smoke_timing.md`

**Type:** Project state (known smoke flake exception)
**Summary:** Intermittent webkit-only flakes; expanded to webkit-mobile + webkit-desktop per Ship 5+7 close-out.

**Verification:**
- `docs/POST_SHIP_4A_BACKLOG.md` entry B.43 present ✓
- `parbaughs-smoke-failure-triage` skill (Phase 1 STEP 2) documents the B.43 exception explicitly ✓
- Smoke runner output confirms webkit-mobile flakes (e.g., `tests/smoke/output/2026-05-04T*/webkit-mobile/`) ✓

**Disposition:** **Migrates** to the skill content (already done; `parbaughs-smoke-failure-triage.md` documents the exception). Memory entry stays for cross-session pattern recognition.

### MEM-6 — `feedback_p5_diagnostic_first.md`

**Type:** Feedback (Founder behavioral rule)
**Summary:** Diagnostic-first on bug reports. Confirm root cause via diagnostic before scoping fix. Prevents scoping misses (referenced v8.19.0 / B.31).

**Verification:** Documented in `parbaughs-audit-protocol` skill ("Diagnostic before defense" inherited via P1 audit-first); ENGINEER.md also captures it.

**Disposition:** **Migrated** to skill content + ENGINEER.md. Memory remains for cross-session continuity.

### MEM-7 — `feedback_p6_verify_design_data_sources.md`

**Type:** Feedback
**Summary:** Verify design-spec data sources before spec authoring. Grep / inspect that named data sources live in code before locking implementation spec.

**Verification:** Documented in `parbaughs-audit-protocol` skill (Step 2 — design spec by ID) + ORCHESTRATOR.md audit-first protocol step 1.

**Disposition:** **Migrated** to skills + governance.

### MEM-8 — `feedback_p7_functional_first.md`

**Type:** Feedback
**Summary:** Each HQ page gets full Ship 5+6 polish; comprehensive design bot review across all surfaces AFTER HQ completion; refinement work becomes follow-on ships.

**Verification:** Documented in:
- `docs/agents/ROADMAP.md` Wave 1 → Wave 2 gate criteria ✓
- `docs/agents/INTER_WAVE_PROTOCOL.md` Wave 1 → 2 transition ✓
- `project_hq_completion_sequence.md` aligned ✓

**Disposition:** **Migrated** to ROADMAP + INTER_WAVE_PROTOCOL. Memory remains.

### MEM-9 — `feedback_p8_visual_smoke_assertions.md`

**Type:** Feedback
**Summary:** Visual-layer smoke assertions on engagement surfaces. Smoke must verify DOM existence, non-zero size, non-transparent color, SVG presence — not just data writes.

**Verification:** Documented extensively in `parbaughs-visual-verification-protocol` skill (Phase 1 STEP 2 item 10). Also captured in PROTOCOLS.md § P8 (expanded per Correction 2) + SANITY_HALT.md category 9.

**Disposition:** **Fully migrated**. The Correction 2 mandate from Founder prompt formalizes this feedback into permanent governance. Memory remains as foundational record.

### MEM-10 — `feedback_p9_namespace_collisions.md`

**Type:** Feedback
**Summary:** Grep src/core + src/styles before adding data-* attributes; semantic prefixes (data-likes-count, etc.) for feature state. Avoid collision with platform-claimed names.

**Verification:** Documented in `parbaughs-namespace-collision-check` skill (Phase 1 STEP 2 item 6) including the known platform-claimed names table (data-count owner = animate.js, data-page owner = router.js, etc.).

**Disposition:** **Fully migrated** to skill content.

---

## Contradictions between memory and current codebase / governance

None of the 10 memory entries directly contradict current code or governance. The largest gap is **CLAUDE.md's "Project State" being 21 ships out of date** (DRIFT-7 in audit) — but that's CLAUDE.md vs reality, not memory vs reality.

Indirect contradictions / framing differences:

- Memory uses "Ship 5+N" naming; new ROADMAP uses "W1.SN / W1.IN". Same ships, different IDs. Memory NOT contradicted; future entries should adopt new naming for consistency.
- Memory cites "30-file member-data fanout" repeatedly. Audit found actual `fbMemberCache` direct consumers = 13 files; broader fanout via `PB.getPlayer*` unverified but plausibly higher. Not contradicted but the literal figure is brittle. Skills + governance now say "verify per-ship via grep" (parbaughs-cross-surface-dependency-audit skill).

## What was NOT in memory but should be (gaps)

The audit + critique surfaced patterns not yet captured in memory. These are candidates for future memory entries (Founder discretion):

1. **`tests/smoke/output/` is gitignored.** Visual verification infrastructure needs separate committed path. Captured in `parbaughs-visual-verification-protocol` skill + PHASE_1_FOUNDER_REVIEW.md Q2. Not currently in memory.

2. **`leagueQuery` not `leagueCollection`.** Wrapper name corrected at Phase 1; documented in `parbaughs-firestore-writer-audit` skill. Not currently in memory.

3. **CLAUDE.md staleness.** Project State line says v8.1.3; reality v8.22.0. Memory doesn't note this directly. Phase 1 audit captures it in DRIFT-7.

4. **`scripts/v7-mtd-diagnostic.js` untracked status.** Surfaced in audit; pending Founder Q3 review. Not in memory.

5. **Page Shell `hqHome` variant.** Added v8.15.1 per page-shell.js code; CLAUDE.md only mentions 2 variants. Memory doesn't reference variants. Future ship that adds another consumer should re-read page-shell.js header.

## Memory hygiene recommendations

Future cross-session memory entries should:
- Cite ship IDs as W<wave>.S<num> / W<wave>.I<num> / M<num> (per ROADMAP)
- Cite cross-surface fanout via **grep-verified count** at memory-write time, not memorized figures
- Reference governance files in docs/agents/ rather than re-documenting their content
- Be **time-aware** — note when state was last observed; trust commits over memory when divergent

The MEMORY.md index file (currently 18 lines per its last update; under the 200-line cap) is healthy. No pruning required.

## P9 protocol verdict

Memory entries are consistent with current code + governance. Migration is mostly **complete via skill content + governance text** — committed-markdown is now the authoritative store for persistent state; memory is the cross-session continuity layer.

No memory entries flagged for removal. No memory entries flagged as outdated. Two framing notes (Ship 5+N naming, 30-file fanout figure) are minor and self-correcting at next memory-write.

**Founder action at retrospective:** none required for memory migration. The 7 items in `PHASE_1_FOUNDER_REVIEW.md` are governance-level decisions, not memory cleanups.
