# Operational Protocols (P1-P9)

Nine operational protocols that govern how the orchestration team handles recurring situations. Protocols are policy, not procedure — they answer "what do we do when X happens" not "how exactly do we type the commands."

---

## P1 — Audit-first protocol

**Trigger:** Before any consequential action (writing code, modifying schema, deploying).

**Procedure:**
1. Read the Ship Plan in full
2. Read relevant design spec sections by ID (not from memory)
3. Read affected code files in full (not snippets)
4. Grep for cross-surface consumers of any data being modified
5. Verify current version state (utils.js, package.json, sw.js)
6. Run smoke against current main to establish baseline
7. Identify gaps; escalate rather than infer outside graduated autonomy tier

**Why this exists:** Audits catch coupled bugs. Memory reflects a moment in time, not current state. Multiple ships have confirmed: when memory cites tech debt, verify against current codebase before scoping.

---

## P2 — CFR escalation protocol

**Trigger:** Any of the 11 Critical Feature Registry categories identified.

**Procedure:**
1. Halt work on the affected ship
2. Orchestrator drafts escalation summary:
   - Specific decision proposed
   - CFR category triggered
   - Three or more options considered (where applicable per cost halt mandate)
   - Recommended approach with rationale
3. Surface to Founder via the standard interaction channel
4. Wait for Founder ratification before resuming
5. Log Founder decision to Ship Plan + INFERRED_DECISIONS.md (decision moves from "inferred" to "ratified")

**Why this exists:** Some decisions are too consequential to graduate. The 11 categories are the permanent Founder-approval territory.

---

## P3 — Sanity Halt protocol

**Trigger:** Any of the 9 Sanity Halt categories detected.

**Procedure:**
1. Halt all writes immediately. Do not attempt to fix forward.
2. Document the condition with concrete evidence (logs, command output, smoke failures, code diff)
3. Escalate to Founder via Orchestrator
4. Wait for Founder ruling on resolution path:
   - Single-ship rollback
   - Roll-forward corrective
   - Cumulative rollback
   - Selective revert
5. Execute Founder-ratified resolution
6. Capture lesson to `docs/agents/lessons-learned/` if condition revealed systemic issue

**Why this exists:** Sanity Halt is a deliberate stop, not a setback. Some conditions warrant halt-and-think over fix-and-ship.

---

## P4 — Cost halt protocol

**Trigger:** Any cost-incurring implementation proposed (paid API, Firebase Storage growth, Cloud Function invocation, third-party service).

**Procedure:**
1. Engineer flags during Ship Plan drafting (not after implementation)
2. Ship Plan Scalability Architecture section requires:
   - 3+ option comparison matrix
   - Free-tier first preference
   - 10x scaling projection (current 20 members → 200 → 2000)
   - Cost projection per active member per session
   - Migration path if approach is interim
3. Founder ratifies cost-incurring approach via P2 escalation
4. Critic verifies matrix is real comparison (not handwaving)
5. Approved approach proceeds; Engineer instruments cost metrics from day 1

**Why this exists:** Free-tier first is the discipline. Cost overruns scale with member count; catching them at design time is cheaper than retrofit.

---

## P5 — Rollback protocol (revised per Correction 3)

**Trigger:** Production failure or post-ship critical bug discovered.

**Procedure:**
1. Severity assessment:
   - **P0** — production down or data loss imminent → Founder synchronously present (mandatory); immediate single-ship rollback
   - **P1** — significant member impact → Founder synchronously present (mandatory); roll-forward corrective in interrupt sprint
   - **P2** — degraded but functional → autonomous corrective; inter-wave sprint; ratified at retrospective
   - **P3** — minor → autonomous; backlog opportunistic, batch with future ship
2. For P0/P1 rollback: use streamlined Ship Plan template (`Rollback: <ship-id> due to <reason>`); Founder synchronous through completion
3. For P2/P3 corrective: Engineer scopes + Critic approves; Orchestrator publishes Caddy Notes; autonomous push if gates green
4. Critic reviews rollback as standard ship (acceptance criteria: production restored, no data loss, member impact mitigated)
5. Push: Founder pushes for P0/P1 (synchronous override remains available); autonomous push for P2/P3 on green
6. Retrospective on cause; capture lesson; capture skill or hook proposal if pattern is repeatable

**Why this exists:** Recovery is severity-tiered. P0 buys speed with Founder presence; P1 buys human eyes on significant impact; P2/P3 buys batching efficiency without Founder bottleneck. Per Correction 3, Founder synchronous is mandatory ONLY at P0/P1 — minimizing Founder prompts for routine corrective work.

---

## P6 — Inferred decision protocol

**Trigger:** Engineer or Orchestrator encounters underspecified detail mid-implementation.

**Procedure:**
1. Check graduated autonomy tier — is this decision within current tier?
2. **Within tier:** Make inference using Founder-pattern conventions. Log to:
   - Ship Plan Inferred Decisions section
   - `docs/agents/INFERRED_DECISIONS.md` (append-only log)
3. **Outside tier or permanent-approval territory:** Escalate to Orchestrator → Founder per P2
4. Mark code/output as `INFERRED` (comment in code, marker in user-facing copy if applicable)
5. At retrospective, Founder reviews inferences:
   - **Ratify** — inference promoted to ratified decision; marker can be removed
   - **Reverse** — inference reverted; rollback or correct in next ship; pattern recognition adjusts
   - **Defer** — keep marker; revisit at next retrospective

**Why this exists:** Gap inference unblocks work without forcing Founder synchronous presence on every micro-decision. Audit trail keeps inferences accountable.

---

## P7 — Caddy Notes publication protocol

**Trigger:** Ship close (per ship) or wave gate (per wave).

**Procedure:**
1. Orchestrator drafts Caddy Notes entry in Ship Plan
2. Universal content for all members — no audience differentiation, ever
3. Leak protection:
   - No unshipped pricing
   - No internal feature names
   - No architectural detail
   - Member-facing description only
4. Tone:
   - Conversational, accountable
   - No corporate hedging
   - Insider voice acceptable (founding crew context)
5. Version triple bump applied (X.Y.Z):
   - X = major
   - Y = feature/patch
   - Z = bugfix
6. Three sections kept current:
   - **Recent updates** — last 3 member-relevant ships
   - **Roadmap** — wave-transition cadence
   - **What's in the bag** — per-ship cumulative
7. Infra-only ships get honest "Behind-the-scenes improvements" entry
8. Orchestrator publishes without Founder approval

**Why this exists:** Caddy Notes are the member-facing changelog. Universal content keeps it simple. Leak protection keeps it safe.

---

## P8 — Smoke coverage + visual verification protocol (expanded per Correction 2)

**Trigger:** Every ship that ships member-facing changes.

**Procedure:**

### Smoke coverage (Tier 2 + Tier 3)
1. Ship Plan acceptance criteria includes new smoke specs
2. Engineer adds smoke covering:
   - Primary success path
   - Each documented state (empty, loading, error, permission tiers)
   - Cross-surface non-regression (related surfaces still work)
   - Performance budget if applicable
3. Smoke runs against real Firebase (smoke-test-league, smoke@parbaughs.test account)
4. Smoke covers all 4 browsers: **chromium, firefox, webkit, webkit-mobile**
   (Corrected from prior "msedge" — actual smoke runner uses webkit-mobile per `package.json:22` and `tests/smoke/run.js`. webkit-mobile emulates iOS Safari and matches the mixed iPhone/Android user base.)
5. Critic verifies smoke pass before approving ship
6. B.43 family exception documented separately (known flake exception — webkit family timing fragility, mobile + desktop)

### Visual verification (new per Correction 2)

Per Correction 2: visual verification via Playwright screenshots is mandatory. Engineer + Critic verify functionality visually — not just lint output, not just smoke text logs. Catches: layout breakage, missing empty/loading/error states, cross-browser visual divergence, token rendering misses, SVG color-resolution failures, off-screen overflow, content clipping.

7. Engineer captures Playwright screenshots per state per page per browser via existing `tests/smoke/helpers/capture.js` API. Screenshots land in `tests/smoke/output/<ts>/<browser>/screenshots/` (gitignored).
8. At ship close, Engineer copies the ship-relevant subset of screenshots to **`tests/visual-verify/<ship-id>/`** (committed path; NOT gitignored). Inferred decision per Q2 in PHASE_1_FOUNDER_REVIEW.md.
9. Visual verification asserts:
   - DOM existence (selector matches)
   - Non-zero element size (no `display: none` regressions)
   - Non-transparent color (computed style sanity)
   - SVG presence + correct color resolution
   - Layout integrity (no overflow, no clipping, no z-index regressions)
   - State coverage (empty / loading / populated / error / permission-tier visible per applicable surface)
   - Cross-browser parity (no chromium-only success)
10. Critic reviews screenshot diffs as part of implementation review per CRITIC.md Implementation review step 4
11. Failure raises Sanity Halt category 9 if pattern emerges; blocks autonomous push

### Wave gates
- Wave 1 → 2: P8 visual smoke coverage chromium 100% across all HQ pages
- Wave 2 → 3: Pixel-diff against committed design bot mocks (Phase 2B brief outputs)
- Wave 3 → 4: Mobile parity additionally verified across M1-M6 tabs

**Why this exists:** Smoke is the regression net. Real-Firebase smoke catches what mock smoke misses. Cross-browser coverage catches platform-specific bugs. Visual verification catches what text-based smoke logs cannot — layout breakage, missing states, token rendering misses.

---

## P9 — Memory migration protocol

**Trigger:** New committed governance ratifies decisions previously held in memory only.

**Procedure:**
1. Orchestrator audits memory entries against current codebase
2. For each memory entry:
   - **Persistent state** (architectural patterns, locked decisions, design system rules) → migrate to committed markdown in `docs/agents/`
   - **Session-internal state** (current ship status, in-flight context) → leave in memory; cleared at ship close
   - **Outdated** (contradicted by current codebase) → flag to Founder; remove from memory after Founder confirmation
3. Persistent state lives in:
   - `docs/agents/ROADMAP.md` — roadmap, gates, governance summary
   - `docs/agents/ORCHESTRATOR.md` / `ENGINEER.md` / `CRITIC.md` — role-specific protocols
   - `docs/agents/CRITICAL_FEATURE_REGISTRY.md` / `SANITY_HALT.md` — frameworks
   - `docs/agents/lessons-learned/` — per-wave lessons
4. Orchestrator clears session memory at ship close
5. Founder reviews migrated content; can edit committed markdown via Git workflow

**Why this exists:** Memory is volatile and unaudited. Committed markdown is durable and reviewable. Hybrid architecture keeps the speed of memory with the durability of commits.

---

## Protocol interactions

- P1 audits often surface P2 CFR triggers, P3 Sanity Halt conditions, or P4 cost halts
- P3 Sanity Halt may trigger P5 rollback if production-affecting
- P6 inferred decisions feed P9 memory migration at retrospective
- P7 Caddy Notes publication is the final step of every shipped ship
- P8 smoke coverage is required at acceptance per all shipped ships

When protocols conflict, escalate to Founder. Do not invent resolutions.
