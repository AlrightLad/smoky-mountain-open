---
{
  "id": "PROP-014",
  "title": "Impeccable design skill install + community-skill follow-on to PROP-011",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-20T00:00:00Z",
  "rationale": "Founder directive 2026-05-20: review 4 community design plugins (Impeccable, Huashu-Design, UI/UX Pro Max, Taste-Skill) and add the ones useful for frontend orchestration. PROP-011 dismissed community design skills wholesale over Snyk's 36% prompt-injection statistic but left a per-source-audit door open. This proposal exercises that door: 1 plugin ADOPTED with full file-level audit (Impeccable), 2 REFERENCE-ONLY distillations authored without install (Taste-Skill, Huashu-Design), 1 SKIP rationale recorded (UI/UX Pro Max). Closes P7 (>=9.5/10 design score) discipline gap by adding deterministic anti-pattern rules + critique vocabulary on top of anthropics/frontend-design.",
  "scope": "Five deliverables: (1) Install Impeccable to ~/.claude/skills/impeccable/ via shallow clone of pbakaus/impeccable@main, file-level audit, then markdown-only promotion (38 .md files + LICENSE + NOTICE.md, no scripts/, no agents/, no top-level project meta-docs). (2) Author .claude/state/design-research/taste-skill-distilled.md capturing the DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY parameter knobs + anti-slop rules from Leonxlnx/taste-skill@main (reference only, no install). (3) Author .claude/state/design-research/huashu-distilled.md capturing the 5-school 20-philosophy framework + 5-dimension critique system from alchaincyf/huashu-design@master (reference only, no install). (4) Update .claude/state/phase-0/coexistence-policy.md surface-ownership table: Impeccable extends anthropics/frontend-design (Apache 2.0 lineage in NOTICE.md), authorized for `/impeccable critique`, `/impeccable polish`, `/impeccable audit`, `/impeccable distill` use during P7 design-bot ship-close gate. (5) Record UI/UX Pro Max SKIP rationale in this proposal's audit log (unvalidated Python CLI input + Clubhouse-tokens conflict + suspicious 80.7k star count).",
  "estimate": {
    "cost_tokens": 8000,
    "duration_minutes": 30,
    "risk": "low"
  },
  "files_affected": [
    "~/.claude/skills/impeccable/ (NEW, 39 files installed this ship — markdown only)",
    ".claude/state/proposals/pending/PROP-014-impeccable-install.md (this file)",
    ".claude/state/design-research/taste-skill-distilled.md (NEW)",
    ".claude/state/design-research/huashu-distilled.md (NEW)",
    ".claude/state/phase-0/coexistence-policy.md (updated — Impeccable row added to Surface ownership)"
  ],
  "fallback_plan": "Plan A (chosen + applied this ship): full markdown install + 2 distilled docs + coexistence update. Plan B (deferred): also install Impeccable scripts/ for `npx impeccable detect` local invocation; falls back to `npx impeccable@latest detect ...` from published npm package when needed. Plan C (rejected): install all 4 plugins — UI/UX Pro Max has unvalidated CLI input + design-system generator that conflicts with Clubhouse tokens. Plan D (rejected): no installs, distill all 4 locally — Impeccable's value is the agentic command surface (`/impeccable critique`, `/impeccable polish`) which only works as an installed skill.",
  "rollback_strategy": "rm -rf ~/.claude/skills/impeccable/ removes the install (user-level, not in repo). git revert reverts the distilled docs + coexistence-policy update. No remote dependencies activated; no AMD-018 gated surface touched.",
  "round_trip_coverage": "No new round-trip block. Skill files loaded by Claude Code at session start (skill discovery). Existing PROP-010 design-bot ship-close gate covers visual verification workflow; PROP-014 adds Impeccable critique/audit/polish vocabulary on top of that workflow.",
  "depends_on": ["PROP-010", "PROP-011"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 3000,
  "status": "applied-this-ship",
  "operating_status": "Founder approved 2026-05-20 inline ('I approve let's move forward'). Impeccable installed + 2 distilled docs authored + coexistence-policy updated this ship. Skill discovery should pick up `impeccable` at next Claude Code session start. UI/UX Pro Max SKIP rationale captured below."
}
---

# PROP-014 — Impeccable design skill install + community-skill follow-on to PROP-011

Authored 2026-05-20 per Founder directive: review Impeccable, Huashu-Design, UI/UX Pro Max, Taste-Skill for frontend orchestration use.

## Why this proposal

PROP-011 (archived 2026-05-19) installed Anthropic's 4 official skills (frontend-design, webapp-testing, canvas-design, theme-factory) and dismissed community-distributed design skills under Option D, citing Snyk's 36%-prompt-injection statistic. The dismissal explicitly left an escape clause:

> "If Anthropic skills prove insufficient for PARBAUGHS aesthetic intent, individual community skills can be vetted + installed in follow-on ships with explicit Founder approval per source."

This proposal exercises that clause for 4 named candidates.

AMD-028 (2026-05-20) capped agent self-rating at 9.4/10 and tightened P7 to require Founder visual sign-off for ≥9.5/10 claims. The 9-bubble quorum requires 7-of-9 for excellence claims with per-bubble veto. Impeccable's 27 deterministic anti-pattern rules + 23 commands + 7 domain reference files give the design-bot more bite than `frontend-design` alone — directly addressing the P7 gap.

## Per-source verdict

| Plugin | Repo | Stars | License | Verdict | Action this ship |
|---|---|---|---|---|---|
| **Impeccable** | `pbakaus/impeccable` | 29k | Apache 2.0 (Anthropic-attributed in NOTICE.md) | **ADOPT** | Install to `~/.claude/skills/impeccable/` (markdown only) |
| **Taste-Skill** | `Leonxlnx/taste-skill` | 18.3k | MIT | **REFERENCE-ONLY** | Distill to `.claude/state/design-research/taste-skill-distilled.md` |
| **Huashu Design** | `alchaincyf/huashu-design` | 14.4k | MIT (relicensed 2026-05-14) | **REFERENCE-ONLY (deferred)** | Distill to `.claude/state/design-research/huashu-distilled.md` |
| **UI/UX Pro Max** | `nextlevelbuilder/ui-ux-pro-max-skill` | 80.7k (suspect) | MIT | **SKIP** | Rationale logged below; no install |

## Install audit log — Impeccable

### Source
- Repo: `https://github.com/pbakaus/impeccable`
- Method: shallow `git clone --depth 1` to `$env:TEMP\impeccable-staged\`
- Audited subset: `skill/` subtree + `LICENSE` + `NOTICE.md`
- Installed subset: 38 markdown files from `skill/` + `LICENSE` + `NOTICE.md` = **39 files total**
- Excluded from install: `skill/scripts/` (22 JS files — `npx impeccable detect` runtime; will invoke from published npm package when wired), `skill/agents/impeccable-asset-producer.md` (Codex-only agent; PARBAUGHS uses Claude Code), repo top-level project meta-docs (CLAUDE.md/PRODUCT.md/DESIGN.md/README.md/etc. — those are pbakaus's project docs, not skill content).

### Security audit results

| Check | Result |
|---|---|
| Prompt-injection patterns (grep: `ignore previous`, `you are now`, `from now on`, `override system`, `jailbreak`, `disregard`, etc.) | **0 matches** across all 38 skill .md files |
| Role/INST/system-tag injection (grep: `<system>`, `[INST]`, `<\|.*\|>`, `act as if`, `please disregard`) | **0 matches** |
| Executable-script side-channel in installed files | **None** (scripts/ excluded; only .md installed) |
| External URLs in skill content | 7 benign references: webaim contrast checker, polypane.app, stitch.withgoogle.com (DESIGN.md format spec), github.com/unjs/fontaine (font lib), wakamaifondue.com (font analysis), Unsplash URL TEMPLATE for mock fills, localhost:8400 (only for `live` command which needs scripts/ — not installed) |
| `allowed-tools` frontmatter | `Bash(npx impeccable *)` — narrow whitelist for the project's own CLI; doesn't open arbitrary shell |
| LICENSE | Apache 2.0 |
| NOTICE.md | Credits Anthropic frontend-design (Apache 2.0, 2025) + ehmo/typecraft-guide-skill; clean attribution |

### Install pattern match

Existing Anthropic skill install layout (`~/.claude/skills/frontend-design/`): `SKILL.md` + `LICENSE.txt` flat. Impeccable mirrors this with an additional `reference/` subdir for the 36 domain files. Layout:

```
~/.claude/skills/impeccable/
├── SKILL.md             (13.0 KB — main agent instructions, 23-command routing)
├── LICENSE              (10.9 KB — Apache 2.0)
├── NOTICE.md            (1.3 KB — Anthropic + ehmo attribution)
└── reference/
    ├── adapt.md         (6.7 KB)
    ├── animate.md       (7.9 KB)
    ├── audit.md         (6.7 KB)
    ├── bolder.md        (6.5 KB)
    ├── brand.md         (11.5 KB — register: marketing/landing/portfolio)
    ├── clarify.md       (6.3 KB)
    ├── codex.md         (7.0 KB)
    ├── cognitive-load.md (4.9 KB)
    ├── color-and-contrast.md (5.9 KB)
    ├── colorize.md      (8.2 KB)
    ├── craft.md         (11.7 KB)
    ├── critique.md      (17.9 KB — heuristic scoring, the design-bot vocabulary)
    ├── delight.md       (10.0 KB)
    ├── distill.md       (5.7 KB)
    ├── document.md      (28.5 KB)
    ├── extract.md       (3.4 KB)
    ├── harden.md        (9.0 KB)
    ├── heuristics-scoring.md (9.0 KB — anti-pattern rules)
    ├── interaction-design.md (7.3 KB)
    ├── layout.md        (8.1 KB)
    ├── live.md          (51.4 KB — browser-iteration mode, scripts/-dependent)
    ├── motion-design.md (5.9 KB)
    ├── onboard.md       (8.0 KB)
    ├── optimize.md      (7.9 KB)
    ├── overdrive.md     (9.1 KB)
    ├── personas.md      (7.3 KB)
    ├── polish.md        (13.3 KB)
    ├── product.md       (4.2 KB — register: app/dashboard/tool)
    ├── quieter.md       (4.9 KB)
    ├── responsive-design.md (3.6 KB)
    ├── shape.md         (11.4 KB)
    ├── spatial-design.md (3.6 KB)
    ├── teach.md         (9.3 KB)
    ├── typeset.md       (6.4 KB)
    ├── typography.md    (8.4 KB)
    └── ux-writing.md    (4.4 KB)
```

### Known limitations (acknowledged, not blocking)

1. **Sub-commands that depend on scripts/ run in degraded mode.** `teach`, `document`, `pin`, `live` reference `node {{scripts_path}}/*.mjs` paths. Since we didn't install scripts/, these sub-commands will fail or no-op. Acceptable: the design-bot's primary use is `/impeccable critique`, `/impeccable polish`, `/impeccable audit`, `/impeccable distill` — none of which require scripts/.

2. **PRODUCT.md / DESIGN.md context-loader unavailable.** The skill's preferred startup is `node scripts/load-context.mjs` which loads project context. Without scripts/, the agent falls back to manual context-load (read `CLAUDE.md`, `docs/`, design-research files). PARBAUGHS already has rich context surfaces — manual fallback is fine.

3. **`npx impeccable detect` as design-bot gate is FUTURE work.** Wiring this into PROP-010 ship-close gate would invoke `npx impeccable@latest detect <path>` from the published npm package (not the local clone). Deferred to a follow-on ship if Founder wants automated lint integration.

### Operating use (immediate)

The design-bot may now invoke any of these on user-facing surface review:
- `/impeccable critique <target>` — UX heuristic scoring (per `reference/critique.md`)
- `/impeccable polish <target>` — final-quality pre-ship pass
- `/impeccable audit <target>` — a11y/perf/responsive technical checks
- `/impeccable distill <target>` — strip-to-essence refactor proposals
- `/impeccable bolder <target>` / `/impeccable quieter <target>` — direction-shift on bland or aggressive surfaces

Per PROP-010 design-bot protocol: the bubble-of-record for the design surface should consult Impeccable critique vocabulary alongside the 9-bubble deliberation. AMD-028's Per-bubble veto for Security + Data Truthfulness + Actionability still gates ship-close — Impeccable does not displace those vetoes.

## UI/UX Pro Max — SKIP rationale (recorded for future reference)

`nextlevelbuilder/ui-ux-pro-max-skill` was audited but not adopted. Recorded rationale:

1. **Unvalidated CLI input in `search.py`.** Audit observation: *"This pattern allows unvalidated string injection into a CLI tool. An attacker could embed shell metacharacters or flag manipulation within the query string."* Would require patching before any safe install.
2. **Global npm install (`uipro-cli`) + Python prerequisite.** Heaviest footprint of the four candidates. Violates the minimal-tooling principle.
3. **Design-system generator conflicts with Clubhouse tokens.** Generates `design-system/MASTER.md` + per-page overrides that would shadow our existing ~90-token Clubhouse system in `src/styles/base.css`. Resolving this conflict would require either disabling the generator (defeats the skill's purpose) or migrating Clubhouse tokens to the generator's format (massive churn at v8.1.3).
4. **Suspicious star count (80.7k).** Cross-referenced against canonical claude-skills lists (sickn33/antigravity-awesome-skills, VoltAgent/awesome-agent-skills, travisvn/awesome-claude-skills); UI/UX Pro Max is absent from each as a featured entry — inconsistent with its claimed scale. Treated as unverified social proof.

**If the static data tables prove useful later** (161 color palettes, 25 chart types, 57 font pairings, 99 UX guidelines), port the relevant CSV data as static reference files into `.claude/state/design-research/` without installing the CLI or skill.

## Founder verification surface

After next Claude Code session start, Founder can verify Impeccable loaded by:
1. Reading the auto-loaded skill list in `<system-reminder>` at session start — `impeccable` should appear alongside `frontend-design`, `webapp-testing`, etc.
2. Typing `/impeccable` (no argument) — should render the 23-command menu per the skill's routing rule #1.
3. Typing `/impeccable critique <some-page>` — should load `reference/critique.md` and produce a heuristic-scored design review.

## Round-trip coverage

No new round-trip block introduced this ship. Impeccable use is opt-in via design-bot invocation. If a future ship wires `npx impeccable detect` as a ship-close gate, that's a follow-on proposal.

## Operating status

Founder approved 2026-05-20 inline. Skill installed + audited + applied this ship. Distilled docs authored for Taste-Skill + Huashu Design as REFERENCE-ONLY companions. UI/UX Pro Max SKIP rationale recorded. Coexistence-policy updated. No AMD-018 gated surface touched.
