# Founder decision — ECC vs PARBAUGHS hook adoption
**Date prepared:** 2026-05-18
**Prepared by:** Claude Code (Engineer/QA)
**Pair document (full detail):** `.claude/state/dashboard-audit-2026-05-18/HOOK-COMPARISON.md`
**Status:** AWAITING FOUNDER APPROVAL — no installations happen until you check boxes below.

---

## Context (what's at stake)

You ratified Phase 0 of the dashboard completion spec, which staged the ECC plugin (28 hooks) alongside PARBAUGHS's existing 11 hooks. Your decision was: "PARBAUGHS hooks 1-5 stay binding throughout. No replacement." This document is the head-to-head review you authorized — it identifies the small number of ECC hooks that fill real gaps in PARBAUGHS (and confirms the larger number that either conflict, overlap, or are irrelevant). Nothing is installed yet. You approve or decline below; only then does anything change.

The four PARBAUGHS hooks that remain binding regardless of your decision here:
- Hook 1: lint gate on commit
- Hook 2: syntax check after every edit
- Hook 3: assertions.js gate (test-mask prevention)
- Hook 4: protected-file gate (.env, firestore.rules, payments/, auth/)
- Hook 5: version-sync on commit

Plus hooks 6-11 (secrets-scanner, schema-mutation-alarm, governance-protection, skill-approval-gate, push-protection, Husky pre-commit). All remain binding.

---

## The 4 GAP-FILL recommendations (plain English)

**Recommendation 1 — MCP health-check.** When the agent calls an MCP server (Playwright, Bookstack, Fireflies, Microsoft 365), this hook probes that the server is alive first. If it's down, returning a 401, or rate-limited, the agent gets a clear error instead of stalling silently. Caches the result for 2 minutes per server so it's not banging on them. Pairs with a failure handler that marks dead servers and tries to reconnect.

`[ ] Approve  /  [ ] Decline` — Recommendation 1: MCP health-check

**Recommendation 2 — Design-quality check on frontend edits.** After editing any frontend file (.css, .html, .jsx, .tsx, .svelte, .vue, .scss), this hook scans for generic-AI-template markers: "Get Started" copy, stock gradients, default centered layouts, default fonts, uniform 3-column grids. Prints a checklist nudging toward visual hierarchy, depth, intentional spacing. Non-blocking — just an early warning so we don't compound generic-looking choices toward your P7 ≥9.5/10 design bar. (Tailwind-specific patterns may misfire on Clubhouse-tokens code; we'd watch false-positive rate for one week.)

`[ ] Approve  /  [ ] Decline` — Recommendation 2: Design-quality check

**Recommendation 3 — Console.log warning after edit.** After editing a .js/.jsx/.ts/.tsx file, this hook scans for any `console.log` calls and warns immediately with line numbers. Your code-review checklist already says "no console.log statements" and ESLint catches it at commit — this hook just surfaces the issue 30 seconds earlier so the agent doesn't have to bounce off the lint gate. If we approve this, we also disable ECC's redundant Stop-time version of the same scan.

`[ ] Approve  /  [ ] Decline` — Recommendation 3: Console.log edit-time warning

**Recommendation 4 — Cost/token tracker at Stop (CONDITIONAL).** At the end of every response, this hook reads the session transcript, totals tokens used (input, output, cache-write, cache-read), applies per-model billing rates (haiku/sonnet/opus), and appends one row per response to `~/.claude/metrics/costs.jsonl`. Your dashboard spec Phase T is the token-meter ship — the spec literally says "takes patterns from ECC's `ecc_dashboard.py`". This hook is the source of those patterns. Open question: enable it now to start gathering data, or defer until Phase T author owns the surface? My recommendation: **defer to Phase T**. List it here for your visibility.

`[ ] Approve  /  [ ] Decline  /  [ ] Defer to Phase T` — Recommendation 4: Cost tracker

---

## Confirmed-disable summary (these stay off regardless)

Per the coexistence policy you already ratified, four ECC hooks are explicitly disabled at activation. No action needed from you — they're already in the policy file:

1. **`pre:edit-write:gateguard-fact-force`** — Blocks the first edit to every file demanding a manual investigation quote. Incompatible with rapid iteration; you already authorized the agent to investigate before editing per V2/V3.
2. **`pre:bash:dispatcher`** — Duplicates PARBAUGHS's pre-commit-lint, version-sync, and push-protection. Two dispatchers create conflicting verdicts.
3. **`pre:config-protection`** — Blocks edits to `.eslintrc`, `.prettierrc`, `tsconfig.json`. We need to edit `.claude/settings.local.json` and similar for normal tuning.
4. **`stop:format-typecheck`** — Runs Biome+tsc on every JS/TS edit at Stop with a 300-second timeout. We use ESLint via pre-commit-lint (faster, already set up). Saves up to 5 minutes per Stop on big sessions.

Secondary auto-disables (follow from above):
- `post:edit:accumulator` — orphaned without `stop:format-typecheck` consuming its output.
- `stop:check-console-log` — redundant with Recommendation 3 if you approve it.

---

## What the comparison found at a glance

| Category | Count |
|---|---|
| PARBAUGHS hooks (stay binding) | 11 |
| ECC hooks total | 28 |
| ECC hooks recommended for adoption (GAP-FILL) | 3 firm + 1 conditional (Recommendation 4) |
| ECC hooks explicitly disabled | 4 |
| ECC hooks opt-in only (off by default, no action) | 4 (governance-capture pre/post, observe-runner pre/post) |
| ECC hooks harmless on-by-default (no action) | the remainder |

Full per-hook detail in the pair document.

---

## Sign-off

Once you've ticked your approvals/declines above, fill in the timestamp below. The agent only installs the approved hooks AFTER this field has a real UTC timestamp.

`FOUNDER-APPROVED-HOOK-INSTALL-{TIMESTAMP}` — replace `{TIMESTAMP}` with the UTC ISO time when you sign.

Optional Founder note (free-form):

```
(your note here)
```

---

**NO installations happen until Founder approves in writing.** The agent will check this file at the start of the next session and only act on approved checkboxes.
