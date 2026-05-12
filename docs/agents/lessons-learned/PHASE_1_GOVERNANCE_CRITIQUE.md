# Phase 1 — Governance Self-Critique (Critic role, per Step 0a)

**Critique run:** 2026-05-12 (Phase 1 setup, parallel to PHASE_1_CODEBASE_AUDIT.md)
**Critic:** Claude Code (Critic role; same session as audit per single-agent operation)
**Scope:** 15 governance files in `docs/agents/` + 12 backlog files + design spec hierarchy hand-off

Critic operates adversarially against governance documents themselves, not just code. The goal: surface contradictions, gaps, assumptions that the codebase contradicts, and unstated dependencies that will bite during execution.

---

## Internal contradictions in `docs/agents/`

### CONTRA-1 — Push status contradicted before-and-after Correction 1 (P1)

Pre-correction state, multiple files agree push is permanent-Founder-only:
- `CTO_INTERFACE.md:14` — "Push to remote — agents never push"
- `GRADUATED_AUTONOMY.md:81` — "Push to remote — `.claude/settings.json` hook 6 blocks; never graduates"
- `ORCHESTRATOR.md:23` — "Approve push to remote (Founder-only, permanent)"
- `ENGINEER.md:20` — "Push to remote (Founder-only)"
- `CRITIC.md:22` — "Push to remote (Founder-only)"

Post-correction (per Founder prompt Correction 1): push graduates, autonomous on green.

The 6 sites need consistent treatment. Partial application creates the most confusing state of all (some files say founder-only, some say autonomous). Phase 1 STEP 0 sweeps all 6.

**Resolution:** Tasks #1–#6 + #7 update all 6 sites. Phase 1 STEP 0 mid-flight (4 of 6 done before audit fired); finishing covers the remainder.

### CONTRA-2 — Tier 0 starting state contradicts Founder Correction 3 (P1)

`GRADUATED_AUTONOMY.md:141`: "At Phase 1 commit (this commit), all categories are at **Tier 0** — Founder approval required for everything."
`INFERRED_DECISIONS.md:76`: "At Phase 1 commit: all categories at **Tier 0**."

Founder Correction 3: "Graduated autonomy starts at Tier 1 (not Tier 0) at Phase 1 commit."

**Resolution:** Tasks #7, #9.

### CONTRA-3 — Sanity Halt category count: 8 vs 9 (P1)

`SANITY_HALT.md` and `CRITICAL_FEATURE_REGISTRY.md` and `ROADMAP.md` consistently reference "8 Sanity Halt categories" today. Founder Correction 2 adds a 9th: visual verification failures.

After Phase 1, the count becomes 9. All references need updating:
- `SANITY_HALT.md` heading (says 8 categories) + Audit cadence + body
- `CRITICAL_FEATURE_REGISTRY.md:11` — "Sanity Halt severity calls — all 8 categories require Founder ratification"
- `ROADMAP.md` (line ~180) — "Sanity Halt (8 categories): ..."
- `PROTOCOLS.md` (P3) — "Any of the 8 Sanity Halt categories detected"
- `CTO_INTERFACE.md` (after Phase 1 STEP 0 it says 9 — already fixed mid-flight; need to verify)

**Resolution:** Tasks #8, #11. Add a sweep verification step.

### CONTRA-4 — `leagueCollection` vs `leagueQuery` wrapper name (P2)

Detailed in CODEBASE_AUDIT.md DRIFT-1. Multiple governance files cite the wrong wrapper name. Code is canonical.

**Resolution:** Sweep `leagueCollection` → `leagueQuery` during Phase 1 STEP 0 (Tasks #5, #6, #11, plus SHIP_PLAN_TEMPLATE.md addition).

### CONTRA-5 — Engineer protected paths list incomplete (P2)

`ENGINEER.md:25` lists 4 protected paths: `.env*, payments/, auth/, scripts/create-smoke-account.js`.
Hook 4 (`gate-protected.sh`) protects 3 patterns: `.env / .env.*, scripts/.service-account.json, firestore.rules`.

Discrepancies:
- ENGINEER cites `scripts/create-smoke-account.js` → hook does NOT protect
- Hook protects `scripts/.service-account.json` + `firestore.rules` → ENGINEER does NOT list
- ENGINEER cites `payments/` + `auth/` directories → don't exist in codebase (no such dirs)

**Resolution:** Reconcile in Phase 1 STEP 3. Hook 1 ("Critical path blocker") extends gate-protected.sh to cover the actual + governance-claimed paths. ENGINEER.md updated to list the actual hook coverage (firestore.rules, service-account, .env*) plus the new additions (create-smoke-account.js).

### CONTRA-6 — `LAUNCH_GOVERNANCE.md:64-71` references 6 hooks as if active (P1)

LAUNCH_GOVERNANCE.md predicts the post-Phase-1 hook state ("`.claude/settings.json` hooks remain active during Launch"). Pre-Phase-1, the 6 hooks aren't active yet (only the original 5). This is OK because Launch fires after Wave 4, so 6 hooks WILL be active by then. But until Phase 1 STEP 3 lands, the document overstates.

**Resolution:** No edit needed. Phase 1 STEP 3 makes LAUNCH_GOVERNANCE.md retroactively accurate.

### CONTRA-7 — Founder push checklist + autonomous push checklist diverge on artifact location (P3)

Post-Phase-1 (Task #3 edits): CTO_INTERFACE.md describes both checklists. Autonomous push commits visual-verify screenshots to `tests/visual-verify/<ship-id>/`. Founder push (manual override) doesn't specify whether Founder runs visual verification themselves.

**Reading:** Founder override is escape hatch; Founder takes responsibility for verification or accepts the risk. Document explicitly.

**Resolution:** Minor copy improvement in Phase 1 main commit; document Founder override as "Founder accepts visual verification responsibility or proceeds anyway." Not blocking.

---

## Governance claims that contradict the codebase

### CLAIM-1 — "30-file member-data fanout" cited as concrete number

`ENGINEER.md:34`: "Grep for cross-surface consumers of any data structure being modified. The 30-file member-data fanout pattern is real..."
`CRITIC.md` Criterion 12: "Every ship touching shared data... declares the cross-surface consumers it affects, citing the 30-file member-data fanout pattern."

Concrete grep: `fbMemberCache` direct reads in 13 files. Broader member-data via `PB.getPlayer*` is wider but the "30" figure isn't independently verifiable from current code. The figure may be from Ship 5+6 inventory memory.

**Recommendation:** Soften governance language to "wide cross-surface fanout (verify per-ship via grep)". The instruction stands; the specific number is brittle. Not Phase 1 blocker — flag for retrospective.

### CLAIM-2 — Ship 5+8 is "first calibration ship under new orchestration" (`ROADMAP.md:9`)

Confirmed by audit. Ship 5+7 (v8.22.0) was the last under Three-Agent Workflow (Zach + Claude.ai + Claude Code). Ship 5+8 fires under new Orchestrator + Engineer + Critic structure. Governance is correct; CLAUDE.md (which still describes Three-Agent Workflow) is the document that contradicts.

**Resolution:** CLAUDE.md update deferred. Flag for Wave 1 retrospective. Memory entry `project_ship_5_8_inventory.md` already anticipates the shift.

### CLAIM-3 — `docs/CLUBHOUSE_SPEC.md` as authoritative design source (`README.md:60-65`)

Verified: CLUBHOUSE_SPEC.md + CLUBHOUSE_SPEC-3a through 3e + CLUBHOUSE_SPEC-4-Wave3-implementation.md + wave-2a-ratification.md = 8 design bot files present on disk. README.md correctly references them.

**Resolution:** No issue.

### CLAIM-4 — Page Shell variants documented (2 vs 3) (P3)

`CLAUDE.md` "Page Shell architecture" lists `default` + `bandA`. Actual code has 3rd variant `hqHome` (v8.15.1 Gate 2). CLAUDE.md stale but governance docs/agents/* don't depend on this — they reference page-shell.js by path, not by variant count.

**Resolution:** Not a governance issue; CLAUDE.md maintenance gap.

---

## Gaps in governance (things missing that audit revealed needed)

### GAP-1 — No protocol for ship-plan-template additions

When governance evolves (e.g., adding a Visual Verification Artifacts section to Ship Plan post-Correction 2), no protocol describes how Engineer/Critic adopt the new section retroactively across in-flight ships. Phase 1 introduces visual verification mid-Wave-1; ships that started before Phase 1 don't have the section.

**Recommendation:** Add to PROTOCOLS.md a P10 ("governance evolution / ship-plan template versioning") OR document inline in SHIP_PLAN_TEMPLATE.md (e.g., "Sections may be added; in-flight ships acknowledge by retrospective rather than retrofit"). Not Phase 1 blocker.

### GAP-2 — Caddy Notes universal-content rule lacks "non-universal" examples

`PROTOCOLS.md:135-138` describes leak protection (no unshipped pricing, no internal feature names, no architectural detail). Doesn't give a worked example of what universal content looks like vs. what gets rejected.

**Recommendation:** `parbaughs-caddy-notes-classifier` skill (Task #12 item 8) provides the worked examples. Skill content fills this gap.

### GAP-3 — Backlog `INDEX.md` doesn't track which BL items are "in-progress" within a ship

Backlog discipline (`INDEX.md:30`) lists Status as Open / In Progress / Closed. INDEX.md table only shows Open. No mechanism to mark BL-NNN as in-flight in Ship X without modifying per-item file + INDEX simultaneously.

**Recommendation:** Minor; Engineer updates BL file's Status field when starting work; INDEX stays accurate via single-source-of-truth at the per-item file. Not Phase 1 blocker.

### GAP-4 — No mention of Husky pre-commit hooks layer

CLAUDE.md "Git Hooks (Husky)" describes a second layer of gates beyond Claude Code hooks. Governance docs/agents/* don't mention Husky. Engineer audit-first should know both layers exist.

**Recommendation:** Reference Husky in ENGINEER.md "Audit-first protocol" step 6 (smoke baseline). Confirm `set -e` is still in `.husky/pre-commit` (CLAUDE.md says load-bearing). Phase 1 doesn't modify Husky; just acknowledge.

### GAP-5 — No "abort-Phase-1" protocol

If Phase 1 hits a blocker mid-execution (e.g., hook conflict, broken settings.json, env-var-set-fails), no documented rollback. Default would be `git restore`/`git checkout` of working-tree changes pre-commit, but governance doesn't articulate this.

**Recommendation:** Inline in PHASE_1_COMPLETE.md (per Task #19). Not Phase 1 blocker.

### GAP-6 — Visual verification: who owns the screenshot diff baseline?

Correction 2 says screenshots verify against expectations. What's the baseline for "expected"? Options:
- Engineer-authored ground truth at first run, future runs diff against it (drift detection)
- Design spec mock (Wave 2+ Phase 2C ships only; Wave 1 has no per-page mocks)
- Critic eyeballs each screenshot per ship (slow; doesn't scale)

`parbaughs-visual-verification-protocol` skill needs to make this concrete. **Recommendation:** Skill specifies Phase 1 era = Critic-eyeball-per-ship + state-coverage-checklist. Wave 2+ = pixel-diff against committed design bot mocks. Wave 3+ = same plus mobile parity.

### GAP-7 — No mention of `firestore.rules.maintenance` cutover artifact

Per UD-3 in audit. Cutover Playbook lives in CLAUDE.md only. Engineer/Critic without CLAUDE.md context might not know `firestore.rules.maintenance` is a load-bearing artifact (vs. a stale dev file). Risk: someone deletes it during cleanup.

**Recommendation:** Add to SANITY_HALT.md category 6 (drift) — "Touching or removing `firestore.rules.maintenance` outside an active cutover ship triggers halt." Not Phase 1 blocker but cheap to add.

### GAP-8 — Skill activation mechanism unclear

`README.md:55-57` says proposed-skills graduate to `.claude/skills/` per `SKILL_APPROVAL.md` token. Token format/contents not specified anywhere. STEP 2 of Founder prompt says "auto-generate tokens" but doesn't spell format.

**Recommendation:** Phase 1 STEP 2 invents a minimal `SKILL_APPROVAL.md` format: per-skill markdown sidecar (`<skill-name>.md` skill file + `<skill-name>.APPROVAL.md` token sidecar) inside `.claude/skills/`. Approval sidecar contains: timestamp, ratifier (Founder name), tier inferred under, rationale. Hook 5 ("Approval-gated paths") checks for sidecar presence before allowing skill execution.

This format is INFERRED at Tier 1 — Founder reviews at retrospective.

---

## Governance assumptions worth flagging

### ASSUME-1 — Founder physically at desktop during Phase 1 execution

Multiple governance docs say "single-machine constraint, Founder runs from desktop". Phase 1 directive ("Founder is ending the day. Execute Phase 1 setup autonomously through the night.") explicitly violates this. Agent executes; Founder reviews morning.

This is consistent with Correction 3 (minimize Founder prompts; review at retrospective). But it's the first concrete instance of agent-autonomous overnight work. Worth captioning in PHASE_1_COMPLETE.md: this Phase 1 run IS the first test of autonomous-by-default mode.

### ASSUME-2 — Vision-required-before-ship-fires applies to Ship 5+8

ROADMAP says Ship 5+8 "fires as first calibration ship under new orchestration." Per `SHIP_PLAN_TEMPLATE.md`, Vision is Founder-authored before agent work. Phase 1 directive correctly says "DO NOT fire Ship 5+8 yet (Vision required)."

Previous session (mid-V11 audit) finished with a CTO ratification standby. The audit results may need re-grounding once Ship 5+8 fires under new structure — the V11 audit data is still valid context but the workflow shape differs.

### ASSUME-3 — Founder push override semantics

Post-Correction-1 governance says Founder push override "remains available". Mechanism unclear. Options:
- Founder runs `git push` manually (bypasses any hook 6 protection? Or hook 6 detects Founder identity? Or hook 6 just respects whoever invokes git push?)
- Founder edits `.claude/state/last-verify.json` to declare green and pushes
- Founder skips push protection via a documented env var override

**Recommendation:** Hook 6 should default to "fail open" when state file missing. Founder push manual works because Founder doesn't run through hooks (Founder uses terminal directly outside Claude Code session). This means hook 6 only gates AGENT-invoked `git push`, not Founder shell pushes. Document explicitly.

---

## Final Critic verdict

Governance is well-structured but has predictable drift from a 1-day authoring sprint:
- 6 push-related sites need consistent treatment (mid-fix already)
- Tier 0 → Tier 1 starting state needs sweep (planned)
- Wrapper name `leagueCollection` → `leagueQuery` sweep needed (planned, plus SHIP_PLAN_TEMPLATE addition)
- Sanity Halt category count 8 → 9 needs sweep across 4+ files
- Some governance claims overstate concrete numbers (30-file fanout); soften without losing intent
- Visual verification protocol needs concrete baseline mechanism (skill should encode)
- `SKILL_APPROVAL.md` token format needs invention (Tier 1 inferred decision)

Phase 1 STEP 0 + STEP 2 + STEP 3 resolve the bulk. Remaining items (GAPs 1-8, ASSUMEs 1-3) are P3 — surface at retrospective, don't block Phase 1.

**Critic approval:** Phase 1 plan approved with the adjustments captured in `PHASE_1_CODEBASE_AUDIT.md` Section 6. Audit commit + critique commit (this file) land before Phase 1 main commit per Founder Step 0a directive.
