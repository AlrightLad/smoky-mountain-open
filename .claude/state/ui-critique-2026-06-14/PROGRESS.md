# UI 9.5 Critique Loop — Progress (#41) · 2026-06-14

Autonomous marathon (Founder "start autonomously", ultracode). Source of truth
for the fix queue: `critique-synthesis.json` (22-page workflow critique).

## Marathon phase order (Founder)
1. **Per-page 9.5 critique loop** ← ACTIVE
2. Merch photos (#68) — confirmed already good; review/polish pass, not regen
3. Swing rework (#67) + caddy-crew identity (#73): rename bot "The Caddy" → "The
   Caddies" + crew profile photo (composite the 4 caddies); swing LAST
4. Continuous critique loop throughout
5. Final QA gauntlet (#74): E2E all pages + data flows → pen test → resolve →
   health check

## Page scores (workflow baseline, low→high)
drills 6.0 · chat 6.4 · partygames 6.4 · courses 7.2 · bounties 7.2 · calendar 7.2
· profile 7.4 · standings 7.4 · trips 7.4 · challenges 7.4 · teetimes 7.4 · scramble
7.4 · trophyroom 7.4 · more 7.4 · settings 7.4 · records 7.4 · wrapped 7.4 · shop
7.8 · feed 8.2 · leagues 8.3 · wagers 8.4 · richlist 8.9 (the model page)

## Foundation shipped (v8.25.137)
- `.pb-card` (+ `--felt` / `--rail` / `--recessed`) — paper-stock material: top
  highlight + hairline border + layered shadow + faint fractal grain. THE fix for
  the #1 defect (flat materials). In components.css after `.ptr-indicator`.
- `.pb-btn-brass` — struck-metal CTA, dark-ink label clears AA, presses on :active.
- Use these to lift pages: felt hero = focal peak; rail rows = ledger; recessed = empty.

## TEAM-WIDE TOOLING (Founder 2026-06-14)
Orchestration/workflow subagents AND onboarding work are cleared to GENERATE
design assets via Vertex Imagen (`node scripts/_gen-vertex-art.mjs <name>
"<prompt>" "<ar>"`, ~$0.02/img) when hand-built CSS/SVG can't reach the 9.5 bar —
rather than ship sub-bar or declare blocked. Credit-cautious + rigorous prompts +
canonical Cuphead style for cartoon. WHEN AUTHORING WORKFLOW PROMPTS, tell the
subagents this tool exists. See [[feedback_gemini_cosmetics_credit_caution]].

## DONE this marathon
- v8.25.137 foundation + **drills** full rebuild (6.0 → ~9): serif masthead, felt
  Drill-of-the-Day hero, pb-card--rail rows + chips + scrollable brass tabs.
- v8.25.138 **partygames** (6.4 → ~9): felt focal hero fills dead zone, brass CTA,
  preview chips, legacy tokens migrated (fixed invisible --cream text).
- v8.25.139 **skeleton** app-wide: chalk shimmer not dark bars (chat 6.4 main cause).
- v8.25.140 **courses** (7.2 → ~9): pb-card rows, serif names, brass meta.
- v8.25.141 **global .card top-highlight** (27 page files lift) + **rubber-hose
  course-photo placeholder** (course-placeholder.jpg, detail banner + monogram chip;
  list keeps monograms; multi-photo carousel already exists, --gold→brass).

## NEW FOUNDER ITEMS (added during marathon)
- **#75 Level-100 rubber-hose THEME (END of marathon)** — an exclusive reward
  theme unlocked at level 100, VASTLY different from the existing 6 themes:
  on-page cartoons + animations, rubber-hose/Cuphead register, far more advanced
  and animated than any current theme — a real "you made it" exclusive brand
  moment. Needs extensive critique looping. Use Gemini for cartoon/animation
  assets as needed. Theme system lives in src/core/theme.js + base.css theme
  blocks ([data-theme="…"]); unlock gating ties to level (profile level 100).

## NEXT (in priority order from synthesis)
- courses (7.2): home/most-played course → editorial hero card; body serif (was
  system-sans); pb-card rows.
- bounties (7.2): big brass bullseye artifact; kill duplicate CTAs; pb-card; contrast.
- calendar (7.2): promote logged round to felt record-chip; fix TODAY cell; data truth.
- Cross-cutting (apply broadly): duplicate-CTA count-gate (wagers/scramble/bounties/
  standings); empty-state centering helper; hero-promotion pattern; WCAG-AA contrast
  pass; brass golf-club icon sprite; ledger/tabular-brass figures; motion helpers in
  animate.js (window-expose per CORE tree-shake trap); data-truthfulness empty states.
- Then re-run the critique workflow to confirm scores cleared the bar.

## Verify pattern
`node .claude/state/_cap-allpages.mjs <routes>` → Read PNG in `.claude/state/allpages/`.
Ship cycle: perl bump 4 files → npm run build → commit → merge -X ours origin/main →
push → seed-deploy-staging-hosting.mjs → regen-all.sh → push-staging.ps1 (pwsh).
