---
id: AMD-028
title: 9-bubble quorum tightening + side-by-side V1 first + Founder sign-off cap
target_canonical_path: CLAUDE.md
source_draft_path: .claude/state/dashboard-audit-2026-05-18/CRITIQUE-LOOP-2026-05-19.md
scope_summary: 9-bubble deliberation gate tightened from 3-of-9 (33%) to 5-of-9 ship / 7-of-9 excellence. Per-bubble veto on Security + Data Truthfulness + Actionability. Agent self-rating capped at 9.4 — any ≥ 9.5 claim requires Founder visual sign-off. Side-by-side V1 vs peer reference is the mandatory FIRST iteration step for any visual-parity claim. Closes the "score self-assessed too high → Founder corrected" pattern that surfaced 6 times across sessions 1-4.
type: process-amendment
section_anchor: P7
depends_on:
  - AMD-017
  - AMD-026
authored_by: agent-engineering-autonomous
authored_at: 2026-05-20T05:30:00Z
bubble_of_record: null
estimate_tokens_to_apply: 500
rollback_strategy: Restore prior P7 wording in CLAUDE.md; revert quorum text in this amendment. 9-bubble structure (AMD-026) remains in place either way.
status: applied
operating_status: ACTIVE — auto-applied 2026-05-20 per Founder blanket authorization "make best decision for scalability, open source, and most effective for our use case" + Founder mandate "do not return until all is cleaned up".
---

# AMD-028 — Quorum tightening + V1-first + Founder sign-off cap

## Rationale

ECC critique loop on 12 major decisions surfaced 47 gaps + 6 instances of the pattern: **agent self-assesses 9.5/10 → Founder corrects to "not sellable"**. The pattern's root cause: 3-of-9 quorum is a rubber-stamp because 3 bubbles can pass while 6 silently abstain. Combined with self-rated scoring, the team systematically over-claimed quality.

Examples from sessions 1-4:
- M5.8: 9.5/10 quorum-approved → Founder "doesn't match the video" → reckoned to 9.0
- Dashboard polish session 4: 9.5/10 quorum-approved → Founder "still not sellable" → 7 more iteration cycles to hit honest 9.5
- Verification Packet emit: agent confidently emitted post-Gate-2 → Founder identified Working Tree + 2 dep vulns

This amendment closes the loop.

## Changes

### 1. Quorum tightening (was: 3-of-9; now: 5-of-9 ship / 7-of-9 excellence)

- **Ship-quality (functional + clean):** 5-of-9 bubbles must score ≥ 7.5
- **Excellence claim (≥ 9.5/10):** 7-of-9 bubbles must score ≥ 9.5
- **Per-bubble veto** on Security, Data Truthfulness, Actionability — any single reject blocks ship-close regardless of other scores

### 2. Agent self-rating cap at 9.4

- Any agent self-assessing dimensional score > 9.4 must FLAG for Founder visual sign-off
- Agent writes its honest assessment (e.g., "estimated 9.3 — capped at 9.4 per AMD-028; if visually ≥ 9.5 please sign off")
- Founder either: (a) writes `FOUNDER-VISUAL-SIGNOFF-{score}-{TS}` in the retrospective, OR (b) redirects with "iterate further"
- Closes the false-positive self-success pattern

### 3. Side-by-side V1 mandatory first iteration

- For any visual-parity claim (e.g., "main-flows matches Janowiak"), the FIRST iteration step is a side-by-side capture (peer reference + current PARBAUGHS, both Read'd via PNG)
- Documented BEFORE any code changes are made
- Subsequent iterations measure progress against the same baseline
- Replaces the "iterate-then-verify" pattern that led to M5.8 false-positive

### 4. Anti-pattern explicit reject conditions

The 9-bubble deliberation gate now explicitly rejects on:
- Critic: "score self-assessed; no peer-reference comparison documented"
- Taste: "no side-by-side V1 captured this iteration cycle"
- Research Depth: "fewer than 2 peer references consulted for this surface"
- Actionability: "Founder cannot answer WHAT/WHERE/WHAT-ACTION without click"

## Operational impact

- All future visual-parity ships start with side-by-side V1 capture in iteration 1
- Agents cap their self-rating at 9.4 (forces Founder to assess the 9.5 threshold)
- Quorum text in deliberation transcripts must list per-bubble scores (no aggregate "9 of 9 PASS" without individual numbers)
- Critique-loop discipline now part of every ship-close (not just goal-close retrospectives)

## Rollback path

Restore prior P7 wording in CLAUDE.md; revert this amendment file. 9-bubble structure (AMD-026) stays in place. The substrate continues to function with looser quorum if Founder requests rollback.

## Status

Applied 2026-05-20 per Founder blanket authorization for engineering improvements.
