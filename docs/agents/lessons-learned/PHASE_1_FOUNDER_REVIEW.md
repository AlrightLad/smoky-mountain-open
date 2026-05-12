# Phase 1 — Items pending Founder review

Items surfaced during Phase 1 setup that need Founder ruling at morning retrospective. Captured 2026-05-12 (overnight Phase 1 autonomous execution). None of these block Phase 1 setup commit/push; all decidable at morning review.

---

## Q1 — `CLAUDE_EXPERIMENTAL_AGENT_TEAMS` env var not set

**Context:** Phase 1 STEP 6 directive says verify the flag is set + Engineer/Critic agent invocation works. Current PowerShell session: `$env:CLAUDE_EXPERIMENTAL_AGENT_TEAMS` returns nothing.

**Options:**
- **A.** Set system-wide via `[Environment]::SetEnvironmentVariable("CLAUDE_EXPERIMENTAL_AGENT_TEAMS", "1", "User")` — persists across reboots, affects ALL Claude Code sessions on this machine
- **B.** Set per-session in PowerShell profile (`$PROFILE`) — applies only when Founder/agent launches PowerShell with default profile
- **C.** Document need; agent doesn't change env state autonomously this session — Founder sets manually at retrospective

**Phase 1 inferred:** Option C. Agents do not modify Founder's machine environment variables autonomously. Environment validation report documents the missing flag for morning action.

**Founder decision needed:** ratify Option C or override to A/B.

---

## Q2 — Visual verification screenshot storage

**Context:** Correction 2 mandates Playwright screenshots commit-and-review. `tests/smoke/output/` is gitignored (.gitignore:43). Existing smoke runner DOES capture screenshots — they exist locally but never reach the remote.

**Options:**
- **A.** Introduce `tests/visual-verify/<ship-id>/` as new (non-gitignored) committed path. Engineer copies relevant subset from smoke output at ship close. Per-ship retention. **(Recommended — Phase 1 inferred.)**
- **B.** Remove `/tests/smoke/output/` from .gitignore. Inflates repo (~10MB/ship), permanent history, may capture sensitive UI state inadvertently.
- **C.** Push to Firebase Storage bucket. Cost-incurring per Q44 Lock 3 — triggers CFR Category 11; requires comparison matrix; not free-tier-first.

**Phase 1 inferred:** Option A. `parbaughs-visual-verification-protocol` skill (STEP 2 item 10) documents the copy-at-ship-close flow. `tests/visual-verify/` directory created at first Wave-1 ship that uses it (Ship 5+8 or later); Phase 1 doesn't pre-create empty directories.

**Founder decision needed:** ratify Option A or override to B/C.

---

## Q3 — `scripts/v7-mtd-diagnostic.js` untracked

**Context:** Per `git status`, this file exists in working tree but is not tracked. No prior commit references it. Filename suggests "v7 month-to-date diagnostic" but contents unverified by audit. The Phase 1 setup does NOT touch this file.

**Options:**
- **A.** Commit it (add to git history). Risk: unknown contents, may contain sensitive data or be stale dev-time artifact.
- **B.** Add to `.gitignore` if it's intentionally local. Risk: hides it from collaboration if Founder later wants to share.
- **C.** Delete it if obsolete.
- **D.** Leave untracked indefinitely. Risk: trips future `git add .` patterns; clutter in `git status`.

**Phase 1 inferred:** Option D. Agent does not commit, ignore, or delete files of unknown provenance. Phase 1 commit will not stage this file.

**Founder decision needed:** A/B/C — review contents and decide.

---

## Q4 — Hook 1 (Critical path blocker) — extend or replace?

**Context:** Phase 1 STEP 3 hook 1 protects `firestore.rules`, `.env*`, `payments/`, `auth/`, `scripts/create-smoke-account.js`. Existing `gate-protected.sh` (Hook 4 per CLAUDE.md numbering) already covers `firestore.rules`, `.env*`, `scripts/.service-account.json`.

**Options:**
- **A.** Extend existing `gate-protected.sh` with the new patterns (`payments/`, `auth/`, `scripts/create-smoke-account.js`). Preserves history; one hook script instead of two; clearer audit trail. **(Recommended — Phase 1 inferred.)**
- **B.** Ship a separate `critical-path-blocker.sh` alongside `gate-protected.sh`. Pattern overlaps; risk of inconsistent updates; preserves "6 new hooks" naming literal.

**Phase 1 inferred:** Option A. Extending the existing hook is cheaper and clearer. Naming preserved as "Hook 1 — Critical path blocker (extends gate-protected.sh)" in `.claude/settings.json` comment.

**Founder decision needed:** ratify Option A or override to B.

---

## Q5 — CLAUDE.md update (currently 21 ships out of date)

**Context:** CLAUDE.md "Project State" line: "Version: v8.1.3 (as of 2026-04-22)". Actual: v8.22.0. CLAUDE.md missed all Ships 4a (8.13.x–8.16.x) + Ship 5+1 through 5+7 (8.17.0–8.22.0). CLAUDE.md also references "Three-Agent Workflow" (Zach/Claude.ai/Claude Code) which contradicts the new Orchestrator+Engineer+Critic structure.

**Options:**
- **A.** Update CLAUDE.md during Phase 1 — touch every stale section (Project State, Three-Agent Workflow, Page Shell variant count, etc.). Substantial copy effort.
- **B.** Defer to Wave 1 retrospective — let Founder author the rewrite. Phase 1 leaves CLAUDE.md as-is. Add a marker comment at top of CLAUDE.md noting "Project State stale — see docs/agents/ROADMAP.md for current."
- **C.** Defer indefinitely — governance docs in docs/agents/ supersede CLAUDE.md for agent operations; CLAUDE.md becomes historical context only.

**Phase 1 inferred:** Option B. Add a single banner at top of CLAUDE.md flagging staleness; Founder updates body at retrospective. Most files in docs/agents/ already serve as the authoritative replacement for the corresponding CLAUDE.md sections.

**Founder decision needed:** ratify Option B or override.

---

## Q6 — Tier 1 graduation: tracking metric specifics

**Context:** Per Correction 3, graduated autonomy starts at Tier 1 at Phase 1 commit. `GRADUATED_AUTONOMY.md:13` describes the threshold as "95% match accuracy over the minimum ship count for a category." Tier 1 ships count starts at zero today.

**Open:** does an inferred decision logged AT Phase 1 commit (e.g., the `tests/visual-verify/` path inference, the `SKILL_APPROVAL.md` format invention, the env-var ruling Option C) count toward Ship 5+8's tier-1 ship count? Or does the count start AT Ship 5+8?

**Phase 1 inferred:** Tier-1 tracking begins AT Ship 5+8 (first ship under new orchestration). Phase 1 setup itself is governance bootstrap, not a "ship" in the SHIP_PLAN sense — its inferred decisions are pre-tier-tracking. Logged for transparency in INFERRED_DECISIONS.md but the 10-ship countdown begins at Ship 5+8.

**Founder decision needed:** ratify or override; matters for first graduation eligibility date.

---

## Q7 — Founder push override mechanism

**Context:** Post-Correction-1 CTO_INTERFACE.md (Phase 1 STEP 0 edits) says "Founder push override remains available". Mechanism not fully specified. Hook 6 (Push protection) blocks `git push` when smoke/lint/visual verification has FAILED — implies green-OR-unverified-state allows push.

**Reading proposed by Critic:**
- Hook 6 reads `.claude/state/last-verify.json`. State file structure: `{smoke: {pass: bool}, lint: {pass: bool}, visual: {pass: bool}, timestamp: ISO}`.
- If state file missing OR any field is `false` AND last run was within 24h: BLOCK.
- If state file missing AND no agent has run smoke recently: ALLOW (governance-only/doc-only commit case, including this Phase 1 commit).
- Founder shell-direct `git push` doesn't traverse Claude Code hooks → always works.

**Phase 1 inferred:** the above semantics. Hook script will implement.

**Founder decision needed:** ratify hook semantics or override.

---

## Phase 1 disposition

None of Q1–Q7 block Phase 1 setup commit + autonomous push. All decidable at morning retrospective. Phase 1 proceeds with the listed inferred options; reversals adjust subsequent work.

---

## Q8 — Vision authoring missing for W1.I4, W1.S3, W1.S1 (TRUE BLOCKER)

**Captured:** 2026-05-12 (post-Phase 1, ~5h after Phase 1 commit `5ef9833` landed)

**Context:** Founder issued an 8-hour autonomous run window for 3 ships:
- W1.I4 (staging environment)
- W1.S3 (Members + Find Players)
- W1.S1 (Design system codification)

The directive said "Vision authored above" for each. No Vision content present in the conversation. Verified state:

| Ship | Ship Plan file | Vision content |
|---|---|---|
| W1.I4 | `docs/agents/ships/W1.I4.md` (exists; drafted Phase 1) | placeholder `<Vision — Founder authors before engineering begins>` |
| W1.S3 | not yet drafted | not present (no ship plan file) |
| W1.S1 | not yet drafted | not present (no ship plan file) |

**Per just-shipped governance** (commit `5ef9833`):

- `GRADUATED_AUTONOMY.md` lists "Vision section content — Founder authority on every ship, forever" as permanent-Founder-approval; NEVER graduates regardless of tier
- `CTO_INTERFACE.md` lists Vision authoring as Founder authority (permanent)
- `ORCHESTRATOR.md`: "Solicit Vision from Founder before any engineering work begins"
- `SHIP_PLAN_TEMPLATE.md` Vision section: "Authored by Founder before agent work begins. Agents do not modify this section."
- The Phase 1 directive itself: "DO NOT fire Ship 5+8 yet (Vision required). Stand by for Founder to author Wave 1 Visions in the morning."

**Decision rule applied:** the 8-hour autonomous run directive includes the exit condition *"OR until permanent-Founder-approval blocker"*. Vision authoring IS the first permanent-approval category. Halting engineering work for all 3 ships per directive.

**What was done in the autonomous window despite the blocker:**

Orchestrator prep work that does NOT require Vision:
- Drafted `docs/agents/ships/W1.S3.md` with placeholder Vision (Members + Find Players scope per ROADMAP.md + V11 audit findings from prior session preserved)
- Drafted `docs/agents/ships/W1.S1.md` with placeholder Vision (Design system codification scope per CLUBHOUSE_SPEC Part 1 + wave-2a-ratification)
- All 3 ship plans now sit in `Drafting` status, awaiting Founder Vision authoring → Ratified → Engineering fires

**Possible Founder readings of "Vision authored above":**

A. The directive intends roadmap one-line descriptions to serve as Vision. **Not the contract** — Vision per template is "what does success look like to members, why is this worth doing now"; roadmap entries are scope-only.
B. Founder expects Orchestrator to author Vision under autonomous mode. **Direct contradiction with permanent-approval rule shipped 5h ago.** No agent action without explicit Founder override of the rule.
C. Founder believes Vision was authored in a prior unseen prompt. **Likeliest. Resolution: Founder authors Vision in the morning per Phase 1 close-out plan.**

**Recommendation:** Founder authors Vision section in each of the 3 Ship Plans (now drafted with placeholders). Once Vision lands, Critic pre-engineering review fires, then Engineer + Critic + autonomous push as directed for each ship in order.

**Founder decision needed:** author Visions, OR explicitly override the permanent-approval rule with documented rationale (governance demotion of "Vision = permanent" would itself be a Roadmap-level decision and require explicit ratification).
