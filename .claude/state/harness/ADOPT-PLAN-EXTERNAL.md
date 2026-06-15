# Adopt-Plan — Loop Engineering, Skills & Anti-Slop (external best-practices)

> Companion to UPGRADE-PLAN.md. From a 5-agent research pass on Claude-power-user loop
> craft + Fortune-500 AI brand governance (30 sourced findings). THE THROUGH-LINE:
> **the doer cannot be the judge, and the brand cannot live in memory.** Our two
> recurring failures (false-stops; off-brand slop) are ONE bug — a self-grading loop
> rationalizing its own output. Fix both with the SAME primitive: a separate verifier
> (different model / fresh subagent / locked reference) gating on objective criteria.

## LOOP/HARNESS upgrades
- **L1 ⭐ Two-model verification gate (doer≠judge):** Stop-hook dispatches a HAIKU verifier (Opus=doer) with the task DONE-WHEN + transcript + a NARROW objective prompt ("did named files change AND smoke exit 0 AND V1 capture exists?" — never "is it complete?"); `{ok:false,reason}` re-enters as next instruction. Our self-check is doer==judge = worthless.
- **L2 Layer-2 INTENT gate:** Stop-prompt hook re-reads the ORIGINAL ask → "were ALL requirements addressed?" — the structural fix for status-report-is-not-a-stop.
- **L3 `stop_hook_active` early-exit:** parse it; exit 0 if true (Claude force-overrides after 8 blocks) — protocol-correct guard alongside CB_LIMIT=30.
- **L4 ⭐ Structured opportunity queue:** every BACKLOG item = problem + proposed solution + evidence, atomic unambiguous pass/fail ("eyebrow contrast ≥4.5:1 on sand card", not "improve contrast"). A forever-loop without structured input drifts to model priors.
- **L5 Fresh-subagent-per-task:** context rot past ~100-150k tokens IS why the loop drifts; dispatch a fresh subagent per item (it builds exactly what it needs); NEXT_PROMPT.md = the deterministic self-orient file each iteration reads.
- **L6 git-worktree isolation per loop:** the hard fix for the concurrent-collision incident (two instances can't race prod pushes / corrupt BACKLOG lock).
- **L7 Evidence-before-claims (blocking):** no "done"/"fixed" without a captured pass/fail signal in context (smoke stdout / V1 PNG / rules exit); every ship attaches a V1 capture as the load-bearing artifact.
- **L8 Tiered auto-merge by change-type:** UI/decorative → auto; economy/data/rules/identity-art → gated (AMD-018). Idle-no-commits = a real stop condition.
- **L9 Compounding-memory AUDIT:** confirm the loop INJECTS recent-learnings into each iteration + reads them back; auto-append-on-error (gotcha → handoff note immediately).

## SKILLS to author (author NOW in order: brand-gate → visual-judge → stop-verifier)
Authoring discipline: description = "Use when…" TRIGGERS only, 3rd-person, ≤1024 chars (NOT a workflow summary — a process-summary description makes Claude act on the description instead of reading the body). Build RED-GREEN-REFACTOR (capture a real failure transcript under `.claude/state/skill-evals/` as baseline) + a rationalization table. SKILL.md <500 lines.
- **parbaughs-brand-gate ⭐ (NOW #1):** auto-fires on ANY asset/cosmetic/merch/page-art gen. Hard MUSTs (P+rose usage, palette hex table, rubber-hose×H&B lanes, tour-vs-leisure colorways) + DO/DON'T example-pair gallery + a LOW-FREEDOM scripted first step that injects BRAND-BRIEF + BRAND-RULES.json (can't skip). 5-pt QC incl. "would it look like PARBAUGHS WITHOUT the logo?". RED blocks ship, YELLOW=Founder taste. Folds in brand-translate (vague adjective → measurable directive).
- **parbaughs-visual-judge ⭐ (NOW #2):** MLLM-as-judge for assets — after `_finish-art.py`, Read the PNG, score vs FIXED rubric (palette-hex match / ink-weight / aged-paper / prohibited-absence / focal hierarchy / recognizable-without-logo) → PASS/FAIL + score + failing dim; FAIL auto-regens with critique in the negative prompt, capped N, BEFORE the Founder sees it. Cap 9.4 (AMD-028).
- **parbaughs-stop-verifier ⭐ (NOW #3):** the L1/L2 engine — Haiku verifier given DONE-WHEN + transcript → `{ok,reason}`; wired into the Stop hook.
- (soon) parbaughs-anti-slop (fresh-subagent adversarial CODE+DESIGN slop pass, diff+screenshots only), parbaughs-design-judge (page V1 0-1 per dim, ≥0.95).

## ANTI-SLOP / BRAND-CONSISTENCY system (so we NEVER ship slop)
Root cause (3 independent sources): we generate WITHOUT a locked style, from a text-only brief, with no visual anchor → the model reverts to its generic prior (the "Olympic-medal" crest = exactly this). Build:
1. **BRAND-RULES.json** sibling to BRAND-BRIEF.md — machine-readable: `palette_hex{}` + FORBIDDEN list, `rubber_hose_hallmarks[]`, `prohibitions[]`, aged-paper + ink-weight specs, P+rose-vs-rubber-hose register, tour-vs-leisure colorways. Always concatenated into the prompt preamble.
2. **Reference-image conditioning (the missing piece):** `.claude/state/design/refs/` (approved rubber-hose frames + canonical caddie portraits) + `.claude/state/design/body-of-work/` (8-12 shipped on-bar assets, each w/ a 1-line WHY annotation). Attach the 2-3 most relevant exemplars to EVERY gen.
3. **Locked Recraft Custom Styles, one per lane** (rubber-hose / tour-realistic / shop-cosmetic) built from the body-of-work + locked hex palette; store Style IDs in BRAND-RULES.json. Generate cosmetics as a matched SET, not one-offs.
4. **Global negative + semantic blocks** appended verbatim to EVERY gen: NEG = no generic stock cartoon / neon / HDR / drop-shadow clipart / anime / modern flat-vector / 3D-Pixar / Olympic-gold / default-centered / photoreal-where-cartoon. SEM = warm limited palette, off-white aged-paper, subtle halftone/grain, confident black ink weight, soft vintage-print lighting.
5. **Art-director prompt structure:** subject→style→composition→lighting→lens; 6-12 phrases; named specificity ("Rembrandt lighting" not "dramatic").
6. **Generate→audit→regenerate** = parbaughs-visual-judge (mechanical drift catch before any human).
7. **Risk-tiered Founder gate w/ AUTOMATIC escalation by asset-type:** LOW (bg textures) → self-verify + ship; HIGH (caddie portraits, logo treatments, default avatars, merch, shop cosmetics, onboarding hero) → mandatory Founder taste sign-off + logged provenance.

## SINGLE highest-leverage per category
- LOOP → L1 two-model Stop-hook verifier (Haiku judge).
- SKILLS → parbaughs-brand-gate (auto-firing, scripted brief-injection, ship-blocking).
- BRAND → locked Recraft Custom Style + reference-image conditioning (removes the generic prior at the SOURCE, not after).
