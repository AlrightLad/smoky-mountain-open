# Inferred Decisions Log

Append-only log of decisions made by the orchestration team under graduated autonomy without explicit Founder pre-approval. Each entry tracks the inference, the tier classification, the rationale (which prior Founder-pattern this matched), and the Founder ruling at retrospective.

## Purpose

This log keeps inferred decisions accountable. Three uses:

1. **Audit trail** — every operational decision the team made on Founder's behalf is recorded
2. **Pattern recognition feedback** — when Founder reverses an inference, the team learns
3. **Graduation tracking** — match accuracy per category drives graduated autonomy progression per GRADUATED_AUTONOMY.md

## How entries get added

Per P6 (Inferred decision protocol):

When the Engineer or Orchestrator makes an inferred decision within the current graduated autonomy tier, an entry is appended here. The decision is also surfaced in the ship's own Inferred Decisions section in `docs/agents/ships/<ship-id>.md`.

Decisions outside the current tier or in permanent-Founder-approval territory do NOT get inferred — they escalate per P2.

## Entry format

```markdown
## <Ship ID> — <Date>

### Decision: <Short description>

**Tier:** <T1 | T2 | T3>
**Made by:** <Orchestrator | Engineer>
**Context:** <Where in ship work this came up>

**Inference:** <What we decided>

**Pattern match:** <Which prior Founder-pattern this matched. Cite ship IDs or decision logs where possible.>

**Founder ruling at retrospective:** <Pending | Ratify | Reverse | Defer>

**Notes:** <Optional. Reversal rationale, pattern adjustment, etc.>
```

## Match accuracy tracking

At each retrospective, Orchestrator updates this section:

### Tier 1 categories

| Category | Inferences made | Ratified | Reversed | Deferred | Match accuracy |
|---|---|---|---|---|---|
| Skill triggering false-positive fixes | 0 | 0 | 0 | 0 | — |
| Skill content drafting | 0 | 0 | 0 | 0 | — |
| Backlog severity tagging | 0 | 0 | 0 | 0 | — |
| Phase report formatting | 0 | 0 | 0 | 0 | — |
| Caddy Notes member-relevance classification | 0 | 0 | 0 | 0 | — |

### Tier 2 categories

| Category | Inferences made | Ratified | Reversed | Deferred | Match accuracy |
|---|---|---|---|---|---|
| Skill modifications | 0 | 0 | 0 | 0 | — |
| Hook false-positive adjustments | 0 | 0 | 0 | 0 | — |
| Ship plan phase-breakdown decisions | 0 | 0 | 0 | 0 | — |
| Member-facing Caddy Notes copy | 0 | 0 | 0 | 0 | — |
| Member-facing roadmap section drafting | 0 | 0 | 0 | 0 | — |

### Tier 3 categories

| Category | Inferences made | Ratified | Reversed | Deferred | Match accuracy |
|---|---|---|---|---|---|
| Hook scope additions | 0 | 0 | 0 | 0 | — |
| New skill drafting + commit | 0 | 0 | 0 | 0 | — |
| Engineer-Critic dispute resolution | 0 | 0 | 0 | 0 | — |
| Ship plan CTO Ruling (non-CFR) | 0 | 0 | 0 | 0 | — |

## Current tier state

Per Correction 3 (Phase 1 commit): **Tier 1 is active** at Phase 1 commit. Tier 1 categories operate under autonomous-by-default mode; agents infer using Founder-pattern conventions; Founder reviews log at retrospective. Tier 2 and Tier 3 categories still require Founder pre-approval until they graduate via the 95%-match threshold.

Tier 1 categories active:
- Skill triggering false-positive fixes
- Skill content drafting (initial drafts; commit gated by SKILL_APPROVAL.md token)
- Backlog severity tagging
- Phase report formatting
- Member-relevance classification for Caddy Notes

Tier 2 first graduation eligibility: 20 ships under new orchestration with sustained 95% match accuracy on Tier 1 decisions. Earliest forecast: Ship 28 (5+8 + 20).

Tracking begins at first ship under new orchestration (Ship 5+8). Phase 1 setup itself is governance bootstrap, not a tracked ship — its inferred decisions are pre-tier-tracking and logged for transparency only (see Phase 1 entries below).

---

## Phase 1 setup — inferred decisions (pre-tier-tracking)

These decisions were made during overnight Phase 1 autonomous execution. Logged for Founder retrospective transparency; do NOT count toward Tier 1 graduation accuracy (governance bootstrap is not a tracked ship).

### Decision: Visual verification artifact storage path

**Tier:** Phase 1 bootstrap (pre-tier)
**Made by:** Engineer (audit) + Orchestrator (Phase 1 setup)
**Context:** Correction 2 mandates committed screenshots; `tests/smoke/output/` is gitignored

**Inference:** New committed path `tests/visual-verify/<ship-id>/`. Engineer copies relevant subset from smoke output at ship close.

**Pattern match:** Free-tier-first + reversible-default. Alternatives (remove gitignore from smoke output, or Firebase Storage bucket) either bloat repo or trigger CFR Category 11. Documented in PHASE_1_FOUNDER_REVIEW.md Q2.

**Founder ruling at retrospective:** Pending

### Decision: `SKILL_APPROVAL.md` token format

**Tier:** Phase 1 bootstrap (pre-tier)
**Made by:** Orchestrator (Phase 1 setup)
**Context:** Hook 5 (Approval-gated paths) requires SKILL_APPROVAL.md token, format undefined in governance

**Inference:** Per-skill sidecar markdown file (`<skill-name>.APPROVAL.md`) alongside the skill file in `.claude/skills/`. Contents: timestamp, ratifier (Founder name or "AUTO-PHASE-1"), tier inferred under, rationale.

**Pattern match:** Minimal viable contract. Phase 1 auto-generates tokens for all 10 skills with ratifier "AUTO-PHASE-1" + rationale "Phase 1 STEP 2 autonomous mode". Founder reviews + ratifies (or reverses) at retrospective.

**Founder ruling at retrospective:** Pending

### Decision: `CLAUDE_EXPERIMENTAL_AGENT_TEAMS` env var — Founder sets manually

**Tier:** Phase 1 bootstrap (pre-tier)
**Made by:** Orchestrator (Phase 1 setup, STEP 6)
**Context:** Flag not set in current shell session; persistent set affects all Claude Code sessions on machine

**Inference:** Agent does NOT modify Founder's machine environment variables autonomously. Document need; Founder sets manually at morning.

**Pattern match:** Founder protection (Sanity Halt category 7) + single-machine constraint discipline. Agent does not silently modify host environment.

**Founder ruling at retrospective:** Pending

### Decision: Hook 1 (Critical path blocker) extends `gate-protected.sh`

**Tier:** Phase 1 bootstrap (pre-tier)
**Made by:** Engineer (audit DRIFT-3 + Adj-3) + Orchestrator (STEP 3)
**Context:** Existing `gate-protected.sh` covers 3 patterns; STEP 3 hook 1 needs 5 patterns; overlap

**Inference:** Extend existing hook rather than ship parallel hook. Adds `payments/`, `auth/`, `scripts/create-smoke-account.js` to existing patterns. Preserves history; one hook script; clearer audit trail.

**Pattern match:** No-orphan-pattern + clear-history. Documented in PHASE_1_FOUNDER_REVIEW.md Q4.

**Founder ruling at retrospective:** Pending

### Decision: `tests/visual-verify/` directory NOT pre-created in Phase 1

**Tier:** Phase 1 bootstrap (pre-tier)
**Made by:** Engineer (Phase 1 setup)
**Context:** Visual verification path inferred (Q2), but no Phase 1 work uses it

**Inference:** Create directory at first Wave-1 ship that produces screenshots (Ship 5+8 or later). Don't pre-create empty directories.

**Pattern match:** YAGNI / no-empty-scaffolding.

**Founder ruling at retrospective:** Pending

---

---

## Log entries (Tier-tracked, starting Ship 5+8)

(Entries appended below as inferences are made starting Ship 5+8. Initial state: empty. Phase 1 setup inferences logged above in the dedicated Phase 1 section, NOT here, because they are pre-tier-tracking.)
